import React, { useState, useMemo } from 'react';
import { RaceEvent, EventTransportLeg, RiderEventSelection, RiderEventStatus, Rider, StaffMember, TransportStop, MealDay, TeamLevel, Discipline, EventType, TransportDirection, EventBudgetItem, BudgetItemCategory, User, TeamRole, EventRaceDocument, DocumentStatus, StaffRole } from '../types';
import { emptyRaceInformation, EVENT_TYPE_COLORS, ELIGIBLE_CATEGORIES_CONFIG } from '../constants'; 
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import ListBulletIcon from '../components/icons/ListBulletIcon';
import TrashIcon from '../components/icons/TrashIcon';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';
import CakeIcon from '../components/icons/CakeIcon'; // Added for birthday indicators
import { useTranslations } from '../hooks/useTranslations';
import { jsPDF } from 'jspdf';

interface EventsSectionProps {
  raceEvents: RaceEvent[];
  setRaceEvents: React.Dispatch<React.SetStateAction<RaceEvent[]>>;
  setEventDocuments: React.Dispatch<React.SetStateAction<EventRaceDocument[]>>;
  navigateToEventDetail: (eventId: string) => void;
  eventTransportLegs: EventTransportLeg[];
  riderEventSelections: RiderEventSelection[]; // Added for filtering
  deleteRaceEvent: (eventId: string) => void;
  // Added for birthday indicators
  riders: Rider[];
  staff: StaffMember[];
  teamLevel?: TeamLevel;
  currentUser: User;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const initialEventFormState: Omit<RaceEvent, 'id' | 'raceInfo' | 'operationalLogistics' | 'selectedRiderIds' | 'selectedStaffIds' | 'selectedVehicleIds' | 'checklistEmailSimulated'> = {
  name: '',
  date: new Date().toISOString().split('T')[0],
  location: '',
  eventType: EventType.COMPETITION,
  eligibleCategory: '',
  discipline: Discipline.ROUTE,
};

// Helper to check for transport legs
const hasTransportLeg = (
  eventId: string,
  direction: TransportDirection,
  allTransportLegs: EventTransportLeg[]
): boolean => {
  return allTransportLegs.some(leg => leg.eventId === eventId && leg.direction === direction);
};

interface EventDisplayInfo extends RaceEvent {
  showDepartureIndicator?: boolean;
  showReturnIndicator?: boolean;
  isDepartureDay?: boolean;
}

const getEventDisplayInfoForDay = (
  date: Date,
  allRaceEvents: RaceEvent[],
  allTransportLegs: EventTransportLeg[]
): Array<EventDisplayInfo> => {
    const eventsForDay = new Map<string, EventDisplayInfo>();
    const currentDateMidnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0));
    const currentDateStr = currentDateMidnight.toISOString().split('T')[0];

    // 1. Add ongoing events
    allRaceEvents.forEach(event => {
        const eventStartDate = new Date(event.date + "T12:00:00Z");
        const eventEndDate = event.endDate ? new Date(event.endDate + "T23:59:59Z") : eventStartDate;
        if (currentDateMidnight >= eventStartDate && currentDateMidnight <= eventEndDate) {
            eventsForDay.set(event.id, { ...event });
        }
    });

    // 2. Add events with departures on this day
    allTransportLegs.forEach(leg => {
        if (leg.direction === TransportDirection.ALLER && leg.departureDate === currentDateStr) {
            const event = allRaceEvents.find(e => e.id === leg.eventId);
            if (event && !eventsForDay.has(event.id)) { // Add only if not already present
                eventsForDay.set(event.id, { ...event, isDepartureDay: true });
            }
        }
    });

    // 3. Set indicators for all events on the list
    return Array.from(eventsForDay.values()).map(event => {
        const eventStartDate = new Date(event.date + "T12:00:00Z");
        const eventEndDate = event.endDate ? new Date(event.endDate + "T23:59:59Z") : eventStartDate;
        const isStartDay = currentDateMidnight.getTime() === eventStartDate.getTime();
        const isEndDay = currentDateMidnight.getTime() === eventEndDate.getTime();
        
        return {
            ...event,
            showDepartureIndicator: event.isDepartureDay || (isStartDay && hasTransportLeg(event.id, TransportDirection.ALLER, allTransportLegs)),
            showReturnIndicator: isEndDay && hasTransportLeg(event.id, TransportDirection.RETOUR, allTransportLegs),
        };
    }).sort((a,b) => a.name.localeCompare(b.name));
};

const getCategoryLabel = (id: string = ''): string => {
    const category = ELIGIBLE_CATEGORIES_CONFIG.flatMap(g => g.categories).find(cat => cat.id === id);
    return category ? category.label : id;
};

const parseTimeForSorting = (timeStr: string): number => {
    if (!timeStr) return 9999; // Put empty times at the end
    const cleanedTime = timeStr.trim().split('-')[0].trim();
    const parts = cleanedTime.replace('h', ':').split(':');
    
    if (parts.length > 0) {
        const hours = parseInt(parts[0], 10);
        const minutes = (parts.length > 1 && parts[1]) ? parseInt(parts[1], 10) : 0;
        
        if (!isNaN(hours) && !isNaN(minutes)) {
            return hours * 60 + minutes;
        }
    }
    return 9999;
};


export const EventsSection = ({ 
    raceEvents, 
    setRaceEvents, 
    setEventDocuments,
    navigateToEventDetail, 
    eventTransportLegs,
    riderEventSelections,
    deleteRaceEvent,
    riders,
    staff,
    teamLevel,
    currentUser,
}: EventsSectionProps): JSX.Element => {
  const { t } = useTranslations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEventForModal, setCurrentEventForModal] = useState<Omit<RaceEvent, 'id' | 'raceInfo' | 'operationalLogistics' | 'selectedRiderIds' | 'selectedStaffIds' | 'selectedVehicleIds' | 'checklistEmailSimulated'> & { eligibleCategory: string; discipline: Discipline; endDate?: string }>(
    { ...initialEventFormState, eligibleCategory: '', discipline: Discipline.ROUTE }
  );
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [displayDate, setDisplayDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showAllEvents, setShowAllEvents] = useState(false);

  // NOTE: Filtering by team level has been removed as per last valid user request to simplify event creation
  const filteredRaceEvents = raceEvents; 

  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentEventForModal(prev => ({ ...prev, [name]: name === 'endDate' && value === '' ? undefined : value }));
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditingModal && editingEventId) {
        const updatedEvent: RaceEvent = {
            ...(raceEvents.find(ev => ev.id === editingEventId) as RaceEvent), 
            name: currentEventForModal.name,
            date: currentEventForModal.date,
            endDate: currentEventForModal.endDate || currentEventForModal.date, 
            location: currentEventForModal.location,
            eventType: currentEventForModal.eventType,
            eligibleCategory: currentEventForModal.eligibleCategory,
            discipline: currentEventForModal.discipline,
        };
        setRaceEvents(prevEvents => prevEvents.map(ev => ev.id === editingEventId ? updatedEvent : ev));
        navigateToEventDetail(editingEventId);
    } else {
        const newEvent: RaceEvent = {
            name: currentEventForModal.name,
            date: currentEventForModal.date,
            endDate: currentEventForModal.endDate || currentEventForModal.date,
            location: currentEventForModal.location,
            eventType: currentEventForModal.eventType,
            eligibleCategory: currentEventForModal.eligibleCategory,
            discipline: currentEventForModal.discipline,
            id: generateId(),
            raceInfo: { ...emptyRaceInformation },
            operationalLogistics: [],
            selectedRiderIds: [],
            selectedStaffIds: [],
            selectedVehicleIds: [],
            checklistEmailSimulated: false,
        };
        setRaceEvents(prevEvents => [...prevEvents, newEvent]);
        
        // Generate PDF Roadbook
        const doc = new jsPDF();
        
        // Page 1: Riders
        doc.setFontSize(22);
        doc.text(`Roadbook - ${newEvent.name}`, 105, 20, { align: 'center' });
        doc.setFontSize(16);
        doc.text('Page Coureurs', 105, 30, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text('Date:', 20, 40);
        doc.text(new Date(newEvent.date + 'T12:00:00Z').toLocaleDateString('fr-FR'), 40, 40);
        doc.text('Lieu:', 20, 50);
        doc.text(newEvent.location, 40, 50);

        doc.text('Équipe sélectionnée:', 20, 60);
        doc.text('[Liste des coureurs à compléter]', 25, 67);

        doc.text('Staff:', 20, 80);
        doc.text('[Liste du staff à compléter]', 25, 87);

        doc.text('Timing clé:', 20, 100);
        doc.text('[Horaires à compléter]', 25, 107);
        
        doc.text('Hébergement:', 20, 120);
        doc.text('[Adresse de l\'hôtel à compléter]', 25, 127);

        // Page 2: Staff
        doc.addPage();
        doc.setFontSize(22);
        doc.text(`Roadbook - ${newEvent.name}`, 105, 20, { align: 'center' });
        doc.setFontSize(16);
        doc.text('Page Staff', 105, 30, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text('Fréquence Radio:', 20, 40);
        doc.text('[À compléter]', 60, 40);

        doc.text('Contacts Organisation:', 20, 50);
        doc.text('[À compléter]', 65, 50);

        doc.text('Véhicules:', 20, 60);
        doc.text('[Liste des véhicules et chauffeurs à compléter]', 25, 67);
        
        const roadbookPdfDataUri = doc.output('datauristring');

        const newRoadbookDocument: EventRaceDocument = {
          id: generateId(),
          eventId: newEvent.id,
          name: `Roadbook - ${newEvent.name}`,
          status: DocumentStatus.EN_COURS,
          fileLinkOrPath: roadbookPdfDataUri,
          notes: 'Généré automatiquement à la création de l\'événement.',
        };
        
        // Generate PDF Licenses
        const licenseDoc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const keyStaffIds = new Set<string>();
        (newEvent.directeurSportifId || []).forEach(id => keyStaffIds.add(id));
        (newEvent.assistantId || []).forEach(id => keyStaffIds.add(id));
        (newEvent.mecanoId || []).forEach(id => keyStaffIds.add(id));

        const selectedKeyStaff = staff.filter(s => keyStaffIds.has(s.id));
        const selectedRiders = riders.filter(r => newEvent.selectedRiderIds.includes(r.id));

        const allParticipants = [...selectedRiders, ...selectedKeyStaff];

        let x = 15;
        let y = 20;
        const licenseWidth = 85.6;
        const licenseHeight = 53.98;
        const pageMargin = 15;
        const xMargin = 10;
        const yMargin = 15;

        licenseDoc.setFontSize(16);
        licenseDoc.text(`Licences - ${newEvent.name}`, 105, 15, { align: 'center' });

        allParticipants.forEach((person) => {
            licenseDoc.setFontSize(10);
            const personType = 'licenseNumber' in person ? 'Coureur' : (person as StaffMember).role;
            licenseDoc.text(`${person.firstName} ${person.lastName} (${personType})`, x, y - 2);

            if (person.licenseImageBase64 && person.licenseImageMimeType) {
                try {
                    const extension = person.licenseImageMimeType.split('/')[1] || 'jpeg';
                    licenseDoc.addImage(`data:${person.licenseImageMimeType};base64,${person.licenseImageBase64}`, extension.toUpperCase(), x, y, licenseWidth, licenseHeight);
                } catch (e) {
                    console.error(`Error adding image for ${person.firstName} ${person.lastName}:`, e);
                    licenseDoc.rect(x, y, licenseWidth, licenseHeight, 'S');
                    licenseDoc.text('Erreur image', x + licenseWidth / 2, y + licenseHeight / 2, { align: 'center' });
                }
            } else {
                licenseDoc.rect(x, y, licenseWidth, licenseHeight, 'S');
                licenseDoc.text('Licence manquante', x + licenseWidth / 2, y + licenseHeight / 2, { align: 'center' });
            }
            
            x += licenseWidth + xMargin;
            if (x + licenseWidth > 210) { // page width is 210mm
                x = pageMargin;
                y += licenseHeight + yMargin;
                if (y + licenseHeight > 297) { // page height is 297mm
                    licenseDoc.addPage();
                    licenseDoc.setFontSize(16);
                    licenseDoc.text(`Licences - ${newEvent.name} (suite)`, 105, 15, { align: 'center' });
                    y = 20;
                }
            }
        });

        const licensesPdfDataUri = licenseDoc.output('datauristring');
        const newLicensesDocument: EventRaceDocument = {
            id: generateId(),
            eventId: newEvent.id,
            name: `Licences - ${newEvent.name}`,
            status: DocumentStatus.FAIT,
            fileLinkOrPath: licensesPdfDataUri,
            notes: 'Généré automatiquement à la création de l\'événement.',
        };

        setEventDocuments(prevDocs => [...prevDocs, newRoadbookDocument, newLicensesDocument]);

        navigateToEventDetail(newEvent.id);
    }
    setIsModalOpen(false);
    setCurrentEventForModal({ ...initialEventFormState, eligibleCategory: '', discipline: Discipline.ROUTE });
    setIsEditingModal(false);
    setEditingEventId(null);
  };
  
  const openAddModal = (dateForNewEvent?: string) => {
    setCurrentEventForModal({ 
        ...initialEventFormState, 
        date: dateForNewEvent || new Date().toISOString().split('T')[0],
        endDate: dateForNewEvent || new Date().toISOString().split('T')[0],
        eligibleCategory: '',
        discipline: Discipline.ROUTE,
    });
    setIsEditingModal(false);
    setEditingEventId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (event: RaceEvent) => {
    setCurrentEventForModal({
        name: event.name,
        date: event.date,
        endDate: event.endDate || event.date,
        location: event.location,
        eventType: event.eventType,
        eligibleCategory: event.eligibleCategory,
        discipline: event.discipline,
    });
    setIsEditingModal(true);
    setEditingEventId(event.id);
    setIsModalOpen(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (!(e.currentTarget instanceof HTMLElement)) return;
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-200', 'border-blue-400');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!(e.currentTarget instanceof HTMLElement)) return;
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-200', 'border-blue-400');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!(e.currentTarget instanceof HTMLElement)) return;
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-200', 'border-blue-400');
    const eventId = e.dataTransfer.getData('text/plain');
    const newDateStr = e.currentTarget.getAttribute('data-date');
    if (!eventId || !newDateStr) return;

    setRaceEvents(prevEvents => prevEvents.map(ev => {
        if (ev.id === eventId) {
            const originalDate = new Date(ev.date + "T12:00:00Z");
            const newDate = new Date(newDateStr + "T12:00:00Z");
            
            let newEndDate: string | undefined = undefined;
            if (ev.endDate) {
                const diffTime = Math.abs(new Date(ev.endDate).getTime() - originalDate.getTime());
                const newEndDateObj = new Date(newDate.getTime() + diffTime);
                newEndDate = newEndDateObj.toISOString().split('T')[0];
            } else {
                newEndDate = newDateStr;
            }
            
            return { ...ev, date: newDateStr, endDate: newEndDate };
        }
        return ev;
    }));
  };

  const month = displayDate.getMonth();
  const year = displayDate.getFullYear();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  return (
    <SectionWrapper
      title="Calendrier des Événements"
      actionButton={<ActionButton onClick={() => openAddModal()} icon={<PlusCircleIcon className="w-5 h-5"/>}>Ajouter Événement</ActionButton>}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <ActionButton onClick={() => setDisplayDate(new Date(year, month - 1, 1))} variant="secondary" size="sm" icon={<ChevronLeftIcon className="w-4 h-4"/>} />
          <ActionButton onClick={() => setDisplayDate(new Date(year, month + 1, 1))} variant="secondary" size="sm" icon={<ChevronRightIcon className="w-4 h-4"/>} />
          <h3 className="text-xl font-semibold text-gray-800 w-48 text-center">
            {displayDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <input type="checkbox" id="show-all-events" checked={showAllEvents} onChange={(e) => setShowAllEvents(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <label htmlFor="show-all-events" className="text-sm text-gray-600">Afficher toutes les courses</label>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600 border-b pb-2 mb-1">
        {daysOfWeek.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: adjustedFirstDay }).map((_, i) => <div key={`empty-start-${i}`} className="h-32 bg-gray-100 rounded-md border"></div>)}
        {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
          const dayNumber = dayIndex + 1;
          const currentDate = new Date(Date.UTC(year, month, dayNumber));
          const currentDateStr = currentDate.toISOString().split('T')[0];
          
          const today = new Date();
          const isToday = today.getUTCFullYear() === year && 
                          today.getUTCMonth() === month &&
                          today.getUTCDate() === dayNumber;
          
          const eventsForDay = getEventDisplayInfoForDay(currentDate, filteredRaceEvents, eventTransportLegs);
          const birthdaysForDay = [...riders, ...staff].filter(p => p.birthDate && p.birthDate.substring(5) === currentDateStr.substring(5));

          return (
            <div
              key={dayNumber}
              className={`h-32 border rounded-md p-1 overflow-y-auto text-xs relative ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
              onClick={() => openAddModal(currentDateStr)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              data-date={currentDateStr}
            >
              <span className={`font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{dayNumber}</span>
              <div className="mt-1 space-y-0.5">
                {eventsForDay.map(event => (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', event.id)}
                    onClick={(e) => { e.stopPropagation(); navigateToEventDetail(event.id); }}
                    className={`p-1 rounded text-[10px] leading-tight cursor-pointer hover:opacity-80 ${EVENT_TYPE_COLORS[event.eventType]}`}
                  >
                    <span className="font-medium">{event.name}</span>
                  </div>
                ))}
                 {birthdaysForDay.map(person => (
                   <div key={person.id} className="p-1 rounded text-[10px] bg-pink-100 text-pink-800 flex items-center">
                     <CakeIcon className="w-3 h-3 mr-1"/> {person.firstName} {person.lastName}
                   </div>
                 ))}
              </div>
            </div>
          );
        })}
        {Array.from({ length: (7 - (adjustedFirstDay + daysInMonth) % 7) % 7 }).map((_, i) => <div key={`empty-end-${i}`} className="h-32 bg-gray-100 rounded-md border"></div>)}
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditingModal ? "Modifier Événement" : "Nouvel Événement"}>
        <form onSubmit={handleEventSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom de l'événement</label>
            <input type="text" name="name" id="name" value={currentEventForModal.name} onChange={handleModalInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 placeholder-gray-500"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date de début</label>
              <input type="date" name="date" id="date" value={currentEventForModal.date} onChange={handleModalInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"/>
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Date de fin (si étape)</label>
              <input type="date" name="endDate" id="endDate" value={currentEventForModal.endDate || ''} onChange={handleModalInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"/>
            </div>
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Lieu</label>
            <input type="text" name="location" id="location" value={currentEventForModal.location} onChange={handleModalInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">Type</label>
              <select name="eventType" id="eventType" value={currentEventForModal.eventType} onChange={handleModalInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white text-gray-900">
                {Object.values(EventType).map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="discipline" className="block text-sm font-medium text-gray-700">Discipline</label>
              <select name="discipline" id="discipline" value={currentEventForModal.discipline} onChange={handleModalInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white text-gray-900">
                {Object.values(Discipline).filter(d => d !== Discipline.TOUS).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="eligibleCategory" className="block text-sm font-medium text-gray-700">Catégorie de l'épreuve</label>
            <input 
              type="text" 
              name="eligibleCategory" 
              id="eligibleCategory" 
              value={currentEventForModal.eligibleCategory} 
              onChange={handleModalInputChange} 
              required 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 placeholder-gray-500"
              placeholder="Ex: Elite Nationale, UCI 1.1, etc."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <ActionButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</ActionButton>
            <ActionButton type="submit">{isEditingModal ? "Sauvegarder" : "Créer"}</ActionButton>
          </div>
        </form>
      </Modal>
    </SectionWrapper>
  );
};