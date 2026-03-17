const { proxyActivities, ApplicationFailure } = require('@temporalio/workflow');

const activities = proxyActivities({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumInterval: '30s'
  }
});

async function creditSalaryWorkflow(payload) {
  try {
    const { userId, email, month, basic, hra, allowance, deductions } =
      payload;

    const { netSalary } = await activities.saveSalaryToMongoDB({
      userId,
      email,
      month,
      basic,
      hra,
      allowance,
      deductions
    });

    await activities.sendSalaryEmail({ email, month, netSalary });

    return { status: 'CREDITED', netSalary };
  } catch (err) {
    // Preserve root cause: activity failure puts real message in cause
    const message = err.cause?.message || err.message || 'Credit salary workflow failed';
    throw ApplicationFailure.nonRetryable(message, 'CreditSalaryWorkflowFailure');
  }
}

exports.creditSalaryWorkflow = creditSalaryWorkflow;


