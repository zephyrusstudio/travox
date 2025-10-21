/* eslint-disable @typescript-eslint/no-explicit-any */
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
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#fff",
        padding: 16,
      }}
    >
      <div
        role="main"
        aria-busy={loading}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#0f141a",
          border: "1px solid #1f2a37",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 8px 24px rgba(0,0,0,.24)",
        }}
      >
        <h1
          style={{
            margin: "0 0 4px",
            font: "600 20px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
            color: "#e5e7eb",
          }}
        >
          Sign in
        </h1>
        <p
          style={{
            margin: "0 0 16px",
            font: "400 14px/1.5 system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
            color: "#9ca3af",
          }}
        >
          Use Google to continue
        </p>

        {err && (
          <div
            style={{
              margin: "0 0 12px",
              padding: "10px 12px",
              borderRadius: 10,
              background: "#2a1111",
              color: "#fda4af",
              border: "1px solid #7f1d1d",
              fontSize: 13,
            }}
          >
            {err}
          </div>
        )}

        {/* Google renders the real button here */}
        <div
          style={{
            position: "relative",
            display: "grid",
            placeItems: "center",
            minHeight: 44,
          }}
        >
          <div
            ref={btnRef}
            style={{
              display: "grid",
              placeItems: "center",
              minHeight: 44,
              opacity: loading ? 0.65 : 1,
            }}
          />
          {loading && (
            <>
              <style>
                {`@keyframes authSpin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}`}
              </style>
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 12,
                  background: "rgba(15,20,26,0.55)",
                  display: "grid",
                  placeItems: "center",
                  pointerEvents: "all",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: "3px solid rgba(156,169,191,0.45)",
                    borderTopColor: "#f9fafb",
                    animation: "authSpin 0.75s linear infinite",
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Fallback if GIS failed to load */}
        {/* {!(window as any).google?.accounts?.id && (
          <button
            onClick={() => window.location.reload()}
            disabled={loading}
            style={{
              width: "100%",
              height: 44,
              border: "1px solid #334155",
              borderRadius: 10,
              background: "#111827",
              color: "#e5e7eb",
              font: "600 14px/1 system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Load Google Sign-In"}
          </button>
        )} */}

        <p
          style={{
            margin: "12px 0 0",
            font: "400 12px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          By continuing, you agree to the Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
