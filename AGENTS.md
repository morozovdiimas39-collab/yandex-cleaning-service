# Project Rules

## Main Rules
- This project is production-sensitive. Do not delete projects, tasks, schedules, database rows, or cloud resources without an explicit user command.
- Do not deploy the frontend unless the user explicitly asks for frontend deployment.
- Backend cloud functions may be created as separate functions when the responsibility is separate. Do not force unrelated logic into one function.
- Never revert user changes or unrelated dirty files. Keep edits scoped to the requested area.
- Prefer reading current code and cloud function state before changing behavior.

## RSYA Architecture
- `backend/rsya-projects`: user projects, task CRUD, task safety validation, goals and project settings.
- `backend/rsya-preview`: dry-run preview before task creation. It must not write to Yandex Direct or block placements.
- `backend/rsya-scheduler`: creates campaign batches from schedules.
- `backend/rsya-batch-worker`: Direct reports, filtering, `ExcludedSites` updates, execution logs.
- `backend/admin`: admin aggregates, monitoring, project/task/execution details.
- `src/pages/RSYAProject.tsx`: user task creation and preview flow.
- `src/pages/RSYACleaningDashboard.tsx`: admin RSYA monitoring.

## RSYA Data Rules
- Use `rsya_campaign_batches` for queue/batch monitoring.
- Use `rsya_cleaning_execution_logs` for execution history.
- Use `rsya_blocking_logs` for blocked, matched-not-blocked, kept examples, and important platform markers.
- Do not use the old `block_queue` table for new RSYA monitoring.
- Always check whether a placement is already blocked through Direct `Campaign.ExcludedSites` before blocking.
- Selected Metrica goals are stored in task config as `goal_ids`; keep backward compatibility with `goal_id`.

## Safety Rules
- Dangerous rules like only `min_impressions <= 10` without goals, domain conditions, exceptions, or conversion protection must be rejected.
- Preview must show examples of:
  - placements that will be blocked;
  - placements that are already blocked;
  - placements that will remain;
  - important placements that match a block rule.
- Important placements must be highlighted in admin and preview UI.
- Never change Direct `Client-Login` behavior without checking official Direct API docs and current project auth flow.

## Required Checks
- For Python cloud functions changed: `python3 -m py_compile backend/<function>/index.py`.
- For frontend changes: `npm run build`.
- After backend deploys, verify affected HTTP functions with `curl`.
- After `rsya-batch-worker` deploys, verify the latest version still has the correct `YANDEX_MQ_SECRET_KEY`.

## Deploy Notes
- Existing frontend URLs come from `backend/func2url.json` through `src/config/backend-urls.ts`.
- If a new cloud function is created, add its URL to `backend/func2url.json`.
- Admin authentication is handled by `backend/admin-auth` and the `admin_users` / `admin_sessions` tables.
- Never put admin passwords, session tokens, or static admin keys in frontend code.
- Admin API calls must use the short-lived Bearer session through `src/lib/admin-auth.ts`.

## Admin UX Priority
- The RSYA admin dashboard is a priority surface.
- It must clearly show all project names and task names.
- It must make the current state obvious: configured/not configured, active tasks, next run, last run, last batch, errors, and examples of placements.
- Keep the admin UI dense, readable, and operational. Avoid landing-page or decorative layouts.
