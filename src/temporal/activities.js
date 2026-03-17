const { ApplicationFailure } = require('@temporalio/common');

const Salary = require('../models/Salary');
const { sendSalaryCreditedEmail } = require('../services/emailService');

async function saveSalaryToMongoDB(payload) {
  try {
    const {
      userId,
      email,
      month,
      basic,
      hra,
      allowance,
      deductions
    } = payload;

    const grossSalary = basic + hra + allowance;
    const netSalary = grossSalary - deductions;

    if (netSalary < 0) {
      throw ApplicationFailure.nonRetryable('Net salary cannot be negative');
    }

    const doc = new Salary({
      userId,
      email,
      month,
      basic,
      hra,
      allowance,
      deductions,
      grossSalary,
      netSalary,
      status: 'CREDITED',
      creditedAt: new Date()
    });

    await doc.save();

    return {
      id: doc._id.toString(),
      netSalary
    };
  } catch (err) {
    console.error('Activity saveSalaryToMongoDB failed:', err);

    if (err.code === 11000) {
      throw ApplicationFailure.nonRetryable(
        'Salary already credited for this user and month'
      );
    }

    if (err.name === 'ValidationError' || err.name === 'NetSalaryValidationError') {
      throw ApplicationFailure.nonRetryable(err.message || 'Validation failed');
    }

    throw ApplicationFailure.retryable(err.message || 'Database error');
  }
}

async function sendSalaryEmail({ email, month, netSalary }) {
  try {
    await sendSalaryCreditedEmail({ email, month, netSalary });
  } catch (err) {
    console.error('Activity sendSalaryEmail failed:', err);
    throw ApplicationFailure.retryable(
      err.message || 'Failed to send salary notification email'
    );
  }
}

module.exports = {
  saveSalaryToMongoDB,
  sendSalaryEmail
};


