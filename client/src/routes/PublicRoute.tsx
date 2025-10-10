import React from "react";
import { Navigate } from "react-router-dom";

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
    const token = localStorage.getItem("token") ?? sessionStorage.getItem("token");

    if (token) {
      return <Navigate to={"/"} replace />;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `PublicRoute(${
    Component.displayName || Component.name || "Component"
  })`;

  return WrappedComponent;
};

export default PublicRoute;
