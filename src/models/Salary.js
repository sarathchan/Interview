const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/
    },
    basic: {
      type: Number,
      required: true,
      min: 0
    },
    hra: {
      type: Number,
      required: true,
      min: 0
    },
    allowance: {
      type: Number,
      required: true,
      min: 0
    },
    deductions: {
      type: Number,
      required: true,
      min: 0
    },
    grossSalary: {
      type: Number,
      required: true,
      min: 0
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['CREDITED', 'FAILED'],
      default: 'CREDITED'
    },
    creditedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

salarySchema.index({ userId: 1, month: 1 }, { unique: true });

const Salary = mongoose.model('Salary', salarySchema);

module.exports = Salary;


