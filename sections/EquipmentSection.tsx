import React, { useState, useMemo, useEffect } from 'react';
import { 
    EquipmentItem, EquipmentType, EquipmentStatus, Rider, PeripheralComponent, BikeSetup, BikeSpecificMeasurements, BikeFitMeasurements, User, TeamRole,
    EquipmentStockItem, EquipmentStockCategory
} from '../types';
import { initialEquipmentFormState, EQUIPMENT_TYPE_COLORS, EQUIPMENT_STATUS_COLORS, BIKE_SETUP_SPECIFIC_FIELDS, BIKE_SETUP_COTES_FIELDS } from '../constants';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import UploadIcon from '../components/icons/UploadIcon';
import SearchIcon from '../components/icons/SearchIcon';
import WrenchScrewdriverIcon from '../components/icons/WrenchScrewdriverIcon';
import ConfirmationModal from '../components/ConfirmationModal';
import { useTranslations } from '../hooks/useTranslations';

interface EquipmentSectionProps {
  equipment: EquipmentItem[];
  setEquipment: React.Dispatch<React.SetStateAction<EquipmentItem[]>>;
  riders: Rider[]; 
  setRiders: React.Dispatch<React.SetStateAction<Rider[]>>;
  currentUser: User;
  equipmentStockItems: EquipmentStockItem[];
  setEquipmentStockItems: React.Dispatch<React.SetStateAction<EquipmentStockItem[]>>;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const initialEquipmentStockItemFormState: Omit<EquipmentStockItem, 'id'> = {
    name: '',
    quantity: 0,
    unit: 'pièce',
    lowStockThreshold: 2,
    category: EquipmentStockCategory.CONSOMMABLES,
    reference: '',
    brand: '',
    notes: '',
};

const EquipmentSection: React.FC<EquipmentSectionProps> = ({ 
    equipment, setEquipment, riders, setRiders, currentUser,
    equipmentStockItems, setEquipmentStockItems 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Omit<EquipmentItem, 'id'> | EquipmentItem>(initialEquipmentFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<EquipmentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');
  
  const [activeEquipmentTab, setActiveEquipmentTab] = useState<'general' | 'stock' | 'riderSpecific'>('general');
  
  // State for stock management
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [currentStockItem, setCurrentStockItem] = useState<Omit<EquipmentStockItem, 'id'> | EquipmentStockItem>(initialEquipmentStockItemFormState);
  const [isEditingStockItem, setIsEditingStockItem] = useState(false);
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState<EquipmentStockCategory | 'all'>('all');
  const [stockSortConfig, setStockSortConfig] = useState<{ key: string, direction: 'ascending' | 'descending' } | null>(null);
  const [stockItemToDelete, setStockItemToDelete] = useState<EquipmentStockItem | null>(null);


  const [selectedRiderForSetup, setSelectedRiderForSetup] = useState<string>('');
  const [currentBikeSetup, setCurrentBikeSetup] = useState<{ roadBikeSetup?: BikeSetup, ttBikeSetup?: BikeSetup }>({});
  const { t } = useTranslations();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: name === 'purchasePrice' ? (value === '' ? undefined : parseFloat(value)) : value
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCurrentItem(prev => ({ ...prev, photoUrl: result }));
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setCurrentItem(prev => ({ ...prev, photoUrl: undefined }));
    setPhotoPreview(null);
    const fileInput = document.getElementById('equipmentPhotoUpload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleComponentChange = (index: number, field: keyof PeripheralComponent, value: string) => {
    const updatedComponents = [...(currentItem.components || [])];
    if (updatedComponents[index]) {
        (updatedComponents[index] as any)[field] = value;
        setCurrentItem(prev => ({ ...prev, components: updatedComponents }));
    }
  };

  const addComponent = () => {
    const newComponent: PeripheralComponent = { id: generateId(), name: '', type: '' };
    setCurrentItem(prev => ({ ...prev, components: [...(prev.components || []), newComponent] }));
  };

  const removeComponent = (idToRemove: string) => {
    if (window.confirm(t('equipmentConfirmDeleteComponent'))) {
      setCurrentItem(prev => ({ ...prev, components: (prev.components || []).filter(comp => comp.id !== idToRemove) }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && 'id' in currentItem) {
      setEquipment(prevEquipment => prevEquipment.map(eq => eq.id === (currentItem as EquipmentItem).id ? (currentItem as EquipmentItem) : eq));
    } else {
      setEquipment(prevEquipment => [...prevEquipment, { ...currentItem, id: generateId() } as EquipmentItem]);
    }
    setIsModalOpen(false);
    setCurrentItem(initialEquipmentFormState);
    setPhotoPreview(null);
    setIsEditing(false);
  };

  const openAddModal = () => {
    setCurrentItem(initialEquipmentFormState);
    setPhotoPreview(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: EquipmentItem) => {
    setCurrentItem(item);
    setPhotoPreview(item.photoUrl || null);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (itemId: string) => {
    if (window.confirm(t('equipmentConfirmDelete'))) {
      setEquipment(prevEquipment => prevEquipment.filter(eq => eq.id !== itemId));
    }
  };
  
  const getRiderNameById = (riderId?: string) => {
    if (!riderId) return 'N/A';
    const rider = riders.find(r => r.id === riderId);
    return rider ? `${rider.firstName} ${rider.lastName}` : 'Coureur Inconnu';
  };

  const filteredEquipment = useMemo(() => {
    const riderForCurrentUser = riders.find(r => r.email === currentUser.email);
    const equipmentToDisplay = currentUser.permissionRole === TeamRole.VIEWER
        ? (riderForCurrentUser ? equipment.filter(eq => eq.assignedToRiderId === riderForCurrentUser.id) : [])
        : equipment;

    return equipmentToDisplay.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const typeMatch = typeFilter === 'all' || item.type === typeFilter;
        const statusMatch = statusFilter === 'all' || item.status === statusFilter;
        return nameMatch && typeMatch && statusMatch;
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [equipment, riders, currentUser, searchTerm, typeFilter, statusFilter]);

  useEffect(() => {
    if (selectedRiderForSetup) {
      const rider = riders.find(r => r.id === selectedRiderForSetup);
      setCurrentBikeSetup({
        roadBikeSetup: rider?.roadBikeSetup || { specifics: {}, cotes: {} },
        ttBikeSetup: rider?.ttBikeSetup || { specifics: {}, cotes: {} },
      });
    } else {
      setCurrentBikeSetup({});
    }
  }, [selectedRiderForSetup, riders]);

  const handleBikeSetupChange = (
    bikeType: 'roadBikeSetup' | 'ttBikeSetup',
    section: 'specifics' | 'cotes',
    field: keyof BikeSpecificMeasurements | keyof BikeFitMeasurements,
    value: string
  ) => {
    setCurrentBikeSetup(prev => ({
      ...prev,
      [bikeType]: {
        ...(prev[bikeType] || { specifics: {}, cotes: {} }),
        [section]: {
          ...((prev[bikeType] as BikeSetup)?.[section] || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleSaveBikeSetup = () => {
    if (!selectedRiderForSetup) return;
    setRiders(prevRiders =>
      prevRiders.map(r =>
        r.id === selectedRiderForSetup
          ? { ...r, ...currentBikeSetup }
          : r
      )
    );
    alert(t('equipmentBikeSetupSaved'));
  };
  
  // --- Stock Management Logic ---
  const getStockStatus = (item: EquipmentStockItem): { text: string; colorClass: string } => {
    if (item.quantity <= item.lowStockThreshold) return { text: 'Faible', colorClass: 'bg-red-200 text-red-800' };
    if (item.quantity <= item.lowStockThreshold * 1.5) return { text: 'Moyen', colorClass: 'bg-yellow-200 text-yellow-800' };
    return { text: 'OK', colorClass: 'bg-green-200 text-green-800' };
  };

  const requestStockSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (stockSortConfig && stockSortConfig.key === key && stockSortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setStockSortConfig({ key, direction });
  };
  
  const getStockSortIndicator = (key: string) => {
    if (!stockSortConfig || stockSortConfig.key !== key) return null;
    return stockSortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  const sortedStockItems = useMemo(() => {
    let sortableItems = [...equipmentStockItems].filter(item => 
      (item.name.toLowerCase().includes(stockSearchTerm.toLowerCase())) &&
      (stockCategoryFilter === 'all' || item.category === stockCategoryFilter)
    );

    if (stockSortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any, bValue: any;
        if (stockSortConfig.key === 'status') {
            aValue = getStockStatus(a).text;
            bValue = getStockStatus(b).text;
        } else {
            aValue = a[stockSortConfig.key as keyof EquipmentStockItem];
            bValue = b[stockSortConfig.key as keyof EquipmentStockItem];
        }

        if (aValue === undefined) aValue = '';
        if (bValue === undefined) bValue = '';
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return stockSortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            if (aValue < bValue) return stockSortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return stockSortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [equipmentStockItems, stockSearchTerm, stockCategoryFilter, stockSortConfig]);

  const handleStockInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setCurrentStockItem(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingStockItem && 'id' in currentStockItem) {
      setEquipmentStockItems(prev => prev.map(item => item.id === currentStockItem.id ? currentStockItem : item));
    } else {
      setEquipmentStockItems(prev => [...prev, { ...currentStockItem, id: generateId() } as EquipmentStockItem]);
    }
    setIsStockModalOpen(false);
  };
  
  const openAddStockModal = () => {
    setCurrentStockItem(initialEquipmentStockItemFormState);
    setIsEditingStockItem(false);
    setIsStockModalOpen(true);
  };

  const openEditStockModal = (item: EquipmentStockItem) => {
    setCurrentStockItem(item);
    setIsEditingStockItem(true);
    setIsStockModalOpen(true);
  };

  const handleDeleteStockItem = (item: EquipmentStockItem) => {
    setStockItemToDelete(item);
  };
  
  const confirmDeleteStockItem = () => {
    if(stockItemToDelete) {
        setEquipmentStockItems(prev => prev.filter(item => item.id !== stockItemToDelete.id));
        setStockItemToDelete(null);
    }
  };

  const handleStockQuantityChange = (itemId: string, change: number) => {
    const itemToUpdate = equipmentStockItems.find(item => item.id === itemId);
    if (!itemToUpdate) return;
    
    const oldQuantity = itemToUpdate.quantity;
    const newQuantity = Math.max(0, oldQuantity + change);
    
    if (newQuantity <= itemToUpdate.lowStockThreshold && oldQuantity > itemToUpdate.lowStockThreshold) {
      alert(`ALERTE STOCK FAIBLE: ${itemToUpdate.name} a atteint le niveau ${newQuantity} (seuil: ${itemToUpdate.lowStockThreshold}).`);
    }

    setEquipmentStockItems(prevItems => 
        prevItems.map(item => 
            item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
    );
  };

  const renderGeneralTab = () => (
    <>
        <div className="mb-6 p-4 bg-slate-700 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label htmlFor="searchTermEquipment" className="block text-sm font-medium text-slate-300 mb-1">Rechercher par Nom</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input type="text" id="searchTermEquipment" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Nom de l'équipement..." className="input-field-sm pl-10 text-sm" />
                    </div>
                </div>
                <div>
                    <label htmlFor="typeFilterEquipment" className="block text-sm font-medium text-slate-300 mb-1">Filtrer par Type</label>
                    <select id="typeFilterEquipment" value={typeFilter} onChange={e => setTypeFilter(e.target.value as EquipmentType | 'all')} className="input-field-sm text-sm">
                        <option value="all" className="bg-slate-700">Tous les types</option>
                        {Object.values(EquipmentType).map(type => <option key={type} value={type} className="bg-slate-700">{type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="statusFilterEquipment" className="block text-sm font-medium text-slate-300 mb-1">Filtrer par Statut</label>
                    <select id="statusFilterEquipment" value={statusFilter} onChange={e => setStatusFilter(e.target.value as EquipmentStatus | 'all')} className="input-field-sm text-sm">
                        <option value="all" className="bg-slate-700">Tous les statuts</option>
                        {Object.values(EquipmentStatus).map(status => <option key={status} value={status} className="bg-slate-700">{status}</option>)}
                    </select>
                </div>
            </div>
        </div>

        {filteredEquipment.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Aucun matériel ne correspond à vos critères.</p>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredEquipment.map(item => (
                <div key={item.id} className="bg-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
                <div className="relative h-40 bg-slate-700 flex items-center justify-center">
                    {item.photoUrl ? (
                    <img src={item.photoUrl} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                    <WrenchScrewdriverIcon className="w-20 h-20 text-slate-500" />
                    )}
                </div>
                <div className="p-3 flex-grow flex flex-col justify-between">
                    <div>
                        <h3 className="text-md font-semibold text-slate-100 truncate" title={item.name}>{item.name}</h3>
                        <div className="flex flex-wrap gap-1 mt-1 mb-1.5">
                            <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${EQUIPMENT_TYPE_COLORS[item.type]}`}>{item.type}</span>
                            <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${EQUIPMENT_STATUS_COLORS[item.status]}`}>{item.status}</span>
                        </div>
                        <p className="text-xs text-slate-400">Marque: {item.brand || 'N/A'}, Modèle: {item.model || 'N/A'}</p>
                        <p className="text-xs text-slate-400">N° Série: {item.serialNumber || 'N/A'}</p>
                        <p className="text-xs text-slate-400">Assigné à: {getRiderNameById(item.assignedToRiderId)}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-700 flex justify-end space-x-1">
                        <ActionButton onClick={() => openEditModal(item)} variant="secondary" size="sm" icon={<PencilIcon className="w-3 h-3"/>} title="Modifier"><span className="sr-only">Modifier</span></ActionButton>
                        <ActionButton onClick={() => handleDelete(item.id)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3"/>} title="Supprimer"><span className="sr-only">Supprimer</span></ActionButton>
                    </div>
                </div>
                </div>
            ))}
            </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Modifier Équipement" : "Ajouter Équipement"}>
            <div className="bg-slate-800 p-4 -m-6 rounded-lg">
                <form onSubmit={handleSubmit} className="space-y-4 text-slate-300 max-h-[calc(85vh - 120px)] overflow-y-auto p-1 pr-3">
                    <fieldset className="border border-slate-600 p-3 rounded-md">
                        <legend className="text-md font-medium text-slate-200 px-1">Informations Générales</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium">Nom / Descriptif</label>
                                <input type="text" name="name" id="name" value={currentItem.name} onChange={handleInputChange} required className="input-field-sm" />
                            </div>
                            <div>
                                <label htmlFor="type" className="block text-sm font-medium">Type d'équipement</label>
                                <select name="type" id="type" value={currentItem.type} onChange={handleInputChange} className="input-field-sm">
                                {Object.values(EquipmentType).map(type => <option key={type} value={type} className="bg-slate-700">{type}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="brand" className="block text-sm font-medium">Marque</label>
                                <input type="text" name="brand" id="brand" value={currentItem.brand || ''} onChange={handleInputChange} className="input-field-sm" />
                            </div>
                            <div>
                                <label htmlFor="model" className="block text-sm font-medium">Modèle</label>
                                <input type="text" name="model" id="model" value={currentItem.model || ''} onChange={handleInputChange} className="input-field-sm" />
                            </div>
                            <div>
                                <label htmlFor="size" className="block text-sm font-medium">Taille / Spéc.</label>
                                <input type="text" name="size" id="size" value={currentItem.size || ''} onChange={handleInputChange} placeholder="Ex: 54, M, 172.5mm" className="input-field-sm" />
                            </div>
                            <div>
                                <label htmlFor="serialNumber" className="block text-sm font-medium">Numéro de Série</label>
                                <input type="text" name="serialNumber" id="serialNumber" value={currentItem.serialNumber || ''} onChange={handleInputChange} className="input-field-sm" />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="border border-slate-600 p-3 rounded-md">
                        <legend className="text-md font-medium text-slate-200 px-1">Statut & Assignation</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium">Statut</label>
                                <select name="status" id="status" value={currentItem.status} onChange={handleInputChange} className="input-field-sm">
                                {Object.values(EquipmentStatus).map(status => <option key={status} value={status} className="bg-slate-700">{status}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="assignedToRiderId" className="block text-sm font-medium">Assigné à (Coureur)</label>
                                <select name="assignedToRiderId" id="assignedToRiderId" value={currentItem.assignedToRiderId || ''} onChange={handleInputChange} className="input-field-sm">
                                    <option value="" className="bg-slate-700">Non assigné</option>
                                    {riders.map(rider => <option key={rider.id} value={rider.id} className="bg-slate-700">{`${rider.firstName} ${rider.lastName}`}</option>)}
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="border border-slate-600 p-3 rounded-md">
                        <legend className="text-md font-medium text-slate-200 px-1">Historique & Maintenance</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                            <div>
                                <label htmlFor="purchaseDate" className="block text-sm font-medium">Date d'Achat</label>
                                <input type="date" name="purchaseDate" id="purchaseDate" value={currentItem.purchaseDate || ''} onChange={handleInputChange} className="input-field-sm" style={{colorScheme: 'dark'}}/>
                            </div>
                            <div>
                                <label htmlFor="purchasePrice" className="block text-sm font-medium">Prix d'Achat (€)</label>
                                <input type="number" name="purchasePrice" id="purchasePrice" value={currentItem.purchasePrice === undefined ? '' : currentItem.purchasePrice} onChange={handleInputChange} className="input-field-sm" step="0.01"/>
                            </div>
                            <div>
                                <label htmlFor="lastMaintenanceDate" className="block text-sm font-medium">Dernière Maintenance</label>
                                <input type="date" name="lastMaintenanceDate" id="lastMaintenanceDate" value={currentItem.lastMaintenanceDate || ''} onChange={handleInputChange} className="input-field-sm" style={{colorScheme: 'dark'}}/>
                            </div>
                        </div>
                    </fieldset>
                    
                    <fieldset className="border border-slate-600 p-3 rounded-md">
                        <legend className="text-md font-medium text-slate-200 px-1">Photo & Notes</legend>
                        <div className="mt-2">
                            <label htmlFor="equipmentPhotoUpload" className="block text-sm font-medium text-slate-300 mb-1">Photo de l'équipement</label>
                            <input type="file" id="equipmentPhotoUpload" accept="image/*" onChange={handlePhotoUpload} className="block w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-600 file:text-slate-200 hover:file:bg-slate-500"/>
                            {photoPreview && (
                                <div className="mt-2">
                                    <img src={photoPreview} alt="Aperçu" className="max-h-32 rounded border border-slate-500"/>
                                    <ActionButton type="button" onClick={handleRemovePhoto} variant="danger" size="sm" className="mt-1 text-xs">
                                        <TrashIcon className="w-3 h-3 mr-1"/> Supprimer Photo
                                    </ActionButton>
                                </div>
                            )}
                        </div>
                        <div className="mt-3">
                            <label htmlFor="notes" className="block text-sm font-medium">Notes</label>
                            <textarea name="notes" id="notes" value={currentItem.notes || ''} onChange={handleInputChange} rows={2} className="input-field-sm" />
                        </div>
                    </fieldset>

                    <fieldset className="border border-slate-600 p-3 rounded-md">
                        <legend className="text-md font-medium text-slate-200 px-1">Composants Périphériques</legend>
                        {(currentItem.components || []).map((component, index) => (
                            <div key={component.id} className="grid grid-cols-12 gap-2 mb-2 p-2 border border-slate-500 rounded items-center">
                                <input type="text" value={component.name} onChange={e => handleComponentChange(index, 'name', e.target.value)} placeholder="Nom du composant" className="input-field-sm col-span-3 text-xs" />
                                <input type="text" value={component.type} onChange={e => handleComponentChange(index, 'type', e.target.value)} placeholder="Type (ex: Dérailleur)" className="input-field-sm col-span-2 text-xs" />
                                <input type="text" value={component.brand || ''} onChange={e => handleComponentChange(index, 'brand', e.target.value)} placeholder="Marque" className="input-field-sm col-span-2 text-xs" />
                                <input type="text" value={component.model || ''} onChange={e => handleComponentChange(index, 'model', e.target.value)} placeholder="Modèle" className="input-field-sm col-span-2 text-xs" />
                                <input type="text" value={component.notes || ''} onChange={e => handleComponentChange(index, 'notes', e.target.value)} placeholder="Notes" className="input-field-sm col-span-2 text-xs" />
                                <ActionButton type="button" onClick={() => removeComponent(component.id)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3"/>} className="col-span-1 self-center !p-1"><span className="sr-only">Suppr. Comp.</span></ActionButton>
                            </div>
                        ))}
                        <ActionButton type="button" onClick={addComponent} variant="secondary" size="sm" icon={<PlusCircleIcon className="w-3 h-3"/>} className="text-xs mt-1">Ajouter Composant</ActionButton>
                    </fieldset>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700 sticky bottom-0 bg-slate-800 py-3 -mx-1 px-1">
                        <ActionButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</ActionButton>
                        <ActionButton type="submit">{isEditing ? "Sauvegarder" : "Ajouter"}</ActionButton>
                    </div>
                </form>
            </div>
        </Modal>
    </>
  );

  const renderStockTab = () => {
    const thClasses = "py-2 px-3 text-left font-semibold cursor-pointer hover:bg-slate-600";
    return (
    <>
        <div className="mb-6 p-4 bg-slate-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="stockSearchTerm" className="block text-sm font-medium text-slate-300">Rechercher une pièce</label>
                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" id="stockSearchTerm" value={stockSearchTerm} onChange={e => setStockSearchTerm(e.target.value)} placeholder="Pneu, plaquettes..." className="input-field-sm pl-10"/>
                    </div>
                </div>
                <div>
                    <label htmlFor="stockCategoryFilter" className="block text-sm font-medium text-slate-300">Filtrer par catégorie</label>
                    <select id="stockCategoryFilter" value={stockCategoryFilter} onChange={e => setStockCategoryFilter(e.target.value as any)} className="input-field-sm">
                        <option value="all">Toutes les catégories</option>
                        {Object.values(EquipmentStockCategory).map(cat => <option key={cat} value={cat} className="bg-slate-700">{cat}</option>)}
                    </select>
                </div>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm bg-slate-800 text-slate-300">
                <thead className="bg-slate-700 text-slate-200">
                    <tr>
                        <th className={thClasses} onClick={() => requestStockSort('name')}>Pièce{getStockSortIndicator('name')}</th>
                        <th className={thClasses} onClick={() => requestStockSort('category')}>Catégorie{getStockSortIndicator('category')}</th>
                        <th className={thClasses} onClick={() => requestStockSort('brand')}>Marque/Réf.{getStockSortIndicator('brand')}</th>
                        <th className={`${thClasses} text-center`} onClick={() => requestStockSort('quantity')}>Quantité{getStockSortIndicator('quantity')}</th>
                        <th className={`${thClasses} text-center`} onClick={() => requestStockSort('status')}>Statut{getStockSortIndicator('status')}</th>
                        <th className="py-2 px-3 text-right font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {sortedStockItems.length > 0 ? sortedStockItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-700/50">
                            <td className="py-2 px-3 font-medium text-slate-100">{item.name}</td>
                            <td className="py-2 px-3">{item.category}</td>
                            <td className="py-2 px-3">{item.brand || ''}{item.reference ? ` - ${item.reference}` : ''}</td>
                            <td className="py-2 px-3">
                                <div className="flex items-center justify-center space-x-2">
                                    <ActionButton onClick={() => handleStockQuantityChange(item.id, -1)} size="sm" variant="secondary" className="!p-1.5 rounded-full">-</ActionButton>
                                    <span className="font-semibold text-base w-8 text-center text-slate-100">{item.quantity}</span>
                                    <ActionButton onClick={() => handleStockQuantityChange(item.id, 1)} size="sm" variant="secondary" className="!p-1.5 rounded-full">+</ActionButton>
                                </div>
                            </td>
                            <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStockStatus(item).colorClass}`}>{getStockStatus(item).text}</span>
                            </td>
                            <td className="py-2 px-3 text-right space-x-1">
                                <ActionButton onClick={() => openEditStockModal(item)} variant="secondary" size="sm" icon={<PencilIcon className="w-3 h-3"/>}/>
                                <ActionButton onClick={() => handleDeleteStockItem(item)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3"/>}/>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={6} className="text-center italic py-4 text-slate-400">Aucune pièce en stock ou correspondant aux filtres.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
        {stockItemToDelete && (
            <ConfirmationModal
                isOpen={!!stockItemToDelete}
                onClose={() => setStockItemToDelete(null)}
                onConfirm={confirmDeleteStockItem}
                title={`Supprimer "${stockItemToDelete.name}"`}
                message="Êtes-vous sûr de vouloir supprimer cette pièce du stock ? Cette action est irréversible."
            />
        )}
        <Modal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} title={isEditingStockItem ? "Modifier Pièce" : "Ajouter Pièce au Stock"}>
            <form onSubmit={handleStockSubmit} className="space-y-4 text-slate-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label>Nom de la pièce</label><input type="text" name="name" value={currentStockItem.name} onChange={handleStockInputChange} required className="input-field-sm"/></div>
                    <div><label>Catégorie</label><select name="category" value={currentStockItem.category} onChange={handleStockInputChange} className="input-field-sm">{Object.values(EquipmentStockCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label>Marque</label><input type="text" name="brand" value={currentStockItem.brand || ''} onChange={handleStockInputChange} className="input-field-sm"/></div>
                    <div><label>Référence</label><input type="text" name="reference" value={currentStockItem.reference || ''} onChange={handleStockInputChange} className="input-field-sm"/></div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div><label>Quantité</label><input type="number" name="quantity" value={currentStockItem.quantity} onChange={handleStockInputChange} required className="input-field-sm"/></div>
                     <div><label>Unité</label><input type="text" name="unit" value={currentStockItem.unit} onChange={handleStockInputChange} required placeholder="pièce, paire..." className="input-field-sm"/></div>
                     <div><label>Seuil d'Alerte</label><input type="number" name="lowStockThreshold" value={currentStockItem.lowStockThreshold} onChange={handleStockInputChange} required className="input-field-sm"/></div>
                 </div>
                 <div><label>Notes</label><textarea name="notes" value={currentStockItem.notes || ''} onChange={handleStockInputChange} rows={2} className="input-field-sm w-full" placeholder="Ex: Compatible avec..., fournisseur..."></textarea></div>
                <div className="flex justify-end space-x-2 pt-3"><ActionButton type="button" variant="secondary" onClick={() => setIsStockModalOpen(false)}>Annuler</ActionButton><ActionButton type="submit">{isEditingStockItem ? "Sauvegarder" : "Ajouter"}</ActionButton></div>
            </form>
        </Modal>
    </>
  );
  };

  const renderRiderSpecificTab = () => (
    <div className="text-slate-300">
      <div className="mb-4 p-3 bg-slate-700 rounded-md">
        <label htmlFor="riderSelectForSetup" className="block text-sm font-medium text-slate-300 mb-1">
          Sélectionner un Coureur pour voir/modifier ses réglages vélo:
        </label>
        <select
          id="riderSelectForSetup"
          value={selectedRiderForSetup}
          onChange={(e) => setSelectedRiderForSetup(e.target.value)}
          className="input-field-sm"
        >
          <option value="" className="bg-slate-700">-- Choisir un coureur --</option>
          {riders.map(r => (
            <option key={r.id} value={r.id} className="bg-slate-700">{`${r.firstName} ${r.lastName}`}</option>
          ))}
        </select>
      </div>

      {selectedRiderForSetup && currentBikeSetup.roadBikeSetup && currentBikeSetup.ttBikeSetup && (
        <div className="bg-slate-800 p-4 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold text-slate-100 mb-2">
            Réglages Vélo pour: {getRiderNameById(selectedRiderForSetup)}
            <span className="text-sm text-slate-400 ml-2">
              (Taille: {riders.find(r => r.id === selectedRiderForSetup)?.heightCm || 'N/A'} cm)
            </span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['roadBikeSetup', 'ttBikeSetup'] as const).map(bikeType => (
              <div key={bikeType} className="space-y-3">
                <h5 className={`text-md font-semibold p-2 rounded-t-md ${bikeType === 'roadBikeSetup' ? 'bg-pink-600 text-white' : 'bg-orange-500 text-white'}`}>
                  {bikeType === 'roadBikeSetup' ? 'Vélo Route' : 'Vélo CLM'}
                </h5>
                
                <div className="bg-slate-700 p-3 rounded-b-md space-y-2">
                    <h6 className="text-sm font-medium text-slate-300 border-b border-slate-600 pb-1">Spécifique Vélo</h6>
                    {BIKE_SETUP_SPECIFIC_FIELDS.map(field => (
                        <div key={String(field.key)} className="grid grid-cols-2 items-center">
                            <label htmlFor={`${bikeType}-specifics-${String(field.key)}`} className="text-xs text-slate-400">
                                {field.label}:
                            </label>
                            <input
                                type="text"
                                id={`${bikeType}-specifics-${String(field.key)}`}
                                name={`${bikeType}-specifics-${String(field.key)}`}
                                value={(currentBikeSetup[bikeType]?.specifics as any)?.[field.key] || ''}
                                onChange={e => handleBikeSetupChange(bikeType, 'specifics', field.key, e.target.value)}
                                className="input-field-sm text-xs py-1"
                            />
                        </div>
                    ))}
                </div>

                <div className="bg-slate-700 p-3 rounded-md space-y-2 mt-3">
                     <h6 className="text-sm font-medium text-slate-300 border-b border-slate-600 pb-1">Cotes</h6>
                    {BIKE_SETUP_COTES_FIELDS.map(field => (
                         <div key={String(field.key)} className="grid grid-cols-2 items-center">
                            <label htmlFor={`${bikeType}-cotes-${String(field.key)}`} className="text-xs text-slate-400">
                                {field.label}:
                            </label>
                            <input
                                type="text"
                                id={`${bikeType}-cotes-${String(field.key)}`}
                                name={`${bikeType}-cotes-${String(field.key)}`}
                                value={(currentBikeSetup[bikeType]?.cotes as any)?.[field.key] || ''}
                                onChange={e => handleBikeSetupChange(bikeType, 'cotes', field.key, e.target.value)}
                                className="input-field-sm text-xs py-1"
                            />
                        </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <ActionButton onClick={handleSaveBikeSetup}>Sauvegarder Réglages Vélo</ActionButton>
          </div>
        </div>
      )}
    </div>
  );


  const tabButtonStyle = (tabName: 'general' | 'stock' | 'riderSpecific') => 
    `px-3 py-2 font-medium text-sm rounded-t-md whitespace-nowrap transition-colors duration-150 focus:outline-none ${
      activeEquipmentTab === tabName 
        ? 'bg-white text-gray-800 border-b-2 border-blue-500' 
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
    }`;

  const getActionButton = () => {
    if (currentUser.permissionRole === TeamRole.VIEWER) return null;
    if (activeEquipmentTab === 'general') {
      return <ActionButton onClick={openAddModal} icon={<PlusCircleIcon className="w-5 h-5" />}>Ajouter Équipement</ActionButton>
    }
    if (activeEquipmentTab === 'stock') {
      return <ActionButton onClick={openAddStockModal} icon={<PlusCircleIcon className="w-5 h-5" />}>Ajouter Pièce</ActionButton>
    }
    return null;
  }

  return (
    <SectionWrapper
      title="Gestion du Matériel"
      actionButton={getActionButton()}
    >
        <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
            <button onClick={() => setActiveEquipmentTab('general')} className={tabButtonStyle('general')}>
                Inventaire Général
            </button>
            <button onClick={() => setActiveEquipmentTab('stock')} className={tabButtonStyle('stock')}>
                Stock Pièces Détachées
            </button>
            <button onClick={() => setActiveEquipmentTab('riderSpecific')} className={tabButtonStyle('riderSpecific')}>
                Réglages Individuels
            </button>
            </nav>
        </div>

        <div className="bg-slate-800 p-4 rounded-b-lg">
            {activeEquipmentTab === 'general' && renderGeneralTab()}
            {activeEquipmentTab === 'stock' && renderStockTab()}
            {activeEquipmentTab === 'riderSpecific' && renderRiderSpecificTab()}
        </div>
    </SectionWrapper>
  );
};

export default EquipmentSection;