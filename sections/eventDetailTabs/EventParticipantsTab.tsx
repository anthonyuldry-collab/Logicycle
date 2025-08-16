

import React, { useState, useEffect } from 'react';
import { RaceEvent, Rider, StaffMember, Vehicle, AppState, StaffRoleKey } from '../../types';
import ActionButton from '../../components/ActionButton';
import { STAFF_ROLES_CONFIG } from '../../constants';

interface EventParticipantsTabProps {
  event: RaceEvent;
  updateEvent: (updatedEventData: Partial<RaceEvent>) => void;
  appState: AppState;
}

const EventParticipantsTab: React.FC<EventParticipantsTabProps> = ({ event, updateEvent, appState }) => {
  const [selectedRiderIds, setSelectedRiderIds] = useState<string[]>(event.selectedRiderIds || []);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(event.selectedStaffIds || []);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>(event.selectedVehicleIds || []);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setSelectedRiderIds(event.selectedRiderIds || []);
    setSelectedStaffIds(event.selectedStaffIds || []);
    setSelectedVehicleIds(event.selectedVehicleIds || []);
  }, [event]);

  const handleSelectionChange = (id: string, type: 'riders' | 'staff' | 'vehicles') => {
    switch (type) {
      case 'riders':
        setSelectedRiderIds(prev => prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]);
        break;
      case 'staff':
        setSelectedStaffIds(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
        break;
      case 'vehicles':
        setSelectedVehicleIds(prev => prev.includes(id) ? prev.filter(vId => vId !== id) : [...prev, id]);
        break;
    }
  };

  const handleSave = () => {
    const newSelectedStaffIdsSet = new Set(selectedStaffIds);

    const updatedEventData: Partial<RaceEvent> = {
        selectedRiderIds,
        selectedStaffIds,
        selectedVehicleIds,
    };

    STAFF_ROLES_CONFIG.flatMap(g => g.roles).forEach(roleInfo => {
        const roleKey = roleInfo.key as StaffRoleKey;
        const existingAssignments = event[roleKey] || [];
        const cleanedAssignments = existingAssignments.filter(id => newSelectedStaffIdsSet.has(id));
        (updatedEventData as any)[roleKey] = cleanedAssignments;
    });

    updateEvent(updatedEventData);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setSelectedRiderIds(event.selectedRiderIds || []);
    setSelectedStaffIds(event.selectedStaffIds || []);
    setSelectedVehicleIds(event.selectedVehicleIds || []);
    setIsEditing(false);
  };

  const getParticipantDetails = (participant: { id: string, name: string }): string => {
    // Check if it's a StaffMember and display role
    const staffMember = appState.staff.find(s => s.id === participant.id);
    if (staffMember) {
      return `(${staffMember.role})`;
    }
    // Check if it's a Vehicle and display license plate
    const vehicle = appState.vehicles.find(v => v.id === participant.id);
    if (vehicle) {
      return `(${vehicle.licensePlate})`;
    }
    // Rider or other type, no extra detail needed here
    return '';
  };


  const renderParticipantList = <T extends { id: string, name: string }>(
    title: string,
    allAvailableParticipants: T[], // Full list of available participants of this type from appState
    selectedIds: string[],
    onChange?: (id: string, type: 'riders' | 'staff' | 'vehicles') => void,
    type?: 'riders' | 'staff' | 'vehicles'
  ) => {
    const selectedParticipants = allAvailableParticipants.filter(p => selectedIds.includes(p.id));

    if (!isEditing && selectedIds.length === 0) {
        return (
            <div>
                <h4 className="text-md font-semibold text-gray-700 mb-1">{title}</h4>
                <p className="text-sm text-gray-500 italic">Aucun participant de ce type sélectionné.</p>
            </div>
        );
    }
    return (
      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-1">{title} ({selectedIds.length})</h4>
        {isEditing ? (
          <div className="max-h-48 overflow-y-auto space-y-1 p-2 border rounded-md bg-gray-50">
            {allAvailableParticipants.length === 0 && <p className="text-sm text-gray-400 italic">Aucun {title.toLowerCase().replace(' sélectionnés', '')} disponible globalement.</p>}
            {allAvailableParticipants.map(p => (
              <div key={p.id} className="flex items-center">
                <input 
                  type="checkbox" 
                  id={`${type}-${p.id}`} 
                  checked={selectedIds.includes(p.id)} 
                  onChange={() => onChange && type && onChange(p.id, type)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  aria-labelledby={`label-${type}-${p.id}`}
                />
                <label id={`label-${type}-${p.id}`} htmlFor={`${type}-${p.id}`} className="ml-2 text-sm text-gray-700">
                  {p.name} {getParticipantDetails(p)}
                </label>
              </div>
            ))}
          </div>
        ) : (
          <ul className="list-disc list-inside pl-1">
            {selectedParticipants.map(participant => (
              <li key={participant.id} className="text-sm text-gray-700">
                {participant.name} {getParticipantDetails(participant)}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const ridersWithNames = appState.riders.map(r => ({ ...r, name: `${r.firstName} ${r.lastName}` }));
  const staffWithNames = appState.staff.map(s => ({ ...s, name: `${s.firstName} ${s.lastName}` }));

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-700">Participants à l'Événement</h3>
        {!isEditing && (
          <ActionButton onClick={() => setIsEditing(true)} variant="primary">
            Modifier les Participants
          </ActionButton>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderParticipantList('Coureurs Sélectionnés', ridersWithNames, selectedRiderIds, handleSelectionChange, 'riders')}
        {renderParticipantList('Staff Participant', staffWithNames, selectedStaffIds, handleSelectionChange, 'staff')} 
        {renderParticipantList('Véhicules Sélectionnés', appState.vehicles, selectedVehicleIds, handleSelectionChange, 'vehicles')}
      </div>

      {isEditing && (
        <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
          <ActionButton type="button" variant="secondary" onClick={handleCancel}>Annuler</ActionButton>
          <ActionButton type="button" onClick={handleSave}>Sauvegarder Participants</ActionButton>
        </div>
      )}
    </div>
  );
};

export default EventParticipantsTab;