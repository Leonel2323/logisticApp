const Joi = require('joi');

const create = Joi.object({
  container_id: Joi.number().integer().positive().allow(null),
  client_id: Joi.number().integer().positive().allow(null),
  quantity: Joi.number().integer().positive().required(),
  unit_price: Joi.number().positive().required(),
  total_amount: Joi.number().positive().required(),
  sale_date: Joi.date().iso().required(),
});

const update = create.fork(
  ['quantity', 'unit_price', 'total_amount', 'sale_date'],
  (field) => field.optional()
);

module.exports = { create, update };
