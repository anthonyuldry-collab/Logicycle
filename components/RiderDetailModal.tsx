import React, { useState, useMemo, useEffect } from 'react';
import { 
    Rider, RaceEvent, RiderEventSelection, PerformanceEntry, PowerProfile, FavoriteRace, 
    PerformanceFactorDetail, RiderRating, AllergyItem, BikeSetup, BikeSpecificMeasurements, 
    BikeFitMeasurements, RiderQualitativeProfile, Address, PerformanceNutrition, 
    SelectedProduct, TeamProduct, ClothingItem, AppState,
    RiderEventStatus, FormeStatus, MoralStatus, HealthCondition,
    DisciplinePracticed, DisciplinePracticed as DisciplinePracticedEnum,
    ClothingType, ClothingType as ClothingTypeEnum,
    AllergySeverity as AllergySeverityEnum,
    PredefinedAllergen, PredefinedAllergen as PredefinedAllergenEnum,
    ResultItem,
    Sex
} from '../types';
import { PERFORMANCE_PROJECT_FACTORS_CONFIG, defaultRiderCharCap } from '../constants';
import Modal from './Modal';
import ActionButton from './ActionButton';

// Import new tab components
import ProfileInfoTab from './riderDetailTabs/ProfileInfoTab';
import PowerPPRTab from './riderDetailTabs/PowerPPRTab';
import NutritionTab from './riderDetailTabs/NutritionTab';
import EquipmentTab from './riderDetailTabs/EquipmentTab';
import BikeSetupTab from './riderDetailTabs/BikeSetupTab';
import PerformanceProjectTab from './riderDetailTabs/PerformanceProjectTab';
import AdminTab from './riderDetailTabs/AdminTab';
import { ResultsTab } from './riderDetailTabs/ResultsTab';
import CalendarTab from './riderDetailTabs/CalendarTab';
import { calculateRiderCharacteristics } from '../utils/performanceCalculations';
import { uploadFile } from '../services/firebaseService';


interface RiderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  rider?: Rider | null; 
  raceEvents: RaceEvent[];
  riderEventSelections: RiderEventSelection[];
  performanceEntries: PerformanceEntry[];
  powerDurationsConfig: { key: keyof PowerProfile; label: string; unit: string; sortable: boolean; }[];
  calculateWkg: (power?: number, weight?: number) => string;
  isEditMode?: boolean;
  onSaveRider?: (riderData: Rider) => void;
  initialFormData?: Omit<Rider, 'id'> | Rider; 
  appState: AppState;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const getInitialPerformanceFactorDetail = (factorId: keyof Pick<Rider, 'physiquePerformanceProject' | 'techniquePerformanceProject' | 'mentalPerformanceProject' | 'environnementPerformanceProject' | 'tactiquePerformanceProject'>): PerformanceFactorDetail => {
    return {
        forces: '',
        aOptimiser: '',
        aDevelopper: '',
        besoinsActions: '',
    };
};

const createNewRiderState = (): Omit<Rider, 'id'> => ({
    firstName: '',
    lastName: '',
    charSprint: 0,
    charAnaerobic: 0,
    charPuncher: 0,
    charClimbing: 0,
    charRouleur: 0,
    generalPerformanceScore: 0,
    fatigueResistanceScore: 0,
    categories: [],
    photoUrl: undefined,
    nationality: undefined,
    teamName: undefined,
    qualitativeProfile: RiderQualitativeProfile.AUTRE,
    disciplines: [],
    forme: FormeStatus.INCONNU,
    moral: MoralStatus.INCONNU,
    healthCondition: HealthCondition.INCONNU,
    favoriteRaces: [],
    resultsHistory: [],
    address: {},
    healthInsurance: {},
    agency: {},
    performanceGoals: '',
    physiquePerformanceProject: getInitialPerformanceFactorDetail('physiquePerformanceProject'),
    techniquePerformanceProject: getInitialPerformanceFactorDetail('techniquePerformanceProject'),
    mentalPerformanceProject: getInitialPerformanceFactorDetail('mentalPerformanceProject'),
    environnementPerformanceProject: getInitialPerformanceFactorDetail('environnementPerformanceProject'),
    tactiquePerformanceProject: getInitialPerformanceFactorDetail('tactiquePerformanceProject'),
    allergies: [],
    performanceNutrition: { selectedGels: [], selectedBars: [], selectedDrinks: [] },
    roadBikeSetup: { specifics: {}, cotes: {} },
    ttBikeSetup: { specifics: {}, cotes: {} },
    clothing: [],
    powerProfileFresh: {},
    powerProfile15KJ: {},
    powerProfile30KJ: {},
    powerProfile45KJ: {},
    profilePRR: '',
    profile15KJ: '',
    profile30KJ: '',
    profile45KJ: '',
});

export const RiderDetailModal: React.FC<RiderDetailModalProps> = ({
  isOpen,
  onClose,
  rider,
  isEditMode: initialIsEditMode = false,
  onSaveRider,
  appState,
  raceEvents,
  riderEventSelections,
  performanceEntries,
  powerDurationsConfig,
}) => {
  const isNew = !rider;
  const [formData, setFormData] = useState<Rider | Omit<Rider, 'id'>>(() =>
    isNew ? createNewRiderState() : structuredClone(rider)
  );
  const [activeTab, setActiveTab] = useState('info');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [newLicenseData, setNewLicenseData] = useState<{base64: string, mimeType: string} | null>(null);
  const [newPhotoData, setNewPhotoData] = useState<{base64: string, mimeType: string} | null>(null);

  const [isEditMode, setIsEditMode] = useState(isNew || initialIsEditMode);
  const [profileReliabilityLevel, setProfileReliabilityLevel] = useState(1);

  useEffect(() => {
    if (isOpen) {
      let initialData = isNew ? createNewRiderState() : structuredClone(rider);
      
      setFormData(initialData);
      setPhotoPreview((initialData as Rider).photoUrl || null);
      setNewLicenseData(null);
      setNewPhotoData(null);
      setActiveTab('info');
      setIsEditMode(isNew || initialIsEditMode);
    }
  }, [isOpen, rider, isNew, initialIsEditMode]);

  useEffect(() => {
    const { powerProfileFresh, powerProfile15KJ, powerProfile30KJ, powerProfile45KJ } = formData as Rider;
    const hasData = (profile?: PowerProfile) => profile && Object.keys(profile).length > 0 && Object.values(profile).some(v => v !== undefined && v !== null && v > 0);
    
    let level = 1;
    if (hasData(powerProfile45KJ)) level = 4;
    else if (hasData(powerProfile30KJ)) level = 3;
    else if (hasData(powerProfile15KJ)) level = 2;
    setProfileReliabilityLevel(level);

    const updatedCharacteristics = calculateRiderCharacteristics(formData as Rider);
    
    const currentChars = formData as Rider;
    const charKeys = Object.keys(updatedCharacteristics) as Array<keyof typeof updatedCharacteristics>;

    const hasChanged = charKeys.some(charKey => {
        const updatedValue = updatedCharacteristics[charKey];
        const currentValue = currentChars[charKey];
        return Math.round(updatedValue || 0) !== Math.round(Number(currentValue) || 0);
    });

    if (hasChanged) {
      setFormData(prev => ({ 
          ...prev, 
          ...updatedCharacteristics
      }));
    }

  }, [formData]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => {
        if (!prev) return prev;
        
        const newFormData = structuredClone(prev); // Use structuredClone for safe deep copy
        const keys = name.split('.');
        
        let currentLevel: any = newFormData;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!currentLevel[key]) currentLevel[key] = {};
            currentLevel = currentLevel[key];
        }

        const lastKey = keys[keys.length - 1];
        let processedValue: any = value;
        if (type === 'checkbox') {
            processedValue = checked;
        } else if (type === 'number') {
            processedValue = value === '' ? undefined : parseFloat(value);
        }

        // Special handling for array properties like disciplines, categories
        if (type === 'checkbox' && (name === 'disciplines' || name === 'categories')) {
            const list = (newFormData as any)[name] as string[] || [];
            if (checked) {
                if (!list.includes(value)) {
                    (newFormData as any)[name] = [...list, value];
                }
            } else {
                (newFormData as any)[name] = list.filter(item => item !== value);
            }
        } else {
            currentLevel[lastKey] = processedValue;
        }

        return newFormData;
    });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const mimeType = result.substring(result.indexOf(':') + 1, result.indexOf(';'));
        setNewPhotoData({ base64: result, mimeType });
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => {
        if (!prev) return prev;
        const updated = structuredClone(prev);
        updated.photoUrl = undefined;
        return updated;
    });
    setNewPhotoData(null);
    setPhotoPreview(null);
  };
  
  const handleSave = async () => {
    if (!onSaveRider) return;
    
    let dataToSave: Rider = {
        ...(formData as Omit<Rider, 'id'>),
        id: (formData as Rider).id || `rider_${generateId()}`
    };

    if (newPhotoData && appState.activeTeamId) {
        const path = `teams/${appState.activeTeamId}/riders/${dataToSave.id}/photo`;
        const url = await uploadFile(newPhotoData.base64, path, newPhotoData.mimeType);
        dataToSave.photoUrl = url;
    }

    if (newLicenseData && appState.activeTeamId) {
        const path = `teams/${appState.activeTeamId}/riders/${dataToSave.id}/license`;
        const url = await uploadFile(newLicenseData.base64, path, newLicenseData.mimeType);
        dataToSave.licenseImageUrl = url;
        dataToSave.licenseImageBase64 = undefined;
        dataToSave.licenseImageMimeType = undefined;
    }
    
    onSaveRider(dataToSave);
  };
  
  const setFormDataForChild = (updater: React.SetStateAction<Rider | Omit<Rider, 'id'>>) => {
      setFormData(updater);
  };
  
  const handleLicenseUpdate = (base64?: string, mimeType?: string) => {
    if (base64 && mimeType) {
        setNewLicenseData({ base64, mimeType });
        setFormData(prev => {
            if (!prev) return prev;
            const updated = structuredClone(prev);
            updated.licenseImageBase64 = base64.split(',')[1];
            updated.licenseImageMimeType = mimeType;
            updated.licenseImageUrl = undefined;
            return updated;
        });
    } else {
        setNewLicenseData(null);
        setFormData(prev => {
            if (!prev) return prev;
            const updated = structuredClone(prev);
            updated.licenseImageUrl = undefined;
            updated.licenseImageBase64 = undefined;
            updated.licenseImageMimeType = undefined;
            return updated;
        });
    }
  };
  
  const tabs = [
    { id: 'info', label: 'Profil' },
    { id: 'ppr', label: 'PPR' },
    { id: 'project', label: 'Projet Perf.' },
    { id: 'results', label: 'Palmarès' },
    { id: 'calendar', label: 'Calendrier' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'equipment', label: 'Équipement' },
    { id: 'bikeSetup', label: 'Cotes Vélo' },
    { id: 'admin', label: 'Admin' },
  ];

  const renderActiveTab = () => {
    // ... same as before, but pass handleLicenseUpdate to AdminTab
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isNew ? "Nouveau Coureur" : `${formData.firstName} ${formData.lastName}`}>
      <div className="bg-slate-800 text-white -m-6 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
            <nav className="flex space-x-1 border-b border-slate-600 w-full overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-t-md whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'bg-slate-800 text-white'
                                : 'text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
            {onSaveRider && (
                <div className="flex-shrink-0 ml-4">
                    {!isEditMode ? (
                        <ActionButton onClick={() => setIsEditMode(true)}>Modifier</ActionButton>
                    ) : (
                        <div className="flex space-x-2">
                           <ActionButton variant="secondary" onClick={() => {
                                if (!isNew) {
                                    setIsEditMode(false);
                                    setFormData(structuredClone(rider)); // Reset changes
                                } else {
                                    onClose();
                                }
                           }}>
                               Annuler
                           </ActionButton>
                           <ActionButton onClick={handleSave}>Sauvegarder</ActionButton>
                        </div>
                    )}
                </div>
            )}
        </div>
        <div className="max-h-[calc(85vh - 120px)] overflow-y-auto p-1 pr-3">
             {activeTab === 'admin' && (
                <AdminTab 
                    formData={formData} 
                    handleInputChange={handleInputChange} 
                    formFieldsEnabled={isEditMode} 
                    handleLicenseUpdate={handleLicenseUpdate} 
                    isContractEditable={true} 
                />
            )}
            {/* ... other tabs ... */}
        </div>
      </div>
    </Modal>
  );
};