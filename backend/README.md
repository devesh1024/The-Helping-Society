# The Helping Society (UECU) — Backend Developer Manual & API Guide

Welcome to the backend repository of **The Helping Society (UECU)**. This document serves as the onboarding manual, architecture guide, and API specification for developers who will be maintaining or extending this codebase.

---

## 1. System Architecture Overview

The backend is built as a RESTful web service using **Node.js**, **Express**, and **TypeScript**, with **MongoDB** as the database. It adheres to a structured, layered architecture pattern for high separation of concerns:

```
                  ┌───────────────────────┐
                  │      HTTP Client      │
                  └───────────┬───────────┘
                              │ JSON / Multipart
                              ▼
                  ┌───────────────────────┐
                  │    Express Router     │
                  └───────────┬───────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │      Middleware       │ (Auth, Rate Limiting, Security, Sanitizer)
                  └───────────┬───────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │      Controllers      │ (Request parsing & response dispatching)
                  └───────────┬───────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │       Services        │ (Core business logic & workflows)
                  └───────────┬───────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │     Repositories      │ (Database queries & abstractions)
                  └───────────┬───────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │     Mongoose Models   │ (MongoDB Schema definitions)
                  └───────────────────────┘
```

### Core Architecture Components
1. **Controllers (`src/controllers/`)**: Parse HTTP headers, route parameters, query filters, and JSON request bodies. They invoke business services and dispatch appropriate success or error JSON responses.
2. **Services (`src/services/`)**: The main repository of business logic. Orchestrates operations, executes database queries, manages token generations, sends notifications, and triggers external APIs.
3. **Repositories (`src/repositories/`)**: Provides database transaction abstractions over Mongoose models, protecting service boundaries from direct Mongoose queries.
4. **Models (`src/models/`)**: Defines the Mongoose schemas, indexes, and type interfaces for database records.
5. **Middleware (`src/middleware/`)**: Performs security scans, sanitizes body fields, verifies JWT signatures, enforces role permissions, and validates asset ownership.

---

## 2. Onboarding & Environment Setup

To start developing on this backend locally, ensure you meet the pre-requisites and configure your local environment variables correctly.

### Pre-requisites
- **Node.js** v18 or higher
- **npm** v9 or higher
- **MongoDB Atlas** account or a local MongoDB community edition instance

### Environment Setup (`.env`)
Create a `.env` file in the `backend/` root directory. Use the following template and replace placeholder values with your active service credentials:

```ini
PORT=5000
NODE_ENV=development

# Database Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/test

# JWT Configurations
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# SMTP Mail Server Configurations (For Email verification / Forgot Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@uecu.ac.in
SMTP_PASS=your_app_password_here
SMTP_FROM=no-reply@uecu.ac.in

# Cloudinary Configs (For Uploading Images/Files)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
```

### Installation & Execution
Run the following commands in the `backend` directory to boot up the API server:

```bash
# Install NPM dependencies
npm install

# Run backend in development mode (with hot reloading via nodemon)
npm run dev

# Run compilation checks (TypeScript compiler)
npm run build

# Run unit & integration test suites
npm test
```

---

## 3. Security, Authentication & Authorization Policies

Our backend enforces strict security practices to protect data integrity and user accounts:

### Rate Limiting
- **Global API Limiter**: Enforces a maximum of `100` requests per `15 minutes` per IP address across all `/api/v1` routes.
- **Authentication Limiter**: Enforces a strict limit of `15` authentication requests per `15 minutes` for registration, login, forgot-password, and password reset endpoints to prevent brute-force attacks.

### Authentication & Token Rotation
We use a hybrid authentication design using dual JWTs:
1. **Access Token (Short-lived)**: Passed as a `Bearer <token>` in the `Authorization` header. It lasts `15 minutes` and contains basic user info (ID, role).
2. **Refresh Token (Long-lived)**: Stored in a secure `HttpOnly`, `Secure` (HTTPS only), `SameSite=Strict` cookie, or provided in the JSON body. It lasts `7 days` and is used to request new Access Tokens.
3. **Rotation Mechanics**: Every time `/auth/refresh-token` is requested, the previous refresh token is invalidated, and a brand-new pair of Access and Refresh tokens is issued. If an invalidated refresh token is presented, the system detects a replay attack, logs an audit alert, and clears all session cookies for that user.

### Role-Based Access Control (RBAC)
Routes are protected by a role authorization middleware:
- **Roles**: `student`, `coreTeam`, `faculty`, `contributor`, `admin`
- Permissions hierarchy:
  - Any authenticated user can view posts, request resource uploads, or create support tickets.
  - Only `faculty` or `admin` can directly upload files without moderation.
  - Only `admin` can access user directories, approve registrations, resolve content reports, or inspect audit logs.

### Broken Object Level Authorization (BOLA) / Ownership Verification
Endpoints allowing modification or deletion of user-owned resources (e.g. lost & found posts, room listings, marketplace items, resources, and comments) are gated by `authorizeOwnership(ModelName, parameterName)`. This middleware checks that the `req.user.id` matches the document's `owner` or `creator` attribute in MongoDB before allowing execution.

---

## 4. API Reference Manual

All backend endpoints are prefixed with `/api/v1`. 

---

### Category A: System Health & Status

#### 1. Backend Health Check
*   **Path**: `GET /api/v1/health`
*   **Authentication**: None
*   **Description**: Returns service health status, timestamp, and system uptime.
*   **Scenarios & Status Codes**:
    *   **200 OK**: Backend is online and database is responsive.
        ```json
        {
          "success": true,
          "message": "Backend service is healthy",
          "timestamp": "2026-06-23T14:00:00.000Z",
          "uptime": 2341.25
        }
        ```

---

### Category B: Authentication & Profile

#### 1. Register Student
*   **Path**: `POST /api/v1/auth/register/student`
*   **Authentication**: None
*   **Request Body**:
    ```json
    {
      "fullName": "Jane Doe",
      "registrationNumber": "0701CS23XXXX",
      "branch": "cs",
      "yearOfRegistration": 2023,
      "dob": "2003-05-15",
      "phoneNumber": "9876543210",
      "email": "0701CS23XXXX@uecu.ac.in",
      "password": "Password123"
    }
    ```
*   **Scenarios & Status Codes**:
    *   **201 Created**: Student registered successfully. Send verification email.
    *   **400 Bad Request**: Validation failed (e.g. invalid institutional email domain, missing required fields).
    *   **409 Conflict**: Email or registration number is already registered.

#### 2. Register Faculty
*   **Path**: `POST /api/v1/auth/register/faculty`
*   **Authentication**: None
*   **Description**: Faculty accounts register with status `pendingApproval`. They must be approved by an Admin before they can log in.
*   **Request Body**:
    ```json
    {
      "fullName": "Dr. John Smith",
      "email": "john.smith@uecu.ac.in",
      "phoneNumber": "9988776655",
      "password": "Password123"
    }
    ```
*   **Scenarios & Status Codes**:
    *   **201 Created**: Registration received. Placed in pending moderation queue.
    *   **400 Bad Request**: Validation error.

#### 3. Login
*   **Path**: `POST /api/v1/auth/login`
*   **Authentication**: None
*   **Request Body**:
    ```json
    {
      "email": "0701CS23XXXX@uecu.ac.in",
      "password": "Password123"
    }
    ```
*   **Scenarios & Status Codes**:
    *   **200 OK**: Login successful. Cookie is set, response returns access token.
        ```json
        {
          "success": true,
          "data": {
            "accessToken": "eyJhbG...",
            "user": {
              "id": "603f...",
              "fullName": "Jane Doe",
              "role": "student",
              "status": "active"
            }
          }
        }
        ```
    *   **401 Unauthorized**: Invalid credentials, email not verified, or account `pendingApproval` or `banned`.

#### 4. Rotate Refresh Token
*   **Path**: `POST /api/v1/auth/refresh-token`
*   **Request Body**: `{ "refreshToken": "..." }` or via cookie.
*   **Scenarios & Status Codes**:
    *   **200 OK**: Rotation successful. Access token and new cookie generated.
    *   **401 Unauthorized**: Refresh token missing, expired, or invalid.

#### 5. Update Profile
*   **Path**: `PATCH /api/v1/users/profile`
*   **Authentication**: Required (Student, Faculty, Contributor, CoreTeam, Admin)
*   **Request Body**:
    ```json
    {
      "fullName": "Jane Doe Modified",
      "phoneNumber": "9876543211"
    }
    ```
*   **Scenarios & Status Codes**:
    *   **200 OK**: Profile updated.
    *   **401 Unauthorized**: Authentication token missing or invalid.

---

### Category C: Community Posts (Lost & Found, Rooms, Marketplace, Comments)

#### 1. Create Lost & Found Post
*   **Path**: `POST /api/v1/lost-found`
*   **Authentication**: Required (`student`, `coreTeam`)
*   **Request Body**:
    ```json
    {
      "title": "Lost Watch",
      "description": "Lost Casio watch near library.",
      "contactNumber": "9876543210",
      "location": "College Library",
      "images": []
    }
    ```
*   **Scenarios & Status Codes**:
    *   **201 Created**: Post successfully created.
    *   **403 Forbidden**: Authenticated user role is not student/coreTeam.

#### 2. Resolve Lost & Found Post
*   **Path**: `PATCH /api/v1/lost-found/:id/resolve`
*   **Authentication**: Required (Owner or Admin)
*   **Description**: Changes the post state to `resolved` (item returned to owner).
*   **Scenarios & Status Codes**:
    *   **200 OK**: Status marked as resolved.
    *   **403 Forbidden**: User is not the owner of this post and is not an admin.

#### 3. Update Room Post
*   **Path**: `PUT /api/v1/rooms/:id`
*   **Authentication**: Required (Owner or Admin)
*   **Request Body**:
    ```json
    {
      "title": "1BHK flat for students (Updated)",
      "price": 5500,
      "location": "Nehru Nagar"
    }
    ```
*   **Scenarios & Status Codes**:
    *   **200 OK**: Room details modified.
    *   **403 Forbidden**: Ownership validation failed.
    *   **404 Not Found**: Room post not found.

#### 4. Create Comment / Reply
*   **Path**: `POST /api/v1/comments`
*   **Request Body**:
    ```json
    {
      "targetId": "603fdfa...",
      "targetType": "lostFound",
      "content": "I think I saw it near the library counter."
    }
    ```
*   **Scenarios & Status Codes**:
    *   **201 Created**: Comment published.
    *   **400 Bad Request**: Target post type is invalid, or target document does not exist.

---

### Category D: Support Requests & Moderation

#### 1. Create Support Request
*   **Path**: `POST /api/v1/support-requests`
*   **Authentication**: Required (Any authenticated user)
*   **Description**: Submit standard or emergency support tickets.
*   **Request Body**:
    ```json
    {
      "title": "Medical emergency near Block C",
      "description": "A student requires immediate attention due to a sudden asthma attack.",
      "contactNumber": "9876543210",
      "location": "Block C, ground floor",
      "isEmergency": true
    }
    ```
*   **Scenarios & Status Codes**:
    *   **201 Created**: Ticket filed.
        *   *Emergency Queue Workflow*: If `isEmergency` is `true`, it is automatically set to `approved` status and triggers notification alerts to Core Team and Admin.
        *   *Standard Queue Workflow*: If `isEmergency` is `false`, it enters the queue with `pending` status.
    *   **400 Bad Request**: Invalid payload values.

#### 2. Moderate Support Request (Approve / Reject)
*   **Path**: `PATCH /api/v1/support-requests/:id/approve` (or `/reject`)
*   **Authentication**: Required (`admin` only)
*   **Description**: Approve a pending standard ticket to activate it on the board, or discard/reject it.
*   **Scenarios & Status Codes**:
    *   **200 OK**: Status changed successfully.
    *   **403 Forbidden**: Caller is not an administrator.

#### 3. Resolve Support Request
*   **Path**: `PATCH /api/v1/support-requests/:id/resolve`
*   **Authentication**: Required (Ticket owner or `admin`)
*   **Description**: Marks ticket status as `resolved` (case closed).
*   **Scenarios & Status Codes**:
    *   **200 OK**: Ticket marked resolved.

---

### Category E: Resources Hub

#### 1. Request Resource Upload
*   **Path**: `POST /api/v1/resources/request`
*   **Authentication**: Required (`student`, `coreTeam`)
*   **Request Form-Data**:
    - `title`: string
    - `description`: string
    - `category`: string (e.g. `notes`, `syllabus`, `papers`)
    - `file`: File upload (Multipart)
*   **Description**: Uploaded file is sent to Cloudinary. The resource object is saved with status `pendingApproval`. It must be approved by an Admin before appearing on the public resource directory.
*   **Scenarios & Status Codes**:
    *   **201 Created**: Uploaded. Pending review.
    *   **400 Bad Request**: Missing file or invalid metadata.

#### 2. Moderate Resource Request (Approve / Reject)
*   **Path**: `PATCH /api/v1/resource-requests/:id/approve` (or `/reject`)
*   **Authentication**: Required (`admin` only)
*   **Scenarios & Status Codes**:
    *   **200 OK**: Request approved (status changes to `approved` and is queryable by students) or rejected (status changes to `rejected`, file deleted from Cloudinary).
    *   **403 Forbidden**: Only administrator accounts can moderate resource requests.

---

### Category F: Admin Panel Controls

#### 1. Approve / Reject Faculty Registration
*   **Path**: `PATCH /api/v1/admin/users/:id/approve` (or `/reject`)
*   **Authentication**: Required (`admin` only)
*   **Description**: Change a pending faculty account's status to `active` or `rejected`.
*   **Scenarios & Status Codes**:
    *   **200 OK**: Faculty account verified. They can now log in.
    *   **403 Forbidden**: Non-admin user access.
    *   **404 Not Found**: Faculty user ID not found.

#### 2. Update User Role
*   **Path**: `PATCH /api/v1/admin/users/:id/role`
*   **Authentication**: Required (`admin` only)
*   **Request Body**: `{ "role": "coreTeam" }`
*   **Scenarios & Status Codes**:
    *   **200 OK**: Role changed.
    *   **400 Bad Request**: Invalid role parameter.

#### 3. Ban User
*   **Path**: `PATCH /api/v1/admin/users/:id/ban`
*   **Authentication**: Required (`admin` only)
*   **Description**: Flags user status as `banned`. Forces session invalidation and blocks subsequent login attempts.
*   **Scenarios & Status Codes**:
    *   **200 OK**: User successfully banned.

#### 4. Resolve Content Report
*   **Path**: `PATCH /api/v1/admin/reports/:id/resolve`
*   **Authentication**: Required (`admin` only)
*   **Description**: Marks a content report (submitted via `POST /reports`) as resolved.
*   **Scenarios & Status Codes**:
    *   **200 OK**: Report resolved.

---

## 5. Summary of Error Possibilities & Handling

We use standard REST HTTP status codes to communicate errors:

| Status Code | Code Name | Primary Occurrences in this Project |
| :--- | :--- | :--- |
| **400** | Bad Request | Validation errors (e.g. password too weak, missing description, invalid target types). |
| **401** | Unauthorized | Invalid access tokens, expired login session, missing refresh cookies. |
| **403** | Forbidden | Role checking failures, ownership validation errors (BOLA checks on edits/deletes). |
| **404** | Not Found | Item, user, report, or route path requested does not exist in our systems. |
| **409** | Conflict | Duplicate resource errors (e.g., student registering with a registration number that already exists). |
| **422** | Unprocessable Entity | Valid JSON structure but cannot be processed (e.g. file uploaded is too large or not a PDF). |
| **429** | Too Many Requests | Triggered when rate limits are breached on routes. |
| **500** | Internal Server Error | Database timeout, Cloudinary uploading failure, or system logic crash. |

All error payloads follow a consistent format:
```json
{
  "success": false,
  "message": "A detailed error message explaining why the operation failed."
}
```
In `production` mode, detailed SQL/database query errors and stacks are stripped out of the `"message"` field to avoid information leak vulnerabilities.
