

import React, { useState, useEffect } from 'react';
import { EventAccommodation, AccommodationStatus } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import PencilIcon from '../components/icons/PencilIcon';

interface AccommodationSectionProps {
  accommodation: EventAccommodation;
  setAccommodation: React.Dispatch<React.SetStateAction<EventAccommodation>>;
}

const AccommodationSection: React.FC<AccommodationSectionProps> = ({ accommodation, setAccommodation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EventAccommodation>(accommodation);

  useEffect(() => {
    setFormData(accommodation);
  }, [accommodation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const isNumberField = ['numberOfNights', 'distanceFromStartKm', 'numberOfPeople'].includes(name);

    if (isNumberField) {
        setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSave = () => {
    setAccommodation(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(accommodation);
    setIsEditing(false);
  };

  const renderField = (label: string, value: any, key: string, isEditing: boolean, type: string = 'text', options?: string[]) => (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
        {isEditing ? (
          type === 'select' ? (
            <select name={key} value={formData[key as keyof EventAccommodation] as string} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              {(options as AccommodationStatus[] | undefined)?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : type === 'checkbox' ? (
             <input type={type} name={key} checked={formData[key as keyof EventAccommodation] as boolean} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
          ) : (
            <input type={type} name={key} value={formData[key as keyof EventAccommodation] as string} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          )
        ) : (
          typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : value
        )}
      </dd>
    </div>
  );

  return (
    <SectionWrapper 
      title="Hébergement" 
      actionButton={
        !isEditing && (
          <ActionButton onClick={() => setIsEditing(true)} variant="secondary" icon={<PencilIcon className="w-4 h-4" />}>
            Modifier
          </ActionButton>
        )
      }
    >
      <dl className="divide-y divide-gray-200">
        {renderField('Nom Hôtel', formData.hotelName, 'hotelName', isEditing)}
        {renderField('Adresse', formData.address, 'address', isEditing, 'textarea')}
        {renderField('Statut', formData.status, 'status', isEditing, 'select', Object.values(AccommodationStatus))}
        {renderField('Confirmé', formData.reservationConfirmed, 'reservationConfirmed', isEditing, 'checkbox')}
        {renderField('Détails Confirmation', formData.confirmationDetails, 'confirmationDetails', isEditing, 'textarea')}
        {renderField('Nombre de nuits', formData.numberOfNights, 'numberOfNights', isEditing, 'number')}
      </dl>
      {isEditing && (
        <div className="flex justify-end space-x-3 mt-4">
          <ActionButton onClick={handleCancel} variant="secondary">Annuler</ActionButton>
          <ActionButton onClick={handleSave}>Sauvegarder</ActionButton>
        </div>
      )}
    </SectionWrapper>
  );
};

export default AccommodationSection;