const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  let token;
  const authHeader = req.headers['authorization'];
  
  if (authHeader) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token; // Fallback for SSE or other non-header requests
  }

  if (!token) {
    return res.status(403).json({ message: 'No token provided or invalid format' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized, token failed' });
  }
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRole,
};
