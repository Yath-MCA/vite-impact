import { useClient } from '../../context/ClientContext';
import { useLayout } from '../../context/LayoutContext';

export default function Footer() {
  const { clientConfig } = useClient();
  const { toggles } = useLayout();

  if (!clientConfig.layout.showFooter || toggles.showFooter === false) {
    return null;
  }

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center py-4 space-y-2 sm:space-y-0">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {new Date().getFullYear()} {clientConfig.name}. All rights reserved.
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <button className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </button>
            <button className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Terms of Service
            </button>
            <button className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Support
            </button>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-500">
            Client: {clientConfig.name}
          </div>
        </div>
      </div>
    </footer>
  );
}
