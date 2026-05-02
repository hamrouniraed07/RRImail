const AppError = require('../utils/AppError');

/**
 * Validates request against a Joi schema
 * @param {Object} schema - Joi schema with optional body, query, params keys
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message })));
      }
    }

    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message })));
      }
    }

    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message })));
      }
    }

    if (errors.length > 0) {
      return next(new AppError('Validation failed', 422, errors));
    }

    next();
  };
};

module.exports = validate;
