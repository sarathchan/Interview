const express = require('express');

const { auth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', auth(['HR', 'ADMIN']), async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .lean()
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: users.length,
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role
      }))
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
