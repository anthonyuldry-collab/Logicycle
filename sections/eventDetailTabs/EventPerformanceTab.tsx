
import React, { useState, useEffect } from 'react';
import { RaceEvent, PerformanceEntry as AppPerformanceEntry, RiderRating, Rider, AppState, StaffRating, StaffStatus } from '../../types';
import { emptyPerformanceEntry } from '../../constants';
import ActionButton from '../../components/ActionButton';
import StarIcon from '../../components/icons/StarIcon';

interface EventPerformanceTabProps {
  event: RaceEvent;
  eventId: string;
  appState: AppState;
  setPerformanceEntry: (itemOrUpdater: AppPerformanceEntry | ((prevItem: AppPerformanceEntry | undefined) => AppPerformanceEntry)) => void;
}

export const EventPerformanceTab: React.FC<EventPerformanceTabProps> = ({ 
    event, 
    eventId, 
    appState, 
    setPerformanceEntry 
}) => {
    const [performanceData, setPerformanceData] = useState<AppPerformanceEntry>(
        appState.performanceEntries.find(p => p.eventId === eventId) || 
        emptyPerformanceEntry(eventId, `${eventId}_perf_tab_init_${Date.now()}`)
    );
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const currentEntry = appState.performanceEntries.find(p => p.eventId === eventId);
        const riderIdsInEvent = event.selectedRiderIds || [];
        const staffIdsInEvent = event.selectedStaffIds || [];
        
        // Ensure rider ratings are synced with participants
        let riderRatings: RiderRating[] = (currentEntry?.riderRatings || []).filter(r => riderIdsInEvent.includes(r.riderId));
        const existingRiderIds = new Set(riderRatings.map(r => r.riderId));
        riderIdsInEvent.forEach(riderId => {
            if (!existingRiderIds.has(riderId)) {
                riderRatings.push({ riderId });
            }
        });
        
        // Ensure staff ratings are synced with participants
        let staffRatings: StaffRating[] = (currentEntry?.staffRatings || []).filter(r => staffIdsInEvent.includes(r.staffId));
        const existingStaffIds = new Set(staffRatings.map(r => r.staffId));
        staffIdsInEvent.forEach(staffId => {
            if (!existingStaffIds.has(staffId)) {
                staffRatings.push({ staffId, rating: 0, eventId }); // Default to 0, meaning not rated
            }
        });

        const initialData = currentEntry || emptyPerformanceEntry(eventId, `${eventId}_perf_tab_effect_${Date.now()}`);
        setPerformanceData({ ...initialData, riderRatings, staffRatings });
        
    }, [eventId, appState.performanceEntries, event.selectedRiderIds, event.selectedStaffIds]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, participantId?: string, type?: 'rider' | 'staff', field?: keyof RiderRating | keyof StaffRating) => {
        const { name, value, type: inputType } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setPerformanceData(prevData => {
            if (participantId && type && field) {
                if (type === 'rider') {
                    return {
                        ...prevData,
                        riderRatings: (prevData.riderRatings || []).map(rating => {
                            if (rating.riderId === participantId) {
                                return { ...rating, [field]: inputType === 'checkbox' ? checked : value };
                            }
                            return rating;
                        })
                    };
                } else if (type === 'staff') {
                     return {
                        ...prevData,
                        staffRatings: (prevData.staffRatings || []).map(rating => {
                            if (rating.staffId === participantId) {
                                return { ...rating, [field]: value };
                            }
                            return rating;
                        })
                    };
                }
            } else {
                return { ...prevData, [name]: value };
            }
            return prevData;
        });
    };
    
    const handleScoreChange = (participantId: string, type: 'rider' | 'staff', field: 'collectiveScore' | 'technicalScore' | 'physicalScore' | 'rating', value: number | undefined) => {
         setPerformanceData(prevData => {
            if (type === 'rider') {
                return {
                    ...prevData,
                    riderRatings: (prevData.riderRatings || []).map(rating => 
                        rating.riderId === participantId ? { ...rating, [field]: value } : rating
                    )
                };
            } else { // staff
                return {
                    ...prevData,
                    staffRatings: (prevData.staffRatings || []).map(rating => 
                        rating.staffId === participantId ? { ...rating, [field]: value } : rating
                    )
                };
            }
        });
    }

    const handleSave = () => {
        setPerformanceEntry(performanceData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        const currentEntry = appState.performanceEntries.find(p => p.eventId === eventId);
        setPerformanceData(currentEntry || emptyPerformanceEntry(eventId, `${eventId}_perf_tab_cancel_${Date.now()}`));
        setIsEditing(false);
    };

    const getParticipantName = (id: string, type: 'rider' | 'staff') => {
        const participant = type === 'rider'
            ? appState.riders.find(p => p.id === id)
            : appState.staff.find(p => p.id === id);
        return participant ? `${participant.firstName} ${participant.lastName}` : `ID: ${id}`;
    };
    
    const renderScoreButtons = (currentValue: number | undefined, onChange: (value: number | undefined) => void) => {
        return (
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map(score => {
                    const isSelected = currentValue === score;
                    return (
                        <button key={score} type="button" onClick={() => onChange(isSelected ? undefined : score)} className={`w-6 h-6 rounded-full text-xs font-bold transition-all ${ isSelected ? 'bg-blue-600 text-white ring-2 ring-offset-1 ring-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300' }`}>
                            {score}
                        </button>
                    )
                })}
            </div>
        )
    };
    
    const inputClass = "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm bg-white text-gray-900 border-gray-300 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500";
    const checkboxClass = "h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500";

    const vacataires = appState.staff.filter(s => event.selectedStaffIds.includes(s.id) && s.status === StaffStatus.VACATAIRE);

    if (isEditing) {
        return (
            <div className="space-y-6">
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-700">Débriefing Général</h4>
                    <div><label className="block text-sm font-medium text-gray-700">Objectifs Généraux</label><textarea name="generalObjectives" value={performanceData.generalObjectives} onChange={handleInputChange} rows={2} className={inputClass}/></div>
                    <div><label className="block text-sm font-medium text-gray-700">Résumé des Résultats</label><textarea name="resultsSummary" value={performanceData.resultsSummary} onChange={handleInputChange} rows={2} className={inputClass}/></div>
                    <div><label className="block text-sm font-medium text-gray-700">Enseignements Clés</label><textarea name="keyLearnings" value={performanceData.keyLearnings} onChange={handleInputChange} rows={2} className={inputClass}/></div>
                </div>
                
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-700">Évaluations Individuelles Coureurs</h4>
                     {(performanceData.riderRatings || []).map(rating => (
                        <div key={rating.riderId} className="bg-gray-50 p-3 rounded-md border">
                            <h5 className="font-semibold text-gray-800">{getParticipantName(rating.riderId, 'rider')}</h5>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div><label className="block text-sm font-medium">Classement</label><input type="text" value={rating.classification || ''} onChange={e => handleInputChange(e, rating.riderId, 'rider', 'classification')} className={inputClass}/></div>
                                <div className="space-x-4 pt-6">
                                  <label className="inline-flex items-center">
                                    <input type="checkbox" checked={!!rating.didNotStart} onChange={e => handleInputChange(e, rating.riderId, 'rider', 'didNotStart')} className={checkboxClass}/>
                                    <span className="ml-2">DNS</span>
                                  </label>
                                  <label className="inline-flex items-center">
                                    <input type="checkbox" checked={!!rating.didNotFinish} onChange={e => handleInputChange(e, rating.riderId, 'rider', 'didNotFinish')} className={checkboxClass}/>
                                    <span className="ml-2">DNF</span>
                                  </label>
                                  <label className="inline-flex items-center">
                                    <input type="checkbox" checked={!!rating.crashed} onChange={e => handleInputChange(e, rating.riderId, 'rider', 'crashed')} className={checkboxClass}/>
                                    <span className="ml-2">Chute</span>
                                  </label>
                                </div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium">Feedback (DS)</label><textarea value={rating.dsFeedback || ''} onChange={e => handleInputChange(e, rating.riderId, 'rider', 'dsFeedback')} rows={1} className={inputClass}/></div>
                                <div><label className="block text-sm font-medium mb-1">Score Collectif (/5)</label>{renderScoreButtons(rating.collectiveScore, (val) => handleScoreChange(rating.riderId, 'rider', 'collectiveScore', val))}</div>
                                <div><label className="block text-sm font-medium mb-1">Score Technique (/5)</label>{renderScoreButtons(rating.technicalScore, (val) => handleScoreChange(rating.riderId, 'rider', 'technicalScore', val))}</div>
                                <div><label className="block text-sm font-medium mb-1">Score Physique (/5)</label>{renderScoreButtons(rating.physicalScore, (val) => handleScoreChange(rating.riderId, 'rider', 'physicalScore', val))}</div>
                             </div>
                        </div>
                     ))}
                </div>

                {vacataires.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-700">Évaluation Staff (Vacataires)</h4>
                        {vacataires.map(staffMember => {
                            const rating = performanceData.staffRatings?.find(r => r.staffId === staffMember.id);
                            return (
                                <div key={staffMember.id} className="bg-blue-50 p-3 rounded-md border border-blue-200">
                                    <h5 className="font-semibold text-gray-800">{getParticipantName(staffMember.id, 'staff')}</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Note de la mission (/5)</label>
                                            <div className="flex space-x-1">
                                                {[1, 2, 3, 4, 5].map(score => (
                                                    <button key={score} type="button" onClick={() => handleScoreChange(staffMember.id, 'staff', 'rating', rating?.rating === score ? undefined : score)} className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${rating?.rating === score ? 'bg-yellow-500 text-white ring-2 ring-offset-1 ring-yellow-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}><StarIcon className="w-4 h-4 inline-block -mt-1"/> {score}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium">Commentaire (optionnel)</label>
                                            <textarea value={rating?.comment || ''} onChange={e => handleInputChange(e, staffMember.id, 'staff', 'comment')} rows={2} className={inputClass}/>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}


                 <div className="flex justify-end space-x-2">
                    <ActionButton variant="secondary" onClick={handleCancel}>Annuler</ActionButton>
                    <ActionButton onClick={handleSave}>Sauvegarder</ActionButton>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h3 className="text-xl font-semibold text-gray-700">Rapport de Performance</h3>
                 <ActionButton onClick={() => setIsEditing(true)}>Modifier</ActionButton>
            </div>
             <div className="bg-gray-50 p-4 rounded-md border">
                <h4 className="font-semibold text-gray-800">Débriefing Général</h4>
                <p><strong>Objectifs :</strong> {performanceData.generalObjectives || "N/A"}</p>
                <p><strong>Résumé Résultats :</strong> {performanceData.resultsSummary || "N/A"}</p>
                <p><strong>Enseignements :</strong> {performanceData.keyLearnings || "N/A"}</p>
            </div>
            
             <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">Évaluations Individuelles</h4>
                {(performanceData.riderRatings || []).length > 0 ? (
                    (performanceData.riderRatings || []).map(rating => (
                        <div key={rating.riderId} className="p-2 border rounded">
                             <p><strong>{getParticipantName(rating.riderId, 'rider')}:</strong> Class. {rating.classification || 'N/A'}. Feedback: {rating.dsFeedback || "N/A"}</p>
                        </div>
                    ))
                ) : <p className="italic text-gray-500">Aucune évaluation individuelle enregistrée.</p>}
            </div>

            {vacataires.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-semibold text-gray-800">Évaluations Staff</h4>
                    {(performanceData.staffRatings || []).filter(r => r.rating > 0).length > 0 ? (
                        (performanceData.staffRatings || []).filter(r => r.rating > 0).map(rating => (
                            <div key={rating.staffId} className="p-2 border rounded bg-blue-50">
                                <p><strong>{getParticipantName(rating.staffId, 'staff')}:</strong> Note {rating.rating}/5. Commentaire: {rating.comment || "N/A"}</p>
                            </div>
                        ))
                    ) : <p className="italic text-gray-500">Aucune évaluation de staff enregistrée.</p>}
                </div>
            )}

        </div>
    )
};
