import React, { useState, useEffect } from 'react';
import { Rider, PowerProfile } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import { POWER_ANALYSIS_DURATIONS_CONFIG } from '../constants';
import PowerPPRTab from '../components/riderDetailTabs/PowerPPRTab';
import ActionButton from '../components/ActionButton';
import { calculateRiderCharacteristics } from '../utils/performanceCalculations';

interface MyPerformanceSectionProps {
  rider: Rider;
  setRiders: (updater: React.SetStateAction<Rider[]>) => void;
}

export const MyPerformanceSection: React.FC<MyPerformanceSectionProps> = ({ rider, setRiders }) => {
  const [formData, setFormData] = useState<Rider>(rider);

  useEffect(() => {
    setFormData(rider);
  }, [rider]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.currentTarget;

    setFormData(prevData => {
        if (!prevData) return prevData;

        const newData = structuredClone(prevData);
        
        let currentLevel: any = newData;
        const keys = name.split('.');
        for (let i = 0; i < keys.length - 1; i++) {
            currentLevel = currentLevel[keys[i]] = currentLevel[keys[i]] || {};
        }
        const lastKey = keys[keys.length - 1];

        const numericFieldKeys = ['weightKg', 'power1s', 'power5s', 'power30s', 'power1min', 'power3min', 'power5min', 'power12min', 'power20min', 'criticalPower', 'power45min'];
        const isNumericField = numericFieldKeys.includes(lastKey);

        if (isNumericField) {
             if (value.trim() === '') {
                currentLevel[lastKey] = undefined; 
            } else {
                const parsed = parseFloat(value.replace(',', '.'));
                if (!isNaN(parsed)) {
                    currentLevel[lastKey] = parsed;
                }
            }
        } else {
            currentLevel[lastKey] = value;
        }
        
        return newData;
    });
  };


  const handleSave = () => {
    const updatedCharacteristics = calculateRiderCharacteristics(formData);
    const finalDataToSave = { ...formData, ...updatedCharacteristics };
    
    setRiders(prevRiders => {
      return prevRiders.map(r => (r.id === finalDataToSave.id ? finalDataToSave : r));
    });
    alert('Performances sauvegardées !');
  };

  return (
    <SectionWrapper title="Mes Performances (PPR)">
      <p className="text-gray-600 mb-4">
        Renseignez ici votre Profil de Puissance Record (PPR). Ces données permettront de calculer votre profil qualitatif et seront visibles par les recruteurs si vous activez la visibilité de votre profil.
      </p>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="mb-6 max-w-xs">
          <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700">Mon Poids Actuel (kg)</label>
          <input
            type="number"
            step="any"
            name="weightKg"
            id="weightKg"
            value={formData.weightKg || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 placeholder-gray-500"
            placeholder="Ex: 65.5"
          />
          <p className="text-xs text-gray-500 mt-1">Ce poids sera utilisé pour calculer vos W/kg.</p>
        </div>
        <PowerPPRTab
          formData={formData}
          handleInputChange={handleInputChange}
          formFieldsEnabled={true}
          powerDurationsConfig={POWER_ANALYSIS_DURATIONS_CONFIG}
          theme="light"
        />
        <div className="mt-6 text-right">
            <ActionButton onClick={handleSave}>
                Sauvegarder mes Performances
            </ActionButton>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default MyPerformanceSection;