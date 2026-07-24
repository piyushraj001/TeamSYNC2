'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await forgotPassword(email);
      if (success) {
        setSubmitted(true);
        setEmail('');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-6 text-center text-green-600">Check Your Email</h1>
          <p className="text-gray-600 text-center mb-6">
            If an account with this email exists, you will receive a password reset link shortly.
          </p>
          <p className="text-gray-600 text-center text-sm mb-6">
            Click the link in the email to reset your password.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 mb-4"
          >
            Send Another Email
          </button>
          <p className="text-center text-gray-600 text-sm">
            Remembered your password?{' '}
            <Link href="/auth/login" className="text-blue-500 hover:text-blue-600 font-medium">
              Login here
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
        <p className="text-gray-600 text-center text-sm mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="text-center text-gray-600 text-sm mt-4">
          Remember your password?{' '}
          <Link href="/auth/login" className="text-blue-500 hover:text-blue-600 font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;