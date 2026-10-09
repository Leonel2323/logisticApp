import { Link } from 'react-router-dom';

export default function BookingNew() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Nouveau booking</h1>
      <p className="mt-2 text-slate-500">Cette page sera bientôt disponible.</p>
      <Link
        to="/bookings"
        className="mt-4 inline-block text-sm font-medium text-slate-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        ← Retour à la liste des bookings
      </Link>
    </div>
  );
}
