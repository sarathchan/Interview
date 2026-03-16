require('dotenv').config();
require('express-async-errors');

const express = require('express');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const { connectDB } = require('./db');
const payrollRoutes = require('./routes/payroll');
const authRoutes = require('./routes/auth');
const swaggerSpec = require('./swagger');

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payroll', payrollRoutes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});


