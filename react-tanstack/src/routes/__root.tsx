import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <React.Fragment>
      <nav>
        <Link to="/">Home</Link> | <Link to="/register">Register</Link> |{" "}
        <Link to="/login">Login</Link> | <Link to="/user">User</Link> |{" "}
      </nav>
      <Outlet />
    </React.Fragment>
  );
}
