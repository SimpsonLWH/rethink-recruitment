"""Optional Modal batch: advisory fit briefs over the full synthetic dataset.

This is deliberately a real batch job, not a thin wrapper around app logic:
it consumes the exported dataset, computes every candidate × role brief, and
writes a validated JSON artifact that is imported back through the TypeScript
repository. It is not deployed in this build because no Modal tokens are present.

Deployment and run commands are in modal/README.md. Do not sign up, spend, or
deploy without the repo owner's explicit approval.
"""

from __future__ import annotations

import json
from pathlib import Path

import modal

from fit_logic import build_summaries, validate_output

app = modal.App("rivet-fit-batch")

image = modal.Image.debian_slim().add_local_python_source("fit_logic")


@app.function(cpu=1.0, memory=1024, timeout=600)
def compute_fit_summaries(dataset: dict) -> dict:
    return build_summaries(dataset)


@app.local_entrypoint()
def main(
    input_json: str = "modal/data/dataset.json",
    output_json: str = "modal/data/fit-summaries.json",
) -> None:
    input_path = Path(input_json)
    if not input_path.exists():
        raise SystemExit(
            "Missing " + str(input_path) + ". Run npm run fit:export first."
        )
    dataset = json.loads(input_path.read_text(encoding="utf-8"))
    result = compute_fit_summaries.remote(dataset)
    validate_output(result)
    output_path = Path(output_json)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print("Wrote " + str(output_path) + " with " + str(len(result["summaries"])) + " summaries.")
