import React from "react";
import { Navigate } from "react-router-dom";

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "travox-at";

/**
 * Higher-order component (HOC) for private routes.
 * Redirects users to the login page if not authenticated.
 *
 * @param Component - The protected component.
 * @returns The wrapped component or redirect.
 */

const PrivateRoute = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => {
    const token = localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
      return <Navigate to="/" replace />;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `PrivateRoute(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
};

export default PrivateRoute;
