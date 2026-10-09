const { create, update } = require('../clientValidation');

const BASE = { code: 'CLI0051', name: 'CLIENT ALPHA' };

describe('clientValidation — téléphones (2 maximum)', () => {
  it('accepts a second phone number', () => {
    const { error } = create.validate({ ...BASE, phone: '699000115', phone_2: '699000116' });

    expect(error).toBeUndefined();
  });

  it('rejects a second phone identical to the first', () => {
    const { error } = create.validate({ ...BASE, phone: '699000115', phone_2: '699000115' });

    expect(error.details[0].message).toBe('Le second numéro doit être différent du premier.');
  });

  it('rejects a second phone longer than 20 characters', () => {
    const { error } = create.validate({ ...BASE, phone: '699000115', phone_2: '6'.repeat(21) });

    expect(error.details[0].message).toBe('Le second numéro ne doit pas dépasser 20 caractères.');
  });

  it('allows updating only the second phone', () => {
    const { error } = update.validate({ phone_2: '699000116' });

    expect(error).toBeUndefined();
  });
});
