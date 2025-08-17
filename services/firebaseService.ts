import { db, storage } from '../firebaseConfig';
import { 
  TeamState, 
  GlobalState, 
  User, 
  Team, 
  TeamMembership, 
  AppPermissions,
  AppSection,
  PermissionLevel,
  TeamRole,
  UserRole,
  TeamMembershipStatus,
  TeamLevel,
  StaffMember,
  StaffRole,
  StaffStatus,
  Rider,
  RiderQualitativeProfile,
  FormeStatus,
  MoralStatus,
  HealthCondition,
} from '../types';
import { SignupData } from '../sections/SignupView';
import { TEAM_STATE_COLLECTIONS, SECTIONS } from '../constants';

// Helper function to remove undefined properties and complex objects before sending to Firebase.
const cleanDataForFirebase = (data: any): any => {
    if (data === null || typeof data !== 'object') {
        return data;
    }

    // Firestore handles Date objects and its own Timestamps.
    if (data instanceof Date || typeof data.toDate === 'function') {
        return data;
    }

    if (Array.isArray(data)) {
        // Recurse into array elements and filter out undefined results
        return data.map(item => cleanDataForFirebase(item)).filter(item => item !== undefined);
    }
    
    // Crucial check: only process plain JavaScript objects.
    // This prevents recursion into complex class instances (like Firestore DocumentSnapshots)
    // which causes circular reference errors.
    if (Object.prototype.toString.call(data) !== '[object Object]') {
        // For any other complex object type, return undefined so it gets stripped out during the save.
        return undefined;
    }

    const cleaned: { [key: string]: any } = {};
    for (const key of Object.keys(data)) {
        const value = data[key];
        // Firestore does not allow 'undefined' as a value.
        if (value !== undefined) {
            const cleanedValue = cleanDataForFirebase(value);
            // Only add the key if the cleaned value is not undefined.
            if (cleanedValue !== undefined) {
                cleaned[key] = cleanedValue;
            }
        }
    }
    return cleaned;
};


// --- FILE UPLOAD ---
export const uploadFile = async (base64: string, path: string, mimeType: string): Promise<string> => {
    const storageRef = storage.ref(path);
    const base64Data = base64.split(',')[1];
    const snapshot = await storageRef.putString(base64Data, 'base64', { contentType: mimeType });
    return snapshot.ref.getDownloadURL();
};

// --- AUTH & USER ---
export const getUserProfile = async (userId: string): Promise<User | null> => {
    const userDocRef = db.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();
    if (userDocSnap.exists) {
        return { id: userDocSnap.id, ...userDocSnap.data() } as User;
    }
    return null;
};

export const createUserProfile = async (uid: string, signupData: SignupData) => {
    try {
        const { email, firstName, lastName, userRole } = signupData;

        const newUser: Omit<User, 'id'> = {
            email,
            firstName,
            lastName,
            permissionRole: TeamRole.VIEWER, // Default permission, will be elevated if they create a team
            userRole: userRole || UserRole.COUREUR, // Use provided role or default
            isSearchable: false,
            openToExternalMissions: false,
            signupInfo: {},
        };
        
        const cleanedNewUser = cleanDataForFirebase(newUser);
        const userDocRef = db.collection('users').doc(uid);
        
        await userDocRef.set(cleanedNewUser);

    } catch (error) {
        console.error("FIRESTORE WRITE ERROR:", error);
        throw error;
    }
};

export const requestToJoinTeam = async (userId: string, teamId: string, userRole: UserRole) => {
    const membershipsColRef = db.collection('teamMemberships');
    await membershipsColRef.add({
        userId: userId,
        teamId: teamId,
        status: TeamMembershipStatus.PENDING,
        userRole: userRole,
    });
};

export const createTeamForUser = async (user: User, teamData: { name: string; level: TeamLevel; country: string; }) => {
    const batch = db.batch();

    // 1. Create the team
    const newTeamRef = db.collection('teams').doc(); // Generate a ref with a new ID
    batch.set(newTeamRef, teamData);
    
    // 2. Initialize team subcollections
    for (const collName of TEAM_STATE_COLLECTIONS) {
        const subCollRef = newTeamRef.collection(collName).doc('_init_');
        batch.set(subCollRef, { createdAt: new Date().toISOString() });
    }

    // 3. Make the creator an active admin member
    const membershipRef = db.collection('teamMemberships').doc(); // Generate a ref
    batch.set(membershipRef, {
        userId: user.id,
        teamId: newTeamRef.id,
        status: TeamMembershipStatus.ACTIVE,
        userRole: UserRole.MANAGER, // Creator is the manager
        startDate: new Date().toISOString().split('T')[0],
    });

    // 4. Update user's roles in the main users collection
    const userDocRef = db.collection('users').doc(user.id);
    batch.update(userDocRef, { 
        permissionRole: TeamRole.ADMIN,
        userRole: UserRole.MANAGER 
    });
    
    // 5. Create a StaffMember document for the user in the new team
    const newManagerProfile: Omit<StaffMember, 'id'> = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.signupInfo?.phone || '',
        birthDate: user.signupInfo?.birthDate,
        nationality: user.signupInfo?.nationality,
        role: StaffRole.MANAGER,
        status: StaffStatus.SALARIE, // A reasonable default for a founder
        openToExternalMissions: false,
        skills: [],
        professionalSummary: 'Fondateur de l\'équipe.',
        address: {},
        availability: [],
        workHistory: [],
        education: [],
        languages: []
    };
    const newStaffDocRef = db.collection('teams').doc(newTeamRef.id).collection('staff').doc(user.id); // Use user ID for consistency
    batch.set(newStaffDocRef, cleanDataForFirebase(newManagerProfile));

    // Commit all writes at once
    await batch.commit();
};

// --- GLOBAL DATA ---
export const getGlobalData = async (): Promise<Partial<GlobalState>> => {
    const usersSnap = await db.collection('users').get();
    const teamsSnap = await db.collection('teams').get();
    const membershipsSnap = await db.collection('teamMemberships').get();
    const permissionsSnap = await db.collection('permissions').get();
    const permissionRolesSnap = await db.collection('permissionRoles').get();
    
    const permissionsDoc = permissionsSnap.docs[0];

    return {
        users: usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User)),
        teams: teamsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Team)),
        teamMemberships: membershipsSnap.docs.map(d => ({ id: d.id, ...d.data() } as TeamMembership)),
        permissions: permissionsDoc ? (permissionsDoc.data() as AppPermissions) : {},
        permissionRoles: permissionRolesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any))
    };
};

export const getEffectivePermissions = (user: User, basePermissions: AppPermissions): Partial<Record<AppSection, PermissionLevel[]>> => {
    if (user.permissionRole === TeamRole.ADMIN) {
        const allPermissions: Partial<Record<AppSection, PermissionLevel[]>> = {};
        SECTIONS.forEach(section => {
            allPermissions[section.id as AppSection] = ['view', 'edit'];
        });
        return allPermissions;
    }

    const rolePerms = basePermissions[user.permissionRole] || {};
    const effectivePerms = structuredClone(rolePerms);
    
    if (user.customPermissions) {
        for (const sectionKey in user.customPermissions) {
            const section = sectionKey as AppSection;
            effectivePerms[section] = user.customPermissions[section];
        }
    }

    // --- FIX: Ensure Athletes (VIEWER role) can always see their space ---
    if (user.userRole === UserRole.COUREUR) {
        const athleteSections = SECTIONS
            .filter(s => s.group['fr'] === 'Mon Espace')
            .map(s => s.id as AppSection);

        athleteSections.forEach(sectionId => {
            const currentPerms = new Set(effectivePerms[sectionId] || []);
            currentPerms.add('view');
            effectivePerms[sectionId] = Array.from(currentPerms);
        });
    }
    
    return effectivePerms;
};

// --- TEAM DATA ---
export const getTeamData = async (teamId: string): Promise<Partial<TeamState>> => {
    const teamDocRef = db.collection('teams').doc(teamId);
    
    const teamState: Partial<TeamState> = {};
    const teamDocSnap = await teamDocRef.get();
    if(teamDocSnap.exists) {
        const teamData = teamDocSnap.data();
        if (teamData) {
            Object.assign(teamState, {
                teamLevel: teamData.level,
                themePrimaryColor: teamData.themePrimaryColor,
                themeAccentColor: teamData.themeAccentColor,
                language: teamData.language,
                teamLogoUrl: teamData.teamLogoUrl,
                categoryBudgets: teamData.categoryBudgets,
                checklistTemplates: teamData.checklistTemplates,
            });
        }
    }

    for (const coll of TEAM_STATE_COLLECTIONS) {
        const collRef = teamDocRef.collection(coll);
        const snapshot = await collRef.get();
        (teamState as any)[coll] = snapshot.docs
            .filter(d => d.id !== '_init_')
            .map(d => ({ id: d.id, ...d.data() }));
    }
    
    return teamState;
};

// --- DATA MODIFICATION ---
export const saveData = async <T extends { id?: string }>(teamId: string, collectionName: string, data: T): Promise<string> => {
    const { id, ...dataToSave } = data;
    const cleanedData = cleanDataForFirebase(dataToSave);
    const subCollectionRef = db.collection('teams').doc(teamId).collection(collectionName);
    
    if (id) {
        const docRef = subCollectionRef.doc(id);
        await docRef.set(cleanedData, { merge: true });
        return id;
    } else {
        const docRef = await subCollectionRef.add(cleanedData);
        return docRef.id;
    }
};

export const deleteData = async (teamId: string, collectionName: string, docId: string) => {
    const docRef = db.collection('teams').doc(teamId).collection(collectionName).doc(docId);
    await docRef.delete();
};

export const saveTeamSettings = async (teamId: string, settings: Partial<Team>) => {
    const teamDocRef = db.collection('teams').doc(teamId);
    await teamDocRef.set(settings, { merge: true });
};

// --- USER MANAGEMENT ---

const createRiderProfileFromUser = (user: User): Omit<Rider, 'id'> => ({
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.signupInfo?.phone,
  birthDate: user.signupInfo?.birthDate,
  sex: user.signupInfo?.sex,
  nationality: user.signupInfo?.nationality,
  heightCm: user.signupInfo?.heightCm,
  weightKg: user.signupInfo?.weightKg,
  qualitativeProfile: RiderQualitativeProfile.AUTRE,
  disciplines: [],
  categories: [],
  forme: FormeStatus.INCONNU,
  moral: MoralStatus.INCONNU,
  healthCondition: HealthCondition.INCONNU,
  favoriteRaces: [],
  resultsHistory: [],
  performanceGoals: '',
  physiquePerformanceProject: { forces: '', aOptimiser: '', aDevelopper: '', besoinsActions: '' },
  techniquePerformanceProject: { forces: '', aOptimiser: '', aDevelopper: '', besoinsActions: '' },
  mentalPerformanceProject: { forces: '', aOptimiser: '', aDevelopper: '', besoinsActions: '' },
  environnementPerformanceProject: { forces: '', aOptimiser: '', aDevelopper: '', besoinsActions: '' },
  tactiquePerformanceProject: { forces: '', aOptimiser: '', aDevelopper: '', besoinsActions: '' },
  allergies: [],
  performanceNutrition: {},
  roadBikeSetup: { specifics: {}, cotes: {} },
  ttBikeSetup: { specifics: {}, cotes: {} },
  clothing: [],
  charSprint: 0, charAnaerobic: 0, charPuncher: 0, charClimbing: 0, charRouleur: 0,
  generalPerformanceScore: 0, fatigueResistanceScore: 0
});

const createStaffProfileFromUser = (user: User): Omit<StaffMember, 'id'> => ({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.signupInfo?.phone || '',
    birthDate: user.signupInfo?.birthDate,
    nationality: user.signupInfo?.nationality,
    role: StaffRole.ASSISTANT, // Default role on approval
    status: StaffStatus.BENEVOLE, // Default status
    skills: [],
    address: {},
    availability: [],
    workHistory: [],
    education: [],
    languages: []
});

export const approveMembership = async (membershipId: string, teamId: string, userId: string, userRole: UserRole) => {
    const batch = db.batch();
    const membershipDocRef = db.collection('teamMemberships').doc(membershipId);
    batch.update(membershipDocRef, { status: TeamMembershipStatus.ACTIVE, startDate: new Date().toISOString().split('T')[0] });

    const userProfile = await getUserProfile(userId);
    if (userProfile) {
        if (userRole === UserRole.COUREUR) {
            const riderExistsQuery = await db.collection('teams').doc(teamId).collection('riders').where('email', '==', userProfile.email).limit(1).get();
            if (riderExistsQuery.empty) {
                const newRiderProfile = createRiderProfileFromUser(userProfile);
                const newRiderDocRef = db.collection('teams').doc(teamId).collection('riders').doc(userId);
                batch.set(newRiderDocRef, cleanDataForFirebase(newRiderProfile));
            }
        } else if (userRole === UserRole.STAFF || userRole === UserRole.MANAGER) {
            const staffExistsQuery = await db.collection('teams').doc(teamId).collection('staff').where('email', '==', userProfile.email).limit(1).get();
            if (staffExistsQuery.empty) {
                const newStaffProfile = createStaffProfileFromUser(userProfile);
                 if (userRole === UserRole.MANAGER) {
                    newStaffProfile.role = StaffRole.MANAGER;
                }
                const newStaffDocRef = db.collection('teams').doc(teamId).collection('staff').doc(userId);
                batch.set(newStaffDocRef, cleanDataForFirebase(newStaffProfile));
            }
        }
    }
    await batch.commit();
};

export const denyOrRemoveMembership = async (membershipId: string, userId: string, teamId: string, isRemoval: boolean) => {
    const membershipDocRef = db.collection('teamMemberships').doc(membershipId);
    await membershipDocRef.delete();

    if (isRemoval) {
        // Attempt to delete from both collections since we don't know the role for sure.
        // The .catch() prevents an error if the doc doesn't exist in one of them.
        await db.collection('teams').doc(teamId).collection('riders').doc(userId).delete().catch(() => {});
        await db.collection('teams').doc(teamId).collection('staff').doc(userId).delete().catch(() => {});
    }
};

export const updateUserPermissionRole = async (userId: string, newPermissionRole: TeamRole) => {
    await db.collection('users').doc(userId).update({ permissionRole: newPermissionRole });
};

export const updateUserTeamRole = async (membershipId: string, newUserRole: UserRole) => {
    await db.collection('teamMemberships').doc(membershipId).update({ userRole: newUserRole });
    // Note: This does not currently migrate user profile data between `riders` and `staff` collections.
};

export const updateUserCustomPermissions = async (userId: string, customPermissions: Partial<Record<AppSection, PermissionLevel[]>>) => {
    await db.collection('users').doc(userId).update({ customPermissions: cleanDataForFirebase(customPermissions) });
};