# StockSense — Authentication Module Documentation

Welcome to the **StockSense Authentication Module**. This module delivers a secure, production-style, beginner-friendly authentication system built specifically for the **StockSense Inventory Management System**.

---

## 1. Architecture Overview

The authentication module integrates directly into the existing full-stack StockSense application:

```
┌─────────────────────────────────────────────────────────────┐
│                 StockSense React Frontend                   │
│   (Login, Register, Forgot Password, OTP, Control Desk)     │
└──────────────────────────────┬──────────────────────────────┘
                               │  HTTP / JSON + Bearer Token
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               StockSense Express Backend (Node.js)          │
│                                                             │
│   ├── authController.js     (Endpoint request handlers)     │
│   ├── authMiddleware.js     (JWT token verification)        │
│   ├── emailService.js       (Nodemailer + Gmail SMTP)       │
│   ├── otp.js                (Crypto OTP generator & hash)   │
│   └── userModel.js / otpModel.js (Parameterized queries)    │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│         MySQL Server         │ │        Gmail SMTP          │
│   - users table              │ │   - Secure OTP emails via  │
│   - password_reset_otps      │ │     Gmail App Password     │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 2. MySQL Database Schema

The database script is located at:
- `sql/auth.sql`
- `backend/sql/auth.sql`

### `users` Table
Stores user credentials, bcrypt password hashes, and user roles.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT, PRIMARY KEY` | Unique user identifier |
| `name` | `VARCHAR(100)` | `NOT NULL` | Full name of the user |
| `email` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | Normalized lowercase email |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Bcrypt hashed password (10 rounds) |
| `role` | `ENUM('admin', 'manager', 'staff')` | `NOT NULL, DEFAULT 'staff'` | Organizational role |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Last updated timestamp |

### `password_reset_otps` Table
Tracks 6-digit OTPs for password recovery. **Plaintext OTPs are never stored.**

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT, PRIMARY KEY` | Unique OTP transaction ID |
| `user_id` | `INT` | `NOT NULL, FOREIGN KEY -> users(id)` | References the user requesting reset |
| `otp_hash` | `VARCHAR(255)` | `NOT NULL` | Bcrypt hashed 6-digit OTP |
| `expires_at` | `DATETIME` | `NOT NULL` | Expiration timestamp (10 minutes) |
| `attempts` | `INT` | `NOT NULL, DEFAULT 0` | Failed verification attempts (max 5) |
| `used` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Prevents reuse/replay attacks |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | OTP creation timestamp |

---

## 3. API Endpoints Reference

Base URL: `http://localhost:5000/api/auth`

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT |
| `GET` | `/api/auth/me` | Protected (`Bearer <token>`) | Get profile of logged-in user |
| `POST` | `/api/auth/forgot-password` | Public | Send 6-digit OTP to user's email |
| `POST` | `/api/auth/verify-otp` | Public | Verify OTP & receive reset token |
| `POST` | `/api/auth/reset-password` | Public | Reset password using reset token |
| `POST` | `/api/auth/logout` | Public | Stateless JWT logout acknowledgment |
| `GET` | `/api/health` | Public | Server & DB health check |

---

## 4. Request & Response Examples

### A. User Registration
`POST /api/auth/register`

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@stocksense.local",
  "password": "Password@123",
  "role": "manager"
}
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Account created successfully"
}
```

---

### B. User Login
`POST /api/auth/login`

**Request:**
```json
{
  "email": "jane@stocksense.local",
  "password": "Password@123"
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@stocksense.local",
    "role": "manager"
  }
}
```

---

### C. Current User Profile
`GET /api/auth/me`
*Headers: `Authorization: Bearer <token>`*

**Response (`200 OK`):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@stocksense.local",
    "role": "manager",
    "created_at": "2026-09-26T12:00:00.000Z"
  }
}
```

---

### D. Forgot Password (Request OTP)
`POST /api/auth/forgot-password`

**Request:**
```json
{
  "email": "jane@stocksense.local"
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "If an account exists with this email, an OTP has been sent."
}
```
*(Notice: Generic response avoids user enumeration security vulnerabilities)*

---

### E. Verify OTP
`POST /api/auth/verify-otp`

**Request:**
```json
{
  "email": "jane@stocksense.local",
  "otp": "492813"
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEs..."
}
```

---

### F. Reset Password
`POST /api/auth/reset-password`

**Request:**
```json
{
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "BrandNewPassword@456"
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in with your new password."
}
```

---

## 5. Security Measures Implemented

1. **Bcrypt Password Hashing**: Passwords are never stored in plaintext; hashed with 10 salt rounds.
2. **Hashed OTPs**: 6-digit OTP codes are generated using cryptographically secure `crypto.randomInt` and immediately hashed with bcrypt before storing in MySQL.
3. **OTP Single-Use & Expiration**: OTPs expire after 10 minutes and are immediately marked `used = TRUE` upon verification.
4. **Brute-Force Protection**: OTP attempts are limited to 5. Upon 5 failed attempts, the OTP is invalidated.
5. **No Password Reset Without Authorization**: Passwords cannot be reset with an email alone; client must present a cryptographically verified `resetToken` issued only after successful OTP validation.
6. **SQL Injection Prevention**: 100% of MySQL queries use prepared statements with parameterized inputs (`?`).
7. **No Sensitive Information Leaks**: `password_hash`, plain OTPs, and internal database stack traces are never returned in API responses.
8. **Email Normalization**: Emails are trimmed and converted to lowercase to avoid duplicate entries and lookup anomalies.

---

## 6. Gmail SMTP & App Password Setup

To enable automated email delivery of OTPs via Gmail:

1. Open your Google Account: [https://myaccount.google.com/](https://myaccount.google.com/)
2. Navigate to **Security** -> **2-Step Verification** (make sure 2-Step Verification is turned ON).
3. Scroll down to **App passwords** (or search "App passwords" in the top search bar).
4. Enter an app name (e.g. `StockSense`), click **Create**.
5. Copy the generated **16-character password** (e.g. `abcd efgh ijkl mnop`).
6. Paste into your `backend/.env` file:
   ```env
   GMAIL_USER=yourgmail@gmail.com
   GMAIL_APP_PASSWORD=abcdefghijklmnop
   ```

*(In local development mode without Gmail credentials set, the backend simulates delivery and logs the OTP to the developer console for testing).*

---

## 7. How to Run the Project

### Step 1: Database Setup
1. Open **MySQL Workbench** or run MySQL CLI:
   ```bash
   mysql -u root -p < sql/auth.sql
   ```
2. Or open `sql/auth.sql` inside MySQL Workbench and click **Execute**.

### Step 2: Configure Environment Variables
1. Copy `.env.example` in `backend/`:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Update `DB_PASSWORD` with your MySQL root password:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=YOUR_MYSQL_PASSWORD
   DB_NAME=stocksense
   JWT_SECRET=your_long_random_jwt_secret_key_12345
   GMAIL_USER=yourgmail@gmail.com
   GMAIL_APP_PASSWORD=your_16_character_app_password
   ```

### Step 3: Start the Backend Server
```bash
cd backend
npm install
npm start
```
*(Backend runs on `http://localhost:5000`)*

### Step 4: Start the Frontend Application
In a separate terminal at the project root:
```bash
npm run dev
```
*(Frontend runs on `http://localhost:5173` or `http://localhost:3000`)*

### Step 5: Test the Application
Visit:
- `http://localhost:5173/login` — Sign in page
- `http://localhost:5173/register` — Sign up page
- `http://localhost:5173/forgot-password` — Forgot password & OTP verification wizard
- `http://localhost:5173/` — Protected Inventory Control Desk (automatically redirects unauthenticated visitors to `/login`)

---

## 8. Summary for Team Lead

> **Team Lead Update:**
> "I have implemented the complete end-to-end **Authentication Module** for StockSense.
>
> 1. **Database & Schema**: Created `sql/auth.sql` with normalized MySQL tables (`users` with role-based access: admin/manager/staff, and `password_reset_otps` with hashed OTPs, expiration, and attempt tracking).
> 2. **Backend**: Implemented an Express.js modular backend under `backend/` with parameterized MySQL queries (`mysql2`), bcrypt password hashing, JWT stateless authentication (`/register`, `/login`, `/me`), and token verification middleware (`authMiddleware.js`).
> 3. **Forgot Password & OTP**: Built a secure multi-stage forgot-password flow with Nodemailer Gmail SMTP using Gmail App Passwords. OTPs are cryptographically generated, hashed with bcrypt, limited to 5 attempts, expire in 10 minutes, and issue a short-lived signed `resetToken` upon verification.
> 4. **Frontend Integration**: Built cohesive, high-aesthetic dark-mode screens for Sign in (`/login`), Sign up (`/register`), and Forgot Password/OTP Wizard (`/forgot-password`), integrated an `AuthContext` to manage local session state, and protected the main inventory control desk while displaying the authenticated user's profile and handling clean logout.
> 5. **Quality & Security**: Added automated unit tests (`backend/test-auth.js`) validating 26 assertions across password validation, OTP hashing, and JWT token signatures."
