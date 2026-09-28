import { Routes, Route, Navigate } from 'react-router-dom';

import PrivateRoute from './components/common/PrivateRoute';
import Login from './pages/Login/Login';

import Dashboard from './pages/Dashboard/Dashboard';
import DisasterList from './pages/Disasters/DisasterList';
import DisasterCreate from './pages/Disasters/DisasterCreate';
import DisasterDetail from './pages/Disasters/DisasterDetail';
import LocationList from './pages/Locations/LocationList';
import LocationCreate from './pages/Locations/LocationCreate';
import ResourceTypes from './pages/Resources/ResourceTypes';
import ResourceCenters from './pages/Resources/ResourceCenters';
import Inventory from './pages/Resources/Inventory';
import AddInventory from './pages/Resources/AddInventory';
import RequestList from './pages/Requests/RequestList';
import RequestCreate from './pages/Requests/RequestCreate';
import RequestDetail from './pages/Requests/RequestDetail';
import RecommendationList from './pages/Allocation/RecommendationList';
import RecommendationDetail from './pages/Allocation/RecommendationDetail';
import ApprovalPage from './pages/Allocation/ApprovalPage';
import TeamList from './pages/Teams/TeamList';
import DispatchList from './pages/Dispatch/DispatchList';
import DeliveryUpdate from './pages/Dispatch/DeliveryUpdate';
import WeightConfig from './pages/Admin/WeightConfig';
import AuditLogs from './pages/Admin/AuditLogs';
import UserManagement from './pages/Admin/UserManagement';
import Reports from './pages/Reports/Reports';
import AlgorithmComparison from './pages/Reports/AlgorithmComparison';

function Private({ children }) {
  return <PrivateRoute>{children}</PrivateRoute>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route path="/dashboard"            element={<Private><Dashboard /></Private>} />

      <Route path="/disasters"            element={<Private><DisasterList /></Private>} />
      <Route path="/disasters/create"     element={<Private><DisasterCreate /></Private>} />
      <Route path="/disasters/:id"        element={<Private><DisasterDetail /></Private>} />

      <Route path="/locations"            element={<Private><LocationList /></Private>} />
      <Route path="/locations/create"     element={<Private><LocationCreate /></Private>} />

      <Route path="/resources/types"      element={<Private><ResourceTypes /></Private>} />
      <Route path="/resources/centers"    element={<Private><ResourceCenters /></Private>} />
      <Route path="/resources/inventory"  element={<Private><Inventory /></Private>} />
      <Route path="/resources/inventory/add" element={<Private><AddInventory /></Private>} />

      <Route path="/requests"             element={<Private><RequestList /></Private>} />
      <Route path="/requests/create"      element={<Private><RequestCreate /></Private>} />
      <Route path="/requests/:id"         element={<Private><RequestDetail /></Private>} />

      <Route path="/allocation"           element={<Private><RecommendationList /></Private>} />
      <Route path="/allocation/:id"       element={<Private><RecommendationDetail /></Private>} />
      <Route path="/allocation/:id/review" element={<Private><ApprovalPage /></Private>} />

      <Route path="/teams"                element={<Private><TeamList /></Private>} />

      <Route path="/dispatch"             element={<Private><DispatchList /></Private>} />
      <Route path="/dispatch/:id/deliver" element={<Private><DeliveryUpdate /></Private>} />

      <Route path="/reports"              element={<Private><Reports /></Private>} />
      <Route path="/reports/comparison"   element={<Private><AlgorithmComparison /></Private>} />

      <Route path="/admin/weights"        element={<Private><WeightConfig /></Private>} />
      <Route path="/admin/audit-logs"     element={<Private><AuditLogs /></Private>} />
      <Route path="/admin/users"          element={<Private><UserManagement /></Private>} />

      {/* Catch-all → login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
