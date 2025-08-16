

import React, { useState, useMemo, useEffect } from 'react';
import { EventTransportLeg, Rider, StaffMember, TransportDirection, TransportMode } from '../types'; // Changed TransportLeg to EventTransportLeg
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import InformationCircleIcon from '../components/icons/InformationCircleIcon';
import { useTranslations } from '../hooks/useTranslations';

interface TransportSectionProps {
  transportLegs: EventTransportLeg[]; // Changed TransportLeg to EventTransportLeg
  setTransportLegs: React.Dispatch<React.SetStateAction<EventTransportLeg[]>>; // Changed TransportLeg to EventTransportLeg
  riders: Rider[];
  staff: StaffMember[];
  initialAuroreTransport?: Partial<EventTransportLeg>; // Changed TransportLeg to EventTransportLeg, made optional
  eventId?: string; // Optional eventId for context, if this section is reused
}

const initialTransportFormStateFactory = (eventId?: string): Omit<EventTransportLeg, 'id'> => ({
  eventId: eventId || '', // Default to empty or passed eventId
  direction: TransportDirection.ALLER,
  mode: TransportMode.MINIBUS,
  departureDate: '',
  departureTime: '',
  arrivalDate: '',
  arrivalTime: '',
  departureLocation: '',
  arrivalLocation: '',
  details: '',
  personName: '',
  occupants: [],
});

const TransportSection: React.FC<TransportSectionProps> = ({ 
  transportLegs, 
  setTransportLegs, 
  riders, 
  staff, 
  initialAuroreTransport, 
  eventId 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTransportLeg, setCurrentTransportLeg] = useState<Omit<EventTransportLeg, 'id'> | EventTransportLeg>(initialTransportFormStateFactory(eventId));
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useTranslations();

  const availablePeople = useMemo(() => 
    [...riders.map(r => `${r.firstName} ${r.lastName}`), ...staff.map(s => `${s.firstName} ${s.lastName}`), "Groupe/Véhicule"]
  , [riders, staff]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setCurrentTransportLeg(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const legToSave: EventTransportLeg = {
      ...(currentTransportLeg as Omit<EventTransportLeg, 'id'>), // Base properties
      eventId: (currentTransportLeg as EventTransportLeg).eventId || eventId || 'unknown_event_id', // Ensure eventId
      id: (currentTransportLeg as EventTransportLeg).id || Date.now().toString() + Math.random().toString(36).substring(2,9), // Ensure ID
      departureDate: (currentTransportLeg as EventTransportLeg).departureDate || undefined,
      arrivalDate: (currentTransportLeg as EventTransportLeg).arrivalDate || undefined,
    };

    if (isEditing && 'id' in currentTransportLeg) {
      setTransportLegs(prevLegs => prevLegs.map(leg => leg.id === legToSave.id ? legToSave : leg));
    } else {
      setTransportLegs(prevLegs => [...prevLegs, legToSave]);
    }
    setIsModalOpen(false);
    setCurrentTransportLeg(initialTransportFormStateFactory(eventId));
    setIsEditing(false);
  };

  const openAddModal = () => {
    setCurrentTransportLeg(initialTransportFormStateFactory(eventId));
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (leg: EventTransportLeg) => {
    setCurrentTransportLeg(leg);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (legId: string) => {
    if (window.confirm(t('transportConfirmDelete'))) {
      setTransportLegs(prevLegs => prevLegs.filter(leg => leg.id !== legId));
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString + "T12:00:00Z").toLocaleDateString('fr-CA');
    } catch {
        return 'Date Invalide';
    }
  };


  useEffect(() => {
    // This logic might be better handled if eventId is passed and initialAuroreTransport has eventId
    if (initialAuroreTransport && initialAuroreTransport.isAuroreFlight && eventId) {
        const auroreFlightExistsForEvent = transportLegs.some(leg => leg.isAuroreFlight && leg.eventId === eventId);
        if (!auroreFlightExistsForEvent) {
            setTransportLegs(prevLegs => [
            ...prevLegs, 
            { 
                ...initialTransportFormStateFactory(eventId), // Ensures eventId is set
                ...initialAuroreTransport, 
                id: 'aurore-flight-' + Date.now().toString(), 
                personName: "Aurore",
                eventId: eventId, // Explicitly set eventId
            } as EventTransportLeg
            ]);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, initialAuroreTransport]); // Dependencies simplified for clarity. Consider full list if issues.


  const renderTransportTable = (legs: EventTransportLeg[], title: string) => (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-700 mb-3">{title}</h3>
      {legs.length === 0 ? (
        <p className="text-gray-500 italic">Aucun trajet planifié.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personne/Groupe</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Départ</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrivée</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {legs.map((leg) => (
                <tr key={leg.id} className={`hover:bg-gray-50 transition-colors ${leg.isAuroreFlight ? 'bg-yellow-50 hover:bg-yellow-100' : ''}`}>
                  <td className="py-4 px-3 whitespace-nowrap font-medium text-gray-900">{leg.personName || 'N/A'}</td>
                  <td className="py-4 px-3 whitespace-nowrap text-gray-500">{leg.mode}</td>
                  <td className="py-4 px-3 whitespace-normal text-sm text-gray-500">
                    <div className="font-semibold text-gray-900">{formatDate(leg.departureDate)} à {leg.departureTime}</div>
                    <div>De: {leg.departureLocation}</div>
                  </td>
                  <td className="py-4 px-3 whitespace-normal text-sm text-gray-500">
                    <div className="font-semibold text-gray-900">{formatDate(leg.arrivalDate)} à {leg.arrivalTime}</div>
                    <div>À: {leg.arrivalLocation}</div>
                  </td>
                  <td className="py-4 px-3 text-sm text-gray-500 max-w-xs truncate" title={leg.details}>
                    {leg.isAuroreFlight && <InformationCircleIcon className="w-4 h-4 inline mr-1 text-yellow-600" />}
                    {leg.details}
                  </td>
                  <td className="py-4 px-3 whitespace-nowrap text-sm text-right space-x-2">
                    <ActionButton onClick={() => openEditModal(leg)} variant="secondary" size="sm" icon={<PencilIcon className="w-4 h-4"/>}>
                      Modifier
                    </ActionButton>
                    <ActionButton onClick={() => handleDelete(leg.id)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4"/>}>
                      Supprimer
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const allerLegs = transportLegs.filter(leg => leg.direction === TransportDirection.ALLER);
  const retourLegs = transportLegs.filter(leg => leg.direction === TransportDirection.RETOUR);

  return (
    <SectionWrapper
      title="Transport"
      actionButton={
        <ActionButton onClick={openAddModal} icon={<PlusCircleIcon className="w-5 h-5" />}>
          Ajouter Trajet
        </ActionButton>
      }
    >
      {renderTransportTable(allerLegs, "Trajets Aller")}
      {renderTransportTable(retourLegs, "Trajets Retour")}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Modifier Trajet" : "Ajouter un Trajet"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="personNameModal" className="block text-sm font-medium text-gray-700">Personne / Groupe</label>
              <select name="personName" id="personNameModal" value={(currentTransportLeg as EventTransportLeg).personName || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="">Sélectionner...</option>
                {availablePeople.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="directionModal" className="block text-sm font-medium text-gray-700">Direction</label>
              <select name="direction" id="directionModal" value={(currentTransportLeg as EventTransportLeg).direction} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                {(Object.values(TransportDirection) as TransportDirection[]).map(dir => <option key={dir} value={dir}>{dir}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="modeModal" className="block text-sm font-medium text-gray-700">Mode de transport</label>
            <select name="mode" id="modeModal" value={(currentTransportLeg as EventTransportLeg).mode} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              {(Object.values(TransportMode) as TransportMode[]).map(mode => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Départ</label>
              <input type="date" name="departureDate" value={(currentTransportLeg as EventTransportLeg).departureDate || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
              <input type="time" name="departureTime" value={(currentTransportLeg as EventTransportLeg).departureTime} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
              <input type="text" name="departureLocation" value={(currentTransportLeg as EventTransportLeg).departureLocation} onChange={handleInputChange} placeholder="Lieu de départ" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Arrivée</label>
              <input type="date" name="arrivalDate" value={(currentTransportLeg as EventTransportLeg).arrivalDate || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
              <input type="time" name="arrivalTime" value={(currentTransportLeg as EventTransportLeg).arrivalTime} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
              <input type="text" name="arrivalLocation" value={(currentTransportLeg as EventTransportLeg).arrivalLocation} onChange={handleInputChange} placeholder="Lieu d'arrivée" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
            </div>
          </div>
          <div>
            <label htmlFor="detailsModal" className="block text-sm font-medium text-gray-700">Détails (N° vol, répartition, prix, etc.)</label>
            <textarea name="details" id="detailsModal" value={(currentTransportLeg as EventTransportLeg).details} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          {(currentTransportLeg as EventTransportLeg).personName === "Aurore" && (currentTransportLeg as EventTransportLeg).mode === TransportMode.VOL && (
            <div className="flex items-center">
              <input type="checkbox" name="isAuroreFlight" id="isAuroreFlightModal" checked={(currentTransportLeg as EventTransportLeg).isAuroreFlight || false} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label htmlFor="isAuroreFlightModal" className="ml-2 block text-sm text-gray-900">Ceci est le vol spécial d'Aurore (nécessite infos retour/prix)</label>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <ActionButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</ActionButton>
            <ActionButton type="submit">{isEditing ? "Sauvegarder" : "Ajouter"}</ActionButton>
          </div>
        </form>
      </Modal>
    </SectionWrapper>
  );
};

export default TransportSection;