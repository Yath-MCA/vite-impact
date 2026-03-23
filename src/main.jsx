import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles/fonts'; // Import Source Sans Pro font
import './index.css';
import App from './App.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Backwards-compatible shim for older code expecting defaultQueryOptions as a function
// Also patch QueryClient prototype in case external libs call the method on the class prototype
try {
  // add to instance if missing
  if (typeof queryClient.defaultQueryOptions !== 'function') {
    queryClient.defaultQueryOptions = function() {
      try {
        // capture caller stack for debugging
        if (typeof window !== 'undefined') {
          const st = new Error().stack;
          window.__LAST_QC_CALLER__ = st;
          console.warn('QueryClient.defaultQueryOptions shim invoked. Caller stack saved to window.__LAST_QC_CALLER__');
          console.warn(st);
        }
      } catch (e) {
        // ignore
      }
      return this.defaultOptions || {};
    };
  }
  // add to prototype for other instances
  const qcProto = Object.getPrototypeOf(queryClient);
  if (qcProto && typeof qcProto.defaultQueryOptions !== 'function') {
    qcProto.defaultQueryOptions = function() {
      try {
        if (typeof window !== 'undefined') {
          const st = new Error().stack;
          window.__LAST_QC_CALLER__ = st;
          console.warn('QueryClient.prototype.defaultQueryOptions shim invoked. Caller stack saved to window.__LAST_QC_CALLER__');
          console.warn(st);
        }
      } catch (e) {}
      return this.defaultOptions || {};
    };
  }
} catch (e) {
  // fail silently
  console.warn('Could not apply QueryClient defaultQueryOptions shim', e);
}

// Expose globally for debugging and any legacy consumers
if (typeof window !== 'undefined') {
  window.__QUERY_CLIENT__ = queryClient;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
