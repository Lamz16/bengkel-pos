import csv, tempfile, unittest
from pathlib import Path
from manual_guide_generator.discovery import parse_navigation, parse_prisma_models
from manual_guide_generator.generator import generate
from manual_guide_generator.verify import verify

class ParserTests(unittest.TestCase):
    def test_navigation_parser_reads_roles(self):
        source="{ id: 'pos', label: 'Transaksi', icon: X, roles: ['Owner', 'Kasir'] }"
        self.assertEqual(parse_navigation(source), [('pos','Transaksi','Owner, Kasir')])
    def test_prisma_models(self): self.assertEqual(parse_prisma_models('model User {\n}\nmodel SparePart {\n}'), ['User','SparePart'])

class CoverageTests(unittest.TestCase):
    def test_generate_and_verify_feature_tag(self):
        with tempfile.TemporaryDirectory() as directory:
            output=Path(directory); fields=['feature_id','module','feature_name','roles','entry_point','prerequisites','business_impact','source_evidence','documented']
            with (output/'feature-coverage-matrix.csv').open('w',newline='',encoding='utf-8') as fh:
                writer=csv.DictWriter(fh,fieldnames=fields); writer.writeheader(); writer.writerow(dict(zip(fields,['TEST-01','Test','Fitur','Owner','Menu','-','Dampak','src/Test.ts','no'])))
            generate(output); ok,_=verify(output)
            self.assertTrue(ok); self.assertIn('[TEST-01]', (output/'manual-guide-draft.md').read_text(encoding='utf-8'))

if __name__ == '__main__': unittest.main()
