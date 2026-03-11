import { useEditor } from '../../context/EditorContext';
import { useLayout } from '../../context/LayoutContext';

export default function EditorHeader({ loadRandomContent, handleSave, editorData, isLoading }) {
    const { viewMode, setViewMode, isDirty } = useEditor();
    const { toggles, toggle } = useLayout();

    return (
        <header className="flex flex-col bg-red-600 border-b-8 border-yellow-400 p-4 min-h-[100px] z-[99999] w-full text-white font-black text-2xl uppercase shadow-2xl">
            <div className="flex items-center justify-between h-full">
                <div className="flex items-center space-x-4">
                    <span>DEBUG: EDITOR HEADER</span>
                    <button onClick={loadRandomContent} className="bg-white text-black px-4 py-2 rounded">LOAD_RANDOM</button>
                    <button onClick={handleSave} className="bg-blue-500 px-4 py-2 rounded">SAVE_DOC</button>
                </div>
                <div className="flex items-center space-x-4">
                    <span>DIRTY: {isDirty ? 'YES' : 'NO'}</span>
                    <span>MODE: {viewMode}</span>
                    <button onClick={() => toggle('showToc')} className="bg-gray-800 px-4 py-2 rounded">TOC</button>
                </div>
            </div>
        </header>
    );
}
