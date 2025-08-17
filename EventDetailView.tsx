import React, { useState, useEffect } from 'react';
import { 
  AppState, 
  RaceEvent, 
  EventTransportLeg, EventAccommodation, EventRaceDocument, 
  EventRadioEquipment, EventRadioAssignment, 
  EventBudgetItem, EventChecklistItem, PerformanceEntry as AppPerformanceEntry, AppSection, User, TeamState, GlobalState, PeerRating
} from './types'; 
import ActionButton from './components/ActionButton'; 
import CalendarDaysIcon from './components/icons/CalendarDaysIcon'; 
import HomeIcon from './components/icons/HomeIcon'; 
import TrashIcon from './components/icons/TrashIcon';
import ConfirmationModal from './components/ConfirmationModal';

// Import tab components
import EventInfoTab from './sections/eventDetailTabs/EventInfoTab'; 
import EventParticipantsTab from './sections/eventDetailTabs/EventParticipantsTab'; 
import EventOperationalLogisticsTab from './sections/eventDetailTabs/EventOperationalLogisticsTab'; 
import { EventTransportTab } from './sections/eventDetailTabs/EventTransportTab'; 
import EventAccommodationTab from './sections/eventDetailTabs/EventAccommodationTab'; 
import EventDocumentsTab from './sections/eventDetailTabs/EventDocumentsTab'; 
import EventBudgetTab from './sections/eventDetailTabs/EventBudgetTab'; 
import EventChecklistTab from './sections/eventDetailTabs/EventChecklistTab'; 
import { EventPerformanceTab } from './sections/eventDetailTabs/EventPerformanceTab'; 
import LogisticsSummaryTab from './sections/eventDetailTabs/LogisticsSummaryTab';
import PeerReviewTab from './sections/eventDetailTabs/PeerReviewTab';
import { useTranslations } from './hooks/useTranslations';


interface EventDetailViewProps {
  event: RaceEvent; 
  eventId: string;
  appState: AppState; // Subcomponents need access to the full AppState
  navigateTo: (section: AppSection, eventId?: string) => void; 
  deleteRaceEvent: (eventId: string) => void;
  currentUser: User;
  
  // Setters for team state slices
  setRaceEvents: React.Dispatch<React.SetStateAction<RaceEvent[]>>;
  setEventTransportLegs: React.Dispatch<React.SetStateAction<EventTransportLeg[]>>;
  setEventAccommodations: React.Dispatch<React.SetStateAction<EventAccommodation[]>>;
  setEventDocuments: React.Dispatch<React.SetStateAction<EventRaceDocument[]>>;
  setEventRadioEquipments: React.Dispatch<React.SetStateAction<EventRadioEquipment[]>>;
  setEventRadioAssignments: React.Dispatch<React.SetStateAction<EventRadioAssignment[]>>;
  setEventBudgetItems: React.Dispatch<React.SetStateAction<EventBudgetItem[]>>;
  setEventChecklistItems: React.Dispatch<React.SetStateAction<EventChecklistItem[]>>;
  setPerformanceEntries: React.Dispatch<React.SetStateAction<AppPerformanceEntry[]>>;
  setPeerRatings: React.Dispatch<React.SetStateAction<PeerRating[]>>;
}

type EventDetailTab = 
  | 'logisticsSummary'
  | 'info' | 'participants' | 'opLogistics' | 'transport' | 'accommodation' 
  | 'documents' 
  | 'budget' 
  | 'checklist' 
  | 'peerReview'
  | 'performance';

function EventDetailView({ 
  event: initialEvent, 
  eventId, 
  appState, 
  navigateTo, 
  deleteRaceEvent, 
  currentUser,
  setRaceEvents,
  setEventTransportLegs,
  setEventAccommodations,
  setEventDocuments,
  setEventRadioEquipments,
  setEventRadioAssignments,
  setEventBudgetItems,
  setEventChecklistItems,
  setPerformanceEntries,
  setPeerRatings,
}: EventDetailViewProps) {
  const [activeTab, setActiveTab] = useState<EventDetailTab>('logisticsSummary');
  const [currentEvent, setCurrentEvent] = useState<RaceEvent>(initialEvent);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const { t } = useTranslations();

  useEffect(() => {
    const foundEvent = appState.raceEvents.find(e => e.id === eventId);
    if (foundEvent) {
      setCurrentEvent(foundEvent);
    } else {
      // If the event is not found (e.g., deleted), navigate back to the events list.
      navigateTo('events');
    }
  }, [eventId, appState.raceEvents, navigateTo]);


  const updateEventDetails = (updatedEventData: Partial<RaceEvent>) => {
    setRaceEvents(prevEvents => prevEvents.map(e => e.id === eventId ? { ...e, ...updatedEventData } : e));
  };
  
  const updateRadioEquipment = (equipmentOrUpdater: EventRadioEquipment | ((prev: EventRadioEquipment | undefined) => EventRadioEquipment)) => {
    setEventRadioEquipments(prevEquipments => {
        const existingForEvent = prevEquipments.find(eq => eq.eventId === eventId);
        
        const newOrUpdatedEquipment: EventRadioEquipment = typeof equipmentOrUpdater === 'function' 
            ? equipmentOrUpdater(existingForEvent) 
            : equipmentOrUpdater;

        if (existingForEvent) {
            return prevEquipments.map(eq => eq.eventId === eventId ? newOrUpdatedEquipment : eq);
        } else {
            return [...prevEquipments, newOrUpdatedEquipment];
        }
    });
  };

  const updatePerformanceEntry = (entryOrUpdater: AppPerformanceEntry | ((prev: AppPerformanceEntry | undefined) => AppPerformanceEntry)) => {
    setPerformanceEntries(prevEntries => {
      const entryIndex = prevEntries.findIndex(p => p.eventId === eventId);
      const newEntries = [...prevEntries];
      if (typeof entryOrUpdater === 'function') {
        const existingEntry = entryIndex > -1 ? newEntries[entryIndex] : undefined;
        const newEntry = entryOrUpdater(existingEntry);
        if (entryIndex > -1) {
          newEntries[entryIndex] = newEntry;
        } else {
          newEntries.push(newEntry);
        }
      } else {
        if (entryIndex > -1) {
          newEntries[entryIndex] = entryOrUpdater;
        } else {
          newEntries.push(entryOrUpdater);
        }
      }
      return newEntries;
    });
  };

  if (!currentEvent) {
    return (
      <div className="p-4 text-center text-gray-600">
        {t('loading')}
         <ActionButton onClick={() => navigateTo('events')} className="mt-4">
          Retour à la liste des événements
        </ActionButton>
      </div>
    );
  }

  const tabs: { id: EventDetailTab; label: string; Icon?: React.ElementType }[] = [
    { id: 'logisticsSummary', label: t('eventTabLogisticsSummary') },
    { id: 'info', label: t('eventTabInfo') }, 
    { id: 'participants', label: t('eventTabParticipants') },
    { id: 'opLogistics', label: t('eventTabOpLogistics') },
    { id: 'transport', label: t('eventTabTransport') },
    { id: 'accommodation', label: t('eventTabAccommodation') },
    { id: 'documents', label: t('eventTabDocuments') },
    { id: 'budget', label: t('eventTabBudget') },
    { id: 'checklist', label: t('eventTabChecklist') },
    { id: 'peerReview', label: t('eventTabPeerReview') },
    { id: 'performance', label: t('eventTabPerformance') },
  ];
  
  const eventDetailProps = {
    event: currentEvent,
    eventId,
    appState: appState,
    updateEvent: updateEventDetails
  };

  return (
    <div className="bg-gray-50 p-2 sm:p-4 rounded-lg shadow-md min-h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b">
        <div className="mb-2 sm:mb-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 flex items-center">
            <CalendarDaysIcon className="w-8 h-8 mr-3 text-blue-600"/>
            {currentEvent.name}
            </h2>
            <p className="text-sm text-gray-600 ml-11">{new Date(currentEvent.date + 'T12:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {currentEvent.location}</p>
        </div>
        <ActionButton onClick={() => navigateTo('events')} icon={<HomeIcon className="w-4 h-4"/>} variant="secondary" size="sm">
          Retour aux Événements
        </ActionButton>
      </div>

      <div className="mb-6 overflow-x-auto">
        <nav className="flex space-x-1 border-b border-gray-300 whitespace-nowrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 font-medium text-sm rounded-t-md focus:outline-none transition-colors duration-150
                ${activeTab === tab.id 
                  ? 'border-blue-600 border-b-2 text-blue-600 bg-white' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white p-4 rounded-b-md shadow">
        <div style={{ display: activeTab === 'logisticsSummary' ? 'block' : 'none' }}>
            <LogisticsSummaryTab {...eventDetailProps} />
        </div>
         <div style={{ display: activeTab === 'info' ? 'block' : 'none' }}>
            <EventInfoTab 
                {...eventDetailProps}
                radioEquipment={appState.eventRadioEquipments.find(eq => eq.eventId === eventId)}
                setRadioEquipment={updateRadioEquipment}
                radioAssignments={appState.eventRadioAssignments.filter(as => as.eventId === eventId)}
                setRadioAssignments={setEventRadioAssignments}
            />
        </div>
        <div style={{ display: activeTab === 'participants' ? 'block' : 'none' }}>
            <EventParticipantsTab {...eventDetailProps} appState={appState} />
        </div>
        <div style={{ display: activeTab === 'opLogistics' ? 'block' : 'none' }}>
            <EventOperationalLogisticsTab {...eventDetailProps} />
        </div>
        <div style={{ display: activeTab === 'transport' ? 'block' : 'none' }}>
            <EventTransportTab 
                {...eventDetailProps}
                setEventTransportLegs={setEventTransportLegs}
                setEventBudgetItems={setEventBudgetItems}
            />
        </div>
        <div style={{ display: activeTab === 'accommodation' ? 'block' : 'none' }}>
            <EventAccommodationTab
                {...eventDetailProps}
                setEventAccommodations={setEventAccommodations}
                setEventBudgetItems={setEventBudgetItems}
            />
        </div>
        <div style={{ display: activeTab === 'documents' ? 'block' : 'none' }}>
            <EventDocumentsTab
                {...eventDetailProps}
                setEventDocuments={setEventDocuments}
            />
        </div>
        <div style={{ display: activeTab === 'budget' ? 'block' : 'none' }}>
            <EventBudgetTab 
                {...eventDetailProps}
                setEventBudgetItems={setEventBudgetItems}
            />
        </div>
        <div style={{ display: activeTab === 'checklist' ? 'block' : 'none' }}>
            <EventChecklistTab 
                {...eventDetailProps}
                setEventChecklistItems={setEventChecklistItems}
                currentUser={currentUser}
            />
        </div>
        <div style={{ display: activeTab === 'peerReview' ? 'block' : 'none' }}>
            <PeerReviewTab 
                {...eventDetailProps}
                setPeerRatings={setPeerRatings}
                currentUser={currentUser}
            />
        </div>
        <div style={{ display: activeTab === 'performance' ? 'block' : 'none' }}>
            <EventPerformanceTab 
                {...eventDetailProps}
                setPerformanceEntry={updatePerformanceEntry}
            />
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
        <ActionButton onClick={() => setIsConfirmDeleteOpen(true)} variant="danger" icon={<TrashIcon className="w-4 h-4"/>}>
          Supprimer cet Événement
        </ActionButton>
      </div>

       <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => deleteRaceEvent(eventId)}
        title="Supprimer l'Événement"
        message="Êtes-vous sûr de vouloir supprimer cet événement et toutes les données associées ? Cette action est irréversible."
      />
    </div>
  );
}

export default EventDetailView;