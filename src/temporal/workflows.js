const { proxyActivities, ApplicationFailure } = require('@temporalio/workflow');

const activities = proxyActivities({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2
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
    // Mark as application failure so it is visible in Temporal UI with a clear type,
    // retries are already governed by the retry policy above.
    throw ApplicationFailure.nonRetryable(
      err.message || 'creditSalaryWorkflow failed',
      'CreditSalaryWorkflowFailure'
    );
  }
}

exports.creditSalaryWorkflow = creditSalaryWorkflow;


