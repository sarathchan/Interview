require('dotenv').config();

const bcrypt = require('bcryptjs');

const { connectDB } = require('./db');
const User = require('./models/User');
const Salary = require('./models/Salary');

const DEFAULT_PASSWORD = 'Password123!';

const SEED_USERS = [
  { name: 'HR User', email: 'hr@example.com', role: 'HR' },
  { name: 'Admin User', email: 'admin@example.com', role: 'ADMIN' },
  { name: 'Employee User', email: 'employee@example.com', role: 'EMPLOYEE' },
  { name: 'John Doe', email: 'john@example.com', role: 'EMPLOYEE' },
  { name: 'Jane Smith', email: 'jane@example.com', role: 'EMPLOYEE' }
];

const SEED_SALARIES = [
  { basic: 50000, hra: 20000, allowance: 5000, deductions: 3000 },
  { basic: 60000, hra: 24000, allowance: 6000, deductions: 4000 },
  { basic: 45000, hra: 18000, allowance: 4000, deductions: 2500 }
];

async function seed() {
  await connectDB();

  console.log('Seeding users and salaries...');

  await User.deleteMany({});
  await Salary.deleteMany({});

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const users = await User.insertMany(
    SEED_USERS.map((u) => ({
      ...u,
      passwordHash
    }))
  );

  const employees = users.filter((u) => u.role === 'EMPLOYEE');

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const sal = SEED_SALARIES[i % SEED_SALARIES.length];
    const grossSalary = sal.basic + sal.hra + sal.allowance;
    const netSalary = grossSalary - sal.deductions;

    await Salary.create({
      userId: emp._id.toString(),
      email: emp.email,
      month: '2026-03',
      ...sal,
      grossSalary,
      netSalary,
      status: 'CREDITED'
    });
  }

  console.log(`Seeded ${users.length} users and ${employees.length} salary records.`);
  console.log('Login: hr@example.com / admin@example.com / employee@example.com — password: Password123!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});



