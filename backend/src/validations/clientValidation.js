const Joi = require('joi');

const create = Joi.object({
  code: Joi.string().min(2).max(20).required(),
  name: Joi.string().min(2).max(255).required(),
  type: Joi.string().valid('client', 'fournisseur', 'salarie').allow(null),
  phone: Joi.string().max(20).allow('', null),
  // 2 numéros maximum par client : phone + phone_2 (différent du premier).
  phone_2: Joi.string()
    .max(20)
    .allow('', null)
    .invalid(Joi.ref('phone'))
    .messages({
      'string.max': 'Le second numéro ne doit pas dépasser 20 caractères.',
      'any.invalid': 'Le second numéro doit être différent du premier.',
    }),
  email: Joi.string().email().allow('', null),
  country: Joi.string().max(100).allow('', null),
  region: Joi.string().max(100).allow('', null),
  city: Joi.string().max(100).allow('', null),
  street: Joi.string().max(255).allow('', null),
});

const update = create.fork(['code', 'name'], (field) => field.optional());

module.exports = { create, update };
