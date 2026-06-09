const jwt = require('jsonwebtoken');
const dbService = require('../models/dbService');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretpizzaappkey123');
    const user = await dbService.User.findOne({ [global.dbFallback ? 'id' : '_id']: decoded.id });

    if (!user) {
      return res.status(401).json({ message: 'User not found or token invalid.' });
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate.' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
};

module.exports = { auth, admin };
