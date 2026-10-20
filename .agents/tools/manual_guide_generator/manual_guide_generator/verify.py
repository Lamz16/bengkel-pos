from __future__ import annotations
from pathlib import Path
from .generator import load_rows
from .discovery import read_sources, parse_navigation, parse_prisma_models, parse_routes

def verify(output: Path) -> tuple[bool, str]:
    rows=load_rows(output); draft=(output / "manual-guide-draft.md")
    text=draft.read_text(encoding="utf-8") if draft.exists() else ""
    failures=[]; warnings=[]
    for row in rows:
        tagged=f"[{row['feature_id']}]" in text
        if row["source_evidence"] == "TIDAK DITEMUKAN": failures.append(f"{row['feature_id']}: bukti source tidak ditemukan")
        if row["documented"] != "yes" or not tagged: failures.append(f"{row['feature_id']}: belum memiliki panduan/tag pada draft")
    # Check source-derived menus, server routes, and persisted models against the
    # evidence map. Raw infrastructure endpoints are reported as review items, not
    # automatically treated as user-facing business features.
    root = output.parents[3] if len(output.parents) > 3 else output
    try:
        sources = read_sources(root)
    except Exception:
        sources = {}
    evidence_blob = "\n".join(row["source_evidence"] for row in rows)
    menus = parse_navigation(sources.get("src/AppLayout.tsx", ""))
    unmapped_menus = [label for _, label, _ in menus if not any(label.lower() in row["entry_point"].lower() for row in rows)]
    route_files = sorted({route.rsplit("(", 1)[-1].rstrip(")") for route in parse_routes(sources)})
    unmapped_routes = [path for path in route_files if path not in evidence_blob]
    models = parse_prisma_models(sources.get("prisma/schema.prisma", ""))
    important_models = [m for m in models if m in {"User","Customer","Vehicle","SparePart","WorkshopService","ServiceQueue","DistributorInvoice","Expense","Mechanic","ActivityLog"}]
    undocumented_models = [m for m in important_models if m not in evidence_blob]
    for token in ("model ", "router.", "TODO", "FIXME"):
        if token in text: warnings.append(f"Pemeriksaan teks: {token}")
    report=["# Laporan Verifikasi Manual Guide", "", f"- Fitur dalam matrix: {len(rows)}", f"- Draft ditemukan: {'ya' if draft.exists() else 'tidak'}", f"- Hasil: {'GAGAL' if failures else 'LULUS'}", "", "## Kekurangan penting"]
    report += [f"- {x}" for x in failures] or ["- Tidak ada."]
    report += ["", "## Pemetaan menu, route, dan model", "### Menu UI belum dipetakan ke entry point", *([f"- {x}" for x in unmapped_menus] or ["- Tidak ada."]), "", "### File route yang belum dikaitkan ke feature evidence", *([f"- {x}" for x in unmapped_routes] or ["- Tidak ada."]), "", "### Model bisnis utama tanpa evidence", *([f"- {x}" for x in undocumented_models] or ["- Tidak ada."]), "", "## Catatan", *([f"- {x}" for x in warnings] or ["- Semua feature ID matrix terdeteksi pada draft."])]
    (output / "verification-report.md").write_text("\n".join(report)+"\n", encoding="utf-8")
    return not failures, "verification-report.md"
