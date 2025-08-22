import React from 'react';
import { Settings, Palette, Clock, Database, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-600">
          {t('settings.general')}
        </p>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-6">
        {/* Appearance Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Palette size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t('settings.appearance')}</h3>
              <p className="text-sm text-gray-600">{t('settings.appearance')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.theme')}
              </label>
              <select className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="light">{t('settings.lightMode')}</option>
                <option value="dark">{t('settings.darkMode')}</option>
                <option value="auto">{t('settings.systemTheme')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timer Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t('timers.title')}</h3>
              <p className="text-sm text-gray-600">{t('timers.title')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">{t('settings.notificationSettings.sound')}</span>
                <p className="text-xs text-gray-500">{t('settings.notificationSettings.sound')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">{t('common.start')}</span>
                <p className="text-xs text-gray-500">{t('timers.breakTime')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Database size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t('statistics.title')}</h3>
              <p className="text-sm text-gray-600">{t('statistics.overview')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Database size={16} />
              {t('common.save')}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <Database size={16} />
              {t('common.reset')}
            </button>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Globe size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t('settings.language')}</h3>
              <p className="text-sm text-gray-600">{t('settings.general')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.language')}
              </label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="fr">{t('settings.languages.fr')}</option>
                <option value="en">{t('settings.languages.en')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Settings size={20} className="text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t('settings.general')}</h3>
              <p className="text-sm text-gray-600">{t('settings.general')}</p>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{t('settings.general')}</p>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center py-8 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Onyx Study Timer v1.0.0
        </p>
      </div>
    </div>
  );
};