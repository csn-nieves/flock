# Flock engineering notes

These documents explain how Flock is being built and why its architecture looks
the way it does. They are written for future maintainers, collaborators, and
anyone who wants to follow the project from its beginning.

## Where to look

- [Current state](./CURRENT_STATE.md) is the concise handoff for starting a new
  development task and identifies the next smallest branches.
- [System design](./SYSTEM_DESIGN.md) describes how the application works now.
- [Decision log](./DECISION_LOG.md) records durable choices, alternatives, and
  the conditions that would justify changing them.
- [Build journal](./BUILD_JOURNAL.md) tells the chronological story, including
  problems encountered and what we learned while solving them.
- [Workflow validation plan](./WORKFLOW_VALIDATION.md) defines the moderated
  organizer and runner study that gates the next product milestone.
- [Product foundation](../PRODUCT.md) defines the problem, users, scope, and
  product principles.
- [Technical foundation](../TECHNICAL.md) defines the accepted implementation
  architecture.
- [Design system](../DESIGN.md) defines Flock's visual language and runtime
  token ownership.
- [Repository instructions](../AGENTS.md) define how Codex should work within
  the project.

## How the records differ

The system design is the best starting point when someone asks, “How does Flock
work?” It should describe the current implementation rather than every path the
project took to get there.

The decision log answers, “Why did we choose this?” A decision remains in the
log even if it is later replaced. When that happens, mark the original decision
as superseded and link to the replacement.

The build journal answers, “What happened while we built it?” Journal entries
may describe temporary failures, rejected approaches, and unresolved concerns.
They are historical evidence, not necessarily current instructions.

The current-state handoff answers, “Where did we stop, and what is the next
smallest honest change?” It stays concise and points to the other records rather
than duplicating their full rationale.

## Keeping this documentation current

Update these records in the same small branch as a change when that change:

- selects or replaces a framework, service, or architectural pattern;
- introduces a rule that future features must follow;
- resolves a difficult implementation or CI problem;
- reveals a limitation that later work must revisit; or
- materially changes the way the system should be explained.

Update `CURRENT_STATE.md` whenever a branch changes the active milestone,
completed foundation, known follow-ups, or next recommended branch.

For ordinary feature work, add a short build-journal entry. Add or amend a
decision only when the reasoning will affect future work. Update the system
design whenever the current architecture changes.

Each journal entry should answer four questions:

1. What did we build or change?
2. Why did we choose this approach?
3. What was difficult or surprising?
4. What remains intentionally deferred?

Keep entries factual. Link to the relevant pull request, commit, test, or source
file when it makes the reasoning easier to verify.
