import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Bookings from '../pages/Bookings';
import BookingNew from '../pages/BookingNew';
import BookingDetail from '../pages/BookingDetail';
import BookingEdit from '../pages/BookingEdit';
import Containers from '../pages/Containers';
import ContainerNew from '../pages/ContainerNew';
import Clients from '../pages/Clients';
import Vehicles from '../pages/Vehicles';
import Drivers from '../pages/Drivers';
import Fuel from '../pages/Fuel';
import ImportExcel from '../pages/ImportExcel';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import PrivateRoute from '../components/PrivateRoute';
import { useAuth } from '../context/AuthContext';

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/new" element={<BookingNew />} />
            <Route path="/bookings/:id" element={<BookingDetail />} />
            <Route path="/bookings/:id/edit" element={<BookingEdit />} />
            <Route path="/containers" element={<Containers />} />
            <Route path="/containers/new" element={<ContainerNew />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/fuel" element={<Fuel />} />
            <Route path="/import" element={<ImportExcel />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
