# Optional Modal batch — advisory fit briefs

This folder is **not required** for the app. It is a real, CPU-only batch job that computes neutral, explainable fit briefs over the full synthetic dataset and returns a validated JSON artifact. The app ships with a local TypeScript implementation of the same concept so the demo works with no Modal account.

## Status in this build

- Code: implemented, with local unit tests for the pure logic.
- Deployed: **no**. No `MODAL_TOKEN_ID` / `MODAL_TOKEN_SECRET` were present.
- Tested remotely: **no**.
- Spend: none. Do not sign up, buy credits, or deploy without explicit approval from the repo owner.

## What it does

1. `npm run fit:export` writes `modal/data/dataset.json` from the SQLite demo through the repository interface.
2. The Modal function loops every synthetic candidate × role pair.
3. It computes:
   - shared themes from role skills crossed with fact tags/claims,
   - a neutral digest that states how many claims have evidence links and that reachability is not truth,
   - three human questions,
   - evidence coverage count.
4. It writes `modal/data/fit-summaries.json`. No score, ranking, rejection, or new claim.
5. `npm run fit:import -- modal/data/fit-summaries.json` validates source fact IDs and writes the briefs back through the repository as `generatedBy = "modal"`.

## Commands (only with an existing, authorised Modal account)

From `recruitment-app/`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r modal/requirements.txt
npm run fit:export
# Authenticate with your existing Modal account, e.g. via MODAL_TOKEN_ID /
# MODAL_TOKEN_SECRET in the environment, or the Modal CLI you already use.
modal run modal/fit_batch.py --input-json modal/data/dataset.json --output-json modal/data/fit-summaries.json
npm run fit:import -- modal/data/fit-summaries.json
```

Optional deployment (not performed):

```bash
modal deploy modal/fit_batch.py
```

Never commit Modal tokens or the generated JSON dataset. `modal/data/*.json` is ignored, and `.env` is ignored.

## Tests without Modal

```bash
python3 -m unittest discover -s modal -p 'test_*.py'
```

The tests import only `fit_logic.py`; `fit_batch.py` is the Modal wiring and intentionally requires the `modal` package.
