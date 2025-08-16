import React, { useState, useMemo } from 'react';
import { RaceEvent, AppState, EventChecklistItem, StaffRole as StaffRoleEnum, ChecklistItemStatus, StaffRole, ChecklistRole, User, TeamRole } from '../../types';
import ActionButton from '../../components/ActionButton';
import Modal from '../../components/Modal';
import PlusCircleIcon from '../../components/icons/PlusCircleIcon';
import PencilIcon from '../../components/icons/PencilIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import DownloadIcon from '../../components/icons/DownloadIcon';
import MailIcon from '../../components/icons/MailIcon';

interface EventChecklistTabProps {
  event: RaceEvent;
  eventId: string;
  appState: AppState;
  setEventChecklistItems: React.Dispatch<React.SetStateAction<EventChecklistItem[]>>;
  updateEvent: (updatedEventData: Partial<RaceEvent>) => void;
  currentUser: User;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const initialChecklistItemFormStateFactory = (eventId: string): Omit<EventChecklistItem, 'id'> => ({
  eventId: eventId,
  itemName: '',
  responsiblePerson: '',
  assignedRole: undefined,
  status: ChecklistItemStatus.A_FAIRE,
  notes: '',
});

const mapStaffRoleToChecklistRole = (staffRole: StaffRoleEnum): ChecklistRole | null => {
    switch (staffRole) {
        case StaffRoleEnum.DS: return ChecklistRole.DS;
        case StaffRoleEnum.ASSISTANT: return ChecklistRole.ASSISTANT;
        case StaffRoleEnum.MECANO: return ChecklistRole.MECANO;
        case StaffRoleEnum.MANAGER: return ChecklistRole.MANAGER;
        case StaffRoleEnum.COMMUNICATION: return ChecklistRole.COMMUNICATION;
        default: return null;
    }
};

const EventChecklistTab: React.FC<EventChecklistTabProps> = ({ 
  event, 
  eventId, 
  appState, 
  setEventChecklistItems,
  updateEvent,
  currentUser
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Omit<EventChecklistItem, 'id'> | EventChecklistItem>(initialChecklistItemFormStateFactory(eventId));
  const [isEditing, setIsEditing] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);
  
  const isRider = currentUser.permissionRole === TeamRole.VIEWER;
  const riderName = isRider ? `${currentUser.firstName} ${currentUser.lastName}` : '';

  const checklistItemsForEvent = useMemo(() => {
    const allItems = appState.eventChecklistItems.filter(item => item.eventId === eventId);
    if (isRider) {
        return allItems.filter(item => 
            item.assignedRole === ChecklistRole.COUREUR ||
            item.responsiblePerson === riderName
        );
    }
    return allItems;
  }, [appState.eventChecklistItems, eventId, isRider, riderName]);

  const isLogisticsValidated = event.isLogisticsValidated;
  const allTasksDone = useMemo(() => {
    if (checklistItemsForEvent.length === 0) return false;
    return checklistItemsForEvent.every(item => item.status === ChecklistItemStatus.FAIT);
  }, [checklistItemsForEvent]);

  const handleValidateLogistics = () => {
    if (allTasksDone && !isLogisticsValidated) {
        if (window.confirm("Valider la logistique ? Cette action est irréversible et bloquera la checklist.")) {
            updateEvent({
                isLogisticsValidated: true,
                logisticsValidationDate: new Date().toISOString(),
            });
        }
    }
  };

  const handleLoadFromTemplate = () => {
    if (!window.confirm("Ceci ajoutera les tâches des modèles pour les rôles et coureurs participants. Les tâches existantes avec le même nom ne seront pas ajoutées. Continuer ?")) {
      return;
    }

    const staffOnEvent = appState.staff.filter(s => event.selectedStaffIds.includes(s.id));
    const ridersOnEvent = appState.riders.filter(r => event.selectedRiderIds.includes(r.id));
    
    const rolesPresent = new Set<ChecklistRole>();
    
    staffOnEvent.forEach(staffMember => {
        if (staffMember.role === StaffRoleEnum.DS) rolesPresent.add(ChecklistRole.DS);
        if (staffMember.role === StaffRoleEnum.ASSISTANT) rolesPresent.add(ChecklistRole.ASSISTANT);
        if (staffMember.role === StaffRoleEnum.MECANO) rolesPresent.add(ChecklistRole.MECANO);
    });
    
    if (event.managerId && event.managerId.length > 0) rolesPresent.add(ChecklistRole.MANAGER);
    if (event.communicationId && event.communicationId.length > 0) rolesPresent.add(ChecklistRole.COMMUNICATION);

    if (ridersOnEvent.length > 0) {
        rolesPresent.add(ChecklistRole.COUREUR);
    }
    
    const existingTaskNames = new Set(checklistItemsForEvent.map(item => item.itemName.toLowerCase()));
    let newItems: EventChecklistItem[] = [];

    rolesPresent.forEach(role => {
        const templateTasks = appState.checklistTemplates[role] || [];
        templateTasks.forEach(taskTemplate => {
            if (!existingTaskNames.has(taskTemplate.name.toLowerCase())) {
                newItems.push({
                    id: generateId(),
                    eventId: eventId,
                    itemName: taskTemplate.name,
                    assignedRole: role,
                    status: ChecklistItemStatus.A_FAIRE,
                    responsiblePerson: '',
                    notes: '',
                });
            }
        });
    });

    if (newItems.length > 0) {
        setEventChecklistItems(prev => [...prev, ...newItems]);
        alert(`${newItems.length} nouvelle(s) tâche(s) ajoutée(s) depuis les modèles.`);
    } else {
        alert("Aucune nouvelle tâche à ajouter. Toutes les tâches des modèles pour les participants sont déjà dans la liste.");
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value === "" && name === "assignedRole" ? undefined : value }));
  };
  
  const handleStatusChange = (itemToUpdate: EventChecklistItem, newStatus: ChecklistItemStatus) => {
    if (isLogisticsValidated) return;
    const updatedItem = { ...itemToUpdate, status: newStatus };
    setEventChecklistItems(prevItems =>
      prevItems.map(item => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  const handleRiderStatusChange = (itemToUpdate: EventChecklistItem) => {
    if (isLogisticsValidated) return;
    const newStatus = itemToUpdate.status === ChecklistItemStatus.FAIT ? ChecklistItemStatus.A_FAIRE : ChecklistItemStatus.FAIT;
    handleStatusChange(itemToUpdate, newStatus);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let itemToSave: EventChecklistItem = {
        ...(currentItem as Omit<EventChecklistItem, 'id'>),
        eventId: eventId,
        id: (currentItem as EventChecklistItem).id || generateId(),
    };

    if (isRider && !isEditing) {
        itemToSave = {
            ...itemToSave,
            responsiblePerson: riderName,
            assignedRole: ChecklistRole.COUREUR,
        };
    }

    setEventChecklistItems(prevItems => {
      if (isEditing) {
        return prevItems.map(item => item.id === itemToSave.id ? itemToSave : item);
      } else {
        return [...prevItems, itemToSave];
      }
    });
    
    setIsModalOpen(false);
  };

  const openAddModal = () => {
    setCurrentItem(initialChecklistItemFormStateFactory(eventId));
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: EventChecklistItem) => {
    setCurrentItem(item);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (itemId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet élément de la checklist ?")) {
      setEventChecklistItems(prevItems => prevItems.filter(item => item.id !== itemId));
    }
  };
  
  const getStatusColor = (status: ChecklistItemStatus) => {
     switch (status) {
      case ChecklistItemStatus.FAIT: return 'bg-green-100 text-green-800';
      case ChecklistItemStatus.EN_COURS: return 'bg-blue-100 text-blue-800';
      case ChecklistItemStatus.A_FAIRE: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSimulateEmailSend = () => {
    console.log(`--- Simulation d'envoi d'emails pour l'événement: ${event.name} ---`);
    setSimulationMessage(null);
    let messages: string[] = [];

    const staffForEvent = appState.staff.filter(s => event.selectedStaffIds.includes(s.id));

    staffForEvent.forEach(staffMember => {
        if (!staffMember.email) {
            console.warn(`Membre du staff ${staffMember.firstName} ${staffMember.lastName} n'a pas d'email renseigné.`);
            messages.push(`Alerte: ${staffMember.firstName} ${staffMember.lastName} (${staffMember.role}) n'a pas d'email.`);
            return;
        }

        const checklistRoleForStaff = mapStaffRoleToChecklistRole(staffMember.role);
        
        const tasksForStaff = checklistItemsForEvent.filter(item => 
            item.assignedRole === checklistRoleForStaff && 
            item.status !== ChecklistItemStatus.FAIT
        );
        
        if (tasksForStaff.length > 0) {
            let emailBody = `Bonjour ${staffMember.firstName} ${staffMember.lastName},\n\nVoici votre checklist pour l'événement "${event.name}" (Rappel J-2) :\n`;
            tasksForStaff.forEach(task => {
                emailBody += `  - ${task.itemName} (Statut: ${task.status})\n`;
                if(task.notes) emailBody += `    Notes: ${task.notes}\n`;
            });
            emailBody += "\nMerci de vérifier et compléter ces tâches.\n\nCordialement,\nLogiCycle System";
            
            console.log(`EMAIL À: ${staffMember.email}\nSUJET: Checklist pour ${event.name}\n\n${emailBody}\n----------------------------------`);
            messages.push(`Email (simulé) préparé pour ${staffMember.firstName} ${staffMember.lastName} (${staffMember.email}) avec ${tasksForStaff.length} tâche(s).`);
        } else {
            messages.push(`Aucune tâche active assignée à ${staffMember.firstName} ${staffMember.lastName} (${staffMember.role}) pour cet événement.`);
        }
    });
    
    if (messages.length === 0) messages.push("Aucun staff sélectionné pour cet événement ou aucune tâche à assigner.");
    
    updateEvent({ ...event, checklistEmailSimulated: true });
    setSimulationMessage(`Simulation terminée. ${messages.join(' ')} (Détails dans la console).`);
    setTimeout(() => setSimulationMessage(null), 10000);
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h3 className="text-xl font-semibold text-gray-700">Checklist pour {event.name}</h3>
        <div className="flex flex-wrap gap-2">
          {!isRider && (
            <ActionButton onClick={handleLoadFromTemplate} variant="secondary" size="sm" icon={<DownloadIcon className="w-4 h-4"/>} disabled={isLogisticsValidated}>
              Charger depuis Modèle
            </ActionButton>
          )}
          <ActionButton onClick={openAddModal} icon={<PlusCircleIcon className="w-5 h-5"/>} size="sm" disabled={isLogisticsValidated}>
            {isRider ? "Ajouter Tâche Perso" : "Ajouter Élément Manuel"}
          </ActionButton>
          {!isRider && (
            <>
              <ActionButton 
                onClick={handleSimulateEmailSend} 
                variant="warning" 
                size="sm"
                icon={<MailIcon className="w-4 h-4"/>}
                title="Simule l'envoi des tâches par email au staff concerné (type rappel J-2)"
                disabled={isLogisticsValidated}
              >
                Simuler Envoi Emails
              </ActionButton>
              <ActionButton
                onClick={handleValidateLogistics}
                disabled={!allTasksDone || isLogisticsValidated}
                variant="primary"
                size="sm"
                title={!allTasksDone ? "Toutes les tâches doivent être 'Fait' pour valider." : (isLogisticsValidated ? "Logistique déjà validée." : "Valider la logistique de l'événement.")}
              >
                Valider la Logistique
              </ActionButton>
            </>
          )}
        </div>
      </div>
      {isLogisticsValidated && (
        <div className="mb-3 p-2 text-sm bg-green-50 text-green-700 rounded border border-green-200">
            ✓ Logistique validée le {new Date(event.logisticsValidationDate!).toLocaleString('fr-FR')}. La checklist est verrouillée.
        </div>
      )}
      {simulationMessage && (
        <div className="mb-3 p-2 text-sm bg-blue-50 text-blue-200 rounded border border-blue-200">
            {simulationMessage}
        </div>
      )}

      {checklistItemsForEvent.length === 0 ? (
        <p className="text-gray-500 italic p-4 bg-gray-50 rounded-md border text-center">
            {isRider ? "Aucune tâche pour vous dans cette checklist. Ajoutez vos tâches personnelles si besoin." : "Aucun élément dans la checklist. Chargez les tâches depuis un modèle ou ajoutez-les manuellement."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          {isRider ? (
             <table className="min-w-full bg-white text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="py-2 px-3 w-12 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fait</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Élément</th>
                        <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {checklistItemsForEvent.map(item => (
                    <tr key={item.id} className={`transition-colors ${item.status === ChecklistItemStatus.FAIT ? 'bg-green-50 text-gray-500' : 'hover:bg-gray-50'}`}>
                      <td className="py-3 px-3 text-center">
                        <input
                            type="checkbox"
                            checked={item.status === ChecklistItemStatus.FAIT}
                            onChange={() => handleRiderStatusChange(item)}
                            disabled={isLogisticsValidated}
                            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            aria-label={`Marquer comme fait : ${item.itemName}`}
                        />
                      </td>
                      <td className={`py-3 px-3 font-medium ${item.status === ChecklistItemStatus.FAIT ? 'line-through' : 'text-gray-800'}`}>{item.itemName}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-right space-x-1">
                        {item.responsiblePerson === riderName && (
                          <>
                            <ActionButton onClick={() => openEditModal(item)} variant="secondary" size="sm" icon={<PencilIcon className="w-3 h-3"/>} disabled={isLogisticsValidated}><span className="sr-only">Modifier</span></ActionButton>
                            <ActionButton onClick={() => handleDelete(item.id)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3"/>} disabled={isLogisticsValidated}><span className="sr-only">Supprimer</span></ActionButton>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          ) : (
            <table className="min-w-full bg-white text-sm">
                <thead className="bg-gray-100">
                <tr>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Élément</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle Assigné</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable (Nom)</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {checklistItemsForEvent.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-gray-800">{item.itemName}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-gray-700">{item.assignedRole || <span className="italic text-gray-400">Général</span>}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-gray-700">{item.responsiblePerson || '-'}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                            {item.status}
                        </span>
                    </td>
                    <td className="py-3 px-3 text-gray-700 max-w-xs truncate" title={item.notes || ''}>{item.notes || '-'}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-right space-x-1">
                        <ActionButton onClick={() => openEditModal(item)} variant="secondary" size="sm" icon={<PencilIcon className="w-3 h-3"/>} disabled={isLogisticsValidated}><span className="sr-only">Modifier</span></ActionButton>
                        <ActionButton onClick={() => handleDelete(item.id)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3"/>} disabled={isLogisticsValidated}><span className="sr-only">Supprimer</span></ActionButton>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Modifier Élément Checklist" : "Ajouter Élément Checklist"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="itemNameModal" className="block text-sm font-medium text-gray-700">Nom de l'élément</label>
            <input type="text" name="itemName" id="itemNameModal" value={(currentItem as EventChecklistItem).itemName} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          {!isRider && (
            <>
                <div>
                    <label htmlFor="assignedRoleModal" className="block text-sm font-medium text-gray-700">Assigner à un Rôle (optionnel)</label>
                    <select 
                        name="assignedRole" 
                        id="assignedRoleModal" 
                        value={(currentItem as EventChecklistItem).assignedRole || ''} 
                        onChange={handleInputChange} 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="">Non assigné / Général</option>
                        {Object.values(ChecklistRole).map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="responsiblePersonModal" className="block text-sm font-medium text-gray-700">Responsable (Nom - optionnel)</label>
                    <input type="text" name="responsiblePerson" id="responsiblePersonModal" value={(currentItem as EventChecklistItem).responsiblePerson || ''} onChange={handleInputChange} placeholder="Nom du contact direct si besoin" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
            </>
          )}
          <div>
            <label htmlFor="statusModal" className="block text-sm font-medium text-gray-700">Statut</label>
            <select name="status" id="statusModal" value={(currentItem as EventChecklistItem).status} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              {Object.values(ChecklistItemStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="notesModalChecklist" className="block text-sm font-medium text-gray-700">Notes (optionnel)</label>
            <textarea name="notes" id="notesModalChecklist" value={(currentItem as EventChecklistItem).notes || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <ActionButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</ActionButton>
            <ActionButton type="submit">{isEditing ? "Sauvegarder" : "Ajouter"}</ActionButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventChecklistTab;
