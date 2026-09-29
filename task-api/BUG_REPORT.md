# Bug Report

## Bug 1 — Pagination skipped the first page

**Location:** `src/services/taskService.js` → `getPaginated(page, limit)`

**Expected:** `GET /tasks?page=1&limit=10` should return the first 10 tasks.

**Actual:** The original implementation calculated `offset` as `page * limit`. Page 1 therefore started at index 10 and skipped the first page.

**How it was discovered:** A service-level pagination test created three tasks and requested page 1 with a limit of 2. The original calculation returned only the third task.

**Fix:** Changed the offset to `(page - 1) * limit`.

---

## Bug 2 — Status filtering used partial matching

**Location:** `src/services/taskService.js` → `getByStatus(status)`

**Expected:** A status filter should return tasks whose status exactly matches the requested status.

**Actual:** The original implementation used `task.status.includes(status)`. That can return unintended matches when a caller supplies a partial status value.

**How it was discovered:** While writing route tests, the filter behavior was reviewed against the documented enum values.

**Fix:** Changed the comparison to `task.status === status`.

---

## Bug 3 — Completing a task unexpectedly changed its priority

**Location:** `src/services/taskService.js` → `completeTask(id)`

**Expected:** Completing a task should change its completion state and timestamp while preserving unrelated task properties.

**Actual:** The original implementation always changed `priority` to `medium`.

**How it was discovered:** A service test completed a high-priority task and asserted that its priority remained high.

**Fix:** Removed the unrelated priority mutation.

---

## Notes

The API uses an in-memory store, so data is intentionally reset when the server restarts. That is suitable for the assignment but would need a persistent data store before production use.
