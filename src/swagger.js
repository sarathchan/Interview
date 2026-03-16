const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Salary Credit API',
    version: '1.0.0',
    description:
      'API for crediting salaries using Temporal workflows, backed by MongoDB'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      CreditSalaryRequest: {
        type: 'object',
        required: [
          'userId',
          'email',
          'month',
          'basic',
          'hra',
          'allowance',
          'deductions'
        ],
        properties: {
          userId: {
            type: 'string',
            example: 'user-123'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          month: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}$',
            example: '2026-03',
            description: 'Salary month in YYYY-MM format'
          },
          basic: {
            type: 'number',
            example: 50000
          },
          hra: {
            type: 'number',
            example: 20000
          },
          allowance: {
            type: 'number',
            example: 5000
          },
          deductions: {
            type: 'number',
            example: 3000
          }
        }
      },
      CreditSalaryResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          workflowId: {
            type: 'string',
            example: 'salary-user-123-2026-03'
          },
          result: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                example: 'CREDITED'
              },
              netSalary: {
                type: 'number',
                example: 72000
              }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Validation error'
          }
        }
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: ['src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;



