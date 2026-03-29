/* eslint-disable @typescript-eslint/no-explicit-any */
import { CheckCircle2, Lock, Plane, ShieldCheck } from "lucide-react";
import { apiRequest } from "../../utils/apiConnector";
import Spinner from "../ui/Spinner";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGisReady, setIsGisReady] = useState(false);

  const initGis = () => {
    const google = (window as any).google;
    if (!google?.accounts?.id) {
      setErrorMessage("Google Sign-In is currently unavailable.");
      return;
    }

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: onGoogleCredential,
      ux_mode: "popup",
    });

    if (btnRef.current) {
      btnRef.current.innerHTML = "";
      google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 320,
      });
      setIsGisReady(true);
      setErrorMessage(null);
    }
  };

  useEffect(() => {
    if ((window as any).google?.accounts?.id) {
      initGis();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => initGis();
    script.onerror = () => setErrorMessage("Failed to load Google Sign-In.");
    document.head.appendChild(script);

    return () => {
      (window as any).google?.accounts?.id?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGoogleCredential = async (response: { credential?: string }) => {
    const idToken = response?.credential;

    if (!idToken) {
      setErrorMessage("Google authentication did not return a valid token.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const apiResponse = await apiRequest<AuthResponse>({
        url: "/auth/google",
        method: "POST",
        data: { idToken },
      });

      const accessToken = apiResponse?.data?.accessToken;
      const user = apiResponse?.data?.user;

      if (!accessToken) {
        throw new Error("No access token returned");
      }

      localStorage.setItem(TOKEN_KEY, accessToken);
      sessionStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));

      navigate("/customers", { replace: true });
    } catch (error: any) {
      setErrorMessage(error?.message || "Sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#3730A3]/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#2F288E]/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl items-center px-4 py-10 sm:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-2 lg:gap-16">
          <section className="flex flex-col justify-center space-y-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
              <Plane className="h-4 w-4" />
              Travox
            </div>

            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Travel operations,
              <br />
              streamlined with one secure sign-in.
            </h1>

            <p className="max-w-xl text-base text-slate-300 sm:text-lg">
              Access bookings, customers, vendors, payments, and reports instantly with your Google account.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 inline-flex rounded-lg bg-emerald-400/15 p-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                </div>
                <p className="text-sm text-slate-200">Role-based secure access for owners and admins.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 inline-flex rounded-lg bg-sky-400/15 p-1.5">
                  <Lock className="h-4 w-4 text-sky-300" />
                </div>
                <p className="text-sm text-slate-200">Fast session handling with automatic refresh.</p>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <h2 className="text-2xl font-semibold">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-200">
                Continue with Google to access your Travox workspace.
              </p>

              <div className="mt-6 rounded-2xl border border-white/15 bg-slate-950/40 p-4">
                <div className="mb-4 flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                  <p className="text-sm text-slate-200">
                    One-click authentication. No passwords. No setup friction.
                  </p>
                </div>

                {errorMessage && (
                  <div className="mb-4 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                    {errorMessage}
                  </div>
                )}

                <div className="relative min-h-[44px]">
                  <div
                    ref={btnRef}
                    className={`flex justify-center transition-opacity ${isLoading ? "opacity-0" : "opacity-100"}`}
                  />

                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Spinner size="md" color="white" />
                    </div>
                  )}
                </div>

                {!isGisReady && !isLoading && (
                  <p className="mt-3 text-center text-xs text-slate-300">
                    Preparing secure Google sign-in...
                  </p>
                )}
              </div>

              <p className="mt-5 text-center text-xs text-slate-300">
                By continuing, you agree to the Terms of Service and Privacy Policy.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
