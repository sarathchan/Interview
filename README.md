# Salary Credit System with Temporal.io

A salary credit system built with **Node.js**, **Express**, **MongoDB**, **Temporal.io**, **Nodemailer**, and **JWT** authentication.

## Overview

**Flow:**
1. **HR** or **ADMIN** logs in and receives a JWT.
2. HR/ADMIN calls `POST /api/payroll/credit-salary` with salary details.
3. The API validates the payload and starts the Temporal workflow `creditSalaryWorkflow`.
4. The workflow runs two activities:
   - Save salary record to MongoDB
   - Send email notification to the employee

---

## Quick Start (Docker)

Run everything locally with one command.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

### Start All Services

```bash
docker compose up -d --build
```

Or use the npm script:

```bash
npm run docker:up
```

### Local URLs

| Service       | URL                           |
|---------------|-------------------------------|
| API           | http://localhost:3000         |
| Swagger Docs  | http://localhost:3000/api-docs|
| Temporal UI   | http://localhost:8233         |
| MailHog (emails) | http://localhost:8025      |

### Seeded Users

| Email                 | Password   | Role     |
|---------------------  |------------|----------|
| hr@example.com        | Password123! | HR     |
| admin@example.com     | Password123! | ADMIN  |
| sarathchan20@gmail.com| Password123! | EMPLOYEE |

### Stop Services

```bash
docker compose down
```

To also remove data volumes:

```bash
docker compose down -v
```

---

## Manual Setup

For development without Docker.

### Prerequisites
- Node.js 18+
- MongoDB (local or connection URI)
- Temporal server (e.g. `temporal server start-dev` or Docker)
- SMTP credentials, or use [MailHog](https://github.com/mailhog/MailHog) for local testing

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

| Variable         | Description                    | Example                           |
|------------------|--------------------------------|-----------------------------------|
| PORT             | API server port                | 3000                              |
| MONGO_URI        | MongoDB connection string      | mongodb://localhost:27017/salary_credit_db |
| TEMPORAL_ADDRESS | Temporal server address         | localhost:7233                    |
| JWT_SECRET       | Secret for signing JWTs        | your-secret-key                   |
| SMTP_HOST        | SMTP host (or `localhost` for MailHog) | smtp.gmail.com            |
| SMTP_PORT        | SMTP port (1025 for MailHog)   | 587                               |
| SMTP_USER        | SMTP username                  | -                                 |
| SMTP_PASS        | SMTP password                  | -                                 |
| EMAIL_FROM       | Sender email address           | hr@yourcompany.com                |

### 3. Seed the Database

```bash
npm run seed
```

### 4. Run the Services

**Terminal 1 – Temporal worker:**
```bash
npm run worker
```

**Terminal 2 – API server:**
```bash
npm run dev
```

---

## Authentication

### Login

Get a JWT by logging in:

**POST** `/api/auth/login`

```json
{
  "email": "hr@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "HR User",
    "email": "hr@example.com",
    "role": "HR"
  }
}
```

Use the `token` in the `Authorization` header:
```
Authorization: Bearer <token>
```

### Protected Endpoints

- `POST /api/payroll/credit-salary` — requires **HR** or **ADMIN** role

---

## API: Credit Salary

**Endpoint:** `POST /api/payroll/credit-salary`  
**Auth:** Bearer JWT (role: HR or ADMIN)

### Request Body

| Field        | Type   | Required | Description                          |
|--------------|--------|----------|--------------------------------------|
| userId       | string | Yes      | MongoDB ObjectId (24 hex characters) |
| email        | string | Yes      | Employee email                       |
| month        | string | Yes      | Format: `YYYY-MM` (e.g. `2026-03`)   |
| basic        | number | Yes      | Basic salary                         |
| hra          | number | Yes      | HRA                                  |
| allowance    | number | Yes      | Allowances                           |
| deductions   | number | Yes      | Deductions                           |

### Example Request

```json
{
  "userId": "64f123abcde4567890fedcba",
  "email": "employee@example.com",
  "month": "2026-03",
  "basic": 50000,
  "hra": 20000,
  "allowance": 5000,
  "deductions": 3000
}
```

### Success Response (201)

```json
{
  "success": true,
  "workflowId": "salary-64f123abcde4567890fedcba-2026-03",
  "result": {
    "status": "CREDITED",
    "netSalary": 72000
  }
}
```

### Error Responses
- **400** — Validation error or workflow failure
- **401** — Missing or invalid token
- **403** — Insufficient permissions
- **404** — User not found
- **409** — Salary already credited for this user and month
- **503** — Temporal server unavailable

---

## Example: Credit Salary with curl

1. Log in to get a token:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@example.com","password":"Password123!"}' \
  | jq -r '.token')
```

2. Get a user ID from `/api/users` (or from the seeded data).

3. Credit salary:

```bash
curl -X POST http://localhost:3000/api/payroll/credit-salary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "64f123abcde4567890fedcba",
    "email": "employee@example.com",
    "month": "2026-03",
    "basic": 50000,
    "hra": 20000,
    "allowance": 5000,
    "deductions": 3000
  }'
```

---

## Workflow Details

- **Workflow:** `creditSalaryWorkflow`
- **Workflow ID:** `salary-{userId}-{month}`
- **Task Queue:** `salary-queue`
- **Activities:**
  - `saveSalaryToMongoDB` — Persists salary to MongoDB; retries on transient DB errors
  - `sendSalaryEmail` — Sends notification email; retries on SMTP failures (3 attempts, exponential backoff)

---

## npm Scripts

| Command         | Description                         |
|-----------------|-------------------------------------|
| `npm run dev`   | Start API server with nodemon       |
| `npm run start` | Start API server                    |
| `npm run worker`| Start Temporal worker               |
| `npm run seed`  | Seed users and sample salaries      |
| `npm run docker:up`   | Start all services with Docker |
| `npm run docker:down` | Stop Docker services         |
| `npm run docker:logs` | Tail Docker logs             |
