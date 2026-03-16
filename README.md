## Salary Credit System with Temporal.io

This project implements a salary credit system using **Node.js**, **Express**, **MongoDB (Mongoose)**, **Temporal.io**, **Nodemailer**, and **JWT** authentication.

The main flow:
- **HR/ADMIN** calls `POST /api/payroll/credit-salary`
- API validates payload and JWT (HR/ADMIN role)
- API starts Temporal workflow `creditSalaryWorkflow`
- Workflow activities:
  - Save salary record to MongoDB
  - Send email notification to employee

### 1. Prerequisites

- Node.js 18+
- MongoDB running locally or connection URI
- Temporal server running (e.g. via Docker)
- SMTP credentials (for Nodemailer)

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

All required variables are listed in `.env.example`. Create a `.env` file in the project root and fill in values:

```bash
PORT=3000
MONGO_URI=mongodb://localhost:27017/salary_credit_db

TEMPORAL_ADDRESS=localhost:7233

JWT_SECRET=change_me_jwt_secret

SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
EMAIL_FROM=hr@yourcompany.com
```

### 4. Running Temporal Server

If you don't already have Temporal running, you can start a local Temporal server using Docker (see Temporal docs) or the temporal CLI:

```bash
temporal server start-dev
```

This will expose Temporal at `localhost:7233` by default.

### 5. Start the Temporal Worker

In one terminal:

```bash
npm run worker
```

This starts a Temporal worker on task queue `salary-queue` which runs:
- Workflow: `creditSalaryWorkflow`
- Activities: `saveSalaryToMongoDB`, `sendSalaryEmail`

### 6. Start the API Server

In another terminal:

```bash
npm run dev
```

The Express API will listen on **port 3000**.

### 7. Authentication (JWT)

The `POST /api/payroll/credit-salary` endpoint requires a **Bearer JWT** with a payload that includes a `role` field equal to `HR` or `ADMIN`.

Example payload for testing:

```json
{
  "sub": "hr-user-1",
  "role": "HR"
}
```

Sign it with the `JWT_SECRET` from your `.env`.

### 8. API: Credit Salary

- **Endpoint**: `POST /api/payroll/credit-salary`
- **Auth**: Bearer JWT, `role` = `HR` or `ADMIN`
- **Body**:

```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "month": "2026-03",
  "basic": 50000,
  "hra": 20000,
  "allowance": 5000,
  "deductions": 3000
}
```

- **Behavior**:
  - Starts workflow `creditSalaryWorkflow`
  - Workflow ID: `salary-{userId}-{month}`, e.g. `salary-user-123-2026-03`
  - On success:

```json
{
  "success": true,
  "workflowId": "salary-user-123-2026-03",
  "result": {
    "status": "CREDITED",
    "netSalary": 72000
  }
}
```

If a salary for the same `userId` and `month` has already been processed, Temporal will reject a new workflow with the same ID and the API will respond with **409 Conflict**.

### 9. Sample curl Request

Assuming you have a JWT (with `role` = `HR` or `ADMIN`) stored in `TOKEN`:

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

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


