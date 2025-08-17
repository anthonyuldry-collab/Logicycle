import React, { useState, useEffect, useMemo } from 'react';
import { StaffMember, RaceEvent, StaffRole, StaffStatus, ContractType, StaffRoleKey, EventType, WorkExperience, EducationOrCertification, SpokenLanguage, LanguageProficiency, Address, AvailabilityPeriod, AvailabilityStatus, PerformanceEntry, WeeklyAvailability } from '../types';
import { EVENT_TYPE_COLORS, initialStaffFormState as globalInitialStaffFormState, STAFF_ROLES_CONFIG, ALL_COUNTRIES } from '../constants';
import Modal from './Modal';
import ActionButton from './ActionButton';
import UserCircleIcon from './icons/UserCircleIcon';
import UploadIcon from './icons/UploadIcon';
import TrashIcon from './icons/TrashIcon'; 
import PlusCircleIcon from './icons/PlusCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import StarIcon from './icons/StarIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';

interface StaffDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMember: StaffMember | null; 
  onSave: (staffMember: StaffMember) => void;
  allRaceEvents: RaceEvent[];
  performanceEntries: PerformanceEntry[];
  daysAssigned: number;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const StaffDetailModal: React.FC<StaffDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  staffMember, 
  onSave,
  allRaceEvents,
  performanceEntries,
  daysAssigned,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'career' | 'skills' | 'calendar' | 'availability' | 'admin'>('general');
  const [formData, setFormData] = useState<Omit<StaffMember, 'id'> | StaffMember>(
    staffMember ? structuredClone(staffMember) : { ...globalInitialStaffFormState }
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(staffMember?.photoUrl || null);
  const [newSkill, setNewSkill] = useState('');
  const [newAvailability, setNewAvailability] = useState<Omit<AvailabilityPeriod, 'id'>>({ startDate: '', endDate: '', status: AvailabilityStatus.NON_DISPONIBLE, notes:''});
  
  const inputFieldSm = "w-full bg-slate-700 text-slate-200 border border-slate-600 rounded-md shadow-sm px-2 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500";
  const checkboxField = "h-4 w-4 rounded border-slate-500 bg-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800";


  useEffect(() => {
    if (staffMember) {
      setFormData(structuredClone(staffMember));
      setPhotoPreview(staffMember.photoUrl?.startsWith('data:image') ? staffMember.photoUrl : staffMember.photoUrl || null);
    } else {
      setFormData({ ...globalInitialStaffFormState });
      setPhotoPreview(null);
    }
    setActiveTab('general'); 
  }, [staffMember, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => {
        if (!prev) return prev;
        
        const keys = name.split('.');
        let updatedFormData = structuredClone(prev); // Deep copy
        let currentLevel: any = updatedFormData;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            currentLevel[key] = { ...(currentLevel[key] || {}) };
            currentLevel = currentLevel[key];
        }

        const lastKey = keys[keys.length - 1];
        let processedValue: any = value;
        if (type === 'checkbox') {
            processedValue = checked;
        } else if (name === "dailyRate" || name === "salary") {
            processedValue = value === '' ? undefined : parseFloat(value);
        } else if (type === 'date' && value === '') {
            processedValue = undefined;
        }
        currentLevel[lastKey] = processedValue;
        
        // Conditional logic remains
        if (name === "status") {
            if (value !== StaffStatus.SALARIE) {
                updatedFormData.contractType = undefined;
                updatedFormData.salary = undefined;
                updatedFormData.contractEndDate = undefined;
            }
            if (value !== StaffStatus.VACATAIRE) {
                updatedFormData.dailyRate = undefined;
                updatedFormData.openToExternalMissions = false;
            }
        }

        if (name === "contractType" && value !== ContractType.CDD) {
            updatedFormData.contractEndDate = undefined;
        }
        
        if (name === "role" && value !== StaffRole.AUTRE) {
            updatedFormData.customRole = undefined;
        }

        return updatedFormData;
    });
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !((formData as StaffMember).skills || []).includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...((prev as StaffMember).skills || []), newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: ((prev as StaffMember).skills || []).filter(skill => skill !== skillToRemove)
    }));
  };

  const handleListItemChange = (
    listName: 'workHistory' | 'education' | 'languages',
    index: number,
    field: string,
    value: string | number
) => {
    setFormData(prev => {
        if (!prev) return prev;
        const updated = structuredClone(prev);
        const list = (updated as any)[listName] as any[];
        if (list && list[index]) {
            list[index][field] = value;
        }
        return updated;
    });
};

const handleAddListItem = (listName: 'workHistory' | 'education' | 'languages') => {
    let newItem;
    switch(listName) {
        case 'workHistory': newItem = { id: generateId(), position: '', company: '' }; break;
        case 'education': newItem = { id: generateId(), degree: '', institution: '' }; break;
        case 'languages': newItem = { id: generateId(), language: '', proficiency: LanguageProficiency.BASIC }; break;
    }
    setFormData(prev => {
        if (!prev) return prev;
        const updated = structuredClone(prev);
        if (!(updated as any)[listName]) {
            (updated as any)[listName] = [];
        }
        (updated as any)[listName].push(newItem);
        return updated;
    });
};

const handleRemoveListItem = (listName: 'workHistory' | 'education' | 'languages', idToRemove: string) => {
    setFormData(prev => {
        if (!prev) return prev;
        const updated = structuredClone(prev);
        if ((updated as any)[listName]) {
            (updated as any)[listName] = ((updated as any)[listName] || []).filter((item: any) => item.id !== idToRemove);
        }
        return updated;
    });
};


  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string; // This will be a base64 data URL
        setFormData(prev => ({ ...prev, photoUrl: result }));
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };
  
    const handleLicenseUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const mimeType = result.substring(result.indexOf(':') + 1, result.indexOf(';'));
        const base64Data = result.substring(result.indexOf(',') + 1);
        setFormData(prev => ({ ...prev, licenseImageBase64: base64Data, licenseImageMimeType: mimeType }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLicense = () => {
    setFormData(prev => ({ ...prev, licenseImageBase64: undefined, licenseImageMimeType: undefined }));
    const fileInput = document.getElementById('staffLicenseUpload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };


  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photoUrl: undefined }));
    setPhotoPreview(null);
    const fileInput = document.getElementById('staffPhotoUploadModal') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData: StaffMember = {
      ...(formData as Omit<StaffMember, 'id'>), 
      id: (formData as StaffMember).id || generateId(),
    };
    onSave(finalData);
  };
  
  const handleWeeklyAvailabilityChange = (dayKey: string, slotKey: string, checked: boolean) => {
    setFormData(prev => {
        if (!prev) return prev;
        const updated = structuredClone(prev) as StaffMember;
        if (!updated.weeklyAvailability) {
            updated.weeklyAvailability = {};
        }
        if (!updated.weeklyAvailability[dayKey]) {
            updated.weeklyAvailability[dayKey] = { morning: false, afternoon: false, evening: false };
        }
        (updated.weeklyAvailability[dayKey] as any)[slotKey] = checked;
        return updated;
    });
  };

  const handleAddAvailabilityPeriod = () => {
      if (newAvailability.startDate && newAvailability.endDate) {
          const newPeriod: AvailabilityPeriod = { ...newAvailability, id: generateId() };
          setFormData(prev => ({
              ...prev,
              availability: [...((prev as StaffMember).availability || []), newPeriod]
          }));
          setNewAvailability({ startDate: '', endDate: '', status: AvailabilityStatus.NON_DISPONIBLE, notes:'' });
      }
  };

  const handleRemoveAvailabilityPeriod = (idToRemove: string) => {
      setFormData(prev => ({
          ...prev,
          availability: ((prev as StaffMember).availability || []).filter(p => p.id !== idToRemove)
      }));
  };

  const assignedEvents = useMemo(() => {
    if (!staffMember) return [];
    return allRaceEvents
      .map(event => {
        const rolesInEvent: string[] = [];
        STAFF_ROLES_CONFIG.forEach(group => {
            group.roles.forEach(roleInfo => {
                const roleKey = roleInfo.key as StaffRoleKey;
                const assignments = event[roleKey] as string[] | undefined;
                if (Array.isArray(assignments) && assignments.includes(staffMember.id)) {
                    rolesInEvent.push(roleInfo.label.replace('(s)',''));
                }
            });
        });
        
        if (rolesInEvent.length > 0) {
            return { ...event, roleInEvent: rolesInEvent.join(', ') };
        }
        return null;
      })
      .filter((event): event is RaceEvent & { roleInEvent: string } => event !== null)
      .sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime());
  }, [staffMember, allRaceEvents]);
  
  const staffRatings = useMemo(() => {
    if (!staffMember) return { ratings: [], average: 0, count: 0 };
    const ratings = performanceEntries.flatMap(entry =>
        (entry.staffRatings || [])
            .filter(rating => rating.staffId === staffMember.id && rating.rating > 0)
    );
    const average = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;
    return { ratings, average, count: ratings.length };
  }, [staffMember, performanceEntries]);
  
  if (!isOpen) return null;

  const tabButtonStyle = (tab: string) => `px-3 py-2 text-sm font-medium rounded-t-md ${activeTab === tab ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-700'}`;
  
  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const dayKeyMap: { [key: string]: string } = { 'Lundi': 'monday', 'Mardi': 'tuesday', 'Mercredi': 'wednesday', 'Jeudi': 'thursday', 'Vendredi': 'friday', 'Samedi': 'saturday', 'Dimanche': 'sunday' };
  const timeSlots = ['Matin', 'Après-midi', 'Soir'];
  const slotKeyMap: { [key: string]: string } = { 'Matin': 'morning', 'Après-midi': 'afternoon', 'Soir': 'evening' };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={staffMember ? `Modifier: ${formData.firstName} ${formData.lastName}` : "Ajouter un Membre du Staff"}>
      <div className="bg-slate-800 text-white -m-6 p-4 rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="flex border-b border-slate-600 mb-4 overflow-x-auto">
            <button type="button" onClick={() => setActiveTab('general')} className={tabButtonStyle('general')}>Général</button>
            <button type="button" onClick={() => setActiveTab('career')} className={tabButtonStyle('career')}>Parcours</button>
            <button type="button" onClick={() => setActiveTab('skills')} className={tabButtonStyle('skills')}>Compétences</button>
            <button type="button" onClick={() => setActiveTab('calendar')} className={tabButtonStyle('calendar')}>Calendrier</button>
            <button type="button" onClick={() => setActiveTab('availability')} className={tabButtonStyle('availability')}>Disponibilités</button>
            <button type="button" onClick={() => setActiveTab('admin')} className={tabButtonStyle('admin')}>Admin</button>
          </div>

          <div className="max-h-[calc(85vh - 180px)] overflow-y-auto p-1 pr-3">
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                  <div className="flex flex-col items-center">
                    {photoPreview ? (
                      <img src={photoPreview} alt={`${formData.firstName}`} className="w-28 h-28 rounded-full object-cover mb-2 border-2 border-slate-500" />
                    ) : (
                      <UserCircleIcon className="w-28 h-28 text-slate-500" />
                    )}
                    <div className="text-center">
                        <input type="file" id="staffPhotoUploadModal" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        <label htmlFor="staffPhotoUploadModal" className="cursor-pointer text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 font-bold py-1 px-2 rounded inline-flex items-center">
                            Changer Photo
                        </label>
                        {photoPreview && <button type="button" onClick={handleRemovePhoto} className="text-xs text-red-400 hover:underline mt-1 ml-2">Supprimer</button>}
                    </div>
                  </div>
                   <div className="space-y-2">
                        <div><label className="text-sm">Prénom</label><input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className={inputFieldSm} /></div>
                        <div><label className="text-sm">Nom</label><input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className={inputFieldSm} /></div>
                        <div><label className="text-sm">Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required className={inputFieldSm} /></div>
                        <div><label className="text-sm">Téléphone</label><input type="tel" name="phone" value={(formData as StaffMember).phone || ''} onChange={handleInputChange} className={inputFieldSm} /></div>
                        <div><label className="text-sm">Date de Naissance</label><input type="date" name="birthDate" value={(formData as StaffMember).birthDate || ''} onChange={handleInputChange} className={`${inputFieldSm}`} style={{colorScheme:'dark'}}/></div>
                        <div>
                            <label className="text-sm">Nationalité</label>
                             <select name="nationality" value={(formData as StaffMember).nationality || ''} onChange={handleInputChange} className={inputFieldSm}>
                                <option value="">-- Nationalité --</option>
                                {ALL_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <fieldset className="border border-slate-600 p-3 rounded-md space-y-3">
                         <legend className="text-md font-medium text-slate-200 px-1">Rôle & Contrat</legend>
                         <div className="grid grid-cols-2 gap-3">
                             <div><label className="text-sm">Fonction</label><select name="role" value={formData.role} onChange={handleInputChange} className={inputFieldSm}>{Object.values(StaffRole).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                            {(formData.role === StaffRole.AUTRE) && <div><label className="text-sm">Préciser le Rôle</label><input type="text" name="customRole" value={(formData as StaffMember).customRole || ''} onChange={handleInputChange} placeholder="Ex: Nutritionniste" className={inputFieldSm} /></div>}
                         </div>
                         <div><label className="text-sm">Statut</label><select name="status" value={formData.status} onChange={handleInputChange} className={inputFieldSm}>{Object.values(StaffStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                         {(formData.status === StaffStatus.VACATAIRE) && <div><label className="text-sm">Taux Journalier (€)</label><input type="number" name="dailyRate" value={(formData as StaffMember).dailyRate ?? ''} onChange={handleInputChange} className={inputFieldSm}/></div>}
                         {(formData.status === StaffStatus.SALARIE) && (
                            <div className="grid grid-cols-2 gap-3 p-2 border border-slate-700 rounded">
                                <div><label className="text-sm">Type Contrat</label><select name="contractType" value={(formData as StaffMember).contractType || ''} onChange={handleInputChange} className={inputFieldSm}><option value="">-- Type --</option>{Object.values(ContractType).map(ct => <option key={ct} value={ct}>{ct}</option>)}</select></div>
                                <div><label className="text-sm">Salaire Mensuel Brut (€)</label><input type="number" name="salary" value={(formData as StaffMember).salary ?? ''} onChange={handleInputChange} className={inputFieldSm}/></div>
                                {((formData as StaffMember).contractType === ContractType.CDD) && <div><label className="text-sm">Fin de Contrat</label><input type="date" name="contractEndDate" value={(formData as StaffMember).contractEndDate || ''} onChange={handleInputChange} className={inputFieldSm} style={{colorScheme:'dark'}}/></div>}
                            </div>
                         )}
                         {(formData.status === StaffStatus.VACATAIRE) && <div className="flex items-center"><input type="checkbox" name="openToExternalMissions" checked={(formData as StaffMember).openToExternalMissions} onChange={handleInputChange} className={checkboxField} id="openToMissionsCheckbox"/><label htmlFor="openToMissionsCheckbox" className="ml-2 text-sm">Profil visible pour missions externes</label></div>}
                    </fieldset>
                    <fieldset className="border border-slate-600 p-3 rounded-md space-y-2">
                        <legend className="text-md font-medium text-slate-200 px-1">Adresse</legend>
                        <input type="text" name="address.streetName" value={(formData as StaffMember).address?.streetName || ''} onChange={handleInputChange} placeholder="Rue" className={`${inputFieldSm} mb-1`} />
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" name="address.postalCode" value={(formData as StaffMember).address?.postalCode || ''} onChange={handleInputChange} placeholder="Code Postal" className={inputFieldSm}/>
                            <input type="text" name="address.city" value={(formData as StaffMember).address?.city || ''} onChange={handleInputChange} placeholder="Ville" className={inputFieldSm}/>
                        </div>
                    </fieldset>
                </div>
              </div>
            )}
            {activeTab === 'career' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Expériences Professionnelles</h4>
                  {(formData as StaffMember).workHistory?.map((exp, index) => (
                    <div key={exp.id} className="grid grid-cols-12 gap-2 p-2 border border-slate-700 rounded mb-2">
                      <input type="text" value={exp.position} onChange={e => handleListItemChange('workHistory', index, 'position', e.target.value)} placeholder="Poste" className="input-field-sm col-span-4"/>
                      <input type="text" value={exp.company} onChange={e => handleListItemChange('workHistory', index, 'company', e.target.value)} placeholder="Employeur" className="input-field-sm col-span-4"/>
                      <input type="text" value={exp.startDate || ''} onChange={e => handleListItemChange('workHistory', index, 'startDate', e.target.value)} placeholder="Début (AAAA-MM)" className="input-field-sm col-span-2"/>
                      <input type="text" value={exp.endDate || ''} onChange={e => handleListItemChange('workHistory', index, 'endDate', e.target.value)} placeholder="Fin (AAAA-MM)" className="input-field-sm col-span-2"/>
                      <textarea value={exp.description || ''} onChange={e => handleListItemChange('workHistory', index, 'description', e.target.value)} placeholder="Description" rows={1} className="input-field-sm col-span-11"/>
                      <ActionButton type="button" onClick={() => handleRemoveListItem('workHistory', exp.id)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4"/>} className="col-span-1 self-center"/>
                    </div>
                  ))}
                  <ActionButton type="button" onClick={() => handleAddListItem('workHistory')} variant="secondary" size="sm" icon={<PlusCircleIcon className="w-4 h-4"/>}>Ajouter Expérience</ActionButton>
                </div>
                 <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Éducation & Certifications</h4>
                  {(formData as StaffMember).education?.map((edu, index) => (
                    <div key={edu.id} className="grid grid-cols-12 gap-2 p-2 border border-slate-700 rounded mb-2">
                      <input type="text" value={edu.degree} onChange={e => handleListItemChange('education', index, 'degree', e.target.value)} placeholder="Diplôme / Certification" className="input-field-sm col-span-5"/>
                      <input type="text" value={edu.institution} onChange={e => handleListItemChange('education', index, 'institution', e.target.value)} placeholder="Établissement" className="input-field-sm col-span-5"/>
                      <input type="number" value={edu.year || ''} onChange={e => handleListItemChange('education', index, 'year', Number(e.target.value))} placeholder="Année" className="input-field-sm col-span-2"/>
                      <div className="col-start-12"><ActionButton type="button" onClick={() => handleRemoveListItem('education', edu.id)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4"/>}/></div>
                    </div>
                  ))}
                  <ActionButton type="button" onClick={() => handleAddListItem('education')} variant="secondary" size="sm" icon={<PlusCircleIcon className="w-4 h-4"/>}>Ajouter Formation</ActionButton>
                </div>
                 <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Langues Parlées</h4>
                   {(formData as StaffMember).languages?.map((lang, index) => (
                    <div key={lang.id} className="grid grid-cols-12 gap-2 p-2 border border-slate-700 rounded mb-2">
                      <input type="text" value={lang.language} onChange={e => handleListItemChange('languages', index, 'language', e.target.value)} placeholder="Langue" className="input-field-sm col-span-6"/>
                      <select value={lang.proficiency} onChange={e => handleListItemChange('languages', index, 'proficiency', e.target.value)} className="input-field-sm col-span-5">{Object.values(LanguageProficiency).map(p=><option key={p} value={p}>{p}</option>)}</select>
                      <div className="col-start-12"><ActionButton type="button" onClick={() => handleRemoveListItem('languages', lang.id)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4"/>}/></div>
                    </div>
                  ))}
                  <ActionButton type="button" onClick={() => handleAddListItem('languages')} variant="secondary" size="sm" icon={<PlusCircleIcon className="w-4 h-4"/>}>Ajouter Langue</ActionButton>
                </div>
              </div>
            )}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="professionalSummary" className="block text-sm font-medium text-slate-300">Résumé Professionnel (CV)</label>
                  <textarea id="professionalSummary" name="professionalSummary" value={(formData as StaffMember).professionalSummary} onChange={handleInputChange} rows={5} className={inputFieldSm}/>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-300">Compétences</label>
                  <div className="flex gap-2">
                    <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => {if(e.key === 'Enter'){ e.preventDefault(); handleAddSkill();}}} placeholder="Ajouter une compétence..." className="input-field-sm flex-grow"/>
                    <ActionButton type="button" onClick={handleAddSkill} size="sm" icon={<PlusCircleIcon className="w-4 h-4"/>}>Ajouter</ActionButton>
                  </div>
                   <div className="flex flex-wrap gap-2 mt-2">
                    {((formData as StaffMember).skills || []).map(skill => (
                      <span key={skill} className="bg-blue-500/80 text-white text-xs px-2 py-1 rounded-full flex items-center">
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-1.5"><XCircleIcon className="w-4 h-4"/></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'calendar' && (
              <div className="space-y-4">
                 <h4 className="font-semibold text-slate-200">Événements Assignés ({assignedEvents.length})</h4>
                 <div className="text-sm font-semibold text-slate-300 flex items-center">
                    <CalendarDaysIcon className="w-4 h-4 mr-2"/> Jours de mission cumulés : {daysAssigned}
                 </div>
                 {assignedEvents.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {assignedEvents.map(event => (
                            <div key={event.id} className="p-2 bg-slate-700 rounded-md">
                                <p className="font-semibold">{event.name} <span className={`text-xs px-2 py-0.5 rounded-full ${EVENT_TYPE_COLORS[event.eventType]}`}>{event.eventType}</span></p>
                                <p className="text-xs text-slate-300">{new Date(event.date + 'T12:00:00Z').toLocaleDateString('fr-CA')} - Rôle: {event.roleInEvent}</p>
                            </div>
                        ))}
                    </div>
                 ) : <p className="italic text-slate-400">Aucun événement assigné.</p>}
                 <h4 className="font-semibold text-slate-200 mt-4">Historique des Évaluations</h4>
                 {staffRatings.count > 0 ? (
                    <div className="p-2 bg-slate-700 rounded-md">
                        <p>Note moyenne: <span className="font-bold text-yellow-400">{staffRatings.average.toFixed(1)} / 5</span> ({staffRatings.count} avis)</p>
                    </div>
                 ) : <p className="italic text-slate-400">Aucune évaluation reçue.</p>}
              </div>
            )}
            {activeTab === 'availability' && (
              <div className="space-y-6">
                <div>
                    <h4 className="font-semibold text-slate-200 mb-2">Disponibilité Hebdomadaire Récurrente</h4>
                    <div className="overflow-x-auto p-2 bg-slate-700/50 rounded-md">
                        <table className="min-w-full text-center text-sm">
                            <thead>
                                <tr>
                                    <th className="py-2 px-1"></th>
                                    {daysOfWeek.map(day => <th key={day} className="py-2 px-1 font-medium text-slate-300">{day}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.map(slot => {
                                    const slotKey = slotKeyMap[slot];
                                    return (
                                        <tr key={slot} className="border-t border-slate-600">
                                            <td className="py-2 px-1 font-medium text-slate-300 text-left">{slot}</td>
                                            {daysOfWeek.map(day => {
                                                const dayKey = dayKeyMap[day];
                                                const isChecked = ((formData as StaffMember).weeklyAvailability?.[dayKey] as any)?.[slotKey] || false;
                                                return (
                                                    <td key={day} className="py-2 px-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={e => handleWeeklyAvailabilityChange(dayKey, slotKey, e.target.checked)}
                                                            className={checkboxField}
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-slate-200 mb-2">Périodes d'Indisponibilité Spécifiques</h4>
                    <div className="p-3 bg-slate-700/50 rounded-md space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                            <div className="md:col-span-1">
                                <label className="text-xs text-slate-400">Date de début</label>
                                <input type="date" value={newAvailability.startDate} onChange={e => setNewAvailability(p => ({ ...p, startDate: e.target.value }))} className={`${inputFieldSm}`} style={{ colorScheme: 'dark' }} />
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-xs text-slate-400">Date de fin</label>
                                <input type="date" value={newAvailability.endDate} onChange={e => setNewAvailability(p => ({ ...p, endDate: e.target.value }))} className={`${inputFieldSm}`} style={{ colorScheme: 'dark' }} />
                            </div>
                            <div className="md:col-span-2">
                                <ActionButton type="button" onClick={handleAddAvailabilityPeriod} icon={<PlusCircleIcon className="w-4 h-4" />} size="sm">Ajouter Période</ActionButton>
                            </div>
                        </div>
                        {((formData as StaffMember).availability || []).filter(p => p.status === AvailabilityStatus.NON_DISPONIBLE).length > 0 ? (
                            <ul className="space-y-1 text-sm max-h-40 overflow-y-auto pr-1">
                                {((formData as StaffMember).availability || []).filter(p => p.status === AvailabilityStatus.NON_DISPONIBLE).map(period => (
                                    <li key={period.id} className="flex justify-between items-center p-1.5 bg-slate-800 rounded">
                                        <span className="text-slate-300">Du {period.startDate} au {period.endDate}</span>
                                        <ActionButton type="button" onClick={() => handleRemoveAvailabilityPeriod(period.id)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3" />} className="!p-1" />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-slate-400 italic">Aucune période d'indisponibilité ajoutée.</p>
                        )}
                    </div>
                </div>
              </div>
            )}
             {activeTab === 'admin' && (
              <div>
                  <h4 className="font-semibold text-slate-200 mb-2">Zone Admin (Manager)</h4>
                  <div className="p-3 bg-slate-700/50 rounded-md space-y-3">
                      <div>
                          <label className="text-sm text-slate-400">UCI ID</label>
                          <input type="text" name="uciId" value={(formData as StaffMember).uciId || ''} onChange={handleInputChange} className={inputFieldSm} />
                      </div>
                      <div>
                          <label className="text-sm text-slate-400">N° de Licence</label>
                          <input type="text" name="licenseNumber" value={(formData as StaffMember).licenseNumber || ''} onChange={handleInputChange} className={inputFieldSm} />
                      </div>
                       <div>
                          <label className="text-sm text-slate-400">Image de la Licence</label>
                          <input type="file" id="staffLicenseUpload" accept="image/*" onChange={handleLicenseUpload} className="block w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-600 file:text-slate-200 hover:file:bg-slate-500"/>
                          {(formData as StaffMember).licenseImageBase64 && (
                              <div className="mt-2">
                                  <img src={`data:${(formData as StaffMember).licenseImageMimeType};base64,${(formData as StaffMember).licenseImageBase64}`} alt="licence" className="max-h-24 rounded border border-slate-500"/>
                                  <ActionButton type="button" onClick={handleRemoveLicense} variant="danger" size="sm" className="mt-1 text-xs"><TrashIcon className="w-3 h-3 mr-1"/> Supprimer</ActionButton>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-slate-700">
            <ActionButton type="button" variant="secondary" onClick={onClose}>Annuler</ActionButton>
            <ActionButton type="submit">Sauvegarder</ActionButton>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default StaffDetailModal;