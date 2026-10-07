const bcrypt = require('bcrypt');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sobro.cm';

exports.seed = async function (knex) {
  const existing = await knex('users').where({ email: ADMIN_EMAIL }).first();
  if (existing) return;

  // Jamais de mot de passe en clair dans le dépôt : il vient de backend/.env.
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error('ADMIN_PASSWORD manquant ou trop court (12 caractères minimum) : renseignez-le dans backend/.env.');
  }

  const password_hash = await bcrypt.hash(password, 10);
  await knex('users').insert({
    email: ADMIN_EMAIL,
    password_hash,
    full_name: 'Administrateur SOBRO',
    role: 'admin',
  });
};
