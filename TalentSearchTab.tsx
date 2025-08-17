
import React, { useState, useMemo } from 'react';
import { Rider, AppState, RiderQualitativeProfile as RiderQualitativeProfileEnum, Sex, User, UserRole, ScoutingRequestStatus, TeamMembershipStatus } from '../types';
import { RIDER_LEVEL_CATEGORIES, SPIDER_CHART_CHARACTERISTICS_CONFIG, ALL_COUNTRIES } from '../constants';
import ActionButton from './ActionButton';
import SearchIcon from './icons/SearchIcon';
import UserCircleIcon from './icons/UserCircleIcon';

interface TalentSearchTabProps {
  appState: AppState;
  onProfileSelect: (user: User) => void;
  currentTeamId: string | null;
}

const getAge = (birthDate?: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

const SpiderChart: React.FC<{ data: { axis: string; value: number }[]; size?: number }> = ({ data, size = 100 }) => {
    const numAxes = data.length;
    if (numAxes < 3) return null;
    const angleSlice = (Math.PI * 2) / numAxes;
    const radius = size / 3.5;
    const center = size / 2;

    const points = data.map((d, i) => {
        const value = Math.max(0, Math.min(d.value || 0, 100));
        const x = center + radius * (value / 100) * Math.cos(angleSlice * i - Math.PI / 2);
        const y = center + radius * (value / 100) * Math.sin(angleSlice * i - Math.PI / 2);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <polygon points={points} fill="rgba(239, 169, 182, 0.4)" stroke="rgba(239, 169, 182, 0.9)" strokeWidth="1" />
        </svg>
    );
};

const TalentSearchTab: React.FC<TalentSearchTabProps> = ({ appState, onProfileSelect, currentTeamId }) => {
    const [nameFilter, setNameFilter] = useState('');
    const [sexFilter, setSexFilter] = useState<'all' | Sex>('all');
    const [minAge, setMinAge] = useState(19);
    const [maxAge, setMaxAge] = useState(40);
    const [nationalityFilter, setNationalityFilter] = useState('all');

    const filteredTalents = useMemo(() => {
        if (!currentTeamId) return [];

        const currentTeamUserIds = new Set(
            appState.teamMemberships
                .filter(m => m.teamId === currentTeamId && m.status === TeamMembershipStatus.ACTIVE)
                .map(m => m.userId)
        );

        return appState.users.filter(user => {
            if (user.userRole !== UserRole.COUREUR) return false;
            if (currentTeamUserIds.has(user.id)) return false; // Exclude my own team members

            const isPubliclySearchable = user.isSearchable;
            const hasSharedData = appState.scoutingRequests.some(
                req => req.athleteId === user.id && 
                       req.requesterTeamId === currentTeamId && 
                       req.status === ScoutingRequestStatus.ACCEPTED
            );

            if (!isPubliclySearchable && !hasSharedData) return false;

            // Apply UI filters
            const age = getAge(user.signupInfo?.birthDate);
            if (age === null || age < minAge || age > maxAge) return false;
            if (nameFilter && !`${user.firstName} ${user.lastName}`.toLowerCase().includes(nameFilter.toLowerCase())) return false;
            if (sexFilter !== 'all' && user.signupInfo?.sex !== sexFilter) return false;
            if (nationalityFilter !== 'all' && user.signupInfo?.nationality !== nationalityFilter) return false;

            return true;
        });
    }, [appState, nameFilter, minAge, maxAge, nationalityFilter, sexFilter, currentTeamId]);
    
    const spiderChartData = (user: User) => {
        return SPIDER_CHART_CHARACTERISTICS_CONFIG.map(char => ({
            axis: char.label,
            value: (user as any)[char.key] || 0,
        }));
    };

    return (
        <div className="space-y-4">
            <div className="p-4 bg-slate-700 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <input type="text" value={nameFilter} onChange={e => setNameFilter(e.target.value)} placeholder="Rechercher par nom..." className="input-field-sm col-span-full" />
                    <div>
                        <label className="block text-xs font-medium text-slate-300">Nationalité</label>
                        <select value={nationalityFilter} onChange={e => setNationalityFilter(e.target.value)} className="input-field-sm">
                            <option value="all">Toutes Nationalités</option>
                            {ALL_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-300">Sexe</label>
                        <select value={sexFilter} onChange={e => setSexFilter(e.target.value as any)} className="input-field-sm">
                            <option value="all">Tous les Sexes</option>
                            <option value={Sex.MALE}>{Sex.MALE}</option>
                            <option value={Sex.FEMALE}>{Sex.FEMALE}</option>
                        </select>
                    </div>
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-medium text-slate-300">Tranche d'âge: {minAge} - {maxAge} ans</label>
                        <div className="flex items-center space-x-2 mt-1">
                            <input type="number" value={minAge} onChange={e => setMinAge(Number(e.target.value))} className="input-field-sm w-full" placeholder="Min" min="16" max="50"/>
                            <span className="text-slate-400">-</span>
                            <input type="number" value={maxAge} onChange={e => setMaxAge(Number(e.target.value))} className="input-field-sm w-full" placeholder="Max" min="16" max="50"/>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTalents.map(user => (
                    <div key={user.id} className="bg-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col border border-slate-700">
                        <div className="p-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-3">
                                    <UserCircleIcon className="w-12 h-12 text-slate-500"/>
                                    <div>
                                        <h4 className="font-bold text-slate-100">{user.firstName} {user.lastName}</h4>
                                        <p className="text-xs text-slate-400">{getAge(user.signupInfo?.birthDate)} ans - {user.signupInfo?.nationality}</p>
                                    </div>
                                </div>
                                <div className="w-20 h-20 flex-shrink-0">
                                    <SpiderChart data={spiderChartData(user)} />
                                </div>
                            </div>
                             <div className="mt-2 text-xs text-slate-300">
                                <span className="font-semibold">Profil:</span> {user.qualitativeProfile || 'N/A'}
                             </div>
                        </div>
                         <div className="mt-auto p-2 bg-slate-700/50 text-right">
                             <ActionButton onClick={() => onProfileSelect(user)} variant="secondary" size="sm">
                                Voir Profil Complet
                             </ActionButton>
                        </div>
                    </div>
                ))}
            </div>
            {filteredTalents.length === 0 && (
                 <p className="text-center text-slate-400 py-8">Aucun talent ne correspond à vos critères de recherche.</p>
            )}
        </div>
    );
};

export default TalentSearchTab;
