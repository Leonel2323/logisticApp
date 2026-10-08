import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Containers() {
  const navigate = useNavigate();
  const [containers, setContainers] = useState([]);

  useEffect(() => {
    api.get('/containers').then(({ data }) => setContainers(data.data?.containers ?? []));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-800">Containers</h1>
        <button
          type="button"
          onClick={() => navigate('/containers/new')}
          className="min-h-11 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          Nouveau conteneur
        </button>
      </div>
      <p className="mt-2 text-slate-500">{containers.length} conteneur(s)</p>
    </div>
  );
}
