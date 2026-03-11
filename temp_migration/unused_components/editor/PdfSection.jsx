import { useEditor, VIEW_MODES } from '../../context/EditorContext';
import PdfPreview from './PdfPreview';

export default function PdfSection() {
    const { viewMode } = useEditor();

    if (!(viewMode === VIEW_MODES.PDF || viewMode === VIEW_MODES.SPLIT || viewMode === VIEW_MODES.FOUR_COLUMN)) {
        return null;
    }

    return (
        <div className={`flex-1 flex flex-col overflow-hidden bg-gray-200/50 dark:bg-gray-950/50 backdrop-blur-sm border-l border-gray-200 dark:border-gray-700 ${viewMode === VIEW_MODES.SPLIT ? 'h-1/2 border-t border-gray-200 dark:border-gray-700' : 'h-full'}`}>
            <PdfPreview />
        </div>
    );
}
