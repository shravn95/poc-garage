import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { authService } from "../services/authService";
import type { ApiEnvelope, LoginResponseData } from "../types";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<ApiEnvelope<LoginResponseData> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const res = await authService.login(value);
        setResult(res);
        navigate({ to: "/user" });
      } catch (err) {
        setError((err as Error).message);
      }
    },
  });

  return (
    <div>
      <h2>Login</h2>
      <p>Fill either username or email, plus password.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        {(["email", "password"] as const).map((name) => (
          <form.Field key={name} name={name}>
            {(field) => (
              <div>
                <label htmlFor={field.name}>{field.name}</label>
                <input
                  id={field.name}
                  type={name === "password" ? "password" : "text"}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>
        ))}

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          )}
        </form.Subscribe>
      </form>

      {error && <p>Error: {error}</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
