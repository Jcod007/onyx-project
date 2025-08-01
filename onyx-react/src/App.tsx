import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { TimersPage } from '@/pages/TimersPage';
import { StudyPage } from '@/pages/StudyPage';

// Pages temporaires pour la démo
const StatisticsPage = () => (
  <div className="text-center py-16">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Statistiques</h1>
    <p className="text-gray-600">Page en cours de développement</p>
  </div>
);

const SettingsPage = () => (
  <div className="text-center py-16">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Paramètres</h1>
    <p className="text-gray-600">Page en cours de développement</p>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="timers" element={<TimersPage />} />
        <Route path="study" element={<StudyPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;