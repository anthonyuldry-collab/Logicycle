

import React, { useMemo, useState, useEffect } from 'react';
import { User, ResultItem, DisciplinePracticed, Rider, Team, ScoutingRequest, ScoutingRequestStatus, StaffMember, UserRole } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import TrophyIcon from '../components/icons/TrophyIcon';
import ActionButton from '../components/ActionButton';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import Modal from '../components/Modal';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import ConfirmationModal from '../components/ConfirmationModal';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import XCircleIcon from '../components/icons/XCircleIcon';
import EyeIcon from '../components/icons/EyeIcon';
import { ResultFormModal } from '../components/riderDetailTabs/ResultsTab';
import { ELIGIBLE_CATEGORIES_CONFIG } from '../constants';

interface CareerSectionProps {
  riders: Rider[];
  staff: StaffMember[];
  currentUser: User;
  setRiders: (updater: React.SetStateAction<Rider[]>) => void;
  setStaff: (updater: React.SetStateAction<StaffMember[]>) => void;
  teams: Team[];
  currentTeamId: string | null;
  onRequestTransfer: (destinationTeamId: string) => void;
  scoutingRequests: ScoutingRequest[];
  onRespondToScoutingRequest: (requestId: string, response: 'accepted' | 'rejected') => void;
  onUpdateVisibility: (updates: { isSearchable?: boolean; openToMissions?: boolean; }) => void;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const getCategoryLabel = (id: string = ''): string => {
    const category = ELIGIBLE_CATEGORIES_CONFIG.flatMap(g => g.categories).find(cat => cat.id === id);
    return category ? category.label : id;
};

const CareerSection: React.FC<CareerSectionProps> = ({ 
    riders, 
    staff,
    currentUser, 
    setRiders, 
    setStaff,
    teams, 
    currentTeamId, 
    onRequestTransfer, 
    scoutingRequests, 
    onRespondToScoutingRequest,
    onUpdateVisibility
}) => {
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<ResultItem | null>(null);
  const [disciplineFilter, setDisciplineFilter] = useState<'all' | DisciplinePracticed>('all');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [destinationTeamId, setDestinationTeamId] = useState('');
  const [transferRequestConfirmation, setTransferRequestConfirmation] = useState<Team | null>(null);
  const [visibilityConfirmation, setVisibilityConfirmation] = useState<{ isSearchable?: boolean; openToMissions?: boolean } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentSkill, setCurrentSkill] = useState('');

  const isRider = currentUser.userRole === UserRole.COUREUR;
  const isIndependent = !currentTeamId;
  const riderProfile = useMemo(() => isRider ? riders.find(r => r.email === currentUser.email) : null, [riders, currentUser, isRider]);
  const staffProfile = useMemo(() => !isRider ? staff.find(s => s.email === currentUser.email) : null, [staff, currentUser, isRider]);
  
  const careerStats = useMemo(() => {
    if (!riderProfile?.resultsHistory) return { wins: 0, podiums: 0, top10s: 0 };
    
    let wins = 0;
    let podiums = 0;
    let top10s = 0;

    riderProfile.resultsHistory.forEach(result => {
        const rank = typeof result.rank === 'string' ? parseInt(result.rank.replace(/\D/g, ''), 10) : result.rank;
        if (!isNaN(rank) && rank > 0) {
            if (rank === 1) wins++;
            if (rank <= 3) podiums++;
            if (rank <= 10) top10s++;
        }
    });

    return { wins, podiums, top10s };
  }, [riderProfile?.resultsHistory]);
  
  const pendingScoutingRequests = useMemo(() => scoutingRequests.filter(
      req => req.athleteId === currentUser.id && req.status === ScoutingRequestStatus.PENDING
  ), [scoutingRequests, currentUser.id]);

  const handleSaveResult = (resultToSave: ResultItem) => {
    if (!riderProfile) return;
    const history = riderProfile.resultsHistory || [];
    let newHistory;
    if (editingResult) {
        newHistory = history.map(r => r.id === editingResult.id ? { ...resultToSave, id: editingResult.id } : r);
    } else {
        newHistory = [...history, { ...resultToSave, id: generateId() }];
    }
    setRiders(prevRiders => prevRiders.map(r => r.id === riderProfile.id ? { ...r, resultsHistory: newHistory } : r));
    setIsResultModalOpen(false);
  };

  const handleDeleteResult = (resultId: string) => {
    if (window.confirm("Supprimer ce résultat ?")) {
        if (!riderProfile) return;
        const newHistory = (riderProfile.resultsHistory || []).filter(r => r.id !== resultId);
        setRiders(prevRiders => prevRiders.map(r => r.id === riderProfile.id ? { ...r, resultsHistory: newHistory } : r));
    }
  };

  const openEditResultModal = (result: ResultItem) => {
    setEditingResult(result);
    setIsResultModalOpen(true);
  };

  const openTransferRequestModal = () => {
    const firstOtherTeam = teams.find(t => t.id !== currentTeamId);
    setDestinationTeamId(firstOtherTeam ? firstOtherTeam.id : '');
    setIsTransferModalOpen(true);
  };

  const handleRequestTransferConfirm = () => {
    if (destinationTeamId) {
        const destinationTeam = teams.find(t => t.id === destinationTeamId);
        if (destinationTeam) {
            setTransferRequestConfirmation(destinationTeam);
        }
        setIsTransferModalOpen(false);
    }
  };

  const executeTransferRequest = () => {
    if (transferRequestConfirmation) {
        onRequestTransfer(transferRequestConfirmation.id);
        setTransferRequestConfirmation(null);
    }
  };

  const handleVisibilityChangeRequest = () => {
    if (isRider && riderProfile) {
      setVisibilityConfirmation({ isSearchable: !(riderProfile.isSearchable || false) });
    } else if (!isRider && staffProfile) {
      setVisibilityConfirmation({ openToMissions: !(staffProfile.openToExternalMissions || false) });
    }
  };

  const executeVisibilityChange = () => {
    if (visibilityConfirmation === null) return;
    onUpdateVisibility(visibilityConfirmation);
    setVisibilityConfirmation(null);
    setSuccessMessage('Visibilité du profil mise à jour !');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  const handleStaffInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (staffProfile) {
        setStaff(prevStaff => prevStaff.map(s => s.id === staffProfile.id ? { ...s, [name]: value } : s));
    }
  };

  const handleAddSkill = () => {
    if (currentSkill && staffProfile && !staffProfile.skills.includes(currentSkill)) {
        const updatedSkills = [...staffProfile.skills, currentSkill];
        setStaff(prevStaff => prevStaff.map(s => s.id === staffProfile.id ? { ...s, skills: updatedSkills } : s));
        setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (staffProfile) {
        const updatedSkills = staffProfile.skills.filter(s => s !== skillToRemove);
        setStaff(prevStaff => prevStaff.map(s => s.id === staffProfile.id ? { ...s, skills: updatedSkills } : s));
    }
  };

  const resultsByYear = useMemo(() => {
    if (!riderProfile?.resultsHistory) return [];
    const filtered = riderProfile.resultsHistory.filter(r => disciplineFilter === 'all' || r.discipline === disciplineFilter);
    const grouped = filtered.reduce((acc, result) => {
        const year = new Date(result.date + "T12:00:00Z").getUTCFullYear();
        if (!acc[year]) acc[year] = [];
        acc[year].push(result);
        return acc;
    }, {} as Record<string, ResultItem[]>);
    return Object.entries(grouped).sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA));
  }, [riderProfile?.resultsHistory, disciplineFilter]);

  if (!riderProfile && !staffProfile) {
    return (
       <SectionWrapper title="Ma Carrière">
          <div className="text-center p-8 bg-gray-50 rounded-lg border">
              <p>Impossible de trouver le profil associé à cet utilisateur.</p>
          </div>
      </SectionWrapper>
    );
  }

  const renderRiderView = () => riderProfile && (
    <div className="space-y-6">
        {successMessage && (
            <div className="absolute top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-md transition-opacity duration-300 z-50" role="alert">
                <strong className="font-bold">Succès !</strong>
                <span className="block sm:inline ml-2">{successMessage}</span>
            </div>
        )}
        <div className="p-4 bg-white rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            <EyeIcon className="w-5 h-5 mr-2 text-blue-500" />
            Visibilité de Mon Profil
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Rendez votre profil visible pour que d'autres équipes puissent découvrir vos talents et potentiellement vous contacter pour des opportunités.
          </p>
          <div className="flex items-center cursor-pointer" onClick={handleVisibilityChangeRequest}>
            <input
              type="checkbox"
              readOnly
              checked={riderProfile.isSearchable || false}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 pointer-events-none"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Rendre mon profil visible dans la recherche de talents
            </span>
          </div>
        </div>

        {pendingScoutingRequests.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg shadow-md border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Demandes de Suivi</h3>
                <div className="space-y-2">
                    {pendingScoutingRequests.map(req => {
                        const team = teams.find(t => t.id === req.requesterTeamId);
                        return (
                            <div key={req.id} className="p-3 bg-white rounded-md flex justify-between items-center">
                                <div>
                                    <p>L'équipe <strong>{team?.name || "Inconnue"}</strong> souhaite accéder à vos données de performance.</p>
                                    <p className="text-xs text-gray-500">Date de la demande: {new Date(req.requestDate + 'T12:00:00').toLocaleDateString('fr-FR')}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <ActionButton onClick={() => onRespondToScoutingRequest(req.id, 'accepted')} variant="primary" size="sm" icon={<CheckCircleIcon className="w-4 h-4"/>}>Accepter</ActionButton>
                                    <ActionButton onClick={() => onRespondToScoutingRequest(req.id, 'rejected')} variant="danger" size="sm" icon={<XCircleIcon className="w-4 h-4"/>}>Refuser</ActionButton>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
        <div className="p-4 bg-white rounded-lg shadow border">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Mon Palmarès</h3>
                <div className="flex items-center gap-2">
                     <ActionButton onClick={() => { setEditingResult(null); setIsResultModalOpen(true);}} icon={<PlusCircleIcon className="w-4 h-4"/>} size="sm">Ajouter</ActionButton>
                     <ActionButton onClick={openTransferRequestModal} variant="secondary" size="sm">Demander un Transfert</ActionButton>
                </div>
            </div>
            <div className="flex justify-end mb-3">
                <select 
                    value={disciplineFilter} 
                    onChange={e => setDisciplineFilter(e.target.value as any)} 
                    className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                    <option value="all">Toutes Disciplines</option>
                    {Object.values(DisciplinePracticed).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div className="space-y-4">
            {resultsByYear.length > 0 ? (
                resultsByYear.map(([year, results]) => (
                    <div key={year}>
                        <h4 className="font-bold text-gray-700 text-xl mb-2">{year}</h4>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-2 py-2 text-left">Date</th>
                                        <th className="px-2 py-2 text-left">Épreuve</th>
                                        <th className="px-2 py-2 text-left">Cat.</th>
                                        <th className="px-2 py-2 text-left">Rang</th>
                                        <th className="px-2 py-2 text-left">Équipe</th>
                                        <th className="px-2 py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {results.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(result => (
                                        <tr key={result.id} className="hover:bg-gray-50">
                                            <td className="px-2 py-2 whitespace-nowrap">{new Date(result.date + 'T12:00:00Z').toLocaleDateString('fr-CA')}</td>
                                            <td className="px-2 py-2 font-medium">{result.eventName}</td>
                                            <td className="px-2 py-2 text-gray-600">{getCategoryLabel(result.category)}</td>
                                            <td className="px-2 py-2 font-bold">{result.rank}</td>
                                            <td className="px-2 py-2">{result.team}</td>
                                            <td className="px-2 py-2 text-right space-x-1">
                                                <ActionButton onClick={() => openEditResultModal(result)} size="sm" variant="secondary" icon={<PencilIcon className="w-3 h-3"/>}/>
                                                <ActionButton onClick={() => handleDeleteResult(result.id)} size="sm" variant="danger" icon={<TrashIcon className="w-3 h-3"/>}/>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center p-8 bg-gray-50 rounded-lg border">
                    <TrophyIcon className="w-16 h-16 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-xl font-semibold text-gray-700">Aucun résultat enregistré</h3>
                    <p className="mt-2 text-gray-500">Commencez par ajouter vos résultats pour construire votre palmarès.</p>
                </div>
            )}
            </div>
        </div>
    </div>
  );

  const renderStaffView = () => staffProfile && (
    <div className="space-y-6">
        {successMessage && (
            <div className="absolute top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-md transition-opacity duration-300 z-50" role="alert">
                <strong className="font-bold">Succès !</strong>
                <span className="block sm:inline ml-2">{successMessage}</span>
            </div>
        )}
        <div className="p-4 bg-white rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Mon Profil Professionnel</h3>
          {isIndependent ? (
            <div className="space-y-3">
                <div>
                    <label htmlFor="professionalSummary" className="block text-sm font-medium text-gray-700">Résumé professionnel</label>
                    <textarea
                        id="professionalSummary"
                        name="professionalSummary"
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={staffProfile.professionalSummary || ""}
                        onChange={handleStaffInputChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Compétences</label>
                     <div className="flex gap-2 mb-2">
                        <input type="text" value={currentSkill} onChange={e => setCurrentSkill(e.target.value)} onKeyDown={e => {if(e.key === 'Enter'){ e.preventDefault(); handleAddSkill();}}} placeholder="Ajouter une compétence..." className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                        <ActionButton type="button" onClick={handleAddSkill} size="sm" icon={<PlusCircleIcon className="w-4 h-4"/>}>Ajouter</ActionButton>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(staffProfile.skills || []).length > 0 ? staffProfile.skills.map(skill => (
                          <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex items-center">
                              {skill}
                              <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-1.5 text-blue-600 hover:text-blue-800">
                                <XCircleIcon className="w-4 h-4"/>
                              </button>
                          </span>
                      )) : <p className="text-xs text-gray-500 italic">Aucune compétence renseignée.</p>}
                    </div>
                </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">{staffProfile.professionalSummary || "Aucun résumé professionnel renseigné."}</p>
              <h4 className="font-semibold text-gray-700">Compétences:</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                  {(staffProfile.skills || []).length > 0 ? staffProfile.skills.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">{skill}</span>
                  )) : <p className="text-xs text-gray-500 italic">Aucune compétence renseignée.</p>}
              </div>
              <p className="text-xs text-gray-500 mt-3">Pour modifier ces informations, veuillez contacter un manager ou modifier votre profil via l'onglet "Staff".</p>
            </>
          )}
        </div>
        <div className="p-4 bg-white rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            <EyeIcon className="w-5 h-5 mr-2 text-blue-500" />
            Recherche de Missions
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Activez cette option pour que votre profil soit visible par d'autres équipes sur la plateforme LogiCycle lorsqu'elles recherchent des vacataires.
          </p>
          <div className="flex items-center cursor-pointer" onClick={handleVisibilityChangeRequest}>
            <input
              type="checkbox"
              readOnly
              checked={staffProfile.openToExternalMissions || false}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 pointer-events-none"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Je suis ouvert(e) aux missions externes (en tant que vacataire)
            </span>
          </div>
        </div>
    </div>
  );

  return (
    <SectionWrapper title="Ma Carrière">
        {isRider ? renderRiderView() : renderStaffView()}
        
        {isResultModalOpen && (
            <ResultFormModal 
                isOpen={isResultModalOpen}
                onClose={() => setIsResultModalOpen(false)}
                onSave={handleSaveResult}
                initialData={editingResult}
            />
        )}

        <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Demander un transfert">
            <div className="space-y-4">
            <p>Sélectionnez l'équipe que vous souhaitez rejoindre. Une demande sera envoyée à leurs managers.</p>
            <div>
                <label htmlFor="destination-team-career" className="block text-sm font-medium text-gray-700">Équipe de destination</label>
                <select
                    id="destination-team-career"
                    value={destinationTeamId}
                    onChange={(e) => setDestinationTeamId(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="">-- Sélectionnez une équipe --</option>
                    {teams.filter(t => t.id !== currentTeamId).map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                </select>
            </div>
                <div className="flex justify-end space-x-2 pt-3">
                <ActionButton type="button" variant="secondary" onClick={() => setIsTransferModalOpen(false)}>Annuler</ActionButton>
                <ActionButton onClick={handleRequestTransferConfirm} disabled={!destinationTeamId}>
                    Envoyer la Demande
                </ActionButton>
            </div>
        </div>
        </Modal>

        {transferRequestConfirmation && (
            <ConfirmationModal
                isOpen={true}
                onClose={() => setTransferRequestConfirmation(null)}
                onConfirm={executeTransferRequest}
                title="Confirmer la demande de transfert"
                message={
                    <span>
                        Êtes-vous sûr de vouloir envoyer une demande de transfert à l'équipe <strong>{transferRequestConfirmation.name}</strong> ?
                    </span>
                }
            />
        )}

        {visibilityConfirmation !== null && (
            <ConfirmationModal
                isOpen={true}
                onClose={() => setVisibilityConfirmation(null)}
                onConfirm={executeVisibilityChange}
                title="Confirmer la visibilité du profil"
                message={
                    isRider
                        ? (visibilityConfirmation.isSearchable ? "Rendre votre profil visible permettra aux recruteurs de vous trouver. Êtes-vous sûr ?" : "Rendre votre profil invisible le cachera des recherches des recruteurs. Êtes-vous sûr ?")
                        : (visibilityConfirmation.openToMissions ? "Rendre votre profil visible pour des missions externes ?" : "Rendre votre profil invisible aux autres équipes ?")
                }
            />
        )}
    </SectionWrapper>
  );
};

export default CareerSection;