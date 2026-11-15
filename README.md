# Rivet — hire the work, not the wording

An interviewer-first pre-screening tool built for **Junction 2026 · City of Espoo "Rethinking Recruitment"**. Candidates use AI to write CVs. Employers use AI to scan them. Rivet removes that loop: a role's stated bar becomes a screening plan, a versioned work sample and a checkable claim record take the place of CV prose, and the interviewer gets a conversation kit and an auditable decision.

The Next.js app lives in [`recruitment-app/`](recruitment-app/). Everything in the demo is synthetic: there are no real people, employers, assessments, artifacts, messages or contact details. The coding problems are illustrative, not validated, and candidates get one attempt per assessment per recruiting cycle. Nothing here is a claim of legal compliance or production readiness.

## Quick start

Requires **Node 20.9+** and npm. No API keys, database server or Docker are needed.

```bash
cd recruitment-app
npm install
npm run seed
npm run dev
```

Open <http://localhost:3000/enter>.

| Sample account | Email | Password |
| --- | --- | --- |
| Interviewer · Northwind Labs | `mikko@northwind.demo` | `demo-recruiter` |
| Interviewer · Kallio Capital (quant) | `lea@kallio.demo` | `demo-quant` |
| Interviewer · Northwind second reviewer | `tuuli@northwind.demo` | `demo-panel` |
| Candidate · Aino Vikström | `aino@demo.rivet` | `demo-candidate` |

## The pre-screen in one loop

1. **Set the bar.** A live role card states one to three exact assessment requirements and the signals that matter. That becomes a screening plan with must-haves, nice-to-haves and one conversation criterion.
2. **Check the record.** The interviewer sees the work-sample score against the bar, claims with their artifacts and link status, and any employer confirmation. A claim is *checked*, *artifact only*, *for conversation*, *still prose* or *context*. No AI detector, no keyword scan.
3. **Leave with a kit and a decision.** The conversation kit is built from the open criteria and unchecked claims. The interviewer rates the criteria, writes a reason, confirms the decision, and the audit trail keeps who, when and why.

No person score. No ranking. No automatic rejection. A below-bar score stays visible as context.

## Documentation

- [App README](recruitment-app/README.md)
- [Product brief](PRODUCT.md)
- [Design system](DESIGN.md)
- [How Rivet works](/how-it-works)
- [Product pitch](recruitment-app/PITCH.md)
- [Decision log](recruitment-app/DECISIONS.md)
- [Submission notes](recruitment-app/SUBMISSION-NOTES.md)
- [AI audit](recruitment-app/AI-AUDIT.md)
- [Screenshots](recruitment-app/screenshots/)

## Deploying to Vercel

This repository contains one Node/Next.js app and no Python runtime, Python dependencies or Python build step.

When importing the repository into Vercel, set the project **Root Directory** to `recruitment-app` and keep the framework preset as **Next.js**. The NVIDIA and Gemini environment variables remain optional for the separate advisory evidence reading on the employer review card. The pre-screen plan, claim checks, conversation kit and decision are deterministic and need no key.

The current SQLite database is a local demo store. Vercel's serverless filesystem is ephemeral, so a hosted deployment needs a persistent database before relying on write flows; the local SQLite file is not a production deployment target.
