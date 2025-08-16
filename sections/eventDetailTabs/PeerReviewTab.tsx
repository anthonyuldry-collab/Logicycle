import React, { useState, useMemo } from 'react';
import { AppState, RaceEvent, Rider, PeerRating, User, TeamRole } from '../../types';
import ActionButton from '../../components/ActionButton';
import StarIcon from '../../components/icons/StarIcon';

interface PeerReviewTabProps {
  event: RaceEvent;
  appState: AppState;
  setPeerRatings: (updater: React.SetStateAction<PeerRating[]>) => void;
  currentUser: User;
}

const PeerReviewTab: React.FC<PeerReviewTabProps> = ({ event, appState, setPeerRatings, currentUser }) => {
  const { riders, peerRatings } = appState;
  const isManagerView = currentUser.permissionRole !== TeamRole.VIEWER;

  const eventRiders = useMemo(() => {
    return riders.filter(r => event.selectedRiderIds.includes(r.id));
  }, [riders, event.selectedRiderIds]);

  const handleRatingChange = (ratedRiderId: string, rating: number) => {
    setPeerRatings(prevRatings => {
      const existingRatingIndex = prevRatings.findIndex(
        r => r.eventId === event.id && r.raterRiderId === currentUser.id && r.ratedRiderId === ratedRiderId
      );

      const newRatings = [...prevRatings];

      if (existingRatingIndex > -1) {
        // Update existing rating
        newRatings[existingRatingIndex] = { ...newRatings[existingRatingIndex], rating };
      } else {
        // Add new rating
        newRatings.push({
          id: `${event.id}-${currentUser.id}-${ratedRiderId}`,
          eventId: event.id,
          raterRiderId: currentUser.id,
          ratedRiderId: ratedRiderId,
          rating: rating,
        });
      }
      return newRatings;
    });
  };

  const myRatings = useMemo(() => {
    return peerRatings.filter(r => r.eventId === event.id && r.raterRiderId === currentUser.id);
  }, [peerRatings, event.id, currentUser.id]);

  const teamSpiritScores = useMemo(() => {
    const scores: Record<string, { total: number; count: number; average: number }> = {};
    eventRiders.forEach(rider => {
      scores[rider.id] = { total: 0, count: 0, average: 0 };
    });

    peerRatings
      .filter(r => r.eventId === event.id)
      .forEach(rating => {
        if (scores[rating.ratedRiderId]) {
          scores[rating.ratedRiderId].total += rating.rating;
          scores[rating.ratedRiderId].count++;
        }
      });

    Object.keys(scores).forEach(riderId => {
      if (scores[riderId].count > 0) {
        scores[riderId].average = scores[riderId].total / scores[riderId].count;
      }
    });

    return scores;
  }, [peerRatings, event.id, eventRiders]);

  const StarRating: React.FC<{ rating: number; onRate: (rating: number) => void }> = ({ rating, onRate }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} onClick={() => onRate(star)}>
            <StarIcon className={`w-6 h-6 transition-colors ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-400'}`} />
          </button>
        ))}
      </div>
    );
  };
  
  const ManagerView = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-700">Synthèse de l'Esprit d'Équipe</h3>
       <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Coureur</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Note Moyenne</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Nombre d'évaluations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {eventRiders.map(rider => (
              <tr key={rider.id}>
                <td className="px-4 py-2 font-medium">{rider.firstName} {rider.lastName}</td>
                <td className="px-4 py-2 font-semibold">
                    {teamSpiritScores[rider.id]?.average > 0 ? teamSpiritScores[rider.id].average.toFixed(2) + ' / 5' : 'N/A'}
                </td>
                <td className="px-4 py-2">{teamSpiritScores[rider.id]?.count || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
    </div>
  );

  const RiderView = () => (
     <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-700">Évaluer mes coéquipiers</h3>
      <p className="text-sm text-gray-600">Votre évaluation est anonyme. Notez l'esprit d'équipe et la collaboration de chaque coéquipier durant cet événement.</p>
       <div className="space-y-3">
        {eventRiders.filter(r => r.id !== currentUser.id).map(rider => {
            const currentRating = myRatings.find(r => r.ratedRiderId === rider.id)?.rating || 0;
            return (
                 <div key={rider.id} className="p-3 bg-gray-50 rounded-lg border flex justify-between items-center">
                    <span className="font-medium text-gray-800">{rider.firstName} {rider.lastName}</span>
                    <StarRating rating={currentRating} onRate={(rating) => handleRatingChange(rider.id, rating)}/>
                 </div>
            )
        })}
       </div>
    </div>
  );

  return (
    <div>
        {isManagerView ? <ManagerView /> : <RiderView />}
    </div>
  );
};

export default PeerReviewTab;
