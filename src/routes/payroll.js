const express = require('express');
const { Connection, Client } = require('@temporalio/client');
const { rootCause } = require('@temporalio/common');

const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Salary = require('../models/Salary');

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
  if (!/^[a-fA-F0-9]{24}$/.test(userId)) {
    return 'userId must be a valid MongoDB ObjectId (24 hex characters)';
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
 *         description: Salary credited
 *       400:
 *         description: Validation error or workflow failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions (HR or ADMIN required)
 *       404:
 *         description: User not found
 *       409:
 *         description: Salary already credited for this user and month
 *       503:
 *         description: Payroll service temporarily unavailable
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
      console.log(user,userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // 3. Pre-check: salary already credited for this user+month
      const existing = await Salary.findOne({ userId, month }).lean();
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Salary already credited for this user and month'
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
      // Extract root cause message from workflow/activity failure
      const message = rootCause(err) || err.cause?.message || err.message;
      if (message) {
        return res.status(400).json({
          success: false,
          message
        });
      }
      return next(err);
    }
  }
);

module.exports = router;


