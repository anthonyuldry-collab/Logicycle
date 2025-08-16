

import React, { useState, useMemo } from 'react';
import { StaffMember, RaceEvent, EventStaffAvailability, StaffRoleKey, EventBudgetItem, StaffRole, StaffStatus, AvailabilityStatus, EventType, ContractType, BudgetItemCategory, User, TeamRole, WorkExperience, Team, PerformanceEntry, Mission, MissionStatus, MissionCompensationType, Address, EducationOrCertification } from '../types'; 
import { STAFF_ROLE_COLORS, STAFF_STATUS_COLORS, EVENT_TYPE_COLORS, STAFF_ROLES_CONFIG } from '../constants'; 
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import StaffDetailModal from '../components/StaffDetailModal';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import SearchIcon from '../components/icons/SearchIcon';
import MailIcon from '../components/icons/MailIcon'; 
import PhoneIcon from '../components/icons/PhoneIcon';
import LocationMarkerIcon from '../components/icons/LocationMarkerIcon';
import Modal from '../components/Modal';
import XCircleIcon from '../components/icons/XCircleIcon';
import ConfirmationModal from '../components/ConfirmationModal';
import StaffSearchTab from '../components/StaffSearchTab';
import MissionSearchSection from './MissionSearchSection';
import StarIcon from '../components/icons/StarIcon';
import CalendarDaysIcon from '../components/icons/CalendarDaysIcon';
import BanknotesIcon from '../components/icons/BanknotesIcon';
import { useTranslations } from '../hooks/useTranslations';

interface StaffSectionProps {
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  raceEvents: RaceEvent[];
  setRaceEvents: React.Dispatch<React.SetStateAction<RaceEvent[]>>;
  eventStaffAvailabilities: EventStaffAvailability[];
  setEventStaffAvailabilities: React.Dispatch<React.SetStateAction<EventStaffAvailability[]>>;
  eventBudgetItems: EventBudgetItem[];
  setEventBudgetItems: React.Dispatch<React.SetStateAction<EventBudgetItem[]>>;
  currentUser: User;
  team?: Team;
  performanceEntries: PerformanceEntry[];
  missions: Mission[];
  teams: Team[];
  users: User[];
  setMissions: (updater: React.SetStateAction<Mission[]>) => void;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const initialMissionFormState: Omit<Mission, 'id' | 'teamId' | 'status' | 'applicants'> = {
    title: '',
    role: StaffRole.ASSISTANT,
    startDate: '',
    endDate: '',
    location: '',
    description: '',
    requirements: [],
    compensationType: MissionCompensationType.FREELANCE,
    dailyRate: undefined,
    compensation: '',
};

const getEventDuration = (event: RaceEvent): number => {
    if (!event.date) return 0;
    const startDate = new Date(event.date + "T00:00:00Z");
    const endDate = event.endDate ? new Date(event.endDate + "T23:59:59Z") : startDate;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
};

const calculateDaysAssigned = (staffId: string, allEvents: RaceEvent[]): number => {
    return allEvents.reduce((total, event) => {
        const allAssignedIds = new Set<string>(event.selectedStaffIds || []);
        STAFF_ROLES_CONFIG.flatMap(g => g.roles).forEach(roleInfo => {
            const roleKey = roleInfo.key as StaffRoleKey;
            (event[roleKey] || []).forEach(id => allAssignedIds.add(id));
        });

        if (allAssignedIds.has(staffId)) {
            return total + getEventDuration(event);
        }
        return total;
    }, 0);
};

interface GlobalPlanningTabProps {
  upcomingEvents: RaceEvent[];
  onAssign: (event: RaceEvent) => void;
}

const GlobalPlanningTab: React.FC<GlobalPlanningTabProps> = ({ upcomingEvents, onAssign }) => {
  return (
      <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Assignation du Staff par Événement</h3>
          <div className="max-h-[70vh] overflow-y-auto space-y-3 pr-2">
              {upcomingEvents.length > 0 ? (
                  upcomingEvents.map(event => {
                      const staffSummary = STAFF_ROLES_CONFIG.flatMap(group => group.roles)
                          .map(roleInfo => {
                              const roleKey = roleInfo.key as StaffRoleKey;
                              const assignedIds = event[roleKey] || [];
                              if (assignedIds.length > 0) {
                                  const roleLabel = roleInfo.label.replace(/\(s\)/g, '').replace(/\(s/g, '').trim();
                                  return `${roleLabel}: ${assignedIds.length}`;
                              }
                              return null;
                          })
                          .filter(Boolean)
                          .join(' | ');

                      return (
                          <button
                              key={event.id}
                              onClick={() => onAssign(event)}
                              className="w-full text-left p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          >
                              <div className="flex justify-between items-start">
                                  <div>
                                      <p className="font-bold text-gray-900">{event.name}</p>
                                      <p className="text-xs text-gray-500">{new Date(event.date + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} - {event.location}</p>
                                  </div>
                                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${EVENT_TYPE_COLORS[event.eventType]}`}>{event.eventType}</span>
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
                                  <p><strong>Staff :</strong> {staffSummary || <span className="italic">Aucun staff assigné par rôle.</span>}</p>
                              </div>
                          </button>
                      );
                  })
              ) : (
                  <p className="text-center text-gray-500 italic py-8">Aucun événement à venir.</p>
              )}
          </div>
      </div>
  );
};


export const StaffSection: React.FC<StaffSectionProps> = ({ 
  staff, 
  setStaff, 
  raceEvents, 
  setRaceEvents,
  eventStaffAvailabilities,
  setEventStaffAvailabilities,
  eventBudgetItems,
  setEventBudgetItems,
  currentUser,
  team,
  performanceEntries,
  missions,
  teams,
  users,
  setMissions,
}) => {
  const { language } = useTranslations();
  // --- STATE FOR ALL TABS ---
  const [activeTab, setActiveTab] = useState<'details' | 'planning' | 'missionSearch' | 'myApplications' | 'postingsManagement' | 'search'>('details');
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);
  
  // State for Staff Details Tab
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<StaffRole | 'all'>('all');
  const [staffStatusFilter, setStaffStatusFilter] = useState<StaffStatus | 'all'>('all');
  
  // State for Postings Management & My Applications
  const [isPostMissionModalOpen, setIsPostMissionModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [newMissionData, setNewMissionData] = useState<Omit<Mission, 'id' | 'teamId' | 'status' | 'applicants'>>(initialMissionFormState);
  const [isApplicantsModalOpen, setIsApplicantsModalOpen] = useState(false);
  const [missionForApplicants, setMissionForApplicants] = useState<Mission | null>(null);
  const [selectedMissionForDetails, setSelectedMissionForDetails] = useState<Mission | null>(null);
  const [viewingApplicant, setViewingApplicant] = useState<any | null>(null);

  // State for Global Planning Tab
  const [assignmentModalEvent, setAssignmentModalEvent] = useState<RaceEvent | null>(null);
  const [modalAssignments, setModalAssignments] = useState<Partial<Record<StaffRoleKey, string[]>>>({});

  const lightInputClass = `mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm bg-white text-gray-900 border-gray-300 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500`;
  const lightSelectClass = `mt-1 block w-full pl-3 pr-10 py-2 border rounded-md shadow-sm sm:text-sm bg-white text-gray-900 border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
  

  // Memo for details tab
  const filteredStaffMembers = useMemo(() => {
    return staff.filter(member => {
      const nameMatch = `${member.firstName} ${member.lastName}`.toLowerCase().includes(staffSearchTerm.toLowerCase());
      const roleMatch = staffRoleFilter === 'all' || member.role === staffRoleFilter;
      const statusMatch = staffStatusFilter === 'all' || member.status === staffStatusFilter;
      return nameMatch && roleMatch && statusMatch;
    }).sort((a,b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  }, [staff, staffSearchTerm, staffRoleFilter, staffStatusFilter]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [...raceEvents]
        .filter(event => new Date(event.endDate || event.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [raceEvents]);

  const handleSaveStaff = (staffToSave: StaffMember) => {
    setStaff(prev => {
      const exists = prev.some(s => s.id === staffToSave.id);
      if (exists) {
        return prev.map(s => s.id === staffToSave.id ? staffToSave : s);
      }
      return [...prev, { ...staffToSave, id: staffToSave.id || generateId() }];
    });
    setIsDetailModalOpen(false);
  };

  const handleDeleteStaff = (staffId: string) => {
    const member = staff.find(s => s.id === staffId);
    if (!member) return;

    setConfirmAction({
      title: `Supprimer ${member.firstName} ${member.lastName}`,
      message: "Êtes-vous sûr de vouloir supprimer ce membre du staff ? Cette action est irréversible.",
      onConfirm: () => {
        setStaff(prev => prev.filter(s => s.id !== staffId));
        // Also remove from events
        setRaceEvents(prevEvents => prevEvents.map(event => {
            const newEvent = {...event};
            Object.keys(newEvent).forEach(key => {
                if (key.endsWith('Id') && Array.isArray((newEvent as any)[key])) {
                    (newEvent as any)[key] = (newEvent as any)[key].filter((id: string) => id !== staffId);
                }
            });
            newEvent.selectedStaffIds = newEvent.selectedStaffIds.filter(id => id !== staffId);
            return newEvent;
        }));
      }
    });
  };

  const openAddModal = () => {
    setEditingStaffMember(null);
    setIsDetailModalOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
    setEditingStaffMember(member);
    setIsDetailModalOpen(true);
  };

  const openAddNewMissionModal = () => {
    setEditingMission(null);
    setNewMissionData(initialMissionFormState);
    setIsPostMissionModalOpen(true);
  };

  const openEditMissionModal = (mission: Mission) => {
      setEditingMission(mission);
      setNewMissionData({
          ...mission,
          requirements: mission.requirements || [],
      });
      setIsPostMissionModalOpen(true);
  };

  const handleDeleteMission = (missionToDelete: Mission) => {
      setConfirmAction({
          title: `Supprimer l'annonce "${missionToDelete.title}"`,
          message: "Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.",
          onConfirm: () => {
              setMissions(prev => prev.filter(m => m.id !== missionToDelete.id));
          }
      });
  };
  
  const handleUpdateMissionStatus = (missionId: string, status: MissionStatus) => {
    setMissions(prev => prev.map(m => m.id === missionId ? { ...m, status } : m));
  };


  const handleSaveMission = () => {
    if (!team) return;
    
    if (editingMission) {
        setMissions(prev => prev.map(m => 
            m.id === editingMission.id 
            ? { ...m, ...newMissionData, id: editingMission.id, teamId: team.id } 
            : m
        ));
    } else {
        const newMission: Mission = {
            ...newMissionData,
            id: generateId(),
            teamId: team.id,
            status: MissionStatus.OPEN,
            applicants: []
        };
        setMissions(prev => [...prev, newMission]);
    }
    setIsPostMissionModalOpen(false);
    setEditingMission(null);
  };
  
   const handleSaveAssignments = (eventId: string, assignments: Partial<Record<StaffRoleKey, string[]>>) => {
        setRaceEvents(prevEvents => prevEvents.map(event => {
            if (event.id === eventId) {
                // 1. Identify manually added staff from the *previous* state
                const previousRoleAssignedStaff = new Set<string>();
                STAFF_ROLES_CONFIG.flatMap(g => g.roles).forEach(roleInfo => {
                    (event[roleInfo.key as StaffRoleKey] || []).forEach(id => previousRoleAssignedStaff.add(id));
                });
                const manuallyAddedStaff = (event.selectedStaffIds || []).filter(id => !previousRoleAssignedStaff.has(id));

                // 2. Apply new role assignments
                const updatedEvent = { ...event, ...assignments };

                // 3. Get the new set of all role-assigned staff
                const newRoleAssignedStaff = new Set<string>();
                STAFF_ROLES_CONFIG.flatMap(g => g.roles).forEach(roleInfo => {
                    (updatedEvent[roleInfo.key as StaffRoleKey] || []).forEach(id => newRoleAssignedStaff.add(id));
                });

                // 4. Combine manually added staff with the new role-assigned staff
                updatedEvent.selectedStaffIds = Array.from(new Set([...manuallyAddedStaff, ...Array.from(newRoleAssignedStaff)]));

                // 5. Update availabilities for the new combined list
                setEventStaffAvailabilities(prevAvail => {
                    const updatedAvailabilities = [...prevAvail];
                    updatedEvent.selectedStaffIds.forEach(staffId => {
                        const hasAvailabilityRecord = updatedAvailabilities.some(a => a.eventId === eventId && a.staffId === staffId);
                        if (!hasAvailabilityRecord) {
                            updatedAvailabilities.push({
                                id: generateId(),
                                eventId: eventId,
                                staffId: staffId,
                                availability: AvailabilityStatus.DISPONIBLE,
                            });
                        }
                    });
                    return updatedAvailabilities;
                });
                
                return updatedEvent;
            }
            return event;
        }));
        setAssignmentModalEvent(null);
    };

  const handleOpenAssignmentModal = (event: RaceEvent) => {
    const initialAssignments: Partial<Record<StaffRoleKey, string[]>> = {};
    STAFF_ROLES_CONFIG.flatMap(g => g.roles).forEach(r => {
        initialAssignments[r.key as StaffRoleKey] = event[r.key as StaffRoleKey] || [];
    });
    setModalAssignments(initialAssignments);
    setAssignmentModalEvent(event);
  };

   const renderDetailsTab = () => (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={staffSearchTerm}
            onChange={(e) => setStaffSearchTerm(e.target.value)}
            className={lightInputClass}
          />
          <select value={staffRoleFilter} onChange={(e) => setStaffRoleFilter(e.target.value as any)} className={lightSelectClass}>
            <option value="all">Tous les rôles</option>
            {Object.values(StaffRole).map(role => <option key={role} value={role}>{role}</option>)}
          </select>
          <select value={staffStatusFilter} onChange={(e) => setStaffStatusFilter(e.target.value as any)} className={lightSelectClass}>
            <option value="all">Tous les statuts</option>
            {Object.values(StaffStatus).map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaffMembers.map(member => {
            const daysAssigned = calculateDaysAssigned(member.id, raceEvents);
            return (
              <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col border">
                <div className="p-4 flex-grow">
                    <div className="flex items-center space-x-4 mb-3">
                        {member.photoUrl ? <img src={member.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover"/> : <UserCircleIcon className="w-16 h-16 text-gray-400"/>}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{member.firstName} {member.lastName}</h3>
                            <p className={`text-sm font-semibold px-2 py-0.5 mt-1 inline-block rounded-full ${STAFF_ROLE_COLORS[member.role] || STAFF_ROLE_COLORS[StaffRole.AUTRE]}`}>{member.customRole || member.role}</p>
                        </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                        <p><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STAFF_STATUS_COLORS[member.status]}`}>{member.status}</span></p>
                        {member.phone && <p className="flex items-center"><PhoneIcon className="w-4 h-4 mr-2 text-gray-400"/> {member.phone}</p>}
                        {member.email && <p className="flex items-center"><MailIcon className="w-4 h-4 mr-2 text-gray-400"/> {member.email}</p>}
                        {member.address?.city && <p className="flex items-center"><LocationMarkerIcon className="w-4 h-4 mr-2 text-gray-400"/> {member.address.city}</p>}
                        <div className="pt-2">
                            <p className="flex items-center font-semibold"><CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-400"/> Jours de mission : {daysAssigned}</p>
                        </div>
                    </div>
                </div>
                <div className="p-3 bg-gray-50 border-t flex justify-end space-x-2">
                    <ActionButton onClick={() => openEditModal(member)} variant="secondary" size="sm" icon={<PencilIcon className="w-4 h-4"/>}>Modifier</ActionButton>
                    <ActionButton onClick={() => handleDeleteStaff(member.id)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4"/>}>Supprimer</ActionButton>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );

  const renderSearchTab = () => (
    <StaffSearchTab
      allStaff={staff}
      raceEvents={raceEvents}
      teamAddress={team?.address}
      performanceEntries={performanceEntries}
    />
  );
  
  const renderMissionSearchTab = () => (
    <MissionSearchSection
      missions={missions}
      teams={teams}
      currentUser={currentUser}
      setMissions={setMissions}
    />
  );

  const renderMyApplicationsTab = () => {
    const myApplications = missions.filter(m => m.applicants?.includes(currentUser.id));
    return (
        <div className="space-y-3">
            <h3 className="text-xl font-semibold">Mes Candidatures</h3>
            {myApplications.length > 0 ? myApplications.map(mission => (
                <div key={mission.id} className="p-3 bg-white rounded-md border flex justify-between items-center">
                    <div>
                        <p className="font-bold">{mission.title} - <span className="font-normal text-gray-600">{teams.find(t=>t.id === mission.teamId)?.name}</span></p>
                        <p className="text-sm text-gray-500">Statut: En attente</p>
                    </div>
                    <ActionButton variant="secondary" size="sm" onClick={() => setSelectedMissionForDetails(mission)}>Voir l'annonce</ActionButton>
                </div>
            )) : <p className="italic text-gray-500">Vous n'avez postulé à aucune mission.</p>}
        </div>
    );
  };
  
  const renderPostingsManagementTab = () => {
    if (currentUser.permissionRole !== TeamRole.ADMIN && currentUser.permissionRole !== TeamRole.EDITOR) {
      return null;
    }
    const myTeamMissions = missions.filter(m => m.teamId === team?.id);
    const openMissions = myTeamMissions.filter(m => m.status === MissionStatus.OPEN).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const archivedMissions = myTeamMissions.filter(m => m.status !== MissionStatus.OPEN).sort((a,b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    
    const MissionListItem = ({ mission }: { mission: Mission}) => (
         <div key={mission.id} className="p-3 bg-white rounded-md border flex justify-between items-center flex-wrap gap-2">
             <div>
                <p className="font-bold">{mission.title} ({mission.role})</p>
                <p className="text-sm text-gray-500">Statut: {mission.status} - Du {new Date(mission.startDate+'T12:00:00Z').toLocaleDateString('fr-CA')} au {new Date(mission.endDate+'T12:00:00Z').toLocaleDateString('fr-CA')}</p>
             </div>
             <div className="flex-shrink-0 space-x-2">
                {mission.status === MissionStatus.OPEN ? (
                    <ActionButton onClick={() => handleUpdateMissionStatus(mission.id, MissionStatus.CLOSED)} variant="warning" size="sm">Clôturer</ActionButton>
                ) : (
                    <ActionButton onClick={() => handleUpdateMissionStatus(mission.id, MissionStatus.OPEN)} variant="primary" size="sm">Ré-ouvrir</ActionButton>
                )}
                <ActionButton onClick={() => openEditMissionModal(mission)} variant="secondary" size="sm" icon={<PencilIcon className="w-4 h-4"/>}/>
                <ActionButton onClick={() => handleDeleteMission(mission)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4"/>}/>
                <ActionButton onClick={() => { setMissionForApplicants(mission); setIsApplicantsModalOpen(true); }}>
                    Voir Candidats ({mission.applicants?.length || 0})
                </ActionButton>
             </div>
         </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Annonces de Mon Équipe</h3>
                <ActionButton onClick={openAddNewMissionModal} icon={<PlusCircleIcon className="w-5 h-5"/>}>Publier une mission</ActionButton>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Annonces Actives</h4>
              <div className="space-y-3">
                {openMissions.length > 0 ? (
                  openMissions.map(m => <MissionListItem key={m.id} mission={m} />)
                ) : (
                  <p className="italic text-gray-500 p-3">Aucune annonce active.</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">Annonces Archivées</h4>
              <div className="space-y-3">
                {archivedMissions.length > 0 ? (
                  archivedMissions.map(m => <MissionListItem key={m.id} mission={m} />)
                ) : (
                  <p className="italic text-gray-500 p-3">Aucune annonce archivée.</p>
                )}
              </div>
            </div>
        </div>
    );
  };

  const tabButtonStyle = (tabName: string) => 
    `px-3 py-2 font-medium text-sm rounded-t-md whitespace-nowrap transition-colors duration-150 focus:outline-none ${
      activeTab === tabName 
        ? 'bg-white text-gray-800 border-b-2 border-blue-500 shadow-sm' 
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
    }`;
    
  const isManager = currentUser.permissionRole === TeamRole.ADMIN || currentUser.permissionRole === TeamRole.EDITOR;

  return (
    <SectionWrapper
      title="Gestion du Staff"
      actionButton={activeTab === 'details' ? <ActionButton onClick={openAddModal} icon={<PlusCircleIcon className="w-5 h-5"/>}>Ajouter Membre</ActionButton> : null}
    >
        <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
                <button onClick={() => setActiveTab('details')} className={tabButtonStyle('details')}>Détails Staff</button>
                {isManager && <button onClick={() => setActiveTab('planning')} className={tabButtonStyle('planning')}>Planning Global du Staff</button>}
                <button onClick={() => setActiveTab('missionSearch')} className={tabButtonStyle('missionSearch')}>Recherche de Missions</button>
                <button onClick={() => setActiveTab('myApplications')} className={tabButtonStyle('myApplications')}>Mes Candidatures</button>
                {isManager && <button onClick={() => setActiveTab('postingsManagement')} className={tabButtonStyle('postingsManagement')}>Gestion des Annonces</button>}
                <button onClick={() => setActiveTab('search')} className={tabButtonStyle('search')}>Recherche de Vacataires</button>
            </nav>
        </div>
        
        {activeTab === 'details' && renderDetailsTab()}
        {activeTab === 'planning' && isManager && <GlobalPlanningTab upcomingEvents={upcomingEvents} onAssign={handleOpenAssignmentModal} />}
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'missionSearch' && renderMissionSearchTab()}
        {activeTab === 'myApplications' && renderMyApplicationsTab()}
        {activeTab === 'postingsManagement' && renderPostingsManagementTab()}

      {isDetailModalOpen && (
        <StaffDetailModal 
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            staffMember={editingStaffMember}
            onSave={handleSaveStaff}
            allRaceEvents={raceEvents}
            performanceEntries={performanceEntries}
            daysAssigned={editingStaffMember ? calculateDaysAssigned(editingStaffMember.id, raceEvents) : 0}
        />
      )}

      {confirmAction && (
        <ConfirmationModal
            isOpen={true}
            onClose={() => setConfirmAction(null)}
            onConfirm={() => { confirmAction.onConfirm(); setConfirmAction(null); }}
            title={confirmAction.title}
            message={confirmAction.message}
        />
      )}

      {assignmentModalEvent && (
            <Modal isOpen={!!assignmentModalEvent} onClose={() => setAssignmentModalEvent(null)} title={`Assignation Staff: ${assignmentModalEvent.name}`}>
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                    {STAFF_ROLES_CONFIG.map(group => (
                        <div key={group.group} className="mb-4">
                            <h4 className="font-semibold text-gray-800 border-b pb-1 mb-2">{group.group}</h4>
                            <div className="space-y-3">
                                {group.roles.map(roleInfo => {
                                    const roleKey = roleInfo.key as StaffRoleKey;
                                    const selectedForRole = modalAssignments[roleKey] || [];
                                    
                                    return (
                                    <div key={roleKey}>
                                        <label className="block text-sm font-medium text-gray-700">{roleInfo.label}</label>
                                        <div className="mt-1 p-2 border rounded-md space-y-1 bg-gray-50 max-h-40 overflow-y-auto">
                                            {staff.map(member => {
                                                const isUnavailable = raceEvents.some(otherEvent => {
                                                    if (otherEvent.id === assignmentModalEvent.id || !(otherEvent.selectedStaffIds || []).includes(member.id)) {
                                                        return false;
                                                    }
                                                    const currentEventStart = new Date(assignmentModalEvent.date + 'T00:00:00Z');
                                                    const currentEventEnd = new Date((assignmentModalEvent.endDate || assignmentModalEvent.date) + 'T23:59:59Z');
                                                    const otherEventStart = new Date(otherEvent.date + 'T00:00:00Z');
                                                    const otherEventEnd = new Date((otherEvent.endDate || otherEvent.date) + 'T23:59:59Z');
                                                    
                                                    return currentEventStart <= otherEventEnd && currentEventEnd >= otherEventStart;
                                                });
                                                
                                                return (
                                                <div key={member.id} className="flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        id={`${roleKey}-${member.id}`}
                                                        checked={selectedForRole.includes(member.id)}
                                                        disabled={isUnavailable}
                                                        onChange={() => {
                                                            const newSelection = selectedForRole.includes(member.id)
                                                                ? selectedForRole.filter(id => id !== member.id)
                                                                : [...selectedForRole, member.id];
                                                            setModalAssignments(prev => ({...prev, [roleKey]: newSelection}));
                                                        }}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <label htmlFor={`${roleKey}-${member.id}`} className={`ml-2 text-sm ${isUnavailable ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                        {member.firstName} {member.lastName} ({member.role}) {isUnavailable && "(Non dispo.)"}
                                                    </label>
                                                </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-2 mt-4 pt-3 border-t">
                    <ActionButton variant="secondary" onClick={() => setAssignmentModalEvent(null)}>Annuler</ActionButton>
                    <ActionButton onClick={() => handleSaveAssignments(assignmentModalEvent.id, modalAssignments)}>Sauvegarder</ActionButton>
                </div>
            </Modal>
        )}

      {missionForApplicants && (
        <Modal isOpen={isApplicantsModalOpen} onClose={() => setIsApplicantsModalOpen(false)} title={`Candidats pour : ${missionForApplicants.title}`}>
          {(missionForApplicants.applicants || []).length === 0 ? (
            <p className="italic text-gray-500 text-center py-4">Aucun candidat pour le moment.</p>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto p-1">
              {(missionForApplicants.applicants || []).map(applicantId => {
                const applicantUser = users.find(u => u.id === applicantId);
                if (!applicantUser) {
                    return <div key={applicantId} className="p-2 bg-red-100 rounded-md">Profil candidat non trouvé (ID: {applicantId})</div>;
                }
                const staffProfileForApplicant = staff.find(s => s.email === applicantUser.email) || users.find(u => u.id === applicantId);

                const applicant = {
                    id: applicantUser.id,
                    photoUrl: (staffProfileForApplicant as StaffMember)?.photoUrl,
                    firstName: applicantUser.firstName,
                    lastName: applicantUser.lastName,
                    email: applicantUser.email,
                    phone: (staffProfileForApplicant as StaffMember)?.phone,
                    role: (staffProfileForApplicant as StaffMember)?.role || 'N/A',
                    address: (staffProfileForApplicant as StaffMember)?.address,
                    professionalSummary: (staffProfileForApplicant as StaffMember)?.professionalSummary || '',
                    skills: (staffProfileForApplicant as StaffMember)?.skills || [],
                    workHistory: (staffProfileForApplicant as StaffMember)?.workHistory || [],
                    education: (staffProfileForApplicant as StaffMember)?.education || [],
                };
                
                const ratings = performanceEntries.flatMap(pe => pe.staffRatings || []).filter(r => r.staffId === applicant.id && r.rating > 0);
                const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;
                
                return (
                    <button 
                        key={applicant.id}
                        onClick={() => setViewingApplicant(applicant)}
                        className="w-full text-left p-3 bg-gray-50 rounded-lg shadow-sm border hover:bg-gray-100 flex justify-between items-center transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {applicant.photoUrl ? (
                            <img src={applicant.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover"/>
                            ) : (
                            <UserCircleIcon className="w-10 h-10 text-gray-400" />
                            )}
                            <div>
                            <h4 className="font-semibold text-gray-800">{applicant.firstName} {applicant.lastName}</h4>
                            <p className="text-sm text-gray-600">{applicant.role}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            {averageRating > 0 && (
                            <div className="flex items-center text-yellow-500 font-bold">
                                <StarIcon className="w-5 h-5 mr-1" />
                                <span>{averageRating.toFixed(1)}</span>
                            </div>
                            )}
                            <p className="text-xs text-gray-500">({ratings.length} avis)</p>
                        </div>
                    </button>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {viewingApplicant && (
        <Modal isOpen={!!viewingApplicant} onClose={() => setViewingApplicant(null)} title={`Profil de ${viewingApplicant.firstName} ${viewingApplicant.lastName}`}>
            <div key={viewingApplicant.id} className="bg-white rounded-lg overflow-hidden">
                <div className="p-4">
                    <div className="flex items-start gap-4">
                        {viewingApplicant.photoUrl ? (
                            <img src={viewingApplicant.photoUrl} alt="" className="w-20 h-20 rounded-full object-cover"/>
                        ) : (
                            <UserCircleIcon className="w-20 h-20 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-xl font-bold text-gray-800">{viewingApplicant.firstName} {viewingApplicant.lastName}</h4>
                                    <p className="text-sm text-gray-600">{viewingApplicant.role}</p>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-600 space-y-1">
                                {viewingApplicant.phone && <p className="flex items-center"><PhoneIcon className="w-4 h-4 mr-2 text-gray-400"/> {viewingApplicant.phone}</p>}
                                {viewingApplicant.email && <p className="flex items-center"><MailIcon className="w-4 h-4 mr-2 text-gray-400"/> <a href={`mailto:${viewingApplicant.email}`} className="text-blue-600 hover:underline">{viewingApplicant.email}</a></p>}
                                {viewingApplicant.address?.city && <p className="flex items-center"><LocationMarkerIcon className="w-4 h-4 mr-2 text-gray-400"/> {viewingApplicant.address.city}, {viewingApplicant.address.country}</p>}
                            </div>
                        </div>
                    </div>

                    {viewingApplicant.professionalSummary && (
                        <div className="mt-4 pt-3 border-t">
                            <h5 className="text-sm font-semibold text-gray-700">Résumé Professionnel (CV)</h5>
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{viewingApplicant.professionalSummary}</p>
                        </div>
                    )}
                    
                    {viewingApplicant.workHistory && viewingApplicant.workHistory.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                            <h5 className="text-sm font-semibold text-gray-700">Expériences</h5>
                            <ul className="list-disc list-inside mt-1 space-y-1 text-sm text-gray-600">
                                {viewingApplicant.workHistory.map((exp: WorkExperience) => (
                                    <li key={exp.id}>
                                        <strong>{exp.position}</strong> chez {exp.company} ({exp.startDate} - {exp.endDate || 'Actuel'})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {viewingApplicant.education && viewingApplicant.education.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                            <h5 className="text-sm font-semibold text-gray-700">Formations</h5>
                            <ul className="list-disc list-inside mt-1 space-y-1 text-sm text-gray-600">
                                {viewingApplicant.education.map((edu: EducationOrCertification) => (
                                    <li key={edu.id}>
                                        <strong>{edu.degree}</strong> - {edu.institution} ({edu.year})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {viewingApplicant.skills && viewingApplicant.skills.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                            <h5 className="text-sm font-semibold text-gray-700">Compétences</h5>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {viewingApplicant.skills.map((skill: string) => (
                                    <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
      )}

      {selectedMissionForDetails && (
        <Modal isOpen={!!selectedMissionForDetails} onClose={() => setSelectedMissionForDetails(null)} title={selectedMissionForDetails.title}>
            <div className="space-y-4 text-gray-700">
                <p><strong>Équipe:</strong> {teams.find(t => t.id === selectedMissionForDetails.teamId)?.name}</p>
                <p><strong>Rôle:</strong> {selectedMissionForDetails.role}</p>
                <p><strong>Dates:</strong> Du {new Date(selectedMissionForDetails.startDate + 'T12:00:00Z').toLocaleDateString('fr-CA')} au {new Date(selectedMissionForDetails.endDate + 'T12:00:00Z').toLocaleDateString('fr-CA')}</p>
                <p><strong>Lieu:</strong> {selectedMissionForDetails.location}</p>
                <p><strong>Compensation:</strong> {selectedMissionForDetails.compensation} {selectedMissionForDetails.dailyRate ? `(${selectedMissionForDetails.dailyRate}€/jour)` : ''}</p>
                <div>
                    <strong className="font-semibold text-gray-800">Description:</strong>
                    <p className="mt-1 whitespace-pre-wrap">{selectedMissionForDetails.description}</p>
                </div>
                {selectedMissionForDetails.requirements && selectedMissionForDetails.requirements.length > 0 && (
                    <div>
                        <strong className="font-semibold text-gray-800">Prérequis:</strong>
                        <ul className="list-disc list-inside mt-1">
                            {selectedMissionForDetails.requirements.map((req, i) => <li key={i}>{req}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        </Modal>
      )}

      <Modal isOpen={isPostMissionModalOpen} onClose={() => setIsPostMissionModalOpen(false)} title={editingMission ? "Modifier la mission" : "Publier une nouvelle mission"}>
        <div className="space-y-3">
          <input type="text" placeholder="Titre de la mission" value={newMissionData.title} onChange={e => setNewMissionData(p => ({ ...p, title: e.target.value }))} className={lightInputClass}/>
          <select value={newMissionData.role} onChange={e => setNewMissionData(p => ({ ...p, role: e.target.value as StaffRole }))} className={lightSelectClass}>{Object.values(StaffRole).map(r => <option key={r} value={r}>{r}</option>)}</select>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={newMissionData.startDate} onChange={e => setNewMissionData(p => ({ ...p, startDate: e.target.value }))} className={lightInputClass}/>
            <input type="date" value={newMissionData.endDate} onChange={e => setNewMissionData(p => ({ ...p, endDate: e.target.value }))} className={lightInputClass}/>
          </div>
          <input type="text" placeholder="Lieu" value={newMissionData.location} onChange={e => setNewMissionData(p => ({ ...p, location: e.target.value }))} className={lightInputClass}/>
          <textarea placeholder="Description de la mission" value={newMissionData.description} onChange={e => setNewMissionData(p => ({ ...p, description: e.target.value }))} rows={3} className={lightInputClass}></textarea>
          <div>
            <label className="text-sm font-medium text-gray-700">Prérequis (un par ligne)</label>
            <textarea placeholder="Permis B obligatoire
Expérience appréciée" value={Array.isArray(newMissionData.requirements) ? newMissionData.requirements.join('\n') : ''} onChange={e => setNewMissionData(p => ({ ...p, requirements: e.target.value.split('\n') }))} className={lightInputClass} rows={3}></textarea>
          </div>
          <fieldset className="border p-3 rounded-md">
            <legend className="text-sm font-medium">Rémunération</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                    <label>Type de prestation</label>
                    <select value={newMissionData.compensationType} onChange={e => setNewMissionData(p => ({ ...p, compensationType: e.target.value as MissionCompensationType }))} className={lightSelectClass}>
                        {Object.values(MissionCompensationType).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                    </select>
                </div>
                {newMissionData.compensationType === MissionCompensationType.FREELANCE && (
                    <div>
                        <label>Tarif journalier (€)</label>
                        <input type="number" placeholder="150" value={newMissionData.dailyRate || ''} onChange={e => setNewMissionData(p => ({ ...p, dailyRate: e.target.value ? parseFloat(e.target.value) : undefined }))} className={lightInputClass}/>
                    </div>
                )}
            </div>
            <div className="mt-4">
                <label>Détails sur la compensation</label>
                <input type="text" placeholder="Ex: Logement et repas pris en charge" value={newMissionData.compensation} onChange={e => setNewMissionData(p => ({ ...p, compensation: e.target.value }))} className={lightInputClass}/>
            </div>
          </fieldset>
          <div className="flex justify-end"><ActionButton onClick={handleSaveMission}>{editingMission ? "Sauvegarder" : "Publier"}</ActionButton></div>
        </div>
      </Modal>
    </SectionWrapper>
  );
};
