






import React, { useState } from "react";
import api from "../api";
import bgGif from "../assets/bg.gif"; 
import './Login.css'

function Login() {
  const [data, setData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    setData({ ...data, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setApiError("");
  }

  function validate() {
    const errs = {};
    if (!data.email) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(data.email)) errs.email = "Enter a valid email.";
    if (!data.password) errs.password = "Password is required.";
    return errs;
  }

  async function handleLogin() {
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);

      const res = await api.post("/login", formData);
      const result = res.data;

      localStorage.setItem("token", result.access_token);
      if (result.companies) {
        if (Array.isArray(result.companies)) {
          localStorage.setItem("company_id", result.companies[0].id);
        } else {
          localStorage.setItem("company_id", result.companies.id);
        }
      }

      window.location.href = "/users";
    } catch (err) {
      setApiError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const isValid = data.email.length > 0 && data.password.length > 0;

  return (
    <div className="login-page" style={{ backgroundImage: `url(${bgGif})` }}>

      <div className="login-logo">LOGO</div>

      <div className="login-box">
        <h2 className="login-title">Sign in</h2>
        <p className="login-subtitle">Log in to manage your account</p>

        {apiError && <p className="error-msg">{apiError}</p>}

      
        <div className="form-group">
          <label>Email</label>
          <div className="input-wrapper">
            <span className="input-icon"></span>
            <input
              type="text"
              name="email"
              placeholder="Enter your email"
              value={data.email}
              onChange={handleChange}
            />
          </div>
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

       
        <div className="form-group">
          <label>Password</label>
          <div className="input-wrapper">
            <span className="input-icon"></span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              value={data.password}
              onChange={handleChange}
            />
            <span
              className="input-icon-right"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

       
        <div className="login-row">
          <label className="remember-me">
            <input type="checkbox" defaultChecked />
            Remember me
          </label>
          <a href="#" className="forgot-link">Forgot password ?</a>
        </div>

        <button
          className="login-btn"
          disabled={!isValid || loading}
          onClick={handleLogin}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </div>
    </div>
  );
}

export default Login;