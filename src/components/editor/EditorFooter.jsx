import { useClient } from '../../context/ClientContext';

export default function EditorFooter() {
    const { clientConfig } = useClient();

    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 h-10 px-4 flex items-center justify-between select-none">
            <div className="flex items-center space-x-2">
                {clientConfig.logo ? (
                    <img src={clientConfig.logo} alt="Logo" className="h-5 object-contain opacity-70" />
                ) : (
                    <span className="text-xs font-black tracking-tighter text-gray-400">IMPACT 6.0</span>
                )}
            </div>

            <div className="flex items-center space-x-1.5 text-[10px] text-gray-500 font-medium tracking-tight">
                <span>Developed and Maintained by</span>
                <a
                    href="https://www.newgen.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors"
                >
                    <span className="bg-primary-600 text-white px-1 rounded-[2px] text-[9px]">N</span>
                    <span>Newgen KnowledgeWorks</span>
                </a>
            </div>
        </footer>
    );
}
