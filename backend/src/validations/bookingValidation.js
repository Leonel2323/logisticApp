const Joi = require('joi');

const create = Joi.object({
  booking_number: Joi.string().min(2).max(50).required(),
  shipping_company: Joi.string().min(2).max(100).required(),
  client_id: Joi.number().integer().positive().allow(null),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().allow(null),
  status: Joi.string().valid('en_cours', 'cloture', 'retard').default('en_cours'),
});

const update = create.fork(
  ['booking_number', 'shipping_company', 'start_date'],
  (field) => field.optional()
);

module.exports = { create, update };
