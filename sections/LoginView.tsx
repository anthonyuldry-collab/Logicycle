import React, { useState, useContext } from 'react';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import { LanguageContext } from '../contexts/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';
import { LANGUAGE_OPTIONS } from '../constants';

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  onSwitchToSignup: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  
  const { t, language, setLanguage } = useTranslations();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    const result = await onLogin(email, password);
    if (!result.success) {
      setError(result.message || t('loginError'));
      setIsLoading(false);
    }
    // On success, onAuthStateChanged in App.tsx will take over, no need to set isLoading to false.
  };
  
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(`${t('loginResetSuccess')} ${forgotPasswordEmail}, ${t('loginResetSuccess2')}`);
    setTimeout(() => {
        setIsForgotPasswordModalOpen(false);
    }, 3000);
  };


  return (
    <div className="flex items-center justify-center min-h-screen relative" style={{ backgroundImage: 'linear-gradient(to top right, var(--theme-primary-hover-bg), var(--theme-primary-bg))'}}>
      <div className="absolute top-4 right-4">
          <select 
              onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}
              value={language}
              className="input-field-sm py-1"
              aria-label="Select language"
          >
              {LANGUAGE_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="bg-slate-700">{opt.label}</option>)}
          </select>
      </div>
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 bg-opacity-80 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-100">🚴 {t('loginWelcome')}</h1>
            <p className="mt-2 text-sm text-slate-300">{t('loginSlogan')}</p>
        </div>
        <form className="space-y-6" onSubmit={handleLoginSubmit}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-300">
              {t('loginEmailLabel')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field-sm w-full"
              placeholder={t('loginEmailPlaceholder')}
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
                <label htmlFor="password"  className="text-sm font-medium text-slate-300">
                  {t('loginPasswordLabel')}
                </label>
                <div className="text-sm">
                    <button
                        type="button"
                        onClick={() => {
                            setResetMessage('');
                            setForgotPasswordEmail('');
                            setIsForgotPasswordModalOpen(true);
                        }}
                        className="font-medium text-blue-400 hover:text-blue-300 focus:outline-none focus:underline"
                    >
                        {t('loginForgotPassword')}
                    </button>
                </div>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field-sm w-full"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <ActionButton type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('loginLoadingButton') : t('loginSubmitButton')}
            </ActionButton>
          </div>
        </form>
        <div className="text-sm text-center text-slate-400">
          {t('loginNoAccount')}{' '}
          <button onClick={onSwitchToSignup} className="font-medium text-blue-400 hover:text-blue-300">
            {t('loginSignUpLink')}
          </button>
        </div>
      </div>
      
      <Modal 
        isOpen={isForgotPasswordModalOpen} 
        onClose={() => setIsForgotPasswordModalOpen(false)} 
        title={t('loginResetPasswordTitle')}
      >
        {resetMessage ? (
          <p className="text-center text-green-700 bg-green-100 p-4 rounded-md">{resetMessage}</p>
        ) : (
          <form className="space-y-4" onSubmit={handleForgotPasswordSubmit}>
            <p className="text-sm text-gray-600">
              {t('loginResetPasswordDesc')}
            </p>
            <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">
                    {t('loginEmailLabel')}
                </label>
                <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full px-3 py-2 mt-1 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('loginEmailPlaceholder')}
                />
            </div>
            <div className="flex justify-end space-x-2 pt-3">
                <ActionButton type="button" variant="secondary" onClick={() => setIsForgotPasswordModalOpen(false)}>{t('cancel')}</ActionButton>
                <ActionButton type="submit">
                    {t('loginSendLink')}
                </ActionButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default LoginView;