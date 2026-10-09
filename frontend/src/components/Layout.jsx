import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/bookings', label: 'Bookings' },
  { to: '/containers', label: 'Containers' },
  { to: '/clients', label: 'Clients' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/drivers', label: 'Drivers' },
  { to: '/fuel', label: 'Fuel' },
  { to: '/import', label: 'Import Excel', adminOnly: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const visibleLinks = links.filter((link) => !link.adminOnly || user?.role === 'admin');

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-slate-900 text-white flex flex-col">
        <div className="px-4 py-5 text-lg font-semibold border-b border-slate-700">
          SOBRO Logistics
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm ${
                  isActive ? 'bg-slate-700' : 'hover:bg-slate-800'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="m-2 rounded px-3 py-2 text-sm text-left hover:bg-slate-800"
        >
          Déconnexion
        </button>
      </aside>
      <main className="flex-1 bg-slate-50 p-6">
        <Outlet />
      </main>
    </div>
  );
}
