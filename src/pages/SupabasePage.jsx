/**
 * @file SupabasePage.jsx
 * @description Integrates Supabase Auth UI, File Dashboard, and Content Metadata
 * RPC example into a single page accessible at /supabase.
 */

import React, { useState } from 'react';
import SupabaseAuth from '../components/supabase/SupabaseAuth';
import FileDashboard from '../components/supabase/FileDashboard';
import ContentMetadataRpc from '../components/supabase/ContentMetadataRpc';
import DocumentSearch from '../components/supabase/DocumentSearch';

const TABS = [
  { id: 'auth', label: '🔐 Auth' },
  { id: 'files', label: '📁 File Dashboard' },
  { id: 'rpc', label: '🗂 Content Metadata RPC' },
  { id: 'search', label: '🔎 Document Search' },
];

/**
 * SupabasePage
 *
 * Top-level page that brings together:
 *  1. SupabaseAuth  – login/signup/forgot-password via Supabase Auth UI
 *  2. FileDashboard – browse and download files from the 'publishing' bucket
 *  3. ContentMetadataRpc – call an RPC function that uses xmltable on 'content_metadata'
 */
const SupabasePage = () => {
  const [activeTab, setActiveTab] = useState('auth');
  const [session, setSession] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Supabase Integration Demo
          </h1>
          {session && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Logged in as <strong>{session.user?.email}</strong>
            </p>
          )}
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex space-x-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Tab content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'auth' && (
          <SupabaseAuth onAuthChange={setSession} />
        )}
        {activeTab === 'files' && (
          <FileDashboard />
        )}
        {activeTab === 'rpc' && (
          <ContentMetadataRpc />
        )}
        {activeTab === 'search' && (
          <DocumentSearch />
        )}
      </main>
    </div>
  );
};

export default SupabasePage;
