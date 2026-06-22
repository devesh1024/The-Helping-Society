# Backend Specific Instructions (AGENTS.md)

These instructions govern all backend development for **The Helping Society (UECU)** Express.js application.

---

## 1. Directory Structure & Layering Rules
* All backend code must reside inside `backend/src/`.
* We strictly follow a **Layered Feature-Based Architecture**:
  1. **Routes (`routes/`)**: Orchestrate routes. Validate inputs, authorize roles, call controllers. No business logic.
  2. **Controllers (`controllers/`)**: Parse HTTP headers/body/params, invoke services, format standard response payloads. No database queries.
  3. **Services (`services/`)**: Run business logic, orchestrate transactions, integrate third-party APIs (Cloudinary, Mail). No raw Mongoose queries.
  4. **Repositories (`repositories/`)**: Perform direct Mongoose / MongoDB queries. No controller responses or business flows.
  5. **Models (`models/`)**: Define strict Mongoose schemas, discriminators, validation middleware, and indices.

---

## 2. Authentication Rules
* **JWT Access Token**: Lives 15 minutes. Payload: `{ id, role, email, isCoreTeam }`.
* **JWT Refresh Token**: Lives 30 days. High-entropy value stored in `refreshtokens` collection. Transmitted via `HttpOnly`, `Secure`, `SameSite=Strict` cookie scoped to `/api/v1/auth`.
* **Rotation**: Every token refresh deletes the old token and issues a new pair.
* **Passwords**: Hash using `bcrypt` with **12 salt rounds** minimum inside User model pre-save hook. Plaintext storage is forbidden.

---

## 3. Validation Rules
* Validate all request layers (body, query, params) using **Zod** middleware before calling controllers.
* Enforce student registration email prefixes and registration numbers using regexes:
  - **Regular**: `/^0701(cs|ce|ec|ee|me|cm)\d{2}\d{4}$/i`
  - **Diploma**: `/^0701(cs|ce|ec|ee|me|cm)\d{2}3d\d{2}$/i`
  - Institutional email prefix must equal registration number case-sensitively and suffix must equal `@uecu.ac.in`.

---

## 4. Authorization & Ownership (BOLA Prevention)
* Every state-changing route (`PUT`, `PATCH`, `DELETE`) must verify **Ownership**:
  - `document.ownerId.toString() === req.user.id.toString()` OR `req.user.role === 'admin'`.
  - Admin role bypasses ownership checks.
* Protected routes must check roles via `authorizeRoles(...)`. Guests and Contributors are strictly blocked from academic resources access.

---

## 5. File Upload Safeguards
* **No local storage is permitted**. Local disk uploads are forbidden.
* Files must be processed in memory using `multer.memoryStorage()` and streamed directly to Cloudinary.
* Validate size (limit **50MB**) and MIME/extension type (`pdf`, `docx`, `ppt`, `pptx`) before streaming.
* On deleting files from database collections, trigger the corresponding Cloudinary SDK `destroy()` API call.

---

## 6. Security Middleware Chain
Every request passes through:
1. **Helmet.js** (HTTP security headers)
2. **CORS** (Whitelisted origin access control)
3. **express-rate-limit** (5 requests/15min for auth; standard rate limits for others)
4. **HPP** (HTTP parameter pollution blocks)
5. **Zod Validator** (Input validation)
6. **XSS Sanitizer** (Escape text inputs)
7. **Auth / RBAC Filter**
8. **Controller**
9. **Global Error Handler** (Intercepts errors, hides stack traces, logs internally, returns generic messages)
