// --- Enums ---

export enum TeamLevel {
    FEDERATION = "Fédération",
    JEUNES = "Club Formateur Jeunes",
    HORS_DN = "Hors DN (Club/Comité)",
    N1_N3 = "Équipe Nationale/N1-N3",
    PRO = "Équipe Professionnelle",
}

export enum Sex {
    MALE = "Homme",
    FEMALE = "Femme",
}

export enum StaffRole {
  MANAGER = "Manager",
  DS = "Directeur Sportif",
  ASSISTANT = "Assistant(e)",
  MECANO = "Mécanicien",
  COMMUNICATION = "Communication",
  MEDECIN = "Médecin",
  KINE = "Kinésithérapeute",
  RESP_PERF = "Responsable Performance",
  ENTRAINEUR = "Entraîneur",
  DATA_ANALYST = "Data Analyste",
  PREPA_PHYSIQUE = "Préparateur Physique",
  AUTRE = "Autre",
}

export enum ChecklistRole {
  DS = "Directeur Sportif",
  ASSISTANT = "Assistant",
  MECANO = "Mécano",
  MANAGER = "Manager",
  COMMUNICATION = "Communication",
  COUREUR = "Coureur",
}

export enum StaffStatus { 
  BENEVOLE = "Bénévole",
  VACATAIRE = "Vacataire",
  SALARIE = "Salarié(e)",
}

export enum ContractType {
  CDI = "CDI (Contrat à Durée Indéterminée)",
  CDD = "CDD (Contrat à Durée Déterminée)",
}

export enum AvailabilityStatus {
  DISPONIBLE = "Disponible",
  NON_DISPONIBLE = "Non Disponible",
  PARTIEL = "Partiellement Disponible",
}

export enum TransportDirection {
  ALLER = "Aller",
  RETOUR = "Retour",
  JOUR_J = "Transport Jour J",
}

export enum TransportMode {
  VOL = "Vol",
  MINIBUS = "Minibus",
  VOITURE_PERSO = "Voiture Personnelle",
  TRAIN = "Train",
  AUTRE = "Autre",
}

export enum AccommodationStatus {
  A_RESERVER = "À Réserver",
  RESERVE = "Réservé",
  PAYE = "Payé",
  CONFIRME = "Confirmé",
}

export enum MealDay {
  VENDREDI = "Vendredi",
  SAMEDI = "Samedi",
  DIMANCHE = "Dimanche",
  LUNDI = "Lundi",
  MARDI = "Mardi",
  MERCREDI = "Mercredi",
  JEUDI = "Jeudi",
  AUTRE = "Autre Jour",
}

export enum DocumentStatus {
  EN_ATTENTE = "En attente",
  FAIT = "Fait",
  EN_COURS = "En cours",
}

export enum BudgetItemCategory {
  TRANSPORT = "Transport",
  HEBERGEMENT = "Hébergement",
  REPAS = "Repas",
  VOITURE_EQUIPE = "Voiture Équipe",
  FRAIS_COURSE = "Frais de Course",
  MATERIEL = "Matériel",
  POLE_PERFORMANCE = "Pôle Performance",
  SALAIRES = "Salaires & Staff",
  FRAIS_DIVERS = "Frais Divers",
}

export enum ChecklistItemStatus {
  A_FAIRE = "À Faire",
  EN_COURS = "En Cours",
  FAIT = "Fait",
}

export enum EventType {
    COMPETITION = "Compétition",
    STAGE = "Stage",
}

export enum RiderEventStatus {
  TITULAIRE = "Titulaire",
  REMPLACANT = "Remplaçant(e)",
  PRE_SELECTION = "Pré-sélectionné(e)",
  NON_RETENU = "Non Retenu(e)",
  INDISPONIBLE = "Indisponible",
  ABSENT = "Absent(e)",
  EN_ATTENTE = "En Attente",
  NE_PAS_ENGAGER = "Ne Pas Engager",
  INFO = "Info",
}

export enum FormeStatus {
  EXCELLENT = "Excellent",
  BON = "Bon",
  MOYEN = "Moyen",
  PASSABLE = "Passable",
  FATIGUE = "Fatigué(e)",
  INCONNU = "?",
}

export enum MoralStatus {
  ELEVEE = "Élevé",
  BON = "Bon",
  NEUTRE = "Neutre",
  BAS = "Bas",
  INCONNU = "?",
}

export enum HealthCondition {
  PRET_A_COURIR = "Prêt(e) à courir",
  REPOS_PRECAUTION = "Repos précaution",
  BLESSURE_LEGERE = "Blessure légère",
  BLESSURE_MODEREE = "Blessure modérée",
  BLESSURE_SERIEUSE = "Blessure sérieuse",
  MALADE = "Malade",
  EN_RECUPERATION = "En récupération",
  INDISPONIBLE_AUTRE = "Indisponible (autre)",
  INCONNU = "-",
}

export enum RiderQualitativeProfile {
  GRIMPEUR = "Grimpeur",
  SPRINTEUR = "Sprinteur",
  ROULEUR = "Rouleur",
  PUNCHEUR = "Puncheur",
  COMPLET = "Complet",
  CLASSIQUE = "Flahute/Classique",
  BAROUDEUR_PROFIL = "Baroudeur",
  AUTRE = "Autre",
}

export enum VehicleType {
  VOITURE = "Voiture",
  MINIBUS = "Minibus",
  CAMION = "Camion",
  MOTO = "Moto",
  UTILITAIRE = "Utilitaire Léger",
  BUS = "Bus",
  AUTRE = "Autre",
}

export enum ClothingType {
  CUISSARD = "Cuissard",
  MAILLOT = "Maillot",
  CASQUE = "Casque",
  LUNETTES = "Lunettes",
  CHAUSSURES = "Chaussures",
  GANTS = "Gants",
  CHAUSSETTES = "Chaussettes",
  VESTE = "Veste",
  SURVETEMENT = "Survêtement",
  POLO = "Polo",
  TSHIRT = "T-Shirt",
  AUTRE = "Autre",
}

export enum EquipmentType {
  VELO_ROUTE = "Vélo de Route",
  VELO_CLM = "Vélo de CLM",
  ROUES_AVANT = "Roue Avant",
  ROUES_ARRIERE = "Roue Arrière",
  PAIRE_ROUES = "Paire de Roues",
  CADRE = "Cadre",
  CAPTEUR_PUISSANCE = "Capteur de Puissance",
  COMPTEUR_GPS = "Compteur GPS",
  HOME_TRAINER = "Home Trainer",
  CASQUE = "Casque",
  TEXTILE = "Textile",
  CHAUSSURES = "Chaussures",
  AUTRE = "Autre Matériel",
}

export enum EquipmentStatus {
  DISPONIBLE = "Disponible",
  EN_MAINTENANCE = "En Maintenance",
  ASSIGNE = "Assigné",
  HORS_SERVICE = "Hors Service",
  ARCHIVE = "Archivé",
}

export enum PredefinedAllergen {
  LAIT = "LAIT",
  OEUFS = "OEUFS",
  ARACHIDE = "ARACHIDE",
  FRUITS_A_COQUE = "FRUITS_A_COQUE",
  SOJA = "SOJA",
  BLE_ALLERGIE = "BLE_ALLERGIE",
  POISSON = "POISSON",
  CRUSTACES = "CRUSTACES",
  GLUTEN_CELIAC = "GLUTEN_CELIAC",
  SESAME = "SESAME",
  CELERI = "CELERI",
  MOUTARDE = "MOUTARDE",
  LUPIN = "LUPIN",
  MOLLUSQUES = "MOLLUSQUES",
  SULFITES = "SULFITES"
}

export enum DisciplinePracticed {
    ROUTE = "Route",
    PISTE = "Piste",
    CYCLO_CROSS = "Cyclo-cross",
    VTT = "VTT", 
    AUTRE = "Autre",
}

export enum IncomeCategory {
    SPONSORING = "Sponsoring",
    SUBVENTIONS = "Subventions",
    MECENAT = "Mécénat",
    DONS = "Dons",
    ACTIVITES_COMMERCIALES = "Activités Commerciales",
    AUTRE = "Autre",
}

export enum AllergySeverity {
    FAIBLE = "Faible",
    MODEREE = "Modérée",
    SEVERE = "Sévère",
}

export enum ScoutingStatus {
    TO_WATCH = "À Surveiller",
    CONTACTED = "Contacté",
    IN_DISCUSSION = "En Discussion",
    REJECTED = "Refusé",
    SIGNED = "Signé",
    AWAITING_APPROVAL = "En attente d'approbation",
    DATA_SHARED = "Données partagées"
}

export enum Discipline {
    ROUTE = "Route",
    PISTE = "Piste",
    CYCLO_CROSS = "Cyclo-cross",
    VTT = "VTT",
    TOUS = "Tous",
}

export enum UserRole {
    MANAGER = "Manager",
    STAFF = "Staff",
    COUREUR = "Coureur",
    INVITE = "Invité",
}

export enum TeamMembershipStatus {
    ACTIVE = "Actif",
    INACTIVE = "Inactif",
    PENDING = "En Attente",
}

export enum MissionStatus {
    OPEN = "Ouvert",
    CLOSED = "Fermé",
    FILLED = "Pourvu",
    ARCHIVED = "Archivé",
}

export enum MissionCompensationType {
    VOLUNTEER = "Bénévolat",
    FREELANCE = "Vacataire (Facture)",
    FIXED_AMOUNT = "Montant Fixe",
}

export enum LanguageProficiency {
    BASIC = 'Basique',
    INTERMEDIATE = 'Intermédiaire',
    ADVANCED = 'Avancé',
    FLUENT = 'Courant',
    NATIVE = 'Natif',
}


// --- Type Aliases ---
export type AppSection = 
  | 'dashboard' | 'events' | 'roster' | 'staff' | 'vehicles' | 'equipment'
  | 'stocks'
  | 'financial' | 'performance' | 'scouting' | 'settings' | 'eventDetail'
  | 'userManagement' | 'permissions' | 'checklist'
  | 'career' | 'nutrition' | 'riderEquipment' | 'adminDossier' | 'myTrips' | 'myPerformance' | 'performanceProject' | 'automatedPerformanceProfile'
  | 'missionSearch';

export type PermissionLevel = 'view' | 'edit';
export type StaffRoleKey =
  | 'managerId'
  | 'directeurSportifId'
  | 'assistantId'
  | 'mecanoId'
  | 'kineId'
  | 'medecinId'
  | 'respPerfId'
  | 'entraineurId'
  | 'dataAnalystId'
  | 'prepaPhysiqueId'
  | 'communicationId';
export type PowerZoneKey = 'z1' | 'z2' | 'z3' | 'z4' | 'z5' | 'z6' | 'z7';

// --- Interfaces ---

export interface Address {
    streetName?: string;
    postalCode?: string;
    city?: string;
    region?: string;
    country?: string;
}

export interface MaintenanceRecord {
    id: string;
    date: string;
    description: string;
    cost?: number;
    mileage?: number;
    garage?: string;
}

export interface Vehicle {
    id: string;
    name: string;
    licensePlate: string;
    driverId?: string;
    notes?: string;
    vehicleType: VehicleType;
    seats?: number;
    estimatedDailyCost?: number;
    purchaseDate?: string;
    nextMaintenanceDate?: string;
    maintenanceNotes?: string;
    maintenanceHistory: MaintenanceRecord[];
}

export interface PeripheralComponent {
    id: string;
    name: string;
    type: string;
    brand?: string;
    model?: string;
    notes?: string;
}

export interface EquipmentItem {
    id: string;
    name: string;
    type: EquipmentType;
    status: EquipmentStatus;
    assignedToRiderId?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    lastMaintenanceDate?: string;
    notes?: string;
    photoUrl?: string;
    size?: string;
    components?: PeripheralComponent[];
}

export interface StockItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    lowStockThreshold: number;
    category: StockCategory;
    notes?: string;
}

export enum StockCategory {
    BOISSONS = "Boissons",
    NUTRITION_SOLIDE = "Nutrition Solide",
    COMPLEMENTS = "Compléments",
    PREMIERS_SOINS = "Premiers Soins",
    RECUPERATION = "Récupération",
    HYGIENE = "Hygiène",
    DIVERS = "Divers",
}

export interface ClothingItem {
    id: string;
    type: ClothingType;
    quantity: number;
    brand?: string;
    reference?: string;
    size?: string;
    unitCost?: number;
    notes?: string;
}

export interface EquipmentStockItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    lowStockThreshold: number;
    category: EquipmentStockCategory;
    reference?: string;
    brand?: string;
    notes?: string;
}
export enum EquipmentStockCategory {
    CONSOMMABLES = "Consommables", // pneu, chaîne, guidoline
    PIECES = "Pièces détachées", // dérailleur, cintre
    OUTILLAGE = "Outillage",
    NETTOYAGE = "Nettoyage",
    DIVERS = "Divers",
}

export interface OperationalTiming {
    id: string;
    time: string;
    description: string;
    isAutoGenerated?: boolean;
    isOverridden?: boolean;
    category: OperationalTimingCategory;
    personId?: string; // For massage, the rider being massaged
    masseurId?: string; // For massage, the staff member doing it
    order?: number; // Order for massages
}

export enum OperationalTimingCategory {
    TRANSPORT = 'Transport',
    COURSE = 'Course',
    REPAS = 'Repas',
    MASSAGE = 'Massage',
    DIVERS = 'Divers'
}

export interface OperationalLogisticsDay {
    id: string;
    dayName: MealDay;
    keyTimings: OperationalTiming[];
}

export interface RaceInformation {
    permanenceAddress: string;
    permanenceTime: string;
    permanenceDate: string;
    reunionDSTime: string;
    reunionDSDate?: string;
    presentationTime: string;
    departFictifTime: string;
    departReelTime: string;
    arriveePrevueTime: string;
    distanceKm: number;
    radioFrequency: string;
}

export interface EligibleCategory {
    id: string;
    label: string;
}

export interface RaceEvent {
    id: string;
    name: string;
    date: string;
    endDate?: string;
    location: string;
    eventType: EventType;
    eligibleCategory: string;
    discipline: Discipline;
    raceInfo: RaceInformation;
    operationalLogistics: OperationalLogisticsDay[];
    selectedRiderIds: string[];
    selectedStaffIds: string[];
    selectedVehicleIds: string[];
    checklistEmailSimulated: boolean;
    isLogisticsValidated?: boolean;
    logisticsValidationDate?: string;
    logisticsSummaryNotes?: string;

    // Staff roles
    managerId?: string[];
    directeurSportifId?: string[];
    assistantId?: string[];
    mecanoId?: string[];
    kineId?: string[];
    medecinId?: string[];
    respPerfId?: string[];
    entraineurId?: string[];
    dataAnalystId?: string[];
    prepaPhysiqueId?: string[];
    communicationId?: string[];
}

export interface WorkExperience {
    id: string;
    position: string;
    company: string;
    startDate?: string;
    endDate?: string;
    description?: string;
}

export interface EducationOrCertification {
    id: string;
    degree: string;
    institution: string;
    year?: number;
}
export interface SpokenLanguage {
    id: string;
    language: string;
    proficiency: LanguageProficiency;
}

export interface WeeklyAvailability {
    [day: string]: {
        morning: boolean;
        afternoon: boolean;
        evening: boolean;
    }
}
export interface AvailabilityPeriod {
    id: string;
    startDate: string;
    endDate: string;
    status: AvailabilityStatus;
    notes?: string;
}

export interface StaffMember {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: StaffRole;
    customRole?: string;
    status: StaffStatus;
    openToExternalMissions?: boolean;
    skills: string[];
    professionalSummary?: string;
    address?: Address;
    weeklyAvailability?: WeeklyAvailability;
    availability?: AvailabilityPeriod[];
    workHistory?: WorkExperience[];
    education?: EducationOrCertification[];
    languages?: SpokenLanguage[];
    sportswear?: any[];
    notesGeneral?: string;
    dailyRate?: number;
    salary?: number;
    contractType?: ContractType;
    contractEndDate?: string;
    birthDate?: string;
    nationality?: string;
    photoUrl?: string;
    uciId?: string;
    licenseNumber?: string;
    licenseImageBase64?: string;
    licenseImageMimeType?: string;
}
export interface TransportStop {
    id: string;
    location: string;
    date: string;
    time: string;
    stopType: 'pickup' | 'dropoff' | 'waypoint';
    persons: { id: string, type: 'rider' | 'staff' }[];
    notes?: string;
}

export interface EventTransportLeg {
  id: string;
  eventId: string;
  direction: TransportDirection;
  mode: TransportMode;
  departureDate?: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  departureLocation?: string;
  arrivalLocation?: string;
  details?: string;
  personName?: string; // Legacy/simple mode
  isAuroreFlight?: boolean;
  occupants: { id: string; type: 'rider' | 'staff' }[];
  assignedVehicleId?: string;
  driverId?: string;
  intermediateStops?: TransportStop[];
}

export interface EventAccommodation {
  id: string;
  eventId: string;
  hotelName: string;
  address: string;
  reservationConfirmed: boolean;
  status: AccommodationStatus;
  confirmationDetails: string;
  numberOfNights: number;
  numberOfPeople?: number;
  estimatedCost?: number;
  distanceFromStartKm?: number;
  travelTimeToStart?: string;
  isStopover?: boolean;
}

export interface EventRaceDocument {
  id: string;
  eventId: string;
  name: string;
  status: DocumentStatus;
  fileLinkOrPath: string;
  notes?: string;
}

export interface EventRadioEquipment {
  id: string;
  eventId: string;
  hasEquipment: boolean;
  details: string;
  channelFrequency?: string;
}

export interface EventRadioAssignment {
  id: string;
  eventId: string;
  assignedTo: string;
  radioIdOrNotes: string;
}

export interface EventBudgetItem {
  id: string;
  eventId: string;
  category: BudgetItemCategory;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  notes?: string;
  isAutoGenerated?: boolean;
  sourceVehicleId?: string;
  sourceStaffId?: string;
  proofDocumentId?: string;
}

export interface EventChecklistItem {
  id: string;
  eventId: string;
  itemName: string;
  responsiblePerson?: string;
  assignedRole?: ChecklistRole;
  status: ChecklistItemStatus;
  notes?: string;
}

export interface PeerRating {
    id: string;
    eventId: string;
    raterRiderId: string;
    ratedRiderId: string;
    rating: number; // e.g., 1 to 5
}

export interface RiderRating {
    riderId: string;
    classification?: string;
    didNotStart?: boolean;
    didNotFinish?: boolean;
    crashed?: boolean;
    dsFeedback?: string;
    collectiveScore?: number;
    technicalScore?: number;
    physicalScore?: number;
}

export interface StaffRating {
    staffId: string;
    rating: number; // 1-5
    comment?: string;
    eventId: string;
}

export interface PerformanceEntry {
  id: string;
  eventId: string;
  generalObjectives: string;
  resultsSummary: string;
  keyLearnings: string;
  raceOverallRanking?: string;
  teamRiderRankings?: string;
  dsGeneralFeedback?: string;
  riderRatings?: RiderRating[];
  staffRatings?: StaffRating[];
}

export interface IncomeItem {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: IncomeCategory;
    notes?: string;
    sponsorshipContactName?: string;
    sponsorshipContactEmail?: string;
    sponsorshipContactPhone?: string;
    sponsorshipContractStart?: string;
    sponsorshipContractEnd?: string;
}

export interface RiderEventSelection {
  id: string;
  eventId: string;
  riderId: string;
  status: RiderEventStatus;
  notes?: string;
}

export interface EventStaffAvailability {
  id: string;
  eventId: string;
  staffId: string;
  availability: AvailabilityStatus;
  notes?: string;
}

export interface ChecklistTemplate {
    id: string;
    name: string;
}

export interface TeamProduct {
    id: string;
    name: string;
    type: 'gel' | 'bar' | 'drink';
    brand?: string;
    carbs?: number; // Total carbs, auto-calculated
    glucose?: number;
    fructose?: number;
    caffeine?: number; // in mg
    sodium?: number; // in mg
    notes?: string;
}

export interface PowerProfile {
    power1s?: number;
    power5s?: number;
    power30s?: number;
    power1min?: number;
    power3min?: number;
    power5min?: number;
    power12min?: number;
    power20min?: number;
    criticalPower?: number; // FTP
    power45min?: number;
}

export interface ResultItem {
  id: string;
  date: string;
  eventName: string;
  category: string;
  rank: string | number;
  team?: string;
  discipline?: DisciplinePracticed;
}

export interface FavoriteRace {
  id: string;
  name: string;
  notes: string;
}

export interface PerformanceFactorDetail {
    forces: string;
    aOptimiser: string;
    aDevelopper: string;
    besoinsActions: string;
}

export interface AllergyItem {
    id: string;
    allergenKey: PredefinedAllergen | 'CUSTOM';
    customAllergenName?: string;
    severity: AllergySeverity;
    regimeDetails: string;
    isCeliacDisease: boolean;
    notes?: string;
}
export interface SelectedProduct {
    productId: string;
    quantity: number;
}
export interface PerformanceNutrition {
    carbsPerHourTarget?: number;
    hydrationNotes?: string;
    selectedGels?: SelectedProduct[];
    selectedBars?: SelectedProduct[];
    selectedDrinks?: SelectedProduct[];
    customProducts?: TeamProduct[];
}

export interface BikeFitMeasurements {
  hauteurSelle?: string;
  reculSelle?: string;
  longueurBecSelleAxeCintre?: string;
  hauteurGuidonAxeRoueCentreCintre?: string;
}

export interface BikeSpecificMeasurements {
  tailleCadre?: string;
  cintre?: string;
  potence?: string;
  plateau?: string;
  manivelle?: string;
  capteurPuissance?: string;
}

export interface BikeSetup {
    specifics: BikeSpecificMeasurements;
    cotes: BikeFitMeasurements;
}

export interface PprData {
    fresh: PowerProfile;
    kj15: PowerProfile;
    kj30: PowerProfile;
    kj45: PowerProfile;
}

export interface Rider {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    sex?: Sex;
    nationality?: string;
    address?: Address;
    heightCm?: number;
    weightKg?: number;
    uciId?: string;
    licenseNumber?: string;
    photoUrl?: string;
    licenseImageUrl?: string;
    licenseImageBase64?: string;
    licenseImageMimeType?: string;
    socialSecurityNumber?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    teamName?: string;
    isSearchable?: boolean; // For talent search
    salary?: number;
    contractEndDate?: string;
    nextSeasonTeam?: string;

    // Performance Profile
    qualitativeProfile: RiderQualitativeProfile;
    disciplines: DisciplinePracticed[];
    categories: string[];
    forme: FormeStatus;
    moral: MoralStatus;
    healthCondition: HealthCondition;

    // Career
    favoriteRaces: FavoriteRace[];
    resultsHistory: ResultItem[];
    agency?: { name?: string; agentName?: string; agentPhone?: string; agentEmail?: string; };

    // Performance Project
    performanceGoals: string;
    physiquePerformanceProject: PerformanceFactorDetail;
    techniquePerformanceProject: PerformanceFactorDetail;
    mentalPerformanceProject: PerformanceFactorDetail;
    environnementPerformanceProject: PerformanceFactorDetail;
    tactiquePerformanceProject: PerformanceFactorDetail;

    // Nutrition
    dietaryRegimen?: string; // e.g., vegetarian
    foodPreferences?: string; // likes/dislikes
    allergies: AllergyItem[];
    performanceNutrition: PerformanceNutrition;

    // Bike & Equipment
    roadBikeSetup: BikeSetup;
    ttBikeSetup: BikeSetup;
    clothing: ClothingItem[];
    
    // Power Data
    powerProfileFresh?: PowerProfile;
    powerProfile15KJ?: PowerProfile;
    powerProfile30KJ?: PowerProfile;
    powerProfile45KJ?: PowerProfile;
    profilePRR?: string;
    profile15KJ?: string;
    profile30KJ?: string;
    profile45KJ?: string;
    
    // Auto-calculated fields
    charSprint: number;
    charAnaerobic: number;
    charPuncher: number;
    charClimbing: number;
    charRouleur: number;
    generalPerformanceScore: number;
    fatigueResistanceScore: number;
    
    // Admin
    healthInsurance?: { name?: string; policyNumber?: string; };
}

export interface ScoutingProfile {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  sex?: Sex;
  nationality?: string;
  heightCm?: number;
  weightKg?: number;
  email?: string;
  phone?: string;
  currentTeam?: string;
  uciId?: string;
  status: ScoutingStatus;
  potentialRating: number; // 1-5
  discipline: DisciplinePracticed;
  categories: string[];
  qualitativeProfile?: RiderQualitativeProfile;
  qualitativeNotes?: string;
  powerProfileFresh?: PowerProfile;
  powerProfile15KJ?: PowerProfile;
  powerProfile30KJ?: PowerProfile;
  powerProfile45KJ?: PowerProfile;
  allergies: AllergyItem[];
  charSprint?: number;
  charAnaerobic?: number;
  charPuncher?: number;
  charClimbing?: number;
  charRouleur?: number;
  generalPerformanceScore?: number;
  fatigueResistanceScore?: number;
}
export enum ScoutingRequestStatus {
    PENDING = "En attente",
    ACCEPTED = "Accepté",
    REJECTED = "Refusé",
}

export interface ScoutingRequest {
    id: string;
    requesterTeamId: string;
    athleteId: string;
    status: ScoutingRequestStatus;
    requestDate: string;
    responseDate?: string;
}


// --- AUTH & TEAM STRUCTURE ---
export enum TeamRole {
    ADMIN = 'Administrateur',
    EDITOR = 'Editeur',
    MEMBER = 'Membre',
    VIEWER = 'Athlète',
}

export type AppPermissions = Partial<Record<string, Partial<Record<AppSection, PermissionLevel[]>>>>;

export interface PermissionRole {
    id: string | TeamRole;
    name: string;
    isDeletable: boolean;
}

export interface SignupInfo {
  birthDate?: string;
  sex?: Sex;
  nationality?: string;
  heightCm?: number;
  weightKg?: number;
  phone?: string;
  allergies?: string;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    permissionRole: TeamRole;
    customPermissions?: Partial<Record<AppSection, PermissionLevel[]>>;
    userRole: UserRole;
    isSearchable?: boolean;
    openToExternalMissions?: boolean;
    signupInfo?: SignupInfo;
    qualitativeProfile?: RiderQualitativeProfile;
}

export interface Team {
    id: string;
    name: string;
    country: string;
    level: TeamLevel;
    address?: Address;
}

export interface TeamMembership {
    id?: string;
    userId: string;
    teamId: string;
    status: TeamMembershipStatus;
    userRole: UserRole;
    startDate?: string;
    endDate?: string;
}

export interface Mission {
    id: string;
    teamId: string;
    title: string;
    role: StaffRole;
    startDate: string;
    endDate: string;
    location: string;
    description: string;
    requirements: string[];
    compensationType: MissionCompensationType;
    compensation: string; // "Logement et repas pris en charge"
    dailyRate?: number; // 150
    status: MissionStatus;
    applicants?: string[]; // Array of user IDs
}

// --- APP STATE ---

export interface GlobalState {
    users: User[];
    teams: Team[];
    teamMemberships: TeamMembership[];
    permissions: AppPermissions;
    permissionRoles: PermissionRole[];
    scoutingRequests: ScoutingRequest[];
}

export interface TeamState {
    teamLevel?: TeamLevel;
    themePrimaryColor?: string;
    themeAccentColor?: string;
    language?: 'fr' | 'en';
    teamLogoUrl?: string;

    riders: Rider[];
    staff: StaffMember[];
    vehicles: Vehicle[];
    equipment: EquipmentItem[];
    raceEvents: RaceEvent[];
    eventTransportLegs: EventTransportLeg[];
    eventAccommodations: EventAccommodation[];
    eventDocuments: EventRaceDocument[];
    eventRadioEquipments: EventRadioEquipment[];
    eventRadioAssignments: EventRadioAssignment[];
    eventBudgetItems: EventBudgetItem[];
    eventChecklistItems: EventChecklistItem[];
    performanceEntries: PerformanceEntry[];
    riderEventSelections: RiderEventSelection[];
    eventStaffAvailabilities: EventStaffAvailability[];
    incomeItems: IncomeItem[];
    checklistTemplates: Record<ChecklistRole, ChecklistTemplate[]>;
    categoryBudgets: Partial<Record<BudgetItemCategory, number>>;
    scoutingProfiles: ScoutingProfile[];
    teamProducts: TeamProduct[];
    stockItems: StockItem[];
    equipmentStockItems: EquipmentStockItem[];
    peerRatings: PeerRating[];
    teamEventReviews: any[];
    debriefings: any[];
    dietaryPlans: any[];
    missions: Mission[];
}

export interface AppState extends GlobalState, TeamState {
    activeEventId: string | null;
    activeTeamId: string | null;
}