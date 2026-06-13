const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function authMiddleware(req, res, next){
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if(!token) return res.status(401).json({ error: 'Missing token' });
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findByPk(payload.id);
    if(!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  }catch(err){return res.status(401).json({ error: 'Invalid token' })}
}

module.exports = authMiddleware;
