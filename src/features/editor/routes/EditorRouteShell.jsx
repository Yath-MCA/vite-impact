import { EditorProvider } from '../../../context/EditorContext';
import { LayoutProvider } from '../../../context/LayoutContext';
import { ModuleProvider } from '../../../context/ModuleContext';

export function createEditorRoute(Component, readOnly = false) {
  return function EditorRoute() {
    return (
      <EditorProvider>
        <LayoutProvider>
          <ModuleProvider>
            <Component readOnly={readOnly} />
          </ModuleProvider>
        </LayoutProvider>
      </EditorProvider>
    );
  };
}
