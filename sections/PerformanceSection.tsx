import React, { useState, useMemo, useEffect } from 'react';
import { AppState, AppSection, TeamProduct, Rider, PowerProfile, RiderQualitativeProfile as RiderQualitativeProfileEnum, PerformanceEntry, RiderRating, RaceEvent, User, TeamRole, EventType, RiderEventStatus, ScoutingProfile, StaffRole, ContractType, Sex } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import ActionButton from '../components/ActionButton';
import Modal from '../components/Modal';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import { RIDER_QUALITATIVE_PROFILE_COLORS, COGGAN_CATEGORY_COLORS, POWER_PROFILE_REFERENCE_TABLES, riderProfileKeyToRefTableKeyMap, POWER_ANALYSIS_DURATIONS_CONFIG, PERFORMANCE_SCORE_WEIGHTS, COLLECTIVE_SCORE_PENALTY_THRESHOLD, COLLECTIVE_SCORE_PENALTY_MULTIPLIER, CATEGORY_ID_TO_SCALE_MAP, EVENT_CATEGORY_POINTS_TABLE, RIDER_LEVEL_CATEGORIES } from '../constants';
import TrophyIcon from '../components/icons/TrophyIcon';
import StarIcon from '../components/icons/StarIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import ChartBarIcon from '../components/icons/ChartBarIcon';
import PerformanceProjectTab from '../components/riderDetailTabs/PerformanceProjectTab';
import { ResultsTab } from '../components/riderDetailTabs/ResultsTab';
import EyeIcon from '../components/icons/EyeIcon';
import EyeSlashIcon from '../components/icons/EyeSlashIcon';
import UsersIcon from '../components/icons/UsersIcon';
import CakeIcon from '../components/icons/CakeIcon';

// Type definitions for the new section
type PerformancePoleTab = 'global' | 'powerAnalysis' | 'nutritionProducts' | 'planning';
type RiderPerformanceTab = 'ppr' | 'project' | 'results';
type ObjectiveCode = 'bleu' | 'vert' | 'orange';

// Helper function for ID generation
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

// Initial state for the nutrition product form
const initialProductFormState: Omit<TeamProduct, 'id'> = {
  name: '',
  type: 'gel',
  brand: '',
  carbs: 0,
  glucose: undefined,
  fructose: undefined,
  caffeine: undefined,
  sodium: undefined,
  notes: ''
};

const getAgeCategory = (birthDate?: string): { category: string; age: number | null } => {
    if (!birthDate || typeof birthDate !== 'string') {
        return { category: 'N/A', age: null };
    }
    
    // Use Date.parse for more flexible parsing, then create a Date object.
    const birthTime = Date.parse(birthDate);
    if (isNaN(birthTime)) {
        return { category: 'N/A', age: null };
    }
    
    const birth = new Date(birthTime);
    const today = new Date();
    
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    if (age < 0 || age > 120) { // Sanity check
        return { category: 'N/A', age: null };
    }

    let category = 'Senior';
    if (age <= 14) category = 'U15';
    else if (age <= 16) category = 'U17';
    else if (age <= 18) category = 'U19';
    else if (age <= 22) category = 'U23';
    
    return { category, age };
};

const calculateWkg = (power?: number, weight?: number): string => {
  if (typeof power === 'number' && typeof weight === 'number' && weight > 0) {
    return (power / weight).toFixed(1);
  }
  return "-";
};

const gcf = (a: number, b: number): number => {
    return b === 0 ? a : gcf(b, a % b);
};

const calculateRatio = (glucose?: number, fructose?: number): { display: string; value: string } => {
    if (glucose === undefined || fructose === undefined || fructose <= 0) {
        if (glucose && glucose > 0) return { display: '> 2:1', value: `${glucose}:0` };
        return { display: 'N/A', value: 'N/A' };
    }
    if (glucose <= 0) {
      return { display: '0:1', value: `0:${fructose}` };
    }

    const ratioValue = glucose / fructose;
    const commonDivisor = gcf(glucose, fructose);
    const simplifiedRatio = `${glucose / commonDivisor}:${fructose / commonDivisor}`;

    if (ratioValue > 2) {
        return { display: `> 2:1`, value: simplifiedRatio };
    }
    return { display: simplifiedRatio, value: simplifiedRatio };
};


interface PerformancePoleSectionProps {
  appState: AppState;
  navigateTo: (section: AppSection, eventId?: string) => void;
  setTeamProducts: React.Dispatch<React.SetStateAction<TeamProduct[]>>;
  setRiders: React.Dispatch<React.SetStateAction<Rider[]>>; // Power analysis might need to update riders in future
  currentUser: User;
}

// --- Calculation helpers for performance scores, adapted from EventPerformanceTab ---
const getResultPoints = (classification: string | undefined, eligibleCategory: string): number => {
  const scale = CATEGORY_ID_TO_SCALE_MAP[eligibleCategory] || 'E'; // Default to lowest scale if not found
  const pointsConfig = EVENT_CATEGORY_POINTS_TABLE[scale];

  if (!classification) return pointsConfig.finished;

  const lowerClassification = classification.toLowerCase();
  
  if (lowerClassification === "dnf" || lowerClassification === "dns" || lowerClassification === "hd" || lowerClassification === "otl") {
    return pointsConfig.dnf;
  }
  if (lowerClassification === "terminé" || lowerClassification === "finish") {
    return pointsConfig.finished;
  }

  const rankMatch = lowerClassification.match(/^(\d+)/);
  if (rankMatch) {
    const rank = parseInt(rankMatch[1], 10);
    if (rank === 1) return pointsConfig.rank1;
    if (rank === 2) return pointsConfig.rank2;
    if (rank === 3) return pointsConfig.rank3;
    if (rank <= 10) return pointsConfig.rankTop10;
    if (rank <= 20) return pointsConfig.rankTop20;
    return pointsConfig.finished; // Finished outside top 20
  }

  return pointsConfig.finished; // Default for unparsed classifications
};

const calculateOverallPerformanceScore = (
  riderRating: RiderRating,
  eligibleCategory: string
): number => {
  const { collectiveScore, technicalScore, physicalScore, classification } = riderRating;
  const normalizedCollective = (collectiveScore || 0) * 20;
  const normalizedTechnical = (technicalScore || 0) * 20;
  const normalizedPhysical = (physicalScore || 0) * 20;
  const resultScore = getResultPoints(classification, eligibleCategory);

  let totalScore =
    (normalizedCollective * PERFORMANCE_SCORE_WEIGHTS.COLLECTIVE) +
    (normalizedTechnical * PERFORMANCE_SCORE_WEIGHTS.TECHNICAL) +
    (normalizedPhysical * PERFORMANCE_SCORE_WEIGHTS.PHYSICAL) +
    (resultScore * PERFORMANCE_SCORE_WEIGHTS.RESULT);

  if (collectiveScore && collectiveScore < COLLECTIVE_SCORE_PENALTY_THRESHOLD) {
    totalScore *= COLLECTIVE_SCORE_PENALTY_MULTIPLIER;
  }

  return Math.round(Math.max(0, Math.min(totalScore, 100)));
};

export const PerformancePoleSection: React.FC<PerformancePoleSectionProps> = ({ appState, navigateTo, setTeamProducts, setRiders, currentUser }) => {
  const showGlobalTab = currentUser.permissionRole !== TeamRole.VIEWER;
  
  // Rider-specific view state
  const riderForCurrentUser = useMemo(() => appState.riders.find(r => r.email === currentUser.email), [appState.riders, currentUser.email]);
  const [editableRiderData, setEditableRiderData] = useState<Rider | undefined>(riderForCurrentUser);
  const [activeRiderTab, setActiveRiderTab] = useState<RiderPerformanceTab>('ppr');

  useEffect(() => {
    setEditableRiderData(riderForCurrentUser);
  }, [riderForCurrentUser]);
  
  // Admin/editor view state
  const [activeAdminTab, setActiveAdminTab] = useState<PerformancePoleTab>('global');

  // State for Nutrition Products Tab
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Omit<TeamProduct, 'id'> | TeamProduct>(initialProductFormState);
  const [isEditingProduct, setIsEditingProduct] = useState(false);

  // State for Power Analysis Tab
  type ProfileDisplayMode = 'all' | 'fresh' | 'kj15' | 'kj30' | 'kj45';
  const [powerProfileDisplayMode, setPowerProfileDisplayMode] = useState<ProfileDisplayMode>('all');
  const [genderReference, setGenderReference] = useState<'men' | 'women'>('women');
  const [ageCategoryFilter, setAgeCategoryFilter] = useState('all');
  const [levelCategoryFilter, setLevelCategoryFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [includeScouting, setIncludeScouting] = useState(false);
  const [analysisDisplayUnit, setAnalysisDisplayUnit] = useState<'W' | 'W/kg'>('W/kg');

  // State for Nutrition Planning
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [selectedRiderId, setSelectedRiderId] = useState<string>('');
    const [objectiveCode, setObjectiveCode] = useState<ObjectiveCode>('vert');
    const [duration, setDuration] = useState<number>(3);
    const [hydrationTarget, setHydrationTarget] = useState<number>(500);
    const [sodiumTarget, setSodiumTarget] = useState<number>(300);
    const [generatedPlan, setGeneratedPlan] = useState<{
        hourly: { product: TeamProduct; quantity: number }[];
        total: { product: TeamProduct; quantity: number }[];
        summary: { carbs: number; sodium: number; hydration: number; caffeine: number; };
        target: { carbs: number; sodium: number; hydration: number; }
    } | null>(null);

  const { riders, performanceEntries, teamProducts, raceEvents, scoutingProfiles, peerRatings } = appState;

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const allAgeCategoriesForFilter = useMemo(() => {
    const ageCats = new Set<string>();
    riders.forEach(r => {
        const { category } = getAgeCategory(r.birthDate);
        if (category !== 'N/A') ageCats.add(category);
    });
    const sortedAgeCats = Array.from(ageCats).sort((a, b) => {
        if (a === 'Senior') return 1;
        if (b === 'Senior') return -1;
        const aNum = parseInt(a.replace('U', ''), 10);
        const bNum = parseInt(b.replace('U', ''), 10);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return a.localeCompare(b);
    });
    return ['all', ...sortedAgeCats];
  }, [riders]);

  const allLevelCategoriesForFilter = useMemo(() => {
    const levelCats = new Set<string>();
    riders.forEach(r => {
      (r.categories || []).forEach(cat => {
        if (RIDER_LEVEL_CATEGORIES.includes(cat) || cat === 'Handisport') {
            levelCats.add(cat);
        }
      })
    });
    return ['all', ...Array.from(levelCats).sort()];
  }, [riders]);

  const getPowerCategory = (
    wkg: number,
    powerProfileKeyForRefTable: keyof PowerProfile,
    gender: 'men' | 'women'
  ): string | null => {
    const refTableKey = riderProfileKeyToRefTableKeyMap[powerProfileKeyForRefTable];
    if (!refTableKey || wkg === undefined || wkg === null || isNaN(wkg)) {
      return 'N/A';
    }
    
    const referenceTable = POWER_PROFILE_REFERENCE_TABLES[gender];

    for (const refRow of referenceTable) {
      const refWkg = refRow[refTableKey as keyof typeof refRow] as number | undefined;
      if (refWkg !== undefined && wkg >= refWkg) {
        return refRow.category as string;
      }
    }
    
    const lowestCategory = referenceTable[referenceTable.length - 1];
    if (lowestCategory && (lowestCategory[refTableKey as keyof typeof lowestCategory] as number | undefined) !== undefined && wkg < (lowestCategory[refTableKey as keyof typeof lowestCategory] as number)) {
        return `Inf. ${lowestCategory.category}`;
    }

    return "Non classé"; 
  };

  // --- Types and Memoized data for Power Analysis Tab (moved to top level) ---
  type ProfileFilterKeys = 'powerProfileFresh' | 'powerProfile15KJ' | 'powerProfile30KJ' | 'powerProfile45KJ';
  
  type AnalysisRider = Pick<Rider, 'id' | 'firstName' | 'lastName' | 'qualitativeProfile' | 'birthDate' | 'categories' | 'weightKg' | 'sex' | 'powerProfileFresh' | 'powerProfile15KJ' | 'powerProfile30KJ' | 'powerProfile45KJ'> & { isScout: boolean };

  interface PowerProfileTableRowItem {
    rider: AnalysisRider;
    profileKey: ProfileFilterKeys;
    isFirstProfileRowForRider: boolean;
    numProfilesForRider: number;
  }
  
  const powerProfileTableRows = useMemo((): PowerProfileTableRowItem[] => {
    const combinedRiders: AnalysisRider[] = [
        ...riders.map(r => ({ ...r, isScout: false })),
        ...(includeScouting ? scoutingProfiles.map(s => ({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            qualitativeProfile: s.qualitativeProfile,
            birthDate: s.birthDate,
            sex: s.sex,
            categories: s.categories,
            weightKg: s.weightKg,
            powerProfileFresh: s.powerProfileFresh,
            powerProfile15KJ: s.powerProfile15KJ,
            powerProfile30KJ: s.powerProfile30KJ,
            powerProfile45KJ: s.powerProfile45KJ,
            isScout: true
        })) : [])
    ];

    const ridersToAnalyze = combinedRiders.filter(rider => {
        const ageMatch = ageCategoryFilter === 'all' || getAgeCategory(rider.birthDate).category === ageCategoryFilter;
        const levelMatch = levelCategoryFilter === 'all' || (rider.categories || []).includes(levelCategoryFilter);
        return ageMatch && levelMatch;
    });
        
    let result: PowerProfileTableRowItem[] = [];
    ridersToAnalyze.forEach(rider => {
      const profilesToShow: ProfileFilterKeys[] =
        powerProfileDisplayMode === 'all'
          ? ['powerProfileFresh', 'powerProfile15KJ', 'powerProfile30KJ', 'powerProfile45KJ']
          : [
                powerProfileDisplayMode === 'fresh' ? 'powerProfileFresh' 
                : powerProfileDisplayMode === 'kj15' ? 'powerProfile15KJ' 
                : powerProfileDisplayMode === 'kj30' ? 'powerProfile30KJ'
                : 'powerProfile45KJ'
            ];
            
      const validProfiles = profilesToShow.filter(pk => {
          const profile = rider[pk];
          return profile && Object.values(profile).some(v => v !== undefined && v !== null && v > 0);
      });
      
      const validProfilesCount = validProfiles.length;

      validProfiles.forEach(profileKey => {
          result.push({
              rider,
              profileKey,
              isFirstProfileRowForRider: result.filter(r => r.rider.id === rider.id).length === 0,
              numProfilesForRider: validProfilesCount,
          });
      });
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const getSortValue = (item: PowerProfileTableRowItem, key: string): string | number => {
          const { rider, profileKey } = item;
          if (key === 'riderName') {
            return `${rider.firstName} ${rider.lastName}`;
          }
          if (key === 'profile') {
            const profileOrder = ['powerProfileFresh', 'powerProfile15KJ', 'powerProfile30KJ', 'powerProfile45KJ'];
            return profileOrder.indexOf(profileKey);
          }
          if (key.endsWith('_wkg')) {
            const powerKey = key.replace('_wkg', '') as keyof PowerProfile;
            const powerValue = rider[profileKey]?.[powerKey];
            const weight = rider.weightKg;
            return (powerValue !== undefined && weight && weight > 0) ? powerValue / weight : -1
          }
          const powerValue = rider[profileKey]?.[key as keyof PowerProfile];
          return powerValue ?? -1;
        };

        const valA = getSortValue(a, sortConfig.key);
        const valB = getSortValue(b, sortConfig.key);

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }

    return result;
  }, [riders, scoutingProfiles, includeScouting, ageCategoryFilter, levelCategoryFilter, powerProfileDisplayMode, sortConfig]);

  const handleProductInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setCurrentProduct(prev => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value
    }));
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productToSave = {
        ...currentProduct,
        carbs: (currentProduct.glucose || 0) + (currentProduct.fructose || 0)
    };
    if (isEditingProduct && 'id' in productToSave) {
        setTeamProducts(prev => prev.map(p => p.id === (productToSave as TeamProduct).id ? (productToSave as TeamProduct) : p));
    } else {
        setTeamProducts(prev => [...prev, { ...productToSave, id: generateId() } as TeamProduct]);
    }
    setIsProductModalOpen(false);
  };
  
  const openAddProductModal = () => {
    setCurrentProduct(initialProductFormState);
    setIsEditingProduct(false);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: TeamProduct) => {
    setCurrentProduct(product);
    setIsEditingProduct(true);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm("Supprimer ce produit de la base de données de l'équipe ?")) {
        setTeamProducts(prev => prev.filter(p => p.id !== productId));
    }
  };
  
  const handleGeneratePlan = () => {
      const rider = riders.find(r => r.id === selectedRiderId);
      if (!rider) return;

      const carbsTarget = rider.performanceNutrition?.carbsPerHourTarget ?? 90;
      
      const plan = {
          hourly: [] as { product: TeamProduct; quantity: number }[],
          total: [] as { product: TeamProduct; quantity: number }[],
          summary: { carbs: 0, sodium: 0, hydration: 0, caffeine: 0 },
          target: { carbs: carbsTarget, sodium: sodiumTarget, hydration: hydrationTarget },
      };

      const selectedDrinks = (rider.performanceNutrition?.selectedDrinks || [])
        .map(sd => teamProducts.find(p => p.id === sd.productId)).filter(Boolean) as TeamProduct[];
      const selectedBars = (rider.performanceNutrition?.selectedBars || [])
        .map(sb => teamProducts.find(p => p.id === sb.productId)).filter(Boolean) as TeamProduct[];
      const selectedGels = (rider.performanceNutrition?.selectedGels || [])
        .map(sg => teamProducts.find(p => p.id === sg.productId)).filter(Boolean) as TeamProduct[];

      let hourlyCarbs = 0;
      
      // Drink first (base)
      if (selectedDrinks.length > 0) {
          const drink = selectedDrinks[0];
          const qty = 1;
          plan.hourly.push({ product: drink, quantity: qty });
          hourlyCarbs += (drink.carbs || 0) * qty;
      }
      
      let remainingCarbs = carbsTarget - hourlyCarbs;
      
      if (remainingCarbs > 0 && selectedBars.length > 0) {
          const bar = selectedBars[0];
          const qty = Math.floor(remainingCarbs / (bar.carbs || 1));
          if (qty > 0) {
              plan.hourly.push({ product: bar, quantity: qty });
              hourlyCarbs += (bar.carbs || 0) * qty;
          }
      }
      
      remainingCarbs = carbsTarget - hourlyCarbs;

       if (remainingCarbs > 0 && selectedGels.length > 0) {
          const gel = selectedGels[0];
          const qty = Math.ceil(remainingCarbs / (gel.carbs || 1));
           if (qty > 0) {
              plan.hourly.push({ product: gel, quantity: qty });
              hourlyCarbs += (gel.carbs || 0) * qty;
          }
      }

      const totalQuantities: Record<string, { product: TeamProduct; quantity: number }> = {};

      plan.hourly.forEach(item => {
          const totalQty = item.quantity * duration;
          if (totalQuantities[item.product.id]) {
              totalQuantities[item.product.id].quantity += totalQty;
          } else {
              totalQuantities[item.product.id] = { product: item.product, quantity: totalQty };
          }
      });
      
      plan.total = Object.values(totalQuantities);

      plan.summary.carbs = hourlyCarbs * duration;
      plan.summary.sodium = plan.total.reduce((sum, item) => sum + (item.product.sodium || 0) * item.quantity, 0);
      plan.summary.hydration = plan.total.filter(item => item.product.type === 'drink').reduce((sum, item) => sum + 500 * item.quantity, 0); // Assuming 500ml per drink
      plan.summary.caffeine = plan.total.reduce((sum, item) => sum + (item.product.caffeine || 0) * item.quantity, 0);

      setGeneratedPlan(plan);
  };
  
  const handleSavePlanToNotes = () => {
    if (!generatedPlan || !selectedRiderId) return;
    const rider = riders.find(r => r.id === selectedRiderId);
    if (!rider) return;

    let planText = `--- PLAN NUTRITIONNEL (Généré le ${new Date().toLocaleDateString('fr-FR')}) ---\n`;
    planText += `Objectifs: ${generatedPlan.target.carbs}g glucides/h, ${generatedPlan.target.hydration}ml/h, ${generatedPlan.target.sodium}mg sodium/h\n`;
    planText += `Durée: ${duration}h\n\n`;
    planText += "Plan Horaire:\n";
    generatedPlan.hourly.forEach(item => {
        planText += `- ${item.quantity}x ${item.product.name}\n`;
    });
    planText += "\nTotal Course:\n";
    generatedPlan.total.forEach(item => {
        planText += `- ${item.quantity}x ${item.product.name}\n`;
    });
    planText += "\nRésumé Total:\n";
    planText += `- Glucides: ${generatedPlan.summary.carbs.toFixed(0)}g\n`;
    planText += `- Sodium: ${generatedPlan.summary.sodium.toFixed(0)}mg\n`;
    planText += `- Hydratation: ${generatedPlan.summary.hydration}ml\n`;
    planText += `- Caféine: ${generatedPlan.summary.caffeine.toFixed(0)}mg\n`;

    const newHydrationNotes = rider.performanceNutrition?.hydrationNotes ? `${rider.performanceNutrition.hydrationNotes}\n\n${planText}` : planText;
    
    setRiders(prevRiders => prevRiders.map(r => 
        r.id === selectedRiderId 
        ? { ...r, performanceNutrition: { ...(r.performanceNutrition || {}), hydrationNotes: newHydrationNotes } }
        : r
    ));

    alert("Plan sauvegardé dans les notes d'hydratation du coureur !");
  };

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return ' ';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  if (!showGlobalTab) {
    if (!editableRiderData) {
      return (
        <SectionWrapper title="Mes Données de Performance">
            <p>Données non trouvées. Veuillez contacter un administrateur.</p>
        </SectionWrapper>
      );
    }
    
    const riderTabs = [
        { id: 'ppr', label: 'Mon Profil Puissance (PPR)' },
        { id: 'project', label: 'Mon Projet Performance' },
        { id: 'results', label: 'Mon Palmarès' },
    ];
    
    const handleRiderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const keys = name.split('.');
        
        // Type coercion for numeric inputs
        const isNumeric = type === 'number' || e.currentTarget.getAttribute('type') === 'number';

        setEditableRiderData(prev => {
            if (!prev) return undefined;
            const newFormData = structuredClone(prev); // Deep copy
            let currentLevel: any = newFormData;
    
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                currentLevel[key] = { ...(currentLevel[key] || {}) };
                currentLevel = currentLevel[key];
            }
            const lastKey = keys[keys.length - 1];
            currentLevel[lastKey] = isNumeric ? (value === '' ? undefined : parseFloat(value)) : value;
            return newFormData;
        });
    };

    const handleSaveRiderData = () => {
        if(editableRiderData){
            setRiders(prevRiders => prevRiders.map(r => r.id === editableRiderData.id ? editableRiderData : r));
            alert("Données sauvegardées !");
        }
    };
    
    // Create a correctly-typed state setter for ResultsTab
    const setResultsTabFormData: React.Dispatch<React.SetStateAction<Rider | Omit<Rider, 'id'>>> = (updater) => {
        setEditableRiderData(currentRider => {
            if (!currentRider) return undefined;
            const updatedData = typeof updater === 'function' 
                ? updater(currentRider) 
                : updater;
            return { ...currentRider, ...updatedData };
        });
    };

    return (
        <SectionWrapper title="Mes Données de Performance" actionButton={<ActionButton onClick={handleSaveRiderData}>Sauvegarder mes modifications</ActionButton>}>
            <div className="mb-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    {riderTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveRiderTab(tab.id as RiderPerformanceTab)}
                        className={`${
                        activeRiderTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        {tab.label}
                    </button>
                    ))}
                </nav>
            </div>
             {activeRiderTab === 'ppr' && <p>PPR Tab for rider view (TODO)</p>}
             {activeRiderTab === 'project' && editableRiderData && (
                <PerformanceProjectTab formData={editableRiderData} handleInputChange={handleRiderInputChange} formFieldsEnabled={true}/>
             )}
             {activeRiderTab === 'results' && editableRiderData && (
                 <ResultsTab formData={editableRiderData} formFieldsEnabled={true} setFormData={setResultsTabFormData} />
             )}
        </SectionWrapper>
    )
  }
  
  const powerDurationsConfig = POWER_ANALYSIS_DURATIONS_CONFIG;

  const tabButtonStyle = (tab: PerformancePoleTab) => 
    `px-3 py-2 font-medium text-sm rounded-t-md whitespace-nowrap transition-colors duration-150 focus:outline-none ${
      activeAdminTab === tab 
        ? 'bg-white text-gray-800 border-b-2 border-blue-500 shadow-sm' 
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
    }`;

    const totalWins = useMemo(() => {
        return riders.reduce((sum, r) => {
            const riderWins = (r.resultsHistory || []).filter(res => {
                const rank = typeof res.rank === 'string' ? parseInt(res.rank.replace(/\D/g, ''), 10) : res.rank;
                return !isNaN(rank) && rank === 1;
            }).length;
            return sum + riderWins;
        }, 0);
    }, [riders]);

    const SummaryCard: React.FC<{ title: string; value: string; icon: React.ElementType; subtext?: string; }> = ({ title, value, icon: Icon, subtext }) => (
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
        <div className="bg-blue-100 p-3 rounded-full">
            <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
        </div>
        </div>
    );

    const renderGlobalTab = () => {
        const totalRiders = riders.length;
        const averageAge = totalRiders > 0 ? riders.reduce((sum, r) => sum + (getAgeCategory(r.birthDate).age || 0), 0) / totalRiders : 0;
        const averagePerfScore = totalRiders > 0 ? riders.reduce((sum, r) => sum + (r.generalPerformanceScore || 0), 0) / totalRiders : 0;

        const topRidersByPerf = [...riders].sort((a, b) => (b.generalPerformanceScore || 0) - (a.generalPerformanceScore || 0)).slice(0, 5);

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard title="Total Coureurs" value={totalRiders.toString()} icon={UsersIcon} />
                    <SummaryCard title="Âge Moyen" value={averageAge.toFixed(1)} icon={CakeIcon} />
                    <SummaryCard title="Total Victoires" value={totalWins.toString()} icon={TrophyIcon} />
                    <SummaryCard title="Perf. Moyenne Générale" value={averagePerfScore.toFixed(1) + ' / 100'} icon={ChartBarIcon} />
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">Top 5 Coureurs (Performance Générale)</h4>
                    <div className="bg-gray-50 p-2 rounded-md border">
                        {topRidersByPerf.map(rider => (
                            <div key={rider.id} className="p-2 border-b last:border-b-0 flex justify-between items-center">
                                <span>{rider.firstName} {rider.lastName}</span>
                                <span className="font-bold">{rider.generalPerformanceScore?.toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderNutritionProductsTab = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Nom</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Marque</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Type</th>
                        <th className="py-2 px-3 text-right text-xs font-medium text-gray-500">Glucides (g)</th>
                        <th className="py-2 px-3 text-center text-xs font-medium text-gray-500">Ratio G:F</th>
                        <th className="py-2 px-3 text-right text-xs font-medium text-gray-500">Caféine (mg)</th>
                        <th className="py-2 px-3 text-right text-xs font-medium text-gray-500">Sodium (mg)</th>
                        <th className="py-2 px-3 text-right text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {teamProducts.map(product => (
                        <tr key={product.id}>
                            <td className="py-2 px-3 font-medium">{product.name}</td>
                            <td className="py-2 px-3">{product.brand}</td>
                            <td className="py-2 px-3 capitalize">{product.type}</td>
                            <td className="py-2 px-3 text-right">{product.carbs}</td>
                            <td className="py-2 px-3 text-center">{calculateRatio(product.glucose, product.fructose).display}</td>
                            <td className="py-2 px-3 text-right">{product.caffeine || '-'}</td>
                            <td className="py-2 px-3 text-right">{product.sodium || '-'}</td>
                            <td className="py-2 px-3 text-right space-x-1">
                                <ActionButton onClick={() => openEditProductModal(product)} variant="secondary" size="sm" icon={<PencilIcon className="w-3 h-3"/>} />
                                <ActionButton onClick={() => handleDeleteProduct(product.id)} variant="danger" size="sm" icon={<TrashIcon className="w-3 h-3"/>} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={isEditingProduct ? 'Modifier Produit' : 'Ajouter Produit'}>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label>Nom</label><input type="text" name="name" value={currentProduct.name} onChange={handleProductInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/></div>
                        <div><label>Marque</label><input type="text" name="brand" value={currentProduct.brand || ''} onChange={handleProductInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/></div>
                    </div>
                    <div><label>Type</label><select name="type" value={currentProduct.type} onChange={handleProductInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"><option value="gel">Gel</option><option value="bar">Barre</option><option value="drink">Boisson</option></select></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label>Glucose (g)</label><input type="number" name="glucose" value={currentProduct.glucose ?? ''} onChange={handleProductInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/></div>
                        <div><label>Fructose (g)</label><input type="number" name="fructose" value={currentProduct.fructose ?? ''} onChange={handleProductInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/></div>
                        <div><label>Caféine (mg)</label><input type="number" name="caffeine" value={currentProduct.caffeine ?? ''} onChange={handleProductInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/></div>
                        <div><label>Sodium (mg)</label><input type="number" name="sodium" value={currentProduct.sodium ?? ''} onChange={handleProductInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/></div>
                    </div>
                    <div><label>Notes</label><textarea name="notes" value={currentProduct.notes || ''} onChange={handleProductInputChange} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"/></div>
                    <div className="flex justify-end"><ActionButton type="submit">Sauvegarder</ActionButton></div>
                </form>
            </Modal>
        </div>
    );

    const formInputClasses = "mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm";
    const formLabelClasses = "block text-sm font-medium text-gray-700";

    const renderPlanningTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
                <h4 className="text-lg font-semibold text-gray-700">Générateur de Plan</h4>
                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 space-y-4">
                    <div>
                        <label className={formLabelClasses}>Coureur</label>
                        <select value={selectedRiderId} onChange={e => setSelectedRiderId(e.target.value)} className={formInputClasses}>
                            <option value="">-- Sélectionner --</option>
                            {riders.map(r => <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={formLabelClasses}>Objectif</label>
                        <select value={objectiveCode} onChange={e => setObjectiveCode(e.target.value as ObjectiveCode)} className={formInputClasses}>
                            <option value="bleu">Bleu (&lt;60g/h)</option>
                            <option value="vert">Vert (60-90g/h)</option>
                            <option value="orange">Orange (&gt;90g/h)</option>
                        </select>
                    </div>
                    <div>
                        <label className={formLabelClasses}>Durée de la course (heures)</label>
                        <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min="1" className={formInputClasses}/>
                    </div>
                    <div>
                        <label className={formLabelClasses}>Hydratation (ml/h)</label>
                        <input type="number" value={hydrationTarget} onChange={e => setHydrationTarget(Number(e.target.value))} step="50" className={formInputClasses}/>
                    </div>
                    <div>
                        <label className={formLabelClasses}>Sodium (mg/h)</label>
                        <input type="number" value={sodiumTarget} onChange={e => setSodiumTarget(Number(e.target.value))} step="50" className={formInputClasses}/>
                    </div>
                    <ActionButton onClick={handleGeneratePlan} disabled={!selectedRiderId} className="w-full">
                        Générer le Plan
                    </ActionButton>
                </div>
            </div>
            <div className="lg:col-span-2">
                <h4 className="text-lg font-semibold text-gray-700">Plan Nutritionnel Suggéré</h4>
                {generatedPlan ? (
                    <div className="bg-gray-50 p-3 rounded-md border mt-2 space-y-4">
                        <div>
                            <h5 className="font-semibold">Plan Horaire</h5>
                            <ul>{generatedPlan.hourly.map((item, i) => <li key={i}>- {item.quantity}x {item.product.name}</li>)}</ul>
                        </div>
                        <div>
                            <h5 className="font-semibold">Total pour la course</h5>
                            <ul>{generatedPlan.total.map((item, i) => <li key={i}>- {item.quantity}x {item.product.name}</li>)}</ul>
                        </div>
                        <div>
                            <h5 className="font-semibold">Résumé des Apports Totaux</h5>
                            <p>Glucides: {generatedPlan.summary.carbs.toFixed(0)}g | Sodium: {generatedPlan.summary.sodium.toFixed(0)}mg | Hydratation: {generatedPlan.summary.hydration}ml | Caféine: {generatedPlan.summary.caffeine.toFixed(0)}mg</p>
                        </div>
                        <ActionButton onClick={handleSavePlanToNotes} variant="secondary">Sauvegarder dans les notes du coureur</ActionButton>
                    </div>
                ) : (
                    <p className="italic text-gray-500 mt-2">Remplissez le formulaire et générez un plan.</p>
                )}
            </div>
        </div>
    );

    const renderPowerAnalysisTab = () => (
      <div className="text-gray-700">
          <div className="mb-4 p-3 bg-gray-100 rounded-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Affichage Profil</label>
                  <select value={powerProfileDisplayMode} onChange={e => setPowerProfileDisplayMode(e.target.value as any)} className="w-full text-xs py-1.5 border-gray-300 bg-white rounded-md">
                      <option value="all">Tous</option>
                      <option value="fresh">Frais</option>
                      <option value="kj15">15 kJ/kg</option>
                      <option value="kj30">30 kJ/kg</option>
                      <option value="kj45">45 kJ/kg</option>
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Référentiel</label>
                  <select value={genderReference} onChange={e => setGenderReference(e.target.value as any)} className="w-full text-xs py-1.5 border-gray-300 bg-white rounded-md">
                      <option value="women">Femmes</option>
                      <option value="men">Hommes</option>
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unité</label>
                  <select value={analysisDisplayUnit} onChange={e => setAnalysisDisplayUnit(e.target.value as any)} className="w-full text-xs py-1.5 border-gray-300 bg-white rounded-md">
                      <option value="W/kg">W/kg</option>
                      <option value="W">Watts</option>
                  </select>
              </div>
               <div className="flex items-center self-end pb-1">
                  <input type="checkbox" id="includeScouting" checked={includeScouting} onChange={e => setIncludeScouting(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                  <label htmlFor="includeScouting" className="ml-2 text-sm text-gray-700">Inclure Scouting</label>
              </div>
          </div>
           <div className="overflow-x-auto relative shadow-md rounded-lg max-h-[70vh]">
              <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                      <tr>
                          <th className="px-3 py-2 cursor-pointer sticky left-0 z-20 bg-gray-50 hover:bg-gray-100" onClick={() => requestSort('riderName')}>Coureur {getSortIndicator('riderName')}</th>
                          <th className="px-3 py-2 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('profile')}>Profil {getSortIndicator('profile')}</th>
                          {powerDurationsConfig.map(pdc => (
                              <th key={pdc.key} className="px-3 py-2 cursor-pointer text-right hover:bg-gray-100" onClick={() => requestSort(pdc.key)}>
                                  {pdc.label} {getSortIndicator(pdc.key)}
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                      {powerProfileTableRows.length === 0 ? (
                          <tr><td colSpan={powerDurationsConfig.length + 2} className="text-center py-4 text-gray-500">Aucun profil de puissance à afficher.</td></tr>
                      ) : (
                          powerProfileTableRows.map(({ rider, profileKey, isFirstProfileRowForRider, numProfilesForRider }, rowIndex) => {
                            const profileData = rider[profileKey];
                            const profileLabel = profileKey === 'powerProfileFresh' ? 'Frais' : profileKey.replace('powerProfile', '').toUpperCase();
                            return (
                                <tr key={`${rider.id}-${profileKey}`} className="hover:bg-gray-100">
                                  {isFirstProfileRowForRider && (
                                      <td className="px-3 py-2 font-medium text-gray-900 sticky left-0 z-10 whitespace-nowrap bg-white hover:bg-gray-100" rowSpan={numProfilesForRider}>
                                          {rider.firstName} {rider.lastName}
                                          {rider.isScout && <span className="text-xs text-purple-600 ml-1">(S)</span>}
                                      </td>
                                  )}
                                  <td className="px-3 py-2">{profileLabel}</td>
                                  {powerDurationsConfig.map(pdc => {
                                      const powerValue = profileData?.[pdc.key];
                                      const wkgValue = (powerValue && rider.weightKg) ? powerValue / rider.weightKg : undefined;
                                      const displayValue = analysisDisplayUnit === 'W/kg' ? wkgValue : powerValue;
                                      const category = wkgValue && rider.sex ? getPowerCategory(wkgValue, pdc.key, rider.sex === Sex.MALE ? 'men' : 'women') : 'N/A';
                                      const colorClass = category ? COGGAN_CATEGORY_COLORS[category] : '';

                                      return (
                                          <td key={pdc.key} className={`px-3 py-2 text-right font-semibold ${colorClass}`} title={`Catégorie: ${category}`}>
                                              {displayValue !== undefined ? (analysisDisplayUnit === 'W/kg' ? displayValue.toFixed(1) : displayValue.toFixed(0)) : '-'}
                                          </td>
                                      );
                                  })}
                                </tr>
                            )
                        })
                      )}
                  </tbody>
              </table>
          </div>
      </div>
  );

  return (
    <SectionWrapper
      title="Pôle Performance"
      actionButton={
        activeAdminTab === 'nutritionProducts' && showGlobalTab && (
          <ActionButton onClick={openAddProductModal} icon={<PlusCircleIcon className="w-5 h-5" />}>
            Ajouter Produit
          </ActionButton>
        )
      }
    >
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
            <button onClick={() => setActiveAdminTab('global')} className={tabButtonStyle('global')}>Pilotage Global</button>
            <button onClick={() => setActiveAdminTab('powerAnalysis')} className={tabButtonStyle('powerAnalysis')}>Analyse de Puissance</button>
            <button onClick={() => setActiveAdminTab('nutritionProducts')} className={tabButtonStyle('nutritionProducts')}>Produits Nutritionnels</button>
            <button onClick={() => setActiveAdminTab('planning')} className={tabButtonStyle('planning')}>Planification Nutritionnelle</button>
        </nav>
      </div>
      <div className="bg-white p-4 rounded-b-lg">
            {activeAdminTab === 'global' && renderGlobalTab()}
            {activeAdminTab === 'powerAnalysis' && renderPowerAnalysisTab()}
            {activeAdminTab === 'nutritionProducts' && renderNutritionProductsTab()}
            {activeAdminTab === 'planning' && renderPlanningTab()}
      </div>
    </SectionWrapper>
  );
};
