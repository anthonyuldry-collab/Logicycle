import React, { useState } from 'react';
import { User, Team, TeamLevel } from '../types';
import ActionButton from '../components/ActionButton';
import { useTranslations } from '../hooks/useTranslations';
import { ALL_COUNTRIES } from '../constants';

interface NoTeamViewProps {
  currentUser: User;
  teams: Team[];
  onJoinTeam: (teamId: string) => void;
  onCreateTeam: (teamData: { name: string; level: TeamLevel; country: string; }) => void;
  onLogout: () => void;
}

const NoTeamView: React.FC<NoTeamViewProps> = ({ currentUser, teams, onJoinTeam, onCreateTeam, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLevel, setNewTeamLevel] = useState<TeamLevel>(TeamLevel.HORS_DN);
  const [newTeamCountry, setNewTeamCountry] = useState('FR');
  const [error, setError] = useState('');

  const { t } = useTranslations();

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setError("Veuillez sélectionner une équipe.");
      return;
    }
    onJoinTeam(selectedTeamId);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      setError("Veuillez donner un nom à votre équipe.");
      return;
    }
    onCreateTeam({ name: newTeamName, level: newTeamLevel, country: newTeamCountry });
  };
  
  const tabButtonStyle = (tab: 'join' | 'create') => 
    `w-1/2 py-2.5 text-sm font-medium text-center transition-colors duration-150 rounded-t-lg
    ${activeTab === tab 
        ? 'bg-slate-800 text-white border-b-2 border-blue-400' 
        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    }`;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-lg p-8 space-y-6 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
        <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-100">{t('noTeamWelcome')} {currentUser.firstName}</h1>
            <p className="mt-2 text-slate-300">{t('noTeamMessage')}</p>
        </div>
        
        <div className="flex border-b border-slate-700">
            <button onClick={() => setActiveTab('join')} className={tabButtonStyle('join')}>
                {t('noTeamJoinAction')}
            </button>
            <button onClick={() => setActiveTab('create')} className={tabButtonStyle('create')}>
                {t('noTeamCreateAction')}
            </button>
        </div>

        {activeTab === 'join' ? (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200">{t('signupJoinExistingTeam')}</h3>
             <div>
                <label htmlFor="team-select" className="text-sm font-medium text-slate-300">{t('team')}</label>
                <select id="team-select" value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)} required className="input-field-sm w-full">
                    <option value="">-- {t('signupSelectTeamError')} --</option>
                    {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
             </div>
             <ActionButton type="submit" className="w-full">{t('noTeamJoinAction')}</ActionButton>
          </form>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
             <h3 className="text-lg font-semibold text-slate-200">{t('noTeamCreateAction')}</h3>
             <div>
                <label htmlFor="newTeamNameLobby" className="text-sm font-medium text-slate-300">{t('signupCreateNewTeamName')}</label>
                <input type="text" id="newTeamNameLobby" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required className="input-field-sm w-full" />
             </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="newTeamLevelLobby" className="text-sm font-medium text-slate-300">{t('signupCreateTeamLevel')}</label>
                    <select id="newTeamLevelLobby" value={newTeamLevel} onChange={e => setNewTeamLevel(e.target.value as TeamLevel)} className="input-field-sm w-full">
                        {Object.values(TeamLevel).map(level => <option key={level} value={level}>{level}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="newTeamCountryLobby" className="text-sm font-medium text-slate-300">{t('signupCreateTeamCountry')}</label>
                    <select id="newTeamCountryLobby" value={newTeamCountry} onChange={e => setNewTeamCountry(e.target.value)} className="input-field-sm w-full">
                        {ALL_COUNTRIES.map(({ code, name }) => (
                            <option key={code} value={code}>{name}</option>
                        ))}
                    </select>
                </div>
              </div>
             <ActionButton type="submit" className="w-full">{t('noTeamCreateAction')}</ActionButton>
          </form>
        )}
        
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        <div className="text-center pt-4 border-t border-slate-700">
            <button onClick={onLogout} className="text-sm text-slate-400 hover:text-slate-200 hover:underline">
                {t('sidebarLogout')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default NoTeamView;