// Plan comptable SYSCOHADA révisé (sous-ensemble représentatif pour une SARL
// de transport/logistique). Référentiel, pas un jeu de données aléatoire.
const ACCOUNTS = [
  // Classe 1 — Comptes de capitaux (BILAN, normalement créditeurs)
  ['101', 'Capital social', 'Capital social', 'BILAN', 'CREDIT'],
  ['106', 'Réserves', 'Réserves', 'BILAN', 'CREDIT'],
  ['120', "Résultat de l'exercice (bénéfice)", 'Résultat bénéficiaire', 'BILAN', 'CREDIT'],
  ['129', "Résultat de l'exercice (perte)", 'Résultat déficitaire', 'BILAN', 'DEBIT'],
  ['161', 'Emprunts auprès des établissements de crédit', 'Emprunts bancaires', 'BILAN', 'CREDIT'],

  // Classe 2 — Comptes d'actif immobilisé (BILAN, normalement débiteurs)
  ['2182', 'Matériel de transport', 'Matériel de transport', 'BILAN', 'DEBIT'],
  ['2183', 'Matériel de bureau et informatique', 'Matériel bureau/info', 'BILAN', 'DEBIT'],
  ['28182', 'Amortissements du matériel de transport', 'Amort. matériel transport', 'BILAN', 'CREDIT'],

  // Classe 3 — Comptes de stocks (BILAN, débiteurs)
  ['31', 'Marchandises', 'Stocks marchandises', 'BILAN', 'DEBIT'],
  ['32', 'Matières premières et fournitures liées', 'Matières premières', 'BILAN', 'DEBIT'],

  // Classe 4 — Comptes de tiers (BILAN, sens variable)
  ['401', 'Fournisseurs', 'Fournisseurs', 'BILAN', 'CREDIT'],
  ['411', 'Clients', 'Clients', 'BILAN', 'DEBIT'],
  ['421', 'Personnel, avances et acomptes', 'Avances personnel', 'BILAN', 'DEBIT'],
  ['431', 'Sécurité sociale', 'CNPS', 'BILAN', 'CREDIT'],
  ['4434', 'État, TVA facturée', 'TVA collectée', 'BILAN', 'CREDIT'],
  ['4456', 'État, TVA déductible', 'TVA déductible', 'BILAN', 'DEBIT'],
  ['444', 'État, impôts sur les bénéfices', 'Impôts sur bénéfices', 'BILAN', 'CREDIT'],

  // Classe 5 — Comptes de trésorerie (BILAN, débiteurs en usage courant)
  ['521', 'Banques', 'Banque', 'BILAN', 'DEBIT'],
  ['571', 'Caisse', 'Caisse', 'BILAN', 'DEBIT'],

  // Classe 6 — Comptes de charges (CHARGE, débiteurs)
  ['601', 'Achats de marchandises', 'Achats marchandises', 'CHARGE', 'DEBIT'],
  ['6051', 'Eau', 'Eau', 'CHARGE', 'DEBIT'],
  ['6052', 'Électricité', 'Électricité', 'CHARGE', 'DEBIT'],
  ['6053', 'Fournitures non stockables - Carburants et lubrifiants', 'GASOIL', 'CHARGE', 'DEBIT'],
  ['6054', "Fournitures d'entretien", 'Entretien', 'CHARGE', 'DEBIT'],
  ['6061', 'Fournitures de bureau', 'Fournitures bureau', 'CHARGE', 'DEBIT'],
  ['611', 'Transports sur achats', 'Transport achats', 'CHARGE', 'DEBIT'],
  ['614', 'Transports du personnel', 'Transport personnel', 'CHARGE', 'DEBIT'],
  ['616', 'Assurances', 'Assurances', 'CHARGE', 'DEBIT'],
  ['622', "Rémunérations d'intermédiaires et honoraires", 'Honoraires', 'CHARGE', 'DEBIT'],
  ['624', 'Entretien, réparations et maintenance', 'Entretien véhicules', 'CHARGE', 'DEBIT'],
  ['628', 'Divers (frais bancaires, etc.)', 'Frais divers', 'CHARGE', 'DEBIT'],
  ['631', 'Impôts et taxes directs', 'Impôts et taxes', 'CHARGE', 'DEBIT'],
  ['641', 'Charges de personnel - Salaires', 'Salaires', 'CHARGE', 'DEBIT'],
  ['646', 'Charges sociales', 'Charges sociales', 'CHARGE', 'DEBIT'],
  ['661', "Charges d'intérêts", 'Intérêts', 'CHARGE', 'DEBIT'],
  ['681', "Dotations aux amortissements", 'Amortissements', 'CHARGE', 'DEBIT'],

  // Classe 7 — Comptes de produits (PRODUIT, créditeurs)
  ['701', 'Ventes de marchandises', 'Ventes marchandises', 'PRODUIT', 'CREDIT'],
  ['706', 'Services vendus (transport, logistique)', 'Prestations logistique', 'PRODUIT', 'CREDIT'],
  ['707', 'Produits accessoires', 'Produits accessoires', 'PRODUIT', 'CREDIT'],
  ['758', 'Produits divers', 'Produits divers', 'PRODUIT', 'CREDIT'],
  ['781', "Reprises d'amortissements", 'Reprises amortissements', 'PRODUIT', 'CREDIT'],
];

exports.seed = async function (knex) {
  await knex.transaction(async (trx) => {
    await trx('chart_of_accounts').del();
    const rows = ACCOUNTS.map(([account_number, name, short_name, nature, sens]) => ({
      account_number,
      name,
      short_name,
      nature,
      sens,
    }));
    await trx.batchInsert('chart_of_accounts', rows, 50);
  });
};
