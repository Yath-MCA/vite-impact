import { memo } from 'react';
import { MessageSquare, HelpCircle, FileQuestion } from 'lucide-react';

const SAMPLE_QUERIES = [
  { id: 'aq-101', type: 'Author', label: 'Please verify affiliation for corresponding author.', target: 'heading-0' },
  { id: 'ed-204', type: 'Editorial', label: 'Shorten abstract to 250 words.', target: 'heading-1' },
  { id: 'pr-309', type: 'Production', label: 'Figure 2 reference missing in section 3.', target: 'heading-2' }
];

const iconMap = {
  Author: HelpCircle,
  Editorial: MessageSquare,
  Production: FileQuestion
};

function Queries({ onJump }) {
  return (
    <div className="h-full overflow-y-auto px-2 py-2">
      <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Editorial Queries
      </div>
      <ul className="space-y-1">
        {SAMPLE_QUERIES.map((query) => {
          const Icon = iconMap[query.type] || MessageSquare;
          return (
            <li key={query.id}>
              <button
                type="button"
                className="w-full rounded-md border border-gray-200 bg-white px-2 py-2 text-left transition-colors hover:border-orange-300 hover:bg-orange-50"
                onClick={() => onJump && onJump(query.target)}
              >
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                  <Icon className="h-3.5 w-3.5" />
                  {query.type}
                  <span className="ml-auto text-[10px] text-gray-400">{query.id}</span>
                </div>
                <p className="text-xs text-gray-700">{query.label}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default memo(Queries);
