import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Bienvenue{user?.full_name ? `, ${user.full_name}` : ''}
        </h1>
        <p className="mt-2 text-slate-500">Dashboard en construction.</p>
      </div>
      <button
        onClick={logout}
        className="shrink-0 self-start rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Déconnexion
      </button>
    </div>
  );
}
