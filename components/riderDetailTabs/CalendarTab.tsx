

import React from 'react';
import { Rider, RaceEvent, RiderEventSelection, RiderEventStatus } from '../../types';
import { RIDER_EVENT_STATUS_COLORS } from '../../constants';

interface CalendarTabProps {
    formData: Rider | Omit<Rider, 'id'>;
    raceEvents: RaceEvent[];
    riderEventSelections: RiderEventSelection[];
}

const CalendarTab: React.FC<CalendarTabProps> = ({
    formData,
    raceEvents,
    riderEventSelections
}) => {
    const riderId = (formData as Rider).id;

    // Check if riderId exists. If not (e.g., adding new rider), show a message.
    if (!riderId) {
        return <p className="italic text-slate-400">Le calendrier sera disponible une fois le coureur sauvegardé.</p>;
    }

    const eventsForRider = raceEvents
        .filter(event => (event.selectedRiderIds || []).includes(riderId))
        .map(event => {
            const selection = riderEventSelections.find(sel => sel.eventId === event.id && sel.riderId === riderId);
            return {
                ...event,
                status: selection?.status || RiderEventStatus.EN_ATTENTE,
                notes: selection?.notes || ''
            };
        })
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="space-y-2">
            {eventsForRider.length === 0 && <p className="italic text-slate-400">Ce coureur n'est sélectionné pour aucune course.</p>}
            {eventsForRider.map(event => (
                <div key={event.id} className="bg-slate-700 p-2 rounded-md">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold">{event.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${RIDER_EVENT_STATUS_COLORS[event.status] || ''}`}>{event.status}</span>
                    </div>
                    <p className="text-xs text-slate-400">{new Date(event.date + "T12:00:00Z").toLocaleDateString('fr-CA')} - {event.location}</p>
                    {event.notes && <p className="text-xs text-slate-500 italic">Notes: {event.notes}</p>}
                </div>
            ))}
        </div>
    );
};

export default CalendarTab;