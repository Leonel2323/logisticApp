import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Fuel() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    api.get('/fuel').then(({ data }) => setTransactions(data.data || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">Fuel</h1>
      <p className="mt-2 text-slate-500">{transactions.length} transaction(s)</p>
    </div>
  );
}
