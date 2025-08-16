import React, { useMemo } from 'react';
import { Rider, RiderQualitativeProfile as RiderQualitativeProfileEnum, FormeStatus, MoralStatus, HealthCondition, DisciplinePracticed as DisciplinePracticedEnum, Sex } from '../../types';
import { SPIDER_CHART_CHARACTERISTICS_CONFIG, RIDER_LEVEL_CATEGORIES } from '../../constants';
import ActionButton from '../ActionButton';
import TrashIcon from '../icons/TrashIcon';
import UserCircleIcon from '../icons/UserCircleIcon';

const SpiderChart: React.FC<{ data: { axis: string; value: number }[]; size?: number; maxValue?: number }> = ({ data, size = 150, maxValue = 100 }) => {
    const numAxes = data.length;
    if (numAxes < 3) return <p className="text-xs text-center text-gray-400">Données insuffisantes pour le graphique radar.</p>;

    const angleSlice = (Math.PI * 2) / numAxes;
    const radius = size / 3;
    const center = size / 2;

    const points = data.map((d, i) => {
        const value = Math.max(0, Math.min(d.value || 0, maxValue));
        const x = center + radius * (value / maxValue) * Math.cos(angleSlice * i - Math.PI / 2);
        const y = center + radius * (value / maxValue) * Math.sin(angleSlice * i - Math.PI / 2);
        return `${x},${y}`;
    }).join(' ');

    const axisLines = data.map((d, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        
        const x2 = center + radius * cosAngle;
        const y2 = center + radius * sinAngle;

        const labelOffset = 10;
        const lx = center + (radius + labelOffset) * cosAngle;
        const ly = center + (radius + labelOffset) * sinAngle;
        
        const anchorTolerance = 3;
        let textAnchor = "middle";
        if (lx > center + anchorTolerance) {
            textAnchor = "start";
        } else if (lx < center - anchorTolerance) {
            textAnchor = "end";
        }

        return { x1: center, y1: center, x2, y2, label: d.axis, lx, ly, textAnchor };
    });
    
    const gridLevels = 5;
    const concentricPolygons = Array.from({ length: gridLevels }).map((_, levelIndex) => {
        const levelRadius = radius * ((levelIndex + 1) / gridLevels);
        return data.map((d, i) => {
            const x = center + levelRadius * Math.cos(angleSlice * i - Math.PI / 2);
            const y = center + levelRadius * Math.sin(angleSlice * i - Math.PI / 2);
            return `${x},${y}`;
        }).join(' ');
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
            <g>
                {concentricPolygons.map((polyPoints, i) => (
                    <polygon key={`grid-${i}`} points={polyPoints} fill="none" stroke="rgba(107, 114, 128, 0.5)" strokeWidth="0.5" />
                ))}
                {axisLines.map((line, i) => (
                    <line key={`axis-${i}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="rgba(107, 114, 128, 0.7)" strokeWidth="0.5" />
                ))}
                <polygon points={points} fill="rgba(239, 169, 182, 0.5)" stroke="rgba(239, 169, 182, 1)" strokeWidth="1" /> {/* Accent color fill/stroke */}
                {axisLines.map((line, i) => (
                    <text
                        key={`label-${i}`}
                        x={line.lx}
                        y={line.ly}
                        fontSize="6"
                        fill="rgb(203, 213, 225)"
                        textAnchor={line.textAnchor as any}
                        dominantBaseline="middle"
                    >
                        {line.label}
                    </text>
                ))}
            </g>
        </svg>
    );
};

const ReliabilityIndicator: React.FC<{ level: number }> = ({ level }) => {
    const descriptions = [
        "Fiabilité de base (données à frais uniquement).",
        "Fiabilité améliorée avec données de pré-fatigue (15/30kJ).",
        "Fiabilité élevée avec données de fatigue avancée (45kJ)."
    ];
    
    return (
        <div className="bg-slate-800 p-2 rounded-md text-center" title={descriptions[level - 1]}>
            <h5 className="text-xs font-semibold text-slate-400 mb-1">Fiabilité du Profil</h5>
            <div className="flex justify-center text-lg">
                {[...Array(3)].map((_, i) => (
                    <span key={i} className={i < level ? 'text-yellow-400' : 'text-slate-600'}>★</span>
                ))}
            </div>
        </div>
    );
};

interface ProfileInfoTabProps {
    formData: Rider | Omit<Rider, 'id'>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    formFieldsEnabled: boolean;
    photoPreview: string | null;
    handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemovePhoto: () => void;
    profileReliabilityLevel: number;
}

const getAgeCategory = (birthDate?: string): { category: string; age: number | null } => {
    if (!birthDate || typeof birthDate !== 'string') {
        return { category: 'N/A', age: null };
    }
    
    // Use Date.parse for more flexible parsing, then create a Date object.
    const birthTime = Date.parse(birthDate);
    if (isNaN(birthTime)) {
        return { category: 'N/A', age: null };
    }
    
    const birth = new Date(birthTime);
    const today = new Date();
    
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    if (age < 0 || age > 120) { // Sanity check
        return { category: 'N/A', age: null };
    }

    let category = 'Senior';
    if (age <= 14) category = 'U15';
    else if (age <= 16) category = 'U17';
    else if (age <= 18) category = 'U19';
    else if (age <= 22) category = 'U23';
    
    return { category, age };
};

const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({
    formData,
    handleInputChange,
    formFieldsEnabled,
    photoPreview,
    handlePhotoUpload,
    handleRemovePhoto,
    profileReliabilityLevel,
}) => {
    const { age, category } = useMemo(() => getAgeCategory(formData.birthDate), [formData.birthDate]);
    const spiderChartData = useMemo(() => {
        return SPIDER_CHART_CHARACTERISTICS_CONFIG.map(char => ({
            axis: char.label,
            value: (formData as any)[char.key] || 0,
        }));
    }, [formData]);

    const calculatedCharsData = useMemo(() => {
        return SPIDER_CHART_CHARACTERISTICS_CONFIG.map(char => ({
            label: char.label,
            value: (formData as any)[char.key] || 0,
        }));
    }, [formData]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
                {/* Photo and basic info */}
                <div className="flex flex-col items-center">
                    {photoPreview ? (
                        <img src={photoPreview} alt={`${formData.firstName} ${formData.lastName}`} className="w-28 h-28 rounded-full object-cover mb-2 border-2 border-slate-500" />
                    ) : (
                        <UserCircleIcon className="w-28 h-28 text-slate-500" />
                    )}
                    {formFieldsEnabled && (
                        <div className="text-center">
                            <input type="file" id="riderPhotoUpload" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                            <label htmlFor="riderPhotoUpload" className="cursor-pointer text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 font-bold py-1 px-2 rounded inline-flex items-center">
                                Changer Photo
                            </label>
                            {photoPreview && <button type="button" onClick={handleRemovePhoto} className="text-xs text-red-400 hover:underline mt-1 ml-2">Supprimer</button>}
                        </div>
                    )}
                </div>
                
                <div className="text-center">
                    <h3 className="text-xl font-bold text-white">{formData.firstName} {formData.lastName}</h3>
                    <p className="text-sm text-slate-300">{formData.nationality}</p>
                    <p className="text-xs text-slate-400">{age} ans ({category})</p>
                </div>
                
                <ReliabilityIndicator level={profileReliabilityLevel} />

                <div className="space-y-2">
                    {/* Basic Info Inputs */}
                    <div>
                        <label className="text-sm">Prénom</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} disabled={!formFieldsEnabled} className="input-field-sm" />
                    </div>
                    <div>
                        <label className="text-sm">Nom</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} disabled={!formFieldsEnabled} className="input-field-sm" />
                    </div>
                    <div>
                        <label className="text-sm">Date de Naissance</label>
                        <input type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleInputChange} disabled={!formFieldsEnabled} className="input-field-sm" style={{colorScheme: 'dark'}} />
                    </div>
                    <div>
                        <label className="text-sm">Nationalité</label>
                        <input type="text" name="nationality" value={formData.nationality || ''} onChange={handleInputChange} disabled={!formFieldsEnabled} className="input-field-sm" />
                    </div>
                     <div>
                        <label className="text-sm">Sexe</label>
                        <select name="sex" value={formData.sex || ''} onChange={handleInputChange} disabled={!formFieldsEnabled} className="input-field-sm">
                            <option value="">Non spécifié</option>
                            <option value={Sex.MALE}>{Sex.MALE}</option>
                            <option value={Sex.FEMALE}>{Sex.FEMALE}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm">Profil Qualitatif</label>
                        <select name="qualitativeProfile" value={formData.qualitativeProfile || ''} onChange={handleInputChange} disabled={!formFieldsEnabled} className="input-field-sm">
                            {Object.values(RiderQualitativeProfileEnum).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm">Taille (cm)</label>
                        <input type="number" name="heightCm" value={formData.heightCm || ''} onChange={handleInputChange} disabled={!formFieldsEnabled} className="input-field-sm" />
                    </div>
                     <div>
                        <label className="text-sm">Poids (kg)</label>
                        <input type="number" name="weightKg" value={formData.weightKg || ''} onChange={handleInputChange} disabled={!formFieldsEnabled} className="input-field-sm" step="0.1" />
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 space-y-4">
                <div className="bg-slate-700 p-3 rounded-lg">
                    <h4 className="font-semibold text-slate-200 mb-2 text-center">Profil de Performance Automatisé</h4>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-center">
                        <SpiderChart data={spiderChartData} size={200} />
                        <div className="space-y-1">
                            {calculatedCharsData.map(char => (
                                <div key={char.label} className="flex justify-between items-center text-xs">
                                    <span className="text-slate-300">{char.label}:</span>
                                    <div className="flex items-center">
                                        <div className="w-20 bg-slate-600 rounded-full h-1.5 mr-2">
                                            <div className="bg-pink-400 h-1.5 rounded-full" style={{ width: `${char.value}%` }}></div>
                                        </div>
                                        <span className="font-mono text-slate-200 w-8 text-right">{char.value.toFixed(0)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                 {/* Health and Status */}
                <div className="bg-slate-700 p-3 rounded-lg grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm">État de Forme</label>
                        <select name="forme" value={formData.forme || ''} onChange={handleInputChange} disabled={!formFieldsEnabled} className="input-field-sm">
                            {Object.values(FormeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm">Moral</label>
                        <select name="moral" value={formData.moral || ''} onChange={handleInputChange} disabled={!formFieldsEnabled} className="input-field-sm">
                            {Object.values(MoralStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div className="col-span-2">
                        <label className="text-sm">Condition Physique / Santé</label>
                        <select name="healthCondition" value={formData.healthCondition || ''} onChange={handleInputChange} disabled={!formFieldsEnabled} className="input-field-sm">
                            {Object.values(HealthCondition).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Disciplines and Categories */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700 p-3 rounded-lg">
                        <h4 className="font-semibold text-slate-200 mb-2">Disciplines Pratiquées</h4>
                        <div className="space-y-1">
                            {Object.values(DisciplinePracticedEnum).map(d => (
                                <div key={d} className="flex items-center">
                                    <input type="checkbox" id={`discipline-${d}`} name="disciplines" value={d} checked={(formData.disciplines || []).includes(d)} onChange={handleInputChange} disabled={!formFieldsEnabled} className="checkbox-field"/>
                                    <label htmlFor={`discipline-${d}`} className="ml-2 text-sm text-slate-300">{d}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="bg-slate-700 p-3 rounded-lg">
                        <h4 className="font-semibold text-slate-200 mb-2">Catégories de Niveau</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {RIDER_LEVEL_CATEGORIES.map(level => (
                                <div key={level} className="flex items-center">
                                    <input type="checkbox" id={`category-${level}`} name="categories" value={level} checked={(formData.categories || []).includes(level)} onChange={handleInputChange} disabled={!formFieldsEnabled} className="checkbox-field"/>
                                    <label htmlFor={`category-${level}`} className="ml-2 text-sm text-slate-300">{level}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProfileInfoTab;
