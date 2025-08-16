
import React, { useState, useEffect } from 'react';
import { ChecklistTemplate, ChecklistRole, User, TeamRole } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import ConfirmationModal from '../components/ConfirmationModal';

interface ChecklistSectionProps {
  checklistTemplates: Record<ChecklistRole, ChecklistTemplate[]>;
  setChecklistTemplates: React.Dispatch<React.SetStateAction<Record<ChecklistRole, ChecklistTemplate[]>>>;
  currentUser: User;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({ checklistTemplates, setChecklistTemplates, currentUser }) => {
  const isRider = currentUser.permissionRole === TeamRole.VIEWER;
  const [activeRole, setActiveRole] = useState<ChecklistRole>(isRider ? ChecklistRole.COUREUR : ChecklistRole.DS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<ChecklistTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ onConfirm: () => void } | null>(null);

  useEffect(() => {
    if (isRider) {
      setActiveRole(ChecklistRole.COUREUR);
    }
  }, [isRider]);

  const handleAddTask = () => {
    setCurrentItem({ id: '', name: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: ChecklistTemplate) => {
    setCurrentItem(task);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setConfirmAction({
      onConfirm: () => {
        setChecklistTemplates(prevTemplates => ({
          ...prevTemplates,
          [activeRole]: (prevTemplates[activeRole] || []).filter(task => task.id !== taskId)
        }));
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || !currentItem.name) return;

    if (isEditing) {
      setChecklistTemplates(prev => ({
        ...prev,
        [activeRole]: (prev[activeRole] || []).map(task =>
          task.id === currentItem.id ? currentItem : task
        ),
      }));
    } else {
      setChecklistTemplates(prev => ({
        ...prev,
        [activeRole]: [...(prev[activeRole] || []), { ...currentItem, id: generateId() }],
      }));
    }
    setIsModalOpen(false);
    setCurrentItem(null);
  };
  
  const tasksForActiveRole = checklistTemplates[activeRole] || [];

  const tabButtonStyle = (role: ChecklistRole) => 
    `px-3 py-2 font-medium text-sm rounded-t-md whitespace-nowrap transition-colors duration-150 focus:outline-none ${
      activeRole === role 
        ? 'bg-white text-gray-800 border-b-2 border-blue-500 shadow-sm' 
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
    }`;

  const sectionTitle = isRider ? "Ma Checklist Modèle (Coureur)" : "Éditeur de Checklists Modèles";
  
  return (
    <SectionWrapper 
      title={sectionTitle}
      actionButton={
        <ActionButton onClick={handleAddTask} icon={<PlusCircleIcon className="w-5 h-5"/>}>
          Ajouter Tâche Modèle
        </ActionButton>
      }
    >
      {!isRider ? (
        <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
            {Object.values(ChecklistRole).map(role => (
                <button key={role} onClick={() => setActiveRole(role)} className={tabButtonStyle(role)}>
                {role}
                </button>
            ))}
            </nav>
        </div>
      ) : (
          <p className="mb-4 text-sm text-gray-500">
              Personnalisez ici la liste de tâches modèle qui sera chargée pour vous lors de la création d'un nouvel événement.
          </p>
      )}


      <div className="bg-white p-4 rounded-b-lg">
        {tasksForActiveRole.length === 0 ? (
          <p className="text-gray-500 italic">Aucune tâche modèle pour le rôle {activeRole}.</p>
        ) : (
          <ul className="space-y-2">
            {tasksForActiveRole.map(task => (
              <li key={task.id} className="p-2 bg-gray-50 rounded-md flex justify-between items-center">
                <span className="text-gray-800">{task.name}</span>
                <div className="space-x-2">
                  <ActionButton onClick={() => handleEditTask(task)} variant="secondary" size="sm" icon={<PencilIcon className="w-4 h-4"/>}>Modifier</ActionButton>
                  <ActionButton onClick={() => handleDeleteTask(task.id)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4"/>}>Supprimer</ActionButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Modifier Tâche Modèle" : "Ajouter Tâche Modèle"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">Nom de la tâche</label>
            <input 
              type="text" 
              id="itemName"
              value={currentItem?.name || ''} 
              onChange={e => setCurrentItem(prev => prev ? {...prev, name: e.target.value} : null)}
              required 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
            />
          </div>
          <div className="text-sm text-gray-500">
            Cette tâche sera ajoutée à la liste modèle pour le rôle: <strong>{activeRole}</strong>.
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <ActionButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</ActionButton>
            <ActionButton type="submit">{isEditing ? "Sauvegarder" : "Ajouter"}</ActionButton>
          </div>
        </form>
      </Modal>

      {confirmAction && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={confirmAction.onConfirm}
          title="Confirmer la suppression"
          message="Êtes-vous sûr de vouloir supprimer cette tâche du modèle ?"
        />
      )}

    </SectionWrapper>
  );
};
