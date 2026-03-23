// src/App.tsx
import React, { Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AuthPage from "./components/auth/AuthPage";
import SessionExpiredModal from "./components/ui/common/SessionExpiredModal";
import Spinner from "./components/ui/Spinner";
import UnsupportedDevice from "./components/ui/UnsupportedDevice";
import { useApp } from "./contexts/AppContext";
import { routes } from "./routes/routeConfig";
import { SESSION_EXPIRED_EVENT } from "./utils/apiConnector";
import { canAccessModule, getAccessibleModules } from "./utils/roleAccess";

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "travox-at";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <Spinner size="lg" />
  </div>
);

// Auth guard wrapper component
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Role-based access guard
const RequireAccess: React.FC<{ 
  module: string; 
  children: React.ReactNode 
}> = ({ module, children }) => {
  const { currentUser } = useApp();
  const accessibleModules = getAccessibleModules(currentUser?.role);
  
  if (!canAccessModule(currentUser?.role, module as never)) {
    // Redirect to first accessible module
    const defaultPath = accessibleModules[0] ? `/${accessibleModules[0]}` : "/customers";
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
};

// Public route guard (redirects authenticated users away from auth page)
const PublicOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  const { currentUser } = useApp();
  const accessibleModules = getAccessibleModules(currentUser?.role);

  if (token) {
    const defaultPath = accessibleModules[0] ? `/${accessibleModules[0]}` : "/customers";
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
};

// Default redirect component
const DefaultRedirect: React.FC = () => {
  const { currentUser } = useApp();
  const accessibleModules = getAccessibleModules(currentUser?.role);
  const defaultPath = accessibleModules[0] ? `/${accessibleModules[0]}` : "/customers";
  
  return <Navigate to={defaultPath} replace />;
};

// Session expired modal wrapper
const SessionExpiredHandler: React.FC = () => {
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionExpired = () => {
      setShowSessionExpired(true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const handleLogin = () => {
    setShowSessionExpired(false);
    navigate("/", { replace: true });
  };

  return (
    <SessionExpiredModal
      isOpen={showSessionExpired}
      onLogin={handleLogin}
    />
  );
};

export default function App() {
  const isMobile = useIsMobile();
  const [showUnsupportedDevice, setShowUnsupportedDevice] = useState(() => {
    // Check if user has chosen to continue on mobile
    const continueOnMobile = localStorage.getItem('travox-continue-mobile');
    return isMobile && continueOnMobile !== 'true';
  });

  const handleContinueOnMobile = () => {
    localStorage.setItem('travox-continue-mobile', 'true');
    setShowUnsupportedDevice(false);
  };

  // Show unsupported device message on mobile
  if (showUnsupportedDevice) {
    return <UnsupportedDevice onContinue={handleContinueOnMobile} />;
  }

  return (
    <BrowserRouter>
      <SessionExpiredHandler />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public auth route at root */}
          <Route
            path="/"
            element={
              <PublicOnly>
                <AuthPage />
              </PublicOnly>
            }
          />

          {/* Protected routes */}
          {routes.map(({ path, module, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={
                <RequireAuth>
                  <RequireAccess module={module}>
                    <Component />
                  </RequireAccess>
                </RequireAuth>
              }
            />
          ))}

          {/* Catch-all redirect to first accessible module */}
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
