"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isConfigError, setIsConfigError] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (isInitialized) return;
    console.log("isInitialized:", isInitialized);
    console.log("supabaseUrl:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("supabaseKey:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !supabaseUrl ||
      !supabaseKey ||
      supabaseUrl === "your_supabase_project_url" ||
      supabaseKey === "your_supabase_anon_key"
    ) {
      setIsConfigError(true);
    }
    setIsInitialized(true);

    console.log("supabase:=>", supabase);

    // Add Supabase auth state change logging
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Supabase Auth Event:", event, session);

      if (event === "SIGNED_IN") {
        setAuthStatus({
          type: "success",
          message: "Login successful! Redirecting to dashboard...",
        });
        // Redirect after a short delay to show the success message
        setTimeout(() => {
          window.location.href = "/admin/dashboard";
        }, 2000);
      } else if (event === "SIGNED_OUT") {
        setAuthStatus({
          type: "idle",
          message: "",
        });
      } else if (event === "TOKEN_REFRESHED") {
        setAuthStatus({
          type: "success",
          message: "Session refreshed successfully!",
        });
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, [isInitialized]);

  // Clear error message after 5 seconds
  useEffect(() => {
    console.log("authStatus.type:", authStatus.type);
    if (authStatus.type === "error") {
      const timer = setTimeout(() => {
        setAuthStatus({ type: "idle", message: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [authStatus.type]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthStatus({ type: "idle", message: "" });

    try {
      console.log("Attempting login with:", formData.email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.log("Login error:", error);
        setAuthStatus({
          type: "error",
          message:
            error.message || "Login failed. Please check your credentials.",
        });
      } else {
        console.log("Login successful:", data);
        setAuthStatus({
          type: "success",
          message: "Login successful! Redirecting to dashboard...",
        });
        // Redirect after a short delay to show the success message
        setTimeout(() => {
          window.location.href = "/admin/dashboard";
        }, 2000);
      }
    } catch (error) {
      console.log("Unexpected error:", error);
      setAuthStatus({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isConfigError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Configuration Required
            </h2>
            <p className="text-gray-600 mb-6">
              Supabase is not configured. Please set up your environment
              variables:
            </p>
            <div className="bg-gray-100 p-4 rounded-md text-left text-sm">
              <p className="font-semibold mb-2">Create a .env file with:</p>
              <code className="block bg-white p-2 rounded border">
                NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
                <br />
                NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
              </code>
              <p className="mt-2 text-xs text-gray-500">
                Current values:
                <br />
                URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || "undefined"}
                <br />
                Key:{" "}
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                  ? "***" + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-4)
                  : "undefined"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Success/Error Messages */}
        {authStatus.type === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {authStatus.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {authStatus.type === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {authStatus.message}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setAuthStatus({ type: "idle", message: "" })}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
