import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authService } from "../services/authService";
import { tokenService } from "../services/tokenService";
import type { User } from "../types";

export const Route = createFileRoute("/user")({
  beforeLoad: () => {
    if (!tokenService.getAccess()) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async (): Promise<User> => {
    try {
      const res = await authService.currentUser();
      return res.data;
    } catch {
      tokenService.clear();
      throw redirect({ to: "/login" });
    }
  },
  pendingComponent: () => <p>Loading current user...</p>,
  component: UserPage,
});

function UserPage() {
  const user = Route.useLoaderData();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    setIsLoggingOut(true);
    try {
      await authService.logout();
      navigate({ to: "/login" });
    } catch (err) {
      // Even if the server call fails, the token is likely stale/expired —
      // clear locally so the user isn't stuck on a broken "logged in" screen
      tokenService.clear();
      setError((err as Error).message);
      navigate({ to: "/login" });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div>
      <h2>Current User</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>

      <button onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? "Logging out..." : "Logout"}
      </button>

      {error && (
        <p>
          Note: server logout failed ({error}), but you've been signed out
          locally.
        </p>
      )}
    </div>
  );
}
