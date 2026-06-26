# PRD.md

# Project Name

The Helping Society (UECU)

---

# Project Vision

The Helping Society is a private college-community platform built exclusively for UECU students, faculty, alumni, contributors, and administrators.

The platform serves as a centralized ecosystem where verified users can:

* Access academic resources
* Discover opportunities
* Participate in community activities
* Request support and emergency assistance
* Connect with faculty and contributors

The system must prioritize:

* Security
* Role-based access control
* Resource moderation
* Student privacy
* Scalable backend architecture

---

# Primary Goals

1. Create a secure college-only ecosystem.
2. Prevent unauthorized access to resources.
3. Centralize academic resources.
4. Allow verified community interaction.
5. Allow contributors to publish opportunities.
6. Provide emergency support mechanisms.
7. Give administrators complete moderation control.

---

# User Types

## Guest

Permissions:

* View homepage
* View public opportunity listings
* View public announcements
* View public notices

Restrictions:

* Cannot access resources
* Cannot access support module
* Cannot create posts
* Cannot view resource files
* Cannot comment
* Cannot download files

---

## Student

Requirements:

* Must register using valid college email

Examples:

[0701CS23XXXX@uecu.ac.in](mailto:0701CS23XXXX@uecu.ac.in)

[0701ee251045@uecu.ac.in](mailto:0701ee251045@uecu.ac.in)

[0701cs243d02@uecu.ac.in](mailto:0701cs243d02@uecu.ac.in)

Student accounts become verified after:

* Email verification

Permissions:

* Create Lost & Found posts
* Create Room posts
* Create Marketplace posts
* Request resource uploads
* Comment on posts
* Reply to comments
* Create support requests
* Like resources

Restrictions:

* Cannot directly publish resources
* Cannot change own role
* Cannot access admin functions

---

## Core Team Member

Inherits all Student permissions.

Additional Permissions:

* Resource upload request priority
* Internal moderation privileges (future expansion)

Restrictions:

* Cannot access admin-only controls

---

## Faculty

Permissions:

* Direct resource upload
* Publish academic notices
* Publish academic guidance
* Respond to academic queries

Restrictions:

* Cannot access admin-only controls

Faculty registration requires:

* Email verification
* Admin approval

---

## Contributor

Purpose:

External users who publish opportunities.

Examples:

* Companies
* Recruiters
* Alumni
* Mentors

Permissions:

* Create opportunities
* Edit own opportunities
* Delete own opportunities

Restrictions:

* No resource access
* No support access
* No community access
* Cannot download or view academic content

Contributor registration requires:

* Email verification
* Admin approval

---

## Admin

Permissions:

* User management
* Resource approval
* User banning
* Opportunity moderation
* Notification publishing
* Report handling
* Audit log access
* Role assignment
* Content deletion

Restrictions:

None

---

# Authentication System

Authentication Method:

Email + Password

Google OAuth:

Future integration

---

# Signup Flow

Step 1:

Select Account Type

Options:

* Student
* Faculty
* Contributor

---

## Student Signup

Required Fields:

* Full Name
* Registration Number
* Branch
* Year of Registration
* Date of Birth
* Phone Number
* Email
* Password
* Confirm Password

Validation:

Registration Number must match UECU patterns.

Supported Branch Codes:

* cs
* ce
* ec
* ee
* me
* cm

Both regular and diploma patterns must be supported.

Verification:

* Email Verification

Status:

Verified

---

## Faculty Signup

Required Fields:

* Full Name
* Email
* Phone Number
* Password

Verification:

* Email Verification
* Admin Approval

Status:

Pending Approval

---

## Contributor Signup

Required Fields:

* Full Name
* Organization Name
* Role/Position in Organization
* Email
* Password

Verification:

* Email Verification
* Admin Approval

Status:

Pending Approval

---

# Resource Hub

Resource Types:

* Notes
* PYQs
* Books
* Syllabus
* Study Material

---

## Upload Workflow

Student/Core Team:

Submit Upload Request

Admin:

Approve or Reject

Faculty:

Direct Upload

Admin:

Direct Upload

---

## Resource File Rules

Allowed Types:

* PDF
* DOCX
* PPT
* PPTX

Maximum File Size:

50 MB

---

## Resource Editing

Allowed For:

* Original uploader
* Admin

---

## Resource Deletion

Allowed For:

* Original uploader
* Admin

---

## Resource Viewing

Student:

Allowed

Faculty:

Allowed

Core Team:

Allowed

Admin:

Allowed

Contributor:

Denied

Guest:

Denied

Files must open inside platform PDF viewer.

File download is prohibited.

---

# Opportunities Module

Supported Types:

* Internship
* Job
* Workshop
* Mentorship
* Hackathon

---

## Opportunity Creation

Allowed For:

* Contributor
* Admin

---

## Opportunity Approval

Not Required

Opportunity becomes live immediately.

---

## Opportunity Links

Every opportunity must contain:

* External Application URL

Supported URL Types:

* HTTP
* HTTPS
* LinkedIn
* Google Drive
* Google Forms
* Google Docs
* GitHub

---

## Opportunity Editing

Allowed For:

* Creator
* Admin

---

## Opportunity Deletion

Allowed For:

* Creator
* Admin

---

# Community Module

## Lost & Found

Permissions:

Create:

* Student
* Core Team

Edit:

* Owner
* Admin

Delete:

* Owner
* Admin

Resolve:

* Owner
* Admin

After Resolution:

Automatically delete after 24 hours.

Comments:

Delete entire thread when post deleted.

---

## Rooms

Permissions:

Create:

* Student
* Core Team

Edit:

* Owner
* Admin

Delete:

* Owner
* Admin

Auto Expiry:

7 Days

---

## Marketplace

Permissions:

Create:

* Student
* Core Team

Images:

Minimum:

1

Maximum:

5

Edit:

* Owner
* Admin

Delete:

* Owner
* Admin

---

# Support Module

## Emergency Requests

Go live instantly.

No approval required.

Required Fields:

* Title
* Description
* Contact Number
* Location

Optional:

* Images

Maximum Description Length:

500 Characters

---

## Standard Support Requests

Status Flow:

Pending

Approved

Rejected

Resolved

---

# Comments System

Supported:

* Plain Text Only

Not Supported:

* HTML
* Markdown
* Rich Text

Replies:

Supported

Nested Reply Depth:

1 Level

---

# Notification System

## Global Notifications

Created By:

Admin

Examples:

* Exam Notice
* Result Notice
* Scholarship Notice
* Important Alerts

Shown:

Popup on website open

Stored in notification history

---

## Personal Notifications

Examples:

* Comment on post
* Reply to comment
* Like on resource
* Resource approved
* Resource rejected

Visible only to relevant users.

---

# Admin Panel

Modules:

* Dashboard
* Users
* Verification Queue
* Resources
* Opportunities
* Reports
* Notifications
* Audit Logs
* Settings

---

## User Management

Admin can:

* View users
* Change role
* Verify users
* Disable users
* Ban users

Admin cannot:

* Impersonate users

---

## User Table Fields

Visible:

* Name
* Branch
* Year
* Email

Detailed View:

* Phone Number
* Role
* Verification Status

---

# Ban System

Ban Type:

Permanent

Effects:

* Login blocked
* Access revoked

User receives email notification.

---

# Audit Logs

Retention:

7 Days

Track:

* Approvals
* Rejections
* Role Changes
* Bans
* Resource Actions

---

# Security Requirements

Comments must be plain text.

User-generated HTML is prohibited.

Every update and delete operation must verify ownership.

Every admin route must verify role.

Every contributor route must verify role.

Every resource access must verify permissions.

User email addresses are private.

Only admins may view user emails.

Student profiles are not searchable.

Role changes are admin-only.

---

# Non Functional Requirements

Backend:

Node.js

Framework:

Express.js

Database:

MongoDB Atlas

ODM:

Mongoose

Validation:

Zod

Authentication:

JWT

Password Hashing:

bcrypt

Security:

Helmet

Rate Limiting

CORS

Input Validation

Environment Variables

Logging

Scalability

Production Ready
