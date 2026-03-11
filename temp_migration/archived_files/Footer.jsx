export default function Footer({ type, onAction, config }) {
  if (type === 'none') return null;

  const defaultConfig = {
    primary: { label: 'Save', action: 'save' },
    secondary: { label: 'Cancel', action: 'cancel' },
    danger: { label: 'Delete', action: 'delete' }
  };

  const actions = { ...defaultConfig, ...config };

  return (
    <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
      {actions.danger && (
        <button
          onClick={() => onAction(actions.danger.action)}
          className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
        >
          {actions.danger.label}
        </button>
      )}
      
      {actions.secondary && (
        <button
          onClick={() => onAction(actions.secondary.action)}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {actions.secondary.label}
        </button>
      )}
      
      {actions.primary && (
        <button
          onClick={() => onAction(actions.primary.action)}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
        >
          {actions.primary.label}
        </button>
      )}
    </div>
  );
}
