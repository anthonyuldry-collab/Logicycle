

import React from 'react';
import Modal from './Modal';
import ActionButton from './ActionButton';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center p-4">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg leading-6 font-medium text-gray-900" id="confirmation-modal-title">
          {title}
        </h3>
        <div className="mt-2">
            <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-center space-x-4">
        <ActionButton variant="secondary" onClick={onClose} className="w-28">
          Annuler
        </ActionButton>
        <ActionButton variant="danger" onClick={handleConfirm} className="w-36">
          Confirmer
        </ActionButton>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;