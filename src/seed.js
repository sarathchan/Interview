require('dotenv').config();

const bcrypt = require('bcryptjs');

const { connectDB } = require('./db');
const User = require('./models/User');
const Salary = require('./models/Salary');

async function seed() {
  await connectDB();

  console.log('Seeding users and salaries...');

  await User.deleteMany({});
  await Salary.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const users = await User.insertMany([
    {
      name: 'HR User',
      email: 'hr@example.com',
      passwordHash,
      role: 'HR'
    },
    {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMIN'
    },
    {
      name: 'Employee User',
      email: 'employee@example.com',
      passwordHash,
      role: 'EMPLOYEE'
    }
  ]);

  const employee = users.find((u) => u.role === 'EMPLOYEE');

  if (employee) {
    await Salary.create({
      userId: employee._id.toString(),
      email: employee.email,
      month: '2026-03',
      basic: 50000,
      hra: 20000,
      allowance: 5000,
      deductions: 3000,
      netSalary: 72000,
      status: 'CREDITED'
    });
  }

  console.log('Seed completed.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});



