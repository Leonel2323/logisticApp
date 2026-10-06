const Joi = require('joi');

const create = Joi.object({
  vehicle_id: Joi.number().integer().positive().allow(null),
  quantity_liters: Joi.number().positive().required(),
  amount: Joi.number().positive().required(),
  mileage: Joi.number().integer().positive().allow(null),
  station: Joi.string().max(100).allow('', null),
  transaction_date: Joi.date().iso().required(),
});

const update = create.fork(
  ['quantity_liters', 'amount', 'transaction_date'],
  (field) => field.optional()
);

module.exports = { create, update };
