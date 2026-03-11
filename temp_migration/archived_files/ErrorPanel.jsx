import { useErrorTracker } from './ErrorTrackerProvider';
import { X, Trash2, AlertCircle, Clock } from 'lucide-react';

export default function ErrorPanel({ onClose }) {
  const { errors, clearErrors, removeError } = useErrorTracker();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Error Log ({errors.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={clearErrors}
            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
            title="Clear all errors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {errors.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No errors logged
          </div>
        ) : (
          errors.map((error) => (
            <div
              key={error.id}
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300 truncate">
                    {error.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(error.context.timestamp).toLocaleTimeString()}
                    {error.context.overlayId && (
                      <span className="text-gray-400">
                        • Overlay: {error.context.overlayId}
                      </span>
                    )}
                  </div>
                  {error.stack && (
                    <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                      {error.stack.split('\n').slice(0, 3).join('\n')}
                    </pre>
                  )}
                </div>
                <button
                  onClick={() => removeError(error.id)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
