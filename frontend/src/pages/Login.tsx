import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white opacity-10 rounded-full floating"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-white opacity-10 rounded-full floating" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-white opacity-10 rounded-full floating" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative">
        <div className="text-center animate-fade-in">
          <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Welcome Back! 👋
          </h2>
          <p className="text-lg text-white/90">
            Sign in to continue your journey{' '}
            <Link
              to="/register"
              className="font-semibold text-white underline hover:text-yellow-200 transition-colors duration-300"
            >
              or create a new account ✨
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6 glass rounded-3xl p-8 animate-slide-up" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-bounce-in">
              ❌ {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                📧 Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 input-field"
                placeholder="Enter your email address ✉️"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                🔒 Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Enter your password 🔐"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-purple-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-500 hover:text-purple-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-all duration-200"
              />
              <label htmlFor="remember-me" className="ml-3 block text-sm text-white font-medium">
                💾 Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-semibold text-white hover:text-yellow-200 transition-colors duration-300">
                🤔 Forgot password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-bold rounded-2xl text-white bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-4 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            >
              {loading ? '🔄 Signing in...' : '🚀 Sign In'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-white font-medium">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-yellow-200 hover:text-yellow-100 underline transition-colors duration-300"
              >
                ✨ Sign up here
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
