import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useLayout } from '../../context/LayoutContext';

export default function AppLayout({ children }) {
  const { toggles } = useLayout();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${toggles.sidebarCollapsed ? 'md:ml-0' : ''}`}>
          <div className="min-h-full flex flex-col">
            <div className="flex-1 p-6">
              {children}
            </div>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
