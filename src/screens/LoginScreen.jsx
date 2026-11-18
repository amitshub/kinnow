import React, { useState } from "react";
import { Phone, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { api } from "../api";

export default function LoginScreen({ onLogin }) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!mobile.trim() || !password) {
      setError("Enter your mobile number and password");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.login(mobile.trim(), password, remember);
      const me = await api.me();
      onLogin(me);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-logo">
        <img src="/logo.webp" alt="Shiv Bhola Group" />
        <div className="brand">KinnowERP</div>
        <div className="tag">Packhouse Management</div>
      </div>

      <div className="login-card">
        <div className="login-title">Sign in</div>
        <div className="login-sub">Enter your mobile number and password to continue</div>

        {error && <div className="login-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Mobile Number</label>
          <div style={{ position: "relative" }}>
            <Phone size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)" }} />
            <input
              className="form-control"
              style={{ paddingLeft: 34 }}
              type="tel"
              placeholder="9XXXXXXXXX"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: "relative" }}>
            <Lock size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)" }} />
            <input
              className="form-control"
              style={{ paddingLeft: 34, paddingRight: 40 }}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: 8, cursor: "pointer", color: "var(--text-4)", display: "flex" }}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2, #374151)", margin: "2px 0 16px", cursor: "pointer" }}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--green)" }} />
          Remember me (stay signed in for 30 days)
        </label>

        <button className="btn btn-green" onClick={handleLogin} disabled={submitting}>
          <LogIn size={16} /> {submitting ? "Signing in…" : "Login"}
        </button>
      </div>
    </div>
  );
}
