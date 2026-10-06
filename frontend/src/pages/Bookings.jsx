import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.get('/bookings').then(({ data }) => setBookings(data.data || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Bookings</h1>
      <p className="mt-2 text-slate-500">{bookings.length} réservation(s)</p>
    </div>
  );
}
