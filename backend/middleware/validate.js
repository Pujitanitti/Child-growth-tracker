const { validationResult } = require('express-validator');

/**
 * Runs after an array of express-validator checks on a route. Collects any
 * validation failures into a single, consistent 400 response so controllers
 * never have to think about input validation themselves.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = validate;
