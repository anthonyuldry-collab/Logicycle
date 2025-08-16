

import React, { useState } from 'react';
import { EventBudgetItem, BudgetItemCategory } from '../types'; // Changed BudgetItem to EventBudgetItem
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import InformationCircleIcon from '../components/icons/InformationCircleIcon'; // Kept for general notes visibility
import { useTranslations } from '../hooks/useTranslations';

interface BudgetSectionProps {
  budgetItems: EventBudgetItem[]; // Changed BudgetItem to EventBudgetItem
  setBudgetItems: React.Dispatch<React.SetStateAction<EventBudgetItem[]>>; // Changed BudgetItem to EventBudgetItem
  eventId?: string; // Optional: for context
}

const initialBudgetFormStateFactory = (eventId?: string): Omit<EventBudgetItem, 'id'> => ({
  eventId: eventId || '',
  category: BudgetItemCategory.FRAIS_DIVERS,
  description: '',
  estimatedCost: 0,
  actualCost: undefined,
  notes: '',
});

const BudgetSection: React.FC<BudgetSectionProps> = ({ budgetItems, setBudgetItems, eventId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Omit<EventBudgetItem, 'id'> | EventBudgetItem>(initialBudgetFormStateFactory(eventId));
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useTranslations();

  // Removed useEffect for initialCarBudgetItem as this is a global/multi-event view.
  // Specific default items should be handled during event creation or in an event-specific tab.

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setCurrentItem(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalItemInput = {...currentItem};
    if (finalItemInput.actualCost === undefined || isNaN(Number(finalItemInput.actualCost)) || String(finalItemInput.actualCost).trim() === '') {
        finalItemInput.actualCost = undefined;
    } else {
        finalItemInput.actualCost = Number(finalItemInput.actualCost);
    }
    
    const itemToSave: EventBudgetItem = {
        ...(finalItemInput as Omit<EventBudgetItem, 'id'>),
        eventId: (finalItemInput as EventBudgetItem).eventId || eventId || 'unknown_event_id',
        id: (finalItemInput as EventBudgetItem).id || Date.now().toString() + Math.random().toString(36).substring(2,9),
    };


    if (isEditing && 'id' in itemToSave) { // Check itemToSave for id
      setBudgetItems(prevItems => prevItems.map(item => item.id === itemToSave.id ? itemToSave : item));
    } else {
      setBudgetItems(prevItems => [...prevItems, itemToSave]);
    }
    setIsModalOpen(false);
    setCurrentItem(initialBudgetFormStateFactory(eventId));
    setIsEditing(false);
  };

  const openAddModal = () => {
    setCurrentItem(initialBudgetFormStateFactory(eventId));
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: EventBudgetItem) => {
    setCurrentItem(item);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (itemId: string) => {
    if (window.confirm(t('budgetConfirmDelete'))) {
         setBudgetItems(prevItems => prevItems.filter(item => item.id !== itemId));
    }
  };
  
  const itemsToDisplay = eventId ? budgetItems.filter(item => item.eventId === eventId) : budgetItems;
  const totalEstimated = itemsToDisplay.reduce((sum, item) => sum + item.estimatedCost, 0);
  const totalActual = itemsToDisplay.reduce((sum, item) => sum + (item.actualCost || 0), 0);

  return (
    <SectionWrapper 
      title={`Budget Prévisionnel ${eventId ? '(Événement Spécifique)' : '(Tous Événements)'}`}
      actionButton={
        <ActionButton onClick={openAddModal} icon={<PlusCircleIcon className="w-5 h-5"/>}>
          Ajouter Ligne Budgétaire
        </ActionButton>
      }
    >
      {itemsToDisplay.length === 0 ? (
        <p className="text-gray-500 italic">Aucune ligne budgétaire ajoutée {eventId ? 'pour cet événement' : ''}.</p>
      ) : (
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                {!eventId && <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Événement ID</th>}
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Coût Estimé (€)</th>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Coût Réel (€)</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {itemsToDisplay.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors`}>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">{item.description}</td>
                  {!eventId && <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">{item.eventId}</td>}
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500 text-right">{item.estimatedCost.toFixed(2)}</td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500 text-right">{item.actualCost !== undefined ? item.actualCost.toFixed(2) : '-'}</td>
                  <td className="py-4 px-6 text-sm text-gray-500 max-w-xs truncate" title={item.notes || ''}>
                    {/* Generic info icon can be used if item.notes has significant content, or for other flags */}
                    {item.notes && item.notes.length > 30 && <InformationCircleIcon className="w-4 h-4 inline mr-1 text-blue-500" />}
                    {item.notes}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-right space-x-2">
                    <ActionButton onClick={() => openEditModal(item)} variant="secondary" size="sm" icon={<PencilIcon className="w-4 h-4"/>}>
                      Modifier
                    </ActionButton>
                    <ActionButton onClick={() => handleDelete(item.id)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4"/>}>
                      Supprimer
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <td colSpan={!eventId ? 3 : 2} className="py-3 px-6 text-right text-sm font-bold text-gray-700">TOTAL</td>
                <td className="py-3 px-6 text-right text-sm font-bold text-gray-700">{totalEstimated.toFixed(2)} €</td>
                <td className="py-3 px-6 text-right text-sm font-bold text-gray-700">{totalActual > 0 || itemsToDisplay.some(i => i.actualCost !== undefined) ? totalActual.toFixed(2) + ' €' : '-'}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Modifier Ligne Budgétaire" : "Ajouter Ligne Budgétaire"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Catégorie</label>
            <select name="category" id="category" value={(currentItem as EventBudgetItem).category} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              {(Object.values(BudgetItemCategory) as BudgetItemCategory[]).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <input type="text" name="description" id="description" value={(currentItem as EventBudgetItem).description} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700">Coût Estimé (€)</label>
              <input type="number" name="estimatedCost" id="estimatedCost" value={(currentItem as EventBudgetItem).estimatedCost} onChange={handleInputChange} step="0.01" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="actualCost" className="block text-sm font-medium text-gray-700">Coût Réel (€) (optionnel)</label>
              <input type="number" name="actualCost" id="actualCost" value={(currentItem as EventBudgetItem).actualCost === undefined ? '' : (currentItem as EventBudgetItem).actualCost} onChange={handleInputChange} step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea name="notes" id="notes" value={(currentItem as EventBudgetItem).notes || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          {!eventId && (currentItem as Omit<EventBudgetItem, 'id'>).eventId === '' && (
            <div>
              <label htmlFor="eventIdModal" className="block text-sm font-medium text-gray-700">ID Événement (si applicable globalement)</label>
              <input 
                type="text" 
                name="eventId" 
                id="eventIdModal" 
                value={(currentItem as EventBudgetItem).eventId || ''} 
                onChange={handleInputChange} 
                placeholder="ID de l'événement lié"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
              />
            </div>
           )}
          <div className="flex justify-end space-x-3 pt-4">
            <ActionButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</ActionButton>
            <ActionButton type="submit">{isEditing ? "Sauvegarder" : "Ajouter"}</ActionButton>
          </div>
        </form>
      </Modal>
    </SectionWrapper>
  );
};

export default BudgetSection;