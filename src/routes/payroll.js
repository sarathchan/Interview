const express = require('express');
const { Connection, Client } = require('@temporalio/client');

const { auth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

function validatePayload(body) {
  const {
    userId,
    email,
    month,
    basic,
    hra,
    allowance,
    deductions
  } = body;

  if (!userId || typeof userId !== 'string') {
    return 'userId is required and must be a string';
  }
  if (!email || typeof email !== 'string') {
    return 'email is required and must be a string';
  }
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return 'month is required and must be in YYYY-MM format';
  }

  const nums = { basic, hra, allowance, deductions };
  for (const [key, value] of Object.entries(nums)) {
    if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
      return `${key} must be a non-negative number`;
    }
  }

  return null;
}

/**
 * @swagger
 * /api/payroll/credit-salary:
 *   post:
 *     summary: Credit salary for a user
 *     tags:
 *       - Payroll
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreditSalaryRequest'
 *     responses:
 *       201:
 *         description: Salary credited successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreditSalaryResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (insufficient role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Salary for this user and month already credited
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: Temporal service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/credit-salary',
  auth(['HR', 'ADMIN']),
  async (req, res, next) => {
    try {
      const error = validatePayload(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      const { userId, email, month } = req.body;

      // 2. Ensure the user exists
      const user = await User.findById(userId).lean();
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const workflowId = `salary-${userId}-${month}`;

      let connection;
      try {
        connection = await Connection.connect({
          address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
        });
      } catch (connErr) {
        console.error('Failed to connect to Temporal:', connErr);
        return res.status(503).json({
          success: false,
          message: 'Payroll service temporarily unavailable (Temporal down)'
        });
      }

      try {
        const client = new Client({ connection });

        const handle = await client.workflow.start('creditSalaryWorkflow', {
          args: [req.body],
          taskQueue: 'salary-queue',
          workflowId
        });

        const result = await handle.result();

        return res.status(201).json({
          success: true,
          workflowId,
          result
        });
      } finally {
        await connection.close();
      }
    } catch (err) {
      if (err.code === 'WorkflowExecutionAlreadyStarted') {
        return res.status(409).json({
          success: false,
          message: 'Salary already credited for this month'
        });
      }
      return next(err);
    }
  }
);

module.exports = router;


