const jwt = require('jsonwebtoken');

function signAuthToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function signResetToken(userId) {
  return jwt.sign({ id: userId, purpose: 'password_reset' }, process.env.JWT_RESET_SECRET, {
    expiresIn: process.env.JWT_RESET_EXPIRES_IN || '15m',
  });
}

function verifyResetToken(token) {
  return jwt.verify(token, process.env.JWT_RESET_SECRET);
}

module.exports = { signAuthToken, signResetToken, verifyResetToken };
