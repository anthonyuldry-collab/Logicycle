
import React, { useState, useMemo } from 'react';
import { TeamRole, User, UserRole } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import TrashIcon from '../components/icons/TrashIcon';

// Define TeamMember locally for this component
interface TeamMember {
    userId: string;
    teamId: string;
    role: TeamRole;
    user: User;
}

// Données factices pour la démonstration
const mockUsers: User[] = [
    { id: 'user-1', email: 'jean.dupont@email.com', firstName: 'Jean', lastName: 'Dupont', permissionRole: TeamRole.ADMIN, userRole: UserRole.MANAGER },
    { id: 'user-2', email: 'marie.curie@email.com', firstName: 'Marie', lastName: 'Curie', permissionRole: TeamRole.EDITOR, userRole: UserRole.STAFF },
    { id: 'user-3', email: 'pierre.durand@email.com', firstName: 'Pierre', lastName: 'Durand', permissionRole: TeamRole.VIEWER, userRole: UserRole.COUREUR },
];

const mockTeamMembers: TeamMember[] = [
    { userId: 'user-1', teamId: 'team-1', role: TeamRole.ADMIN, user: mockUsers[0] },
    { userId: 'user-2', teamId: 'team-1', role: TeamRole.EDITOR, user: mockUsers[1] },
    { userId: 'user-3', teamId: 'team-1', role: TeamRole.VIEWER, user: mockUsers[2] },
];


const TeamManagementSection: React.FC = () => {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
    const [inviteEmail, setInviteEmail] = useState('');

    const handleRoleChange = (userId: string, newRole: TeamRole) => {
        setTeamMembers(currentMembers =>
            currentMembers.map(member =>
                member.userId === userId ? { ...member, role: newRole } : member
            )
        );
        // Dans une vraie application, un appel API serait fait ici pour mettre à jour le rôle
        console.log(`API Call (simulated): Change role for user ${userId} to ${newRole}`);
    };

    const handleRemoveMember = (userId: string) => {
        const memberToRemove = teamMembers.find(m => m.userId === userId);
        if (window.confirm(`Êtes-vous sûr de vouloir retirer ${memberToRemove?.user?.firstName} ${memberToRemove?.user?.lastName} de l'équipe ?`)) {
            setTeamMembers(currentMembers =>
                currentMembers.filter(member => member.userId !== userId)
            );
            // Dans une vraie application, un appel API serait fait ici
            console.log(`API Call (simulated): Remove user ${userId} from team.`);
        }
    };
    
    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (inviteEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
            // Dans une vraie application, un appel API serait fait ici pour envoyer une invitation
            alert(`Invitation (simulée) envoyée à ${inviteEmail}.`);
            console.log(`API Call (simulated): Invite user with email ${inviteEmail}.`);
            setInviteEmail('');
        } else {
            alert("Veuillez entrer une adresse email valide.");
        }
    };

    return (
        <SectionWrapper title="Gestion de l'Équipe">
            <div className="space-y-8">
                {/* Section d'invitation */}
                <div className="p-4 bg-white rounded-lg shadow-md border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Inviter de nouveaux membres</h3>
                    <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <ActionButton type="submit" icon={<PlusCircleIcon className="w-5 h-5"/>}>
                            Envoyer l'invitation
                        </ActionButton>
                    </form>
                </div>

                {/* Liste des membres actuels */}
                <div className="p-4 bg-white rounded-lg shadow-md border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Membres de l'équipe</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="px-4 py-2">Nom</th>
                                    <th className="px-4 py-2">Email</th>
                                    <th className="px-4 py-2">Rôle</th>
                                    <th className="px-4 py-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {teamMembers.map(member => (
                                    <tr key={member.userId}>
                                        <td className="px-4 py-2 font-medium">{member.user?.firstName} {member.user?.lastName}</td>
                                        <td className="px-4 py-2 text-gray-600">{member.user?.email}</td>
                                        <td className="px-4 py-2">
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleRoleChange(member.userId, e.target.value as TeamRole)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs bg-white text-gray-900"
                                            >
                                                {Object.values(TeamRole).map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <ActionButton
                                                onClick={() => handleRemoveMember(member.userId)}
                                                variant="danger"
                                                size="sm"
                                                icon={<TrashIcon className="w-4 h-4"/>}
                                            >
                                                Retirer
                                            </ActionButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </SectionWrapper>
    );
};

export default TeamManagementSection;
