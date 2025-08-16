

import { Rider, PowerProfile, Sex, RiderQualitativeProfile } from '../types';
import { PROFILE_WEIGHTS, riderProfileKeyToRefTableKeyMap, POWER_PROFILE_REFERENCE_TABLES, POWER_PROFILE_REFERENCE_TABLES_WATTS, POWER_PROFILE_REFERENCE_TABLES_1MIN_WATTS, POWER_PROFILE_REFERENCE_TABLES_5MIN_WATTS, POWER_PROFILE_REFERENCE_TABLES_5S_WATTS, POWER_PROFILE_REFERENCE_TABLES_1S_WATTS, defaultRiderCharCap } from '../constants';

const hasData = (profile?: PowerProfile) => profile && Object.keys(profile).length > 0 && Object.values(profile).some(v => typeof v === 'number' && v > 0);

const calculateSingleCharacteristicScore = (
  wkg: number | undefined,
  refTable: { category: string; [key: string]: number | string }[],
  refKey: string
): number => {
  if (wkg === undefined || wkg === null || isNaN(wkg)) return 0;
  const worldClassValue = refTable[0][refKey] as number;
  const cat5Value = refTable[refTable.length - 1][refKey] as number;
  if (wkg >= worldClassValue) return 100;
  if (wkg <= cat5Value) return 10;
  const score = 10 + ((wkg - cat5Value) / (worldClassValue - cat5Value)) * 90;
  return Math.round(score);
};

const calculateSingleCharacteristicScoreRaw = (
  watts: number | undefined,
  refTable: { category: string; [key: string]: number | string }[],
  refKey: string
): number => {
  if (watts === undefined || watts === null || isNaN(watts)) return 0;
  const worldClassValue = refTable[0][refKey] as number;
  const cat5Value = refTable[refTable.length - 1][refKey] as number;
  if (watts >= worldClassValue) return 100;
  if (watts <= cat5Value) return 10;
  const score = 10 + ((watts - cat5Value) / (worldClassValue - cat5Value)) * 90;
  return Math.round(score);
};

export const calculateRiderCharacteristics = (riderData: Partial<Rider>): {
    charSprint: number;
    charAnaerobic: number;
    charPuncher: number;
    charClimbing: number;
    charRouleur: number;
    generalPerformanceScore: number;
    fatigueResistanceScore: number;
} => {
    const { powerProfileFresh, powerProfile15KJ, powerProfile30KJ, powerProfile45KJ, weightKg, sex, qualitativeProfile } = riderData;

    if (!hasData(powerProfileFresh) || !weightKg) {
        return { ...defaultRiderCharCap, generalPerformanceScore: 0, fatigueResistanceScore: 0 };
    }

    const refTableSex = sex || Sex.FEMALE; // Default to female if sex is not provided
    const refTableWkg = refTableSex === Sex.MALE ? POWER_PROFILE_REFERENCE_TABLES.men : POWER_PROFILE_REFERENCE_TABLES.women;
    const refTable1sWatts = refTableSex === Sex.MALE ? POWER_PROFILE_REFERENCE_TABLES_1S_WATTS.men : POWER_PROFILE_REFERENCE_TABLES_1S_WATTS.women;
    const refTable5sWatts = refTableSex === Sex.MALE ? POWER_PROFILE_REFERENCE_TABLES_5S_WATTS.men : POWER_PROFILE_REFERENCE_TABLES_5S_WATTS.women;
    const refTable1minWatts = refTableSex === Sex.MALE ? POWER_PROFILE_REFERENCE_TABLES_1MIN_WATTS.men : POWER_PROFILE_REFERENCE_TABLES_1MIN_WATTS.women;
    const refTable5minWatts = refTableSex === Sex.MALE ? POWER_PROFILE_REFERENCE_TABLES_5MIN_WATTS.men : POWER_PROFILE_REFERENCE_TABLES_5MIN_WATTS.women;
    const refTable20minWatts = refTableSex === Sex.MALE ? POWER_PROFILE_REFERENCE_TABLES_WATTS.men : POWER_PROFILE_REFERENCE_TABLES_WATTS.women;

    const wkg = (power?: number) => power && weightKg ? power / weightKg : undefined;
    
    const fresh = powerProfileFresh;
    const scoreWkg = (powerKey: keyof PowerProfile) => calculateSingleCharacteristicScore(wkg(fresh?.[powerKey]), refTableWkg, riderProfileKeyToRefTableKeyMap[powerKey]);
    const scoreWatts = (powerKey: keyof PowerProfile, refTable: any, refTableKey: string) => calculateSingleCharacteristicScoreRaw(fresh?.[powerKey], refTable, refTableKey);

    const sprintScoreWatts = (scoreWatts('power5s', refTable5sWatts, 'power5s') * 0.6) + (scoreWatts('power1s', refTable1sWatts, 'power1s') * 0.4);
    const sprintScoreWkg = (scoreWkg('power5s') * 0.6) + (scoreWkg('power30s') * 0.4);
    const charSprint = (sprintScoreWatts * 0.6) + (sprintScoreWkg * 0.4);
    
    const charAnaerobic = (scoreWkg('power30s') * 0.5) + (scoreWkg('power1min') * 0.5);
    const charPuncher = (scoreWkg('power1min') * 0.4) + (scoreWkg('power3min') * 0.4) + (scoreWkg('power5min') * 0.2);
    const charClimbing = (scoreWkg('power5min') * 0.2) + (scoreWkg('power12min') * 0.3) + (scoreWkg('power20min') * 0.5);
    
    const wattsScoreRouleur = (scoreWatts('power5min', refTable5minWatts, 'power5min') * 0.2) + (scoreWatts('power20min', refTable20minWatts, 'power20min') * 0.4) + (scoreWatts('criticalPower', refTable20minWatts, 'power20min') * 0.4);
    const wkgScoreRouleur = (scoreWkg('power20min') * 0.5) + (scoreWkg('criticalPower') * 0.5);
    const charRouleur = (wattsScoreRouleur * 0.7) + (wkgScoreRouleur * 0.3);

    const baseChars = { charSprint, charAnaerobic, charPuncher, charClimbing, charRouleur };

    const fatigueProfile = hasData(powerProfile45KJ) ? powerProfile45KJ : (hasData(powerProfile30KJ) ? powerProfile30KJ : powerProfile15KJ);
    let fatigueResistanceScore = 50; 
    
    if (hasData(fatigueProfile) && fresh) {
        const keyDurations: (keyof PowerProfile)[] = ['power5s', 'power1min', 'power5min', 'criticalPower'];
        const weights = { power5s: 0.1, power1min: 0.2, power5min: 0.3, criticalPower: 0.4 };
        
        let totalScore = 0;
        let totalWeight = 0;
        
        keyDurations.forEach(key => {
            const freshPower = fresh[key];
            const fatiguePower = fatigueProfile?.[key];
            if(typeof freshPower === 'number' && typeof fatiguePower === 'number' && freshPower > 0) {
                totalScore += (fatiguePower / freshPower) * weights[key as keyof typeof weights];
                totalWeight += weights[key as keyof typeof weights];
            }
        });
        
        if (totalWeight > 0) {
            const powerRatio = totalScore / totalWeight;
            fatigueResistanceScore = Math.pow(powerRatio, 2) * 100;
        }
    }
    
    const profileWeights = PROFILE_WEIGHTS[qualitativeProfile || RiderQualitativeProfile.AUTRE];
    let generalPerformanceScore = 0;
    const charKeys: (keyof typeof baseChars)[] = ['charSprint', 'charAnaerobic', 'charPuncher', 'charClimbing', 'charRouleur'];
    charKeys.forEach(charKey => {
        generalPerformanceScore += (baseChars[charKey] || 0) * (profileWeights[charKey] || 0);
    });

    return {
        charSprint: Math.round(baseChars.charSprint),
        charAnaerobic: Math.round(baseChars.charAnaerobic),
        charPuncher: Math.round(baseChars.charPuncher),
        charClimbing: Math.round(baseChars.charClimbing),
        charRouleur: Math.round(baseChars.charRouleur),
        generalPerformanceScore: Math.round(Math.max(0, Math.min(100, generalPerformanceScore))),
        fatigueResistanceScore: Math.round(Math.max(0, Math.min(100, fatigueResistanceScore)))
    };
};