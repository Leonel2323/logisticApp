import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    api.get('/drivers').then(({ data }) => setDrivers(data.data || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Drivers</h1>
      <p className="mt-2 text-slate-500">{drivers.length} chauffeur(s)</p>
    </div>
  );
}
