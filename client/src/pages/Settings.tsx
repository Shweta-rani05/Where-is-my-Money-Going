import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // --- Profile Form ---
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting, isDirty: isProfileDirty }
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
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting, isValid: isPasswordValid, isDirty: isPasswordDirty }
  } = useForm<PasswordFields>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  });

  const onProfileSubmit = async (data: ProfileFields) => {
    try {
      const updatedUser = await authService.updateProfile({ name: data.name, email: data.email });
      updateUser(updatedUser);
      toast.success('Profile updated successfully!');
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
    `w-full px-4 py-2.5 rounded-xl border bg-background-custom text-text-custom text-sm focus:outline-none focus:ring-2 transition-all ${
      hasError
        ? 'border-rose-500/50 focus:ring-rose-500/20 focus:border-rose-500'
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

  const memberSinceDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
    : '—';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-1.5 pb-2">
        <h1 className="text-3xl font-bold tracking-tight text-text-custom">Settings</h1>
        <p className="text-text-muted">Manage your personal information, security, and preferences.</p>
      </div>

      <div className="space-y-8">
        
        {/* ──────────── 1. Profile Section ──────────── */}
        <div className="border border-border-custom rounded-2xl bg-card-custom shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 md:p-8 flex-1">
            <h3 className="font-bold text-lg text-text-custom mb-1">Profile</h3>
            <p className="text-sm text-text-muted mb-8">
              Update your basic profile information and email address.
            </p>

            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold select-none shadow-inner">
                {initials}
              </div>
              <div>
                <p className="font-semibold text-text-custom text-lg">{user?.name || 'User'}</p>
                <p className="text-sm text-text-muted mb-1">{user?.email}</p>
                <p className="text-xs text-text-muted/70 font-medium">
                  Member since {memberSinceDate}
                </p>
              </div>
            </div>

            <form id="profile-form" onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-custom mb-2">Display Name</label>
                  <input type="text" {...registerProfile('name')} className={inputClass(!!profileErrors.name)} placeholder="John Doe" />
                  {profileErrors.name && <span className="text-xs text-rose-500 mt-1.5 block font-medium">{profileErrors.name.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-custom mb-2">Email Address</label>
                  <input type="email" {...registerProfile('email')} className={inputClass(!!profileErrors.email)} placeholder="john@example.com" />
                  {profileErrors.email && <span className="text-xs text-rose-500 mt-1.5 block font-medium">{profileErrors.email.message}</span>}
                </div>
              </div>
            </form>
          </div>
          
          <div className="px-6 md:px-8 py-4 bg-background-custom border-t border-border-custom flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-muted">
              Please use a valid email address as it may be used for notifications.
            </p>
            <button
              form="profile-form"
              type="submit"
              disabled={isProfileSubmitting || !isProfileDirty}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-text-custom text-background-custom text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
            >
              {isProfileSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* ──────────── 2. Change Password ──────────── */}
        <div className="border border-border-custom rounded-2xl bg-card-custom shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 md:p-8 flex-1">
            <h3 className="font-bold text-lg text-text-custom mb-1">Security</h3>
            <p className="text-sm text-text-muted mb-8">
              Update your password to keep your account secure.
            </p>

            <form id="password-form" onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-text-custom mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    {...registerPassword('currentPassword')}
                    className={inputClass(!!passwordErrors.currentPassword)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-custom transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && <span className="text-xs text-rose-500 mt-1.5 block font-medium">{passwordErrors.currentPassword.message}</span>}
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-sm font-medium text-text-custom mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      {...registerPassword('newPassword')}
                      className={inputClass(!!passwordErrors.newPassword)}
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-custom transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && <span className="text-xs text-rose-500 mt-1.5 block font-medium">{passwordErrors.newPassword.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-custom mb-2">Confirm Password</label>
                  <input
                    type="password"
                    {...registerPassword('confirmPassword')}
                    className={inputClass(!!passwordErrors.confirmPassword)}
                    placeholder="Repeat new password"
                  />
                  {passwordErrors.confirmPassword && <span className="text-xs text-rose-500 mt-1.5 block font-medium">{passwordErrors.confirmPassword.message}</span>}
                </div>
              </div>
            </form>
          </div>

          <div className="px-6 md:px-8 py-4 bg-background-custom border-t border-border-custom flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-muted">
              You will remain logged in on this device after changing your password.
            </p>
            <button
              form="password-form"
              type="submit"
              disabled={isPasswordSubmitting || !isPasswordValid || !isPasswordDirty}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-text-custom text-background-custom text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
            >
              {isPasswordSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* ──────────── 3. Danger Zone ──────────── */}
        <div className="border border-rose-500/20 rounded-2xl bg-card-custom shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 md:p-8 flex-1">
            <h3 className="font-bold text-lg text-rose-500 mb-1 flex items-center gap-2">
              Danger Zone
            </h3>
            <p className="text-sm text-text-muted mb-6">
              Permanently delete your account and all associated data from our servers.
            </p>

            <div className="p-5 rounded-xl border border-rose-500/20 bg-rose-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm text-text-custom mb-1">Delete Personal Account</p>
                <p className="text-xs text-text-muted max-w-md">
                  This action is irreversible. All transactions, budgets, and savings goals will be immediately expunged.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="whitespace-nowrap py-2.5 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer select-none active:scale-95"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
        
      </div>

      {/* ──────────── Delete Confirmation Dialog ──────────── */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div onClick={() => setShowDeleteDialog(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm p-7 rounded-3xl bg-card-custom shadow-2xl z-10 border border-border-custom text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-text-custom">Are you absolutely sure?</h3>
            <p className="text-sm text-text-muted mb-8 leading-relaxed">
              This will permanently delete <span className="font-semibold text-text-custom">{user?.email}</span> and remove all data from our servers. You cannot undo this action.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="w-full py-3 px-4 rounded-xl border border-border-custom hover:bg-border-custom/50 text-text-custom text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
