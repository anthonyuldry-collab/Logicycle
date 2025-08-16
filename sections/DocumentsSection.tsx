
import React, { useState } from 'react';
import { EventRaceDocument, DocumentStatus } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import UploadIcon from '../components/icons/UploadIcon';
import ConfirmationModal from '../components/ConfirmationModal';

interface DocumentsSectionProps {
  documents: EventRaceDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<EventRaceDocument[]>>;
  eventId?: string;
}

const initialDocumentFormStateFactory = (eventId?: string): Omit<EventRaceDocument, 'id'> => ({
  eventId: eventId || '',
  name: '',
  status: DocumentStatus.EN_ATTENTE,
  fileLinkOrPath: '',
  notes: '',
});

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ documents, setDocuments, eventId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Omit<EventRaceDocument, 'id'> | EventRaceDocument>(initialDocumentFormStateFactory(eventId));
  const [isEditing, setIsEditing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ onConfirm: () => void } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentItem(prev => ({ ...prev, fileLinkOrPath: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemToSave: EventRaceDocument = {
      ...(currentItem as Omit<EventRaceDocument, 'id'>),
      eventId: (currentItem as EventRaceDocument).eventId || eventId || 'unknown_event_id',
      id: (currentItem as EventRaceDocument).id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
    };

    if (isEditing) {
      setDocuments(prevDocs => prevDocs.map(doc => doc.id === itemToSave.id ? itemToSave : doc));
    } else {
      setDocuments(prevDocs => [...prevDocs, itemToSave]);
    }
    setIsModalOpen(false);
    setCurrentItem(initialDocumentFormStateFactory(eventId));
    setIsEditing(false);
  };

  const openAddModal = () => {
    setCurrentItem(initialDocumentFormStateFactory(eventId));
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: EventRaceDocument) => {
    setCurrentItem(item);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (itemId: string) => {
    setConfirmAction({
      onConfirm: () => {
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== itemId));
      }
    });
  };

  return (
    <SectionWrapper 
      title={`Documents ${eventId ? '' : '(Tous Événements)'}`}
      actionButton={<ActionButton onClick={openAddModal} icon={<PlusCircleIcon className="w-5 h-5" />}>Ajouter Document</ActionButton>}
    >
      {documents.length === 0 ? (
        <p className="text-gray-500 italic">Aucun document ajouté.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lien/Fichier</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="py-4 px-3 whitespace-nowrap font-medium text-gray-900">{doc.name}</td>
                  <td className="py-4 px-3 whitespace-nowrap text-gray-500">{doc.status}</td>
                  <td className="py-4 px-3 whitespace-nowrap text-blue-600 hover:underline max-w-xs truncate">
                    <a href={doc.fileLinkOrPath} target="_blank" rel="noopener noreferrer">{doc.fileLinkOrPath.startsWith('data:') ? 'Fichier uploadé' : doc.fileLinkOrPath}</a>
                  </td>
                  <td className="py-4 px-3 whitespace-nowrap text-right space-x-2">
                    <ActionButton onClick={() => openEditModal(doc)} variant="secondary" size="sm" icon={<PencilIcon className="w-4 h-4" />}>Modifier</ActionButton>
                    <ActionButton onClick={() => handleDelete(doc.id)} variant="danger" size="sm" icon={<TrashIcon className="w-4 h-4" />}>Supprimer</ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmAction && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={confirmAction.onConfirm}
          title="Supprimer le Document"
          message="Êtes-vous sûr de vouloir supprimer ce document ?"
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Modifier Document" : "Ajouter Document"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nameDoc" className="block text-sm font-medium text-gray-700">Nom du document</label>
            <input type="text" name="name" id="nameDoc" value={currentItem.name} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 placeholder-gray-500" />
          </div>
          <div>
            <label htmlFor="statusDoc" className="block text-sm font-medium text-gray-700">Statut</label>
            <select name="status" id="statusDoc" value={currentItem.status} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              {(Object.values(DocumentStatus) as DocumentStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="fileLinkOrPathDoc" className="block text-sm font-medium text-gray-700">Lien vers le document (URL)</label>
            <input type="text" name="fileLinkOrPath" id="fileLinkOrPathDoc" value={currentItem.fileLinkOrPath.startsWith('data:') ? '' : currentItem.fileLinkOrPath} onChange={handleInputChange} placeholder="https://..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 placeholder-gray-500" />
          </div>
          <div className="text-center text-sm text-gray-500">ou</div>
          <div>
            <label htmlFor="fileUploadDoc" className="block text-sm font-medium text-gray-700">Uploader un fichier</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Sélectionner un fichier</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">ou glisser-déposer</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF, etc.</p>
              </div>
            </div>
            {currentItem.fileLinkOrPath.startsWith('data:') && <p className="text-sm text-green-600 mt-2">Fichier sélectionné.</p>}
          </div>
          <div>
            <label htmlFor="notesDoc" className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea name="notes" id="notesDoc" value={currentItem.notes} onChange={handleInputChange} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 placeholder-gray-500" />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <ActionButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</ActionButton>
            <ActionButton type="submit">{isEditing ? "Sauvegarder" : "Ajouter"}</ActionButton>
          </div>
        </form>
      </Modal>
    </SectionWrapper>
  );
};

export default DocumentsSection;
