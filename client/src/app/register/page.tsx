"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkData, setLinkData] = useState(true);
  const { register } = useAuth();
  const searchParams = useSearchParams();


  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await register(email, password, linkData);
      const redirectTo = searchParams.get("redirect") || "/";
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      console.log(err?.response?.data?.detail || err.message);
      setError(err?.response?.data?.detail || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Account
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="input-field"
            />
          </div>

          <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <input
              type="checkbox"
              checked={linkData}
              onChange={(e) => setLinkData(e.target.checked)}
              className="mt-1 h-4 w-4 text-teal-600 rounded border-gray-300"
            />
            <label className="text-xs text-gray-600 dark:text-gray-300 leading-tight">
              Link the health analysis results found on this device to your new
              account. Uncheck this if someone else used this device to perform their screening.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Creating Account..." : "Create Account & Continue"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-teal-600 font-semibold hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
