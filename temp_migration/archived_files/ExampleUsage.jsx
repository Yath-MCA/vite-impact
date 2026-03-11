import { useEffect } from 'react';
import { useOverlay, OVERLAY_TYPES } from './overlay/OverlayProvider';
import { useModuleRegistry, FOOTER_TYPES } from './modules/ModuleRegistry';
import { useErrorTracker } from './error/ErrorTrackerProvider';
import OverlayManager from './overlay/OverlayManager';
import ErrorBoundary from './error/ErrorBoundary';

// Example Module Component
function ExampleModule({ title, onAction }) {
  const { logError } = useErrorTracker();

  const handleError = () => {
    try {
      throw new Error('Test error from module');
    } catch (err) {
      logError(err, { module: 'ExampleModule', action: 'test' });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title || 'Example Module'}</h3>
      <p className="text-gray-600 dark:text-gray-400">
        This is an example module that demonstrates the overlay system.
      </p>
      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Module content goes here. This module can be displayed as a dialog, popout, or sidebar.
        </p>
      </div>
      <button
        onClick={handleError}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Trigger Test Error
      </button>
    </div>
  );
}

// Settings Module
function SettingsModule() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Setting 1</label>
        <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Enter value" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Setting 2</label>
        <select className="w-full px-3 py-2 border rounded-lg">
          <option>Option 1</option>
          <option>Option 2</option>
        </select>
      </div>
    </div>
  );
}

// Example Usage Component
export default function ExampleUsage() {
  const { openOverlay, openModule } = useOverlay();
  const { registerModule } = useModuleRegistry();

  // Register modules on mount
  useEffect(() => {
    // Register example module with actions footer
    registerModule({
      name: 'example',
      component: ExampleModule,
      defaultType: OVERLAY_TYPES.DIALOG,
      dropOver: true,
      footerType: FOOTER_TYPES.ACTIONS,
      width: 500,
      height: 400
    });

    // Register settings module without footer
    registerModule({
      name: 'settings',
      component: SettingsModule,
      defaultType: OVERLAY_TYPES.SIDEBAR,
      dropOver: true,
      footerType: FOOTER_TYPES.NONE,
      width: 350
    });
  }, [registerModule]);

  const handleOpenDialog = () => {
    openOverlay({
      type: OVERLAY_TYPES.DIALOG,
      title: 'Example Dialog',
      component: ExampleModule,
      dropOver: true,
      footerType: FOOTER_TYPES.ACTIONS,
      width: 500,
      height: 400,
      props: { title: 'Dialog Mode' },
      onAction: (action) => {
        console.log('Action:', action);
      }
    });
  };

  const handleOpenPopout = () => {
    openOverlay({
      type: OVERLAY_TYPES.POPOUT,
      title: 'Draggable Popout',
      component: ExampleModule,
      dropOver: false,
      footerType: FOOTER_TYPES.NONE,
      width: 600,
      height: 450,
      position: { x: 100, y: 100 },
      props: { title: 'Popout Mode' }
    });
  };

  const handleOpenSidebar = () => {
    openOverlay({
      type: OVERLAY_TYPES.SIDEBAR,
      title: 'Sidebar Panel',
      component: ExampleModule,
      dropOver: true,
      footerType: FOOTER_TYPES.ACTIONS,
      width: 400,
      props: { title: 'Sidebar Mode' }
    });
  };

  const handleOpenViaRegistry = () => {
    openModule('example', { 
      title: 'From Registry',
      onAction: (action) => console.log('Registry action:', action)
    });
  };

  const handleOpenSettings = () => {
    openModule('settings');
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-8">Overlay System Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 border rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Direct Overlay Opening</h2>
          <div className="space-y-2">
            <button
              onClick={handleOpenDialog}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Open Dialog
            </button>
            <button
              onClick={handleOpenPopout}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Open Popout (Draggable)
            </button>
            <button
              onClick={handleOpenSidebar}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Open Sidebar
            </button>
          </div>
        </div>

        <div className="p-6 border rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Via Module Registry</h2>
          <div className="space-y-2">
            <button
              onClick={handleOpenViaRegistry}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Open Example Module
            </button>
            <button
              onClick={handleOpenSettings}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Open Settings
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 border rounded-xl bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Dynamic type switching (dialog ⇄ popout ⇄ sidebar)</li>
          <li>Minimize to dock</li>
          <li>Fullscreen toggle</li>
          <li>Draggable popouts with resize</li>
          <li>ESC key closes top overlay</li>
          <li>Error tracking with boundary</li>
          <li>Configurable footers</li>
        </ul>
      </div>

      <OverlayManager />
    </div>
  );
}
