import React, { useState, useMemo, useEffect } from 'react';
import { ScoutingProfile, Rider, RiderQualitativeProfile, DisciplinePracticed, FormeStatus, MoralStatus, HealthCondition, PerformanceFactorDetail, PowerProfile, ScoutingStatus, Sex, User, UserRole, AppState } from '../types';
import { SCOUTING_STATUS_COLORS, defaultRiderCharCap, SPIDER_CHART_CHARACTERISTICS_CONFIG, initialScoutingProfileFormState, POWER_PROFILE_REFERENCE_TABLES, riderProfileKeyToRefTableKeyMap, POWER_ANALYSIS_DURATIONS_CONFIG, PROFILE_WEIGHTS, PERFORMANCE_SCORE_WEIGHTS, COLLECTIVE_SCORE_PENALTY_THRESHOLD, COLLECTIVE_SCORE_PENALTY_MULTIPLIER, CATEGORY_ID_TO_SCALE_MAP, EVENT_CATEGORY_POINTS_TABLE, COGGAN_CATEGORY_COLORS, ALL_COUNTRIES, RIDER_LEVEL_CATEGORIES, PERFORMANCE_PROJECT_FACTORS_CONFIG } from '../constants';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import ArrowUpCircleIcon from '../components/icons/ArrowUpCircleIcon';
import SearchIcon from '../components/icons/SearchIcon';
import ConfirmationModal from '../components/ConfirmationModal';
import PaperAirplaneIcon from '../components/icons/PaperAirplaneIcon';
import TalentSearchTab from '../components/TalentSearchTab';
import { RiderDetailModal } from '../components/RiderDetailModal';
import { calculateRiderCharacteristics } from '../utils/performanceCalculations';
import StarIcon from '../components/icons/StarIcon';

interface ScoutingSectionProps {
  scoutingProfiles: ScoutingProfile[];
  setScoutingProfiles: React.Dispatch<React.SetStateAction<ScoutingProfile[]>>;
  setRiders: React.Dispatch<React.SetStateAction<Rider[]>>;
  users: User[];
  onSendScoutingRequest: (athlete: User) => void;
  appState: AppState;
  currentTeamId: string | null;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const powerMetricsConfig: { key: keyof PowerProfile; label: string; unit: string; }[] = POWER_ANALYSIS_DURATIONS_CONFIG.map(
    ({ key, label, unit }) => ({ key, label, unit })
);

const getAge = (birthDate?: string): number | null => {
    if (!birthDate || typeof birthDate !== 'string') {
        return null;
    }
    const birthTime = Date.parse(birthDate);
    if (isNaN(birthTime)) {
        return null;
    }
    const birth = new Date(birthTime);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age >= 0 ? age : null;
};


const getInitialPerformanceFactorDetail = (factorId: keyof Pick<Rider, 'physiquePerformanceProject' | 'techniquePerformanceProject' | 'mentalPerformanceProject' | 'environnementPerformanceProject' | 'tactiquePerformanceProject'>): PerformanceFactorDetail => {
    return {
        forces: (PERFORMANCE_PROJECT_FACTORS_CONFIG.find(f => f.id === factorId)?.forcesPrompts || []).map(p => `- ${p}`).join('\n'),
        aOptimiser: '',
        aDevelopper: '',
        besoinsActions: '',
    };
};

type SortKey = keyof ScoutingProfile | 'age' | keyof PowerProfile | string;

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
                <polygon points={points} fill="rgba(74, 222, 128, 0.4)" stroke="rgba(74, 222, 128, 1)" strokeWidth="1" />
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

export const ScoutingSection: React.FC<ScoutingSectionProps> = ({ scoutingProfiles, setScoutingProfiles, setRiders, users, onSendScoutingRequest, appState, currentTeamId }) => {
  const [activeTab, setActiveTab] = useState<'profiles' | 'search' | 'analysis'>('profiles');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Omit<ScoutingProfile, 'id'> | ScoutingProfile>(initialScoutingProfileFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'info' | 'power'>('info');
  const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);
  
  const [addProspectModal, setAddProspectModal] = useState<{isOpen: boolean; mode: 'choice' | 'manual' | 'scout'; initialData?: ScoutingProfile | null }>({isOpen: false, mode: 'choice' });

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'potentialRating', direction: 'desc' });
  const [filters, setFilters] = useState({
      name: '',
      status: 'all',
      discipline: 'all',
      nationality: 'all'
  });
  
  const [selectedProfileIdsForAnalysis, setSelectedProfileIdsForAnalysis] = useState<string[]>([]);

  const filteredProfiles = useMemo(() => {
    let profiles = [...scoutingProfiles];
    if (filters.name) {
        profiles = profiles.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(filters.name.toLowerCase()));
    }
    if (filters.status !== 'all') {
        profiles = profiles.filter(p => p.status === filters.status);
    }
    if (filters.discipline !== 'all') {
        profiles = profiles.filter(p => p.discipline === filters.discipline);
    }
    if (filters.nationality !== 'all') {
        profiles = profiles.filter(p => p.nationality === filters.nationality);
    }

    if (sortConfig) {
        profiles.sort((a, b) => {
            let aValue: any, bValue: any;
            if (sortConfig.key === 'age') {
                aValue = getAge(a.birthDate) ?? 99;
                bValue = getAge(b.birthDate) ?? 99;
            } else if (sortConfig.key === 'charSprint' || sortConfig.key === 'charAnaerobic' || sortConfig.key === 'charPuncher' || sortConfig.key === 'charClimbing' || sortConfig.key === 'charRouleur') {
                aValue = (a as any)[sortConfig.key] || 0;
                bValue = (b as any)[sortConfig.key] || 0;
            } else {
                aValue = a[sortConfig.key as keyof ScoutingProfile] ?? '';
                bValue = b[sortConfig.key as keyof ScoutingProfile] ?? '';
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }
            return 0;
        });
    }

    return profiles;
  }, [scoutingProfiles, filters, sortConfig]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return ' ';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const keys = name.split('.');

    setCurrentItem(prev => {
        const newFormData = structuredClone(prev);
        let currentLevel: any = newFormData;

        for (let i = 0; i < keys.length - 1; i++) {
            currentLevel = currentLevel[keys[i]] = currentLevel[keys[i]] || {};
        }

        const lastKey = keys[keys.length - 1];
        if (type === 'number') {
            currentLevel[lastKey] = value === '' ? undefined : parseFloat(String(value).replace(',', '.'));
        } else {
            currentLevel[lastKey] = value;
        }
        
        return {
          ...newFormData,
          ...calculateRiderCharacteristics(newFormData),
        };
    });
  };

  const handleSaveProfile = () => {
    if (isEditing && 'id' in currentItem) {
        setScoutingProfiles(prev => prev.map(p => p.id === currentItem.id ? currentItem : p));
    } else {
        const newProfile = { ...currentItem, id: generateId() } as ScoutingProfile;
        setScoutingProfiles(prev => [...prev, newProfile]);
    }
    setIsModalOpen(false);
  };
  
  const handlePromoteToRoster = (profile: ScoutingProfile) => {
    setConfirmAction({
        title: `Promouvoir ${profile.firstName} ${profile.lastName} dans l'effectif`,
        message: "Ceci créera une nouvelle entrée dans l'effectif avec les données de ce profil de scouting et le supprimera de cette liste. Continuer ?",
        onConfirm: () => {
            const newRider: Rider = {
                ...profile,
                qualitativeProfile: profile.qualitativeProfile || RiderQualitativeProfile.AUTRE,
                id: `rider_${profile.id}`,
                disciplines: [profile.discipline],
                categories: profile.categories || [],
                performanceGoals: '',
                forme: FormeStatus.INCONNU,
                moral: MoralStatus.INCONNU,
                healthCondition: HealthCondition.PRET_A_COURIR,
                favoriteRaces: [],
                resultsHistory: [],
                allergies: profile.allergies || [],
                performanceNutrition: {},
                roadBikeSetup: { specifics: {}, cotes: {} },
                ttBikeSetup: { specifics: {}, cotes: {} },
                clothing: [],
                physiquePerformanceProject: getInitialPerformanceFactorDetail('physiquePerformanceProject'),
                techniquePerformanceProject: getInitialPerformanceFactorDetail('techniquePerformanceProject'),
                mentalPerformanceProject: getInitialPerformanceFactorDetail('mentalPerformanceProject'),
                environnementPerformanceProject: getInitialPerformanceFactorDetail('environnementPerformanceProject'),
                tactiquePerformanceProject: getInitialPerformanceFactorDetail('tactiquePerformanceProject'),
                charSprint: profile.charSprint ?? 0,
                charAnaerobic: profile.charAnaerobic ?? 0,
                charPuncher: profile.charPuncher ?? 0,
                charClimbing: profile.charClimbing ?? 0,
                charRouleur: profile.charRouleur ?? 0,
                generalPerformanceScore: profile.generalPerformanceScore ?? 0,
                fatigueResistanceScore: profile.fatigueResistanceScore ?? 0,
            };
            setRiders(prev => [...prev, newRider]);
            setScoutingProfiles(prev => prev.filter(p => p.id !== profile.id));
        }
    });
  };

  const handleDeleteProfile = (profileId: string) => {
    setConfirmAction({
      title: "Supprimer le profil",
      message: "Êtes-vous sûr de vouloir supprimer ce profil de scouting ?",
      onConfirm: () => {
        setScoutingProfiles(prev => prev.filter(p => p.id !== profileId));
      }
    });
  };

  const openAddModal = () => {
    setCurrentItem({
      ...initialScoutingProfileFormState,
      ...defaultRiderCharCap,
      powerProfileFresh: {},
      powerProfile15KJ: {},
      powerProfile30KJ: {},
      powerProfile45KJ: {},
    });
    setIsEditing(false);
    setActiveModalTab('info');
    setIsModalOpen(true);
  };
  
  const openEditModal = (profile: ScoutingProfile) => {
    setCurrentItem({
      ...structuredClone(profile),
      powerProfileFresh: profile.powerProfileFresh || {},
      powerProfile15KJ: profile.powerProfile15KJ || {},
      powerProfile30KJ: profile.powerProfile30KJ || {},
      powerProfile45KJ: profile.powerProfile45KJ || {},
    });
    setIsEditing(true);
    setActiveModalTab('info');
    setIsModalOpen(true);
  };
  
  const allProfilesForAnalysis = useMemo(() => {
    const combined = [
        ...appState.riders.map(r => ({ ...r, id: r.id, name: `${r.firstName} ${r.lastName}`, type: 'Effectif' })), 
        ...scoutingProfiles.map(s => ({ ...s, id: s.id, name: `${s.firstName} ${s.lastName}`, type: 'Prospect' }))
    ];
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  }, [appState.riders, scoutingProfiles]);

  const handleProfileSelectionForAnalysis = (profileId: string) => {
    setSelectedProfileIdsForAnalysis(prev => {
        if (prev.includes(profileId)) {
            return prev.filter(id => id !== profileId);
        }
        if (prev.length < 6) {
            return [...prev, profileId];
        }
        return prev;
    });
  };

  const renderProfilesTab = () => (
    <>
      <div className="mb-4 p-3 bg-slate-700 rounded-md grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <input type="text" name="name" value={filters.name} onChange={handleFilterChange} placeholder="Rechercher par nom..." className="input-field-sm col-span-full md:col-span-1" />
        <select name="status" value={filters.status} onChange={handleFilterChange} className="input-field-sm"><option value="all">Tous Statuts</option>{Object.values(ScoutingStatus).map(s => <option key={s} value={s}>{s}</option>)}</select>
        <select name="discipline" value={filters.discipline} onChange={handleFilterChange} className="input-field-sm"><option value="all">Toutes Disciplines</option>{Object.values(DisciplinePracticed).map(d => <option key={d} value={d}>{d}</option>)}</select>
        <select name="nationality" value={filters.nationality} onChange={handleFilterChange} className="input-field-sm"><option value="all">Toutes Nationalités</option>{ALL_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-700 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left cursor-pointer" onClick={() => requestSort('firstName')}>Nom {getSortIndicator('firstName')}</th>
              <th className="px-3 py-2 text-left cursor-pointer" onClick={() => requestSort('age')}>Âge {getSortIndicator('age')}</th>
              <th className="px-3 py-2 text-left cursor-pointer" onClick={() => requestSort('status')}>Statut {getSortIndicator('status')}</th>
              <th className="px-3 py-2 text-left cursor-pointer" onClick={() => requestSort('potentialRating')}>Potentiel {getSortIndicator('potentialRating')}</th>
              <th className="px-3 py-2 text-left cursor-pointer" onClick={() => requestSort('qualitativeProfile')}>Profil {getSortIndicator('qualitativeProfile')}</th>
              {SPIDER_CHART_CHARACTERISTICS_CONFIG.map(char => (
                  <th key={char.key} className="px-3 py-2 text-left cursor-pointer" onClick={() => requestSort(char.key)}>{char.label} {getSortIndicator(char.key)}</th>
              ))}
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredProfiles.map(profile => (
              <tr key={profile.id} className="hover:bg-slate-700/50">
                <td className="px-3 py-2 font-medium text-slate-100">{profile.firstName} {profile.lastName}</td>
                <td className="px-3 py-2 text-slate-300">{getAge(profile.birthDate)}</td>
                <td className="px-3 py-2"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${SCOUTING_STATUS_COLORS[profile.status]}`}>{profile.status}</span></td>
                <td className="px-3 py-2 text-slate-300">{profile.potentialRating} / 5</td>
                <td className="px-3 py-2 text-slate-300">{profile.qualitativeProfile}</td>
                {SPIDER_CHART_CHARACTERISTICS_CONFIG.map(char => (
                    <td key={char.key} className="px-3 py-2 font-mono text-slate-200">{((profile as any)[char.key] || 0).toFixed(0)}</td>
                ))}
                <td className="px-3 py-2 text-right space-x-1">
                  <ActionButton onClick={() => openEditModal(profile)} variant="secondary" size="sm" icon={<PencilIcon className="w-3 h-3"/>} />
                  <ActionButton onClick={() => handlePromoteToRoster(profile)} variant="primary" size="sm" icon={<ArrowUpCircleIcon className="w-4 h-4" />} title="Promouvoir dans l'effectif"/>
                  <ActionButton onClick={() => handleDeleteProfile(profile.id)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3" />} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderSearchTab = () => (
    <TalentSearchTab appState={appState} onProfileSelect={() => {}} currentTeamId={currentTeamId}/>
  );
  
  const renderAnalysisTab = () => {
    const selectedProfiles = allProfilesForAnalysis.filter(p => selectedProfileIdsForAnalysis.includes(p.id));
    const analysisMetrics = [
        { key: 'age', label: 'Âge', invertColor: true, format: (v: number) => v.toFixed(0) },
        { key: 'potentialRating', label: 'Potentiel ★', format: (v: number) => v.toFixed(1) },
        { key: 'generalPerformanceScore', label: 'Note Générale', format: (v: number) => v.toFixed(0) },
        { key: 'fatigueResistanceScore', label: 'Résistance Fatigue', format: (v: number) => v.toFixed(0) },
        { key: 'powerProfileFresh.power5s', label: 'PMax 5s (W/kg)', format: (v: number) => v.toFixed(1) },
        { key: 'powerProfileFresh.power1min', label: 'PMax 1min (W/kg)', format: (v: number) => v.toFixed(1) },
        { key: 'powerProfileFresh.power5min', label: 'PMax 5min (W/kg)', format: (v: number) => v.toFixed(1) },
        { key: 'powerProfileFresh.criticalPower', label: 'FTP (W/kg)', format: (v: number) => v.toFixed(1) }
    ];

    const getHeatmapColor = (value: number, min: number, max: number, invert: boolean = false): string => {
        if (min === max || isNaN(value)) return 'bg-slate-700/50 text-slate-200';
        const range = max - min;
        const normalized = range > 0 ? (value - min) / range : 0.5;
        
        const finalValue = invert ? 1 - normalized : normalized;

        if (finalValue < 0.15) return 'bg-red-800/60 text-red-200';
        if (finalValue < 0.35) return 'bg-orange-800/60 text-orange-200';
        if (finalValue < 0.65) return 'bg-slate-700 text-slate-200';
        if (finalValue < 0.85) return 'bg-teal-800/60 text-teal-200';
        return 'bg-green-800/60 text-green-200';
    };

    return (
      <div className="space-y-4">
        <div className="relative">
            <div className="bg-slate-700 p-2 rounded-lg cursor-pointer flex justify-between items-center group">
                <span className="text-slate-200">Sélectionner les profils à comparer ({selectedProfileIdsForAnalysis.length} / 6)</span>
                <details className="relative">
                    <summary className="list-none text-xs text-slate-400 cursor-pointer">Cliquer pour choisir</summary>
                    <div className="absolute z-10 right-0 bg-slate-700 border border-slate-600 rounded mt-1 w-72 max-h-60 overflow-y-auto p-2 shadow-lg hidden group-focus-within:block">
                      {allProfilesForAnalysis.map(p => (
                        <div key={p.id} className="flex items-center p-1 rounded hover:bg-slate-600">
                          <input type="checkbox" id={`analysis-select-${p.id}`} checked={selectedProfileIdsForAnalysis.includes(p.id)} onChange={() => handleProfileSelectionForAnalysis(p.id)} disabled={!selectedProfileIdsForAnalysis.includes(p.id) && selectedProfileIdsForAnalysis.length >= 6} className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-blue-500 focus:ring-blue-500"/>
                          <label htmlFor={`analysis-select-${p.id}`} className="ml-2 text-slate-200">{p.name} <span className="text-xs text-slate-400">({p.type})</span></label>
                        </div>
                      ))}
                    </div>
                </details>
            </div>
        </div>

        {selectedProfiles.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-center border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-800">
                  <th className="sticky left-0 bg-slate-800 p-2 text-left font-semibold text-slate-300 w-48">Métrique</th>
                  {selectedProfiles.map(p => (
                    <th key={p.id} className="p-2 border-l border-slate-700">
                      <p className="font-bold text-slate-100">{p.name}</p>
                      <SpiderChart data={SPIDER_CHART_CHARACTERISTICS_CONFIG.map(char => ({ axis: char.label, value: (p as any)[char.key] || 0 }))} size={80}/>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {analysisMetrics.map(metric => {
                  const values = selectedProfiles.map(p => {
                      if (metric.key === 'age') return getAge(p.birthDate) || 0;
                      if (metric.key === 'potentialRating') return 'potentialRating' in p ? p.potentialRating || 0 : 0;
                      if (metric.key === 'generalPerformanceScore') return p.generalPerformanceScore || 0;
                      if (metric.key === 'fatigueResistanceScore') return p.fatigueResistanceScore || 0;
                      if (metric.key.startsWith('powerProfile')) {
                          const [profileKey, powerKey] = metric.key.split('.') as [keyof Rider, keyof PowerProfile];
                          const power = (p[profileKey] as PowerProfile)?.[powerKey];
                          return (power && p.weightKg) ? power / p.weightKg : 0;
                      }
                      return 0;
                  }).filter(v => v > 0);
                  
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  
                  return (
                      <tr key={metric.key}>
                          <td className="sticky left-0 bg-slate-800 p-2 text-left font-medium text-slate-300 w-48">{metric.label}</td>
                          {selectedProfiles.map(p => {
                              let value: number | null = null;
                              if (metric.key === 'age') value = getAge(p.birthDate);
                              else if (metric.key === 'potentialRating') value = 'potentialRating' in p ? p.potentialRating || 0 : null;
                              else if (metric.key === 'generalPerformanceScore') value = p.generalPerformanceScore || 0;
                              else if (metric.key === 'fatigueResistanceScore') value = p.fatigueResistanceScore || 0;
                              else if (metric.key.startsWith('powerProfile')) {
                                const [profileKey, powerKey] = metric.key.split('.') as [keyof Rider, keyof PowerProfile];
                                const power = (p[profileKey] as PowerProfile)?.[powerKey];
                                value = (power && p.weightKg) ? power / p.weightKg : null;
                              }
                              
                              return (
                                  <td key={p.id} className={`p-2 font-mono border-l border-slate-700 ${value !== null ? getHeatmapColor(value, min, max, metric.invertColor) : 'bg-slate-700/50 text-slate-400'}`}>
                                      {value !== null ? metric.format(value) : 'N/A'}
                                  </td>
                              )
                          })}
                      </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const tabButtonStyle = (tab: 'profiles' | 'search' | 'analysis') => 
    `px-3 py-2 font-medium text-sm rounded-t-md whitespace-nowrap transition-colors duration-150 focus:outline-none ${
      activeTab === tab 
        ? 'bg-slate-800 text-white border-b-2 border-blue-500' 
        : 'text-gray-500 hover:text-gray-700 hover:bg-slate-700'
    }`;
  
  return (
    <SectionWrapper
      title="Scouting & Détection"
      actionButton={<ActionButton onClick={openAddModal} icon={<PlusCircleIcon className="w-5 h-5"/>}>Ajouter Prospect</ActionButton>}
    >
        <div className="mb-4 border-b border-slate-600">
            <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
                <button onClick={() => setActiveTab('profiles')} className={tabButtonStyle('profiles')}>Profils Suivis</button>
                <button onClick={() => setActiveTab('search')} className={tabButtonStyle('search')}>Recherche de Talents</button>
                <button onClick={() => setActiveTab('analysis')} className={tabButtonStyle('analysis')}>Analyse Comparative</button>
            </nav>
        </div>
      <div className="bg-slate-800 p-4 rounded-b-lg">
          {activeTab === 'profiles' && renderProfilesTab()}
          {activeTab === 'search' && renderSearchTab()}
          {activeTab === 'analysis' && renderAnalysisTab()}
      </div>

       <RiderDetailModal
          isOpen={addProspectModal.isOpen && addProspectModal.mode === 'scout'}
          onClose={() => setAddProspectModal({ ...addProspectModal, isOpen: false })}
          onSaveRider={(newRiderData) => {
              const { 
                id,
                resultsHistory, 
                favoriteRaces, 
                clothing, 
                performanceNutrition, 
                roadBikeSetup, 
                ttBikeSetup, 
                physiquePerformanceProject, 
                techniquePerformanceProject, 
                mentalPerformanceProject, 
                environnementPerformanceProject, 
                tactiquePerformanceProject,
                ...restOfRider
              } = newRiderData;
              
              const newScoutProfile: ScoutingProfile = {
                  ...restOfRider,
                  id: `scout_${generateId()}`,
                  status: ScoutingStatus.TO_WATCH,
                  potentialRating: 3,
                  discipline: newRiderData.disciplines?.[0] || DisciplinePracticed.ROUTE,
              };

              setScoutingProfiles(prev => [...prev, newScoutProfile]);
              setAddProspectModal({ ...addProspectModal, isOpen: false });
          }}
          isEditMode={true}
          appState={appState}
          raceEvents={[]}
          riderEventSelections={[]}
          performanceEntries={[]}
          powerDurationsConfig={POWER_ANALYSIS_DURATIONS_CONFIG}
          calculateWkg={() => ''}
      />
      
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Modifier Prospect" : "Nouveau Prospect"}>
        <div className="bg-slate-800 p-4 -m-6 rounded-lg">
            <nav className="flex space-x-1 border-b border-slate-600 mb-4">
                <button onClick={() => setActiveModalTab('info')} className={`px-3 py-2 text-sm font-medium rounded-t-md ${activeModalTab === 'info' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>Infos</button>
                <button onClick={() => setActiveModalTab('power')} className={`px-3 py-2 text-sm font-medium rounded-t-md ${activeModalTab === 'power' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>Puissance</button>
            </nav>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {activeModalTab === 'info' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                          <input name="firstName" value={currentItem.firstName} onChange={handleInputChange} placeholder="Prénom" className="input-field-sm" required/>
                          <input name="lastName" value={currentItem.lastName} onChange={handleInputChange} placeholder="Nom" className="input-field-sm" required/>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="email" name="email" value={currentItem.email || ''} onChange={handleInputChange} placeholder="Email" className="input-field-sm"/>
                        <input type="tel" name="phone" value={currentItem.phone || ''} onChange={handleInputChange} placeholder="Téléphone" className="input-field-sm"/>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" name="heightCm" value={currentItem.heightCm || ''} onChange={handleInputChange} placeholder="Taille (cm)" className="input-field-sm" step="any"/>
                        <input type="number" name="weightKg" value={currentItem.weightKg || ''} onChange={handleInputChange} placeholder="Poids (kg)" className="input-field-sm" step="any"/>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" name="birthDate" value={currentItem.birthDate || ''} onChange={handleInputChange} className="input-field-sm" style={{colorScheme:'dark'}}/>
                        <select name="sex" value={currentItem.sex || ''} onChange={handleInputChange} className="input-field-sm"><option value="">Sexe...</option><option value={Sex.MALE}>Homme</option><option value={Sex.FEMALE}>Femme</option></select>
                      </div>
                      <select name="nationality" value={currentItem.nationality || ''} onChange={handleInputChange} className="input-field-sm"><option value="">Nationalité...</option>{ALL_COUNTRIES.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}</select>
                      <select name="discipline" value={currentItem.discipline} onChange={handleInputChange} className="input-field-sm"><option value="">Discipline...</option>{Object.values(DisciplinePracticed).map(d=><option key={d} value={d}>{d}</option>)}</select>
                      <select name="status" value={currentItem.status} onChange={handleInputChange} className="input-field-sm"><option value="">Statut...</option>{Object.values(ScoutingStatus).map(s=><option key={s} value={s}>{s}</option>)}</select>
                      <div>
                        <label className="text-xs text-slate-300">Potentiel (1-5)</label>
                        <input type="range" name="potentialRating" value={currentItem.potentialRating} onChange={handleInputChange} min="1" max="5" className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"/>
                      </div>
                      <textarea name="qualitativeNotes" value={currentItem.qualitativeNotes || ''} onChange={handleInputChange} placeholder="Notes qualitatives, points forts/faibles..." rows={3} className="input-field-sm w-full"/>
                    </>
                )}
                {activeModalTab === 'power' && (
                  <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                          <thead className="bg-slate-700/50">
                              <tr>
                                  <th className="px-2 py-2 text-left text-slate-300 font-semibold">Durée</th>
                                  <th className="px-2 py-2 text-center text-slate-300 font-semibold">Frais (W)</th>
                                  <th className="px-2 py-2 text-center text-slate-300 font-semibold">15 kJ/kg (W)</th>
                                  <th className="px-2 py-2 text-center text-slate-300 font-semibold">30 kJ/kg (W)</th>
                                  <th className="px-2 py-2 text-center text-slate-300 font-semibold">45 kJ/kg (W)</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                              {powerMetricsConfig.map(metric => (
                                  <tr key={metric.key}>
                                      <td className="px-2 py-1.5 font-medium text-slate-300">Puissance {metric.label}</td>
                                      {(['powerProfileFresh', 'powerProfile15KJ', 'powerProfile30KJ', 'powerProfile45KJ'] as const).map(profileKey => (
                                          <td key={profileKey} className="px-1 py-1.5">
                                              <input
                                                  type="number"
                                                  name={`${profileKey}.${metric.key}`}
                                                  value={(currentItem[profileKey] as any)?.[metric.key] ?? ''}
                                                  onChange={handleInputChange}
                                                  placeholder="W"
                                                  className="input-field-sm w-full text-center"
                                              />
                                          </td>
                                      ))}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                )}
            </div>
            <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-slate-700">
                <ActionButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</ActionButton>
                <ActionButton type="button" onClick={handleSaveProfile}>Sauvegarder</ActionButton>
            </div>
        </div>
      </Modal>

      {confirmAction && <ConfirmationModal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={() => {confirmAction.onConfirm(); setConfirmAction(null);}} title={confirmAction.title} message={confirmAction.message}/>}
    </SectionWrapper>
  );
};