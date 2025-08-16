
import React from 'react';
import { Rider, StaffMember } from '../../types';
import ActionButton from '../ActionButton';
import TrashIcon from '../icons/TrashIcon';
import { ALL_COUNTRIES } from '../../constants';

interface AdminTabProps {
    formData: Rider | StaffMember | Omit<Rider, 'id'> | Omit<StaffMember, 'id'>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    formFieldsEnabled: boolean;
    handleLicenseUpdate: (base64?: string, mimeType?: string) => void;
    isContractEditable?: boolean;
}

const AdminTab: React.FC<AdminTabProps> = ({
    formData,
    handleInputChange,
    formFieldsEnabled,
    handleLicenseUpdate,
    isContractEditable = true,
}) => {
    
    const isRider = 'qualitativeProfile' in formData;

    const handleLicenseUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const mimeType = result.substring(result.indexOf(':') + 1, result.indexOf(';'));
            handleLicenseUpdate(result, mimeType); 
          };
          reader.readAsDataURL(file);
        }
    };

    const handleRemoveLicense = () => {
        handleLicenseUpdate(undefined, undefined);
        const fileInput = document.getElementById('licenseImageUpload') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    };
    
    let licenseImageSrc: string | undefined;
    if ((formData as Rider | StaffMember).licenseImageBase64 && (formData as Rider | StaffMember).licenseImageMimeType) {
        licenseImageSrc = `data:${(formData as Rider | StaffMember).licenseImageMimeType};base64,${(formData as Rider | StaffMember).licenseImageBase64}`;
    } else if (isRider && (formData as Rider).licenseImageUrl) {
        licenseImageSrc = (formData as Rider).licenseImageUrl;
    }


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <fieldset className="border border-slate-600 p-3 rounded-md space-y-2"><legend className="text-md font-medium text-slate-200 px-1">Coordonnées</legend>
              <div><label className="text-sm font-medium">Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="input-field-sm w-full" disabled={!formFieldsEnabled}/></div>
              <div><label className="text-sm font-medium">Téléphone</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="input-field-sm w-full" disabled={!formFieldsEnabled}/></div>
              <div><label className="text-sm font-medium">Adresse</label>
                  <input type="text" name="address.streetName" value={formData.address?.streetName || ''} onChange={handleInputChange} placeholder="Rue" className="input-field-sm w-full mb-1" disabled={!formFieldsEnabled}/>
                  <div className="grid grid-cols-2 gap-1">
                      <input type="text" name="address.postalCode" value={formData.address?.postalCode || ''} onChange={handleInputChange} placeholder="Code Postal" className="input-field-sm" disabled={!formFieldsEnabled}/>
                      <input type="text" name="address.city" value={formData.address?.city || ''} onChange={handleInputChange} placeholder="Ville" className="input-field-sm" disabled={!formFieldsEnabled}/>
                  </div>
                   <div className="grid grid-cols-2 gap-1 mt-1">
                      <input type="text" name="address.region" value={formData.address?.region || ''} onChange={handleInputChange} placeholder="Région/Département" className="input-field-sm" disabled={!formFieldsEnabled}/>
                      <select name="address.country" value={formData.address?.country || ''} onChange={handleInputChange} className="input-field-sm" disabled={!formFieldsEnabled}>
                        <option value="">-- Pays --</option>
                        {ALL_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                      </select>
                  </div>
              </div>
              {isRider && (
                <div><label className="text-sm font-medium">Contact d'Urgence</label>
                   <input type="text" name="emergencyContactName" value={(formData as Rider).emergencyContactName || ''} onChange={handleInputChange} placeholder="Nom du contact" className="input-field-sm w-full mb-1" disabled={!formFieldsEnabled}/>
                   <input type="tel" name="emergencyContactPhone" value={(formData as Rider).emergencyContactPhone || ''} onChange={handleInputChange} placeholder="Téléphone du contact" className="input-field-sm w-full" disabled={!formFieldsEnabled}/>
                </div>
              )}
            </fieldset>
             <fieldset className="border border-slate-600 p-3 rounded-md space-y-2"><legend className="text-md font-medium text-slate-200 px-1">Informations Administratives</legend>
                  <div><label className="text-sm font-medium">N° UCI</label><input type="text" name="uciId" value={formData.uciId || ''} onChange={handleInputChange} className="input-field-sm w-full" disabled={!formFieldsEnabled}/></div>
                  <div><label className="text-sm font-medium">N° Licence FFC</label><input type="text" name="licenseNumber" value={formData.licenseNumber || ''} onChange={handleInputChange} className="input-field-sm w-full" disabled={!formFieldsEnabled}/></div>
                  <div><label className="text-sm font-medium">Image Licence</label>
                      {formFieldsEnabled && <input type="file" id="licenseImageUpload" accept="image/*" onChange={handleLicenseUpload} className="block w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-600 file:text-slate-200 hover:file:bg-slate-500" />}
                      {licenseImageSrc && <img src={licenseImageSrc} alt="licence" className="max-h-24 mt-1 rounded border border-slate-500"/>}
                      {formFieldsEnabled && licenseImageSrc && <ActionButton type="button" onClick={handleRemoveLicense} variant="danger" size="sm" className="mt-1 text-xs"><TrashIcon className="w-3 h-3 mr-1"/> Supprimer Image</ActionButton>}
                  </div>
                  {isRider && (
                    <>
                        <div><label className="text-sm font-medium">N° Sécurité Sociale</label><input type="text" name="socialSecurityNumber" value={(formData as Rider).socialSecurityNumber || ''} onChange={handleInputChange} className="input-field-sm w-full" disabled={!formFieldsEnabled}/></div>
                        <div><label className="text-sm font-medium">Mutuelle</label>
                            <input type="text" name="healthInsurance.name" value={(formData as Rider).healthInsurance?.name || ''} onChange={handleInputChange} placeholder="Nom de la mutuelle" className="input-field-sm w-full mb-1" disabled={!formFieldsEnabled}/>
                            <input type="text" name="healthInsurance.policyNumber" value={(formData as Rider).healthInsurance?.policyNumber || ''} onChange={handleInputChange} placeholder="N° de police" className="input-field-sm w-full" disabled={!formFieldsEnabled}/>
                        </div>
                         <div><label className="text-sm font-medium">Agence / Agent</label>
                            <input type="text" name="agency.name" value={(formData as Rider).agency?.name || ''} onChange={handleInputChange} placeholder="Nom de l'agence" className="input-field-sm w-full mb-1" disabled={!formFieldsEnabled}/>
                            <input type="text" name="agency.agentName" value={(formData as Rider).agency?.agentName || ''} onChange={handleInputChange} placeholder="Nom & Prénom de l'agent" className="input-field-sm w-full mb-1" disabled={!formFieldsEnabled}/>
                            <input type="tel" name="agency.agentPhone" value={(formData as Rider).agency?.agentPhone || ''} onChange={handleInputChange} placeholder="Téléphone agent" className="input-field-sm w-full mb-1" disabled={!formFieldsEnabled}/>
                            <input type="email" name="agency.agentEmail" value={(formData as Rider).agency?.agentEmail || ''} onChange={handleInputChange} placeholder="Email agent" className="input-field-sm w-full" disabled={!formFieldsEnabled}/>
                        </div>
                    </>
                  )}
              </fieldset>
              <fieldset className="border border-slate-600 p-3 rounded-md space-y-2 md:col-span-2"><legend className="text-md font-medium text-slate-200 px-1">Contrat</legend>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div><label className="text-sm font-medium">Salaire Mensuel Brut (€)</label><input type="number" name="salary" value={formData.salary ?? ''} onChange={handleInputChange} step="0.01" className="input-field-sm w-full" disabled={!formFieldsEnabled || !isContractEditable}/></div>
                      <div><label className="text-sm font-medium">Fin de Contrat</label><input type="date" name="contractEndDate" value={formData.contractEndDate || ''} onChange={handleInputChange} className="input-field-sm w-full" style={{colorScheme: 'dark'}} disabled={!formFieldsEnabled || !isContractEditable}/></div>
                      {isRider && (
                        <div className="lg:col-span-2"><label className="text-sm font-medium">Équipe Saison Prochaine</label><input type="text" name="nextSeasonTeam" value={(formData as Rider).nextSeasonTeam || ''} onChange={handleInputChange} className="input-field-sm w-full" disabled={!formFieldsEnabled || !isContractEditable}/></div>
                      )}
                   </div>
              </fieldset>
        </div>
    );
};

export default AdminTab;
