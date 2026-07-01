import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';

// Zod schema defining login field validation rules
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
});

type LoginFormFields = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormFields>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormFields) => {
    try {
      await login(data.email, data.password);
      navigate('/'); // Redirect to dashboard Overview on success
    } catch (error) {
      // Errors are handled inside AuthContext by toast alerts
      console.warn('[Login Page] Authentication execution failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold tracking-tight">Welcome Back</h2>
        <p className="text-xs text-text-muted mt-1">Please sign in to access your finances</p>
      </div>

      <div className="space-y-4">
        {/* Email Input Field */}
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            {...register('email')}
            placeholder="name@example.com"
            disabled={isLoading}
            className={`w-full px-4 py-3 rounded-xl border bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 transition-all ${
              errors.email
                ? 'border-rose-500 focus:ring-rose-500/20'
                : 'border-border-custom focus:ring-primary/20 focus:border-primary'
            }`}
          />
          {errors.email && (
            <span className="text-xs text-rose-500 mt-1 block">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Password Input Field */}
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
            Password
          </label>
          <input
            type="password"
            {...register('password')}
            placeholder="••••••••"
            disabled={isLoading}
            className={`w-full px-4 py-3 rounded-xl border bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 transition-all ${
              errors.password
                ? 'border-rose-500 focus:ring-rose-500/20'
                : 'border-border-custom focus:ring-primary/20 focus:border-primary'
            }`}
          />
          {errors.password && (
            <span className="text-xs text-rose-500 mt-1 block">
              {errors.password.message}
            </span>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-opacity-90 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Verifying Credentials...' : 'Sign In'}
      </button>

      {/* Footer link to Register */}
      <div className="text-center pt-2">
        <p className="text-xs text-text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </form>
  );
};

export default Login;
