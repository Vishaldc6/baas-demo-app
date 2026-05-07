import { collection, doc, getDocs, query, serverTimestamp, setDoc, where, writeBatch } from "firebase/firestore";
import { db, projectMembersRef, projectRef, userRef } from "./config";

const checkMembershipExists = async (projectId: string, userId: string) => {
    const q = query(
        projectMembersRef,
        where("project_id", "==", projectId),
        where("user_id", "==", userId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

export const getProjectList = async () => {
    // -- PENDING -- 
    // associate projects only
    const snapshot = await getDocs(projectRef);

    const projects: any[] = [];


    snapshot.forEach(async (doc) => {
        const members: any[] = [];
        const data = doc.data();
        
        // -- PENDING -- 
        // fetch members and attach with project data
        const memberSnapshot = await getDocs(query(projectMembersRef, where("project_id", "==", doc.id)));
        memberSnapshot.forEach(member => members.push(member.data()))
        console.log({ data });

        projects.push({ ...data, members });
    });

    return projects;
}

export const createProject = async (userId: string, projectData: any, initialMembers: any[] = []) => {
    // Generate a new unique ID for the project
    const projectDocRef = doc(collection(db, "projects"));
    const projectId = projectDocRef.id;

    // Create project
    await setDoc(projectDocRef, {
        id: projectId,
        ...projectData,
        created_by: userId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
    });

    const batch = writeBatch(db);

    // Manually insert owner (IMPORTANT)
    const ownerMembershipId = `${projectId}_${userId}`;
    const ownerMembershipRef = doc(db, "project_members", ownerMembershipId);
    batch.set(ownerMembershipRef, {
        id: ownerMembershipId,
        project_id: projectId,
        user_id: userId,
        role: "owner",
        joined_at: serverTimestamp()
    });

    // Add initial members
    for (const member of initialMembers) {
        if (member.id !== userId) { // Avoid duplicate if owner is somehow in the list
            const memberMembershipId = `${projectId}_${member.id}`;
            const memberMembershipRef = doc(db, "project_members", memberMembershipId);
            batch.set(memberMembershipRef, {
                id: memberMembershipId,
                project_id: projectId,
                user_id: member.id,
                role: "member",
                joined_at: serverTimestamp()
            });
        }
    }

    await batch.commit();
    return projectId;
};

export const searchUsersByEmail = async (searchString: string, currentUserId?: string) => {
    // We can do a prefix search using where if we know what field we're searching.
    // Let's do prefix search on username.
    const searchLower = searchString.toLowerCase();
    
    // -- PENDING --
    // -- where query for current user != --

    // Prefix search trick in Firebase:
    // >= searchLower and <= searchLower + '\uf8ff'
    const q = query(
        userRef,
        where("username", ">=", searchLower),
        where("username", "<=", searchLower + "\uf8ff")
    );

    const snapshot = await getDocs(q);
    const users: any[] = [];
    
    snapshot.forEach((doc) => {
        const data = doc.data();
        if (currentUserId && data.id === currentUserId) return; // Don't show current user
        users.push(data);
    });

    return users;
};

export const addMembersToProject = async (projectId: string, members: any[]) => {
    const batch = writeBatch(db);

    for (const member of members) {
        const userExists = await checkMembershipExists(projectId, member.id);
        if (!userExists) {
            const membershipId = `${projectId}_${member.id}`;
            const membershipRef = doc(db, "project_members", membershipId);
            batch.set(membershipRef, {
                id: membershipId,
                project_id: projectId,
                user_id: member.id,
                role: "member",
                joined_at: serverTimestamp()
            });
        }
    }

    await batch.commit();
};