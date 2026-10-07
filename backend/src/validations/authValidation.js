const Joi = require('joi');

const emailSchema = Joi.string().email().required().messages({
  'string.base': "L'email doit être une chaîne de caractères.",
  'string.empty': "L'email est requis.",
  'string.email': "L'email doit être une adresse valide.",
  'any.required': "L'email est requis.",
});

const register = Joi.object({
  full_name: Joi.string().min(2).max(255).required().messages({
    'string.base': 'Le nom complet doit être une chaîne de caractères.',
    'string.empty': 'Le nom complet est requis.',
    'string.min': 'Le nom complet doit contenir au moins {#limit} caractères.',
    'string.max': 'Le nom complet ne doit pas dépasser {#limit} caractères.',
    'any.required': 'Le nom complet est requis.',
  }),
  email: emailSchema,
  password: Joi.string().min(8).required().messages({
    'string.base': 'Le mot de passe doit être une chaîne de caractères.',
    'string.empty': 'Le mot de passe est requis.',
    'string.min': 'Le mot de passe doit contenir au moins {#limit} caractères.',
    'any.required': 'Le mot de passe est requis.',
  }),
});

const login = Joi.object({
  email: emailSchema,
  password: Joi.string().required().messages({
    'string.base': 'Le mot de passe doit être une chaîne de caractères.',
    'string.empty': 'Le mot de passe est requis.',
    'any.required': 'Le mot de passe est requis.',
  }),
});

module.exports = { register, login };
