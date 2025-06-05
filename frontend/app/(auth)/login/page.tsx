// File: frontend/app/(auth)/login/page.tsx

import AuthForm from '@/components/auth/AuthForm'; // Import the AuthForm component
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login', // Page-specific title
  description: 'Sign in or create an account for TubeInsight.',
};

export default function LoginPage() {
  // This page simply renders the AuthForm component, which handles
  // the actual login and signup UI and logic via Supabase Auth UI.
  return <AuthForm />;
}
