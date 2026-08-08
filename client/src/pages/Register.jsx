
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { registerUser } from "../services/authService";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      return "All fields are required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email)) {
      return "Please enter a valid email";
    }

    if (form.password.length < 8) {
      return "Password must be at least 8 characters";
    }

    if (form.password !== form.confirmPassword) {
      return "Passwords do not match";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
      };

      const res = await registerUser(payload);

      toast.success(
        res.message || "Registration successful. Check your email for the OTP."
      );

      // Send the user's email to the OTP page
      navigate("/verify-otp", {
        state: {
          email: form.email,
        },
      });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Registration failed";

      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">
        Create your CodeTrack account
      </h1>

      <p className="text-sm text-muted-foreground mb-6">
        Register to start tracking your competitive programming progress.
      </p>

      {error && (
        <div className="mb-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">
            Full name
          </label>

          <Input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Jane Doe"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">
            Email
          </label>

          <Input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">
            Password
          </label>

          <Input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="********"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">
            Confirm Password
          </label>

          <Input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="********"
            disabled={loading}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </div>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <a
          className="text-primary"
          href="/login"
        >
          Sign in
        </a>
      </p>
    </div>
  );
}

export default Register;

