# Rivet — evidence first, then decide

A two-sided recruitment-event prototype built for **Junction 2026 · City of Espoo “Rethinking Recruitment”**. Rivet puts evidence before the swipe: candidates show capability through short, role-relevant assessments and structured experience, while employers describe their need as role cards with an explicit assessment bar.

The Next.js app lives in [`recruitment-app/`](recruitment-app/). Everything in the demo is synthetic: there are no real people, employers, assessments, evidence, messages or contact details. The assessment questions are illustrative, not validated, and nothing here is a claim of legal compliance or production readiness.

## Quick start

Requires **Node 20.9+** and npm. No API keys, database server or Docker are needed.

```bash
cd recruitment-app
npm install
npm run seed
npm run dev
```

Open <http://localhost:3000>.

## Documentation

- [App README](recruitment-app/README.md)
- [Product pitch](recruitment-app/PITCH.md)
- [Decision log](recruitment-app/DECISIONS.md)
- [Submission notes](recruitment-app/SUBMISSION-NOTES.md)
- [AI audit](recruitment-app/AI-AUDIT.md)
- [Screenshots](recruitment-app/screenshots/)

## Deploying to Vercel

This repository contains one Node/Next.js app and no Python runtime, Python dependencies or Python build step.

When importing the repository into Vercel, set the project **Root Directory** to `recruitment-app` and keep the framework preset as **Next.js**. The NVIDIA and Gemini environment variables remain optional.

The current SQLite database is a local demo store. Vercel's serverless filesystem is ephemeral, so a hosted deployment needs a persistent database before relying on write flows; the local SQLite file is not a production deployment target.
