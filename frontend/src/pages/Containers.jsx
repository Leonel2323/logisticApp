import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Containers() {
  const [containers, setContainers] = useState([]);

  useEffect(() => {
    api.get('/containers').then(({ data }) => setContainers(data.data || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Containers</h1>
      <p className="mt-2 text-slate-500">{containers.length} conteneur(s)</p>
    </div>
  );
}
