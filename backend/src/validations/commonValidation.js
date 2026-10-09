const Joi = require('joi');

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': "L'identifiant doit être un nombre.",
    'number.integer': "L'identifiant doit être un entier.",
    'number.positive': "L'identifiant doit être un entier positif.",
    'any.required': "L'identifiant est requis.",
  }),
});

module.exports = { idParamSchema };
