require('dotenv').config();

const { Worker } = require('@temporalio/worker');
const path = require('path');

const { connectDB } = require('../db');
const activities = require('./activities');

async function run() {
  await connectDB();

  const worker = await Worker.create({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    workflowsPath: path.join(__dirname, 'workflows.js'),
    activities,
    taskQueue: 'salary-queue'
  });

  console.log('Temporal worker started on task queue "salary-queue"');
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


