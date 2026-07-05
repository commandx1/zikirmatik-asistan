## Orchestration philosophy

Default to the coding model assigned to the current session, doing the work directly. For most day-to-day engineering tasks, the session's default coding model is sufficient. Escalate only when the reasoning complexity clearly exceeds its strengths.

Do not treat orchestration as mandatory per task. Escalation is the exception, not the front door.

## Default route: default model, direct

The default model handles, without asking permission or explaining routing:

- boilerplate, CRUD, small features
- tests
- formatting and lint fixes
- small-to-medium refactors with clear acceptance criteria
- well-specified implementation tasks
- routine documentation
- straightforward bug fixes with an obvious cause

For these, just do the work. No plan-and-confirm step, no "Route:/Reason:" preamble, no delegation brief. Overhead here costs more than the task itself.

## Escalation triggers (when to bring in a stronger model)

Escalate to a deep-reasoner / top-tier model ONLY when at least one of these is true:

- an architecture or system-design decision with real long-term cost if wrong
- a bug that has survived one direct diagnosis attempt, or spans multiple files/subsystems with a non-obvious cause
- an algorithmic or performance trade-off where correctness/edge cases are hard to reason about
- a refactor that touches shared/critical code and is hard to reverse
- security-sensitive authentication or authorization changes
- database schema or migration decisions that are difficult to roll back
- public API contract changes
- concurrency, race-condition, or distributed-system issues
- multiple plausible implementations exist and the trade-offs cannot be resolved confidently from the available context

Before escalating for the last reason, first try to resolve it by gathering more context (read more of the codebase, check existing conventions, ask the user a clarifying question) — prefer solving with better context over escalating to a stronger model. Escalating doesn't help if the real gap is missing information, not reasoning power.

When escalating, state in one line why (which trigger above applies), then hand off. Don't pre-emptively escalate "just in case" — if unsure whether it qualifies, attempt it directly first and escalate only if you hit a wall.

## Respect existing architecture and scope

- Do not introduce new abstractions, patterns, or frameworks unless the task explicitly requires them or they are necessary to satisfy the acceptance criteria.
- Follow existing naming, file organization, error-handling, and architectural conventions unless the task explicitly requires changing them.
- Fix root causes when they are clearly identifiable and within the requested scope.
- Avoid masking bugs with defensive code unless explicitly requested.
- Existing public behavior remains unchanged unless the task explicitly requires a behavior change.
- No unnecessary refactoring. If the task doesn't require touching something, don't touch it, even if you think it could be "better."
- If you notice unrelated issues while working, mention them separately in your summary instead of fixing them, unless they block the requested task.

## Delegation route (Sonnet worker)

Use a Sonnet worker (`general-purpose` subagent, `model: "sonnet"`) for:

- well-specified implementation tasks that are large/mechanical enough to benefit from an isolated brief
- codebase investigation
- terminal/build/lint/test verification
- independent review of your own output before accepting it, on anything escalation-worthy

Delegation brief format (only needed when actually delegating, not for direct work):

Task:
[One clear task sentence.]

Files / area:
[Relevant files, folders, components, or system area.]

Constraints:

- Do not touch unrelated files.
- Do not add new dependencies unless explicitly approved.
- Preserve existing behavior outside the requested scope.
- Keep the change as small as safely possible.

Acceptance criteria:

- The requested change is implemented.
- The change is limited to the specified area.
- Existing behavior is preserved.
- No new lint, type, build, or test failures are introduced.
- No unnecessary refactoring outside what's needed to complete the task.

Verification command:
[Insert the relevant command, for example npm test, npm run lint, npm run build, pnpm test, or pnpm lint.]

If verification fails, stop and report the failure. Do not silently work around failing tests, disable them, or dismiss a failure as "unrelated" without explicit confirmation.

Expected Sonnet worker output:

- Summary of changes
- Files changed
- Verification result
- Risks or follow-up notes

After the Sonnet worker returns, review the implementation for correctness, scope, architectural consistency, and verification results before accepting: decide accept, revise, or escalate. Don't accept the output blind.

## Cost guardrails

- Don't spend tokens writing a plan/brief for something you could just implement in a few lines.
- Effort dial (if using Sonnet with adjustable effort): default low/medium. Only bump to high/xhigh for genuinely hard tasks — pushing effort that high can cost as much as just escalating to a stronger model, so if a task needs xhigh, that's itself a signal to consider escalating instead.
- One escalation, not a chain. If a stronger model's answer isn't good enough, that's a signal the task needs a human decision, not a further escalation.

## Handling ambiguity

- When uncertain about requirements, ask a clarifying question instead of making irreversible assumptions.
- If multiple interpretations are equally reasonable and no clarification is possible, choose the option that minimizes scope and is easiest to reverse, and state the assumption briefly.

## After execution (only for escalated / non-trivial tasks)

- summarize what changed
- list files changed
- include verification results
- identify remaining risks
- recommendation: accept, revise, or escalate further

Skip this ceremony for routine direct work — a normal summary of what you did is enough.

## General engineering principles

- Prefer modifying existing code over rewriting working code.
- Prefer existing project conventions over personal preference.
- Optimize first for correctness, then simplicity, then elegance.