import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useClient } from '../context/ClientContext';
import { loadClientById } from '../utils/clientLoader';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { apiService, API_ENDPOINTS } from '../services/api/apiService';
import ValidateUrlLanding from '../components/ValidateUrlLanding';

export default function ValidateUrl() {
  const { client } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadClientConfig } = useClient();
  const [status, setStatus] = useState('loading');
  const [statusLabel, setStatusLabel] = useState('Validating your link…');
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [docData, setDocData] = useState(null);
  const [showLanding, setShowLanding] = useState(false);

  const key = searchParams.get('key');

  // ── Local/Testing fallback key ───────────────────────────────────────────
  const DEFAULT_TEST_KEY = 'HgnqXDUGGRmt5M585EzdEpXKK6kNtQ688UCY8t-_7P_80rnnHfmyNjiEOm41p5A4apYW3qAffNm436NTgvhJ2JH3FhVCcXE5sV6VLgGjdQJWI-kiInLAO78VX06GrBrXMODt9gupFC0';
  const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const effectiveKey = key || (IS_LOCAL ? DEFAULT_TEST_KEY : null);

  useEffect(() => {
    // ── Mode 1: ?key=xxx  →  call real validateuserpost API ──────────────
    if (effectiveKey) {
      validateByKey(effectiveKey);
      return;
    }

    // ── Mode 2: /validateurl/:client  →  client config lookup (dev/admin) ─
    if (client) {
      validateByClient(client);
    }
  }, [key, client]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Real API flow ──────────────────────────────────────────────────────────
  async function validateByKey(accessKey) {
    try {
      setStatus('loading');
      setProgress(10);
      setStatusLabel('Connecting to server…');

      setProgress(30);
      setStatusLabel('Validating link…');

      const response = await apiService.makeRequest(
        API_ENDPOINTS.URL_VALIDITY,
        { key: String(accessKey) }
      );

      setProgress(70);
      setStatusLabel('Checking access…');

      // Mirror commonfn.validateuserpost response shape: { data, r, enable }
      const resData = response.data ?? response;
      const r = response.r ?? resData.r;

      if (r === 0) {
        throw new Error('Access denied. Please contact support.');
      }
      if (r === 4) {
        throw new Error('Your IP address does not have permission to access this link.');
      }
      if (resData.status === 'expired' || resData.fdel) {
        throw new Error('This proof link has expired.');
      }
      if (resData.status === 'deactive') {
        throw new Error('This proof link has been deactivated.');
      }

      // Store full response for editor consumption
      sessionStorage.setItem('xmleditor:validateuserpost', JSON.stringify(response));

      // Flatten the nested data structure for the landing page
      // API returns: { data: { titleinfo: {...}, xmltohtmlres: {...}, client, projecttitle, ... }, r, time_s }
      const flatDocData = {
        // Top-level metadata
        client: resData.client,
        projecttitle: resData.projecttitle,
        identifier: resData.identifier,
        dtd: resData.dtd,
        type: resData.type,

        // From titleinfo
        cover: resData.titleinfo?.cover,
        projectname: resData.titleinfo?.projectname,

        // From xmltohtmlres (main document metadata)
        journaltitle: resData.xmltohtmlres?.journaltitle,
        articletitle: resData.xmltohtmlres?.articletitle,
        booktitle: resData.xmltohtmlres?.booktitle,
        authorgroup: resData.xmltohtmlres?.authorgroup,
        doi: resData.xmltohtmlres?.doi,
        clientname: resData.xmltohtmlres?.clientname,
        figcount: resData.xmltohtmlres?.figcount,
        tablecount: resData.xmltohtmlres?.tablecount,
        Query: resData.xmltohtmlres?.Query,
        Equation: resData.xmltohtmlres?.Equation,

        // Branding from response
        branding: resData.branding || resData.client_metadata || resData.client_config || {}
      };
      setDocData(flatDocData);

      setProgress(100);
      setStatus('success');
      setStatusLabel('Link validated!');

      // Show landing page with instructions
      setTimeout(() => setShowLanding(true), 800);

    } catch (err) {
      setError(err.message || 'Unable to validate your proof link.');
      setStatus('error');
    }
  }

  // ── Client config flow (dev/admin tool) ────────────────────────────────────
  async function validateByClient(clientId) {
    try {
      setStatus('loading');
      setProgress(0);
      setStatusLabel(`Loading configuration for "${clientId}"…`);

      await new Promise(resolve => {
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) { clearInterval(interval); resolve(); return 90; }
            return prev + 10;
          });
        }, 100);
      });

      const config = await loadClientById(clientId);
      loadClientConfig(clientId);

      setProgress(100);
      setStatus('success');
      setStatusLabel('Redirecting…');

      setTimeout(() => {
        if (config.features?.dashboard) navigate('/dashboard');
        else if (config.features?.editor) navigate('/editor');
        else navigate('/');
      }, 1500);

    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  // If validation succeeded and landing should show, render the landing page
  if (showLanding && docData) {
    return <ValidateUrlLanding docData={docData} />;
  }

  // Otherwise show the progress/validation card
  const iconBg = status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : '#3b82f6';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: iconBg }}>
              {status === 'loading' && <Loader2 className="w-8 h-8 text-white animate-spin" />}
              {status === 'success' && <CheckCircle2 className="w-8 h-8 text-white" />}
              {status === 'error' && <XCircle className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {status === 'loading' && 'Validating Link'}
              {status === 'success' && 'Link Validated'}
              {status === 'error' && 'Validation Failed'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {status === 'loading' && statusLabel}
              {status === 'success' && 'Redirecting to your proof…'}
              {status === 'error' && error}
            </p>
          </div>

          {/* Progress bar */}
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{statusLabel}</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-green-800 dark:text-green-300 text-sm">
                  {docData?.title
                    ? <>Document: <strong>{docData.title}</strong></>
                    : 'Access verified — opening editor…'}
                </p>
              </div>
              <button onClick={() => navigate('/editor')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <span>Open Editor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-800 dark:text-red-300 text-sm">
                  Unable to open this proof link.
                </p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  Try Again
                </button>
                <button onClick={() => navigate('/')}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  Go Home
                </button>
              </div>
            </div>
          )}

          {/* Key / Client info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{effectiveKey ? 'Access Key' : 'Client ID'}:</span>
              <span className="font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded truncate max-w-[220px]">
                {effectiveKey ? `${effectiveKey.slice(0, 16)}…` : client}
                {effectiveKey && !key && IS_LOCAL && <span className="ml-1 text-xs text-orange-600 dark:text-orange-400">(test)</span>}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

