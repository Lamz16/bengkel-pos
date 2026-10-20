# Manual Guide Generator

Tool internal berbasis standard library untuk membangun bahan Manual Book BengkelPro POS dari source code aktual. Tool ini hanya membaca `.env.example`; file `.env` selalu dikecualikan.

Jalankan dari root repository:

```powershell
$env:PYTHONPATH = '.agents/tools/manual_guide_generator'
python -m manual_guide_generator discover
python -m manual_guide_generator generate
python -m manual_guide_generator export-docx
python -m manual_guide_generator verify
```

Artefak berada pada `output/`. Jalankan `discover` sebelum `generate`; `export-docx` menghasilkan `Panduan Penggunaan BengkelPro POS.docx` yang dapat diedit di Microsoft Word. `verify` mengembalikan exit code `1` bila fitur penting belum ditemukan atau tag feature ID belum muncul di draft.

Untuk ekspor Word, instal dependensi sekali: `python -m pip install -r .agents/tools/manual_guide_generator/requirements.txt`. Pengujian: `python -m unittest discover -s .agents/tools/manual_guide_generator/tests -v`.
