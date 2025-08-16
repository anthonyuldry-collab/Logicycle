
import React from 'react';
import { RaceEvent, AppState, EventRaceDocument } from '../../types';
import DocumentsSection from '../DocumentsSection'; // Import the full section

interface EventDocumentsTabProps {
  event: RaceEvent;
  eventId: string;
  appState: AppState;
  setEventDocuments: React.Dispatch<React.SetStateAction<EventRaceDocument[]>>;
}

const EventDocumentsTab: React.FC<EventDocumentsTabProps> = ({ event, eventId, appState, setEventDocuments }) => {
  // Use the existing DocumentsSection component, passing the eventId for context
  // and the specific setter for documents related to this event.
  return (
    <DocumentsSection
      documents={appState.eventDocuments.filter(doc => doc.eventId === eventId)}
      setDocuments={(updater) => {
          const currentDocs = appState.eventDocuments.filter(d => d.eventId === eventId);
          const otherDocs = appState.eventDocuments.filter(d => d.eventId !== eventId);
          const updatedDocs = typeof updater === 'function' ? updater(currentDocs) : updater;
          setEventDocuments([...otherDocs, ...updatedDocs]);
      }}
      eventId={eventId}
    />
  );
};

export default EventDocumentsTab;
