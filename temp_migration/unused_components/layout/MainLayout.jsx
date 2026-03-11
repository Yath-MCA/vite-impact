import { Outlet } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';

export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f3ec]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-gray-200 bg-white px-4 py-3">
          <div className="text-sm font-semibold text-gray-700">CMS Workspace</div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
