import React, { useState, useEffect, useMemo } from 'react';
import { AppPermissions, TeamRole, AppSection, PermissionLevel, User } from '../types';
import { SECTIONS } from '../constants';
import Modal from './Modal';
import ActionButton from './ActionButton';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  basePermissions: AppPermissions;
  onSave: (userId: string, newEffectivePermissions: Partial<Record<AppSection, PermissionLevel[]>>) => void;
}

const getEffectivePermissions = (user: User, basePermissions: AppPermissions): Partial<Record<AppSection, PermissionLevel[]>> => {
    if (user.permissionRole === TeamRole.ADMIN) {
        const allPermissions: Partial<Record<AppSection, PermissionLevel[]>> = {};
        SECTIONS.forEach(section => {
            allPermissions[section.id as AppSection] = ['view', 'edit'];
        });
        return allPermissions;
    }

    const rolePerms = basePermissions[user.permissionRole] || {};
    const effectivePerms = structuredClone(rolePerms);
    
    if (user.customPermissions) {
        for (const sectionKey in user.customPermissions) {
            const section = sectionKey as AppSection;
            effectivePerms[section] = user.customPermissions[section];
        }
    }
    
    return effectivePerms;
};


const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({ isOpen, onClose, user, basePermissions, onSave }) => {
  const [effectivePermissions, setEffectivePermissions] = useState<Partial<Record<AppSection, PermissionLevel[]>>>({});

  useEffect(() => {
    if (user) {
      setEffectivePermissions(getEffectivePermissions(user, basePermissions));
    }
  }, [user, basePermissions, isOpen]);

  const handlePermissionChange = (sectionId: AppSection, permission: PermissionLevel, isChecked: boolean) => {
    setEffectivePermissions(currentPermissions => {
      const newPermissions = structuredClone(currentPermissions || {});
      
      if (!newPermissions[sectionId]) {
        newPermissions[sectionId] = [];
      }
      
      let sectionPerms = newPermissions[sectionId] as PermissionLevel[];
      
      if (isChecked) {
        if (!sectionPerms.includes(permission)) {
          sectionPerms.push(permission);
        }
        if (permission === 'edit' && !sectionPerms.includes('view')) {
            sectionPerms.push('view');
        }
      } else {
        sectionPerms = sectionPerms.filter(p => p !== permission);
        if (permission === 'view' && sectionPerms.includes('edit')) {
            sectionPerms = sectionPerms.filter(p => p !== 'edit');
        }
      }
      
      newPermissions[sectionId] = sectionPerms;
      return newPermissions;
    });
  };
  
  const handleSave = () => {
    onSave(user.id, effectivePermissions);
    onClose();
  };

  const sectionsForPermissions = useMemo(() => {
      const grouped = SECTIONS.reduce((acc, section) => {
          if (section.id === 'eventDetail') return acc;
          const group = section.group['fr'] || "Autres";
          if(!(acc as any)[group]) (acc as any)[group] = [];
          (acc as any)[group].push(section);
          return acc;
      }, {} as Record<string, typeof SECTIONS>);
      
      const groupOrder = ["Pilotage", "Mon Espace", "Données Générales", "Logistique", "Application", "Autres"];
      return groupOrder.flatMap(groupName => grouped[groupName] || []);
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Permissions pour ${user.firstName} ${user.lastName}`}>
        <div className="text-sm text-gray-600 mb-4">
            <p>Rôle de base : <strong className="font-semibold">{user.permissionRole}</strong>. Les permissions ci-dessous outrepassent celles définies pour ce rôle.</p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 sticky top-0">
                    <tr>
                        <th className="px-4 py-2 text-left font-semibold">Section</th>
                        <th className="px-4 py-2 text-center font-semibold border-l">Lecture</th>
                        <th className="px-4 py-2 text-center font-semibold border-l">Modification</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {sectionsForPermissions.map(section => {
                        const perms = effectivePermissions[section.id as AppSection] || [];
                        const canView = perms.includes('view');
                        const canEdit = perms.includes('edit');
                        const basePerms = basePermissions[user.permissionRole]?.[section.id as AppSection] || [];
                        const isCustomView = canView !== basePerms.includes('view');
                        const isCustomEdit = canEdit !== basePerms.includes('edit');
                        
                        return (
                            <tr key={section.id} className={isCustomView || isCustomEdit ? 'bg-blue-50' : ''}>
                                <td className="px-4 py-2 font-medium text-gray-800">{section.labels['fr']}</td>
                                <td className="px-4 py-2 border-l text-center">
                                    <input
                                        type="checkbox"
                                        checked={canView}
                                        onChange={e => handlePermissionChange(section.id as AppSection, 'view', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-2 border-l text-center">
                                     <input
                                        type="checkbox"
                                        checked={canEdit}
                                        onChange={e => handlePermissionChange(section.id as AppSection, 'edit', e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <ActionButton variant="secondary" onClick={onClose}>Annuler</ActionButton>
            <ActionButton onClick={handleSave}>Sauvegarder les Permissions</ActionButton>
        </div>
    </Modal>
  );
};

export default UserPermissionsModal;