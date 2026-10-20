import argparse
from pathlib import Path
from .discovery import repo_root, write_discovery
from .generator import generate
from .verify import verify
from .docx_export import export_docx

def main(argv=None):
    parser=argparse.ArgumentParser(prog="manual_guide_generator")
    parser.add_argument("command", choices=("discover","generate","export-docx","verify")); parser.add_argument("--root", type=Path, default=None)
    args=parser.parse_args(argv); root=repo_root(args.root); output=root / ".agents/tools/manual_guide_generator/output"
    try:
        if args.command == "discover": write_discovery(root, output); print(f"Discovery selesai: {output}")
        elif args.command == "generate": generate(output); print(f"Draft selesai: {output}")
        elif args.command == "export-docx": print(f"DOCX selesai: {export_docx(output)}")
        else:
            ok, report=verify(output); print(f"Verifikasi {'lulus' if ok else 'gagal'}: {output / report}"); return 0 if ok else 1
    except FileNotFoundError as exc: print(f"ERROR: {exc}"); return 2
    return 0
