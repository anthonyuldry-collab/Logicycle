import React, { useState, useEffect } from 'react';
import { RaceEvent, RaceInformation, EventRadioEquipment, EventRadioAssignment, EventType, Discipline } from '../../types';
import ActionButton from '../../components/ActionButton';
import Modal from '../../components/Modal'; 
import PlusCircleIcon from '../../components/icons/PlusCircleIcon';
import PencilIcon from '../../components/icons/PencilIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import { emptyEventRadioEquipment, ELIGIBLE_CATEGORIES_CONFIG } from '../../constants'; 

interface EventInfoTabProps {
  event: RaceEvent;
  updateEvent: (updatedEventData: Partial<RaceEvent>) => void;
  eventId: string; 
  radioEquipment: EventRadioEquipment | undefined;
  setRadioEquipment: (equipment: EventRadioEquipment | ((prev: EventRadioEquipment | undefined) => EventRadioEquipment)) => void;
  radioAssignments: EventRadioAssignment[];
  setRadioAssignments: React.Dispatch<React.SetStateAction<EventRadioAssignment[]>>;
}

const initialAssignmentFormStateFactory = (eventId: string): Omit<EventRadioAssignment, 'id'> => ({
  eventId: eventId,
  assignedTo: '',
  radioIdOrNotes: '',
});

const getCategoryLabel = (id: string = ''): string => {
    const category = ELIGIBLE_CATEGORIES_CONFIG.flatMap(g => g.categories).find(cat => cat.id === id);
    return category ? category.label : id;
};


const EventInfoTab: React.FC<EventInfoTabProps> = ({ 
    event, 
    updateEvent, 
    eventId, 
    radioEquipment: initialRadioEquipment, // Renamed for clarity
    setRadioEquipment, 
    radioAssignments, 
    setRadioAssignments 
}) => {
  const [formData, setFormData] = useState<RaceEvent>(event);
  const [isEditing, setIsEditing] = useState(false);

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Omit<EventRadioAssignment, 'id'> | EventRadioAssignment>(initialAssignmentFormStateFactory(eventId));
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);

  // Local state for radio equipment, ensuring it's always an object for the form
  const [localRadioEquipment, setLocalRadioEquipment] = useState<EventRadioEquipment>(
    initialRadioEquipment || emptyEventRadioEquipment(eventId, `${eventId}_radioequip_info_default_constructor`)
  );

  useEffect(() => {
    setFormData(event);
    // If initialRadioEquipment prop changes (e.g., loaded from global state), update local state
    // Ensure it's initialized if undefined.
    setLocalRadioEquipment(initialRadioEquipment || emptyEventRadioEquipment(eventId, `${eventId}_radioequip_info_effect`));
  }, [event, initialRadioEquipment, eventId]);

  const handleMainFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, section?: keyof RaceEvent) => {
    const { name, value } = e.target;
    
    if (section === 'raceInfo') {
        const type = (e.target as HTMLInputElement).type;
        setFormData(prev => {
            const newRaceInfo = {
                ...(prev.raceInfo),
                [name]: type === 'number' ? parseFloat(value) || 0 : value,
            };
            // If permanenceDate is changed, also update reunionDSDate if it was same or empty
            if (name === 'permanenceDate' && (prev.raceInfo.reunionDSDate === prev.raceInfo.permanenceDate || !prev.raceInfo.reunionDSDate)) {
                newRaceInfo.reunionDSDate = value;
            }
            return {
                ...prev,
                raceInfo: newRaceInfo
            };
        });
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    }
  };

  const handleRadioEquipmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    const newValue = type === 'checkbox' ? checked : value;

    // To prevent calling a parent state setter inside a local state updater,
    // we calculate the next state based on the current local state, then call both setters.
    const updatedEquip = {
        ...localRadioEquipment,
        [name]: newValue,
        eventId: eventId, // Ensure eventId is set
        id: localRadioEquipment.id || `${eventId}_radioequip_${Date.now()}` // Ensure id exists
    };

    // Update the local state
    setLocalRadioEquipment(updatedEquip);

    // Then, update the parent state (which will update appState)
    setRadioEquipment(updatedEquip);
  };
  
  const handleAssignmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentAssignment(prev => ({ ...prev, [name]: value, eventId }));
  };

  const handleAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignmentToSave : EventRadioAssignment = {
        ...(currentAssignment as Omit<EventRadioAssignment, 'id'>),
        eventId: eventId,
        id: (currentAssignment as EventRadioAssignment).id || Date.now().toString() + Math.random().toString(36).substring(2,9),
    };

    setRadioAssignments(prevAssignments => { 
        if (isEditingAssignment) {
            return prevAssignments.map(a => a.id === assignmentToSave.id ? assignmentToSave : a);
        } else {
            return [...prevAssignments, assignmentToSave];
        }
    });
    setIsAssignmentModalOpen(false);
    setCurrentAssignment(initialAssignmentFormStateFactory(eventId));
    setIsEditingAssignment(false);
  };

  const openAddAssignmentModal = () => {
    setCurrentAssignment(initialAssignmentFormStateFactory(eventId));
    setIsEditingAssignment(false);
    setIsAssignmentModalOpen(true);
  };

  const openEditAssignmentModal = (assignment: EventRadioAssignment) => {
    setCurrentAssignment(assignment);
    setIsEditingAssignment(true);
    setIsAssignmentModalOpen(true);
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette assignation radio ?")) {
      setRadioAssignments(prevAssignments => prevAssignments.filter(a => a.id !== assignmentId));
    }
  };


  const handleSaveAll = () => {
    updateEvent(formData); 
    // Radio equipment is already saved by its own handler.
    // Radio assignments are saved by their modal.
    setIsEditing(false);
  };

  const handleCancelAll = () => {
    setFormData(event); 
    setLocalRadioEquipment(initialRadioEquipment || emptyEventRadioEquipment(eventId, `${eventId}_radioequip_info_cancel`));
    setIsEditing(false);
  };

  const raceInfoFields: {key: keyof RaceInformation, label: string, type: 'text' | 'number' | 'date'}[] = [
    { key: 'permanenceAddress', label: 'Adresse Permanence', type: 'text' },
    { key: 'permanenceTime', label: 'Heure Permanence', type: 'text' },
    { key: 'permanenceDate', label: 'Date Permanence', type: 'date' },
    { key: 'reunionDSTime', label: 'Réunion DS', type: 'text' },
    { key: 'reunionDSDate', label: 'Date Réunion DS', type: 'date' },
    { key: 'presentationTime', label: 'Présentation Équipes', type: 'text' },
    { key: 'departFictifTime', label: 'Départ Fictif', type: 'text' },
    { key: 'departReelTime', label: 'Départ Réel', type: 'text' },
    { key: 'arriveePrevueTime', label: 'Arrivée Prévue', type: 'text' },
    { key: 'distanceKm', label: 'Distance (km)', type: 'number' },
    { key: 'radioFrequency', label: 'Fréquence Radio', type: 'text' },
  ];

  const lightInputClass = "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm bg-white text-gray-900 border-gray-300 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500";


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-700">Informations Générales, Course & Radio</h3>
        {!isEditing && (
          <ActionButton onClick={() => setIsEditing(true)} variant="primary">
            Modifier les Informations
          </ActionButton>
        )}
      </div>

      {isEditing ? (
        <form className="space-y-4">
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-medium text-gray-700 px-1">Détails Événement</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              <div className="lg:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom de l'événement</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleMainFormInputChange} required className={lightInputClass} />
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                <input type="date" name="date" id="date" value={formData.date} onChange={handleMainFormInputChange} required className={lightInputClass} />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Lieu</label>
                <input type="text" name="location" id="location" value={formData.location} onChange={handleMainFormInputChange} required className={lightInputClass} />
              </div>
               <div>
                <label htmlFor="discipline" className="block text-sm font-medium text-gray-700">Discipline</label>
                <select name="discipline" id="discipline" value={formData.discipline || ''} onChange={(e) => handleMainFormInputChange(e, 'discipline')} required className={`${lightInputClass} w-full`}>
                    {Object.values(Discipline).filter(d => d !== Discipline.TOUS).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">Type Événement</label>
                <select name="eventType" id="eventType" value={formData.eventType} onChange={(e) => handleMainFormInputChange(e, 'eventType')} required className={`${lightInputClass} w-full`}>
                    {Object.values(EventType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label htmlFor="eligibleCategory" className="block text-sm font-medium text-gray-700">Catégorie de l'épreuve</label>
                <input 
                  type="text"
                  name="eligibleCategory" 
                  id="eligibleCategory" 
                  value={formData.eligibleCategory} 
                  onChange={(e) => handleMainFormInputChange(e, 'eligibleCategory')} 
                  required 
                  className={`${lightInputClass} w-full`} 
                  placeholder="Ex: Elite Nationale, UCI 1.1, etc."
                />
              </div>
            </div>
          </fieldset>
          
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-medium text-gray-700 px-1">Informations Spécifiques Course</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                {raceInfoFields.map(({ key, label, type }) => (
                    <div key={key} className={['permanenceAddress'].includes(String(key)) ? 'md:col-span-2' : ''}>
                        <label htmlFor={key} className="block text-sm font-medium text-gray-700">{label}</label>
                        <input 
                            type={type === 'date' ? 'date' : (type === 'number' ? 'number' : 'text')} 
                            name={key} 
                            id={key} 
                            value={(formData.raceInfo as any)[key] || ''} 
                            onChange={(e) => handleMainFormInputChange(e, 'raceInfo')} 
                            className={lightInputClass}
                            step={type === 'number' ? "any" : undefined}
                        />
                    </div>
                ))}
            </div>
          </fieldset>

          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-medium text-gray-700 px-1">Communication Radio</legend>
            <div className="mb-3">
                <div className="flex items-center">
                    <input 
                        type="checkbox" 
                        name="hasEquipment" 
                        id={`hasEquipment_info_${eventId}`}
                        checked={localRadioEquipment.hasEquipment}
                        onChange={handleRadioEquipmentChange}
                        className="h-5 w-5 text-blue-500 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`hasEquipment_info_${eventId}`} className="ml-2 text-sm font-medium text-gray-700">
                        Matériel radio prévu pour cet événement.
                    </label>
                </div>
                {localRadioEquipment.hasEquipment && (
                <div className="mt-2 space-y-2">
                    <div>
                        <label htmlFor={`details_info_${eventId}`} className="block text-sm font-medium text-gray-700">Détails sur le matériel (quantité, type, etc.)</label>
                        <textarea 
                            name="details" 
                            id={`details_info_${eventId}`}
                            value={localRadioEquipment.details}
                            onChange={handleRadioEquipmentChange}
                            rows={2}
                            className={lightInputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor={`channelFrequency_info_${eventId}`} className="block text-sm font-medium text-gray-700">Fréquence Radio (Canal)</label>
                        <input
                            type="text"
                            name="channelFrequency"
                            id={`channelFrequency_info_${eventId}`}
                            value={localRadioEquipment.channelFrequency || ''}
                            onChange={handleRadioEquipmentChange}
                            placeholder="Ex: 149.500 MHz"
                            className={lightInputClass}
                        />
                    </div>
                </div>
                )}
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <h4 className="text-md font-medium text-gray-600">Répartition des Radios</h4>
                    <ActionButton onClick={openAddAssignmentModal} icon={<PlusCircleIcon className="w-4 h-4"/>} size="sm" type="button" variant="secondary">
                        Ajouter Assignation
                    </ActionButton>
                </div>
                {radioAssignments.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Aucune assignation radio.</p>
                ) : (
                    <ul className="text-sm text-gray-600 list-disc pl-5 mt-1 max-h-40 overflow-y-auto border p-2 rounded-md">
                        {radioAssignments.map(assign => (
                            <li key={assign.id} className="mb-1 flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                                <span>{assign.assignedTo}: {assign.radioIdOrNotes}</span>
                                <span className="space-x-1 flex-shrink-0">
                                    <ActionButton onClick={() => openEditAssignmentModal(assign)} variant="secondary" size="sm" icon={<PencilIcon className="w-3 h-3"/>} type="button"><span className="sr-only">Modifier</span></ActionButton>
                                    <ActionButton onClick={() => handleDeleteAssignment(assign.id)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3"/>} type="button"><span className="sr-only">Suppr.</span></ActionButton>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
          </fieldset>

          <div className="flex justify-end space-x-3 pt-4">
            <ActionButton type="button" variant="secondary" onClick={handleCancelAll}>Annuler</ActionButton>
            <ActionButton type="button" onClick={handleSaveAll}>Sauvegarder Informations</ActionButton>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
            <fieldset className="border p-4 rounded-md bg-gray-50">
                <legend className="text-md font-semibold text-gray-600 px-1">Détails Événement</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm text-gray-700">
                    <div><p><strong>Nom:</strong> {formData.name}</p></div>
                    <div><p><strong>Date:</strong> {new Date(formData.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
                    <div className="lg:col-span-1"><p><strong>Lieu:</strong> {formData.location}</p></div>
                    <div><p><strong>Discipline:</strong> {formData.discipline || 'N/A'}</p></div>
                    <div><p><strong>Type:</strong> {formData.eventType}</p></div>
                </div>
                 <div className="mt-2 pt-2 border-t text-sm">
                    <p><strong>Catégorie Épreuve:</strong> {getCategoryLabel(formData.eligibleCategory) || 'N/A'}</p>
                 </div>
            </fieldset>
            
            <fieldset className="border p-4 rounded-md bg-gray-50">
                <legend className="text-md font-semibold text-gray-600 px-1">Informations Spécifiques Course</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                    {raceInfoFields.map(({ key, label, type }) => (
                         <div key={key} className={['permanenceAddress'].includes(String(key)) ? 'md:col-span-2' : ''}>
                             <p><strong>{label}:</strong> {(formData.raceInfo as any)[key] ? (type === 'date' ? new Date((formData.raceInfo as any)[key] + 'T12:00:00Z').toLocaleDateString('fr-FR') : (formData.raceInfo as any)[key]) : 'N/A'}</p>
                        </div>
                    ))}
                </div>
            </fieldset>

            <fieldset className="border p-4 rounded-md bg-gray-50">
                <legend className="text-md font-semibold text-gray-600 px-1">Communication Radio</legend>
                <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Matériel radio prévu:</strong> {localRadioEquipment.hasEquipment ? 'Oui' : 'Non'}</p>
                    {localRadioEquipment.hasEquipment && <p><strong>Détails matériel:</strong> {localRadioEquipment.details || 'N/A'}</p>}
                    {localRadioEquipment.hasEquipment && <p><strong>Fréquence Radio:</strong> {localRadioEquipment.channelFrequency || 'N/A'}</p>}
                    <div>
                        <strong>Répartition des Radios:</strong>
                        {radioAssignments.length === 0 ? (
                            <span className="italic ml-1">Aucune assignation.</span>
                        ) : (
                            <ul className="list-disc list-inside pl-5 mt-1">
                                {radioAssignments.map(assign => (
                                    <li key={assign.id}>{assign.assignedTo}: {assign.radioIdOrNotes}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </fieldset>
        </div>
      )}

      <Modal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} title={isEditingAssignment ? "Modifier Assignation Radio" : "Ajouter Assignation Radio"}>
        <form onSubmit={handleAssignmentSubmit} className="space-y-4">
          <div>
            <label htmlFor={`assignedToModal_info_${eventId}`} className="block text-sm font-medium text-gray-700">Assigné à (DS, Mécano, Assistant...)</label>
            <input type="text" name="assignedTo" id={`assignedToModal_info_${eventId}`} value={(currentAssignment as EventRadioAssignment).assignedTo} onChange={handleAssignmentInputChange} required placeholder="Ex: DS1, Mécano Le Bars" className={lightInputClass} />
          </div>
          <div>
            <label htmlFor={`radioIdOrNotesModal_info_${eventId}`} className="block text-sm font-medium text-gray-700">ID Radio / Notes spécifiques</label>
            <input type="text" name="radioIdOrNotes" id={`radioIdOrNotesModal_info_${eventId}`} value={(currentAssignment as EventRadioAssignment).radioIdOrNotes} onChange={handleAssignmentInputChange} placeholder="Ex: Radio #3, Canal principal" className={lightInputClass} />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <ActionButton type="button" variant="secondary" onClick={() => setIsAssignmentModalOpen(false)}>Annuler</ActionButton>
            <ActionButton type="submit">{isEditingAssignment ? "Sauvegarder" : "Ajouter"}</ActionButton>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default EventInfoTab;
