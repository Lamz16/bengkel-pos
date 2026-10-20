"""Static, evidence-first source discovery. It deliberately never opens .env."""
from __future__ import annotations
import csv, re
from pathlib import Path
from .catalog import FEATURES

ROOT_FILES = ("src/AppLayout.tsx", "src/App.tsx", "src/services/api.ts", "src/types.ts", "prisma/schema.prisma", "README.md", ".env.example")
TREE_DIRS = ("src/components", "src/server/routes", "src/server/controllers", "src/server/services", "src/server/repositories", "prisma/migrations")

def repo_root(start: Path | None = None) -> Path:
    here = (start or Path.cwd()).resolve()
    for candidate in (here, *here.parents):
        if (candidate / "src").is_dir() and (candidate / "prisma/schema.prisma").is_file(): return candidate
    raise FileNotFoundError("Root BengkelPro tidak ditemukan (src/ dan prisma/schema.prisma diperlukan).")

def source_files(root: Path) -> list[Path]:
    files = [root / item for item in ROOT_FILES if (root / item).is_file()]
    for directory in TREE_DIRS:
        folder = root / directory
        if folder.exists(): files.extend(p for p in folder.rglob("*") if p.is_file() and p.suffix in {".ts", ".tsx", ".sql"})
    return sorted(set(files))

def read_sources(root: Path) -> dict[str, str]:
    return {p.relative_to(root).as_posix(): p.read_text(encoding="utf-8", errors="replace") for p in source_files(root)}

def evidence_for(feature, sources: dict[str, str]) -> str:
    hits = []
    for term in feature.evidence_terms:
        matched = [path for path, body in sources.items() if re.search(re.escape(term), body, re.I) or re.search(re.escape(term), path, re.I)]
        # Keep a broad evidence trail so verification can trace UI through route,
        # controller/service/repository instead of hiding latter layers.
        if matched: hits.append(f"{term}: " + ", ".join(matched))
    return " | ".join(hits) or "TIDAK DITEMUKAN"

def parse_navigation(text: str) -> list[tuple[str, str, str]]:
    pattern = re.compile(r"\{\s*id:\s*'([^']+)'\s*,\s*label:\s*'([^']+)'[^}]*?roles:\s*\[([^]]+)\]", re.S)
    return [(a, b, ", ".join(re.findall(r"'([^']+)'", c))) for a,b,c in pattern.findall(text)]

def parse_routes(sources: dict[str, str]) -> list[str]:
    out=[]
    for path, body in sources.items():
        if "/routes/" not in path: continue
        for method, endpoint in re.findall(r"\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)", body, re.I): out.append(f"{method.upper()} {endpoint} ({path})")
    return sorted(set(out))

def parse_prisma_models(schema: str) -> list[str]: return re.findall(r"^model\s+(\w+)", schema, re.M)

def write_discovery(root: Path, output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True); sources=read_sources(root)
    rows=[]
    for feature in FEATURES:
        evidence=evidence_for(feature, sources); rows.append(feature.csv_row(evidence, "no"))
    with (output / "feature-coverage-matrix.csv").open("w", newline="", encoding="utf-8") as fh:
        writer=csv.DictWriter(fh, fieldnames=["feature_id","module","feature_name","roles","entry_point","prerequisites","business_impact","source_evidence","documented"]); writer.writeheader(); writer.writerows(rows)
    nav=parse_navigation(sources.get("src/AppLayout.tsx", "")); routes=parse_routes(sources); models=parse_prisma_models(sources.get("prisma/schema.prisma", ""))
    catalog=["# Katalog Alur Bisnis BengkelPro POS", "", "Dokumen ini dibuat dari pembacaan statis UI, API, route, controller/service/repository, type, Prisma schema/migrasi, README, dan `.env.example`. File `.env` tidak dibaca.", "", "## Peta menu dan akses UI"]
    catalog += [f"- `{ident}` — **{label}**: {roles}" for ident,label,roles in nav] or ["- Tidak dapat mengekstrak konfigurasi navigasi."]
    catalog += ["", "## Katalog fitur berbukti"]
    for row in rows: catalog += [f"### {row['feature_id']} — {row['feature_name']}", f"- Modul/akses: {row['module']} / {row['roles']}", f"- Titik masuk: {row['entry_point']}; prasyarat: {row['prerequisites']}", f"- Input: data dari formulir atau route terkait; output/dampak: {row['business_impact']}.", f"- Bukti source: {row['source_evidence']}", ""]
    catalog += ["## Kontrak server yang ditemukan", *[f"- `{x}`" for x in routes], "", "## Model Prisma yang ditemukan", ", ".join(f"`{x}`" for x in models)]
    (output / "business-flow-catalog.md").write_text("\n".join(catalog)+"\n", encoding="utf-8")
    (output / "business-flow-diagram.mmd").write_text("""flowchart LR
  MD[Master data: pelanggan, kendaraan, produk, pemasok] --> ST[Stok dan lokasi gudang]
  ST --> TX[POS: jasa dan sparepart]
  C[Pelanggan] --> LOY[Loyalitas dan diskon] --> TX
  Q[Antrean servis] --> TX
  TX --> PAY[Pembayaran: lunas atau piutang] --> RCPT[Struk thermal] --> RPT[Laporan]
  SUP[Pemasok] --> TEMPO[Nota tempo] --> DP[Pembayaran cicilan] --> RPT
  TX --> WAR[Garansi] --> CLAIM[Klaim] --> DED[Potongan mekanik]
  TX --> COMM[Komisi dan rekap gaji mekanik]
""", encoding="utf-8")
    unknown=["# Item yang perlu verifikasi UI/manual", "", "Discovery bersifat statis; daftar ini bukan klaim bahwa fitur tidak ada.", "", "- Urutan klik, validasi browser, teks error, dan responsivitas setiap formulir.", "- Hak akses route aktual untuk endpoint yang tidak menampilkan middleware secara lokal.", "- Hasil cetak pada driver printer thermal 58/80 mm serta browser yang dipakai.", "- Integrasi Gemini, kredensial/kuota, dan mutu rekomendasi diagnosis.", "- Efek transaksi pada PostgreSQL nyata, concurrency/idempotensi, serta data migrasi lama.", "- Status jatuh tempo otomatis berdasarkan waktu server dan zona waktu."]
    absent=[r["feature_id"] for r in rows if r["source_evidence"] == "TIDAK DITEMUKAN"]
    if absent: unknown += ["", "## Bukti statis belum cukup", "- " + ", ".join(absent)]
    (output / "unverified-items.md").write_text("\n".join(unknown)+"\n", encoding="utf-8")
