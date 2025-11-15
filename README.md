# Registration Form + Dashboard

Files included:
- `public/index.html` — registration form
- `public/dashboard.html` — admin dashboard to view entries
- `public/style.css` — shared styling
- `public/script.js` — frontend logic for form
- `api/submit.js` — Vercel serverless function to append data to `data/data.json` and add entry into monthly VCF file `vcf/YYYY_MM.vcf` inside the repo using GitHub API
- `api/list.js` — returns the current `data/data.json` contents as JSON (for dashboard)

## Setup (Vercel)
1. Create a GitHub repo and push these files (public/ + api/ folders). Make sure the repo has a `data/` folder with an initial `data.json` containing `[]` or let the API create it.

2. In Vercel project environment variables, set:
   - `GITHUB_TOKEN` — a personal access token with `repo` scope (or `public_repo` if repo is public).
   - `GITHUB_OWNER` — GitHub owner (username or org).
   - `GITHUB_REPO` — repo name.
   - `GITHUB_BRANCH` — branch to commit to (default: `main`).

3. Deploy to Vercel. The frontend will POST to `/api/submit` and dashboard will request `/api/list`.

## Notes
- The serverless functions commit changed files to your GitHub repo using the contents API. This keeps `data/data.json` and `vcf/YYYY_MM.vcf` in the repo.
- VCF format used is minimal: name and phone stored as a simple vCard entry per submission. All submissions for the month are appended to the monthly `vcf/YYYY_MM.vcf` file.
