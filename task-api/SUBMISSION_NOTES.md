# Submission Notes

## What I would test next

- Validation of every invalid enum/date combination through the API.
- Boundary cases for pagination such as page 0, negative values, very large limits and non-numeric values.
- Concurrent requests to verify behavior under simultaneous writes.
- API behavior when the in-memory store contains a larger dataset.
- Browser-level tests for the UI using Playwright or a similar tool.

## What surprised me

The service layer contained behavior that was not obvious from the API description: pagination skipped the first page, status filtering used partial matching, and completing a task changed its priority. These were useful examples of why behavior-focused tests are valuable even in a small codebase.

## Questions before production

- Should tasks and assignments survive a server restart?
- Is an assignee a free-text name or should it reference a user/account ID?
- What are the required authorization rules for creating, updating, assigning and deleting tasks?
- What pagination limits should be enforced?
- Should completed tasks retain their due dates and priorities?
- What is the expected API contract for invalid dates and malformed query parameters?

## Feature design

`PATCH /tasks/:id/assign` validates that `assignee` is a non-empty string, trims surrounding whitespace, stores it as `assignee`, returns the updated task, and returns 404 for an unknown task. Reassignment is allowed because the brief asks the endpoint to store an assignee and does not prohibit changing the current owner.
