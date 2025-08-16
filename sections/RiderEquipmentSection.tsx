import React, { useState, useEffect } from 'react';
import { User, EquipmentItem, BikeSetup, ClothingItem, ClothingType, Rider } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import BikeSetupTab from '../components/riderDetailTabs/BikeSetupTab';
import WrenchScrewdriverIcon from '../components/icons/WrenchScrewdriverIcon';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import Modal from '../components/Modal';
import { useTranslations } from '../hooks/useTranslations';

interface RiderEquipmentSectionProps {
  riders: Rider[];
  equipment: EquipmentItem[];
  currentUser: User;
  setRiders: (updater: React.SetStateAction<Rider[]>) => void;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
const initialClothingItem: Omit<ClothingItem, 'id'> = { type: ClothingType.AUTRE, quantity: 1, brand: '', reference: '', size: '', notes: '' };

const RiderEquipmentSection: React.FC<RiderEquipmentSectionProps> = ({ riders, equipment, currentUser, setRiders }) => {
  const [assignedEquipment, setAssignedEquipment] = useState<EquipmentItem[]>([]);
  const [riderData, setRiderData] = useState<Rider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const { t } = useTranslations();

  useEffect(() => {
    const rider = riders.find(r => r.email === currentUser.email);
    if (rider) {
      setRiderData(structuredClone(rider));
      const equipmentForRider = equipment.filter(eq => eq.assignedToRiderId === rider.id);
      setAssignedEquipment(equipmentForRider);
    }
  }, [riders, equipment, currentUser.email]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!riderData) return;
    const { name, value } = e.target;
    
    setRiderData(prev => {
        if (!prev) return null;
        const newFormData = structuredClone(prev);
        const keys = name.split('.');
        let currentLevel: any = newFormData;
        for (let i = 0; i < keys.length - 1; i++) {
            currentLevel[keys[i] as keyof typeof currentLevel] = currentLevel[keys[i] as keyof typeof currentLevel] || {};
            currentLevel = currentLevel[keys[i] as keyof typeof currentLevel];
        }
        currentLevel[keys[keys.length - 1]] = value;
        return newFormData;
    });
  };

  const handleSave = () => {
    if (riderData) {
      setRiders(prevRiders => prevRiders.map(r => r.id === riderData.id ? riderData : r));
      alert(t('saveSuccess'));
    }
  };

  const handleSavePersonalItem = (itemToSave: ClothingItem) => {
    setRiders(prevRiders => prevRiders.map(r => {
        if (r.id === riderData?.id) {
            const clothing = r.clothing || [];
            if (editingItem) {
                return { ...r, clothing: clothing.map(c => c.id === itemToSave.id ? itemToSave : c) };
            } else {
                return { ...r, clothing: [...clothing, { ...itemToSave, id: generateId() }] };
            }
        }
        return r;
    }));
    setIsModalOpen(false);
  };

  const handleDeletePersonalItem = (itemId: string) => {
    if (window.confirm(t('riderEquipmentConfirmDelete'))) {
        setRiders(prevRiders => prevRiders.map(r => {
            if (r.id === riderData?.id) {
                return { ...r, clothing: (r.clothing || []).filter(c => c.id !== itemId) };
            }
            return r;
        }));
    }
  };
  
  if (!riderData) {
    return (
      <SectionWrapper title="Mon Matériel & Réglages">
        <p className="text-gray-500">Chargement de vos informations...</p>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper title="Mon Matériel & Réglages" actionButton={<ActionButton onClick={handleSave}>Sauvegarder mes modifications</ActionButton>}>
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Mon Matériel Personnel</h3>
           <div className="mb-3 text-right">
                <ActionButton onClick={() => { setEditingItem(null); setIsModalOpen(true); }} icon={<PlusCircleIcon className="w-4 h-4"/>} size="sm">Ajouter</ActionButton>
            </div>
            {(riderData.clothing && riderData.clothing.length > 0) ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 text-left">Type</th>
                                <th className="p-2 text-left">Marque/Modèle</th>
                                <th className="p-2 text-left">Taille</th>
                                <th className="p-2 text-left">Notes</th>
                                <th className="p-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                             {riderData.clothing.map(item => (
                                <tr key={item.id}>
                                    <td className="p-2">{item.type}</td>
                                    <td className="p-2">{item.brand || ''} {item.reference || ''}</td>
                                    <td className="p-2">{item.size || ''}</td>
                                    <td className="p-2 text-gray-500">{item.notes || ''}</td>
                                    <td className="p-2 text-right space-x-1">
                                        <ActionButton onClick={() => { setEditingItem(item); setIsModalOpen(true); }} variant="secondary" size="sm" icon={<PencilIcon className="w-3 h-3"/>}/>
                                        <ActionButton onClick={() => handleDeletePersonalItem(item.id)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3"/>}/>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">Aucun matériel personnel ajouté.</p>
            )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Matériel Assigné par l'Équipe</h3>
          {assignedEquipment.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedEquipment.map(item => (
                <div key={item.id} className="bg-gray-50 p-3 rounded border">
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-sm text-gray-600">{item.type} - {item.brand} {item.model}</p>
                  <p className="text-xs text-gray-500">N/S: {item.serialNumber || 'N/A'}</p>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center p-6 bg-gray-50 rounded-lg border">
                <WrenchScrewdriverIcon className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">Aucun matériel ne vous est assigné par l'équipe pour le moment.</p>
            </div>
          )}
        </div>
        <div className="bg-slate-800 text-white p-4 rounded-lg shadow-md">
           <h3 className="text-lg font-semibold text-slate-100 mb-3">Mes Cotes Vélo</h3>
           <BikeSetupTab 
            formData={riderData}
            handleInputChange={handleInputChange}
            formFieldsEnabled={true}
           />
        </div>
      </div>
      
      {isModalOpen && <PersonalItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePersonalItem} initialData={editingItem} />}
    </SectionWrapper>
  );
};


const PersonalItemModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: ClothingItem) => void;
    initialData: ClothingItem | null;
}> = ({ isOpen, onClose, onSave, initialData }) => {
    const [itemData, setItemData] = useState<Omit<ClothingItem, 'id'>>({ ...initialClothingItem });

    useEffect(() => {
        setItemData(initialData ? structuredClone(initialData) : { ...initialClothingItem });
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setItemData(prev => ({...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...itemData, id: initialData?.id || generateId() });
    };

    const inputClass = "mt-1 block w-full px-3 py-2 border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Modifier l'article personnel" : "Ajouter un article personnel"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type d'article</label>
                        <select name="type" value={itemData.type} onChange={handleChange} className={inputClass}>
                            {Object.values(ClothingType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Taille</label>
                        <input type="text" name="size" value={itemData.size || ''} onChange={handleChange} className={inputClass}/>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Marque</label>
                        <input type="text" name="brand" value={itemData.brand || ''} onChange={handleChange} className={inputClass}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Modèle / Référence</label>
                        <input type="text" name="reference" value={itemData.reference || ''} onChange={handleChange} className={inputClass}/>
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea name="notes" value={itemData.notes || ''} onChange={handleChange} rows={2} className={inputClass} placeholder="Ex: Selle test, usure spécifique..."/>
                 </div>
                 <div className="flex justify-end space-x-2 pt-3">
                    <ActionButton type="button" variant="secondary" onClick={onClose}>Annuler</ActionButton>
                    <ActionButton type="submit">Sauvegarder</ActionButton>
                </div>
            </form>
        </Modal>
    );
};

export default RiderEquipmentSection;