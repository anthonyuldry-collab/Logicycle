import React, { useState, useEffect } from 'react';
import { Rider, User, UserRole, StaffMember } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import AdminTab from '../components/riderDetailTabs/AdminTab';
import XCircleIcon from '../components/icons/XCircleIcon';
import { useTranslations } from '../hooks/useTranslations';

interface AdminDossierSectionProps {
  riders: Rider[];
  staff: StaffMember[];
  currentUser: User;
  setRiders: (updater: React.SetStateAction<Rider[]>) => void;
  setStaff: (updater: React.SetStateAction<StaffMember[]>) => void;
}

const AdminDossierSection: React.FC<AdminDossierSectionProps> = ({ riders, staff, currentUser, setRiders, setStaff }) => {
  const [profileData, setProfileData] = useState<Rider | StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslations();

  useEffect(() => {
    let userProfile: Rider | StaffMember | undefined;

    if (currentUser.userRole === UserRole.COUREUR) {
        userProfile = riders.find(r => r.email === currentUser.email);
    } else if (currentUser.userRole === UserRole.STAFF || currentUser.userRole === UserRole.MANAGER) {
        userProfile = staff.find(s => s.email === currentUser.email);
    }
    
    if (userProfile) {
        setProfileData(structuredClone(userProfile));
    }

    setIsLoading(false);
  }, [riders, staff, currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setProfileData(prev => {
        if (!prev) return null;
        
        const newFormData = structuredClone(prev);
        const keys = name.split('.');
        
        let currentLevel: any = newFormData;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            currentLevel[key] = { ...(currentLevel[key] || {}) };
            currentLevel = currentLevel[key];
        }
        const lastKey = keys[keys.length - 1];
        currentLevel[lastKey] = value;
        
        return newFormData;
    });
  };
  
  const handleLicenseUpdate = (base64?: string, mimeType?: string) => {
    setProfileData(prev => {
        if (!prev) return null;
        const updated = structuredClone(prev);
        if (base64 && mimeType) {
            updated.licenseImageBase64 = base64.split(',')[1];
            updated.licenseImageMimeType = mimeType;
        } else {
            updated.licenseImageBase64 = undefined;
            updated.licenseImageMimeType = undefined;
        }
        return updated;
    });
  };

  const handleSave = () => {
    if (!profileData) return;
    if ('licenseNumber' in profileData) {
      if (currentUser.userRole === UserRole.COUREUR) {
        setRiders(prevRiders => prevRiders.map(r => r.id === (profileData as Rider).id ? (profileData as Rider) : r));
      } else {
        setStaff(prevStaff => prevStaff.map(s => s.id === (profileData as StaffMember).id ? (profileData as StaffMember) : s));
      }
    }
    alert(t('saveSuccess'));
  };

  if (isLoading) {
    return <SectionWrapper title={t('titleMyAdminFile')}><p>{t('loading')}</p></SectionWrapper>;
  }

  if (!profileData) {
    return (
      <SectionWrapper title={t('titleMyAdminFile')}>
        <div className="text-center p-8 bg-gray-50 rounded-lg border">
            <XCircleIcon className="w-12 h-12 mx-auto text-red-400" />
            <p className="mt-4 text-lg font-medium text-gray-700">Profil non trouvé</p>
            <p className="mt-2 text-gray-500">Impossible de charger votre dossier administratif. Veuillez contacter le support.</p>
        </div>
      </SectionWrapper>
    );
  }
  
  return (
    <SectionWrapper title={t('titleMyAdminFile')} actionButton={<ActionButton onClick={handleSave}>Sauvegarder</ActionButton>}>
      <div className="bg-slate-800 text-white p-4 rounded-lg shadow-md">
        <AdminTab
          formData={profileData}
          handleInputChange={handleInputChange}
          formFieldsEnabled={true}
          handleLicenseUpdate={handleLicenseUpdate}
          isContractEditable={false}
        />
      </div>
    </SectionWrapper>
  );
};

export default AdminDossierSection;