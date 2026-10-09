const ALMOST_DONE_PCT = 80;

function percentage(done, planned) {
  return planned === 0 ? 0 : Math.round((done / planned) * 100);
}

function withBalance({ qte_bk, qte_enl }) {
  const solde = qte_bk - qte_enl;
  return { qte_bk, qte_enl, solde, pct: percentage(qte_enl, qte_bk) };
}

/**
 * Construit la réponse de GET /bookings/:id/stats à partir des lignes agrégées
 * par type renvoyées par bookingModel.getStats (une ligne par type, booking
 * répété sur chaque ligne). Retourne null si aucune ligne (booking introuvable).
 */
function buildBookingStats(rows) {
  if (!rows || rows.length === 0) return null;

  const [first] = rows;

  const details = rows.map((row) => ({ type: row.type, ...withBalance(row) }));

  const total = withBalance(
    details.reduce(
      (acc, detail) => ({ qte_bk: acc.qte_bk + detail.qte_bk, qte_enl: acc.qte_enl + detail.qte_enl }),
      { qte_bk: 0, qte_enl: 0 }
    )
  );

  return {
    booking: {
      id: first.id,
      booking_number: first.booking_number,
      shipping_company: first.shipping_company,
      client: first.client_id ? { id: first.client_id, name: first.client_name } : null,
      start_date: first.start_date,
      end_date: first.end_date,
      status: first.status,
    },
    details,
    total,
    alerts: {
      is_late: total.solde > 0 && first.is_past_end_date === true,
      is_almost_done: total.solde > 0 && total.pct >= ALMOST_DONE_PCT,
      is_empty: total.qte_bk === 0,
    },
  };
}

module.exports = { buildBookingStats };
