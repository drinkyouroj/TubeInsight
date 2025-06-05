// File: frontend/contexts/SupabaseProvider.tsx
'use client'; // This is a client component because it uses React Context and creates a client instance.

import React, { createContext, useContext, useMemo } from 'react';
import { type SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client'; // We'll create this file next

// Define the shape of the context value
type SupabaseContextType = {
  supabase: SupabaseClient;
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
  // Create the Supabase client instance.
  // useMemo ensures this is only done once per component lifecycle.
  const supabase = useMemo(() => createClient(), []);

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
  return context.supabase;
};
