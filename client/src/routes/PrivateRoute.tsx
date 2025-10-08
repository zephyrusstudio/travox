import React from "react";
import { Navigate } from "react-router-dom";

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
    const token = sessionStorage.getItem("token");

    if (!token) {
      return <Navigate to="/auth" />;
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `PrivateRoute(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
};

export default PrivateRoute;
