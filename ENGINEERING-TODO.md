# Portfolio Engineering Follow-ups

This file tracks information and backend work that cannot be completed accurately from this static repository alone.

## Owner input

- `{{CITY}}`: Confirm the city/state before adding a location claim. The homepage currently says the city/state was not provided.
- `{{GOOGLE_SEARCH_CONSOLE_TOKEN}}`: Replace the commented head placeholder only with a token issued by the owner's Search Console account.
- CV PDF: Add the real file at `assets/Satwinder-Singh-Flutter-Developer-CV.pdf`. The download link is wired to that path, but the file is missing from this checkout.
- Other public projects: Export only published, owner-approved project data from the live CMS. For each project, confirm its public name, description, stack, role, images, links, and any measurable outcome before adding a static case-study page.
- Metrics: Supply source reports for the claims listed below if they should remain presented as measured results.

## Claims awaiting evidence

| Claim | Current location | Evidence in this repository | Owner action |
|---|---|---|---|
| 10+ production apps | `index.html` hero stats; `ai-assistant.js` | No app inventory or release records checked in | Confirm the count and provide a non-confidential source |
| 99.9% crash-free | `index.html` hero stats; `ai-assistant.js` | No Crashlytics export or period/app scope checked in | Confirm scope and reporting period or remove the metric |
| 40% performance improvement | `index.html` hero stats | No before/after benchmark checked in | Confirm the project, baseline, and measurement method |
| 5+ industry domains | `index.html` hero stats; admin profile presets | No domain inventory or definition checked in | Confirm the domains represented by this count or remove it |
| 60+ FPS / 120 FPS rendering | Previously shown in homepage/admin copy and assistant copy; live CMS stat values are displayed generically by the public site | Conflicting numbers; no benchmark checked in. Numeric UI claims were removed from static public copy, assistant answers, and default admin presets | Confirm one precise, device-specific benchmark before restoring a number |
| 100K+ monthly active users; 18% to under 1.2% frame jank; sub-50ms updates; sub-15-minute triage | Previously shown in assistant content | No supporting reports checked in; removed from assistant responses | Do not republish without project owner approval and evidence |
| 60–120 FPS project-generation copy | Pre-existing uncommitted edits in `admin/js/modules/projects.js` | The current local user diff contains generated sample descriptions and claims with these rates | Review the existing local edits and replace the sample claims before publishing or using generated project content. This file was left untouched in order to preserve the user's uncommitted work. |

## Backend security work required

- No Firestore security-rules file is included in this repository. The public feedback form now creates submissions with `status: in_review` and `visibleOnWeb: false`; the public board requests only visible `reviewed`/`resolved` records. Verify the live rules permit only that pending create shape and reserve status/visibility approval for trusted Firebase Auth identities with an owner/admin claim.
- `firestore.indexes.json` defines the composite index required by the public feedback query. It was deployed to `satwinder-portfolio` and both the new and existing feedback indexes were confirmed `READY` on 2026-10-28.
- Browser-side throttling and the feedback honeypot are best-effort friction only. Enforce abuse limits server-side (for example, through Firebase App Check and a trusted function/rule design) before describing submissions as rate-limited.
- `admin/js/config.js` contains a hardcoded SHA-256 hash for the default four-digit admin PIN, and `admin/js/auth.js` restores a UI session from browser storage. A client-side hash/session cannot authorize access to private data. Use Firebase Auth plus server-enforced admin claims and audit Firestore rules before treating the admin interface as protected. No credential was changed as part of this task.
- `firebase.config.js`, `admin/js/supabase.js`, and the EmailJS settings in `portfolio.js` contain browser-facing Firebase, Supabase anonymous, and EmailJS public configuration. These are not privileged credentials by themselves; confirm provider-side API restrictions, storage policies, and database rules. No private-key PEM or service-account JSON was found in the repository scan.

## Repository constraints

- This is a static GitHub Pages repository with a small Tailwind CSS build step for the homepage; there is no app framework, test command, CI workflow, or Firestore security-rules file. Composite Firestore indexes are checked in and deployed. Project, experience, roadmap, and feedback CMS data is not checked in, so static fallbacks use only facts found in the repository.
- The `Vibe/` directory is an existing deployed app build branded DropLink. Other live CMS projects are not included here; one accurate project overview is available from checked-in files and assets.
