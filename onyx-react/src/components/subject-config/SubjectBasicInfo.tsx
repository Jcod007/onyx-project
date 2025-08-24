import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, AlertCircle } from 'lucide-react';

interface SubjectBasicInfoProps {
  subjectName: string;
  onNameChange: (name: string) => void;
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  onBlur: () => void;
  isCreating: boolean;
  existingName?: string;
}

export const SubjectBasicInfo: React.FC<SubjectBasicInfoProps> = ({
  subjectName,
  onNameChange,
  errors,
  touched,
  onBlur,
  isCreating,
  existingName
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen size={24} className="text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">
          {isCreating ? t('subjectConfig.newSubject', 'Nouvelle matière') : t('subjectConfig.editSubjectName', 'Modifier {{name}}', { name: existingName })}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('subjectConfig.nameYourSubject', 'Commençons par donner un nom à votre matière d\'\u00e9tude')}
        </p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <BookOpen size={16} />
          {t('subjectConfig.subjectName', 'Nom de la matière')}
          {errors.name && touched.name && (
            <span className="text-red-500 text-xs flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.name}
            </span>
          )}
        </label>
        <input
          type="text"
          value={subjectName}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={onBlur}
          className={`w-full px-4 py-3 text-lg rounded-xl border-2 transition-all ${
            errors.name && touched.name
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
          } focus:outline-none focus:ring-4`}
          placeholder={t('subjectConfig.subjectNamePlaceholder', 'Ex: Mathématiques, Histoire, Anglais...')}
          maxLength={50}
          autoFocus
        />
        
        {/* Suggestions de noms populaires */}
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">{t('subjectConfig.popularSuggestions', 'Suggestions populaires :')}</p>
          <div className="flex flex-wrap gap-2">
            {[
              t('subjectConfig.mathematics', 'Mathématiques'), 
              t('subjectConfig.french', 'Français'), 
              t('subjectConfig.history', 'Histoire'), 
              t('subjectConfig.english', 'Anglais'), 
              t('subjectConfig.science', 'Sciences'), 
              t('subjectConfig.philosophy', 'Philosophie')
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onNameChange(suggestion)}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};