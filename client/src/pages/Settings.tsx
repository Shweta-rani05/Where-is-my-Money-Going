import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Shield, Palette, AlertTriangle, Save, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

// --- Validation Schemas ---
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Max 100 characters'),
  email: z.string().email('Invalid email address')
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'Must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type ProfileFields = z.infer<typeof profileSchema>;
type PasswordFields = z.infer<typeof passwordSchema>;

export const Settings: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // --- Profile Form ---
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting }
  } = useForm<ProfileFields>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || ''
    }
  });

  // --- Password Form ---
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting }
  } = useForm<PasswordFields>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  });

  const onProfileSubmit = async (data: ProfileFields) => {
    try {
      const updatedUser = await authService.updateProfile({ name: data.name, email: data.email });
      updateUser(updatedUser);
      toast.success('Profile updated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    }
  };

  const onPasswordSubmit = async (data: PasswordFields) => {
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully!');
      resetPassword();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password.');
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await authService.deleteAccount();
      toast.success('Account deleted. Goodbye!');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to delete account.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Shared input class generator
  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-xl border bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 transition-all ${
      hasError
        ? 'border-rose-500 focus:ring-rose-500/20'
        : 'border-border-custom focus:ring-primary/20 focus:border-primary'
    }`;

  // Initials avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-text-muted">Manage your profile, security, and preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ──────────── 1. Profile Section ──────────── */}
        <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm space-y-5">
          <h3 className="font-bold text-lg text-text-custom flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile
          </h3>

          {/* Avatar Initials */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold select-none">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-text-custom">{user?.name || 'User'}</p>
              <p className="text-xs text-text-muted">{user?.email}</p>
              <p className="text-[10px] text-text-muted mt-0.5">
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Name</label>
              <input type="text" {...registerProfile('name')} className={inputClass(!!profileErrors.name)} />
              {profileErrors.name && <span className="text-xs text-rose-500 mt-1 block">{profileErrors.name.message}</span>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" {...registerProfile('email')} className={inputClass(!!profileErrors.email)} />
              {profileErrors.email && <span className="text-xs text-rose-500 mt-1 block">{profileErrors.email.message}</span>}
            </div>
            <button
              type="submit"
              disabled={isProfileSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-opacity-95 text-white text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 select-none"
            >
              <Save className="w-4 h-4" />
              {isProfileSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* ──────────── 2. Change Password ──────────── */}
        <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm space-y-5">
          <h3 className="font-bold text-lg text-text-custom flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Change Password
          </h3>

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  {...registerPassword('currentPassword')}
                  className={inputClass(!!passwordErrors.currentPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-custom transition-colors cursor-pointer"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordErrors.currentPassword && <span className="text-xs text-rose-500 mt-1 block">{passwordErrors.currentPassword.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">New Password</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  {...registerPassword('newPassword')}
                  className={inputClass(!!passwordErrors.newPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-custom transition-colors cursor-pointer"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordErrors.newPassword && <span className="text-xs text-rose-500 mt-1 block">{passwordErrors.newPassword.message}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Confirm New Password</label>
              <input
                type="password"
                {...registerPassword('confirmPassword')}
                className={inputClass(!!passwordErrors.confirmPassword)}
              />
              {passwordErrors.confirmPassword && <span className="text-xs text-rose-500 mt-1 block">{passwordErrors.confirmPassword.message}</span>}
            </div>

            <button
              type="submit"
              disabled={isPasswordSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 select-none"
            >
              <Shield className="w-4 h-4" />
              {isPasswordSubmitting ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* ──────────── 3. Appearance ──────────── */}
        <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm space-y-5">
          <h3 className="font-bold text-lg text-text-custom flex items-center gap-2">
            <Palette className="w-5 h-5 text-violet-500" />
            Appearance
          </h3>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border-custom/50 bg-background-custom">
            <div>
              <p className="font-semibold text-sm text-text-custom">Theme Mode</p>
              <p className="text-xs text-text-muted mt-0.5">
                Currently using <span className="font-medium capitalize">{theme}</span> mode
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="relative w-14 h-8 rounded-full transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{
                backgroundColor: theme === 'dark' ? 'var(--color-primary)' : '#d1d5db'
              }}
            >
              <div
                className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center"
                style={{
                  transform: theme === 'dark' ? 'translateX(28px)' : 'translateX(4px)'
                }}
              >
                {theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
              </div>
            </button>
          </div>

          <p className="text-xs text-text-muted">
            Toggle between light and dark modes. Your preference is saved automatically.
          </p>
        </div>

        {/* ──────────── 4. Danger Zone ──────────── */}
        <div className="p-6 rounded-2xl bg-card-custom border border-rose-500/30 shadow-sm space-y-5">
          <h3 className="font-bold text-lg text-rose-500 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h3>

          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
            <p className="font-semibold text-sm text-text-custom mb-1">Delete Account</p>
            <p className="text-xs text-text-muted mb-4">
              Permanently delete your account and all associated data including transactions, budgets, and savings goals. This action is irreversible.
            </p>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="py-2.5 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold shadow-md transition-all cursor-pointer select-none"
            >
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {/* ──────────── Delete Confirmation Dialog ──────────── */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowDeleteDialog(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm p-6 rounded-2xl bg-card-custom shadow-2xl z-10 text-text-custom border border-border-custom text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Delete Account?</h3>
            <p className="text-sm text-text-muted mb-6">
              This will permanently remove your account, all transactions, budgets, and goals. You cannot undo this.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-border-custom hover:bg-border-custom/30 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
