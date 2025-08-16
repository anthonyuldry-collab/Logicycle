
import React from 'react';
import { Rider, PowerProfile } from '../../types';

interface PowerPPRTabProps {
    formData: Rider | Omit<Rider, 'id'>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    formFieldsEnabled: boolean;
    powerDurationsConfig: { key: keyof PowerProfile; label: string; unit: string; sortable: boolean; }[];
    theme?: 'light' | 'dark';
}

const PowerPPRTab: React.FC<PowerPPRTabProps> = ({
    formData,
    handleInputChange,
    formFieldsEnabled,
    powerDurationsConfig,
    theme = 'dark'
}) => {
    const inputClasses = theme === 'light'
        ? "block w-full px-2 py-1 border rounded-md shadow-sm sm:text-sm bg-white text-gray-900 border-gray-300 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
        : "input-field-sm";
        
    const containerClasses = theme === 'light'
        ? "bg-gray-50 p-3 rounded-md border"
        : "bg-slate-700 p-2 rounded-md";
        
    const titleClasses = theme === 'light'
        ? "text-md font-semibold text-gray-800 mb-2"
        : "text-sm font-semibold uppercase text-slate-300 mb-1.5";
        
    const labelClasses = theme === 'light'
        ? "block text-sm font-medium text-gray-700"
        : "block text-[10px] font-medium text-slate-300";
        
    const noteLabelClasses = theme === 'light'
        ? "block text-sm font-medium text-gray-700 mt-2"
        : "block text-[10px] font-medium text-slate-300";
        
    const noteTextClasses = theme === 'light'
        ? "text-xs text-gray-500 mt-1 italic"
        : "text-xs text-slate-400 mt-1 italic";

    const renderPowerProfileSectionInputs = (
        profileKey: keyof Pick<Rider, 'powerProfileFresh' | 'powerProfile15KJ' | 'powerProfile30KJ' | 'powerProfile45KJ'>, 
        profileNoteFieldName: keyof Pick<Rider, 'profilePRR' | 'profile15KJ' | 'profile30KJ' | 'profile45KJ'>, 
        title: string
    ) => {
        const profileData = formData[profileKey];
        const noteValue = formData[profileNoteFieldName] || '';

        return (
            <div className={`${containerClasses} mb-2`}>
                <h5 className={titleClasses}>{title}</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-2 text-xs">
                    {powerDurationsConfig.map(pdc => (
                        <div key={pdc.key} className="flex flex-col">
                            <label htmlFor={`${profileKey}.${pdc.key}`} className={labelClasses}>{pdc.label} ({pdc.unit})</label>
                            <input
                                type="number"
                                step="any"
                                name={`${profileKey}.${pdc.key}`}
                                id={`${profileKey}.${pdc.key}`}
                                value={profileData?.[pdc.key] ?? ''}
                                onChange={handleInputChange}
                                className={inputClasses}
                                disabled={!formFieldsEnabled}
                            />
                        </div>
                    ))}
                </div>
                {formFieldsEnabled ? (
                    <div className="mt-2">
                    <label htmlFor={profileNoteFieldName} className={noteLabelClasses}>Note pour {title}:</label>
                    <textarea
                        id={profileNoteFieldName}
                        name={profileNoteFieldName}
                        value={noteValue}
                        onChange={handleInputChange}
                        rows={1}
                        className={`${inputClasses} w-full text-xs`}
                        disabled={!formFieldsEnabled}
                    />
                    </div>
                ) : (
                    noteValue && <p className={noteTextClasses}>Note: {noteValue}</p>
                )
                }
            </div>
        );
    };
    
    const getDropColorClass = (dropPercentage?: number): string => {
        if (dropPercentage === undefined || dropPercentage >= -2) {
            return theme === 'light' ? 'text-gray-800' : 'text-slate-200';
        }
        const absDrop = Math.abs(dropPercentage);
        if (absDrop <= 10) return 'text-yellow-500 font-semibold';
        if (absDrop <= 20) return 'text-orange-500 font-semibold';
        return 'text-red-500 font-semibold';
    };

    return (
        <div className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                    {renderPowerProfileSectionInputs('powerProfileFresh', 'profilePRR', 'Profil - Frais')}
                    {renderPowerProfileSectionInputs('powerProfile15KJ', 'profile15KJ', 'Profil - 15 kJ/kg')}
                    {renderPowerProfileSectionInputs('powerProfile30KJ', 'profile30KJ', 'Profil - 30 kJ/kg')}
                    {renderPowerProfileSectionInputs('powerProfile45KJ', 'profile45KJ', 'Profil - 45 kJ/kg')}
                </div>
                <div className={containerClasses}>
                     <h5 className={`${titleClasses} text-center`}>Analyse de Fatigue</h5>
                     <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                            <thead className={theme === 'light' ? "bg-gray-200 text-gray-600" : "bg-slate-600 text-slate-300"}>
                                <tr>
                                    <th className="p-1.5 text-left">Métrique</th>
                                    <th className="p-1.5 text-right">Frais (W/kg)</th>
                                    <th className="p-1.5 text-right">15kJ (W/kg)</th>
                                    <th className="p-1.5 text-right">Δ% (15kJ)</th>
                                    <th className="p-1.5 text-right">30kJ (W/kg)</th>
                                    <th className="p-1.5 text-right">Δ% (30kJ)</th>
                                    <th className="p-1.5 text-right">45kJ (W/kg)</th>
                                    <th className="p-1.5 text-right">Δ% (45kJ)</th>
                                </tr>
                            </thead>
                            <tbody>
                            {powerDurationsConfig.map(pdc => {
                                const freshVal = formData.powerProfileFresh?.[pdc.key];
                                const kj15Val = formData.powerProfile15KJ?.[pdc.key];
                                const kj30Val = formData.powerProfile30KJ?.[pdc.key];
                                const kj45Val = formData.powerProfile45KJ?.[pdc.key];
                                const weight = formData.weightKg;

                                const freshWkg = (freshVal && weight) ? freshVal / weight : undefined;
                                const kj15Wkg = (kj15Val && weight) ? kj15Val / weight : undefined;
                                const kj30Wkg = (kj30Val && weight) ? kj30Val / weight : undefined;
                                const kj45Wkg = (kj45Val && weight) ? kj45Val / weight : undefined;

                                const drop15 = (freshWkg && kj15Wkg) ? ((kj15Wkg - freshWkg) / freshWkg) * 100 : undefined;
                                const drop30 = (freshWkg && kj30Wkg) ? ((kj30Wkg - freshWkg) / freshWkg) * 100 : undefined;
                                const drop45 = (freshWkg && kj45Wkg) ? ((kj45Wkg - freshWkg) / freshWkg) * 100 : undefined;

                                const kj15Color = getDropColorClass(drop15);
                                const kj30Color = getDropColorClass(drop30);
                                const kj45Color = getDropColorClass(drop45);

                                return (
                                    <tr key={pdc.key} className={`border-b ${theme === 'light' ? 'border-gray-200' : 'border-slate-600'}`}>
                                        <td className={`p-1.5 ${theme === 'light' ? 'text-gray-700' : 'text-slate-300'}`}>{pdc.label}</td>
                                        <td className={`p-1.5 text-right font-medium ${theme === 'light' ? 'text-gray-800' : 'text-slate-200'}`}>{freshWkg?.toFixed(1) ?? '-'}</td>
                                        
                                        <td className={`p-1.5 text-right ${kj15Color}`}>{kj15Wkg?.toFixed(1) ?? '-'}</td>
                                        <td className={`p-1.5 text-right ${kj15Color}`}>{drop15?.toFixed(0) ?? '-'}%</td>
                                        
                                        <td className={`p-1.5 text-right ${kj30Color}`}>{kj30Wkg?.toFixed(1) ?? '-'}</td>
                                        <td className={`p-1.5 text-right ${kj30Color}`}>{drop30?.toFixed(0) ?? '-'}%</td>
                                        
                                        <td className={`p-1.5 text-right ${kj45Color}`}>{kj45Wkg?.toFixed(1) ?? '-'}</td>
                                        <td className={`p-1.5 text-right ${kj45Color}`}>{drop45?.toFixed(0) ?? '-'}%</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                     </div>
                </div>
           </div>
        </div>
    );
};

export default PowerPPRTab;
