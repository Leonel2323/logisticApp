const Joi = require('joi');

const create = Joi.object({
  account_number: Joi.string().min(1).max(10).required(),
  name: Joi.string().min(2).max(255).required(),
  short_name: Joi.string().max(100).allow('', null),
  nature: Joi.string().valid('BILAN', 'CHARGE', 'PRODUIT').allow(null),
  sens: Joi.string().valid('DEBIT', 'CREDIT', 'BOTH').allow(null),
});

const update = create.fork(['account_number', 'name'], (field) => field.optional());

module.exports = { create, update };
