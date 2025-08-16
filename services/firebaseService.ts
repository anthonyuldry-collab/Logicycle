import { db, storage } from '../firebaseConfig';
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
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
} from '../types';
import { SignupData } from '../sections/SignupView';
import { SECTIONS, TEAM_STATE_COLLECTIONS } from '../constants';

// Helper function to remove undefined properties from an object recursively
const cleanDataForFirebase = (data: any): any => {
    if (typeof data !== 'object' || data === null) {
        return data;
    }

    // Firestore handles Date objects automatically, so we should not convert them to empty objects.
    if (data instanceof Date) {
        return data;
    }

    // Only recurse into plain arrays. For objects, we check if they are plain objects.
    if (Array.isArray(data)) {
        // Firestore doesn't allow `undefined` in arrays, so we filter them out.
        return data.filter(item => item !== undefined).map(item => cleanDataForFirebase(item));
    }
    
    // This check for plain objects avoids recursing into class instances (like Firebase internals)
    // which may contain circular references or methods not suitable for Firestore.
    if (data.constructor !== Object) {
        return data;
    }

    const cleaned: { [key: string]: any } = {};
    for (const key of Object.keys(data)) {
        const value = data[key];
        if (value !== undefined) {
            const cleanedValue = cleanDataForFirebase(value);
            cleaned[key] = cleanedValue;
        }
    }
    return cleaned;
};


// --- FILE UPLOAD ---
export const uploadFile = async (base64: string, path: string, mimeType: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const base64Data = base64.split(',')[1];
    const snapshot = await uploadString(storageRef, base64Data, 'base64', { contentType: mimeType });
    return getDownloadURL(snapshot.ref);
};

// --- AUTH & USER ---
export const getUserProfile = async (userId: string): Promise<User | null> => {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        return { id: userDocSnap.id, ...userDocSnap.data() } as User;
    }
    return null;
};

export const createUserProfile = async (uid: string, signupData: SignupData) => {
    try {
        const { email, firstName, lastName } = signupData;

        const newUser: Omit<User, 'id'> = {
            email,
            firstName,
            lastName,
            permissionRole: TeamRole.VIEWER,
            userRole: UserRole.COUREUR,
            isSearchable: false,
            openToExternalMissions: false,
            signupInfo: {},
        };
        
        const cleanedNewUser = cleanDataForFirebase(newUser);
        const userDocRef = doc(db, 'users', uid);
        
        await setDoc(userDocRef, cleanedNewUser);

    } catch (error) {
        console.error("FIRESTORE WRITE ERROR:", error);
        throw error;
    }
};

export const requestToJoinTeam = async (userId: string, teamId: string, userRole: UserRole) => {
    const membershipsColRef = collection(db, 'teamMemberships');
    await addDoc(membershipsColRef, {
        userId: userId,
        teamId: teamId,
        status: TeamMembershipStatus.PENDING,
        userRole: userRole,
    });
};

export const createTeamForUser = async (userId: string, teamData: { name: string; level: TeamLevel; country: string; }, userRole: UserRole) => {
    // Create the team
    const teamsColRef = collection(db, 'teams');
    const newTeamRef = await addDoc(teamsColRef, teamData);
    
    // Initialize team subcollections using a batch write
    const batch = writeBatch(db);
    for (const collName of TEAM_STATE_COLLECTIONS) {
        const subCollRef = doc(db, 'teams', newTeamRef.id, collName, '_init_');
        batch.set(subCollRef, { createdAt: new Date().toISOString() });
    }
    await batch.commit();

    // Make the creator an active admin
    const membershipsColRef = collection(db, 'teamMemberships');
    await addDoc(membershipsColRef, {
        userId: userId,
        teamId: newTeamRef.id,
        status: TeamMembershipStatus.ACTIVE,
        userRole: userRole,
        startDate: new Date().toISOString().split('T')[0],
    });

    // Update user permission role
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { permissionRole: TeamRole.ADMIN }, { merge: true });
};

// --- GLOBAL DATA ---
export const getGlobalData = async (): Promise<Partial<GlobalState>> => {
    const usersSnap = await getDocs(collection(db, 'users'));
    const teamsSnap = await getDocs(collection(db, 'teams'));
    const membershipsSnap = await getDocs(collection(db, 'teamMemberships'));
    const permissionsSnap = await getDocs(collection(db, 'permissions'));
    const permissionRolesSnap = await getDocs(collection(db, 'permissionRoles'));
    
    const permissionsDoc = permissionsSnap.docs[0];

    return {
        users: usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User)),
        teams: teamsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Team)),
        teamMemberships: membershipsSnap.docs.map(d => d.data() as TeamMembership),
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
    
    return effectivePerms;
};

// --- TEAM DATA ---
export const getTeamData = async (teamId: string): Promise<Partial<TeamState>> => {
    const teamDocRef = doc(db, 'teams', teamId);
    
    const teamState: Partial<TeamState> = {};
    const teamDocSnap = await getDoc(teamDocRef);
    if(teamDocSnap.exists()) {
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
        const collRef = collection(teamDocRef, coll);
        const snapshot = await getDocs(collRef);
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
    const subCollectionRef = collection(db, 'teams', teamId, collectionName);
    
    if (id) {
        const docRef = doc(subCollectionRef, id);
        await setDoc(docRef, cleanedData, { merge: true });
        return id;
    } else {
        const docRef = await addDoc(subCollectionRef, cleanedData);
        return docRef.id;
    }
};

export const deleteData = async (teamId: string, collectionName: string, docId: string) => {
    const docRef = doc(db, 'teams', teamId, collectionName, docId);
    await deleteDoc(docRef);
};

export const saveTeamSettings = async (teamId: string, settings: Partial<Team>) => {
    const teamDocRef = doc(db, 'teams', teamId);
    await setDoc(teamDocRef, settings, { merge: true });
};