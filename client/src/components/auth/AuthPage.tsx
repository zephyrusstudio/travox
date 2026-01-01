/* eslint-disable @typescript-eslint/no-explicit-any */
import { Plane } from "lucide-react";
import { apiRequest } from "../../utils/apiConnector";
import Spinner from "../ui/Spinner";

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
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "travox-at";
const USER_KEY = import.meta.env.VITE_USER_KEY || "travox-ua";

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
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));

      navigate("/customers", { replace: true });
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
    <div
      className="min-h-dvh bg-cover bg-left md:bg-center flex items-center justify-center"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1582457493468-1cd9a3b48e79?auto=format&fit=crop&q=85&w=2560')",
      }}
    >
      <div className="bg-black bg-opacity-70 backdrop-blur-sm px-8 py-24 rounded-lg max-w-md w-full mx-4">
        <div className="text-center">
          {/* Travel Icon */}
          <Plane className="mx-auto mb-4 text-white" size={100} />

          {/* App Name */}
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
            Travox
          </h1>

          {/* Tagline */}
          <p className="text-base font-medium text-white/90 mb-10">
            B2B Travel Management Platform
          </p>

          <h2 className="text-lg font-semibold text-white mb-5">
            Sign up / Sign in
          </h2>

          {err && (
            <div className="mb-4 px-3.5 py-3 bg-red-50/95 text-red-800 border border-red-200/50 text-sm font-medium rounded">
              {err}
            </div>
          )}

          {/* Google Sign-In Button Container */}
          <div className="relative flex justify-center mb-4">
            <div ref={btnRef} className={loading ? 'opacity-0' : 'opacity-100'} />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner size="md" color="white" />
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-white text-center">
            By continuing, you agree to the <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
