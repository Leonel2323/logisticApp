const Joi = require('joi');

const create = Joi.object({
  container_number: Joi.string().alphanum().min(4).max(50).required().messages({
    'string.alphanum': 'Le numéro de conteneur doit être alphanumérique.',
    'string.empty': 'Le numéro de conteneur est requis.',
    'any.required': 'Le numéro de conteneur est requis.',
  }),
  type: Joi.string().valid('40FT', '20FT', '10FT').required().messages({
    'any.only': 'Le type doit être 40FT, 20FT ou 10FT.',
    'any.required': 'Le type est requis.',
  }),
  state: Joi.string().valid('PLEIN', 'VIDE').required().messages({
    'any.only': "L'état doit être PLEIN ou VIDE.",
    'any.required': "L'état est requis.",
  }),
  merchandise: Joi.string().max(255).allow('', null),
  booking_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Le booking est requis.',
    'any.required': 'Le booking est requis.',
  }),
  client_id: Joi.number().integer().positive().allow(null),
  arrival_datetime: Joi.date().iso().allow(null).messages({
    'date.base': "La date d'arrivée doit être une date valide.",
    'date.format': "La date d'arrivée doit être au format ISO 8601.",
  }),
});

const update = create.fork(['container_number', 'type', 'state', 'booking_id'], (field) => field.optional());

const list = Joi.object({
  type: Joi.string().valid('40FT', '20FT', '10FT'),
  state: Joi.string().valid('PLEIN', 'VIDE'),
  booking_id: Joi.number().integer().positive(),
  client_id: Joi.number().integer().positive(),
  is_processed: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const markProcessed = Joi.object({
  vehicle_id: Joi.number().integer().positive().allow(null),
  driver_id: Joi.number().integer().positive().allow(null),
});

module.exports = { create, update, list, markProcessed };
