// File: frontend/app/(auth)/login/page.tsx

import AuthForm from '@/components/auth/AuthForm'; // Import the AuthForm component
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Login', // Page-specific title
  description: 'Sign in or create an account for TubeInsight.',
};

export default function LoginPage() {
  // Wrap AuthForm in a Suspense boundary to handle client-side hooks like useSearchParams
  return (
    <Suspense fallback={
      <Card className="w-full max-w-md mx-auto mt-10">
        <CardContent className="p-6 text-center">
          Loading authentication form...
        </CardContent>
      </Card>
    }>
      <AuthForm />
    </Suspense>
  );
}
