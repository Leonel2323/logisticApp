import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    api.get('/vehicles').then(({ data }) => setVehicles(data.data || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Vehicles</h1>
      <p className="mt-2 text-slate-500">{vehicles.length} véhicule(s)</p>
    </div>
  );
}
