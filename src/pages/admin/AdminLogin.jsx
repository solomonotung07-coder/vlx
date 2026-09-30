import { useState } from "react";
import { supabase } from "../../lib/supabase";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : signInError.message,
      );
    }
  };

  return (
    <form className="cms-form" onSubmit={handleSubmit} noValidate>
      <h1 className="cms-auth-title">Rentals CMS</h1>
      <p className="cms-muted">
        Sign in to manage the Featured Rentals on the website.
      </p>

      <label className="cms-field">
        <span className="cms-label">Email</span>
        <input
          type="email"
          placeholder="example@gmail.com"
          className="cms-input"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </label>

      <label className="cms-field">
        <span className="cms-label">Password</span>
        <input
          type="password"
          placeholder="Enter your password"
          className="cms-input"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {error && (
        <p className="cms-alert" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="cms-btn cms-btn-primary cms-btn-block"
        disabled={submitting || !email || !password}
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>

      {/* <p className="cms-hint cms-center-text">You’ll stay signed in for 30 minutes.</p> */}

      <a href="/" className="cms-link cms-center-text">
        ← Back to website
      </a>
    </form>
  );
};

export default AdminLogin;
