import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  const { t } = useTranslations();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"> {/* Changed max-w-lg to max-w-4xl */}
        <div className="flex justify-between items-center mb-4">
          <div className="w-6"></div> {/* Spacer to balance the close button */}
          <h2 className="text-2xl font-semibold text-gray-800 text-center flex-grow">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl w-6 text-right"
            aria-label={t('closeModal')}
          >
            &times;
          </button>
        </div>
        <div className="text-gray-900">{children}</div>
      </div>
    </div>
  );
};

export default Modal;