import { useMemo } from 'react';
import { Wifi, WifiOff, FileText, GitBranch } from 'lucide-react';
import { useClient } from '../../context/ClientContext';
import { useEditor } from '../../context/EditorContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function EditorFooter() {
    const { clientConfig } = useClient();
    const { content, isDirty } = useEditor();
    const { isOnline } = useOnlineStatus();

    const wordCount = useMemo(() => {
        const plainText = (content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return plainText ? plainText.split(' ').length : 0;
    }, [content]);

    const version = window?.APP_CONFIG?.VERSION || '1.0.0';

    return (
        <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-4 py-2 select-none">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-2">
                {clientConfig.logo ? (
                    <img src={clientConfig.logo} alt="Logo" className="h-5 object-contain opacity-70" />
                ) : (
                    <span className="text-xs font-black tracking-tighter text-gray-400">IMPACT 6.0</span>
                )}
                    <div className="hidden text-[11px] font-medium text-gray-500 md:flex md:items-center md:gap-2">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                            {isDirty ? 'Unsaved changes' : 'All changes saved'}
                        </span>
                        <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {wordCount} words
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-gray-500">
                    <span className={`inline-flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-red-500'}`}>
                        {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-gray-600">
                        <GitBranch className="h-3.5 w-3.5" />
                        v{version}
                    </span>
                    <a
                        href="https://www.newgen.co"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-gray-700 transition-colors hover:text-orange-600"
                    >
                        Newgen KnowledgeWorks
                    </a>
                </div>
            </div>
        </footer>
    );
}
