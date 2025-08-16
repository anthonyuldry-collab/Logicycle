

import React, { useState, useMemo } from 'react';
import { Vehicle, StaffMember, EventTransportLeg, RaceEvent, AppSection, MaintenanceRecord, VehicleType, EventType } from '../types';
import { EVENT_TYPE_COLORS } from '../constants'; 
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import TruckIcon from '../components/icons/TruckIcon';
import ListBulletIcon from '../components/icons/ListBulletIcon'; 
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';
import { useTranslations } from '../hooks/useTranslations';


interface VehiclesSectionProps {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  staff: StaffMember[]; 
  eventTransportLegs: EventTransportLeg[];
  raceEvents: RaceEvent[]; 
  navigateTo: (section: AppSection, eventId?: string) => void; 
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const initialVehicleFormState: Omit<Vehicle, 'id'> = { 
  name: '', 
  licensePlate: '', 
  driverId: undefined,
  notes: '',
  vehicleType: VehicleType.VOITURE, 
  seats: undefined,
  estimatedDailyCost: undefined,
  purchaseDate: undefined,
  nextMaintenanceDate: undefined,
  maintenanceNotes: undefined,
  maintenanceHistory: [],
};

const lightInputBaseClasses = "bg-white text-gray-900 border-gray-300 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500";
const lightInputClass = `mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${lightInputBaseClasses}`;
const lightSelectClass = `mt-1 block w-full pl-3 pr-10 py-2 border rounded-md shadow-sm sm:text-sm ${lightInputBaseClasses}`;

const datesOverlap = (startAStr: string | undefined, endAStr: string | undefined, startBStr: string | undefined, endBStr: string | undefined): boolean => {
  if (!startAStr || !startBStr) return false;

  const sA = new Date(startAStr + "T00:00:00Z");
  const eA = endAStr ? new Date(endAStr + "T23:59:59Z") : new Date(startAStr + "T23:59:59Z"); 
  const sB = new Date(startBStr + "T00:00:00Z");
  const eB = endBStr ? new Date(endBStr + "T23:59:59Z") : new Date(startBStr + "T23:59:59Z");
  
  return sA <= eB && eA >= sB;
};

const getVehicleStatusForDay = (
    vehicle: Vehicle, 
    date: Date, 
    allLegs: EventTransportLeg[],
    allEvents: RaceEvent[]
): { status: 'Disponible' | 'Assigné' | 'Maintenance', details?: string, eventType?: EventType } => {
    const dateStr = date.toISOString().split('T')[0];

    // Check for maintenance first
    if (vehicle.nextMaintenanceDate === dateStr) {
        return { status: 'Maintenance', details: vehicle.maintenanceNotes || 'Entretien prévu' };
    }

    // Check for assignment
    const assignedLeg = allLegs.find(leg => {
        if (leg.assignedVehicleId === vehicle.id) {
            if (!leg.departureDate) return false;
            return datesOverlap(dateStr, dateStr, leg.departureDate, leg.arrivalDate || leg.departureDate);
        }
        return false;
    });

    if (assignedLeg) {
        const event = allEvents.find(e => e.id === assignedLeg.eventId);
        return { status: 'Assigné', details: event ? event.name : 'Événement Inconnu', eventType: event?.eventType };
    }

    return { status: 'Disponible' };
};

type VehicleTab = 'list' | 'assignmentCalendar';

const VehiclesSection: React.FC<VehiclesSectionProps> = ({ 
    vehicles, 
    setVehicles, 
    staff, 
    eventTransportLegs, 
    raceEvents, 
    navigateTo 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Omit<Vehicle, 'id'> | Vehicle>(initialVehicleFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [activeVehicleTab, setActiveVehicleTab] = useState<VehicleTab>('list');
  const [calendarDisplayDate, setCalendarDisplayDate] = useState(new Date());
  const { t } = useTranslations();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    if (name === 'seats' || name === 'estimatedDailyCost') {
      processedValue = value === '' ? undefined : parseFloat(value);
    } else if (type === 'date' && value === '') {
      processedValue = undefined;
    }

    setCurrentVehicle(prev => ({ 
        ...prev, 
        [name]: processedValue
    }));
  };
  
  const handleMaintenanceRecordChange = (index: number, field: keyof MaintenanceRecord, value: string | number) => {
    const updatedHistory = [...((currentVehicle as Vehicle).maintenanceHistory || [])];
    if (updatedHistory[index]) {
        (updatedHistory[index] as any)[field] = (field === 'cost' || field === 'mileage') && typeof value === 'string' ? (value === '' ? undefined : parseFloat(value)) : value;
        setCurrentVehicle(prev => ({ ...prev, maintenanceHistory: updatedHistory }));
    }
  };

  const addMaintenanceRecord = () => {
    const newRecord: MaintenanceRecord = { id: generateId(), date: new Date().toISOString().split('T')[0], description: '' };
    setCurrentVehicle(prev => ({ ...prev, maintenanceHistory: [...((prev as Vehicle).maintenanceHistory || []), newRecord] }));
  };

  const removeMaintenanceRecord = (idToRemove: string) => {
    if(window.confirm(t('vehicleConfirmDeleteMaintenance'))){
        setCurrentVehicle(prev => ({ ...prev, maintenanceHistory: ((prev as Vehicle).maintenanceHistory || []).filter(rec => rec.id !== idToRemove) }));
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && 'id' in currentVehicle) {
      setVehicles(prevVehicles => prevVehicles.map(v => v.id === (currentVehicle as Vehicle).id ? (currentVehicle as Vehicle) : v));
    } else {
      setVehicles(prevVehicles => [...prevVehicles, { ...currentVehicle, id: generateId() } as Vehicle]);
    }
    setIsModalOpen(false);
    setCurrentVehicle(initialVehicleFormState);
    setIsEditing(false);
  };

  const openAddModal = () => {
    setCurrentVehicle(initialVehicleFormState);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (vehicleId: string) => {
    if (window.confirm(t('vehicleConfirmDelete'))) {
      setVehicles(prevVehicles => prevVehicles.filter(v => v.id !== vehicleId));
    }
  };

  const getDriverName = (driverId?: string) => {
    if (!driverId) return 'Non assigné';
    const driver = staff.find(s => s.id === driverId);
    return driver ? `${driver.firstName} ${driver.lastName}` : 'Chauffeur inconnu';
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        return new Date(dateString + "T12:00:00Z").toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return 'Date invalide' }
  };

  const renderVehicleListTab = () => (
    vehicles.length === 0 ? (
        <p className="text-gray-500 italic">Aucun véhicule ajouté pour le moment.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom/Descriptif</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Immatriculation</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut (Aujourd'hui)</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'Achat</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernier Entretien</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prochain Entretien</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vehicles.map((vehicle) => {
                const todayStatus = getVehicleStatusForDay(vehicle, new Date(), eventTransportLegs, raceEvents);
                const lastMaintenance = vehicle.maintenanceHistory && vehicle.maintenanceHistory.length > 0
                    ? [...vehicle.maintenanceHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                    : null;
                return (
                  <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-800">{vehicle.name}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">{vehicle.vehicleType || 'N/A'}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">{vehicle.licensePlate}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        todayStatus.status === 'Disponible' ? 'bg-green-100 text-green-800' :
                        todayStatus.status === 'Assigné' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {todayStatus.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">{formatDate(vehicle.purchaseDate)}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">{formatDate(lastMaintenance?.date)}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-700">{formatDate(vehicle.nextMaintenanceDate)}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-right space-x-2">
                      <ActionButton onClick={() => openEditModal(vehicle)} variant="secondary" size="sm" icon={<PencilIcon className="w-4 h-4"/>}>
                        Modifier
                      </ActionButton>
                      <ActionButton onClick={() => handleDelete(vehicle.id)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4"/>}>
                        Supprimer
                      </ActionButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )
  );

  const renderVehicleAssignmentCalendarTab = () => {
    const month = calendarDisplayDate.getMonth();
    const year = calendarDisplayDate.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <ActionButton onClick={() => setCalendarDisplayDate(new Date(year, month - 1, 1))} variant="secondary" icon={<ChevronLeftIcon className="w-4 h-4" />} size="sm">Mois Préc.</ActionButton>
          <h3 className="text-xl font-semibold text-gray-800">
            {calendarDisplayDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h3>
          <ActionButton onClick={() => setCalendarDisplayDate(new Date(year, month + 1, 1))} variant="secondary" icon={<ChevronRightIcon className="w-4 h-4" />} size="sm">Mois Suiv.</ActionButton>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600 border-b pb-2 mb-1">
          {daysOfWeek.map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-start-${i}`} className="h-28 bg-gray-50 rounded-md border"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
            const dayNumber = dayIndex + 1;
            const currentDate = new Date(year, month, dayNumber);
            const isToday = new Date().toDateString() === currentDate.toDateString();
            
            const itemsForDay = vehicles.map(vehicle => {
                const statusInfo = getVehicleStatusForDay(vehicle, currentDate, eventTransportLegs, raceEvents);
                if (statusInfo.status === 'Disponible') return null;
                return { vehicleName: vehicle.name, ...statusInfo };
            }).filter(Boolean);

            return (
              <div key={dayNumber} className={`h-28 border rounded-md p-1 overflow-y-auto text-xs relative ${isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}>
                <span className={`font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{dayNumber}</span>
                <div className="mt-1 space-y-1">
                  {itemsForDay.map((item, index) => {
                    const bgColor = item!.status === 'Maintenance' 
                      ? 'bg-yellow-400 text-black' 
                      : (item!.eventType ? EVENT_TYPE_COLORS[item!.eventType] : 'bg-orange-400 text-white');
                    
                    return (
                      <div
                        key={index}
                        title={`${item!.vehicleName}: ${item!.details}`}
                        className={`p-1 rounded text-[10px] leading-tight truncate cursor-pointer hover:opacity-80 ${bgColor}`}
                        onClick={() => item!.status === 'Assigné' && navigateTo('eventDetail', eventTransportLegs.find(leg => leg.assignedVehicleId === vehicles.find(v => v.name === item!.vehicleName)?.id && datesOverlap(currentDate.toISOString().split('T')[0], currentDate.toISOString().split('T')[0], leg.departureDate, leg.arrivalDate || leg.departureDate))?.eventId)}
                      >
                        <span className="font-medium">{item!.vehicleName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
           {Array.from({ length: (7 - (adjustedFirstDay + daysInMonth) % 7) % 7 }).map((_, i) => (
            <div key={`empty-end-${i}`} className="h-28 bg-gray-50 rounded-md border"></div>
          ))}
        </div>
         <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-600 mb-2 text-center">Légende</h4>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
                <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-1.5 bg-yellow-400"></span><span className="text-gray-500">Maintenance</span></div>
                <div className="flex items-center"><span className="w-3 h-3 rounded-full mr-1.5 bg-orange-400"></span><span className="text-gray-500">Assigné (Course)</span></div>
            </div>
        </div>
      </div>
    );
  };


  const tabButtonStyle = (tabName: VehicleTab) => 
    `px-3 py-2 font-medium text-sm rounded-t-md whitespace-nowrap transition-colors duration-150 focus:outline-none ${
      activeVehicleTab === tabName 
        ? 'bg-white text-gray-800 border-b-2 border-blue-500 shadow-sm' 
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <SectionWrapper 
      title="Gestion des Véhicules"
      actionButton={ activeVehicleTab === 'list' ? (
        <ActionButton onClick={openAddModal} icon={<PlusCircleIcon className="w-5 h-5"/>}>
          Ajouter Véhicule
        </ActionButton>
      ) : null}
    >
        <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
            <button onClick={() => setActiveVehicleTab('list')} className={tabButtonStyle('list')}>
                <TruckIcon className="w-4 h-4 mr-2 inline-block"/>Liste des Véhicules
            </button>
            <button onClick={() => setActiveVehicleTab('assignmentCalendar')} className={tabButtonStyle('assignmentCalendar')}>
                <ListBulletIcon className="w-4 h-4 mr-2 inline-block"/>Calendrier Prévisionnel
            </button>
            </nav>
        </div>

        {activeVehicleTab === 'list' && renderVehicleListTab()}
        {activeVehicleTab === 'assignmentCalendar' && renderVehicleAssignmentCalendarTab()}


      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Modifier Véhicule" : "Ajouter un Véhicule"}>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto pr-2">
          <fieldset className="border border-gray-300 p-3 rounded-md">
            <legend className="text-md font-medium text-gray-700 px-1">Informations Principales</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                    <label htmlFor="nameModalVehicle" className="block text-sm font-medium text-gray-700">Nom / Descriptif</label>
                    <input type="text" name="name" id="nameModalVehicle" value={currentVehicle.name} onChange={handleInputChange} required placeholder="Ex: Minibus Bleu, Voiture DS" className={lightInputClass} />
                </div>
                <div>
                    <label htmlFor="licensePlateModal" className="block text-sm font-medium text-gray-700">Plaque d'immatriculation</label>
                    <input type="text" name="licensePlate" id="licensePlateModal" value={currentVehicle.licensePlate} onChange={handleInputChange} required className={lightInputClass} />
                </div>
                <div>
                    <label htmlFor="vehicleTypeModal" className="block text-sm font-medium text-gray-700">Type de Véhicule</label>
                    <select name="vehicleType" id="vehicleTypeModal" value={currentVehicle.vehicleType || VehicleType.AUTRE} onChange={handleInputChange} className={lightSelectClass}>
                    {(Object.values(VehicleType) as VehicleType[]).map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="seatsModal" className="block text-sm font-medium text-gray-700">Nombre de Places</label>
                    <input type="number" name="seats" id="seatsModal" value={currentVehicle.seats === undefined ? '' : currentVehicle.seats} onChange={handleInputChange} min="1" placeholder="Ex: 9" className={lightInputClass} />
                </div>
                 <div>
                    <label htmlFor="driverIdModal" className="block text-sm font-medium text-gray-700">Chauffeur Principal</label>
                    <select name="driverId" id="driverIdModal" value={currentVehicle.driverId || ''} onChange={handleInputChange} className={lightSelectClass}>
                    <option value="">Sélectionner un chauffeur...</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{`${s.firstName} ${s.lastName}`} ({s.role})</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="estimatedDailyCost" className="block text-sm font-medium text-gray-700">Coût Journalier Estimé (€)</label>
                    <input type="number" name="estimatedDailyCost" id="estimatedDailyCost" value={currentVehicle.estimatedDailyCost === undefined ? '' : currentVehicle.estimatedDailyCost} onChange={handleInputChange} min="0" step="0.01" placeholder="Ex: 50 (carburant, etc.)" className={lightInputClass} />
                </div>
                 <div>
                    <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">Date d'Achat</label>
                    <input type="date" name="purchaseDate" id="purchaseDate" value={(currentVehicle as Vehicle).purchaseDate || ''} onChange={handleInputChange} className={lightInputClass}/>
                </div>
            </div>
             <div className="mt-4">
                <label htmlFor="notesModalVehicle" className="block text-sm font-medium text-gray-700">Notes (capacité, type, etc.)</label>
                <textarea name="notes" id="notesModalVehicle" value={currentVehicle.notes || ''} onChange={handleInputChange} rows={2} className={lightInputClass} />
            </div>
          </fieldset>
            
           <fieldset className="border border-gray-300 p-3 rounded-md">
            <legend className="text-md font-medium text-gray-700 px-1">Maintenance</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                    <label htmlFor="nextMaintenanceDate" className="block text-sm font-medium text-gray-700">Prochain Entretien Prévu</label>
                    <input type="date" name="nextMaintenanceDate" id="nextMaintenanceDate" value={(currentVehicle as Vehicle).nextMaintenanceDate || ''} onChange={handleInputChange} className={lightInputClass}/>
                </div>
            </div>
            <div className="mt-4">
                <label htmlFor="maintenanceNotes" className="block text-sm font-medium text-gray-700">Notes pour le prochain entretien</label>
                <textarea name="maintenanceNotes" id="maintenanceNotes" value={(currentVehicle as Vehicle).maintenanceNotes || ''} onChange={handleInputChange} rows={2} className={lightInputClass} />
            </div>
          </fieldset>

          <fieldset className="border border-gray-300 p-3 rounded-md">
            <legend className="text-md font-medium text-gray-700 px-1">Historique de Maintenance</legend>
            <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-2">
            {((currentVehicle as Vehicle).maintenanceHistory || []).map((record, index) => (
                <div key={record.id} className="p-2 border border-gray-200 rounded-md grid grid-cols-12 gap-x-2 gap-y-1 items-center">
                    <div className="col-span-12 sm:col-span-3">
                        <label className="text-xs text-gray-600">Date</label>
                        <input type="date" value={record.date} onChange={(e) => handleMaintenanceRecordChange(index, 'date', e.target.value)} className={`${lightInputClass} text-xs py-1`}/>
                    </div>
                     <div className="col-span-12 sm:col-span-9">
                        <label className="text-xs text-gray-600">Description</label>
                        <input type="text" value={record.description} onChange={(e) => handleMaintenanceRecordChange(index, 'description', e.target.value)} placeholder="Description de l'intervention" className={`${lightInputClass} text-xs py-1`} />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                        <label className="text-xs text-gray-600">Coût (€)</label>
                        <input type="number" value={record.cost ?? ''} onChange={(e) => handleMaintenanceRecordChange(index, 'cost', e.target.value)} placeholder="Coût" className={`${lightInputClass} text-xs py-1`} />
                    </div>
                     <div className="col-span-6 sm:col-span-3">
                        <label className="text-xs text-gray-600">Kilométrage</label>
                        <input type="number" value={record.mileage ?? ''} onChange={(e) => handleMaintenanceRecordChange(index, 'mileage', e.target.value)} placeholder="Km" className={`${lightInputClass} text-xs py-1`} />
                    </div>
                     <div className="col-span-12 sm:col-span-5">
                        <label className="text-xs text-gray-600">Garage</label>
                        <input type="text" value={record.garage ?? ''} onChange={(e) => handleMaintenanceRecordChange(index, 'garage', e.target.value)} placeholder="Nom du garage" className={`${lightInputClass} text-xs py-1`} />
                    </div>
                    <div className="col-span-12 sm:col-span-1 flex justify-end items-end">
                        <ActionButton type="button" onClick={() => removeMaintenanceRecord(record.id)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4" />} className="!p-1.5"><span className="sr-only">Supprimer</span></ActionButton>
                    </div>
                </div>
            ))}
            </div>
            <ActionButton type="button" onClick={addMaintenanceRecord} variant="secondary" size="sm" icon={<PlusCircleIcon className="w-4 h-4" />} className="text-xs mt-3">
                Ajouter une intervention
            </ActionButton>
          </fieldset>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white py-3 -mx-4 px-4 -mb-4">
            <ActionButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</ActionButton>
            <ActionButton type="submit">{isEditing ? "Sauvegarder" : "Ajouter"}</ActionButton>
          </div>
        </form>
      </Modal>
    </SectionWrapper>
  );
};

export default VehiclesSection;