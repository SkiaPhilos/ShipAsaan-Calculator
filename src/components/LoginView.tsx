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
  CheckCircle2,
  Clock,
  Mail,
  UserPlus,
  Building2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { AppUser } from "../types";
import { LocalStorageManager } from "../db/localStore";

interface LoginViewProps {
  onLoginSuccess: (user: AppUser) => void;
}

const env = (import.meta as any).env || {};
const ADMIN_EMAIL = (env.VITE_ADMIN_EMAIL || env.ADMIN_EMAIL || "skylerisbusy@gmail.com").trim();

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isPendingApprovalNotice, setIsPendingApprovalNotice] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Signup form state
  const [signupFullName, setSignupFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupDepartment, setSignupDepartment] = useState("Operations");
  const [signupRole, setSignupRole] = useState<"operator" | "auditor">("operator");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupSuccessData, setSignupSuccessData] = useState<{
    fullName: string;
    email: string;
    username: string;
  } | null>(null);

  // -------------------------------------------------------------
  // LOGIN SUBMIT HANDLER
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsPendingApprovalNotice(null);

    const identifier = loginIdentifier.trim();
    const pass = loginPassword.trim();

    if (!identifier || !pass) {
      setLoginError("Please enter your email or username and password.");
      return;
    }

    setIsLoggingIn(true);

    try {
      // 1. Call Backend Authentication Endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername: identifier,
          password: pass,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const rawText = await response.text();
        const snippet = rawText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
        throw new Error(`Authentication server returned HTTP ${response.status} (${response.statusText || "Error"}): ${snippet || "Non-JSON response"}`);
      }

      const data = await response.json();

      if (response.ok && data.ok && data.user) {
        // Authenticated successfully
        LocalStorageManager.setLoggedInUser(data.user);
        LocalStorageManager.addSecurityAuditLog({
          action: "USER_LOGIN",
          user: data.user.username,
          timestamp: new Date().toISOString(),
          result: "Successful",
          details: `User ${data.user.fullName} (${data.user.email}) logged in with role: ${data.user.role}.`,
        });
        onLoginSuccess(data.user);
        return;
      }

      // Check if user is blocked because status is pending_approval
      if (response.status === 403 && data.status === "pending_approval") {
        setIsPendingApprovalNotice(
          data.error ||
            `Your account is pending administrator approval. An email notification has been dispatched to ${ADMIN_EMAIL}.`
        );
        return;
      }

      // If user is rejected
      if (response.status === 403 && data.status === "rejected") {
        setLoginError(
          "Your account registration has been declined by the system administrator."
        );
        return;
      }

      // Other authentication errors
      setLoginError(data.error || "Invalid username/email or password.");
    } catch (netErr: any) {
      console.error("Authentication server request failed:", netErr);
      setLoginError(
        netErr?.message || "Unable to reach the authentication server. Please check network connectivity and backend deployment."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // -------------------------------------------------------------
  // SIGNUP SUBMIT HANDLER
  // -------------------------------------------------------------
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    const fullName = signupFullName.trim();
    const email = signupEmail.trim();
    const username = signupUsername.trim();
    const password = signupPassword.trim();
    const confirmPass = signupConfirmPassword.trim();

    if (!fullName || !email || !username || !password) {
      setSignupError("Please fill out all required fields.");
      return;
    }

    if (password.length < 6) {
      setSignupError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPass) {
      setSignupError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSigningUp(true);

    try {
      // Call Backend Signup Endpoint
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          username,
          password,
          department: signupDepartment,
          role: signupRole,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const rawText = await response.text();
        const snippet = rawText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
        throw new Error(`Registration server returned HTTP ${response.status} (${response.statusText || "Error"}): ${snippet || "Non-JSON response"}`);
      }

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setSignupError(data.error || "Failed to register account.");
        setIsSigningUp(false);
        return;
      }

      // Also persist to client-side store (WITHOUT storing password)
      const newUser: AppUser = {
        id: data.user?.id || `usr-${Date.now()}`,
        fullName,
        email,
        username,
        role: signupRole,
        department: signupDepartment,
        status: "pending_approval",
        createdAt: new Date().toISOString(),
        lastLoginAttempt: "Signup submitted",
        lastLoginStatus: "PENDING_APPROVAL",
      };
      LocalStorageManager.addRegisteredUser(newUser);

      // Record audit and local email notification
      LocalStorageManager.addSecurityAuditLog({
        action: "CONFIG_UPDATE",
        user: username,
        timestamp: new Date().toISOString(),
        result: "Successful",
        details: `New user registration submitted: ${fullName} (${email}). Status: PENDING_APPROVAL.`,
      });

      LocalStorageManager.addAdminNotification({
        id: `notif-${Date.now()}`,
        type: "USER_SIGNUP_ALERT",
        to: ADMIN_EMAIL,
        from: "notifications@shipasaan.com",
        subject: `🔔 [Ship Asaan] New User Signup: ${fullName} (${email})`,
        body: `A new user ${fullName} (${email}, @${username}) has registered and is pending approval in Settings.`,
        timestamp: new Date().toISOString(),
        deliveredVia: "system_mailer",
        read: false,
      });

      // Show success screen
      setSignupSuccessData({
        fullName,
        email,
        username,
      });
    } catch (err: any) {
      console.error("Signup failed:", err);
      setSignupError("Could not complete registration. Please check your network and try again.");
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div
      id="ship-asaan-auth-container"
      className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4 sm:p-6"
    >
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-purple-950 px-6 py-7 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-900 border border-purple-700/50 mb-3 shadow-inner">
            <Package className="w-6 h-6 text-lime-400" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Ship Asaan</h1>
          <p className="text-xs text-purple-200 mt-1">
            Tariff Intelligence & Logistics Operating System
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-900/60 rounded-full text-[11px] text-purple-300 border border-purple-800">
            <ShieldCheck className="w-3 h-3 text-lime-400" />
            <span>Role-Based Access Control & Approvals</span>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 border-b border-stone-200 bg-stone-50 text-xs font-semibold">
          <button
            id="tab-btn-signin"
            type="button"
            onClick={() => {
              setAuthMode("login");
              setLoginError(null);
              setIsPendingApprovalNotice(null);
            }}
            className={`py-3 text-center transition-colors flex items-center justify-center gap-1.5 ${
              authMode === "login"
                ? "bg-white text-purple-950 border-b-2 border-purple-900 font-bold shadow-2xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            id="tab-btn-signup"
            type="button"
            onClick={() => {
              setAuthMode("signup");
              setSignupError(null);
              setSignupSuccessData(null);
            }}
            className={`py-3 text-center transition-colors flex items-center justify-center gap-1.5 ${
              authMode === "signup"
                ? "bg-white text-purple-950 border-b-2 border-purple-900 font-bold shadow-2xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: SIGN IN                                           */}
        {/* ========================================================= */}
        {authMode === "login" && (
          <div className="p-6 sm:p-8">
            <div className="mb-5">
              <h2 className="text-base font-bold text-stone-900">Sign in to workspace</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Enter your registered credentials or administrator login.
              </p>
            </div>

            {/* Pending Approval Warning Notice */}
            {isPendingApprovalNotice && (
              <div
                id="notice-pending-approval"
                className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5"
              >
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Account Pending Administrator Approval</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {isPendingApprovalNotice}
                </p>
                <div className="pt-1 flex items-center gap-1 text-[10px] text-amber-700">
                  <Mail className="w-3 h-3" />
                  <span>Notification dispatched to: <strong>{ADMIN_EMAIL}</strong></span>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {loginError && (
              <div
                id="alert-login-error"
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email-username"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email-username"
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter your email or username"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-stone-900 font-sans"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-input-password"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-input-password"
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-9 pr-10 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-stone-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-submit-signin"
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 px-4 bg-purple-900 hover:bg-purple-950 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {isLoggingIn ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to System</span>
                    <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-xs text-stone-500">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className="font-bold text-purple-900 hover:underline"
                >
                  Sign up & request access
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: SIGN UP                                           */}
        {/* ========================================================= */}
        {authMode === "signup" && (
          <div className="p-6 sm:p-8">
            {signupSuccessData ? (
              /* Success & Pending Approval State */
              <div className="space-y-4 py-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="text-base font-bold text-stone-900">Registration Submitted!</h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Your account has been created and placed in the <strong>Pending Approval</strong> queue.
                  </p>
                </div>

                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl text-xs space-y-2 text-stone-700">
                  <div className="flex items-center gap-2 font-bold text-purple-950">
                    <Mail className="w-4 h-4 text-purple-700" />
                    <span>Administrator Notified via Email</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-stone-600">
                    A notification has been dispatched to <strong>{ADMIN_EMAIL}</strong> with your user details:
                  </p>
                  <ul className="text-[11px] list-disc list-inside space-y-0.5 text-stone-700 font-medium pl-1">
                    <li>Name: <strong>{signupSuccessData.fullName}</strong></li>
                    <li>Email: <strong>{signupSuccessData.email}</strong></li>
                    <li>Username: <strong>@{signupSuccessData.username}</strong></li>
                  </ul>
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                    Once the administrator opens Settings and approves your account, you will be able to log in with your chosen password.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier(signupSuccessData.email);
                    setAuthMode("login");
                    setSignupSuccessData(null);
                  }}
                  className="w-full py-2.5 px-4 bg-purple-900 hover:bg-purple-950 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Signup Form */
              <div>
                <div className="mb-4">
                  <h2 className="text-base font-bold text-stone-900">Request New Account</h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Sign up for workspace access. The administrator will be notified to review and approve your account.
                  </p>
                </div>

                {signupError && (
                  <div
                    id="alert-signup-error"
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{signupError}</span>
                  </div>
                )}

                <form onSubmit={handleSignupSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      id="signup-fullname"
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-stone-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Work Email *
                      </label>
                      <input
                        id="signup-email"
                        type="email"
                        required
                        placeholder="alex@company.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Username *
                      </label>
                      <input
                        id="signup-username"
                        type="text"
                        required
                        placeholder="alexm"
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-stone-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Department
                      </label>
                      <input
                        id="signup-department"
                        type="text"
                        placeholder="e.g. Logistics Ops"
                        value={signupDepartment}
                        onChange={(e) => setSignupDepartment(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Desired Role
                      </label>
                      <select
                        id="signup-role"
                        value={signupRole}
                        onChange={(e) => setSignupRole(e.target.value as any)}
                        className="w-full px-2 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-stone-900"
                      >
                        <option value="operator">Operator (Quotes & Tariffs)</option>
                        <option value="auditor">Auditor (Review & Verification)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Password (min 6 chars) *
                      </label>
                      <div className="relative">
                        <input
                          id="signup-password"
                          type={showSignupPassword ? "text" : "password"}
                          required
                          placeholder="Create password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="w-full px-3 pr-8 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-stone-900 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute inset-y-0 right-0 pr-2 flex items-center text-stone-400 hover:text-stone-600"
                        >
                          {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        id="signup-confirm-password"
                        type={showSignupPassword ? "text" : "password"}
                        required
                        placeholder="Retype password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-stone-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="btn-submit-signup"
                      type="submit"
                      disabled={isSigningUp}
                      className="w-full py-2.5 px-4 bg-purple-900 hover:bg-purple-950 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {isSigningUp ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Create Account & Request Approval</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-xs text-stone-500">
                    Already have an approved account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className="font-bold text-purple-900 hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-100/60 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
          <span>Version 2.4.0 (Enterprise)</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            Admin Approval Required
          </span>
        </div>
      </div>
    </div>
  );
};
