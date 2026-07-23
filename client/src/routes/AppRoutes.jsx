import { Routes, Route, Navigate } from "react-router-dom";
import Settings from "../pages/Settings";
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyEmail from "../pages/VerifyEmail";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import Analytics from "../pages/Analytics";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import Contests from "../pages/Contests";

function AppRoutes() {

  return (

    <Routes>

      {/* Public Routes */}

      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<Login />}
      />
<Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <Analytics />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/settings"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <Settings />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/contests"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <Contests />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />


      {/* Protected Routes */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>

            <DashboardLayout>

              <Dashboard />

            </DashboardLayout>

          </ProtectedRoute>
        }
      />


      <Route
        path="/profile"
        element={
          <ProtectedRoute>

            <DashboardLayout>

              <Profile />

            </DashboardLayout>

          </ProtectedRoute>
        }
      />


    </Routes>

  );

}


export default AppRoutes;