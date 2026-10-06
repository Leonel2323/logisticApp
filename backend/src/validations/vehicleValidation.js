const Joi = require('joi');

const create = Joi.object({
  plate_number: Joi.string().min(2).max(50).required(),
  type: Joi.string().valid('TRACTEUR', 'REMORQUE', 'CAMION').required(),
  driver_id: Joi.number().integer().positive().allow(null),
  status: Joi.string().valid('disponible', 'en_mission', 'maintenance').default('disponible'),
});

const update = create.fork(['plate_number', 'type'], (field) => field.optional());

module.exports = { create, update };
