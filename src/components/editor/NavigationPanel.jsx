import { memo, useMemo, useState } from 'react';
import { BookOpen, MessageSquare, MessagesSquare } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import Toc from './Toc';
import Queries from './Queries';
import Comments from './Comments';

const TABS = [
  { id: 'toc', label: 'TOC', icon: BookOpen },
  { id: 'queries', label: 'Queries', icon: MessageSquare },
  { id: 'comments', label: 'Comments', icon: MessagesSquare }
];

function NavigationPanel() {
  const { scrollToHeading } = useEditor();
  const [activeTab, setActiveTab] = useState('toc');

  const content = useMemo(() => {
    if (activeTab === 'toc') {
      return <Toc onNavigate={scrollToHeading} />;
    }

    if (activeTab === 'queries') {
      return <Queries onJump={scrollToHeading} />;
    }

    return <Comments onJump={scrollToHeading} />;
  }, [activeTab, scrollToHeading]);

  return (
    <section className="flex h-full flex-col overflow-hidden bg-white" aria-label="Navigation panel">
      <div className="border-b border-gray-200 bg-white px-2 py-2">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                aria-pressed={active}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1">{content}</div>
    </section>
  );
}

export default memo(NavigationPanel);
