
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Rider, PowerProfile, RaceEvent, RiderEventSelection, PerformanceEntry, FavoriteRace, PerformanceFactorDetail, AllergyItem, PerformanceNutrition, RiderQualitativeProfile, PredefinedAllergen, DisciplinePracticed, Address, EventBudgetItem, TeamProduct, User, TeamRole, RiderEventStatus, EventType, FormeStatus, MoralStatus, HealthCondition, Discipline, BudgetItemCategory, ClothingType, PowerZoneKey, Sex, ScoutingProfile, TeamState, GlobalState, AppState } from '../types';
import { EVENT_TYPE_COLORS, RIDER_EVENT_STATUS_COLORS, PERFORMANCE_PROJECT_FACTORS_CONFIG, RIDER_QUALITATIVE_PROFILE_COLORS, POWER_PROFILE_REFERENCE_TABLES, RIDER_ALLERGY_SEVERITY_COLORS, POWER_ZONES_CONFIG, POWER_ZONE_COLORS, COGGAN_CATEGORY_COLORS, PREDEFINED_ALLERGEN_INFO, POWER_ANALYSIS_DURATIONS_CONFIG, RIDER_LEVEL_CATEGORIES, SPIDER_CHART_CHARACTERISTICS_CONFIG } from '../constants';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import { RiderDetailModal } from '../components/RiderDetailModal';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import UploadIcon from '../components/icons/UploadIcon';
import DocumentDuplicateIcon from '../components/icons/DocumentDuplicateIcon';
import ReplaceIcon from '../components/icons/ReplaceIcon'; 
import EyeIcon from '../components/icons/EyeIcon'; 
import BeakerIcon from '../components/icons/BeakerIcon';
import ExclamationCircleIcon from '../components/icons/ExclamationCircleIcon';
import InformationCircleIcon from '../components/icons/InformationCircleIcon';
import SearchIcon from '../components/icons/SearchIcon';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import MailIcon from '../components/icons/MailIcon';
import PhoneIcon from '../components/icons/PhoneIcon';
import ConfirmationModal from '../components/ConfirmationModal';
import { useTranslations } from '../hooks/useTranslations';
import CalendarIcon from '../components/icons/CalendarIcon';
import TableCellsIcon from '../components/icons/TableCellsIcon';


interface RosterSectionProps {
  riders: Rider[];
  onSaveRider: (rider: Rider) => void;
  onDeleteRider: (rider: Rider) => void;
  raceEvents: RaceEvent[];
  setRaceEvents: React.Dispatch<React.SetStateAction<RaceEvent[]>>; 
  riderEventSelections: RiderEventSelection[];
  setRiderEventSelections: React.Dispatch<React.SetStateAction<RiderEventSelection[]>>;
  performanceEntries: PerformanceEntry[];
  scoutingProfiles: ScoutingProfile[];
  teamProducts: TeamProduct[];
  currentUser: User;
  appState: AppState;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const getAgeCategory = (birthDate?: string): { category: string; age: number | null } => {
    if (!birthDate || typeof birthDate !== 'string') {
        return { category: 'N/A', age: null };
    }
    
    // Robust date parsing to avoid timezone issues.
    const parts = birthDate.split('-').map(p => parseInt(p, 10));
    if (parts.length !== 3 || parts.some(isNaN)) {
        return { category: 'N/A', age: null };
    }
    const [year, month, day] = parts;
    const birth = new Date(Date.UTC(year, month - 1, day));
    
    const today = new Date();
    const utcToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    
    let age = utcToday.getUTCFullYear() - birth.getUTCFullYear();
    const m = utcToday.getUTCMonth() - birth.getUTCMonth();
    if (m < 0 || (m === 0 && utcToday.getUTCDate() < birth.getUTCDate())) {
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

const calculateWkg = (power?: number, weight?: number): string => {
  if (typeof power === 'number' && typeof weight === 'number' && weight > 0) {
    return (power / weight).toFixed(1);
  }
  return "-";
};

type PowerProfileStateFilter = 'powerProfileFresh' | 'powerProfile15KJ' | 'powerProfile30KJ';

const profileKeyToDisplay: Record<PowerProfileStateFilter, string> = {
    powerProfileFresh: "Frais",
    powerProfile15KJ: "15 kJ/kg",
    powerProfile30KJ: "30 kJ/kg"
};

const getEventDuration = (event: RaceEvent): number => {
    if (!event.date) return 0;
    // Use Date.parse for robustness, then create UTC dates to avoid timezone issues.
    const startDateMs = Date.parse(event.date);
    const endDateMs = Date.parse(event.endDate || event.date);

    if (isNaN(startDateMs) || isNaN(endDateMs)) return 0;

    const startDate = new Date(startDateMs);
    const endDate = new Date(endDateMs);

    // Set to UTC midnight to compare dates only
    const startUtc = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    const endUtc = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());

    const diffTime = endUtc - startUtc;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays); // Ensure it's at least 1 day
};

interface SeasonPlanningTabProps {
    raceEvents: RaceEvent[];
    riders: Rider[];
    riderEventSelections: RiderEventSelection[];
    setRiderEventSelections: React.Dispatch<React.SetStateAction<RiderEventSelection[]>>;
    setRaceEvents: React.Dispatch<React.SetStateAction<RaceEvent[]>>;
}

const SeasonPlanningTab: React.FC<SeasonPlanningTabProps> = ({
    raceEvents,
    riders,
    riderEventSelections,
    setRiderEventSelections,
    setRaceEvents,
}) => {
    const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
    const [calendarDate, setCalendarDate] = useState(new Date());

    const futureEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return raceEvents
            .filter(event => new Date(event.endDate || event.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [raceEvents]);

    const raceDaysByRider = useMemo(() => {
        const raceDays: Record<string, number> = {};
        if (!riders || !riderEventSelections || !raceEvents) return raceDays;

        const eventDurations = new Map<string, number>();
        raceEvents.forEach(event => {
            eventDurations.set(event.id, getEventDuration(event));
        });

        riders.forEach(rider => {
            raceDays[rider.id] = 0;
        });

        riderEventSelections.forEach(selection => {
            if (selection.status === RiderEventStatus.TITULAIRE && raceDays.hasOwnProperty(selection.riderId)) {
                const duration = eventDurations.get(selection.eventId) || 0;
                raceDays[selection.riderId] += duration;
            }
        });

        return raceDays;
    }, [riders, riderEventSelections, raceEvents]);

    const handlePlanningGridSelectionChange = (riderId: string, eventId: string, newStatus: RiderEventStatus) => {
        setRiderEventSelections(prev => {
            const existingSelectionIndex = prev.findIndex(s => s.riderId === riderId && s.eventId === eventId);
            
            if (newStatus === RiderEventStatus.NON_RETENU) {
                if (existingSelectionIndex > -1) {
                    return prev.filter((_, index) => index !== existingSelectionIndex);
                }
                return prev;
            }

            if (existingSelectionIndex > -1) {
                const updatedSelections = [...prev];
                updatedSelections[existingSelectionIndex] = { ...updatedSelections[existingSelectionIndex], status: newStatus };
                return updatedSelections;
            } else {
                return [...prev, { id: generateId(), eventId, riderId, status: newStatus }];
            }
        });

        setRaceEvents(prev => prev.map(e => {
            if (e.id === eventId) {
                const isTitu = newStatus === RiderEventStatus.TITULAIRE;
                const isAlreadySelected = (e.selectedRiderIds || []).includes(riderId);
                if (isTitu && !isAlreadySelected) {
                    return { ...e, selectedRiderIds: [...(e.selectedRiderIds || []), riderId] };
                }
                if (!isTitu && isAlreadySelected) {
                    return { ...e, selectedRiderIds: (e.selectedRiderIds || []).filter(id => id !== riderId) };
                }
            }
            return e;
        }));
    };

    const renderGridView = () => (
        <div className="overflow-x-auto border rounded-lg" style={{ maxHeight: '70vh' }}>
            <table className="min-w-full border-collapse">
                <thead className="bg-gray-100 z-10" style={{ position: 'sticky', top: 0 }}>
                    <tr>
                        <th className="p-2 border text-sm font-semibold text-gray-600 w-48 z-20" style={{ position: 'sticky', left: 0, backgroundColor: 'inherit' }}>Coureur</th>
                        <th className="p-2 border text-sm font-semibold text-gray-600 w-28 z-20" style={{ position: 'sticky', left: '12rem', backgroundColor: 'inherit' }}>Jours Course</th>
                        {futureEvents.map(event => (
                            <th key={event.id} className="p-2 border text-xs font-semibold text-gray-600 min-w-[150px]">
                                <div className="font-bold">{event.name}</div>
                                <div className="font-normal">{new Date(event.date + 'T12:00:00Z').toLocaleDateString('fr-CA')}</div>
                                <div className="font-normal text-gray-500">({getEventDuration(event)}j)</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {riders.map(rider => (
                        <tr key={rider.id} className="hover:bg-gray-50">
                            <td className="p-2 border font-medium text-gray-800 w-48 z-10" style={{ position: 'sticky', left: 0, backgroundColor: 'inherit' }}>{rider.firstName} {rider.lastName}</td>
                            <td className="p-2 border font-bold text-center text-lg text-gray-800 w-28 z-10" style={{ position: 'sticky', left: '12rem', backgroundColor: 'inherit' }}>{raceDaysByRider[rider.id] || 0}</td>
                            {futureEvents.map(event => {
                                const selection = riderEventSelections.find(s => s.riderId === rider.id && s.eventId === event.id);
                                const status = selection?.status || RiderEventStatus.NON_RETENU;
                                return (
                                    <td key={event.id} className={`p-1 border text-center align-middle ${RIDER_EVENT_STATUS_COLORS[status].split(' ')[0]}`}>
                                        <select
                                            value={status}
                                            onChange={(e) => handlePlanningGridSelectionChange(rider.id, event.id, e.target.value as RiderEventStatus)}
                                            className={`w-full h-full text-center text-xs p-1 border-0 rounded appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-transparent ${RIDER_EVENT_STATUS_COLORS[status].split(' ')[1]}`}
                                        >
                                            {Object.values(RiderEventStatus).map(s => (
                                                <option key={s} value={s} style={{ backgroundColor: '#fff', color: '#000' }}>{s}</option>
                                            ))}
                                        </select>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderCalendarView = () => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthName = calendarDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

        const eventsForMonth = raceEvents.filter(event => {
            const start = new Date(event.date + "T12:00:00Z");
            const end = new Date((event.endDate || event.date) + "T12:00:00Z");
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59);
            return start <= monthEnd && end >= monthStart;
        });

        return (
            <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                    <ActionButton onClick={() => setCalendarDate(new Date(year, month - 1, 1))} size="sm">&lt; {new Date(year, month - 1, 1).toLocaleDateString('fr-FR', {month: 'long'})}</ActionButton>
                    <h4 className="text-lg font-semibold">{monthName}</h4>
                    <ActionButton onClick={() => setCalendarDate(new Date(year, month + 1, 1))} size="sm">{new Date(year, month + 1, 1).toLocaleDateString('fr-FR', {month: 'long'})} &gt;</ActionButton>
                </div>
                <div className="overflow-x-auto border rounded-lg bg-gray-50">
                    <div className="grid min-w-max" style={{ gridTemplateColumns: `150px 80px repeat(${daysInMonth}, minmax(35px, 1fr))` }}>
                        {/* Header */}
                        <div className="sticky left-0 bg-gray-100 z-30 p-2 border-b border-r font-semibold text-sm text-gray-700">Coureur</div>
                        <div className="sticky left-[150px] bg-gray-100 z-30 p-2 border-b border-r font-semibold text-sm text-gray-700">Jours</div>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                            <div key={day} className="text-center p-2 border-b border-r text-xs font-medium text-gray-500">{day}</div>
                        ))}
                        {/* Rider Rows */}
                        {riders.map(rider => (
                            <React.Fragment key={rider.id}>
                                <div className="sticky left-0 bg-white z-20 p-2 border-b border-r text-sm font-medium whitespace-nowrap">{rider.firstName} {rider.lastName}</div>
                                <div className="sticky left-[150px] bg-white z-20 p-2 border-b border-r text-sm font-bold text-center">{raceDaysByRider[rider.id] || 0}</div>
                                <div className="col-start-3 relative border-b" style={{ gridColumnEnd: daysInMonth + 3, display: 'grid', gridTemplateColumns: `repeat(${daysInMonth}, 1fr)`}}>
                                    {Array.from({ length: daysInMonth }).map((_, i) => <div key={i} className="border-r h-full"></div>)}
                                    {eventsForMonth.map(event => {
                                        const selection = riderEventSelections.find(s => s.riderId === rider.id && s.eventId === event.id);
                                        if (!selection || ![RiderEventStatus.TITULAIRE, RiderEventStatus.REMPLACANT, RiderEventStatus.PRE_SELECTION].includes(selection.status)) return null;

                                        const start = new Date(event.date + "T12:00:00Z");
                                        const end = new Date((event.endDate || event.date) + "T12:00:00Z");
                                        
                                        const startDay = start.getMonth() < month ? 1 : start.getDate();
                                        const endDay = end.getMonth() > month ? daysInMonth : end.getDate();
                                        
                                        const duration = endDay - startDay + 1;
                                        if (duration <= 0) return null;
                                        
                                        const color = event.eventType === EventType.COMPETITION ? 'bg-blue-600' : 'bg-yellow-500';
                                        const opacity = selection.status !== RiderEventStatus.TITULAIRE ? 'opacity-60' : '';

                                        return (
                                            <div
                                                key={event.id}
                                                className={`absolute h-5/6 my-auto inset-y-0 px-2 flex items-center text-xs text-white rounded overflow-hidden cursor-pointer ${color} ${opacity}`}
                                                style={{
                                                    gridColumnStart: startDay,
                                                    gridColumnEnd: `span ${duration}`,
                                                }}
                                                title={`${event.name}\n${start.toLocaleDateString()} - ${end.toLocaleDateString()}\nStatut: ${selection.status}`}
                                            >
                                                <span className="truncate">{event.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end items-center mt-2 text-sm space-x-4">
                    <div className="flex items-center"><span className="w-3 h-3 bg-blue-600 rounded-sm mr-1.5"></span>Compétition</div>
                    <div className="flex items-center"><span className="w-3 h-3 bg-yellow-500 rounded-sm mr-1.5"></span>Stage</div>
                    <div className="flex items-center"><span className="w-3 h-3 bg-gray-400 rounded-sm mr-1.5 opacity-60"></span>Non-Titulaire</div>
                </div>
            </div>
        );
    };
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Planning Prévisionnel de la Saison</h3>
                 <div className="flex items-center p-1 bg-gray-200 rounded-lg">
                    <ActionButton onClick={() => setViewMode('grid')} variant={viewMode === 'grid' ? 'primary' : 'secondary'} size="sm" className={viewMode === 'grid' ? 'shadow-md' : 'bg-transparent shadow-none'}>
                        <TableCellsIcon className="w-4 h-4" />
                        <span className="ml-2">Grille</span>
                    </ActionButton>
                    <ActionButton onClick={() => setViewMode('calendar')} variant={viewMode === 'calendar' ? 'primary' : 'secondary'} size="sm" className={viewMode === 'calendar' ? 'shadow-md' : 'bg-transparent shadow-none'}>
                        <CalendarIcon className="w-4 h-4" />
                         <span className="ml-2">Calendrier</span>
                    </ActionButton>
                </div>
            </div>
            {viewMode === 'grid' ? renderGridView() : renderCalendarView()}
        </div>
    );
};

export const RosterSection: React.FC<RosterSectionProps> = ({
  riders,
  onSaveRider,
  onDeleteRider,
  raceEvents,
  setRaceEvents,
  riderEventSelections,
  setRiderEventSelections,
  performanceEntries,
  scoutingProfiles,
  currentUser,
  appState
}) => {
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState<'roster' | 'selectionGrid' | 'groupMonitoring' | 'seasonPlanning'>('roster');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const [isNewRider, setIsNewRider] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | Sex>('all');
  const [ageCategoryFilter, setAgeCategoryFilter] = useState<'all' | string>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | string>('all');
  const [minAgeFilter, setMinAgeFilter] = useState<string>('');
  const [maxAgeFilter, setMaxAgeFilter] = useState<string>('');
  
  const [isSelectionGridEventModalOpen, setIsSelectionGridEventModalOpen] = useState(false);
  const [selectedEventForGrid, setSelectedEventForGrid] = useState<RaceEvent | null>(null);
  const [gridSelections, setGridSelections] = useState<RiderEventSelection[]>([]);

  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Group Monitoring States
  const [monitoringAgeFilter, setMonitoringAgeFilter] = useState('all');
  const [monitoringLevelFilter, setMonitoringLevelFilter] = useState('all');
  const [monitoringSortConfig, setMonitoringSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'charClimbing', direction: 'desc' });
  const [includeScouting, setIncludeScouting] = useState(false);

  const scheduleConflicts = useMemo(() => {
    const conflicts: Record<string, { eventName: string; status: RiderEventStatus }[]> = {};
    if (!riders || !riderEventSelections || !raceEvents) return conflicts;

    riders.forEach(rider => {
      const selections = riderEventSelections.filter(s => s.riderId === rider.id && s.status === RiderEventStatus.TITULAIRE);
      
      selections.forEach((selection, selIndex) => {
        const event = raceEvents.find(e => e.id === selection.eventId);
        if (!event) return;
        const eventStartDate = new Date(event.date + 'T00:00:00Z');
        const eventEndDate = new Date((event.endDate || event.date) + 'T23:59:59Z');

        for (let i = selIndex + 1; i < selections.length; i++) {
          const otherSelection = selections[i];
          const otherEvent = raceEvents.find(e => e.id === otherSelection.eventId);
          if (!otherEvent) continue;

          const otherStartDate = new Date(otherEvent.date + 'T00:00:00Z');
          const otherEndDate = new Date((otherEvent.endDate || otherEvent.date) + 'T23:59:59Z');

          if (eventStartDate <= otherEndDate && eventEndDate >= otherStartDate) {
            if (!conflicts[rider.id]) conflicts[rider.id] = [];
            
            if(!conflicts[rider.id].some(c => c.eventName === event.name)){
                 conflicts[rider.id].push({ eventName: event.name, status: selection.status });
            }
            if(!conflicts[rider.id].some(c => c.eventName === otherEvent.name)){
                conflicts[rider.id].push({ eventName: otherEvent.name, status: otherSelection.status });
            }
          }
        }
      });
    });
    return conflicts;
  }, [riders, riderEventSelections, raceEvents]);


  const filteredRidersForAdmin = useMemo(() => {
    return riders
      .filter(rider => {
        const { age, category } = getAgeCategory(rider.birthDate);
        const nameMatch = `${rider.firstName} ${rider.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
        const genderMatch = genderFilter === 'all' || rider.sex === genderFilter;
        const ageCategoryMatch = ageCategoryFilter === 'all' || category === ageCategoryFilter;
        const levelMatch = levelFilter === 'all' || (rider.categories && rider.categories.includes(levelFilter));
        
        const minAge = minAgeFilter ? parseInt(minAgeFilter, 10) : 0;
        const maxAge = maxAgeFilter ? parseInt(maxAgeFilter, 10) : 999;
        const ageRangeMatch = age === null || (age >= minAge && age <= maxAge);

        return nameMatch && genderMatch && ageCategoryMatch && levelMatch && ageRangeMatch;
      })
      .sort((a,b) => a.lastName.localeCompare(b.lastName));
  }, [riders, searchTerm, genderFilter, ageCategoryFilter, levelFilter, minAgeFilter, maxAgeFilter]);
  
  // --- Start of Group Monitoring Logic ---
  const requestMonitoringSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (monitoringSortConfig && monitoringSortConfig.key === key && monitoringSortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setMonitoringSortConfig({ key, direction });
  };
  
  const monitoringAllAgeCategoriesForFilter = useMemo(() => {
    const ageCats = new Set<string>();
    riders.forEach(r => {
        const { category } = getAgeCategory(r.birthDate);
        if (category !== 'N/A') ageCats.add(category);
    });
    const sortedAgeCats = Array.from(ageCats).sort((a, b) => {
        if (a === 'Senior') return 1;
        if (b === 'Senior') return -1;
        const aNum = parseInt(a.replace('U', ''), 10);
        const bNum = parseInt(b.replace('U', ''), 10);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return a.localeCompare(b);
    });
    return ['all', ...sortedAgeCats];
  }, [riders]);

  const monitoringAllLevelCategoriesForFilter = useMemo(() => {
    const levelCats = new Set<string>();
    riders.forEach(r => {
      (r.categories || []).forEach(cat => {
        if (RIDER_LEVEL_CATEGORIES.includes(cat) || cat === 'Handisport') {
            levelCats.add(cat);
        }
      })
    });
    return ['all', ...Array.from(levelCats).sort()];
  }, [riders]);

  type MonitoredPerson = (Rider | ScoutingProfile) & { isScout: boolean };
  const monitoredRiders = useMemo((): MonitoredPerson[] => {
    const combinedRiders: MonitoredPerson[] = [
        ...riders.map(r => ({ ...r, isScout: false })),
        ...(includeScouting ? scoutingProfiles.map(s => ({ ...s, isScout: true })) : [])
    ];

    const ridersToAnalyze = combinedRiders.filter(rider => {
        const ageMatch = monitoringAgeFilter === 'all' || getAgeCategory(rider.birthDate).category === monitoringAgeFilter;
        const levelMatch = monitoringLevelFilter === 'all' || (rider.categories || []).includes(monitoringLevelFilter);
        return ageMatch && levelMatch;
    });
        
    if (monitoringSortConfig) {
      ridersToAnalyze.sort((a, b) => {
        const getSortValue = (item: MonitoredPerson, key: string): string | number => {
          if (key === 'riderName') return `${item.firstName} ${item.lastName}`;
          if (key === 'qualitativeProfile') return item.qualitativeProfile || '';
          
          if (key.startsWith('char') || key === 'generalPerformanceScore' || key === 'fatigueResistanceScore') {
            const score = (item as any)[key as keyof MonitoredPerson] as number | undefined;
            return score ?? -1;
          }

          return -1;
        };

        const valA = getSortValue(a, monitoringSortConfig.key);
        const valB = getSortValue(b, monitoringSortConfig.key);

        let comparison = 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        }
        
        if (comparison !== 0) {
          return monitoringSortConfig.direction === 'asc' ? comparison : -comparison;
        }
        
        // Stabilize sort by name
        const nameA = `${a.firstName} ${a.lastName}`;
        const nameB = `${b.firstName} ${b.lastName}`;
        return nameA.localeCompare(nameB);
      });
    }


    return ridersToAnalyze;
  }, [riders, scoutingProfiles, includeScouting, monitoringAgeFilter, monitoringLevelFilter, monitoringSortConfig]);


  // --- End of Group Monitoring Logic ---

  const handleSaveRider = (riderToSave: Rider) => {
    onSaveRider(riderToSave);
    setIsDetailModalOpen(false);
  };
  
  const handleDeleteRider = (rider: Rider) => {
    setConfirmAction({
        title: `Supprimer ${rider.firstName} ${rider.lastName}`,
        message: "Êtes-vous sûr de vouloir supprimer ce coureur ? Cette action est irréversible et supprimera toutes les données associées.",
        onConfirm: () => {
            onDeleteRider(rider);
            setConfirmAction(null);
        }
    });
  };

  const openAddModal = () => {
    setIsNewRider(true);
    setEditingRider(null);
    setIsDetailModalOpen(true);
  };
  
  const openEditModal = (rider: Rider) => {
    setIsNewRider(false);
    setEditingRider(rider);
    setIsDetailModalOpen(true);
  };

  const handleOpenSelectionGrid = (event: RaceEvent) => {
    setSelectedEventForGrid(event);
    const existingSelections = riderEventSelections.filter(s => s.eventId === event.id);
    const selectionsWithAllRiders = riders.map(rider => {
        const existing = existingSelections.find(s => s.riderId === rider.id);
        return existing || { id: generateId(), eventId: event.id, riderId: rider.id, status: RiderEventStatus.NON_RETENU };
    });
    setGridSelections(selectionsWithAllRiders);
    setIsSelectionGridEventModalOpen(false);
    setActiveTab('selectionGrid');
  };

  const handleGridSelectionChange = (riderId: string, newStatus: RiderEventStatus) => {
    setGridSelections(prev => {
        const newGrid = [...prev];
        const index = newGrid.findIndex(s => s.riderId === riderId);
        if(index > -1) {
            newGrid[index] = {...newGrid[index], status: newStatus};
        }
        return newGrid;
    });
  };

  const handleSaveGrid = () => {
    if (!selectedEventForGrid) return;
    setRiderEventSelections(prev => {
        // Filter out all selections for the current event from the global state
        const otherSelections = prev.filter(s => s.eventId !== selectedEventForGrid.id);
        // Add back only the new or updated selections
        return [...otherSelections, ...gridSelections.filter(s => s.status !== RiderEventStatus.NON_RETENU)];
    });
    
    setRaceEvents(prev => prev.map(e => {
        if(e.id === selectedEventForGrid.id) {
            const titulairesIds = gridSelections
                .filter(s => s.status === RiderEventStatus.TITULAIRE)
                .map(s => s.riderId);
            return {...e, selectedRiderIds: titulairesIds};
        }
        return e;
    }));
    
    setActiveTab('roster');
    setSelectedEventForGrid(null);
  };
    
  const tabButtonStyle = (tabName: 'roster' | 'selectionGrid' | 'groupMonitoring' | 'seasonPlanning') => 
    `px-3 py-2 font-medium text-sm rounded-t-md whitespace-nowrap transition-colors duration-150 focus:outline-none ${
      activeTab === tabName 
        ? 'bg-white text-gray-800 border-b-2 border-blue-500 shadow-sm' 
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
    }`;

  if (currentUser.permissionRole === TeamRole.VIEWER) {
    return (
      <SectionWrapper title="Annuaire de l'Équipe">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {riders.map(rider => (
            <div key={rider.id} className="bg-white p-3 rounded-lg shadow-md border flex flex-col">
              <div className="flex items-center space-x-3 mb-3">
                  {rider.photoUrl ? <img src={rider.photoUrl} alt={rider.firstName} className="w-12 h-12 rounded-full object-cover"/> : <UserCircleIcon className="w-12 h-12 text-gray-400"/>}
                  <div>
                      <h3 className="text-md font-semibold text-gray-800">{rider.firstName} {rider.lastName}</h3>
                      <p className="text-xs text-gray-500">{rider.qualitativeProfile || 'Profil N/A'}</p>
                  </div>
              </div>
              <div className="space-y-1 text-sm flex-grow">
                {rider.phone && <p className="flex items-center text-gray-600"><PhoneIcon className="w-4 h-4 mr-2 text-gray-400"/>{rider.phone}</p>}
                {rider.email && <p className="flex items-center text-gray-600"><MailIcon className="w-4 h-4 mr-2 text-gray-400"/>{rider.email}</p>}
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>
    );
  }
    
  const renderRosterTab = () => (
    <div className="bg-white p-4 rounded-lg shadow-md">
       <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
            <label htmlFor="rosterSearch" className="block text-sm font-medium text-gray-700">Rechercher</label>
            <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    id="rosterSearch"
                    placeholder="Rechercher un coureur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
            </div>
        </div>
        <div>
            <label htmlFor="rosterGenderFilter" className="block text-sm font-medium text-gray-700">Sexe</label>
            <select
                id="rosterGenderFilter"
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as 'all' | Sex)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
                <option value="all">Tous</option>
                <option value={Sex.MALE}>Homme</option>
                <option value={Sex.FEMALE}>Femme</option>
            </select>
        </div>
        <div>
            <label htmlFor="rosterAgeCategoryFilter" className="block text-sm font-medium text-gray-700">Catégorie d'âge</label>
            <select
                id="rosterAgeCategoryFilter"
                value={ageCategoryFilter}
                onChange={(e) => setAgeCategoryFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
                <option value="all">Toutes</option>
                {['U15', 'U17', 'U19', 'U23', 'Senior'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="rosterLevelFilter" className="block text-sm font-medium text-gray-700">Niveau</label>
            <select
                id="rosterLevelFilter"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
                <option value="all">Tous</option>
                {RIDER_LEVEL_CATEGORIES.map(level => <option key={level} value={level}>{level}</option>)}
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Tranche d'âge</label>
            <div className="flex items-center space-x-2 mt-1">
                <input
                    type="number"
                    placeholder="Min"
                    value={minAgeFilter}
                    onChange={(e) => setMinAgeFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm bg-white text-gray-900 placeholder-gray-500"
                    aria-label="Âge minimum"
                />
                <span>-</span>
                <input
                    type="number"
                    placeholder="Max"
                    value={maxAgeFilter}
                    onChange={(e) => setMaxAgeFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm bg-white text-gray-900 placeholder-gray-500"
                    aria-label="Âge maximum"
                />
            </div>
        </div>
    </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredRidersForAdmin.map(rider => (
            <div key={rider.id} className="bg-gray-50 rounded-lg shadow-md overflow-hidden flex flex-col border border-gray-200 hover:shadow-lg transition-shadow">
                 <div className="p-3">
                    <div className="flex items-center space-x-3">
                        {rider.photoUrl ? <img src={rider.photoUrl} alt={rider.firstName} className="w-12 h-12 rounded-full object-cover"/> : <UserCircleIcon className="w-12 h-12 text-gray-400"/>}
                        <div>
                            <h3 className="text-md font-semibold text-gray-800">{rider.firstName} {rider.lastName}</h3>
                            <p className="text-xs text-gray-500">{rider.qualitativeProfile || 'Profil N/A'}</p>
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                        <p><strong>Forme:</strong> {rider.forme || '?'}</p>
                        <p><strong>Moral:</strong> {rider.moral || '?'}</p>
                        <p><strong>Santé:</strong> {rider.healthCondition || '-'}</p>
                    </div>
                 </div>
                 <div className="mt-auto p-2 border-t border-gray-200 flex justify-end space-x-1 bg-gray-50">
                    <ActionButton onClick={() => openEditModal(rider)} variant="secondary" size="sm" icon={<PencilIcon className="w-4 h-4"/>} title="Modifier">
                        <span className="sr-only">Modifier</span>
                    </ActionButton>
                    <ActionButton onClick={() => handleDeleteRider(rider)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4"/>} title="Supprimer">
                        <span className="sr-only">Supprimer</span>
                    </ActionButton>
                 </div>
            </div>
        ))}
      </div>
    </div>
  );

  const renderSelectionGrid = () => {
    if (!selectedEventForGrid) {
      return (
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">Veuillez sélectionner un événement pour voir la grille de sélection.</p>
          <ActionButton onClick={() => setIsSelectionGridEventModalOpen(true)} className="mt-4">
            Choisir un Événement
          </ActionButton>
        </div>
      );
    }
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Sélection pour : {selectedEventForGrid.name}</h3>
            <p className="text-sm text-gray-500 mb-4">
                Statut des coureurs pour cet événement. Les titulaires sont automatiquement ajoutés aux participants de l'événement.
            </p>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Coureur</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Statut</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Conflit Calendrier</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {riders.map(rider => {
                            const selection = gridSelections.find(s => s.riderId === rider.id);
                            const conflict = scheduleConflicts[rider.id];
                            return (
                                <tr key={rider.id}>
                                    <td className="px-4 py-2 font-medium">{rider.firstName} {rider.lastName}</td>
                                    <td className="px-4 py-2">
                                        <select
                                            value={selection?.status || RiderEventStatus.NON_RETENU}
                                            onChange={(e) => handleGridSelectionChange(rider.id, e.target.value as RiderEventStatus)}
                                            className="block w-full pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white text-gray-900"
                                        >
                                            {Object.values(RiderEventStatus).map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                     <td className="px-4 py-2">
                                        {conflict && conflict.length > 1 && (
                                            <div className="text-xs text-red-500" title={conflict.map(c => c.eventName).join(', ')}>
                                                <ExclamationCircleIcon className="w-4 h-4 inline mr-1" />
                                                Conflit
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
             <div className="mt-6 flex justify-end space-x-2">
                 <ActionButton onClick={() => setSelectedEventForGrid(null)} variant="secondary">
                     Changer d'Événement
                </ActionButton>
                <ActionButton onClick={handleSaveGrid}>
                    Enregistrer la Sélection
                </ActionButton>
            </div>
        </div>
    );
  };
    
  const renderGroupMonitoringTab = () => {
    const getSortIndicator = (key: string) => {
        if (!monitoringSortConfig || monitoringSortConfig.key !== key) return null;
        return monitoringSortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    const getScoreColor = (score: number) => {
      if (score >= 90) return 'bg-purple-500';
      if (score >= 80) return 'bg-blue-500';
      if (score >= 70) return 'bg-green-500';
      if (score >= 60) return 'bg-yellow-500';
      if (score >= 50) return 'bg-orange-500';
      return 'bg-red-500';
    };

    return (
        <div className="text-gray-700">
            <div className="mb-4 p-3 bg-gray-100 rounded-md flex flex-wrap gap-x-6 gap-y-3 items-center">
                <div>
                    <label htmlFor="ageCategoryFilter" className="block text-sm font-medium text-gray-600 mb-1">Catégorie d'Âge:</label>
                    <select id="ageCategoryFilter" value={monitoringAgeFilter} onChange={e => setMonitoringAgeFilter(e.target.value)} className="w-full text-sm py-1.5 border-gray-300 bg-white rounded-md">
                        {monitoringAllAgeCategoriesForFilter.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'Toutes' : cat}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="levelCategoryFilter" className="block text-sm font-medium text-gray-600 mb-1">Catégorie de Niveau:</label>
                    <select id="levelCategoryFilter" value={monitoringLevelFilter} onChange={e => setMonitoringLevelFilter(e.target.value)} className="w-full text-sm py-1.5 border-gray-300 bg-white rounded-md">
                        {monitoringAllLevelCategoriesForFilter.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'Toutes' : cat}</option>)}
                    </select>
                </div>
                 <div className="flex items-center self-end pb-1">
                    <input type="checkbox" id="includeScouting" checked={includeScouting} onChange={e => setIncludeScouting(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                    <label htmlFor="includeScouting" className="ml-2 text-sm text-gray-700">Inclure Scouting</label>
                </div>
            </div>
            {monitoredRiders.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 cursor-pointer" onClick={() => requestMonitoringSort('riderName')}>Coureur {getSortIndicator('riderName')}</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 cursor-pointer" onClick={() => requestMonitoringSort('qualitativeProfile')}>Profil Qualitatif {getSortIndicator('qualitativeProfile')}</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 cursor-pointer" onClick={() => requestMonitoringSort('generalPerformanceScore')}>Note Générale {getSortIndicator('generalPerformanceScore')}</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 cursor-pointer" onClick={() => requestMonitoringSort('fatigueResistanceScore')}>Résist. Fatigue {getSortIndicator('fatigueResistanceScore')}</th>
                                {SPIDER_CHART_CHARACTERISTICS_CONFIG.map(char => (
                                    <th key={char.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 cursor-pointer" onClick={() => requestMonitoringSort(char.key)}>{char.label} {getSortIndicator(char.key)}</th>
                                ))}
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-gray-200">
                             {monitoredRiders.map(rider => (
                                <tr key={rider.id}>
                                    <td className="px-3 py-2 font-medium">{rider.firstName} {rider.lastName} {rider.isScout && <span className="text-xs text-purple-600">(Scout)</span>}</td>
                                    <td className="px-3 py-2">
                                        {rider.qualitativeProfile && <span className={`px-2 py-0.5 text-xs rounded-full ${RIDER_QUALITATIVE_PROFILE_COLORS[rider.qualitativeProfile]}`}>{rider.qualitativeProfile}</span>}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-gray-200 rounded-full h-2"><div className={`${getScoreColor(rider.generalPerformanceScore || 0)} h-2 rounded-full`} style={{width: `${rider.generalPerformanceScore || 0}%`}}></div></div>
                                            <span className="font-semibold text-xs">{rider.generalPerformanceScore?.toFixed(0)}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-gray-200 rounded-full h-2"><div className={`${getScoreColor(rider.fatigueResistanceScore || 0)} h-2 rounded-full`} style={{width: `${rider.fatigueResistanceScore || 0}%`}}></div></div>
                                            <span className="font-semibold text-xs">{rider.fatigueResistanceScore?.toFixed(0)}</span>
                                        </div>
                                    </td>
                                    {SPIDER_CHART_CHARACTERISTICS_CONFIG.map(char => (
                                        <td key={char.key} className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-gray-200 rounded-full h-2"><div className={`${getScoreColor((rider as any)[char.key] || 0)} h-2 rounded-full`} style={{width: `${(rider as any)[char.key] || 0}%`}}></div></div>
                                                <span className="font-semibold text-xs">{((rider as any)[char.key] || 0).toFixed(0)}</span>
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                             ))}
                         </tbody>
                    </table>
                </div>
            ) : (
                 <p className="italic text-gray-500 text-center py-6">Aucun coureur à afficher avec les filtres actuels.</p>
            )}
        </div>
    );
  };
  
  return (
    <SectionWrapper
      title="Gestion de l'Effectif"
      actionButton={<ActionButton onClick={openAddModal} icon={<PlusCircleIcon className="w-5 h-5"/>}>Ajouter Coureur</ActionButton>}
    >
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
          <button onClick={() => setActiveTab('roster')} className={tabButtonStyle('roster')}>Effectif</button>
          <button onClick={() => setActiveTab('selectionGrid')} className={tabButtonStyle('selectionGrid')}>Grille de Sélection</button>
          <button onClick={() => setActiveTab('seasonPlanning')} className={tabButtonStyle('seasonPlanning')}>Planning Saison</button>
          <button onClick={() => setActiveTab('groupMonitoring')} className={tabButtonStyle('groupMonitoring')}>Qualité de l'effectif</button>
        </nav>
      </div>

      <div>
        {activeTab === 'roster' && renderRosterTab()}
        {activeTab === 'selectionGrid' && renderSelectionGrid()}
        {activeTab === 'seasonPlanning' && (
            <SeasonPlanningTab 
                raceEvents={raceEvents}
                riders={riders}
                riderEventSelections={riderEventSelections}
                setRiderEventSelections={setRiderEventSelections}
                setRaceEvents={setRaceEvents}
            />
        )}
        {activeTab === 'groupMonitoring' && renderGroupMonitoringTab()}
      </div>

      {isDetailModalOpen && (
        <RiderDetailModal 
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            rider={editingRider}
            onSaveRider={handleSaveRider}
            isEditMode={isNewRider}
            raceEvents={raceEvents}
            riderEventSelections={riderEventSelections}
            performanceEntries={performanceEntries}
            powerDurationsConfig={POWER_ANALYSIS_DURATIONS_CONFIG}
            calculateWkg={calculateWkg}
            appState={appState}
        />
      )}

      {isSelectionGridEventModalOpen && (
        <Modal isOpen={isSelectionGridEventModalOpen} onClose={() => setIsSelectionGridEventModalOpen(false)} title="Choisir un Événement">
            <div className="max-h-96 overflow-y-auto">
                {raceEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(event => (
                    <button key={event.id} onClick={() => handleOpenSelectionGrid(event)} className="w-full text-left p-2 hover:bg-gray-100 rounded-md">
                        {event.name} - {new Date(event.date + "T12:00:00Z").toLocaleDateString('fr-CA')}
                    </button>
                ))}
            </div>
        </Modal>
      )}

      {confirmAction && (
        <ConfirmationModal
            isOpen={true}
            onClose={() => setConfirmAction(null)}
            onConfirm={confirmAction.onConfirm}
            title={confirmAction.title}
            message={confirmAction.message}
        />
      )}

    </SectionWrapper>
  );
};
