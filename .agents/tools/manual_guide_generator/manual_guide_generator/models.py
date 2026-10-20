from dataclasses import dataclass, asdict

@dataclass(frozen=True)
class Feature:
    feature_id: str; module: str; name: str; roles: str; entry_point: str
    prerequisites: str; business_impact: str; evidence_terms: tuple[str, ...]
    important: bool = True
    def csv_row(self, evidence: str, documented: str = "no") -> dict[str, str]:
        row = asdict(self); row.pop("evidence_terms"); row.pop("important")
        row["feature_name"] = row.pop("name"); row["source_evidence"] = evidence; row["documented"] = documented
        return row
