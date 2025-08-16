import React, { useState } from 'react';
import { Rider, AllergyItem, AllergySeverity as AllergySeverityEnum, PredefinedAllergen as PredefinedAllergenEnum, TeamProduct, SelectedProduct } from '../../types';
import ActionButton from '../ActionButton';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import Modal from '../Modal';
import { PREDEFINED_ALLERGEN_INFO } from '../../constants';

interface NutritionTabProps {
    formData: Rider | Omit<Rider, 'id'>;
    setFormData: React.Dispatch<React.SetStateAction<Rider | Omit<Rider, 'id'>>>;
    formFieldsEnabled: boolean;
    teamProducts: TeamProduct[];
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const NutritionTab: React.FC<NutritionTabProps> = ({
    formData,
    setFormData,
    formFieldsEnabled,
    teamProducts,
}) => {
    // Modal state for product selection
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'gel' | 'bar' | 'drink'>('gel');

    // State for custom product form
    const [customProduct, setCustomProduct] = useState<Omit<TeamProduct, 'id'>>({ name: '', type: 'gel' });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const parts = name.split('.');

        setFormData(prevRider => {
            if (!prevRider) return null;
            let updatedRider = { ...prevRider };

            if (parts[0] === 'allergies') {
                const allergyIndex = parseInt(parts[1], 10);
                const subField = parts[2];
                const updatedAllergies = [...(updatedRider.allergies || [])];
                if (updatedAllergies[allergyIndex]) {
                    updatedAllergies[allergyIndex] = { ...updatedAllergies[allergyIndex] }; // copy the specific allergy object
                    if (subField === 'allergenKey') {
                        const newAllergenKey = value as PredefinedAllergenEnum | 'CUSTOM';
                        updatedAllergies[allergyIndex].allergenKey = newAllergenKey;
                        if (newAllergenKey !== 'CUSTOM' && PREDEFINED_ALLERGEN_INFO[newAllergenKey]) {
                            updatedAllergies[allergyIndex].regimeDetails = PREDEFINED_ALLERGEN_INFO[newAllergenKey].defaultRegimeDetails;
                            updatedAllergies[allergyIndex].isCeliacDisease = !!PREDEFINED_ALLERGEN_INFO[newAllergenKey].isCeliac;
                        } else if (newAllergenKey === 'CUSTOM') {
                            updatedAllergies[allergyIndex].isCeliacDisease = false;
                        }
                    } else if (subField === 'isCeliacDisease') {
                        updatedAllergies[allergyIndex].isCeliacDisease = (e.target as HTMLInputElement).checked;
                        if (updatedAllergies[allergyIndex].isCeliacDisease && updatedAllergies[allergyIndex].allergenKey === PredefinedAllergenEnum.GLUTEN_CELIAC) {
                            updatedAllergies[allergyIndex].regimeDetails = PREDEFINED_ALLERGEN_INFO[PredefinedAllergenEnum.GLUTEN_CELIAC].defaultRegimeDetails;
                        }
                    } else {
                        (updatedAllergies[allergyIndex] as any)[subField] = value;
                    }
                    updatedRider.allergies = updatedAllergies;
                }
            } else if (parts[0] === 'performanceNutrition') {
                const perfNutrition = { ...(updatedRider.performanceNutrition || {}) };
                const finalKey = parts[1];
                const isNumeric = ['carbsPerHourTarget', 'estimatedRaceDurationInHours'].includes(finalKey);
                (perfNutrition as any)[finalKey] = isNumeric ? (value === '' ? undefined : parseFloat(value)) : value;
                updatedRider.performanceNutrition = perfNutrition;
            } else {
                (updatedRider as any)[name] = value;
            }
            return updatedRider;
        });
    };
    
    const handleAddAllergy = () => {
        setFormData(prev => ({
            ...prev,
            allergies: [
                ...(prev.allergies || []),
                { 
                    id: generateId(), 
                    allergenKey: 'CUSTOM', 
                    customAllergenName: '',
                    severity: AllergySeverityEnum.FAIBLE, 
                    regimeDetails: '',
                    isCeliacDisease: false,
                    notes: ''
                }
            ]
        }));
    };

    const handleRemoveAllergy = (id: string) => {
        if(window.confirm("Supprimer cette allergie ?")){
            setFormData(prev => ({
                ...prev,
                allergies: (prev.allergies || []).filter(allergy => allergy.id !== id)
            }));
        }
    };

    const handleQuantityChange = (type: 'selectedGels' | 'selectedBars' | 'selectedDrinks', productId: string, newQuantity: number) => {
        setFormData(prev => {
            if (!prev) return null;
            let perfNutrition = { ...(prev.performanceNutrition || {}) };
            let selectionArray = [...(perfNutrition[type] || [])];
            const itemIndex = selectionArray.findIndex(item => item.productId === productId);

            if (itemIndex > -1) {
                if (newQuantity > 0) {
                    selectionArray[itemIndex] = { ...selectionArray[itemIndex], quantity: newQuantity };
                } else {
                    selectionArray.splice(itemIndex, 1);
                }
            }
            
            return { ...prev, performanceNutrition: { ...perfNutrition, [type]: selectionArray }};
        });
    };
  
    const handleSelectProduct = (product: TeamProduct) => {
        const typeKey = product.type === 'gel' ? 'selectedGels' : product.type === 'bar' ? 'selectedBars' : 'selectedDrinks';
        
        setFormData(prev => {
            if (!prev) return null;
            let perfNutrition = { ...(prev.performanceNutrition || {}) };
            let selectionArray: SelectedProduct[] = [...(perfNutrition[typeKey] || [])];
            
            if (!selectionArray.some(p => p.productId === product.id)) {
                selectionArray.push({ productId: product.id, quantity: 1 });
            }
            
            return { ...prev, performanceNutrition: { ...perfNutrition, [typeKey]: selectionArray } };
        });
        setIsProductModalOpen(false);
    };
  
    const handleAddCustomProduct = () => {
        if (!customProduct.name) {
            alert("Veuillez donner un nom au produit personnalisé.");
            return;
        }
        const newProduct: TeamProduct = { ...customProduct, id: `custom-${generateId()}`, type: modalMode };
        
        setFormData(prev => {
          if (!prev) return null;
          let perfNutrition = { ...(prev.performanceNutrition || {}) };
          const customProducts = [...(perfNutrition.customProducts || []), newProduct];
          return { ...prev, performanceNutrition: { ...perfNutrition, customProducts }};
        });
        
        // Auto-select the newly created product
        handleSelectProduct(newProduct);
        setCustomProduct({ name: '', type: 'gel' }); // Reset form
    };

    const allProducts = [...teamProducts, ...(formData.performanceNutrition?.customProducts || [])];
    const inputClass = "input-field-sm w-full";
    const selectClass = "input-field-sm w-full";
    const checkboxClass = "checkbox-field";
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
                <div className="bg-slate-700 p-3 rounded-md">
                    <h3 className="text-md font-semibold text-slate-200 mb-2">Préférences et Régimes</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Régime Spécifique (hors allergies)</label>
                        <textarea name="dietaryRegimen" value={formData.dietaryRegimen || ''} onChange={handleInputChange} rows={2} className={inputClass} placeholder="Ex: Végétarien, sans porc..." disabled={!formFieldsEnabled} />
                    </div>
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-slate-300">Préférences / Aversions</label>
                        <textarea name="foodPreferences" value={formData.foodPreferences || ''} onChange={handleInputChange} rows={2} className={inputClass} placeholder="Ex: J'adore les pâtes, je n'aime pas les betteraves..." disabled={!formFieldsEnabled}/>
                    </div>
                </div>

                <div className="bg-slate-700 p-3 rounded-md">
                    <h3 className="text-md font-semibold text-slate-200 mb-2">Allergies & Régimes d'Éviction</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {(formData.allergies || []).map((allergy, index) => (
                            <div key={allergy.id} className="bg-slate-800/50 p-2 rounded border border-slate-600">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <select name={`allergies.${index}.allergenKey`} value={allergy.allergenKey} onChange={handleInputChange} className={selectClass} disabled={!formFieldsEnabled}>
                                        <option value="CUSTOM">Personnalisé</option>
                                        {Object.keys(PREDEFINED_ALLERGEN_INFO).map(key => <option key={key} value={key}>{PREDEFINED_ALLERGEN_INFO[key as PredefinedAllergenEnum].displayName}</option>)}
                                    </select>
                                    <select name={`allergies.${index}.severity`} value={allergy.severity} onChange={handleInputChange} className={selectClass} disabled={!formFieldsEnabled}>
                                        {Object.values(AllergySeverityEnum).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                {allergy.allergenKey === 'CUSTOM' && (
                                    <input type="text" name={`allergies.${index}.customAllergenName`} value={allergy.customAllergenName || ''} onChange={handleInputChange} placeholder="Nom de l'allergène" className={`${inputClass} mt-2 text-xs`} disabled={!formFieldsEnabled} />
                                )}
                                <textarea name={`allergies.${index}.regimeDetails`} value={allergy.regimeDetails} onChange={handleInputChange} placeholder="Régime d'éviction détaillé" rows={1} className={`${inputClass} mt-2 text-xs`} disabled={!formFieldsEnabled}/>
                                <div className="mt-2 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <input type="checkbox" id={`isCeliac-${index}`} name={`allergies.${index}.isCeliacDisease`} checked={allergy.isCeliacDisease || false} onChange={handleInputChange} className={checkboxClass} disabled={!formFieldsEnabled} />
                                        <label htmlFor={`isCeliac-${index}`} className="ml-2 text-xs text-slate-300">Maladie Cœliaque ?</label>
                                    </div>
                                    {formFieldsEnabled && (
                                        <ActionButton type="button" onClick={() => handleRemoveAllergy(allergy.id)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3"/>}>
                                            <span className="sr-only">Supprimer</span>
                                        </ActionButton>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {formFieldsEnabled && (
                        <ActionButton type="button" onClick={handleAddAllergy} variant="secondary" size="sm" icon={<PlusCircleIcon className="w-4 h-4"/>} className="mt-2 text-xs">
                            Ajouter une allergie
                        </ActionButton>
                    )}
                </div>
            </div>

            <div className="bg-slate-700 p-3 rounded-md">
                <h3 className="text-md font-semibold text-slate-200 mb-2">Plan Nutritionnel Course</h3>
                <div>
                    <label className="block text-sm font-medium text-slate-300">Objectif Glucides/Heure (g)</label>
                    <input type="number" name="performanceNutrition.carbsPerHourTarget" value={formData.performanceNutrition?.carbsPerHourTarget ?? ''} onChange={handleInputChange} placeholder="Ex: 90" className={inputClass} disabled={!formFieldsEnabled}/>
                </div>
                <div className="mt-2">
                    <label className="block text-sm font-medium text-slate-300">Notes Hydratation</label>
                    <textarea name="performanceNutrition.hydrationNotes" value={formData.performanceNutrition?.hydrationNotes || ''} onChange={handleInputChange} rows={1} className={inputClass} placeholder="Ex: 1 bidon par heure..." disabled={!formFieldsEnabled}/>
                </div>
                <div className="mt-2">
                    <h4 className="text-sm font-medium text-slate-300">Produits en Course</h4>
                    {(['selectedGels', 'selectedBars', 'selectedDrinks'] as const).map(typeKey => {
                        const title = typeKey === 'selectedGels' ? 'Gels' : typeKey === 'selectedBars' ? 'Barres' : 'Boissons';
                        const modalType = typeKey === 'selectedGels' ? 'gel' : typeKey === 'selectedBars' ? 'bar' : 'drink';
                        return (
                        <div key={typeKey} className="mt-1">
                            <div className="flex justify-between items-center">
                                <h5 className="font-semibold text-xs text-slate-300">{title}</h5>
                                {formFieldsEnabled && <ActionButton size="sm" variant="secondary" onClick={() => { setModalMode(modalType); setIsProductModalOpen(true); }}><PlusCircleIcon className="w-3 h-3 mr-1"/>Ajouter</ActionButton>}
                            </div>
                            <div className="mt-1 space-y-1 text-xs">
                                {(formData.performanceNutrition?.[typeKey] || []).map(item => {
                                    const product = allProducts.find(p => p.id === item.productId);
                                    if (!product) return null;
                                    return (
                                        <div key={item.productId} className="flex items-center justify-between bg-slate-800/50 p-1 rounded">
                                            <span>{product.name}</span>
                                            <input type="number" value={item.quantity} min="0" onChange={e => handleQuantityChange(typeKey, item.productId, parseInt(e.target.value))} className={`${inputClass} !mt-0 !text-xs w-14 py-0.5`} disabled={!formFieldsEnabled}/>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )})}
                </div>
            </div>

            {isProductModalOpen && (
                <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={`Ajouter un(e) ${modalMode}`}>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Choisir un produit de l'équipe</h4>
                        <div className="max-h-40 overflow-y-auto space-y-1 p-2 border rounded-md bg-gray-50">
                            {allProducts.filter(p => p.type === modalMode).map(p => (
                                <button key={p.id} onClick={() => handleSelectProduct(p)} className="w-full text-left p-2 rounded hover:bg-gray-100">{p.name} ({p.brand})</button>
                            ))}
                        </div>
                    </div>
                    <div className="text-center text-sm text-gray-500">ou</div>
                    <div>
                        <h4 className="font-semibold">Ajouter un produit personnel</h4>
                        <div className="p-3 bg-gray-50 rounded-md border mt-1 space-y-2">
                            <input type="text" value={customProduct.name} onChange={e => setCustomProduct(p => ({...p, name: e.target.value, type: modalMode}))} placeholder="Nom du produit" className="mt-1 block w-full px-3 py-2 border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                            <input type="text" value={customProduct.brand || ''} onChange={e => setCustomProduct(p => ({...p, brand: e.target.value}))} placeholder="Marque" className="mt-1 block w-full px-3 py-2 border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                            <ActionButton onClick={handleAddCustomProduct}>Ajouter et Sélectionner</ActionButton>
                        </div>
                    </div>
                </div>
                </Modal>
            )}
        </div>
    );
};

export default NutritionTab;