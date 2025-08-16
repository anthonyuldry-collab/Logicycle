


import React, { useState, useEffect } from 'react';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import { DEFAULT_THEME_PRIMARY_COLOR, DEFAULT_THEME_ACCENT_COLOR, LANGUAGE_OPTIONS } from '../constants';
import { TeamLevel, Team, Address } from '../types';
import UploadIcon from '../components/icons/UploadIcon';
import TrashIcon from '../components/icons/TrashIcon';
import ConfirmationModal from '../components/ConfirmationModal';
import { useTranslations } from '../hooks/useTranslations';


interface SettingsSectionProps {
  teamLogoBase64?: string;
  teamLogoMimeType?: string;
  setTeamLogoBase64: (logo?: string) => void;
  setTeamLogoMimeType: (mimeType?: string) => void;
  themePrimaryColor?: string;
  setThemePrimaryColor: (color?: string) => void;
  themeAccentColor?: string;
  setThemeAccentColor: (color?: string) => void;
  teamLevel?: TeamLevel;
  setTeamLevel: (level: TeamLevel) => void;
  language?: 'fr' | 'en';
  setLanguage: (lang: 'fr' | 'en') => void;
  team?: Team;
  onUpdateTeam: (team: Team) => void;
}

const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const SettingsSection: React.FC<SettingsSectionProps> = ({
  teamLogoBase64,
  teamLogoMimeType,
  setTeamLogoBase64,
  setTeamLogoMimeType,
  themePrimaryColor,
  setThemePrimaryColor,
  themeAccentColor,
  setThemeAccentColor,
  teamLevel,
  setTeamLevel,
  language,
  setLanguage,
  team,
  onUpdateTeam,
}) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(
    teamLogoBase64 && teamLogoMimeType ? `data:${teamLogoMimeType};base64,${teamLogoBase64}` : null
  );
  const [levelToChange, setLevelToChange] = useState<TeamLevel | null>(null);
  const [localAddress, setLocalAddress] = useState<Address>(team?.address || {});

  useEffect(() => {
    setLocalAddress(team?.address || {});
  }, [team?.address]);

  const { t } = useTranslations();

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const mimeType = result.substring(result.indexOf(':') + 1, result.indexOf(';'));
        const base64Data = result.substring(result.indexOf(',') + 1);
        setTeamLogoBase64(base64Data);
        setTeamLogoMimeType(mimeType);
        setLogoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setTeamLogoBase64(undefined);
    setTeamLogoMimeType(undefined);
    setLogoPreview(null);
    const fileInput = document.getElementById('teamLogoUpload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handlePrimaryColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setThemePrimaryColor(event.target.value);
  };

  const handleAccentColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setThemeAccentColor(event.target.value);
  };
  
  const handleLevelChangeRequest = (newLevel: TeamLevel) => {
    if (newLevel !== teamLevel) {
      setLevelToChange(newLevel);
    }
  };

  const handleConfirmLevelChange = () => {
    if (levelToChange) {
      setTeamLevel(levelToChange);
    }
    setLevelToChange(null);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAddress = () => {
    if (team) {
      onUpdateTeam({ ...team, address: localAddress });
      alert('Adresse du club mise à jour.');
    }
  };

  const inputBaseClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow bg-white text-gray-900 placeholder-gray-400";
  const labelBaseClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <SectionWrapper title="Paramètres de l'Application">
      <div className="space-y-8">
        
        <SettingsCard title="Logo de l'Équipe">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <label htmlFor="teamLogoUpload" className={labelBaseClass}>
                Télécharger un nouveau logo
              </label>
              <div className="mt-2 flex items-center gap-4">
                <label htmlFor="teamLogoUpload" className="cursor-pointer">
                    <span className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Choisir un fichier
                    </span>
                    <input
                        type="file"
                        id="teamLogoUpload"
                        accept="image/png, image/jpeg, image/svg+xml, image/gif"
                        onChange={handleLogoUpload}
                        className="sr-only"
                    />
                </label>
                 <p className="text-xs text-gray-500">PNG, JPG, SVG. Max 2MB.</p>
              </div>
            </div>
            {logoPreview && (
              <div className="text-center">
                <p className={`${labelBaseClass} mb-2`}>Aperçu actuel :</p>
                <div className="inline-block p-2 border rounded-lg bg-gray-50 shadow-inner">
                  <img src={logoPreview} alt="Aperçu du logo" className="max-h-24 max-w-xs object-contain" />
                </div>
                <ActionButton onClick={handleRemoveLogo} variant="danger" size="sm" className="mt-2" icon={<TrashIcon className="w-3 h-3" />}>
                  Supprimer
                </ActionButton>
              </div>
            )}
          </div>
        </SettingsCard>

        <SettingsCard title="Personnalisation du Thème">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
             <div>
              <label htmlFor="themePrimaryColor" className={labelBaseClass}>
                Couleur Principale
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="themePrimaryColor"
                  value={themePrimaryColor || DEFAULT_THEME_PRIMARY_COLOR}
                  onChange={handlePrimaryColorChange}
                  className="p-1 h-10 w-10 block bg-white border border-gray-300 rounded-md cursor-pointer"
                />
                <input 
                  type="text"
                  value={themePrimaryColor || DEFAULT_THEME_PRIMARY_COLOR}
                  onChange={handlePrimaryColorChange}
                  className={inputBaseClass}
                  placeholder="#192646"
                />
              </div>
               <p className="text-xs text-gray-500 mt-2">Utilisée pour le menu latéral, les boutons principaux, etc.</p>
            </div>
            <div>
              <label htmlFor="themeAccentColor" className={labelBaseClass}>
                Couleur d'Accent
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="themeAccentColor"
                  value={themeAccentColor || DEFAULT_THEME_ACCENT_COLOR}
                  onChange={handleAccentColorChange}
                  className="p-1 h-10 w-10 block bg-white border border-gray-300 rounded-md cursor-pointer"
                />
                <input 
                  type="text"
                  value={themeAccentColor || DEFAULT_THEME_ACCENT_COLOR}
                  onChange={handleAccentColorChange}
                  className={inputBaseClass}
                  placeholder="#efa9b6"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Utilisée pour les icônes du menu et autres éléments graphiques.</p>
            </div>
           </div>
        </SettingsCard>
        
        <SettingsCard title="Niveau de la Structure">
            <p className="text-sm text-gray-600">
                Le niveau de votre équipe détermine les fonctionnalités et les calendriers accessibles, et peut être lié à votre abonnement.
            </p>
            <div>
                <label htmlFor="teamLevel" className={labelBaseClass}>
                Niveau de votre équipe
                </label>
                <select
                    id="teamLevel"
                    value={teamLevel || ''}
                    onChange={(e) => handleLevelChangeRequest(e.target.value as TeamLevel)}
                    className={`${inputBaseClass} max-w-md`}
                >
                    <option value="" disabled>-- {teamLevel ? "Sélectionner un niveau" : "Non défini"} --</option>
                    {Object.values(TeamLevel).map(level => (
                        <option key={level} value={level}>{level}</option>
                    ))}
                </select>
            </div>
        </SettingsCard>

        <SettingsCard title="Adresse du Club">
          <p className="text-sm text-gray-600">
            Définissez l'adresse de base de votre club. Elle servira de point de départ pour la recherche de staff.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="streetName" className={labelBaseClass}>Rue</label>
              <input type="text" name="streetName" id="streetName" value={localAddress.streetName || ''} onChange={handleAddressChange} className={inputBaseClass} placeholder="123 Rue de la République" />
            </div>
            <div>
              <label htmlFor="postalCode" className={labelBaseClass}>Code Postal</label>
              <input type="text" name="postalCode" id="postalCode" value={localAddress.postalCode || ''} onChange={handleAddressChange} className={inputBaseClass} placeholder="75001"/>
            </div>
            <div>
              <label htmlFor="city" className={labelBaseClass}>Ville</label>
              <input type="text" name="city" id="city" value={localAddress.city || ''} onChange={handleAddressChange} className={inputBaseClass} placeholder="Paris"/>
            </div>
            <div>
                <label htmlFor="region" className={labelBaseClass}>Région/Département</label>
                <input type="text" name="region" id="region" value={localAddress.region || ''} onChange={handleAddressChange} className={inputBaseClass} placeholder="Ex: Bretagne"/>
            </div>
            <div>
              <label htmlFor="country" className={labelBaseClass}>Pays</label>
              <input type="text" name="country" id="country" value={localAddress.country || ''} onChange={handleAddressChange} className={inputBaseClass} placeholder="France"/>
            </div>
          </div>
          <div className="text-right mt-4">
            <ActionButton onClick={handleSaveAddress}>Sauvegarder l'Adresse</ActionButton>
          </div>
        </SettingsCard>

        <SettingsCard title={t('settingsCardLanguage')}>
            <div>
                <label htmlFor="languageSelect" className={labelBaseClass}>
                    {t('settingsLabelLanguage')}
                </label>
                <select
                    id="languageSelect"
                    value={language || 'fr'}
                    onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}
                    className={`${inputBaseClass} max-w-md`}
                >
                    {LANGUAGE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>
        </SettingsCard>

      </div>

      <ConfirmationModal
        isOpen={!!levelToChange}
        onClose={() => setLevelToChange(null)}
        onConfirm={handleConfirmLevelChange}
        title="Confirmation du Changement de Niveau"
        message={
          <>
            <p>Vous êtes sur le point de changer le niveau de votre structure en <strong>{levelToChange}</strong>.</p>
            <p className="mt-2 font-semibold text-yellow-700 bg-yellow-100 p-2 rounded-md">
              Cette action peut modifier les fonctionnalités disponibles et impacter votre facturation.
            </p>
            <p className="mt-2">Voulez-vous continuer ?</p>
          </>
        }
      />
    </SectionWrapper>
  );
};

export default SettingsSection;