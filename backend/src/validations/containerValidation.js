const Joi = require('joi');

const create = Joi.object({
  container_number: Joi.string().min(2).max(50).required(),
  type: Joi.string().valid('40FT', '20FT', '10FT').required(),
  state: Joi.string().valid('PLEIN', 'VIDE').required(),
  merchandise: Joi.string().max(255).allow('', null),
  booking_id: Joi.number().integer().positive().allow(null),
  client_id: Joi.number().integer().positive().allow(null),
  is_processed: Joi.boolean().default(false),
  arrival_datetime: Joi.date().iso().allow(null),
  departure_datetime: Joi.date().iso().allow(null),
});

const update = create.fork(['container_number', 'type', 'state'], (field) => field.optional());

module.exports = { create, update };
