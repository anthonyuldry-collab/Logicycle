import React, { useState, useMemo } from 'react';
import { StaffMember, StaffRole, RaceEvent, Address, PerformanceEntry, StaffStatus, AvailabilityStatus, WeeklyAvailability } from '../types';
import ActionButton from './ActionButton';
import LocationMarkerIcon from './icons/LocationMarkerIcon';
import StarIcon from './icons/StarIcon';
import PhoneIcon from './icons/PhoneIcon';
import MailIcon from './icons/MailIcon';

interface StaffSearchTabProps {
    allStaff: StaffMember[];
    raceEvents: RaceEvent[];
    teamAddress?: Address;
    performanceEntries: PerformanceEntry[];
}

// Function to simulate distance calculation
const calculateDistance = (address1?: Address, address2?: Address): number => {
  if (!address1?.city || !address2?.city) return Infinity;
  if (address1.city.toLowerCase() === address2.city.toLowerCase()) return Math.random() * 20;
  return 50 + Math.random() * 200;
};

// Check if two date ranges overlap
const datesOverlap = (startAStr: string, endAStr: string, startBStr: string, endBStr: string): boolean => {
    const startA = new Date(startAStr + "T00:00:00Z").getTime();
    const endA = new Date(endAStr + "T23:59:59Z").getTime();
    const startB = new Date(startBStr + "T00:00:00Z").getTime();
    const endB = new Date(endBStr + "T23:59:59Z").getTime();
    return startA <= endB && endA >= startB;
};


const StaffSearchTab: React.FC<StaffSearchTabProps> = ({ allStaff, raceEvents, teamAddress, performanceEntries }) => {
    const [searchLocation, setSearchLocation] = useState<'teamBase' | string>('teamBase');
    const [searchDistance, setSearchDistance] = useState<number>(100);
    const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
    const [missionStartDate, setMissionStartDate] = useState('');
    const [missionEndDate, setMissionEndDate] = useState('');
    const [contactInfo, setContactInfo] = useState<StaffMember | null>(null);

    const availableVacataires = useMemo(() => {
        return allStaff.filter(s => s.openToExternalMissions);
    }, [allStaff]);
    
    const searchResults = useMemo(() => {
        if (!missionStartDate || !missionEndDate) return [];

        let baseAddress: Address | undefined;
        if (searchLocation === 'teamBase') {
            baseAddress = teamAddress;
        } else {
            const selectedEvent = raceEvents.find(e => e.id === searchLocation);
            if(selectedEvent) {
                const locationParts = selectedEvent.location.split(',');
                baseAddress = { city: locationParts[0]?.trim(), country: locationParts[1]?.trim() };
            }
        }
        
        if (!baseAddress) return [];

        const dayOfWeekMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        return availableVacataires
            .filter(vacataire => {
                // Role match
                const roleMatch = roleFilter === 'all' || vacataire.role === roleFilter;
                if (!roleMatch) return false;

                // Distance match
                const distance = calculateDistance(baseAddress, vacataire.address);
                if (distance > searchDistance) return false;
                
                // General unavailability check
                const isGenerallyUnavailable = (vacataire.availability || []).some(period =>
                    period.status === AvailabilityStatus.NON_DISPONIBLE &&
                    datesOverlap(missionStartDate, missionEndDate, period.startDate, period.endDate)
                );
                if (isGenerallyUnavailable) return false;
                
                // Recurring weekly availability check
                if (vacataire.weeklyAvailability) {
                    const startDate = new Date(missionStartDate + "T12:00:00Z");
                    const endDate = new Date(missionEndDate + "T12:00:00Z");
                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const dayKey = dayOfWeekMap[d.getUTCDay()];
                        const dayAvailability = vacataire.weeklyAvailability[dayKey];
                        // If the person is marked as fully unavailable on a required day
                        if (dayAvailability && !dayAvailability.morning && !dayAvailability.afternoon && !dayAvailability.evening) {
                            return false;
                        }
                    }
                }
                
                // Assignment on other races check
                const isAssignedElsewhere = raceEvents.some(event =>
                    (event.selectedStaffIds || []).includes(vacataire.id) &&
                    datesOverlap(missionStartDate, missionEndDate, event.date, event.endDate || event.date)
                );
                if (isAssignedElsewhere) return false;
                
                return true;
            })
            .map(vacataire => {
                const distance = calculateDistance(baseAddress, vacataire.address);
                const ratings = performanceEntries.flatMap(pe => pe.staffRatings || []).filter(r => r.staffId === vacataire.id && r.rating > 0);
                const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;
                return { ...vacataire, distance, averageRating, ratingCount: ratings.length };
            })
            .sort((a,b) => b.averageRating - a.averageRating || a.distance - b.distance);
    }, [availableVacataires, searchLocation, searchDistance, roleFilter, teamAddress, raceEvents, missionStartDate, missionEndDate, performanceEntries]);

    return (
        <div className="text-gray-800">
            <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-md border">
                <h4 className="text-lg font-semibold mb-3">Rechercher un Vacataire</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date de début mission</label>
                        <input type="date" value={missionStartDate} onChange={e => setMissionStartDate(e.target.value)} required className="mt-1 block w-full pl-3 pr-2 py-2 border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Date de fin mission</label>
                        <input type="date" value={missionEndDate} onChange={e => setMissionEndDate(e.target.value)} required className="mt-1 block w-full pl-3 pr-2 py-2 border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Lieu de recherche</label>
                        <select value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <option value="teamBase">Depuis la base du club</option>
                            <optgroup label="Depuis une course">
                                {raceEvents.map(event => (<option key={event.id} value={event.id}>{event.name} ({event.location})</option>))}
                            </optgroup>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Rôle recherché</label>
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as StaffRole | 'all')} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <option value="all">Tous les rôles</option>
                            {(Object.values(StaffRole) as StaffRole[]).map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-4">
                        <label htmlFor="searchDistance" className="block text-sm font-medium text-gray-700">Distance maximale (km)</label>
                        <div className="flex items-center gap-4">
                            <input type="range" id="searchDistance" min="10" max="500" step="10" value={searchDistance} onChange={(e) => setSearchDistance(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-1"/>
                            <div className="text-center text-sm font-semibold w-20">{searchDistance} km</div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-lg font-semibold mb-3">Résultats ({searchResults.length})</h4>
                {!missionStartDate || !missionEndDate ? (
                    <p className="text-center text-gray-500 italic py-8">Veuillez sélectionner une période de mission pour lancer la recherche.</p>
                ) : searchResults.length === 0 ? (
                    <p className="text-center text-gray-500 italic py-8">Aucun vacataire disponible ne correspond à vos critères.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.map(vacataire => (
                            <div key={vacataire.id} className="bg-white rounded-lg shadow border p-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h5 className="font-bold">{vacataire.firstName} {vacataire.lastName}</h5>
                                            <p className="text-sm text-gray-600">{vacataire.role}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center text-yellow-500 font-bold">
                                                <StarIcon className="w-4 h-4 mr-1"/>
                                                <span>{vacataire.averageRating.toFixed(1)}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">({vacataire.ratingCount} avis)</p>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t text-sm text-gray-700">
                                        <p className="flex items-center"><LocationMarkerIcon className="w-4 h-4 mr-1"/> {vacataire.address?.city || 'Ville inconnue'}</p>
                                        <p className="font-semibold">{vacataire.distance.toFixed(0)} km (simulé)</p>
                                    </div>
                                </div>
                                <div className="mt-3 text-right">
                                    <ActionButton onClick={() => setContactInfo(vacataire)}>Contacter</ActionButton>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {contactInfo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={() => setContactInfo(null)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h4 className="text-lg font-bold">Contacter {contactInfo.firstName} {contactInfo.lastName}</h4>
                        <p className="text-sm text-gray-500 mb-4">{contactInfo.role}</p>
                        <div className="space-y-2">
                           {contactInfo.phone && <p className="flex items-center"><PhoneIcon className="w-5 h-5 mr-2 text-gray-400"/> {contactInfo.phone}</p>}
                           {contactInfo.email && <p className="flex items-center"><MailIcon className="w-5 h-5 mr-2 text-gray-400"/> <a href={`mailto:${contactInfo.email}`} className="text-blue-600 hover:underline">{contactInfo.email}</a></p>}
                        </div>
                         <div className="mt-4 text-right">
                           <ActionButton onClick={() => setContactInfo(null)} variant="secondary">Fermer</ActionButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffSearchTab;