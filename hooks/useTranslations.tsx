import { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations, TranslationKey } from '../translations';

export const useTranslations = () => {
  const { language, setLanguage } = useContext(LanguageContext);

  const t = (key: TranslationKey): string => {
    const translationSet = translations[key];
    if (translationSet) {
      return translationSet[language as keyof typeof translationSet] || translationSet['en'] || key;
    }
    return key;
  };

  return { t, language, setLanguage };
};