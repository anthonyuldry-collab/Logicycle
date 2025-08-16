import React from 'react';
import { Rider, PerformanceFactorDetail } from '../../types';
import { PERFORMANCE_PROJECT_FACTORS_CONFIG } from '../../constants';
import LungsIcon from '../icons/LungsIcon';
import CyclingIcon from '../icons/CyclingIcon';
import BrainIcon from '../icons/BrainIcon';
import MountainIcon from '../icons/MountainIcon';
import TacticsIcon from '../icons/TacticsIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';

const iconComponents: Record<string, React.ElementType> = {
  LungsIcon,
  CyclingIcon,
  BrainIcon,
  MountainIcon,
  TacticsIcon,
};

interface PerformanceProjectTabProps {
    formData: Rider | Omit<Rider, 'id'>;
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    formFieldsEnabled: boolean;
}

const PerformanceProjectTab: React.FC<PerformanceProjectTabProps> = ({
    formData,
    handleInputChange,
    formFieldsEnabled
}) => {
    return (
        <div className="space-y-4">
            {PERFORMANCE_PROJECT_FACTORS_CONFIG.map(({ id, label, icon, forcesPrompts }) => {
                const IconComponent = iconComponents[icon];
                const projectData = (formData as any)[id] as PerformanceFactorDetail | undefined;
                return (
                    <details key={id} className="bg-slate-700 rounded-lg overflow-hidden" open>
                        <summary className="flex items-center p-2 cursor-pointer hover:bg-slate-600">
                            <IconComponent className="w-5 h-5 mr-2 text-pink-400"/>
                            <span className="font-semibold text-md text-slate-200">{label}</span>
                            <ChevronDownIcon className="w-4 h-4 ml-auto transition-transform open:rotate-180"/>
                        </summary>
                        <div className="p-3 border-t border-slate-600 space-y-3">
                            <div>
                                <label className="text-sm font-medium text-slate-300">Forces</label>
                                <textarea
                                    rows={4}
                                    name={`${id}.forces`}
                                    value={projectData?.forces || ''}
                                    onChange={handleInputChange}
                                    className="input-field-sm w-full"
                                    disabled={!formFieldsEnabled}
                                    placeholder={`Décrire les forces, par exemple:\n- ${forcesPrompts.join('\n- ')}`}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300">À Optimiser</label>
                                <textarea rows={2} name={`${id}.aOptimiser`} value={projectData?.aOptimiser || ''} onChange={handleInputChange} className="input-field-sm w-full" disabled={!formFieldsEnabled}/>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300">À Développer</label>
                                <textarea rows={2} name={`${id}.aDevelopper`} value={projectData?.aDevelopper || ''} onChange={handleInputChange} className="input-field-sm w-full" disabled={!formFieldsEnabled}/>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300">Besoins / Actions</label>
                                <textarea rows={2} name={`${id}.besoinsActions`} value={projectData?.besoinsActions || ''} onChange={handleInputChange} className="input-field-sm w-full" disabled={!formFieldsEnabled}/>
                            </div>
                        </div>
                    </details>
                );
            })}
        </div>
    );
};

export default PerformanceProjectTab;