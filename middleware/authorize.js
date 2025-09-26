// Simple RBAC authorize middleware
const User = require('../models/User');

module.exports = function authorize(...roles) {
  return async function(req, res, next) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const user = await User.findById(req.userId);
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.user = user; // attach full user if needed
      next();
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Authorization failed' });
    }
  }
}
