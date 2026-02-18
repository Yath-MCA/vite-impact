import { useEffect } from 'react';
import { useModule, MODULE_TYPES } from '../../context/ModuleContext';
import { X, Maximize2, Minimize2 } from 'lucide-react';

export default function ModuleManager() {
  const { 
    activeModals, 
    activeSidebars, 
    closeModule, 
    closeAllModules,
    modalStack 
  } = useModule();

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && modalStack.length > 0) {
        closeModule(modalStack[modalStack.length - 1]);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [modalStack, closeModule]);

  return (
    <>
      {/* Modals */}
      {activeModals.map(({ name, component: Component, props }, index) => (
        <div
          key={name}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ zIndex: 1000 + index }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => closeModule(name)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {props.title || name}
              </h3>
              <div className="flex items-center space-x-2">
                <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Maximize2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                <button 
                  onClick={() => closeModule(name)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <Component {...props} onClose={() => closeModule(name)} />
            </div>
          </div>
        </div>
      ))}

      {/* Right Sidebars */}
      {activeSidebars.length > 0 && (
        <div className="fixed right-0 top-0 h-full z-40 flex">
          {activeSidebars.map(({ name, component: Component, props }, index) => (
            <div
              key={name}
              className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col"
              style={{ 
                marginRight: index * 320,
                height: '100vh',
                marginTop: '64px'
              }}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {props.title || name}
                </h3>
                <button 
                  onClick={() => closeModule(name)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <Component {...props} onClose={() => closeModule(name)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
