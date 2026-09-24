import React, { useState } from "react";
import { Phone, Lock, LogIn } from "lucide-react";
import { api } from "../api";

export default function LoginScreen({ onLogin }) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
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
      await api.login(mobile.trim(), password);
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
              style={{ paddingLeft: 34 }}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
        </div>

        <button className="btn btn-green" onClick={handleLogin} disabled={submitting}>
          <LogIn size={16} /> {submitting ? "Signing in…" : "Login"}
        </button>
      </div>
    </div>
  );
}
