import React from 'react';
import ActionButton from '../components/ActionButton';

interface PendingApprovalViewProps {
  onLogout: () => void;
}

const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({ onLogout }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100" style={{ backgroundColor: 'var(--theme-primary-bg)' }}>
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-slate-800 bg-opacity-80 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl">
        <h1 className="text-2xl font-bold text-slate-100">Demande d'Adhésion Reçue</h1>
        <p className="text-slate-300">
          Votre compte a bien été créé. Il est maintenant en attente de validation par un administrateur de votre équipe.
        </p>
        <p className="text-slate-300">
          Vous recevrez une notification par email lorsque votre accès sera approuvé.
        </p>
        <div className="pt-4">
          <ActionButton onClick={onLogout} variant="secondary">
            Se déconnecter
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalView;
