const Joi = require('joi');

const excel = Joi.object({
  mode: Joi.string().valid('preview', 'commit').default('preview').messages({
    'any.only': 'Le mode doit être « preview » ou « commit ».',
  }),
});

module.exports = { excel };
