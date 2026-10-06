const Joi = require('joi');

const create = Joi.object({
  transaction_type: Joi.string().valid('IN', 'OUT').required(),
  amount: Joi.number().positive().required(),
  balance_after: Joi.number().allow(null),
  description: Joi.string().max(255).allow('', null),
  beneficiary: Joi.string().max(255).allow('', null),
  reference: Joi.string().max(100).allow('', null),
  transaction_date: Joi.date().iso().required(),
});

const update = create.fork(['transaction_type', 'amount', 'transaction_date'], (field) => field.optional());

module.exports = { create, update };
