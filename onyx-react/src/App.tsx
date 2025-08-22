import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { TimersPage } from '@/pages/TimersPage';
import { StudyPage } from '@/pages/StudyPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

// Pages temporaires pour la démo
const StatisticsPage = () => {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('statistics.title')}</h1>
      <p className="text-gray-600">{t('statistics.inDevelopment', 'Page en cours de développement')}</p>
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <TimerProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="timers" element={<TimersPage />} />
              <Route path="study" element={<StudyPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="statistics" element={<StatisticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </TimerProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;