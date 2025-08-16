import React, { useState, useEffect, useCallback } from 'react';
import {
  AppSection, Rider, StaffMember, Vehicle, RaceEvent,
  EventTransportLeg, EventAccommodation, EventRaceDocument, 
  EventRadioEquipment, EventRadioAssignment, 
  EventBudgetItem, EventChecklistItem, PerformanceEntry,
  RiderEventSelection, EventStaffAvailability,
  EquipmentItem,
  IncomeItem,
  ChecklistTemplate,
  ScoutingProfile,
  TeamProduct,
  User,
  TeamRole,
  AppPermissions,
  Team,
  TeamMembership,
  TeamMembershipStatus,
  UserRole,
  TeamLevel,
  StaffRole,
  PermissionLevel,
  Sex,
  StockItem,
  EquipmentStockItem,
  TeamState,
  GlobalState,
  ChecklistRole,
  AllergySeverity,
  StaffStatus,
  BudgetItemCategory,
  ScoutingRequest,
  ScoutingRequestStatus,
  ScoutingStatus,
  DisciplinePracticed,
  PeerRating,
  AppState,
  SignupInfo,
  Mission,
  PerformanceFactorDetail,
  BikeSetup,
  PprData,
  RiderQualitativeProfile
} from './types';
import {
  getInitialGlobalState,
  getInitialTeamState,
  SECTIONS,
  DEFAULT_THEME_PRIMARY_COLOR,
  DEFAULT_THEME_ACCENT_COLOR,
  defaultRiderCharCap
} from './constants';

// Firebase imports
import { auth } from './firebaseConfig';
import * as firebaseService from './services/firebaseService';

import Sidebar from './components/Sidebar';
import { DashboardSection } from './sections/DashboardSection';
import { EventsSection } from './sections/EventsSection';
import EventDetailView from './EventDetailView'; 
import { RosterSection } from './sections/RosterSection'; 
import { StaffSection } from './sections/StaffSection';
import VehiclesSection from './sections/VehiclesSection';
import EquipmentSection from './sections/EquipmentSection';
import { PerformancePoleSection } from './sections/PerformanceSection';
import SettingsSection from './sections/SettingsSection'; 
import { FinancialSection } from './sections/FinancialSection';
import { ScoutingSection } from './sections/ScoutingSection';
import LoginView from './sections/LoginView';
import SignupView, { SignupData } from './sections/SignupView';
import UserManagementSection from './sections/UserManagementSection';
import PermissionsSection from './sections/PermissionsSection'; 
import PendingApprovalView from './sections/PendingApprovalView';
import CareerSection from './sections/CareerSection';
import NutritionSection from './sections/NutritionSection';
import RiderEquipmentSection from './sections/RiderEquipmentSection';
import AdminDossierSection from './sections/AdminDossierSection';
import MyTripsSection from './sections/MyTripsSection';
import StocksSection from './sections/StocksSection';
import { ChecklistSection } from './sections/ChecklistSection';
import { MyPerformanceSection } from './sections/MyPerformanceSection';
import MissionSearchSection from './sections/MissionSearchSection';
import { LanguageProvider } from './contexts/LanguageContext';
import { useTranslations } from './hooks/useTranslations';
import NoTeamView from './sections/NoTeamView';
import { AutomatedPerformanceProfileSection } from './sections/AutomatedPerformanceProfileSection';
import { PerformanceProjectSection } from './sections/PerformanceProjectSection';
import { calculateRiderCharacteristics } from './utils/performanceCalculations';

// Helper functions for dynamic theming
function getContrastYIQ(hexcolor: string): string {
  if (!hexcolor) return '#FFFFFF'; 
  hexcolor = hexcolor.replace("#", "");
  if (hexcolor.length === 3) {
    hexcolor = hexcolor.split('').map(char => char + char).join('');
  }
  if (hexcolor.length !== 6) return '#FFFFFF'; 

  const r = parseInt(hexcolor.substring(0, 2), 16);
  const g = parseInt(hexcolor.substring(2, 4), 16);
  const b = parseInt(hexcolor.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

function lightenDarkenColor(col: string, amt: number): string {
  if (!col) return '#000000'; 
  col = col.replace("#", "");
  if (col.length === 3) {
    col = col.split('').map(char => char + char).join('');
  }
  if (col.length !== 6) return '#000000'; 

  let num = parseInt(col, 16);
  let r = (num >> 16) + amt;
  if (r > 255) r = 255;
  else if (r < 0) r = 0;
  let green = ((num >> 8) & 0x00FF) + amt; 
  if (green > 255) green = 255;
  else if (green < 0) green = 0;
  let blue = (num & 0x0000FF) + amt; 
  if (blue > 255) blue = 255;
  else if (blue < 0) blue = 0;
  
  const rHex = r.toString(16).padStart(2, '0');
  const gHex = green.toString(16).padStart(2, '0');
  const bHex = blue.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

const App = () => {
  const [appState, setAppState] = useState<AppState>({
    ...getInitialGlobalState(),
    ...getInitialTeamState(),
    activeEventId: null,
    activeTeamId: null,
  });
  
  const [currentSection, setCurrentSection] = useState<AppSection>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'signup' | 'app' | 'pending' | 'no_team'>('login');
  
  const [language, setLanguageState] = useState<'fr' | 'en'>('fr');

  const { t } = useTranslations();

  const loadDataForUser = useCallback(async (user: User) => {
    setIsLoading(true);
    const globalData = await firebaseService.getGlobalData();
    const userMemberships = (globalData.teamMemberships || []).filter(m => m.userId === user.id);
    const activeMembership = userMemberships.find(m => m.status === TeamMembershipStatus.ACTIVE);
    
    let teamData: Partial<TeamState> = getInitialTeamState();
    let finalActiveTeamId: string | null = null;
    
    if (activeMembership) {
        finalActiveTeamId = activeMembership.teamId;
        teamData = await firebaseService.getTeamData(finalActiveTeamId);
        setView('app');
    } else if (userMemberships.some(m => m.status === TeamMembershipStatus.PENDING)) {
        setView('pending');
    } else {
        setView('no_team');
    }

    setAppState({
      ...getInitialGlobalState(),
      ...getInitialTeamState(),
      ...globalData,
      ...teamData,
      activeEventId: null, // Reset event detail view on user/team change
      activeTeamId: finalActiveTeamId,
    });
    
    setLanguageState(teamData.language || 'fr');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setIsLoading(true);
        let userProfile = await firebaseService.getUserProfile(firebaseUser.uid);
        
        // If profile doesn't exist (e.g., first login after signup), create it. This makes the app more robust.
        if (!userProfile) {
            console.log(`User profile for ${firebaseUser.uid} not found, creating...`);
            const { email } = firebaseUser;
            const firstName = email?.split('@')[0] || 'Nouveau';
            const lastName = 'Utilisateur';
            // We need a dummy password for the type, but it's not used for profile creation.
            const newProfileData: SignupData = { email: email || '', firstName, lastName, password: '' };
            await firebaseService.createUserProfile(firebaseUser.uid, newProfileData);
            userProfile = await firebaseService.getUserProfile(firebaseUser.uid); // Re-fetch the newly created profile
        }

        if (userProfile) {
          setCurrentUser(userProfile);
          await loadDataForUser(userProfile); // This will set loading to false
        } else {
          // This case should ideally not be reached if profile creation is successful.
          console.error("Critical: Failed to create or retrieve user profile. Logging out.");
          auth.signOut(); // Log out to prevent inconsistent state
        }
      } else {
        setCurrentUser(null);
        setAppState({ ...getInitialGlobalState(), ...getInitialTeamState(), activeEventId: null, activeTeamId: null });
        setView('login');
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [loadDataForUser]);

  const primaryColor = appState.themePrimaryColor || DEFAULT_THEME_PRIMARY_COLOR;
  const accentColor = appState.themeAccentColor || DEFAULT_THEME_ACCENT_COLOR;
  
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary-bg', primaryColor);
    root.style.setProperty('--theme-primary-hover-bg', lightenDarkenColor(primaryColor, 20));
    root.style.setProperty('--theme-primary-text', getContrastYIQ(primaryColor));
    root.style.setProperty('--theme-accent-color', accentColor);
    document.body.style.backgroundColor = lightenDarkenColor(primaryColor, -20);
  }, [primaryColor, accentColor]);
  
  // --- DATA HANDLERS ---
  const createSaveHandler = <T extends { id?: string }>(collectionName: keyof TeamState) =>
    useCallback(async (item: T) => {
        if (!appState.activeTeamId) return;
        const savedId = await firebaseService.saveData(appState.activeTeamId, collectionName as string, item);
        const finalItem = { ...item, id: item.id || savedId };
        
        setAppState(prev => {
            const collection = prev[collectionName] as T[];
            const exists = collection.some(i => i.id === finalItem.id);
            const newCollection = exists 
                ? collection.map(i => i.id === finalItem.id ? finalItem : i)
                : [...collection, finalItem];
            return { ...prev, [collectionName]: newCollection };
        });
    }, [appState.activeTeamId]);

  const createDeleteHandler = <T extends { id?: string }>(collectionName: keyof TeamState) =>
    useCallback(async (item: T) => {
        if (!appState.activeTeamId || !item.id) return;
        await firebaseService.deleteData(appState.activeTeamId, collectionName as string, item.id);
        
        setAppState(prev => {
            const collection = prev[collectionName] as T[];
            return { ...prev, [collectionName]: collection.filter(i => i.id !== item.id) };
        });
    }, [appState.activeTeamId]);
    
  const createBatchSetHandler = <T,>(collectionName: keyof TeamState): React.Dispatch<React.SetStateAction<T[]>> =>
    (updater) => {
        setAppState(prev => {
            const currentItems = prev[collectionName] as T[];
            const newItems = typeof updater === 'function' 
                ? (updater as (prevState: T[]) => T[])(currentItems) 
                : updater;
            
            return { ...prev, [collectionName]: newItems };
        });
    };


  const onSaveRider = createSaveHandler<Rider>('riders');
  const onDeleteRider = createDeleteHandler<Rider>('riders');
  const onSaveStaff = createSaveHandler<StaffMember>('staff');
  const onDeleteStaff = createDeleteHandler<StaffMember>('staff');
  const onSaveVehicle = createSaveHandler<Vehicle>('vehicles');
  const onDeleteVehicle = createDeleteHandler<Vehicle>('vehicles');
  const onSaveEquipment = createSaveHandler<EquipmentItem>('equipment');
  const onDeleteEquipment = createDeleteHandler<EquipmentItem>('equipment');
  const onSaveRaceEvent = createSaveHandler<RaceEvent>('raceEvents');
  const onDeleteRaceEvent = createDeleteHandler<RaceEvent>('raceEvents');
  
  // --- AUTH & ONBOARDING HANDLERS ---
  
  const handleLogin = async (email: string, password: string) => {
      try {
          await auth.signInWithEmailAndPassword(email, password);
          return { success: true, message: '' };
      } catch (error: any) {
          return { success: false, message: error.message };
      }
  };
  
  const handleRegister = async (data: SignupData): Promise<{ success: boolean; message: string; }> => {
      try {
          await auth.createUserWithEmailAndPassword(data.email, data.password);
          // The onAuthStateChanged listener will now handle creating the user profile.
          // This prevents race conditions and centralizes profile creation logic.
          return { success: true, message: '' };
      } catch (error: any) {
           if (error.code === 'auth/email-already-in-use') {
              return { success: false, message: "Cette adresse email est déjà utilisée par un autre compte." };
          }
          if (error.code === 'auth/weak-password') {
              return { success: false, message: t('signupPasswordTooShort') };
          }
          if (error.code === 'auth/invalid-email') {
              return { success: false, message: "L'adresse email n'est pas valide." };
          }
          return { success: false, message: `Erreur d'inscription: ${error.message}` };
      }
  };

  const handleJoinTeamRequest = async (teamId: string) => {
    if (!currentUser) return;
    try {
      await firebaseService.requestToJoinTeam(currentUser.id, teamId, currentUser.userRole);
      setView('pending');
    } catch (error) {
      console.error("Failed to join team:", error);
      alert(t('errorJoinTeam'));
    }
  };

  const handleCreateTeam = async (teamData: { name: string; level: TeamLevel; country: string; }) => {
    if (!currentUser) return;
    try {
      await firebaseService.createTeamForUser(currentUser.id, teamData, currentUser.userRole);
      // After creation, reload user data to get the new active team
      await loadDataForUser(currentUser);
    } catch (error) {
      console.error("Failed to create team:", error);
      alert(t('errorCreateTeam'));
    }
  };

  
  const handleLogout = () => {
      auth.signOut();
  };

  const navigateTo = (section: AppSection, eventId?: string) => {
    if (section === 'eventDetail' && eventId) {
      setAppState(prev => ({ ...prev, activeEventId: eventId }));
    } else {
      setAppState(prev => ({ ...prev, activeEventId: null }));
    }
    setCurrentSection(section);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">{t('loading')}</div>;
  }
  
  const renderContent = () => {
    if (view === 'login') {
      return <LoginView onLogin={handleLogin} onSwitchToSignup={() => setView('signup')} />;
    }
    if (view === 'signup') {
      return <SignupView onRegister={handleRegister} onSwitchToLogin={() => setView('login')} teams={appState.teams} />;
    }
    if (view === 'pending') {
      return <PendingApprovalView onLogout={handleLogout} />;
    }
     if (view === 'no_team' && currentUser) {
      return <NoTeamView currentUser={currentUser} teams={appState.teams} onJoinTeam={handleJoinTeamRequest} onCreateTeam={handleCreateTeam} onLogout={handleLogout} />;
    }
    
    if (view === 'app' && currentUser && appState.activeTeamId) {
       const effectivePermissions = firebaseService.getEffectivePermissions(currentUser, appState.permissions);
       const activeEvent = appState.activeEventId ? appState.raceEvents.find(e => e.id === appState.activeEventId) : null;
       const userTeams = appState.teams.filter(team => 
            appState.teamMemberships.some(m => m.teamId === team.id && m.userId === currentUser.id && m.status === TeamMembershipStatus.ACTIVE)
       );
       
       return (
        <LanguageProvider language={language} setLanguage={(lang) => { if(lang) setLanguageState(lang); }}>
         <div className="flex">
            <Sidebar 
                currentSection={currentSection} 
                onSelectSection={navigateTo}
                teamLogoUrl={appState.teamLogoUrl}
                onLogout={handleLogout}
                currentUser={currentUser}
                effectivePermissions={effectivePermissions}
                staff={appState.staff}
                permissionRoles={appState.permissionRoles}
                userTeams={userTeams}
                currentTeamId={appState.activeTeamId}
                onTeamSwitch={() => { /* TODO */ }}
                isIndependent={false}
                onGoToLobby={() => setView('no_team')}
            />
            <main className="flex-grow ml-64 p-6 bg-gray-100 min-h-screen">
                {activeEvent ? (
                    <EventDetailView 
                        event={activeEvent}
                        eventId={activeEvent.id}
                        appState={appState as AppState}
                        navigateTo={navigateTo}
                        deleteRaceEvent={(eventId) => {
                            onDeleteRaceEvent({ id: eventId } as RaceEvent);
                            navigateTo('events');
                        }}
                        currentUser={currentUser}
                        setRaceEvents={createBatchSetHandler<RaceEvent>('raceEvents')}
                        setEventTransportLegs={createBatchSetHandler<EventTransportLeg>('eventTransportLegs')}
                        setEventAccommodations={createBatchSetHandler<EventAccommodation>('eventAccommodations')}
                        setEventDocuments={createBatchSetHandler<EventRaceDocument>('eventDocuments')}
                        setEventRadioEquipments={createBatchSetHandler<EventRadioEquipment>('eventRadioEquipments')}
                        setEventRadioAssignments={createBatchSetHandler<EventRadioAssignment>('eventRadioAssignments')}
                        setEventBudgetItems={createBatchSetHandler<EventBudgetItem>('eventBudgetItems')}
                        setEventChecklistItems={createBatchSetHandler<EventChecklistItem>('eventChecklistItems')}
                        setPerformanceEntries={createBatchSetHandler<PerformanceEntry>('performanceEntries')}
                        setPeerRatings={createBatchSetHandler<PeerRating>('peerRatings')}
                    />
                ) : (
                    <>
                        {currentSection === 'dashboard' && <DashboardSection navigateTo={navigateTo} currentUser={currentUser} riders={appState.riders} staff={appState.staff} vehicles={appState.vehicles} scoutingProfiles={appState.scoutingProfiles} eventBudgetItems={appState.eventBudgetItems} raceEvents={appState.raceEvents} eventTransportLegs={appState.eventTransportLegs} eventChecklistItems={appState.eventChecklistItems} incomeItems={appState.incomeItems} riderEventSelections={appState.riderEventSelections} />}
                        {currentSection === 'events' && <EventsSection raceEvents={appState.raceEvents} setRaceEvents={createBatchSetHandler<RaceEvent>('raceEvents')} setEventDocuments={createBatchSetHandler<EventRaceDocument>('eventDocuments')} navigateToEventDetail={(eventId) => navigateTo('eventDetail', eventId)} eventTransportLegs={appState.eventTransportLegs} riderEventSelections={appState.riderEventSelections} deleteRaceEvent={(eventId) => onDeleteRaceEvent({ id: eventId } as RaceEvent)} riders={appState.riders} staff={appState.staff} teamLevel={appState.teamLevel} currentUser={currentUser} />}
                        {currentSection === 'roster' && <RosterSection riders={appState.riders} onSaveRider={onSaveRider} onDeleteRider={onDeleteRider} raceEvents={appState.raceEvents} setRaceEvents={createBatchSetHandler<RaceEvent>('raceEvents')} riderEventSelections={appState.riderEventSelections} setRiderEventSelections={createBatchSetHandler<RiderEventSelection>('riderEventSelections')} performanceEntries={appState.performanceEntries} scoutingProfiles={appState.scoutingProfiles} teamProducts={appState.teamProducts} currentUser={currentUser} appState={appState} />}
                        {currentSection === 'staff' && <StaffSection staff={appState.staff} setStaff={createBatchSetHandler<StaffMember>('staff')} raceEvents={appState.raceEvents} setRaceEvents={createBatchSetHandler<RaceEvent>('raceEvents')} eventStaffAvailabilities={appState.eventStaffAvailabilities} setEventStaffAvailabilities={createBatchSetHandler<EventStaffAvailability>('eventStaffAvailabilities')} eventBudgetItems={appState.eventBudgetItems} setEventBudgetItems={createBatchSetHandler<EventBudgetItem>('eventBudgetItems')} currentUser={currentUser} team={appState.teams.find(t => t.id === appState.activeTeamId)} performanceEntries={appState.performanceEntries} missions={appState.missions} teams={appState.teams} users={appState.users} setMissions={createBatchSetHandler<Mission>('missions')} />}
                        {currentSection === 'vehicles' && <VehiclesSection vehicles={appState.vehicles} setVehicles={createBatchSetHandler<Vehicle>('vehicles')} staff={appState.staff} eventTransportLegs={appState.eventTransportLegs} raceEvents={appState.raceEvents} navigateTo={navigateTo} />}
                        {currentSection === 'equipment' && <EquipmentSection equipment={appState.equipment} setEquipment={createBatchSetHandler<EquipmentItem>('equipment')} riders={appState.riders} setRiders={createBatchSetHandler<Rider>('riders')} currentUser={currentUser} equipmentStockItems={appState.equipmentStockItems} setEquipmentStockItems={createBatchSetHandler<EquipmentStockItem>('equipmentStockItems')} />}
                        {currentSection === 'stocks' && <StocksSection stockItems={appState.stockItems} setStockItems={createBatchSetHandler<StockItem>('stockItems')} staff={appState.staff} />}
                        {currentSection === 'financial' && <FinancialSection appState={appState} setIncomeItems={createBatchSetHandler<IncomeItem>('incomeItems')} setCategoryBudgets={() => {}} navigateTo={navigateTo} />}
                        {currentSection === 'performance' && <PerformancePoleSection appState={appState} navigateTo={navigateTo} setTeamProducts={createBatchSetHandler<TeamProduct>('teamProducts')} setRiders={createBatchSetHandler<Rider>('riders')} currentUser={currentUser}/>}
                        {currentSection === 'scouting' && <ScoutingSection scoutingProfiles={appState.scoutingProfiles} setScoutingProfiles={createBatchSetHandler<ScoutingProfile>('scoutingProfiles')} setRiders={createBatchSetHandler<Rider>('riders')} users={appState.users} onSendScoutingRequest={()=>{}} appState={appState} currentTeamId={appState.activeTeamId} />}
                        {currentSection === 'settings' && <SettingsSection team={appState.teams.find(t=>t.id===appState.activeTeamId)} onUpdateTeam={() => {}} teamLevel={appState.teamLevel} setThemePrimaryColor={() => {}} setThemeAccentColor={()=>{}} setTeamLevel={()=>{}} language={language} setLanguage={(lang) => { if (lang) setLanguageState(lang); }} setTeamLogoBase64={() => {}} setTeamLogoMimeType={() => {}} />}
                        {currentSection === 'userManagement' && <UserManagementSection appState={appState} currentTeamId={appState.activeTeamId} onApprove={()=>{}} onDeny={()=>{}} onInvite={()=>{}} onRemove={()=>{}} onUpdateRole={()=>{}} onUpdatePermissionRole={()=>{}} onUpdateUserCustomPermissions={()=>{}} onTransferUser={()=>{}}/>}
                        {currentSection === 'permissions' && <PermissionsSection permissions={appState.permissions} setPermissions={()=>{}} permissionRoles={appState.permissionRoles} setPermissionRoles={()=>{}} users={appState.users} />}
                        {currentSection === 'checklist' && <ChecklistSection checklistTemplates={appState.checklistTemplates} setChecklistTemplates={() => {}} currentUser={currentUser}/>}
                        {currentSection === 'career' && <CareerSection riders={appState.riders} staff={appState.staff} currentUser={currentUser} setRiders={createBatchSetHandler<Rider>('riders')} setStaff={createBatchSetHandler<StaffMember>('staff')} teams={appState.teams} currentTeamId={appState.activeTeamId} onRequestTransfer={()=>{}} scoutingRequests={appState.scoutingRequests} onRespondToScoutingRequest={()=>{}} onUpdateVisibility={()=>{}}/>}
                        {currentSection === 'nutrition' && <NutritionSection rider={appState.riders.find(r => r.email === currentUser.email)} setRiders={createBatchSetHandler<Rider>('riders')} teamProducts={appState.teamProducts} setTeamProducts={createBatchSetHandler<TeamProduct>('teamProducts')} />}
                        {currentSection === 'riderEquipment' && <RiderEquipmentSection riders={appState.riders} equipment={appState.equipment} currentUser={currentUser} setRiders={createBatchSetHandler<Rider>('riders')} />}
                        {currentSection === 'adminDossier' && <AdminDossierSection riders={appState.riders} staff={appState.staff} currentUser={currentUser} setRiders={createBatchSetHandler<Rider>('riders')} setStaff={createBatchSetHandler<StaffMember>('staff')}/>}
                        {currentSection === 'myTrips' && <MyTripsSection riders={appState.riders} staff={appState.staff} eventTransportLegs={appState.eventTransportLegs} raceEvents={appState.raceEvents} currentUser={currentUser} />}
                        {currentSection === 'myPerformance' && riderForCurrentUser && <MyPerformanceSection rider={riderForCurrentUser} setRiders={createBatchSetHandler<Rider>('riders')} />}
                        {currentSection === 'missionSearch' && <MissionSearchSection missions={appState.missions} teams={appState.teams} currentUser={currentUser} setMissions={createBatchSetHandler<Mission>('missions')} />}
                        {currentSection === 'automatedPerformanceProfile' && riderForCurrentUser && <AutomatedPerformanceProfileSection rider={riderForCurrentUser}/>}
                        {currentSection === 'performanceProject' && riderForCurrentUser && <PerformanceProjectSection rider={riderForCurrentUser} setRiders={createBatchSetHandler<Rider>('riders')}/>}
                    </>
                )}
            </main>
         </div>
        </LanguageProvider>
       );
    }
    return null; // Should not be reached if logic is correct
  };

  const riderForCurrentUser = appState.riders.find(r => r.email === currentUser?.email);

  return <>{renderContent()}</>;
};

export default App;