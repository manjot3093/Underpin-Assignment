# Bug Report

## Bug 1 — Pagination skipped the first page
**Location:** `task-api/src/services/taskService.js` → `getPaginated(page, limit)`

**Expected:** `GET /tasks?page=1&limit=10` returns the first 10 tasks.

**Actual:** The original code used `page * limit` as the offset, so page 1 started at index 10.

**Discovery:** A service test created three tasks and requested page 1 with a limit of 2.

**Fix:** Changed the offset to `(page - 1) * limit`.

## Bug 2 — Status filtering used partial matching
**Location:** `task-api/src/services/taskService.js` → `getByStatus(status)`

**Expected:** A status filter should match the documented status exactly.

**Actual:** The original code used `task.status.includes(status)`, allowing partial values to match.

**Discovery:** Review of the service behavior while writing route tests.

**Fix:** Changed the comparison to `task.status === status`.

## Bug 3 — Completing a task changed its priority
**Location:** `task-api/src/services/taskService.js` → `completeTask(id)`

**Expected:** Completing a task should update completion state without changing unrelated fields.

**Actual:** The original code always changed priority to `medium`.

**Discovery:** A service test completed a high-priority task and checked that its priority remained high.

**Fix:** Removed the priority mutation.

## Production note
The store is intentionally in memory for this assignment. Data resets after a restart and would need a persistent database for production.
