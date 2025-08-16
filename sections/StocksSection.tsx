import React, { useState, useMemo } from 'react';
import { StockItem, StockCategory, StaffMember, StaffRole } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import SearchIcon from '../components/icons/SearchIcon';
import XCircleIcon from '../components/icons/XCircleIcon';
import CircleStackIcon from '../components/icons/CircleStackIcon';
import ConfirmationModal from '../components/ConfirmationModal';

interface StocksSectionProps {
  stockItems: StockItem[];
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  staff: StaffMember[];
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const initialStockItemFormState: Omit<StockItem, 'id'> = {
  name: '',
  quantity: 0,
  unit: 'unités',
  lowStockThreshold: 10,
  category: StockCategory.BOISSONS,
  notes: '',
};

const StocksSection: React.FC<StocksSectionProps> = ({ stockItems, setStockItems, staff }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Omit<StockItem, 'id'> | StockItem>(initialStockItemFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<StockCategory | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof StockItem | 'status', direction: 'ascending' | 'descending' } | null>({ key: 'status', direction: 'descending' });
  const [notifications, setNotifications] = useState<{ id: number, message: string }[]>([]);

  const getStatus = (item: StockItem): { text: string; colorClass: string } => {
    if (item.quantity <= 0) {
      return { text: 'Épuisé', colorClass: 'bg-red-100 text-red-800' };
    }
    if (item.quantity <= item.lowStockThreshold) {
      return { text: 'Faible', colorClass: 'bg-yellow-100 text-yellow-800' };
    }
    return { text: 'OK', colorClass: 'bg-green-100 text-green-800' };
  };
  
  const getQuantityBarColor = (item: StockItem): string => {
    if (item.quantity <= 0) return 'bg-red-500';
    if (item.quantity <= item.lowStockThreshold) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  const getStockLevelPercentage = (item: StockItem) => {
    const fullStockLevel = item.lowStockThreshold * 3;
    if (fullStockLevel <= 0) return item.quantity > 0 ? 100 : 0;
    return Math.min(100, (item.quantity / fullStockLevel) * 100);
  };

  const requestSort = (key: keyof StockItem | 'status') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof StockItem | 'status') => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  const sortedItems = useMemo(() => {
    let sortableItems = [...stockItems].filter(item => 
        (item.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (categoryFilter === 'all' || item.category === categoryFilter)
    );
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any, bValue: any;
        if (sortConfig.key === 'status') {
            const statusOrder = { 'Épuisé': 0, 'Faible': 1, 'OK': 2 };
            aValue = statusOrder[getStatus(a).text];
            bValue = statusOrder[getStatus(b).text];
        } else {
            aValue = a[sortConfig.key as keyof StockItem];
            bValue = b[sortConfig.key as keyof StockItem];
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [stockItems, searchTerm, categoryFilter, sortConfig]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setCurrentItem(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && 'id' in currentItem) {
      setStockItems(prev => prev.map(item => item.id === currentItem.id ? currentItem : item));
    } else {
      setStockItems(prev => [...prev, { ...currentItem, id: generateId() } as StockItem]);
    }
    setIsModalOpen(false);
  };

  const openAddModal = () => {
    setCurrentItem(initialStockItemFormState);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: StockItem) => {
    setCurrentItem(item);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (item: StockItem) => {
    setItemToDelete(item);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setStockItems(prev => prev.filter(item => item.id !== itemToDelete.id));
      setItemToDelete(null);
    }
  };

  const handleQuantityChange = (itemId: string, change: number) => {
    const itemToUpdate = stockItems.find(item => item.id === itemId);
    if (!itemToUpdate) return;
    
    const oldQuantity = itemToUpdate.quantity;
    const newQuantity = Math.max(0, oldQuantity + change);
    
    if (newQuantity <= itemToUpdate.lowStockThreshold && oldQuantity > itemToUpdate.lowStockThreshold) {
      const assistants = staff.filter(s => s.role === StaffRole.ASSISTANT);
      const assistantNames = assistants.length > 0 ? assistants.map(a => `${a.firstName} ${a.lastName}`).join(', ') : "aucun assistant configuré";
      
      const message = `Alerte stock faible: "${itemToUpdate.name}" (${newQuantity} restants). Notification (simulée) envoyée à: ${assistantNames}.`;
      
      const newNotification = { id: Date.now(), message };
      setNotifications(prev => [...prev, newNotification]);
      
      setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 10000);
    }

    setStockItems(prevItems => 
        prevItems.map(item => 
            item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
    );
  };
  
  const thClasses = "py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none";

  return (
    <SectionWrapper title="Gestion des Stocks" actionButton={<ActionButton onClick={openAddModal} icon={<PlusCircleIcon className="w-5 h-5"/>}>Ajouter Article</ActionButton>}>
        <div className="fixed top-24 right-6 w-full max-w-sm z-50 space-y-3">
            {notifications.map(notification => (
                <div key={notification.id} className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-lg shadow-lg flex justify-between items-start animate-fade-in-right">
                    <p className="text-sm font-medium">{notification.message}</p>
                    <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))} className="ml-4 -mt-1 -mr-1 text-yellow-600 hover:text-yellow-800" aria-label="Fermer la notification">
                        <XCircleIcon className="w-5 h-5" />
                    </button>
                </div>
            ))}
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg shadow-sm border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-end">
                <div>
                    <label htmlFor="stockSearch" className="block text-sm font-medium text-gray-700">Rechercher un article</label>
                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" id="stockSearch" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pack d'eau, Coca..." className="block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                </div>
                <div>
                    <label htmlFor="stockCategoryFilter" className="block text-sm font-medium text-gray-700">Filtrer par catégorie</label>
                    <select id="stockCategoryFilter" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        <option value="all">Toutes les catégories</option>
                        {Object.values(StockCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead className="bg-gray-100">
                    <tr>
                        <th className={thClasses} onClick={() => requestSort('name')}>Article {getSortIndicator('name')}</th>
                        <th className={thClasses} onClick={() => requestSort('category')}>Catégorie {getSortIndicator('category')}</th>
                        <th className={`${thClasses} text-center`} onClick={() => requestSort('quantity')}>Quantité {getSortIndicator('quantity')}</th>
                        <th className={`${thClasses} text-center`}>Seuil d'Alerte</th>
                        <th className={`${thClasses} text-center`} onClick={() => requestSort('status')}>Statut {getSortIndicator('status')}</th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {sortedItems.length > 0 ? (
                    sortedItems.map(item => {
                        const status = getStatus(item);
                        const stockPercentage = getStockLevelPercentage(item);
                        return (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="font-semibold text-gray-800">{item.name}</div>
                                    <div className="text-xs text-gray-500">{item.notes}</div>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap text-gray-600">{item.category}</td>
                                <td className="py-3 px-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                      <ActionButton aria-label={`Diminuer la quantité de ${item.name}`} onClick={() => handleQuantityChange(item.id, -1)} size="sm" variant="secondary" className="!p-1.5 !w-7 !h-7 rounded-full leading-none">-</ActionButton>
                                      <div className="w-24">
                                          <div className="font-bold text-lg text-gray-800">{item.quantity} <span className="text-sm font-normal text-gray-500">{item.unit}</span></div>
                                          <div className="w-full bg-gray-200 rounded-full h-1 mt-1" title={`Niveau de stock: ${stockPercentage.toFixed(0)}%`}>
                                            <div className={`${getQuantityBarColor(item)} h-1 rounded-full`} style={{ width: `${stockPercentage}%` }}></div>
                                          </div>
                                      </div>
                                      <ActionButton aria-label={`Augmenter la quantité de ${item.name}`} onClick={() => handleQuantityChange(item.id, 1)} size="sm" variant="secondary" className="!p-1.5 !w-7 !h-7 rounded-full leading-none">+</ActionButton>
                                    </div>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap text-center text-gray-600">{item.lowStockThreshold}</td>
                                <td className="py-3 px-4 whitespace-nowrap text-center">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.colorClass}`}>{status.text}</span>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap text-right space-x-2">
                                    <ActionButton onClick={() => openEditModal(item)} variant="secondary" size="sm" icon={<PencilIcon className="w-4 h-4"/>}/>
                                    <ActionButton onClick={() => handleDelete(item)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4"/>}/>
                                </td>
                            </tr>
                        )
                    })
                ) : (
                    <tr>
                        <td colSpan={6}>
                            <div className="text-center py-10 bg-white rounded-lg">
                                <CircleStackIcon className="mx-auto h-12 w-12 text-gray-300" />
                                <h3 className="mt-2 text-md font-medium text-gray-800">Aucun article trouvé</h3>
                                <p className="mt-1 text-sm text-gray-500">Aucun article en stock ou correspondant aux filtres.</p>
                            </div>
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
        
        {itemToDelete && (
            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDelete}
                title={`Supprimer "${itemToDelete.name}"`}
                message="Êtes-vous sûr de vouloir supprimer cet article du stock ? Cette action est irréversible."
            />
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Modifier l'Article" : "Ajouter un Article"}>
            <div className="bg-slate-800 text-white p-4 -m-6 rounded-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300">Nom de l'article</label>
                      <input type="text" name="name" value={currentItem.name} onChange={handleInputChange} required className="input-field-sm"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300">Catégorie</label>
                        <select name="category" value={currentItem.category} onChange={handleInputChange} className="input-field-sm">
                            {Object.values(StockCategory).map(cat => <option key={cat} value={cat} className="bg-slate-700">{cat}</option>)}
                        </select>
                    </div>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-300">Quantité Actuelle</label>
                        <input type="number" name="quantity" value={currentItem.quantity} onChange={handleInputChange} required className="input-field-sm"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300">Unité</label>
                        <input type="text" name="unit" value={currentItem.unit} onChange={handleInputChange} required placeholder="packs, bouteilles..." className="input-field-sm"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300">Seuil d'Alerte</label>
                        <input type="number" name="lowStockThreshold" value={currentItem.lowStockThreshold} onChange={handleInputChange} required className="input-field-sm"/>
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300">Notes</label>
                    <textarea name="notes" value={currentItem.notes || ''} onChange={handleInputChange} rows={2} className="input-field-sm w-full" placeholder="Ex: Marque, fournisseur..."></textarea>
                  </div>
                <div className="flex justify-end space-x-2 pt-3">
                    <ActionButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</ActionButton>
                    <ActionButton type="submit">{isEditing ? "Sauvegarder" : "Ajouter"}</ActionButton>
                </div>
                </form>
            </div>
        </Modal>
    </SectionWrapper>
  );
};

export default StocksSection;