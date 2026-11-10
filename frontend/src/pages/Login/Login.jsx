import "./Login.css";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useAuth } from "../../context/useAuth";
import { useBranding } from "../../context/useBranding";

export default function Login() {
  const { user, login } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@clinic.com");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState("superadmin");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const result = login(email, password, role);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="login-page">
      <section className="login-visual">
        <div className="login-visual-brand">
          <div className="brand-symbol large">
            {branding.logo ? (
              <img src={branding.logo} alt="Clinic logo" />
            ) : (
              <Activity size={30} />
            )}
          </div>
          <span>{branding.clinicName || "Your Clinic"}</span>
        </div>

        <div className="login-visual-content">
          <span className="eyebrow">
            <ShieldCheck size={15} /> CLINIC MANAGEMENT PLATFORM
          </span>

          <h1>Better care starts with better management.</h1>

          <p>
            A smarter way to manage patients, appointments and your clinic's
            daily operations — all in one place.
          </p>

          <div className="login-feature-list">
            <div>
              <Users size={19} />
              <span>Centralized patient management</span>
            </div>
            <div>
              <ShieldCheck size={19} />
              <span>Secure role-based access</span>
            </div>
            <div>
              <Activity size={19} />
              <span>Simplified clinic operations</span>
            </div>
          </div>
        </div>

        <div className="login-visual-footer">
          <span>Healthcare operations, simplified.</span>
          <span>© 2026</span>
        </div>
      </section>

      <section className="login-form-section">
        <div className="login-form-wrapper">
          <div className="login-mobile-brand">
            <div className="brand-symbol">
              {branding.logo ? (
                <img src={branding.logo} alt="Clinic logo" />
              ) : (
                <Activity size={24} />
              )}
            </div>
            <strong>{branding.clinicName || "Your Clinic"}</strong>
          </div>

          <div className="login-heading">
            <span className="login-welcome">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>Enter your details to access your clinic workspace.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="role">Account type</label>

            <div className="role-selector">
              <button
                type="button"
                className={role === "superadmin" ? "selected" : ""}
                onClick={() => setRole("superadmin")}
              >
                <ShieldCheck size={18} />
                Super Admin
              </button>

              <button
                type="button"
                className={role === "receptionist" ? "selected" : ""}
                onClick={() => setRole("receptionist")}
              >
                <Users size={18} />
                Receptionist
              </button>
            </div>

            <label htmlFor="email">Email address</label>
            <div className="input-wrapper">
              <Mail size={19} />
              <input
                id="email"
                type="email"
                placeholder="name@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <LockKeyhole size={19} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button className="login-submit" type="submit">
              Sign in to workspace
              <ArrowRight size={19} />
            </button>
          </form>

          <div className="login-security">
            <LockKeyhole size={15} />
            Your workspace is protected by secure authentication.
          </div>

          <p className="login-footer">Powered by Clinic Management System</p>
        </div>
      </section>
    </div>
  );
}
