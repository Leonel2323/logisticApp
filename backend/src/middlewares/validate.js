const { failure } = require('../utils/apiResponse');

/**
 * Builds an Express middleware that validates `req[source]` against a Joi schema.
 * @param {import('joi').Schema} schema
 * @param {'body'|'query'|'params'} source
 */
function validate(schema, source = 'body') {
  return async (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return failure(res, message, 400);
    }

    req[source] = value;
    return next();
  };
}

module.exports = validate;
