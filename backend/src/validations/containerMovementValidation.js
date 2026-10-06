const Joi = require('joi');

const create = Joi.object({
  container_id: Joi.number().integer().positive().allow(null),
  movement_type: Joi.string().valid('IN', 'OUT').required(),
  movement_datetime: Joi.date().iso().required(),
  vehicle_id: Joi.number().integer().positive().allow(null),
  driver_id: Joi.number().integer().positive().allow(null),
});

const update = create.fork(['movement_type', 'movement_datetime'], (field) => field.optional());

module.exports = { create, update };
