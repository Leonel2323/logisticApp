import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Bookings from '../pages/Bookings';
import Containers from '../pages/Containers';
import Clients from '../pages/Clients';
import Vehicles from '../pages/Vehicles';
import Drivers from '../pages/Drivers';
import Fuel from '../pages/Fuel';
import Layout from '../components/Layout';
import PrivateRoute from '../components/PrivateRoute';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/containers" element={<Containers />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/fuel" element={<Fuel />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
