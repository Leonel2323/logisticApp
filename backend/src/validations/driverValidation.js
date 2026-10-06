const Joi = require('joi');

const create = Joi.object({
  first_name: Joi.string().min(2).max(100).required(),
  last_name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().max(20).allow('', null),
  email: Joi.string().email().allow('', null),
  permit_number: Joi.string().max(50).allow('', null),
  permit_category: Joi.string().max(10).allow('', null),
  permit_expiry: Joi.date().iso().allow(null),
});

const update = create.fork(['first_name', 'last_name'], (field) => field.optional());

module.exports = { create, update };
