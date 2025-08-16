import React, { useMemo } from 'react';
import { User, TransportDirection, RaceEvent, EventTransportLeg, Rider, StaffMember } from '../types';
import SectionWrapper from '../components/SectionWrapper';

interface MyTripsSectionProps {
  riders: Rider[];
  staff: StaffMember[];
  eventTransportLegs: EventTransportLeg[];
  raceEvents: RaceEvent[];
  currentUser: User;
}

const MyTripsSection: React.FC<MyTripsSectionProps> = ({ riders, staff, eventTransportLegs, raceEvents, currentUser }) => {
  const userProfile = useMemo(() => {
    return riders.find(r => r.email === currentUser.email) || staff.find(s => s.email === currentUser.email);
  }, [riders, staff, currentUser.email]);

  const myTrips = useMemo(() => {
    if (!userProfile) return [];
    
    const userLegs = eventTransportLegs.filter(leg => 
      leg.occupants.some(occ => occ.id === userProfile.id)
    );

    const tripsByEvent = userLegs.reduce((acc, leg) => {
      const event = raceEvents.find(e => e.id === leg.eventId);
      if (event) {
        if (!acc[event.id]) {
          acc[event.id] = {
            eventInfo: event,
            legs: []
          };
        }
        acc[event.id].legs.push(leg);
      }
      return acc;
    }, {} as Record<string, { eventInfo: typeof raceEvents[0], legs: typeof eventTransportLegs }>);

    return Object.values(tripsByEvent).sort((a,b) => new Date(a.eventInfo.date).getTime() - new Date(b.eventInfo.date).getTime());
  }, [userProfile, eventTransportLegs, raceEvents]);
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr + "T12:00:00Z").toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <SectionWrapper title="Mes Trajets">
      <div className="space-y-6">
        {myTrips.length > 0 ? (
          myTrips.map(({ eventInfo, legs }) => (
            <div key={eventInfo.id} className="bg-white p-4 rounded-lg shadow-md border">
              <h3 className="text-xl font-bold text-gray-800">{eventInfo.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{eventInfo.location} - {formatDate(eventInfo.date)}</p>
              
              <div className="space-y-4">
                {legs.map(leg => (
                  <div key={leg.id} className="p-3 bg-gray-50 rounded-md border-l-4 border-blue-500">
                    <p className="font-semibold">{leg.direction} - {leg.mode}</p>
                    <div className="text-sm text-gray-700 mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <p><strong>Départ:</strong> {formatDate(leg.departureDate)} à {leg.departureTime || '--:--'} de {leg.departureLocation || 'N/A'}</p>
                      <p><strong>Arrivée:</strong> {formatDate(leg.arrivalDate)} à {leg.arrivalTime || '--:--'} à {leg.arrivalLocation || 'N/A'}</p>
                    </div>
                    {leg.details && <p className="text-xs text-gray-600 mt-2 bg-gray-100 p-2 rounded"><strong>Détails:</strong> {leg.details}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg border">
            <p className="text-lg text-gray-600">Aucun trajet n'est actuellement planifié pour vous.</p>
            <p className="text-sm text-gray-500 mt-2">Vos informations de transport apparaîtront ici lorsqu'elles seront ajoutées par le staff.</p>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
};

export default MyTripsSection;
