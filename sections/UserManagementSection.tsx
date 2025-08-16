
import React, { useState } from 'react';
import { AppState, TeamMembership, TeamMembershipStatus, TeamRole, User, UserRole, PermissionLevel, AppSection, Team } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import XCircleIcon from '../components/icons/XCircleIcon';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import TrashIcon from '../components/icons/TrashIcon';
import KeyIcon from '../components/icons/KeyIcon';
import UserPermissionsModal from '../components/UserPermissionsModal';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';

interface UserManagementSectionProps {
    appState: AppState;
    currentTeamId: string;
    onApprove: (membership: TeamMembership) => void;
    onDeny: (membership: TeamMembership) => void;
    onInvite: (email: string, teamId: string) => void;
    onRemove: (userId: string, teamId: string) => void;
    onUpdateRole: (userId: string, teamId: string, newUserRole: UserRole) => void;
    onUpdatePermissionRole: (userId: string, newPermissionRole: TeamRole) => void;
    onUpdateUserCustomPermissions: (userId: string, newEffectivePermissions: Partial<Record<AppSection, PermissionLevel[]>>) => void;
    onTransferUser: (userId: string, fromTeamId: string, toTeamId: string) => void;
}

const UserManagementSection: React.FC<UserManagementSectionProps> = ({ 
    appState, 
    currentTeamId,
    onApprove, 
    onDeny, 
    onInvite, 
    onRemove, 
    onUpdateRole, 
    onUpdatePermissionRole,
    onUpdateUserCustomPermissions,
    onTransferUser
}) => {
    const { users, teams, teamMemberships } = appState;
    const [inviteEmail, setInviteEmail] = useState('');
    const [editingPermissionsForUser, setEditingPermissionsForUser] = useState<User | null>(null);
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [userToTransfer, setUserToTransfer] = useState<User | null>(null);
    const [destinationTeamId, setDestinationTeamId] = useState('');
    const [transferConfirmation, setTransferConfirmation] = useState<{ user: User; team: Team } | null>(null);

    const pendingMemberships = teamMemberships.filter(m => m.status === TeamMembershipStatus.PENDING && m.teamId === currentTeamId);
    const activeMemberships = teamMemberships.filter(m => m.status === TeamMembershipStatus.ACTIVE && m.teamId === currentTeamId);
    
    const getUser = (userId: string) => users.find(u => u.id === userId);
    const getTeam = (teamId: string) => teams.find(t => t.id === teamId);

    const handleInviteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inviteEmail) {
            onInvite(inviteEmail, currentTeamId);
            setInviteEmail('');
        }
    };

    const openTransferModal = (user: User) => {
        setUserToTransfer(user);
        const firstOtherTeam = teams.find(t => t.id !== currentTeamId);
        setDestinationTeamId(firstOtherTeam ? firstOtherTeam.id : '');
        setTransferModalOpen(true);
    };

    const handleTransferConfirm = () => {
        if (userToTransfer && destinationTeamId) {
            const destinationTeam = teams.find(t => t.id === destinationTeamId);
            if (destinationTeam) {
                setTransferConfirmation({ user: userToTransfer, team: destinationTeam });
            }
            setTransferModalOpen(false);
        }
    };
    
    const executeTransfer = () => {
        if (transferConfirmation) {
            onTransferUser(transferConfirmation.user.id, currentTeamId, transferConfirmation.team.id);
            setTransferConfirmation(null);
            setUserToTransfer(null);
        }
    };

    return (
        <SectionWrapper title="Gestion des Utilisateurs et des Accès">
            <div className="space-y-8">
                <div className="p-4 bg-white rounded-lg shadow-md border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Inviter un nouveau membre</h3>
                    <form onSubmit={handleInviteSubmit} className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="email@du.nouveau.membre"
                            required
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <ActionButton type="submit" icon={<PlusCircleIcon className="w-5 h-5"/>}>
                            Envoyer une invitation
                        </ActionButton>
                    </form>
                </div>
                {/* Section des demandes en attente */}
                <div className="p-4 bg-white rounded-lg shadow-md border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Demandes d'Adhésion en Attente</h3>
                    {pendingMemberships.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Aucune nouvelle demande d'adhésion.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600">
                                    <tr>
                                        <th className="px-4 py-2">Nom</th>
                                        <th className="px-4 py-2">Email</th>
                                        <th className="px-4 py-2">Équipe Demandée</th>
                                        <th className="px-4 py-2">Rôle Demandé</th>
                                        <th className="px-4 py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {pendingMemberships.map(membership => {
                                        const user = getUser(membership.userId);
                                        const team = getTeam(membership.teamId);
                                        if (!user || !team) return null;

                                        return (
                                            <tr key={membership.userId + membership.teamId}>
                                                <td className="px-4 py-2 font-medium">{user.firstName} {user.lastName}</td>
                                                <td className="px-4 py-2 text-gray-600">{user.email}</td>
                                                <td className="px-4 py-2 text-gray-600">{team.name}</td>
                                                <td className="px-4 py-2 text-gray-600">{membership.userRole}</td>
                                                <td className="px-4 py-2 text-right space-x-2">
                                                    <ActionButton onClick={() => onApprove(membership)} variant="primary" size="sm" icon={<CheckCircleIcon className="w-4 h-4" />}>
                                                        Approuver
                                                    </ActionButton>
                                                    <ActionButton onClick={() => onDeny(membership)} variant="danger" size="sm" icon={<XCircleIcon className="w-4 h-4" />}>
                                                        Refuser
                                                    </ActionButton>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Liste des membres actifs */}
                <div className="p-4 bg-white rounded-lg shadow-md border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Membres Actifs</h3>
                    {activeMemberships.length === 0 ? (
                         <p className="text-sm text-gray-500 italic">Aucun membre actif dans l'équipe.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600">
                                    <tr>
                                        <th className="px-4 py-2">Nom</th>
                                        <th className="px-4 py-2">Rôle Fonctionnel</th>
                                        <th className="px-4 py-2">Rôle Permissions</th>
                                        <th className="px-4 py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {activeMemberships.map(membership => {
                                        const user = getUser(membership.userId);
                                        if (!user) return null;

                                        const isLastAdmin = user.permissionRole === TeamRole.ADMIN && users.filter(u => u.permissionRole === TeamRole.ADMIN).length <= 1;

                                        return (
                                            <tr key={membership.userId + membership.teamId}>
                                                <td className="px-4 py-2 font-medium">{user.firstName} {user.lastName} <span className="text-gray-500 text-xs">({user.email})</span></td>
                                                <td className="px-4 py-2 text-gray-600 w-48">
                                                    {user.permissionRole === TeamRole.ADMIN ? (
                                                        membership.userRole
                                                    ) : (
                                                        <select
                                                            value={membership.userRole}
                                                            onChange={(e) => onUpdateRole(user.id, currentTeamId, e.target.value as UserRole)}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs bg-white text-gray-900"
                                                        >
                                                            {Object.values(UserRole).map(role => (
                                                                <option key={role} value={role}>{role}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-gray-600 w-48">
                                                    <select
                                                        value={user.permissionRole}
                                                        onChange={(e) => onUpdatePermissionRole(user.id, e.target.value as TeamRole)}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        disabled={isLastAdmin}
                                                        title={isLastAdmin ? "Impossible de modifier le rôle du dernier administrateur." : ""}
                                                    >
                                                        {Object.values(TeamRole).map(role => (
                                                            <option key={role} value={role}>{role}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2 text-right space-x-2">
                                                    <ActionButton onClick={() => openTransferModal(user)} variant="secondary" size="sm">Transférer</ActionButton>
                                                    <ActionButton onClick={() => setEditingPermissionsForUser(user)} variant="secondary" size="sm" icon={<KeyIcon className="w-4 h-4" />} title="Gérer les permissions individuelles" disabled={user.permissionRole === TeamRole.ADMIN}/>
                                                    <ActionButton onClick={() => onRemove(user.id, currentTeamId)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4"/>} disabled={isLastAdmin} title={isLastAdmin ? "Impossible de supprimer le dernier administrateur." : "Retirer de l'équipe"}/>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
             {editingPermissionsForUser && (
                <UserPermissionsModal
                    isOpen={!!editingPermissionsForUser}
                    onClose={() => setEditingPermissionsForUser(null)}
                    user={editingPermissionsForUser}
                    basePermissions={appState.permissions}
                    onSave={onUpdateUserCustomPermissions}
                />
            )}
            {transferModalOpen && userToTransfer && (
                <Modal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} title={`Transférer ${userToTransfer.firstName} ${userToTransfer.lastName}`}>
                    <div className="space-y-4">
                        <p>Sélectionnez l'équipe de destination pour {userToTransfer.firstName}. Son affiliation à l'équipe actuelle sera désactivée et une demande sera envoyée à la nouvelle équipe.</p>
                        <div>
                            <label htmlFor="destination-team" className="block text-sm font-medium text-gray-700">Équipe de destination</label>
                            <select
                                id="destination-team"
                                value={destinationTeamId}
                                onChange={(e) => setDestinationTeamId(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="">-- Sélectionnez --</option>
                                {teams.filter(t => t.id !== currentTeamId).map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                         <div className="flex justify-end space-x-2 pt-3">
                            <ActionButton type="button" variant="secondary" onClick={() => setTransferModalOpen(false)}>Annuler</ActionButton>
                            <ActionButton onClick={handleTransferConfirm} disabled={!destinationTeamId}>Confirmer le Transfert</ActionButton>
                        </div>
                    </div>
                </Modal>
            )}
            {transferConfirmation && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setTransferConfirmation(null)}
                    onConfirm={executeTransfer}
                    title={`Confirmer le transfert de ${transferConfirmation.user.firstName} ${transferConfirmation.user.lastName}`}
                    message={
                        <span>
                            Êtes-vous sûr de vouloir initier le transfert vers l'équipe <strong>{transferConfirmation.team.name}</strong> ?
                            <br />
                            L'affiliation actuelle sera désactivée et une nouvelle demande sera créée.
                        </span>
                    }
                />
            )}
        </SectionWrapper>
    );
};

export default UserManagementSection;
