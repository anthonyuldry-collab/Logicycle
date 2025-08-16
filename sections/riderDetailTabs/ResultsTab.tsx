

import React, { useState, useMemo, useEffect } from 'react';
import { Rider, ResultItem, DisciplinePracticed } from '../../types';
import ActionButton from '../../components/ActionButton';
import SearchIcon from '../../components/icons/SearchIcon';
import PlusCircleIcon from '../../components/icons/PlusCircleIcon';
import Modal from '../../components/Modal';
import { ELIGIBLE_CATEGORIES_CONFIG } from '../../constants';
import PencilIcon from '../../components/icons/PencilIcon';
import TrashIcon from '../../components/icons/TrashIcon';

interface ResultsTabProps {
    formData: Rider | Omit<Rider, 'id'>;
    formFieldsEnabled: boolean;
    setFormData: React.Dispatch<React.SetStateAction<Rider | Omit<Rider, 'id'>>>;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const getCategoryLabel = (id: string = ''): string => {
    const category = ELIGIBLE_CATEGORIES_CONFIG.flatMap(g => g.categories).find(cat => cat.id === id);
    return category ? category.label : id;
};

export const ResultsTab: React.FC<ResultsTabProps> = ({
    formData,
    formFieldsEnabled,
    setFormData
}) => {
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [editingResult, setEditingResult] = useState<ResultItem | null>(null);
    const [disciplineFilter, setDisciplineFilter] = useState<'all' | DisciplinePracticed>('all');
    
    const careerStats = useMemo(() => {
        const history = formData.resultsHistory || [];
        
        let wins = 0;
        let podiums = 0;
        let top10s = 0;
    
        history.forEach(result => {
            const rank = typeof result.rank === 'string' ? parseInt(result.rank.replace(/\D/g, ''), 10) : result.rank;
            if (!isNaN(rank) && rank > 0) {
                if (rank === 1) {
                    wins++;
                    podiums++;
                    top10s++;
                } else if (rank <= 3) {
                    podiums++;
                    top10s++;
                } else if (rank <= 10) {
                    top10s++;
                }
            }
        });
        return { wins, podiums, top10s };
    }, [formData.resultsHistory]);

    const handleSimulatePcsSearch = () => {
        if (!window.confirm("Ceci est une simulation de recherche sur Pro Cycling Stats et remplacera l'historique de résultats existant. Continuer ?")) {
            return;
        }
        const simulatedResults: ResultItem[] = [
            { id: generateId(), date: '2024-05-25', eventName: 'GP de Plumelec-Morbihan', category: 'uci.pro', rank: 1, team: 'Team LogiCycle', discipline: DisciplinePracticed.ROUTE },
            { id: generateId(), date: '2024-03-17', eventName: 'Trofeo Alfredo Binda', category: 'uci.w.wwt', rank: 3, team: 'Team LogiCycle', discipline: DisciplinePracticed.ROUTE },
            { id: generateId(), date: '2024-03-31', eventName: 'Tour des Flandres', category: 'uci.w.wwt', rank: 8, team: 'Team LogiCycle', discipline: DisciplinePracticed.ROUTE },
            { id: generateId(), date: '2023-12-26', eventName: 'Coupe du Monde UCI - Gavere', category: 'cx', rank: 2, team: 'Team LogiCycle', discipline: DisciplinePracticed.CYCLO_CROSS },
            { id: generateId(), date: '2023-08-10', eventName: 'Championnats du Monde - Scratch Race', category: 'cm', rank: 5, team: 'Équipe Nationale', discipline: DisciplinePracticed.PISTE },
        ];
        
        setFormData(prev => ({
            ...prev,
            resultsHistory: simulatedResults,
        }));
    };
    
    const openAddResultModal = () => {
        setEditingResult(null);
        setIsResultModalOpen(true);
    };

    const openEditResultModal = (result: ResultItem) => {
        setEditingResult(result);
        setIsResultModalOpen(true);
    };

    const handleSaveResult = (resultToSave: ResultItem) => {
        setFormData(prev => {
            const history = prev.resultsHistory || [];
            let newHistory;
            if (editingResult) {
                newHistory = history.map(r => r.id === editingResult.id ? { ...resultToSave, id: editingResult.id } : r);
            } else {
                newHistory = [...history, { ...resultToSave, id: generateId() }];
            }
            return { ...prev, resultsHistory: newHistory };
        });
        setIsResultModalOpen(false);
    };

    const handleDeleteResult = (resultId: string) => {
        if (window.confirm("Supprimer ce résultat ?")) {
            setFormData(prev => ({
                ...prev,
                resultsHistory: (prev.resultsHistory || []).filter(r => r.id !== resultId)
            }));
        }
    };
    
    const resultsByYear = useMemo(() => {
        const filtered = (formData.resultsHistory || []).filter(r => disciplineFilter === 'all' || r.discipline === disciplineFilter);
        
        const grouped = filtered.reduce((acc, result) => {
            const year = new Date(result.date + "T12:00:00Z").getUTCFullYear();
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(result);
            return acc;
        }, {} as Record<string, ResultItem[]>);

        // Sort years descending
        return Object.entries(grouped).sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA));

    }, [formData.resultsHistory, disciplineFilter]);

    return (
        <div className="space-y-4">
            <fieldset className="border border-slate-600 p-3 rounded-md grid grid-cols-1 md:grid-cols-3 gap-2">
                <legend className="text-md font-medium text-slate-200 px-1">Résumé Carrière</legend>
                <div className="bg-slate-800 p-2 rounded">
                    <p className="text-sm font-medium text-slate-400">Victoires (1er)</p>
                    <p className="text-xl font-bold text-white">{careerStats.wins}</p>
                </div>
                <div className="bg-slate-800 p-2 rounded">
                    <p className="text-sm font-medium text-slate-400">Podiums (1-3)</p>
                    <p className="text-xl font-bold text-white">{careerStats.podiums}</p>
                </div>
                <div className="bg-slate-800 p-2 rounded">
                    <p className="text-sm font-medium text-slate-400">Top 10</p>
                    <p className="text-xl font-bold text-white">{careerStats.top10s}</p>
                </div>
            </fieldset>

            <div className="p-3 bg-slate-700 rounded-lg">
                <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                    <h5 className="text-md font-semibold text-slate-200">Historique des Résultats</h5>
                    <div className="flex items-center gap-2">
                         <select value={disciplineFilter} onChange={e => setDisciplineFilter(e.target.value as any)} className="input-field-sm">
                            <option value="all">Toutes Disciplines</option>
                            {Object.values(DisciplinePracticed).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <ActionButton type="button" onClick={handleSimulatePcsSearch} variant="secondary" size="sm" icon={<SearchIcon className="w-3 h-3"/>} className="text-xs" disabled={!formFieldsEnabled}>Simu. PCS</ActionButton>
                        <ActionButton type="button" onClick={openAddResultModal} icon={<PlusCircleIcon className="w-4 h-4" />} size="sm" disabled={!formFieldsEnabled}>Ajouter Résultat</ActionButton>
                    </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {resultsByYear.length > 0 ? resultsByYear.map(([year, results]) => (
                        <div key={year}>
                            <h6 className="font-bold text-slate-300 text-lg mb-1">{year}</h6>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-600 text-slate-300">
                                        <tr>
                                            <th className="px-2 py-3 text-left">Date</th>
                                            <th className="px-2 py-3 text-left">Épreuve</th>
                                            <th className="px-2 py-3 text-left">Catégorie</th>
                                            <th className="px-2 py-3 text-left">Rang</th>
                                            <th className="px-2 py-3 text-left">Équipe</th>
                                            <th className="px-2 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-600">
                                        {results.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(result => (
                                            <tr key={result.id} className="hover:bg-slate-600/50">
                                                <td className="px-2 py-3 whitespace-nowrap text-slate-300">{new Date(result.date + 'T12:00:00Z').toLocaleDateString('fr-CA')}</td>
                                                <td className="px-2 py-3 font-medium text-slate-100">{result.eventName}</td>
                                                <td className="px-2 py-3 text-slate-200">{getCategoryLabel(result.category)}</td>
                                                <td className="px-2 py-3 font-bold text-slate-100">{result.rank}</td>
                                                <td className="px-2 py-3 text-slate-300">{result.team}</td>
                                                <td className="px-2 py-3 text-right space-x-1">
                                                    <ActionButton type="button" onClick={() => openEditResultModal(result)} size="sm" variant="secondary" icon={<PencilIcon className="w-3 h-3"/>} disabled={!formFieldsEnabled}><span className="sr-only">Modifier</span></ActionButton>
                                                    <ActionButton type="button" onClick={() => handleDeleteResult(result.id)} size="sm" variant="danger" icon={<TrashIcon className="w-3 h-3"/>} disabled={!formFieldsEnabled}><span className="sr-only">Supprimer</span></ActionButton>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )) : <p className="text-slate-400 italic text-center py-4">Aucun résultat à afficher pour cette discipline.</p>}
                </div>
            </div>
            
            {isResultModalOpen && (
                <ResultFormModal
                    isOpen={isResultModalOpen}
                    onClose={() => setIsResultModalOpen(false)}
                    onSave={handleSaveResult}
                    initialData={editingResult}
                />
            )}
        </div>
    );
};

export interface ResultFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (result: ResultItem) => void;
    initialData: ResultItem | null;
}

export const ResultFormModal: React.FC<ResultFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [resultData, setResultData] = useState<Omit<ResultItem, 'id'>>({
        date: new Date().toISOString().split('T')[0],
        eventName: '',
        category: '',
        rank: '',
        team: '',
        discipline: DisciplinePracticed.ROUTE,
        ...(initialData || {})
    });

    useEffect(() => {
        if(initialData) {
            setResultData({ ...initialData });
        } else {
            setResultData({
                date: new Date().toISOString().split('T')[0],
                eventName: '',
                category: '',
                rank: '',
                team: '',
                discipline: DisciplinePracticed.ROUTE
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setResultData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(resultData as ResultItem);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Modifier Résultat" : "Ajouter Résultat"}>
            <div className="bg-slate-800 p-4 -m-6 rounded-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm font-medium text-slate-300">Date</label><input type="date" name="date" value={resultData.date} onChange={handleChange} required className="input-field-sm" style={{colorScheme: 'dark'}} /></div>
                        <div><label className="text-sm font-medium text-slate-300">Rang</label><input type="text" name="rank" value={resultData.rank} onChange={handleChange} required placeholder="1, 15, DNF..." className="input-field-sm" /></div>
                    </div>
                    <div><label className="text-sm font-medium text-slate-300">Nom de l'épreuve</label><input type="text" name="eventName" value={resultData.eventName} onChange={handleChange} required className="input-field-sm" /></div>
                    <div>
                        <label className="text-sm font-medium text-slate-300">Catégorie</label>
                        <select name="category" value={resultData.category} onChange={handleChange} required className="input-field-sm">
                            <option value="">-- Sélectionner une catégorie --</option>
                            {ELIGIBLE_CATEGORIES_CONFIG.map(group => (
                                <optgroup key={group.group} label={group.group} className="bg-slate-800 font-bold">
                                    {group.categories.map(cat => <option key={cat.id} value={cat.id} className="bg-slate-700 font-normal">{cat.label}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-300">Équipe</label>
                            <input type="text" name="team" value={resultData.team || ''} onChange={handleChange} placeholder="Équipe au moment du résultat" className="input-field-sm" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-300">Discipline</label>
                            <select name="discipline" value={resultData.discipline} onChange={handleChange} className="input-field-sm">
                                {Object.values(DisciplinePracticed).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-3">
                        <ActionButton type="button" variant="secondary" onClick={onClose}>Annuler</ActionButton>
                        <ActionButton type="submit">Sauvegarder</ActionButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
