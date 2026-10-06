import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Clients() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    api.get('/clients').then(({ data }) => setClients(data.data || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Clients</h1>
      <p className="mt-2 text-slate-500">{clients.length} client(s)</p>
    </div>
  );
}
