import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';

// Zod schema defining signup field validation rules
const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
});

type RegisterFormFields = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: signup, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormFields>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormFields) => {
    try {
      await signup(data.name, data.email, data.password);
      navigate('/'); // Redirect to dashboard Overview on success
    } catch (error) {
      // Exceptions are handled in context provider
      console.warn('[Register Page] Signup execution failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold tracking-tight">Create Account</h2>
        <p className="text-xs text-text-muted mt-1">Get started tracking your finances with AI</p>
      </div>

      <div className="space-y-4">
        {/* Name Input Field */}
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="John Doe"
            disabled={isLoading}
            className={`w-full px-4 py-3 rounded-xl border bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 transition-all ${
              errors.name
                ? 'border-rose-500 focus:ring-rose-500/20'
                : 'border-border-custom focus:ring-primary/20 focus:border-primary'
            }`}
          />
          {errors.name && (
            <span className="text-xs text-rose-500 mt-1 block">
              {errors.name.message}
            </span>
          )}
        </div>

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
            placeholder="Min 6 characters"
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
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </button>

      {/* Footer link to Login */}
      <div className="text-center pt-2">
        <p className="text-xs text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </form>
  );
};

export default Register;
