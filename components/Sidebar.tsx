import React, { useMemo } from 'react';
import { AppSection, User, Team, PermissionLevel, StaffMember, PermissionRole, UserRole } from '../types';
import { SECTIONS } from '../constants';
import HomeIcon from './icons/HomeIcon';
import UsersIcon from './icons/UsersIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import TruckIcon from './icons/TruckIcon';
import BuildingOfficeIcon from './icons/BuildingOfficeIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import CurrencyDollarIcon from './icons/CurrencyDollarIcon';
import ClipboardCheckIcon from './icons/ClipboardCheckIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import ChartBarIcon from './icons/ChartBarIcon'; 
import LungsIcon from './icons/LungsIcon';
import CyclingIcon from './icons/CyclingIcon';
import BrainIcon from './icons/BrainIcon';
import MountainIcon from './icons/MountainIcon';
import TacticsIcon from './icons/TacticsIcon';
import Cog6ToothIcon from './icons/Cog6ToothIcon';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon'; // Added for Matériel
import BanknotesIcon from './icons/BanknotesIcon';
import SidebarButton from './SidebarButton'; // Import the new component
import EyeIcon from './icons/EyeIcon';
import SearchIcon from './icons/SearchIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import ShieldExclamationIcon from './icons/ShieldExclamationIcon';
import UserPlusIcon from './icons/UserPlusIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import BeakerIcon from './icons/BeakerIcon';
import IdentificationIcon from './icons/IdentificationIcon';
import PencilIcon from './icons/PencilIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import CircleStackIcon from './icons/CircleStackIcon';
import KeyIcon from './icons/KeyIcon';
import { useTranslations } from '../hooks/useTranslations';
import ActionButton from './ActionButton';

interface SidebarProps {
  currentSection: AppSection;
  onSelectSection: (section: AppSection, eventId?: string) => void; 
  teamLogoUrl?: string;
  onLogout: () => void;
  currentUser: User; 
  effectivePermissions: Partial<Record<AppSection, PermissionLevel[]>>;
  staff: StaffMember[];
  permissionRoles: PermissionRole[];
  userTeams: Team[];
  currentTeamId: string | null;
  onTeamSwitch: (teamId: string) => void;
  isIndependent: boolean;
  onGoToLobby: () => void;
}

const iconMap: { [key: string]: React.ElementType } = {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  TruckIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClipboardCheckIcon,
  CalendarDaysIcon,
  ChartBarIcon, 
  LungsIcon,      
  CyclingIcon,    
  BrainIcon,      
  MountainIcon,   
  TacticsIcon,    
  Cog6ToothIcon, 
  WrenchScrewdriverIcon,
  BanknotesIcon,
  EyeIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserPlusIcon,
  BriefcaseIcon,
  BeakerIcon,
  IdentificationIcon,
  PencilIcon,
  ClipboardListIcon,
  PaperAirplaneIcon,
  CircleStackIcon,
  KeyIcon,
};


const Sidebar: React.FC<SidebarProps> = ({ 
  currentSection, onSelectSection, teamLogoUrl, onLogout, 
  currentUser, effectivePermissions, staff, permissionRoles, userTeams, currentTeamId, onTeamSwitch,
  isIndependent, onGoToLobby 
}) => {
  const { t, language } = useTranslations();
  
  const groupedSections = useMemo(() => {
    return SECTIONS.reduce((acc, section) => {
        const group = section.group[language] || section.group['en'];
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(section);
        return acc;
    }, {} as Record<string, typeof SECTIONS>);
  }, [language, t]);

  const groupOrder = [t('sidebarGroupPilotage'), t('sidebarGroupMySpace'), t('sidebarGroupGeneralData'), t('sidebarGroupAnalysis'), t('sidebarGroupLogistics'), t('sidebarGroupApplication')];
  
  const displayRole = useMemo(() => {
    if (isIndependent) {
        return currentUser.userRole || 'Indépendant';
    }
    const role = permissionRoles.find(r => r.id === currentUser.permissionRole);
    return role?.name || 'Role inconnu';
  }, [currentUser, isIndependent, permissionRoles]);

  return (
    <div 
        className="w-64 h-screen p-4 flex flex-col fixed top-0 left-0 overflow-y-auto"
        style={{ backgroundColor: 'var(--theme-primary-bg)' }}
    >
      <nav className="flex-grow">
        {!isIndependent && userTeams.length > 1 && (
            <div className="mb-4">
                <label htmlFor="team-switcher" className="px-3 text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--theme-primary-text)', opacity: 0.75 }}>
                    {t('sidebarContext')}
                </label>
                <select
                    id="team-switcher"
                    value={currentTeamId || ''}
                    onChange={(e) => onTeamSwitch(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-md border"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'var(--theme-primary-text)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    }}
                >
                    {userTeams.map(team => (
                        <option key={team.id} value={team.id} style={{backgroundColor: 'var(--theme-primary-bg)'}}>
                            {team.name}
                        </option>
                    ))}
                </select>
            </div>
        )}

        {teamLogoUrl && (
            <div className="flex justify-center my-4">
                <img src={teamLogoUrl} alt="Team Logo" className="max-h-20" />
            </div>
        )}

        {groupOrder.map(group => {
            const sectionsInGroup = groupedSections[group];
            if (!sectionsInGroup) return null;

            const visibleSections = sectionsInGroup.filter(section => effectivePermissions[section.id as AppSection]?.includes('view'));
            if (visibleSections.length === 0) return null;
            
            return (
                <div key={group} className="mt-4">
                    <h3 
                        className="px-3 text-xs font-semibold uppercase tracking-wider mb-1" 
                        style={{ color: 'var(--theme-primary-text)', opacity: 0.75 }}
                    >
                        {group}
                    </h3>
                    <div className="space-y-1">
                        {visibleSections.map(section => {
                            const Icon = iconMap[section.icon];
                            return (
                                <SidebarButton
                                    key={section.id}
                                    label={section.labels[language] || section.labels['en']}
                                    icon={Icon}
                                    isActive={currentSection === section.id}
                                    onClick={() => onSelectSection(section.id as AppSection)}
                                />
                            );
                        })}
                    </div>
                </div>
            )
        })}
      </nav>

      <div className="flex-shrink-0 mt-6">
        <div className="p-3 bg-slate-900/40 rounded-lg">
            <div className="flex items-center">
                <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--theme-primary-text)' }}>
                        {currentUser.firstName} {currentUser.lastName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--theme-primary-text)', opacity: 0.8 }}>
                        {t('sidebarRole')}: {displayRole}
                    </p>
                </div>
            </div>
            {isIndependent && (
                <ActionButton onClick={onGoToLobby} className="w-full mt-3">
                    {t('sidebarJoinCreateTeam')}
                </ActionButton>
            )}
            <ActionButton onClick={onLogout} variant="secondary" className="w-full mt-3">
                {t('sidebarLogout')}
            </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;