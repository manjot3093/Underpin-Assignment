# Submission Notes

## What I would test next
- More invalid query and pagination inputs.
- Boundary cases for large and negative pagination values.
- Concurrent writes.
- Browser-level UI tests.
- Behavior with a larger dataset.

## What surprised me
The small service layer contained three behavior issues: pagination skipped the first page, status filtering used partial matching, and completing a task changed its priority. Tests exposed these without requiring assumptions about the implementation.

## Questions before production
- Should tasks survive server restarts?
- Should an assignee be a user ID rather than free text?
- What authorization rules apply to each operation?
- What pagination limits should be enforced?
- Should completed tasks retain due dates and priorities?
- What is the desired contract for malformed dates and query parameters?

## Feature design
`PATCH /tasks/:id/assign` validates a non-empty string, trims whitespace, stores the assignee, returns the updated task, and returns 404 for an unknown task. Reassignment is allowed because the assignment does not prohibit changing an existing owner.
