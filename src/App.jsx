import { ClientProvider } from './context/ClientContext';
import { LayoutProvider } from './context/LayoutContext';
import { ModuleProvider } from './context/ModuleContext';
import { EditorProvider } from './context/EditorContext';
import AppRouter from './routes/AppRouter';
import './index.css';

function App() {
  return (
    <ClientProvider>
      <LayoutProvider>
        <ModuleProvider>
          <EditorProvider>
            <AppRouter />
          </EditorProvider>
        </ModuleProvider>
      </LayoutProvider>
    </ClientProvider>
  );
}

export default App;
