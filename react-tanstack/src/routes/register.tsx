import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { authService } from "../services/authService";
import type { ApiEnvelope, User } from "../types";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<ApiEnvelope<User> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const { confirmPassword, ...payload } = value;
        const res = await authService.register(payload);
        setResult(res);
        navigate({ to: "/login" });
      } catch (err) {
        setError((err as Error).message);
      }
    },
  });

  return (
    <div>
      <h2>Register</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        {(["username", "email", "password"] as const).map((name) => (
          <form.Field
            key={name}
            name={name}
            validators={{
              onChange: ({ value }) => {
                if (!value) return `${name} is required`;
                if (name === "email" && !EMAIL_REGEX.test(value)) {
                  return "Enter a valid email address";
                }
                if (name === "password" && value.length < 8) {
                  return "Password must be at least 8 characters";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div>
                <label htmlFor={field.name}>{field.name}</label>
                <input
                  id={field.name}
                  name={field.name}
                  type={name === "password" ? "password" : "text"}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.isTouched &&
                  field.state.meta.errors.map((err) => <p key={err}>{err}</p>)}
              </div>
            )}
          </form.Field>
        ))}

        <form.Field
          name="confirmPassword"
          validators={{
            onChangeListenTo: ["password"],
            onChange: ({ value, fieldApi }) => {
              if (value !== fieldApi.form.getFieldValue("password")) {
                return "Passwords do not match";
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name}>confirm password</label>
              <input
                id={field.name}
                name={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.isTouched &&
                field.state.meta.errors.map((err) => <p key={err}>{err}</p>)}
            </div>
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          )}
        </form.Subscribe>
      </form>

      {error && <p>Error: {error}</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
