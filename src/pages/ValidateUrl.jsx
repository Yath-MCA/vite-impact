import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClient } from '../context/ClientContext';
import { loadClientById } from '../utils/clientLoader';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function ValidateUrl() {
  const { client } = useParams();
  const navigate = useNavigate();
  const { loadClientConfig } = useClient();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const validateAndLoad = async () => {
      try {
        setStatus('loading');
        setProgress(0);
        
        // Simulate progress steps
        await new Promise(resolve => {
          const interval = setInterval(() => {
            setProgress(prev => {
              if (prev >= 90) {
                clearInterval(interval);
                resolve();
                return 90;
              }
              return prev + 10;
            });
          }, 100);
        });

        const config = await loadClientById(client);
        loadClientConfig(client);
        
        setProgress(100);
        setStatus('success');
        
        // Redirect after short delay
        setTimeout(() => {
          if (config.features.dashboard) {
            navigate('/dashboard');
          } else if (config.features.editor) {
            navigate('/editor');
          } else {
            navigate('/');
          }
        }, 1500);
        
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    };

    if (client) {
      validateAndLoad();
    }
  }, [client, loadClientConfig, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div 
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : '#3b82f6' }}
            >
              {status === 'loading' && <Loader2 className="w-8 h-8 text-white animate-spin" />}
              {status === 'success' && <CheckCircle2 className="w-8 h-8 text-white" />}
              {status === 'error' && <XCircle className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {status === 'loading' && 'Validating Client'}
              {status === 'success' && 'Client Validated'}
              {status === 'error' && 'Validation Failed'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {status === 'loading' && `Loading configuration for "${client}"...`}
              {status === 'success' && 'Redirecting to application...'}
              {status === 'error' && error}
            </p>
          </div>

          {/* Progress */}
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-600 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Validating URL</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-green-800 dark:text-green-300 text-sm">
                  Client configuration loaded successfully!
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-800 dark:text-red-300 text-sm">
                  Unable to load client configuration.
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate('/validateurl/default-client')}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Use Default Client
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          )}

          {/* Client Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Client ID:</span>
              <span className="font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {client}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
