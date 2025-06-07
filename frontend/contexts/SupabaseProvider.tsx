// File: frontend/contexts/SupabaseProvider.tsx
'use client'; // This is a client component because it uses React Context and creates a client instance.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { type SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client'; // We'll create this file next

// Define the shape of the context value
type SupabaseContextType = {
  supabase: SupabaseClient | null; // Allow null for SSR
};

// Create the context with an undefined initial value
const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined
);

// Define the provider component
export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    // Create the Supabase client instance only on the client-side after mount
    // to ensure browser APIs are available.
    setSupabase(createClient());
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Custom hook to easily access the Supabase client from the context
export const useSupabase = (): SupabaseClient => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  // If supabase is null during SSR or initial client render before useEffect runs,
  // components using this hook need to be robust enough to handle it.
  // However, for operations like auth.getSession() in VideoUrlInputForm,
  // it's better if it's available. This change might shift the error.
  // A better approach might be needed if this causes issues downstream.
  if (context.supabase === null) {
    // This will likely be hit during SSR of VideoUrlInputForm
    // and initial client render before useEffect in SupabaseProvider runs.
    // Throwing an error here is similar to the original problem, but indicates
    // the client isn't ready yet, rather than provider missing.
    throw new Error('Supabase client is not yet available. This might happen during SSR or initial client render.');
  }
  return context.supabase;
};
