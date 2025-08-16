import React, { useState, useMemo } from 'react';
import { AppPermissions, PermissionRole, AppSection, PermissionLevel, User } from '../types';
import { SECTIONS } from '../constants';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import { useTranslations } from '../hooks/useTranslations';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';

const generateId = () => `role_${Date.now().toString(36)}`;

interface PermissionsSectionProps {
  permissions: AppPermissions;
  setPermissions: React.Dispatch<React.SetStateAction<AppPermissions>>;
  permissionRoles: PermissionRole[];
  setPermissionRoles: React.Dispatch<React.SetStateAction<PermissionRole[]>>;
  users: User[];
}

const PermissionsTable: React.FC<{
  permissionsForRole: Partial<Record<AppSection, PermissionLevel[]>>;
  onPermissionChange: (sectionId: AppSection, permission: PermissionLevel, isChecked: boolean) => void;
}> = ({ permissionsForRole, onPermissionChange }) => {
    const { language } = useTranslations();
    const sectionsForPermissions = SECTIONS.filter(s => s.id !== 'eventDetail');

    return (
        <div className="overflow-x-auto bg-gray-50 rounded-lg shadow-inner mt-3">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600">
                    <tr>
                        <th className="px-4 py-2 text-left font-semibold">Section</th>
                        <th className="px-4 py-2 text-center font-semibold border-l">Lecture</th>
                        <th className="px-4 py-2 text-center font-semibold border-l">Modification</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {sectionsForPermissions.map(section => {
                        const perms = permissionsForRole[section.id as AppSection] || [];
                        const canView = perms.includes('view');
                        const canEdit = perms.includes('edit');
                        
                        return (
                            <tr key={section.id}>
                                <td className="px-4 py-2 font-medium text-gray-800">{section.labels[language] || section.labels['fr']}</td>
                                <td className="px-4 py-2 border-l text-center">
                                    <input
                                        type="checkbox"
                                        checked={canView}
                                        onChange={e => onPermissionChange(section.id as AppSection, 'view', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-2 border-l text-center">
                                     <input
                                        type="checkbox"
                                        checked={canEdit}
                                        onChange={e => onPermissionChange(section.id as AppSection, 'edit', e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};


const PermissionsSection: React.FC<PermissionsSectionProps> = ({ 
    permissions, 
    setPermissions, 
    permissionRoles, 
    setPermissionRoles, 
    users 
}) => {
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [currentRoleName, setCurrentRoleName] = useState('');
  const [roleToDelete, setRoleToDelete] = useState<PermissionRole | null>(null);

  const handleEditRole = (role: PermissionRole) => {
    setEditingRoleId(role.id);
    setCurrentRoleName(role.name);
    setIsRoleModalOpen(true);
  };
  
  const handleAddNewRole = () => {
    setEditingRoleId(null);
    setCurrentRoleName('');
    setIsRoleModalOpen(true);
  };
  
  const handleSaveRole = () => {
    if (!currentRoleName.trim()) return;

    if (editingRoleId) { // Editing existing role
      setPermissionRoles(prevRoles =>
        prevRoles.map(r => (r.id === editingRoleId ? { ...r, name: currentRoleName.trim() } : r))
      );
    } else { // Adding new role
      const newRoleId = generateId();
      setPermissionRoles(prevRoles => [
        ...prevRoles,
        { id: newRoleId, name: currentRoleName.trim(), isDeletable: true },
      ]);
      setPermissions(prevPerms => ({
        ...prevPerms,
        [newRoleId]: {},
      }));
    }
    setIsRoleModalOpen(false);
  };
  
  const handleDeleteRole = () => {
    if (!roleToDelete) return;

    // Remove the role
    setPermissionRoles(prevRoles => prevRoles.filter(r => r.id !== roleToDelete.id));
    
    // Remove its permissions
    setPermissions(prevPerms => {
      const newPerms = { ...prevPerms };
      delete newPerms[roleToDelete.id];
      return newPerms;
    });

    // Reassign users to a default role (e.g., 'Membre')
    const memberRole = permissionRoles.find(r => r.name === 'Membre');
    if (memberRole) {
        // This part would ideally be handled in App.tsx or a global context
        // to update the users state. For now, we just proceed with the deletion.
        console.log(`Users with role ${roleToDelete.name} should be reassigned.`);
    }

    setRoleToDelete(null);
  };

  const handlePermissionChange = (
    roleId: string,
    sectionId: AppSection,
    permission: PermissionLevel,
    isChecked: boolean
  ) => {
    setPermissions(currentPermissions => {
      const newPermissions = structuredClone(currentPermissions || {});
      
      if (!newPermissions[roleId]) {
        newPermissions[roleId] = {};
      }
      if (!newPermissions[roleId][sectionId]) {
        newPermissions[roleId][sectionId] = [];
      }
      
      let sectionPerms = newPermissions[roleId][sectionId] as PermissionLevel[];
      
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
      
      newPermissions[roleId][sectionId] = sectionPerms;
      return newPermissions;
    });
  };

  const isRoleInUse = (roleId: string) => users.some(u => u.permissionRole === roleId);

  return (
    <SectionWrapper 
      title="Gestion des Rôles et Permissions"
      actionButton={
        <ActionButton onClick={handleAddNewRole} icon={<PlusCircleIcon className="w-5 h-5"/>}>
          Ajouter un Rôle
        </ActionButton>
      }
    >
        <p className="text-gray-600 text-sm mb-6">
            Définissez des rôles personnalisés (ex: Mécano, Soigneur) et assignez des permissions précises pour chaque section de l'application. Le rôle <strong className="font-semibold">Administrateur</strong> a toujours un accès complet et n'est pas configurable.
        </p>

        <div className="space-y-4">
            {permissionRoles.filter(r => r.name !== 'Administrateur').map(role => (
                <details key={role.id} className="p-4 bg-white rounded-lg shadow-md border border-gray-200" open={false}>
                    <summary className="flex justify-between items-center cursor-pointer">
                        <div className="flex items-center">
                            <ShieldCheckIcon className="w-6 h-6 mr-3 text-blue-500" />
                            <h3 className="text-lg font-semibold text-gray-800">{role.name}</h3>
                        </div>
                        <div className="space-x-2">
                           <ActionButton onClick={(e) => { e.preventDefault(); handleEditRole(role); }} variant="secondary" size="sm" icon={<PencilIcon className="w-4 h-4" />}>
                                Renommer
                            </ActionButton>
                           {role.isDeletable && (
                            <ActionButton onClick={(e) => { e.preventDefault(); setRoleToDelete(role); }} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4" />} disabled={isRoleInUse(role.id)} title={isRoleInUse(role.id) ? "Ce rôle est utilisé et ne peut être supprimé." : "Supprimer ce rôle"}>
                                Supprimer
                            </ActionButton>
                           )}
                        </div>
                    </summary>
                    <PermissionsTable
                        permissionsForRole={permissions[role.id] || {}}
                        onPermissionChange={(section, permission, isChecked) => handlePermissionChange(role.id, section, permission, isChecked)}
                    />
                </details>
            ))}
        </div>

        <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title={editingRoleId ? "Renommer le Rôle" : "Nouveau Rôle"}>
            <div>
                <label htmlFor="roleName" className="block text-sm font-medium text-gray-700">Nom du rôle</label>
                <input
                    type="text"
                    id="roleName"
                    value={currentRoleName}
                    onChange={(e) => setCurrentRoleName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 placeholder-gray-500"
                />
                <div className="mt-4 flex justify-end space-x-2">
                    <ActionButton variant="secondary" onClick={() => setIsRoleModalOpen(false)}>Annuler</ActionButton>
                    <ActionButton onClick={handleSaveRole}>Sauvegarder</ActionButton>
                </div>
            </div>
        </Modal>

        {roleToDelete && (
             <ConfirmationModal
                isOpen={!!roleToDelete}
                onClose={() => setRoleToDelete(null)}
                onConfirm={handleDeleteRole}
                title={`Supprimer le rôle "${roleToDelete.name}"`}
                message="Êtes-vous sûr de vouloir supprimer ce rôle ? Cette action est irréversible. Les utilisateurs assignés à ce rôle devront être réassignés."
            />
        )}

    </SectionWrapper>
  );
};

export default PermissionsSection;