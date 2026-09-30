import { useLayoutEffect, useRef, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { supabase } from "../../lib/supabase";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null);
  const caretRef = useRef(null);

  // Switching between hidden/shown resets the cursor in some browsers —
  // put it back where it was so typing carries on in the right place.
  useLayoutEffect(() => {
    const input = passwordRef.current;
    const caret = caretRef.current;
    if (!input || !caret) return undefined;
    caretRef.current = null;
    const restore = () => {
      input.focus();
      input.setSelectionRange(caret.start, caret.end);
    };
    // Make the browser rebuild the box now, so the cursor we set sticks.
    void input.offsetWidth;
    restore();
    return undefined;
  }, [showPassword]);

  const togglePassword = () => {
    const input = passwordRef.current;
    if (input && document.activeElement === input) {
      caretRef.current = { start: input.selectionStart, end: input.selectionEnd };
    }
    setShowPassword((shown) => !shown);
  };
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowPassword(false);
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

      <div className="cms-field">
        <label className="cms-label" htmlFor="cms-password">
          Password
        </label>
        <div className="cms-password">
          <input
            ref={passwordRef}
            id="cms-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="cms-input"
            autoComplete="current-password"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="cms-password-toggle"
            onClick={togglePassword}
            // Keep the cursor in the password box while toggling.
            onMouseDown={(e) => e.preventDefault()}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            aria-controls="cms-password"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
          </button>
        </div>
      </div>

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
