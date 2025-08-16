

import React, { useState, useMemo } from 'react';
import { Mission, MissionStatus, StaffRole, Team, User } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import BriefcaseIcon from '../components/icons/BriefcaseIcon';
import CalendarDaysIcon from '../components/icons/CalendarDaysIcon';
import MapPinIcon from '../components/icons/MapPinIcon';
import BanknotesIcon from '../components/icons/BanknotesIcon';

interface MissionSearchSectionProps {
  missions: Mission[];
  teams: Team[];
  currentUser: User;
  setMissions: (updater: React.SetStateAction<Mission[]>) => void;
}

const MissionCard: React.FC<{ mission: Mission; teamName: string; onApply: () => void; onDetails: () => void, hasApplied: boolean }> = ({ mission, teamName, onApply, onDetails, hasApplied }) => {
    const startDate = new Date(mission.startDate + "T12:00:00Z").toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const endDate = new Date(mission.endDate + "T12:00:00Z").toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col overflow-hidden transition-transform hover:scale-105">
            <div className="p-4">
                <p className="text-xs font-semibold uppercase text-blue-600">{teamName}</p>
                <h3 className="text-lg font-bold text-gray-800 mt-1">{mission.title}</h3>
                <p className="text-sm text-gray-500">{mission.role}</p>
            </div>
            <div className="p-4 space-y-2 border-t border-b border-gray-200 text-sm flex-grow">
                <p className="flex items-center text-gray-700"><CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-400"/>Du {startDate} au {endDate}</p>
                <p className="flex items-center text-gray-700"><MapPinIcon className="w-4 h-4 mr-2 text-gray-400"/>{mission.location}</p>
                <p className="flex items-center text-gray-700"><BanknotesIcon className="w-4 h-4 mr-2 text-gray-400"/>{mission.compensation}</p>
            </div>
            <div className="p-3 bg-gray-50 flex justify-end space-x-2">
                <ActionButton onClick={onDetails} variant="secondary" size="sm">Détails</ActionButton>
                <ActionButton onClick={onApply} variant="primary" size="sm" disabled={hasApplied}>
                    {hasApplied ? 'Candidaté' : 'Postuler'}
                </ActionButton>
            </div>
        </div>
    );
};


const MissionSearchSection: React.FC<MissionSearchSectionProps> = ({ missions, teams, currentUser, setMissions }) => {
    const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
    const [startDateFilter, setStartDateFilter] = useState('');
    
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

    const getTeamName = (teamId: string) => teams.find(t => t.id === teamId)?.name || 'Équipe Inconnue';
    
    const myApplications = useMemo(() => {
        return new Set(missions.filter(m => m.applicants?.includes(currentUser.id)).map(m => m.id));
    }, [missions, currentUser.id]);

    const filteredMissions = useMemo(() => {
        return missions.filter(mission => {
            if (mission.status !== MissionStatus.OPEN) return false;
            if (roleFilter !== 'all' && mission.role !== roleFilter) return false;
            if (startDateFilter && new Date(mission.startDate) < new Date(startDateFilter)) return false;
            return true;
        }).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }, [missions, roleFilter, startDateFilter]);

    const handleApply = (missionToApply: Mission) => {
        setMissions(prevMissions => prevMissions.map(m => 
            m.id === missionToApply.id 
            ? { ...m, applicants: [...(m.applicants || []), currentUser.id] } 
            : m
        ));
        alert(`Candidature envoyée pour le poste de "${missionToApply.title}" avec l'équipe ${getTeamName(missionToApply.teamId)}.`);
    };
    
    return (
        <SectionWrapper title="Recherche de Missions">
            <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700">Rôle recherché</label>
                        <select
                            id="roleFilter"
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value as any)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="all">Tous les rôles</option>
                            {Object.values(StaffRole).map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="startDateFilter" className="block text-sm font-medium text-gray-700">Disponible à partir du</label>
                        <input
                            type="date"
                            id="startDateFilter"
                            value={startDateFilter}
                            onChange={e => setStartDateFilter(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-2 py-2 border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>
            </div>

            {filteredMissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMissions.map(mission => (
                        <MissionCard 
                            key={mission.id}
                            mission={mission}
                            teamName={getTeamName(mission.teamId)}
                            onApply={() => handleApply(mission)}
                            onDetails={() => setSelectedMission(mission)}
                            hasApplied={myApplications.has(mission.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400"/>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune mission trouvée</h3>
                    <p className="mt-1 text-sm text-gray-500">Essayez d'ajuster vos filtres de recherche.</p>
                </div>
            )}
            
            {selectedMission && (
                <Modal isOpen={!!selectedMission} onClose={() => setSelectedMission(null)} title={selectedMission.title}>
                    <div className="space-y-4">
                        <p><strong className="font-semibold text-gray-800">Équipe:</strong> {getTeamName(selectedMission.teamId)}</p>
                        <p><strong className="font-semibold text-gray-800">Rôle:</strong> {selectedMission.role}</p>
                        <p><strong className="font-semibold text-gray-800">Dates:</strong> Du {new Date(selectedMission.startDate + "T12:00:00Z").toLocaleDateString('fr-FR')} au {new Date(selectedMission.endDate + "T12:00:00Z").toLocaleDateString('fr-FR')}</p>
                        <p><strong className="font-semibold text-gray-800">Lieu:</strong> {selectedMission.location}</p>
                        <p><strong className="font-semibold text-gray-800">Compensation:</strong> {selectedMission.compensation}</p>
                        <div>
                            <strong className="font-semibold text-gray-800">Description:</strong>
                            <p className="mt-1 text-gray-600 whitespace-pre-wrap">{selectedMission.description}</p>
                        </div>
                        {selectedMission.requirements && selectedMission.requirements.length > 0 && (
                             <div>
                                <strong className="font-semibold text-gray-800">Prérequis:</strong>
                                <ul className="list-disc list-inside mt-1 text-gray-600">
                                    {selectedMission.requirements.map((req, i) => <li key={i}>{req}</li>)}
                                </ul>
                            </div>
                        )}
                         <div className="pt-5 flex justify-end">
                            <ActionButton onClick={() => handleApply(selectedMission)} disabled={myApplications.has(selectedMission.id)}>
                                {myApplications.has(selectedMission.id) ? 'Candidaté' : 'Postuler'}
                            </ActionButton>
                         </div>
                    </div>
                </Modal>
            )}
        </SectionWrapper>
    );
};

export default MissionSearchSection;