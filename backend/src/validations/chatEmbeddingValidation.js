const Joi = require('joi');

const create = Joi.object({
  content: Joi.string().min(1).required(),
  embedding: Joi.array().items(Joi.number()).length(384).allow(null),
  metadata: Joi.object().allow(null),
});

const update = create.fork(['content'], (field) => field.optional());

module.exports = { create, update };
