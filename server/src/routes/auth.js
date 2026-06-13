const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const router = express.Router();

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

module.exports = router;
