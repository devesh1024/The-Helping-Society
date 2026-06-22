# frontend-contract.md

# Purpose

This document defines the contract between the React frontend and the backend.

The backend implementation may change.

The database may change.

The authentication provider may change.

However:

* API behavior
* Response structure
* Permissions
* Route expectations

must remain consistent.

Breaking this contract requires explicit approval.

---

# API Standards

Base URL:

/api/v1

Response Format:

Success:

{
"success": true,
"data": {}
}

Error:

{
"success": false,
"message": "Error Message"
}

Validation Error:

{
"success": false,
"message": "Validation Failed",
"errors": []
}

Unauthorized:

{
"success": false,
"message": "Unauthorized"
}

Forbidden:

{
"success": false,
"message": "Forbidden"
}

---

# Authentication Module

## POST /auth/register/student

Purpose:

Register student account.

Request:

{
"fullName": "",
"registrationNumber": "",
"branch": "",
"yearOfRegistration": "",
"dob": "",
"phoneNumber": "",
"email": "",
"password": ""
}

Response:

{
"success": true,
"message": "Verification email sent"
}

---

## POST /auth/register/faculty

Purpose:

Register faculty account.

Response:

Pending approval.

---

## POST /auth/register/contributor

Purpose:

Register contributor account.

Response:

Pending approval.

---

## POST /auth/login

Request:

{
"email": "",
"password": ""
}

Response:

{
"success": true,
"data": {
"accessToken": "",
"refreshToken": "",
"user": {}
}
}

---

## POST /auth/logout

Invalidate refresh token.

---

## POST /auth/refresh-token

Generate new access token.

---

## GET /auth/me

Return authenticated user profile.

---

# User Module

## GET /users/profile

Return current profile.

---

## PATCH /users/profile

Update editable profile fields.

Cannot update:

* role
* verification status
* permissions

---

## GET /users/notifications

Return notification list.

---

## PATCH /users/notifications/read

Mark notification as read.

---

# Resources Module

## POST /resources/request

Student/Core Team upload request.

Multipart form.

Fields:

* title
* description
* category
* file

Response:

Pending Approval

---

## POST /resources

Faculty/Admin direct upload.

---

## GET /resources

Return paginated resources.

Query:

?page=
&limit=
&search=
&category=

---

## GET /resources/:id

Return resource details.

---

## PUT /resources/:id

Owner/Admin only.

---

## DELETE /resources/:id

Owner/Admin only.

---

## POST /resources/:id/like

Toggle resource like.

---

## POST /resources/:id/comment

Create comment.

---

# Resource Requests

## GET /resource-requests

Admin only.

---

## PATCH /resource-requests/:id/approve

Admin only.

---

## PATCH /resource-requests/:id/reject

Admin only.

---

# Opportunities Module

## POST /opportunities

Contributor/Admin.

---

## GET /opportunities

Public endpoint.

Filters:

?page=
&type=
&search=

---

## GET /opportunities/:id

Public endpoint.

---

## PUT /opportunities/:id

Owner/Admin.

---

## DELETE /opportunities/:id

Owner/Admin.

---

# Lost & Found

## POST /lost-found

Create post.

---

## GET /lost-found

Paginated list.

---

## GET /lost-found/:id

Details page.

---

## PUT /lost-found/:id

Owner/Admin.

---

## DELETE /lost-found/:id

Owner/Admin.

---

## PATCH /lost-found/:id/resolve

Owner/Admin.

Marks resolved.

Triggers deletion after 24 hours.

---

# Rooms Module

## POST /rooms

Create listing.

---

## GET /rooms

List active listings.

---

## PUT /rooms/:id

Owner/Admin.

---

## DELETE /rooms/:id

Owner/Admin.

---

# Marketplace Module

## POST /marketplace

Create item.

Images:

1 to 5.

---

## GET /marketplace

List items.

---

## GET /marketplace/:id

Item details.

---

## PUT /marketplace/:id

Owner/Admin.

---

## DELETE /marketplace/:id

Owner/Admin.

---

# Support Module

## POST /support

Create support request.

Fields:

* title
* description
* contactNumber
* location
* images

---

## GET /support

Paginated list.

---

## GET /support/:id

Support details.

---

## PUT /support/:id

Owner/Admin.

---

## DELETE /support/:id

Owner/Admin.

---

# Comments Module

## POST /comments

Create comment.

Plain text only.

---

## POST /comments/:id/reply

Create reply.

Maximum depth:

1

---

## PUT /comments/:id

Owner/Admin.

---

## DELETE /comments/:id

Owner/Admin.

---

# Notifications Module

## GET /notifications

Current user notifications.

---

## PATCH /notifications/:id/read

Mark notification read.

---

# Admin Module

## GET /admin/dashboard

Admin statistics.

---

## GET /admin/users

Paginated user list.

Columns:

* name
* branch
* year
* email

---

## GET /admin/users/:id

Detailed profile.

Includes:

* phone
* role
* status

---

## PATCH /admin/users/:id/role

Update role.

---

## PATCH /admin/users/:id/approve

Approve faculty/contributor.

---

## PATCH /admin/users/:id/ban

Ban user.

---

## DELETE /admin/resources/:id

Admin delete resource.

---

## DELETE /admin/opportunities/:id

Admin delete opportunity.

---

## DELETE /admin/posts/:id

Admin delete community post.

---

## POST /admin/notifications

Create global notification.

---

# Ownership Rules

Before every:

PUT
PATCH
DELETE

backend must verify:

resource.ownerId === req.user.id

OR

req.user.role === admin

Never trust frontend ownership.

---

# Security Expectations

Frontend assumes:

* JWT Authentication
* RBAC
* Ownership Validation
* Input Validation
* Rate Limiting
* Secure File Uploads

Backend must enforce all security requirements.

Frontend must never be considered a security boundary.
