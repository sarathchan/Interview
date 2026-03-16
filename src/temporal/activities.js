const Salary = require('../models/Salary');
const { sendSalaryCreditedEmail } = require('../services/emailService');

// These are real activity implementations that will run in the worker process.

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
      const err = new Error('Net salary cannot be negative');
      err.name = 'NetSalaryValidationError';
      throw err;
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
    throw err;
  }
}

async function sendSalaryEmail({ email, month, netSalary }) {
  try {
    await sendSalaryCreditedEmail({ email, month, netSalary });
  } catch (err) {
    console.error('Activity sendSalaryEmail failed:', err);
    throw err;
  }
}

module.exports = {
  saveSalaryToMongoDB,
  sendSalaryEmail
};


