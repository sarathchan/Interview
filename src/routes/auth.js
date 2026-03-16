const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Sign up a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "HR User"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "hr@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123!"
 *               role:
 *                 type: string
 *                 enum: [HR, ADMIN, EMPLOYEE]
 *                 example: "HR"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation or email already exists
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, email and password are required'
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'EMPLOYEE'
    });

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(201).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in and obtain JWT
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "hr@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123!"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;



