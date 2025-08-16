import React, { useState, useEffect } from 'react';
import { Rider, PerformanceFactorDetail } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import { PERFORMANCE_PROJECT_FACTORS_CONFIG } from '../constants';
import LungsIcon from '../components/icons/LungsIcon';
import CyclingIcon from '../components/icons/CyclingIcon';
import BrainIcon from '../components/icons/BrainIcon';
import MountainIcon from '../components/icons/MountainIcon';
import TacticsIcon from '../components/icons/TacticsIcon';

const iconComponents: Record<string, React.ElementType> = {
  LungsIcon,
  CyclingIcon,
  BrainIcon,
  MountainIcon,
  TacticsIcon,
};

interface PerformanceProjectSectionProps {
  rider: Rider | undefined;
  setRiders: (updater: React.SetStateAction<Rider[]>) => void;
}

export const PerformanceProjectSection: React.FC<PerformanceProjectSectionProps> = ({ rider, setRiders }) => {
  const [formData, setFormData] = useState<Rider | null>(rider || null);

  useEffect(() => {
    setFormData(rider || null);
  }, [rider]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prevData => {
        if (!prevData) return null;
        
        const newData = structuredClone(prevData);
        
        let currentLevel: any = newData;
        const keys = name.split('.');
        for (let i = 0; i < keys.length - 1; i++) {
            currentLevel = currentLevel[keys[i]] = currentLevel[keys[i]] || {};
        }
        currentLevel[keys[keys.length - 1]] = value;
        
        return newData;
    });
  };

  const handleSave = () => {
    if (formData) {
      setRiders(prevRiders => prevRiders.map(r => r.id === formData.id ? formData : r));
      alert('Projet de performance sauvegardé !');
    }
  };

  if (!formData) {
    return <SectionWrapper title="Mon Projet Performance"><p>Chargement des données...</p></SectionWrapper>;
  }
  
  const textareaClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <SectionWrapper title="Mon Projet Performance" actionButton={<ActionButton onClick={handleSave}>Sauvegarder mon Projet</ActionButton>}>
      <p className="text-gray-600 mb-6">
        Décrivez vos forces et les axes de travail pour chaque grand domaine de la performance. Ce document servira de base de discussion avec votre entraîneur et le pôle performance.
      </p>
      <div className="space-y-6">
        {PERFORMANCE_PROJECT_FACTORS_CONFIG.map(({ id, label, icon, forcesPrompts }) => {
          const IconComponent = iconComponents[icon];
          const projectData = (formData as any)[id] as PerformanceFactorDetail | undefined;
          return (
            <div key={id} className="bg-white p-4 rounded-lg shadow-md border">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <IconComponent className="w-6 h-6 mr-3 text-blue-500" />
                {label}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`${id}.forces`} className={labelClass}>Forces</label>
                    <textarea
                        id={`${id}.forces`}
                        rows={5}
                        name={`${id}.forces`}
                        value={projectData?.forces || ''}
                        onChange={handleInputChange}
                        className={textareaClass}
                        placeholder={`Ex:\n- ${forcesPrompts.join('\n- ')}`}
                    />
                  </div>
                  <div>
                    <label htmlFor={`${id}.aOptimiser`} className={labelClass}>À Optimiser (détails techniques, points faibles)</label>
                    <textarea id={`${id}.aOptimiser`} rows={5} name={`${id}.aOptimiser`} value={projectData?.aOptimiser || ''} onChange={handleInputChange} className={textareaClass}/>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor={`${id}.aDevelopper`} className={labelClass}>À Développer (qualités à acquérir)</label>
                    <textarea id={`${id}.aDevelopper`} rows={3} name={`${id}.aDevelopper`} value={projectData?.aDevelopper || ''} onChange={handleInputChange} className={textareaClass}/>
                  </div>
                   <div className="md:col-span-2">
                    <label htmlFor={`${id}.besoinsActions`} className={labelClass}>Besoins / Actions à Mettre en Place</label>
                    <textarea id={`${id}.besoinsActions`} rows={3} name={`${id}.besoinsActions`} value={projectData?.besoinsActions || ''} onChange={handleInputChange} className={textareaClass} placeholder="Ex: Analyse de données de course, stage en montagne, préparation mentale spécifique..."/>
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
};