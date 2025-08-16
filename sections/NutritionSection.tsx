import React, { useState, useMemo, useEffect } from 'react';
import { Rider, AllergyItem, AllergySeverity as AllergySeverityEnum, PredefinedAllergen as PredefinedAllergenEnum, TeamProduct, SelectedProduct } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import TrashIcon from '../components/icons/TrashIcon';
import Modal from '../components/Modal';
import { PREDEFINED_ALLERGEN_INFO } from '../constants';
import { useTranslations } from '../hooks/useTranslations';

interface NutritionSectionProps {
  rider: Rider | undefined;
  setRiders: (updater: React.SetStateAction<Rider[]>) => void;
  teamProducts: TeamProduct[];
  setTeamProducts: (updater: React.SetStateAction<TeamProduct[]>) => void;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const NutritionSection: React.FC<NutritionSectionProps> = ({ rider, setRiders, teamProducts, setTeamProducts }) => {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'gel' | 'bar' | 'drink'>('gel');
  const [customProduct, setCustomProduct] = useState<Omit<TeamProduct, 'id'>>({ name: '', type: 'gel' });
  const { t } = useTranslations();
  
  const updateRiderProperty = (updateFn: (riderToUpdate: Rider) => Rider) => {
      if (!rider) return;
      setRiders(prevRiders =>
          prevRiders.map(r => (r.id === rider.id ? updateFn(r) : r))
      );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const parts = name.split('.');

    updateRiderProperty(currentRider => {
        const updatedRider = structuredClone(currentRider);

        if (parts[0] === 'allergies') {
            const allergyIndex = parseInt(parts[1], 10);
            const subField = parts[2];
            const updatedAllergies = [...(updatedRider.allergies || [])];
            if (updatedAllergies[allergyIndex]) {
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
             if (!updatedRider.performanceNutrition) updatedRider.performanceNutrition = {};
             const perfNutrition = updatedRider.performanceNutrition;
             const finalKey = parts[1];
             const isNumeric = ['carbsPerHourTarget', 'estimatedRaceDurationInHours'].includes(finalKey);
             (perfNutrition as any)[finalKey] = isNumeric ? (value === '' ? undefined : parseFloat(value)) : value;
        } else {
            (updatedRider as any)[name] = value;
        }
        return updatedRider;
    });
  };

  const handleAddAllergy = () => {
    updateRiderProperty(currentRider => ({
        ...currentRider,
        allergies: [
            ...(currentRider.allergies || []),
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
    if(window.confirm(t('nutritionConfirmDeleteAllergy'))){
      updateRiderProperty(currentRider => ({
          ...currentRider,
          allergies: (currentRider.allergies || []).filter(allergy => allergy.id !== id)
      }));
    }
  };

  const handleQuantityChange = (type: 'selectedGels' | 'selectedBars' | 'selectedDrinks', productId: string, newQuantity: number) => {
    updateRiderProperty(currentRider => {
      let perfNutrition = { ...(currentRider.performanceNutrition || {}) };
      let selectionArray = [...(perfNutrition[type] || [])];
      const itemIndex = selectionArray.findIndex(item => item.productId === productId);

      if (itemIndex > -1) {
          if (newQuantity > 0) {
              selectionArray[itemIndex] = { ...selectionArray[itemIndex], quantity: newQuantity };
          } else {
              selectionArray.splice(itemIndex, 1);
          }
      }
      return { ...currentRider, performanceNutrition: { ...perfNutrition, [type]: selectionArray }};
    });
  };
  
  const handleSelectProduct = (product: TeamProduct) => {
    const typeKey = product.type === 'gel' ? 'selectedGels' : product.type === 'bar' ? 'selectedBars' : 'selectedDrinks';
    
    updateRiderProperty(currentRider => {
        let perfNutrition = { ...(currentRider.performanceNutrition || {}) };
        let selectionArray: SelectedProduct[] = [...(perfNutrition[typeKey] || [])];
        if (!selectionArray.some(p => p.productId === product.id)) {
            selectionArray.push({ productId: product.id, quantity: 1 });
        }
        return { ...currentRider, performanceNutrition: { ...perfNutrition, [typeKey]: selectionArray } };
    });
    setIsProductModalOpen(false);
  };
  
  const handleAddCustomProduct = () => {
    if (!customProduct.name) {
        alert(t('nutritionAddCustomProductError'));
        return;
    }
    const newProduct: TeamProduct = { ...customProduct, id: `custom-${generateId()}`, type: modalMode };
    
    updateRiderProperty(currentRider => {
      let perfNutrition = { ...(currentRider.performanceNutrition || {}) };
      const customProducts = [...(perfNutrition.customProducts || []), newProduct];
      return { ...currentRider, performanceNutrition: { ...perfNutrition, customProducts }};
    });
    
    handleSelectProduct(newProduct);
    setCustomProduct({ name: '', type: 'gel' });
  };

  if (!rider) {
    return <SectionWrapper title="Mes Préférences Nutritionnelles">Chargement des données...</SectionWrapper>;
  }

  const allProducts = [...teamProducts, ...(rider.performanceNutrition?.customProducts || [])];
  
  const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 placeholder-gray-400";
  const selectClass = "block w-full pl-3 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900";
  const checkboxClass = "h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500";


  return (
    <SectionWrapper title="Mes Préférences Nutritionnelles">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md border">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Préférences et Régimes</h3>
                <div>
                    <label htmlFor="dietaryRegimen" className="block text-sm font-medium text-gray-700">Régime Spécifique (hors allergies)</label>
                    <textarea id="dietaryRegimen" name="dietaryRegimen" value={rider.dietaryRegimen || ''} onChange={handleInputChange} rows={3} className={inputClass} placeholder="Ex: Végétarien, sans porc..."/>
                </div>
                <div className="mt-4">
                    <label htmlFor="foodPreferences" className="block text-sm font-medium text-gray-700">Préférences Alimentaires / Aversions</label>
                    <textarea id="foodPreferences" name="foodPreferences" value={rider.foodPreferences || ''} onChange={handleInputChange} rows={3} className={inputClass} placeholder="Ex: J'adore les pâtes, je n'aime pas les betteraves..."/>
                </div>
            </div>
             <div className="bg-white p-4 rounded-lg shadow-md border">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Plan Nutritionnel Course</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Objectif Glucides/Heure (g)</label>
                    <input type="number" name="performanceNutrition.carbsPerHourTarget" value={rider.performanceNutrition?.carbsPerHourTarget ?? ''} onChange={handleInputChange} placeholder="Ex: 90" className={inputClass} />
                </div>
                 <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Notes Hydratation</label>
                    <textarea name="performanceNutrition.hydrationNotes" value={rider.performanceNutrition?.hydrationNotes || ''} onChange={handleInputChange} rows={2} className={inputClass} placeholder="Ex: 1 bidon par heure, électrolytes si chaleur..."/>
                </div>
                 <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-700">Produits en Course</h4>
                    {(['selectedGels', 'selectedBars', 'selectedDrinks'] as const).map(typeKey => {
                        const title = typeKey === 'selectedGels' ? 'Gels' : typeKey === 'selectedBars' ? 'Barres' : 'Boissons';
                        const modalType = typeKey === 'selectedGels' ? 'gel' : typeKey === 'selectedBars' ? 'bar' : 'drink';
                        return (
                        <div key={typeKey} className="mt-2">
                            <div className="flex justify-between items-center">
                                <h5 className="font-semibold">{title}</h5>
                                <ActionButton size="sm" variant="secondary" onClick={() => { setModalMode(modalType); setIsProductModalOpen(true); }}><PlusCircleIcon className="w-4 h-4 mr-1"/>Ajouter</ActionButton>
                            </div>
                            <div className="mt-1 space-y-1">
                                {(rider.performanceNutrition?.[typeKey] || []).map(item => {
                                    const product = allProducts.find(p => p.id === item.productId);
                                    if (!product) return null;
                                    return (
                                        <div key={item.productId} className="flex items-center justify-between bg-gray-50 p-1 rounded">
                                            <span className="text-xs">{product.name} ({product.brand})</span>
                                            <input type="number" value={item.quantity} min="0" onChange={e => handleQuantityChange(typeKey, item.productId, parseInt(e.target.value))} className={`${inputClass} !mt-0 !text-xs w-16 py-0.5`}/>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Allergies & Régimes d'Éviction</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {(rider.allergies || []).map((allergy, index) => (
                    <div key={allergy.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <select name={`allergies.${index}.allergenKey`} value={allergy.allergenKey} onChange={handleInputChange} className={selectClass}>
                                <option value="CUSTOM">Personnalisé</option>
                                {Object.keys(PREDEFINED_ALLERGEN_INFO).map(key => <option key={key} value={key}>{PREDEFINED_ALLERGEN_INFO[key as PredefinedAllergenEnum].displayName}</option>)}
                            </select>
                            <select name={`allergies.${index}.severity`} value={allergy.severity} onChange={handleInputChange} className={selectClass}>
                                {Object.values(AllergySeverityEnum).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        {allergy.allergenKey === 'CUSTOM' && (
                            <input type="text" name={`allergies.${index}.customAllergenName`} value={allergy.customAllergenName || ''} onChange={handleInputChange} placeholder="Nom de l'allergène" className={`${inputClass} mt-2`} />
                        )}
                        <textarea name={`allergies.${index}.regimeDetails`} value={allergy.regimeDetails} onChange={handleInputChange} placeholder="Régime d'éviction détaillé" rows={2} className={`${inputClass} mt-2`} />
                        <textarea name={`allergies.${index}.notes`} value={allergy.notes || ''} onChange={handleInputChange} placeholder="Notes sur la réaction..." rows={1} className={`${inputClass} mt-2`} />
                        <div className="mt-2 flex justify-between items-center">
                            <div className="flex items-center">
                                <input type="checkbox" id={`isCeliac-${index}`} name={`allergies.${index}.isCeliacDisease`} checked={allergy.isCeliacDisease || false} onChange={handleInputChange} className={checkboxClass} />
                                <label htmlFor={`isCeliac-${index}`} className="ml-2 text-sm text-gray-700">Maladie Cœliaque ?</label>
                            </div>
                            <ActionButton type="button" onClick={() => handleRemoveAllergy(allergy.id)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3"/>}>
                                <span className="sr-only">Supprimer</span>
                            </ActionButton>
                        </div>
                    </div>
                ))}
            </div>
            <ActionButton type="button" onClick={handleAddAllergy} variant="secondary" size="sm" icon={<PlusCircleIcon className="w-4 h-4"/>} className="mt-3 text-xs">
                Ajouter une allergie
            </ActionButton>
        </div>
      </div>
      
      {isProductModalOpen && (
        <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={`Ajouter un(e) ${modalMode}`}>
          <div className="space-y-4">
            <div>
                <h4 className="font-semibold">Choisir un produit de l'équipe</h4>
                <div className="max-h-40 overflow-y-auto space-y-1 p-2 border rounded-md">
                    {allProducts.filter(p => p.type === modalMode).map(p => (
                        <button key={p.id} onClick={() => handleSelectProduct(p)} className="w-full text-left p-2 rounded hover:bg-gray-100">{p.name} ({p.brand})</button>
                    ))}
                </div>
            </div>
             <div className="text-center text-sm text-gray-500">ou</div>
            <div>
                <h4 className="font-semibold">Ajouter un produit personnel</h4>
                <div className="p-3 bg-gray-50 rounded-md border mt-1 space-y-2">
                    <input type="text" value={customProduct.name} onChange={e => setCustomProduct(p => ({...p, name: e.target.value, type: modalMode}))} placeholder="Nom du produit" className={inputClass}/>
                    <input type="text" value={customProduct.brand || ''} onChange={e => setCustomProduct(p => ({...p, brand: e.target.value}))} placeholder="Marque" className={inputClass}/>
                    <ActionButton onClick={handleAddCustomProduct}>Ajouter et Sélectionner</ActionButton>
                </div>
            </div>
          </div>
        </Modal>
      )}
    </SectionWrapper>
  );
};

export default NutritionSection;