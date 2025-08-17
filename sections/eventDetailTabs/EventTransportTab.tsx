import React, { useState, useMemo } from 'react';
import { RaceEvent, AppState, EventTransportLeg, Rider, StaffMember, Vehicle, TransportStop, BudgetItemCategory, EventBudgetItem, TransportDirection, TransportMode, StaffStatus, VehicleType } from '../../types';
import ActionButton from '../../components/ActionButton';
import Modal from '../../components/Modal';
import PlusCircleIcon from '../../components/icons/PlusCircleIcon';
import PencilIcon from '../../components/icons/PencilIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import InformationCircleIcon from '../../components/icons/InformationCircleIcon';
import ChevronDownIcon from '../../components/icons/ChevronDownIcon';

interface EventTransportTabProps {
  event: RaceEvent; 
  eventId: string;
  appState: AppState; 
  setEventTransportLegs: React.Dispatch<React.SetStateAction<EventTransportLeg[]>>;
  setEventBudgetItems: React.Dispatch<React.SetStateAction<EventBudgetItem[]>>;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const initialTransportFormStateFactory = (eventId: string): Omit<EventTransportLeg, 'id'> => ({
  eventId: eventId,
  direction: TransportDirection.ALLER,
  mode: TransportMode.MINIBUS,
  departureDate: '',
  departureTime: '',
  departureLocation: '', 
  arrivalDate: '',
  arrivalTime: '', 
  arrivalLocation: '',
  details: '',
  personName: '', // Will be auto-generated
  isAuroreFlight: false,
  occupants: [],
  assignedVehicleId: undefined,
  driverId: undefined,
  intermediateStops: [],
});

const lightInputBaseClasses = "bg-slate-700 text-slate-200 border-slate-600 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500";
const lightInputClasses = `mt-1 block w-full px-3 py-1.5 border rounded-md shadow-sm sm:text-sm ${lightInputBaseClasses}`;
const lightSelectClasses = `mt-1 block w-full pl-3 pr-10 py-1.5 border rounded-md shadow-sm sm:text-sm ${lightInputBaseClasses}`;

const datesOverlap = (startAStr?: string, endAStr?: string, startBStr?: string, endBStr?: string): boolean => {
  if (!startAStr || !startBStr) return false;

  const sA = new Date(startAStr + "T00:00:00Z");
  const eA = endAStr ? new Date(endAStr + "T23:59:59Z") : new Date(startAStr + "T23:59:59Z");
  const sB = new Date(startBStr + "T00:00:00Z");
  const eB = endBStr ? new Date(endBStr + "T23:59:59Z") : new Date(startBStr + "T23:59:59Z");

  return sA <= eB && eA >= sB;
};

const checkVehicleAvailability = (
  vehicle: Vehicle,
  checkStartDate: string | undefined,
  checkEndDate: string | undefined,
  allGlobalTransportLegs: EventTransportLeg[],
  currentLegIdToExclude?: string
): { status: 'available' | 'maintenance' | 'assigned', reason: string } => {
  if (!checkStartDate) return { status: 'available', reason: '' };

  // Check for maintenance
  if (vehicle.nextMaintenanceDate) {
      if (datesOverlap(checkStartDate, checkEndDate, vehicle.nextMaintenanceDate, vehicle.nextMaintenanceDate)) {
          return { status: 'maintenance', reason: '(Indisponible - Entretien)' };
      }
  }

  // Check for assignment
  for (const leg of allGlobalTransportLegs) {
    if (leg.id === currentLegIdToExclude) continue;
    if (leg.assignedVehicleId === vehicle.id) {
      if (datesOverlap(checkStartDate, checkEndDate, leg.departureDate, leg.arrivalDate)) {
        return { status: 'assigned', reason: '(Indisponible - Assigné)' };
      }
    }
  }
  return { status: 'available', reason: '' };
};


export const EventTransportTab: React.FC<EventTransportTabProps> = ({ 
  event, 
  eventId, 
  appState, 
  setEventTransportLegs,
  setEventBudgetItems
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTransportLeg, setCurrentTransportLeg] = useState<Omit<EventTransportLeg, 'id'> | EventTransportLeg>(initialTransportFormStateFactory(eventId));
  const [isEditing, setIsEditing] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const transportLegsForEvent = useMemo(() => {
    return appState.eventTransportLegs.filter(leg => leg.eventId === eventId);
  }, [appState.eventTransportLegs, eventId]);

  const allAvailablePeople = useMemo(() => {
    const eventParticipantIds = new Set([...(event.selectedRiderIds || []), ...(event.selectedStaffIds || [])]);

    const allPeople = [
        ...appState.riders.map(r => ({ id: r.id, name: `${r.firstName} ${r.lastName}`, type: 'rider' as 'rider' | 'staff', isParticipant: eventParticipantIds.has(r.id) })),
        ...appState.staff.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, type: 'staff' as 'rider' | 'staff', isParticipant: eventParticipantIds.has(s.id) }))
    ];
    
    // Sort participants first, then by name
    return allPeople.sort((a, b) => {
        if (a.isParticipant !== b.isParticipant) {
            return a.isParticipant ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });
  }, [appState.riders, appState.staff, event.selectedRiderIds, event.selectedStaffIds]);

  const calculateVehicleBudgetItems = (legsForEvent: EventTransportLeg[]): EventBudgetItem[] => {
    const budgetItems: EventBudgetItem[] = [];
    legsForEvent.forEach(leg => {
        const vehicle = leg.assignedVehicleId ? appState.vehicles.find(v => v.id === leg.assignedVehicleId) : undefined;
        if (vehicle?.estimatedDailyCost && vehicle.estimatedDailyCost > 0 && leg.departureDate) {
            const startDate = new Date(leg.departureDate + "T12:00:00Z");
            const endDate = leg.arrivalDate ? new Date(leg.arrivalDate + "T12:00:00Z") : startDate;
            const durationInDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
            const totalCost = vehicle.estimatedDailyCost * durationInDays;

            budgetItems.push({
                id: `auto-vehicle-${leg.id}`,
                eventId: eventId,
                category: BudgetItemCategory.VOITURE_EQUIPE,
                description: `Coût estimé: ${vehicle.name}`,
                estimatedCost: totalCost,
                notes: `Auto-généré: ${durationInDays} jours @ ${vehicle.estimatedDailyCost}€/jour.`,
                isAutoGenerated: true,
                sourceVehicleId: vehicle.id,
            });
        }
    });
    return budgetItems;
  };

  const calculateVacataireBudgetItems = (legsForEvent: EventTransportLeg[]): EventBudgetItem[] => {
      const vacataireCosts = new Map<string, { minDate: Date, maxDate: Date, staff: StaffMember }>();
      const allStaffInEvent = appState.staff.filter(s => event.selectedStaffIds.includes(s.id));

      allStaffInEvent.forEach(staffMember => {
        if (staffMember?.status === StaffStatus.VACATAIRE && staffMember.dailyRate) {
          const staffLegs = legsForEvent.filter(leg => leg.occupants.some(occ => occ.id === staffMember.id && occ.type === 'staff'));
          
          if (staffLegs.length > 0) {
            let minDate: Date | null = null;
            let maxDate: Date | null = null;

            staffLegs.forEach(leg => {
              const depDate = leg.departureDate ? new Date(leg.departureDate + "T12:00:00Z") : null;
              const arrDate = leg.arrivalDate ? new Date(leg.arrivalDate + "T12:00:00Z") : depDate;
              
              if (depDate) {
                if (!minDate || depDate < minDate) minDate = depDate;
              }
              if (arrDate) {
                if (!maxDate || arrDate > maxDate) maxDate = arrDate;
              }
            });

            if (minDate && maxDate) {
              vacataireCosts.set(staffMember.id, { minDate, maxDate, staff: staffMember });
            }
          }
        }
      });


      const budgetItems: EventBudgetItem[] = [];
      vacataireCosts.forEach((data, staffId) => {
          const durationDays = Math.max(1, Math.round((data.maxDate.getTime() - data.minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          const totalCost = durationDays * data.staff.dailyRate!;
          budgetItems.push({
              id: `auto-vacataire-${eventId}-${staffId}`,
              eventId: eventId,
              category: BudgetItemCategory.SALAIRES,
              description: `Prestation vacataire: ${data.staff.firstName} ${data.staff.lastName}`,
              estimatedCost: totalCost,
              actualCost: totalCost,
              notes: `Auto-généré: ${durationDays} jours @ ${data.staff.dailyRate}€/jour. Basé sur les dates de transport.`,
              isAutoGenerated: true,
              sourceStaffId: staffId,
          });
      });
      return budgetItems;
  };

  const updateCostsForEvent = (allLegsForEvent: EventTransportLeg[]) => {
      const vacataireBudgetItems = calculateVacataireBudgetItems(allLegsForEvent);
      const vehicleBudgetItems = calculateVehicleBudgetItems(allLegsForEvent);
      
      setEventBudgetItems(prevBudget => {
        const manualBudgetItemsForEvent = prevBudget.filter(item => item.eventId === eventId && !item.isAutoGenerated);
        const otherEventsBudgetItems = prevBudget.filter(item => item.eventId !== eventId);
        
        return [...otherEventsBudgetItems, ...manualBudgetItemsForEvent, ...vacataireBudgetItems, ...vehicleBudgetItems];
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'departureDate' || name === 'arrivalDate') {
        setCurrentTransportLeg(prev => ({
            ...prev,
            [name]: value === '' ? undefined : value
        }));
        return;
    }
    
    if (name === 'assignedVehicleId') {
        const vehicleId = value;
        const vehicle = appState.vehicles.find(v => v.id === vehicleId);

        let newMode = (currentTransportLeg as EventTransportLeg).mode;
        if (vehicleId === 'perso') {
            newMode = TransportMode.VOITURE_PERSO;
        } else if (vehicle) {
            if ([VehicleType.MINIBUS, VehicleType.VOITURE, VehicleType.BUS].includes(vehicle.vehicleType)) {
                newMode = TransportMode.MINIBUS;
            } else {
                newMode = TransportMode.AUTRE;
            }
        }

        setCurrentTransportLeg(prev => ({ 
            ...(prev as EventTransportLeg),
            mode: newMode,
            assignedVehicleId: value === "" ? undefined : value,
            driverId: vehicle?.driverId || undefined
        }));
        return;
    }

    setCurrentTransportLeg(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOccupantChange = (personId: string, personType: 'rider' | 'staff') => {
    setCurrentTransportLeg(prev => {
        const updated = structuredClone(prev);
        if (!updated.occupants) updated.occupants = [];
        const isSelected = updated.occupants.some(occ => occ.id === personId && occ.type === personType);
        
        if (isSelected) {
            updated.occupants = updated.occupants.filter(occ => !(occ.id === personId && occ.type === personType));
        } else {
            updated.occupants.push({ id: personId, type: personType });
        }
        return updated;
    });
  };

  const handleAddStop = () => {
    const newStop: TransportStop = {
      id: generateId(),
      location: '',
      date: event.date,
      time: '',
      stopType: 'waypoint',
      persons: [],
      notes: ''
    };
    setCurrentTransportLeg(prev => {
        const updated = structuredClone(prev);
        if (!updated.intermediateStops) updated.intermediateStops = [];
        updated.intermediateStops.push(newStop);
        return updated;
    });
  };

  const handleRemoveStop = (stopId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette étape ?")) {
      setCurrentTransportLeg(prev => {
        const updated = structuredClone(prev);
        updated.intermediateStops = (updated.intermediateStops || []).filter(stop => stop.id !== stopId);
        return updated;
      });
    }
  };
  
  const handleStopChange = (index: number, field: keyof Omit<TransportStop, 'id'|'persons'>, value: string) => {
    setCurrentTransportLeg(prev => {
      const updated = structuredClone(prev);
      if (updated.intermediateStops && updated.intermediateStops[index]) {
        (updated.intermediateStops[index] as any)[field] = value;
      }
      return updated;
    });
  };
  
  const handleStopPersonChange = (stopIndex: number, personId: string, personType: 'rider' | 'staff') => {
    setCurrentTransportLeg(prev => {
      const updated = structuredClone(prev);
      const stop = updated.intermediateStops?.[stopIndex];
      if (stop) {
        if (!stop.persons) stop.persons = [];
        const personIndex = stop.persons.findIndex((p: any) => p.id === personId && p.type === personType);
        if (personIndex > -1) {
          stop.persons.splice(personIndex, 1);
        } else {
          stop.persons.push({ id: personId, type: personType });
        }
      }
      return updated;
    });
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let legData = { ...currentTransportLeg };
    
    // Ensure empty dates are undefined
    if (legData.departureDate === '') legData.departureDate = undefined;
    if (legData.arrivalDate === '') legData.arrivalDate = undefined;

    const legToSave: EventTransportLeg = {
      ...(legData as Omit<EventTransportLeg, 'id'>),
      eventId: eventId,
      id: (legData as EventTransportLeg).id || generateId(),
    };

    setEventTransportLegs(prevLegs => {
      const otherLegs = prevLegs.filter(leg => leg.eventId !== eventId);
      const legsForThisEvent = prevLegs.filter(leg => leg.eventId === eventId);
      let updatedLegsForEvent;
      if (isEditing) {
          updatedLegsForEvent = legsForThisEvent.map(leg => leg.id === legToSave.id ? legToSave : leg);
      } else {
          updatedLegsForEvent = [...legsForThisEvent, legToSave];
      }
      
      // Update budget items after the state update
      setTimeout(() => updateCostsForEvent(updatedLegsForEvent), 0);

      return [...otherLegs, ...updatedLegsForEvent];
    });

    setIsModalOpen(false);
  };

  const openAddModal = () => {
    setCurrentTransportLeg(initialTransportFormStateFactory(eventId));
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (leg: EventTransportLeg) => {
    setCurrentTransportLeg(structuredClone(leg));
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (legId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce trajet ?")) {
        setEventTransportLegs(prevLegs => {
            const updatedLegs = prevLegs.filter(leg => leg.id !== legId);
            const legsForThisEvent = updatedLegs.filter(leg => leg.eventId === eventId);
            updateCostsForEvent(legsForThisEvent);
            return updatedLegs;
        });
    }
  };

  const toggleRowExpansion = (legId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(legId)) {
        newSet.delete(legId);
      } else {
        newSet.add(legId);
      }
      return newSet;
    });
  };
  
  const formatDate = (dateString?: string, timeString?: string) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(`${dateString}T${timeString || '00:00:00'}`);
        if (isNaN(date.getTime())) return "Date invalide";
        const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
        let formatted = date.toLocaleDateString('fr-FR', options);
        if (timeString) {
            formatted += ` à ${timeString}`;
        }
        return formatted;
    } catch {
        return 'Date Invalide';
    }
  };

  const renderTransportTable = (legs: EventTransportLeg[], title: string) => (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-700 mb-3">{title}</h3>
      {legs.length === 0 ? (
        <p className="text-gray-500 italic">Aucun trajet planifié.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trajet</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Départ</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrivée</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupants</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {legs.map((leg) => {
                 const vehicle = appState.vehicles.find(v => v.id === leg.assignedVehicleId);
                 const driver = appState.staff.find(s => s.id === leg.driverId);
                 const isExpanded = expandedRows.has(leg.id);
                 return (
                    <React.Fragment key={leg.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3">
                          <button onClick={() => toggleRowExpansion(leg.id)} className="text-gray-500 hover:text-gray-700">
                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </td>
                        <td className="py-3 px-3 font-medium text-gray-900">
                          <div>{vehicle ? vehicle.name : leg.mode}</div>
                          <div className="text-xs text-gray-500">{leg.mode}</div>
                        </td>
                        <td className="py-3 px-3 text-gray-700">
                           <div className="font-semibold">{formatDate(leg.departureDate, leg.departureTime)}</div>
                           <div>De: {leg.departureLocation}</div>
                        </td>
                        <td className="py-3 px-3 text-gray-700">
                           <div className="font-semibold">{formatDate(leg.arrivalDate, leg.arrivalTime)}</div>
                           <div>À: {leg.arrivalLocation}</div>
                        </td>
                         <td className="py-3 px-3 text-gray-700">{leg.occupants.length} pers.</td>
                        <td className="py-3 px-3 whitespace-nowrap text-right space-x-2">
                           <ActionButton onClick={() => openEditModal(leg)} variant="secondary" size="sm" icon={<PencilIcon className="w-4 h-4"/>}/>
                           <ActionButton onClick={() => handleDelete(leg.id)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4"/>}/>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50">
                            <td colSpan={6} className="p-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                    <div>
                                        <h5 className="font-semibold mb-1">Détails Véhicule</h5>
                                        <p><strong>Véhicule:</strong> {vehicle?.name || 'N/A'}</p>
                                        <p><strong>Conducteur:</strong> {driver ? `${driver.firstName} ${driver.lastName}` : 'N/A'}</p>
                                        <p><strong>Places:</strong> {leg.occupants.length} / {vehicle?.seats || '∞'}</p>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold mb-1">Occupants ({leg.occupants.length})</h5>
                                        <ul className="list-disc list-inside max-h-24 overflow-y-auto">
                                            {leg.occupants.map(occ => {
                                                const person = occ.type === 'rider' ? appState.riders.find(p => p.id === occ.id) : appState.staff.find(p => p.id === occ.id);
                                                return <li key={occ.id + occ.type}>{person ? `${person.firstName} ${person.lastName}` : 'Inconnu'}</li>
                                            })}
                                        </ul>
                                    </div>
                                     <div className="md:col-span-1">
                                        <h5 className="font-semibold mb-1">Étapes & Notes</h5>
                                        <p><strong>Étapes:</strong> {leg.intermediateStops?.length || 0}</p>
                                        <p><strong>Notes:</strong> {leg.details || 'Aucune'}</p>
                                    </div>
                                </div>
                            </td>
                        </tr>
                      )}
                    </React.Fragment>
                 )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const allerLegs = transportLegsForEvent.filter(leg => leg.direction === TransportDirection.ALLER).sort((a,b) => (a.departureDate || '').localeCompare(b.departureDate || ''));
  const retourLegs = transportLegsForEvent.filter(leg => leg.direction === TransportDirection.RETOUR).sort((a,b) => (a.departureDate || '').localeCompare(b.departureDate || ''));
  const jourJLegs = transportLegsForEvent.filter(leg => leg.direction === TransportDirection.JOUR_J).sort((a,b) => (a.departureTime || '').localeCompare(b.departureTime || ''));


  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-700">Plan de Transport pour {event.name}</h3>
        <ActionButton onClick={openAddModal} icon={<PlusCircleIcon className="w-5 h-5"/>}>
          Ajouter un Trajet
        </ActionButton>
      </div>

      {renderTransportTable(allerLegs, "Trajets Aller")}
      {renderTransportTable(jourJLegs, "Transport Jour J")}
      {renderTransportTable(retourLegs, "Trajets Retour")}

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Modifier Trajet" : "Ajouter un Trajet"}>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto p-2 -m-2">
            <div className="bg-slate-800 text-white p-4 -m-2 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="directionModal" className="block text-sm font-medium text-slate-300">Direction</label>
                  <select name="direction" id="directionModal" value={(currentTransportLeg as EventTransportLeg).direction} onChange={handleInputChange} className={lightSelectClasses}>
                    {(Object.values(TransportDirection) as TransportDirection[]).map(dir => <option key={dir} value={dir} className="bg-slate-700">{dir}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="assignedVehicleIdModal" className="block text-sm font-medium text-slate-300">Véhicule Assigné</label>
                  <select name="assignedVehicleId" id="assignedVehicleIdModal" value={(currentTransportLeg as EventTransportLeg).assignedVehicleId || ''} onChange={handleInputChange} className={lightSelectClasses}>
                      <option value="" className="bg-slate-700">-- Aucun / Autre --</option>
                      <option value="perso" className="bg-slate-700">Voiture Personnelle</option>
                      {appState.vehicles.map(v => {
                          const availability = checkVehicleAvailability(v, (currentTransportLeg as EventTransportLeg).departureDate, (currentTransportLeg as EventTransportLeg).arrivalDate, appState.eventTransportLegs, (currentTransportLeg as EventTransportLeg).id);
                          return (
                              <option key={v.id} value={v.id} disabled={availability.status !== 'available'} className="bg-slate-700">
                                  {v.name} {availability.reason}
                              </option>
                          );
                      })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Départ</label>
                  <input type="date" name="departureDate" value={(currentTransportLeg as EventTransportLeg).departureDate || ''} onChange={handleInputChange} className={lightInputClasses} style={{ colorScheme: 'dark' }}/>
                  <input type="time" name="departureTime" value={(currentTransportLeg as EventTransportLeg).departureTime || ''} onChange={handleInputChange} className={`${lightInputClasses} mt-1`}/>
                  <input type="text" name="departureLocation" value={(currentTransportLeg as EventTransportLeg).departureLocation || ''} onChange={handleInputChange} placeholder="Lieu de départ" className={`${lightInputClasses} mt-1`}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Arrivée</label>
                  <input type="date" name="arrivalDate" value={(currentTransportLeg as EventTransportLeg).arrivalDate || ''} onChange={handleInputChange} className={lightInputClasses} style={{ colorScheme: 'dark' }}/>
                  <input type="time" name="arrivalTime" value={(currentTransportLeg as EventTransportLeg).arrivalTime || ''} onChange={handleInputChange} className={`${lightInputClasses} mt-1`}/>
                  <input type="text" name="arrivalLocation" value={(currentTransportLeg as EventTransportLeg).arrivalLocation || ''} onChange={handleInputChange} placeholder="Lieu d'arrivée" className={`${lightInputClasses} mt-1`}/>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="driverIdModal" className="block text-sm font-medium text-slate-300">Conducteur</label>
                <select name="driverId" id="driverIdModal" value={(currentTransportLeg as EventTransportLeg).driverId || ''} onChange={handleInputChange} className={lightSelectClasses}>
                    <option value="" className="bg-slate-700">-- Sélectionner --</option>
                    {appState.staff.map(s => <option key={s.id} value={s.id} className="bg-slate-700">{s.firstName} {s.lastName}</option>)}
                </select>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-300">Occupants</label>
                <div className="mt-1 p-2 border border-slate-600 rounded-md space-y-1 bg-slate-700 max-h-40 overflow-y-auto">
                  {allAvailablePeople.map(person => (
                    <div key={`${person.id}-${person.type}`} className={`flex items-center ${person.isParticipant ? '' : 'opacity-60'}`}>
                      <input 
                          type="checkbox" 
                          id={`occupant-${person.id}-${person.type}`}
                          checked={(currentTransportLeg as EventTransportLeg).occupants.some(occ => occ.id === person.id && occ.type === person.type)}
                          onChange={() => handleOccupantChange(person.id, person.type)}
                          className="h-4 w-4 rounded border-slate-500 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      <label htmlFor={`occupant-${person.id}-${person.type}`} className="ml-2 text-sm text-slate-300">
                          {person.name} {!person.isParticipant && <span className="text-xs text-slate-400">(hors sélection)</span>}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-300">Étapes Intermédiaires</label>
                <div className="mt-1 space-y-2">
                  {(currentTransportLeg as EventTransportLeg).intermediateStops?.map((stop, index) => (
                      <div key={stop.id} className="p-2 border border-slate-600 rounded-md bg-slate-700">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              <input type="text" value={stop.location} onChange={e => handleStopChange(index, 'location', e.target.value)} placeholder="Lieu de l'étape" className="input-field-sm text-xs"/>
                              <input type="date" value={stop.date} onChange={e => handleStopChange(index, 'date', e.target.value)} className="input-field-sm text-xs" style={{colorScheme: 'dark'}}/>
                              <input type="time" value={stop.time} onChange={e => handleStopChange(index, 'time', e.target.value)} className="input-field-sm text-xs"/>
                          </div>
                          <details className="text-xs mt-2">
                            <summary className="cursor-pointer text-slate-400">Gérer les personnes ({stop.persons.length})</summary>
                            <div className="mt-1 p-1 border-t border-slate-600 max-h-24 overflow-y-auto grid grid-cols-2 gap-x-2">
                              {(currentTransportLeg as EventTransportLeg).occupants.map(occ => {
                                  const person = allAvailablePeople.find(p => p.id === occ.id && p.type === occ.type);
                                  return person ? (
                                      <div key={person.id} className="flex items-center">
                                        <input type="checkbox" id={`stop-${index}-${person.id}`} checked={stop.persons.some(p => p.id === person.id && p.type === person.type)} onChange={() => handleStopPersonChange(index, person.id, person.type)} className="h-3 w-3 rounded-sm"/>
                                        <label htmlFor={`stop-${index}-${person.id}`} className="ml-1.5">{person.name}</label>
                                      </div>
                                  ) : null
                              })}
                            </div>
                          </details>
                          <div className="flex items-center justify-between mt-2">
                              <input type="text" value={stop.notes || ''} onChange={e => handleStopChange(index, 'notes', e.target.value)} placeholder="Notes (ex: changement de conducteur)" className="input-field-sm text-xs flex-grow mr-2"/>
                              <ActionButton type="button" onClick={() => handleRemoveStop(stop.id)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3"/>}/>
                          </div>
                      </div>
                  ))}
                  <ActionButton type="button" onClick={handleAddStop} variant="secondary" size="sm" icon={<PlusCircleIcon className="w-4 h-4"/>}>Ajouter une étape</ActionButton>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="detailsModal" className="block text-sm font-medium text-slate-300">Détails (N° vol, répartition, prix, etc.)</label>
                <textarea name="details" id="detailsModal" value={(currentTransportLeg as EventTransportLeg).details || ''} onChange={handleInputChange} rows={2} className={lightInputClasses} />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                <ActionButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</ActionButton>
                <ActionButton type="submit">{isEditing ? "Sauvegarder" : "Ajouter"}</ActionButton>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};