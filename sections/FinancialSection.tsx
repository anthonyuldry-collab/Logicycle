import React, { useState, useMemo } from 'react';
import { AppState, IncomeItem, BudgetItemCategory, IncomeCategory } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import { useTranslations } from '../hooks/useTranslations';

interface FinancialSectionProps {
  appState: AppState;
  setIncomeItems: React.Dispatch<React.SetStateAction<IncomeItem[]>>;
  setCategoryBudgets: (updater: React.SetStateAction<Partial<Record<BudgetItemCategory, number>>>) => void;
  navigateTo: (section: 'eventDetail', eventId: string) => void;
}

export const FinancialSection: React.FC<FinancialSectionProps> = ({ appState, setIncomeItems, setCategoryBudgets, navigateTo }) => {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expenses'>('overview');

    const totalIncome = useMemo(() => appState.incomeItems.reduce((sum, item) => sum + item.amount, 0), [appState.incomeItems]);
    const totalExpenses = useMemo(() => appState.eventBudgetItems.reduce((sum, item) => sum + (item.actualCost ?? item.estimatedCost), 0), [appState.eventBudgetItems]);
    const balance = totalIncome - totalExpenses;

    return (
        <SectionWrapper title={t('titleFinancial')}>
            <div className="text-center p-8 bg-gray-50 rounded-lg border">
                <h3 className="text-xl font-semibold text-gray-700">Section en construction</h3>
                <p className="mt-2 text-gray-500">Cette section permettra de gérer les revenus, les dépenses et les budgets de l'équipe.</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-100 p-4 rounded-lg">
                        <p className="text-sm text-green-800">Total Revenus</p>
                        <p className="text-2xl font-bold text-green-900">{totalIncome.toLocaleString('fr-FR')} €</p>
                    </div>
                     <div className="bg-red-100 p-4 rounded-lg">
                        <p className="text-sm text-red-800">Total Dépenses</p>
                        <p className="text-2xl font-bold text-red-900">{totalExpenses.toLocaleString('fr-FR')} €</p>
                    </div>
                     <div className="bg-blue-100 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">Solde</p>
                        <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>{balance.toLocaleString('fr-FR')} €</p>
                    </div>
                </div>
            </div>
        </SectionWrapper>
    );
};
