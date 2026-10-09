const Joi = require('joi');

const create = Joi.object({
  booking_number: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Le numéro de booking est requis.',
    'any.required': 'Le numéro de booking est requis.',
  }),
  shipping_company: Joi.string().min(2).max(100).required().messages({
    'string.empty': "La compagnie maritime est requise.",
    'any.required': "La compagnie maritime est requise.",
  }),
  client_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Le client est requis.',
    'any.required': 'Le client est requis.',
  }),
  start_date: Joi.date().iso().required().messages({
    'date.base': 'La date de début doit être une date valide.',
    'any.required': 'La date de début est requise.',
  }),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).allow(null).messages({
    'date.min': 'La date de fin doit être postérieure ou égale à la date de début.',
  }),
  status: Joi.string().valid('en_cours', 'cloture', 'retard').default('en_cours'),
});

const update = create.fork(
  ['booking_number', 'shipping_company', 'client_id', 'start_date'],
  (field) => field.optional()
);

const list = Joi.object({
  status: Joi.string().valid('en_cours', 'cloture', 'retard'),
  shipping_company: Joi.string().min(1).max(100),
  client_id: Joi.number().integer().positive(),
  search: Joi.string().min(1).max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { create, update, list };
