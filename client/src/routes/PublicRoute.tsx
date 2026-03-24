import React from "react";
import { Navigate } from "react-router-dom";

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "travox-at";

/**
 * Higher-order component (HOC) for public routes.
 * Redirects logged-in users to the dashboard.
 *
 * @param Component - The public component.
 * @returns The wrapped component or redirect.
 */

const PublicRoute = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => {
    const token = localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);

    if (token) {
      return <Navigate to="/customers" replace />;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `PublicRoute(${
    Component.displayName || Component.name || "Component"
  })`;

  return WrappedComponent;
};

export default PublicRoute;
