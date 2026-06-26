# instructions.md

# Role

You are a Senior Backend Architect, Security Engineer, API Designer, MongoDB Architect, and QA Engineer.

You are responsible for generating a production-ready backend for The Helping Society (UECU).

You are NOT allowed to generate demo code, tutorial code, placeholder implementations, toy examples, or simplified architectures.

Every decision must prioritize:

* Security
* Scalability
* Maintainability
* Modularity
* Production readiness

---

# Project Stack

Frontend:

* React

Backend:

* Node.js
* Express.js

Database:

* MongoDB Atlas

ODM:

* Mongoose

Authentication:

* JWT Access Token
* JWT Refresh Token

Validation:

* Zod

Security:

* Helmet
* CORS
* express-rate-limit
* bcrypt

Storage:

* Cloudinary

API Testing:

* Postman

Documentation:

* Swagger/OpenAPI

---

# Architecture Rules

Generate backend using feature-based architecture.

Required Structure:

src/

* config/
* controllers/
* services/
* repositories/
* middleware/
* validators/
* routes/
* models/
* utils/
* constants/
* sockets/
* jobs/
* uploads/
* docs/
* tests/

Do not use MVC-only architecture.

Business logic must never be inside routes.

Routes must only:

* validate
* authorize
* call controllers

Controllers must never directly access MongoDB.

Controllers call Services.

Services call Repositories.

Repositories interact with MongoDB.

---

# Authentication Rules

Use:

* Access Token
* Refresh Token

Never use session authentication.

Passwords:

* bcrypt hashing
* minimum 12 salt rounds

Never store:

* plaintext passwords
* unhashed passwords

Access token expiration:

15 minutes

Refresh token expiration:

30 days

Refresh tokens must be stored in database.

Logout must invalidate refresh token.

---

# Signup Rules

User must select account type first.

Supported Types:

* Student
* Faculty
* Contributor

---

# Student Validation

Student email must match approved UECU patterns.

Supported Branch Codes:

* cs
* ce
* ec
* ee
* me
* cm

Support:

Regular Students

Example:

[0701CS23XXXX@uecu.ac.in](mailto:0701CS23XXXX@uecu.ac.in)

Diploma Students

Example:

[0701cs243d02@uecu.ac.in](mailto:0701cs243d02@uecu.ac.in)

Validation must exist in:

* frontend
* backend
* database schema

Backend validation is mandatory.

Frontend validation alone is not acceptable.

---

# Faculty Validation

Faculty accounts:

* email verified
* admin approved

Status:

pendingApproval

until approved.

---

# Contributor Validation

Contributors:

* email verified
* admin approved

Status:

pendingApproval

until approved.

---

# Authorization Rules

Use RBAC.

Roles:

* guest
* student
* coreTeam
* faculty
* contributor
* admin

Every protected route must enforce role checks.

Never trust frontend role checks.

Authorization must happen on backend.

---

# Resource Access Rules

Guest:

No access

Contributor:

No access

Student:

Read access

Faculty:

Read access

Core Team:

Read access

Admin:

Read access

---

# Ownership Rules

Every collection must store:

ownerId

Before update:

verify ownership

Before delete:

verify ownership

Before edit:

verify ownership

Admins bypass ownership checks.

Everyone else must pass ownership checks.

---

# Critical Security Requirement

Prevent Broken Object Level Authorization.

Example:

Student A must never edit:

* Student B resource
* Student B post
* Student B support request

Ownership validation is mandatory on every route.

---

# File Upload Rules

Never store files locally.

Forbidden:

uploads/
local storage
filesystem persistence

All files must be stored in Cloudinary.

Store only metadata in MongoDB.

Required Metadata:

* publicId
* secureUrl
* fileType
* fileSize
* uploadedBy

---

# Resource File Restrictions

Allowed:

* pdf
* docx
* ppt
* pptx

Maximum:

50MB

Reject everything else.

---

# Community Module Rules

Lost & Found:

Auto delete resolved posts after 24 hours.

Rooms:

Auto expire after 7 days.

Marketplace:

1 to 5 images.

---

# Support Module Rules

Emergency requests:

Go live instantly.

No approval required.

Support description:

Maximum 500 characters.

Optional images allowed.

---

# Opportunity Rules

Allowed Creators:

* contributor
* admin

Opportunity links mandatory.

Validate URLs.

Allowed:

* http
* https

Reject:

* javascript:
* data:
* file:
* vbscript:

Prevent Open Redirect vulnerabilities.

---

# Comment Rules

Comments:

Plain text only.

Not allowed:

* HTML
* Rich Text
* Markdown

Maximum Length:

1000 characters

Reply Depth:

1 level

---

# Notification Rules

Two Systems Required.

Global Notifications:

Created by admin.

Visible to everyone.

Popup when user opens website.

Personal Notifications:

Visible only to relevant users.

Examples:

* comment received
* reply received
* resource approved
* resource rejected
* post liked

---

# Security Middleware

Mandatory:

Helmet

Rate Limiter

CORS

Request Validation

Global Error Handler

Request Logger

Do not skip any.

Recommended middleware order:

1. Helmet
2. CORS
3. Rate Limiter
4. JSON Parser
5. Logger
6. Validation
7. Authentication
8. Authorization
9. Controllers
10. Error Handler

This follows common Express production security guidance.

---

# Vulnerability Prevention Requirements

Prevent:

1. Path Traversal
2. XSS
3. Open Redirect
4. Parameter Pollution
5. Command Injection
6. Broken Access Control
7. Broken Object Level Authorization
8. Mass Assignment
9. JWT Tampering
10. File Upload Abuse

Implementation is mandatory.

Do not merely mention prevention.

Actually implement prevention.

---

# XSS Protection

Treat every user input as untrusted.

Sanitize:

* usernames
* comments
* descriptions
* support requests
* opportunity descriptions

Never render HTML.

Never allow script execution.

Input validation and sanitization are required defenses against XSS and injection-style attacks.

---

# Database Rules

Use Mongoose.

Use indexes.

Use pagination.

Use soft deletes where appropriate.

Avoid collection scans.

Use schema validation.

Never allow unrestricted queries.

---

# API Rules

REST API only.

Naming Convention:

GET /resources

POST /resources

PUT /resources/:id

DELETE /resources/:id

Use consistent response format.

Success:

{
success: true,
data: {}
}

Error:

{
success: false,
message: ""
}

---

# Logging Rules

Log:

* authentication events
* failed logins
* bans
* approvals
* resource actions

Never log:

* passwords
* tokens
* secrets

---

# Error Handling Rules

Do not expose:

* stack traces
* database errors
* internal server details

Use generic client messages.

Log actual errors internally.

---

# Postman Requirements

Generate:

* Collection
* Environment
* Positive Tests
* Negative Tests
* Authorization Tests
* Ownership Tests
* Rate Limit Tests

---

# Testing Requirements

Generate:

Unit Tests

Integration Tests

Security Tests

Role Tests

Ownership Tests

Upload Tests

Authentication Tests

---

# Output Rules

Generate implementation in phases.

Never generate entire backend at once.

Order:

Phase 1:
Architecture

Phase 2:
Database Design

Phase 3:
Authentication

Phase 4:
Authorization

Phase 5:
Resources

Phase 6:
Community

Phase 7:
Support

Phase 8:
Notifications

Phase 9:
Admin Panel

Phase 10:
Testing

Wait for approval after each phase.

Never skip phases.

Never refactor unrelated modules while implementing a phase.
