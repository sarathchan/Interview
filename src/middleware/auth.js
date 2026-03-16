const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function auth(requiredRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing'
      });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;

      if (
        requiredRoles.length &&
        (!payload.role || !requiredRoles.includes(payload.role))
      ) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      return next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  };
}

module.exports = { auth, JWT_SECRET };



