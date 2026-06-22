# AGENTS.md

# Core Rules

These rules override all other instructions.

The agent must follow them for every task.

---

# Rule 1 — Plan Before Coding

Before modifying any file:

1. Inspect all relevant files.
2. Explain understanding of the task.
3. Identify files that will be modified.
4. Explain exactly what changes will be made.
5. Explain risks and dependencies.

Do not modify any file until the plan is approved.

---

# Rule 2 — Limit Scope

Modify only files directly required for the requested task.

Do not:

* refactor unrelated code
* rename files
* move files
* reorganize folders
* update unrelated logic

unless explicitly requested.

---

# Rule 3 — Work Incrementally

Implement solutions in small phases.

After each major step:

1. Explain what changed.
2. Explain why it changed.
3. Explain affected files.
4. Wait for approval.

Do not continue automatically to the next major phase.

---

# Rule 4 — Follow Existing Patterns

Before implementing:

1. Analyze project structure.
2. Analyze naming conventions.
3. Analyze folder organization.
4. Analyze code style.

Reuse existing patterns whenever possible.

Do not introduce:

* new frameworks
* new libraries
* new architectures
* new abstractions

unless explicitly approved.

---

# Rule 5 — Review Changes

After completing a task:

Provide:

* modified files list
* summary of each change
* risks introduced
* dependencies added
* manual testing checklist

Do not end a task without a review report.

---

# Rule 6 — Security First

Treat all user input as untrusted.

Before implementing:

Check for:

* XSS
* Path Traversal
* Open Redirects
* Command Injection
* Parameter Pollution
* Broken Access Control
* Broken Object Level Authorization

If a vulnerability may be introduced:

Stop and explain the risk.

Do not implement insecure code.

---

# Rule 7 — Backend Ownership Validation

For every update, edit, delete, approve, reject, ban, or role-change operation:

Verify:

* authenticated user
* user role
* ownership

Never trust frontend permissions.

Backend validation is mandatory.

---

# Rule 8 — Never Remove Existing Functionality

Unless explicitly requested:

* preserve existing APIs
* preserve existing routes
* preserve existing UI behavior
* preserve existing business logic

New functionality must not break existing functionality.

---

# Rule 9 — Ask When Uncertain

If requirements are ambiguous:

Do not guess.

Ask questions.

Wait for clarification.

---

# Rule 10 — Approval Gates

The agent must stop after:

* architecture generation
* database design
* authentication implementation
* authorization implementation
* module implementation
* testing generation

and wait for approval before proceeding.

# Rule 11 — Dependency Installation

Do not install any new dependency without approval.

Before installing any package:

1. Explain why it is needed.
2. Explain alternatives.
3. Wait for approval.

Never modify package.json automatically.