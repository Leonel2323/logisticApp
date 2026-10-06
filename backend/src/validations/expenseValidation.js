const Joi = require('joi');

const create = Joi.object({
  account_number: Joi.string().min(1).max(10).required(),
  account_name: Joi.string().max(255).allow('', null),
  details: Joi.string().max(255).allow('', null),
  amount: Joi.number().positive().required(),
  expense_date: Joi.date().iso().required(),
});

const update = create.fork(['account_number', 'amount', 'expense_date'], (field) => field.optional());

module.exports = { create, update };
