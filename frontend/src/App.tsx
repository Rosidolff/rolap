import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CampaignList from './pages/CampaignList';
import VaultManager from './pages/VaultManager';
import SessionRunner from './pages/SessionRunner';
import Bitacora from './pages/Bitacora';
import { useParams } from 'react-router-dom';
import AIAssistant from './components/AIAssistant'; // Importar componente
import { AudioSidebar } from './audio/AudioSidebar';

// Componente auxiliar para redirección
const RedirectToVault = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/campaign/${id}/vault`} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
        {/* Audio Sidebar (Left) */}
        <AudioSidebar />

        {/* Main Content Area (Right) */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* El Asistente vive aquí, persistente en toda la app */}
          <AIAssistant />

          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<CampaignList />} />

              {/* Redirección base */}
              <Route path="/campaign/:id" element={<RedirectToVault />} />

              <Route path="/campaign/:id/vault" element={<VaultManager />} />
              <Route path="/campaign/:id/sessions" element={<SessionRunner />} />
              <Route path="/campaign/:id/bitacora" element={<Bitacora />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;