/* eslint-disable @typescript-eslint/no-explicit-any */
import { Plane } from "lucide-react";
import { apiRequest } from "../../utils/apiConnector";

// src/pages/AuthPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId: string;
  isNewUser: boolean;
  avatar?: string;
};

type AuthResponse = {
  status: "success";
  data: { accessToken: string; user: AuthUser };
};

if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  throw new Error("Missing VITE_GOOGLE_CLIENT_ID env variable");
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "token";

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const btnRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load GIS and init
  useEffect(() => {
    if ((window as any).google?.accounts?.id) return; // already present
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => {
      if (!(window as any).google?.accounts?.id) {
        setErr("Google Sign-In unavailable");
        return;
      }
      initGis();
    };
    s.onerror = () => setErr("Failed to load Google Sign-In");
    document.head.appendChild(s);
    return () => {
      // optional cleanup
      (window as any).google?.accounts?.id?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize and render the button
  const initGis = () => {
    const google = (window as any).google;
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: onGoogleCredential,
      ux_mode: "popup",
    });
    if (btnRef.current) {
      google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 320,
      });
    }
  };

  // Handle Google ID token -> backend
  const onGoogleCredential = async (resp: { credential?: string }) => {
    const idToken = resp?.credential;
    if (!idToken) {
      setErr("Missing Google credential");
      return;
    }
    try {
      setLoading(true);
      setErr(null);
      const data = await apiRequest<AuthResponse>({
        url: "/auth/google",
        method: "POST",
        data: { idToken },
      });
      const accessToken = data?.data?.accessToken;
      const user = data?.data?.user;

      if (!accessToken) throw new Error("No access token returned");

      // persist token for guards and API
      localStorage.setItem(TOKEN_KEY, accessToken);
      sessionStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("user", JSON.stringify(user));

      navigate("/", { replace: true });
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // If the script was already present when mounted
  useEffect(() => {
    if ((window as any).google?.accounts?.id) initGis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [btnRef.current]);

  return (
    <div className="min-h-screen grid place-items-center bg-white p-4">
      <div
        role="main"
        aria-busy={loading}
        className="max-w-md px-4 py-12 shadow-2xl overflow-hidden relative bg-cover bg-center rounded-2xl border-gray-400 border-4"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1548266652-99cf27701ced')",
        }}
      >
        {/* Black overlay */}
        <div className="absolute inset-0 bg-black/70" />
        
        {/* Content wrapper */}
        <div className="relative z-10">
        {/* Travel Icon */}
        <Plane className="mx-auto mb-4 text-white" size={100} />

        {/* App Name */}
        <h1 className="text-5xl font-bold text-white text-center mb-3 tracking-tight">
          Travox
        </h1>

        {/* Tagline */}
        <p className="text-base font-medium text-white/90 text-center mb-10">
          Enterprise Travel Management
        </p>

        <h2 className="text-lg font-semibold text-white text-center mb-5">
          Sign up / Sign in
        </h2>

        {err && (
          <div className="mb-4 px-3.5 py-3 rounded-xl bg-red-50/95 text-red-800 border border-red-200/50 text-sm font-medium">
            {err}
          </div>
        )}

        {/* Google renders the real button here */}
        <div className="relative grid place-items-center min-h-[44px]">
          <div
            ref={btnRef}
            className={`grid place-items-center min-h-[44px] transition-opacity ${loading ? 'opacity-65' : 'opacity-100'}`}
          />
          {loading && (
            <>
              <style>
                {`@keyframes authSpin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}`}
              </style>
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-xl bg-blue-600/15 grid place-items-center pointer-events-auto"
              >
                <div className="w-6 h-6 rounded-full border-3 border-white/30 border-t-white animate-spin" />
              </div>
            </>
          )}
        </div>

        <p className="mt-4 text-xs text-white/70 text-center">
          By continuing, you agree to the <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>.
        </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
