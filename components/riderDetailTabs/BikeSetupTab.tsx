import React from 'react';
import { Rider, BikeSpecificMeasurements, BikeFitMeasurements } from '../../types';
import { BIKE_SETUP_SPECIFIC_FIELDS, BIKE_SETUP_COTES_FIELDS } from '../../constants';

interface BikeSetupTabProps {
    formData: Rider | Omit<Rider, 'id'>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    formFieldsEnabled: boolean;
}

const BikeSetupTab: React.FC<BikeSetupTabProps> = ({
    formData,
    handleInputChange,
    formFieldsEnabled
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['roadBikeSetup', 'ttBikeSetup'] as const).map(bikeType => (
                <div key={bikeType} className="space-y-3">
                    <h5 className={`text-md font-semibold p-2 rounded-t-md ${bikeType === 'roadBikeSetup' ? 'bg-pink-600 text-white' : 'bg-orange-500 text-white'}`}>
                        {bikeType === 'roadBikeSetup' ? 'Vélo Route' : 'Vélo CLM'}
                    </h5>
                    <div className="bg-slate-700 p-3 rounded-b-md space-y-2">
                        <h6 className="text-sm font-medium text-slate-300 border-b border-slate-600 pb-1">Spécifique Vélo</h6>
                        {BIKE_SETUP_SPECIFIC_FIELDS.map(field => (
                            <div key={String(field.key)} className="grid grid-cols-2 items-center">
                                <label htmlFor={`${bikeType}-specifics-${String(field.key)}`} className="text-xs text-slate-400">{field.label}:</label>
                                <input type="text" name={`${bikeType}.specifics.${String(field.key)}`} id={`${bikeType}-specifics-${String(field.key)}`} value={(formData[bikeType]?.specifics as any)?.[field.key] || ''} onChange={handleInputChange} className="input-field-sm" disabled={!formFieldsEnabled}/>
                            </div>
                        ))}
                    </div>
                    <div className="bg-slate-700 p-3 rounded-md space-y-2 mt-3">
                        <h6 className="text-sm font-medium text-slate-300 border-b border-slate-600 pb-1">Cotes</h6>
                        {BIKE_SETUP_COTES_FIELDS.map(field => (
                             <div key={String(field.key)} className="grid grid-cols-2 items-center">
                                <label htmlFor={`${bikeType}-cotes-${String(field.key)}`} className="text-xs text-slate-400">{field.label}:</label>
                                <input type="text" name={`${bikeType}.cotes.${String(field.key)}`} id={`${bikeType}-cotes-${String(field.key)}`} value={(formData[bikeType]?.cotes as any)?.[field.key] || ''} onChange={handleInputChange} className="input-field-sm" disabled={!formFieldsEnabled}/>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BikeSetupTab;