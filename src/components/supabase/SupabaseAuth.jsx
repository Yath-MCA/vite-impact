/**
 * @file SupabaseAuth.jsx
 * @description Authentication UI using @supabase/auth-ui-react.
 * Provides login, sign-up, and forgot-password flows via the Auth component.
 */

import React, { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import supabase from '../../services/supabase/supabaseClient';

/**
 * SupabaseAuth component
 *
 * Renders the Supabase Auth UI with support for:
 *  - Email/password sign-in
 *  - New account sign-up
 *  - Forgot-password / magic-link reset
 *
 * @param {object}   props
 * @param {Function} [props.onAuthChange] - Called with the current session when auth state changes.
 */
const SupabaseAuth = ({ onAuthChange }) => {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Retrieve the current session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (onAuthChange) onAuthChange(s);
    });

    // Listen for auth state changes (login, logout, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (onAuthChange) onAuthChange(s);
    });

    return () => subscription.unsubscribe();
  }, [onAuthChange]);

  if (session) {
    return (
      <div className="p-4 text-center">
        <p className="text-green-600 font-semibold mb-2">
          Signed in as{' '}
          <span className="font-bold">{session.user?.email}</span>
        </p>
        <button
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Account Access
      </h2>
      {/* The Auth component renders login, signup, and forgot-password views */}
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
        view="sign_in"
        showLinks={true}
        redirectTo={window.location.origin}
      />
    </div>
  );
};

export default SupabaseAuth;
