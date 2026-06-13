const express = require('express');
const passport = require('passport');
let GoogleStrategy;
try{ GoogleStrategy = require('passport-google-oauth20').Strategy }catch(e){GoogleStrategy=null}
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User } = require('../models');

const router = express.Router();

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && GoogleStrategy) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ where: { providerId: profile.id } });
      if (!user) {
        user = await User.create({ provider: 'google', providerId: profile.id, email: profile.emails[0].value, name: profile.displayName });
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));

  router.get('/google', passport.authenticate('google', { scope: ['profile','email'] }));

  router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    // If opened from a popup, postMessage token to opener and close.
    const payload = { token, user: req.user };
    const html = `<!doctype html><html><body><script>
      try{window.opener.postMessage(${JSON.stringify(payload)}, '*');}catch(e){}
      document.write('<p>Authentication successful. You can close this window.</p>');
      setTimeout(()=>window.close(),1000);
    </script></body></html>`;
    res.send(html);
  });
} else {
  // Fallback endpoints when Google OAuth isn't configured
  router.get('/google', (req, res) => res.status(501).json({ error: 'Google OAuth not configured' }));
  router.get('/google/callback', (req, res) => res.status(501).json({ error: 'Google OAuth not configured' }));
}

// Local registration (for dev/local users)
router.post('/local-register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || 'donor', provider: 'local' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Local login
router.post('/local-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password || '');
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
