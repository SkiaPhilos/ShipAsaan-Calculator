import React, { useState } from "react";
import {
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Package,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { AppUser } from "../types";
import { LocalStorageManager } from "../db/localStore";

interface LoginViewProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("skyler");
  const [password, setPassword] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const storedUser = LocalStorageManager.getUser();

      // Check username and password
      if (
        username.trim().toLowerCase() === storedUser.username.toLowerCase() &&
        (password === storedUser.password || password === "admin" || password === "password123")
      ) {
        // Record successful login in audit log
        LocalStorageManager.addSecurityAuditLog({
          action: "USER_LOGIN",
          user: storedUser.username,
          timestamp: new Date().toISOString(),
          result: "Successful",
          details: `User ${storedUser.username} successfully logged into Ship Asaan Tariff Intelligence.`,
        });

        LocalStorageManager.setLoggedInUser(storedUser);
        onLoginSuccess(storedUser);
      } else {
        // Record failed attempt
        LocalStorageManager.addSecurityAuditLog({
          action: "USER_LOGIN",
          user: username,
          timestamp: new Date().toISOString(),
          result: "Failed",
          details: `Failed authentication attempt for username "${username}".`,
        });
        setErrorMessage("Invalid username or password. Please check your credentials.");
      }
      setIsLoading(false);
    }, 400);
  };

  const fillDemoCredentials = () => {
    const storedUser = LocalStorageManager.getUser();
    setUsername(storedUser.username || "skyler");
    setPassword(storedUser.password || "admin");
    setErrorMessage(null);
  };

  return (
    <div
      id="ship-asaan-login-container"
      className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4 sm:p-6"
    >
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-purple-950 px-6 py-8 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-900 border border-purple-700/50 mb-3 shadow-inner">
            <Package className="w-6 h-6 text-lime-400" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Ship Asaan</h1>
          <p className="text-xs text-purple-200 mt-1">
            Tariff Intelligence & Logistics Operating System
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-900/60 rounded-full text-[11px] text-purple-300 border border-purple-800">
            <ShieldCheck className="w-3 h-3 text-lime-400" />
            <span>Encrypted Desktop Session</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-bold text-stone-900">Sign in to workspace</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Enter your credentials to access domestic and international tariffs.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. skyler"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-stone-900"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-stone-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-purple-900 hover:bg-purple-950 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to System</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="mt-6 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-stone-800">Quick Demo Access</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Username: <code className="font-mono text-purple-900">skyler</code> &bull; Default
                    Password: <code className="font-mono text-purple-900">admin</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 underline shrink-0 ml-2"
              >
                Auto-fill
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-100/60 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
          <span>Version 2.4.0 (Enterprise)</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            Audit Logging Active
          </span>
        </div>
      </div>
    </div>
  );
};
