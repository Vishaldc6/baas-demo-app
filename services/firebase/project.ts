import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where, writeBatch } from "firebase/firestore";
import { db, projectMembersRef, tasksRef, userRef } from "./config";

const checkMembershipExists = async (projectId: string, userId: string) => {
    const q = query(
        projectMembersRef,
        where("project_id", "==", projectId),
        where("user_id", "==", userId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

export const getProjectList = async (userId: string) => {
    if (!userId) return [];

    // fetched project member data
    const memberQuery = query(projectMembersRef, where("user_id", "==", userId));
    const memberSnapshot = await getDocs(memberQuery);
    if (memberSnapshot.empty) return [];

    const projectIds = memberSnapshot.docs.map(d => d.data().project_id);

    const projects = await Promise.all(
        projectIds.map(async (projectId) => {
            // fetch project data
            const projectDoc = await getDoc(doc(db, "projects", projectId));
            if (!projectDoc.exists()) return null;
            const projectData = { id: projectDoc.id, ...projectDoc.data() };

            const membersSnap = await getDocs(query(projectMembersRef, where("project_id", "==", projectId)));
            const members = membersSnap.docs.map(m => m.data());

            // fetch task count
            const tasksSnap = await getDocs(query(tasksRef, where("project_id", "==", projectId)));
            const taskCount = tasksSnap.size;

            return { ...projectData, members, taskCount };
        })
    );

    // TODO: Edit project (updateDoc on name, description, color, icon)
    // TODO: Archive / unarchive project (update is_archived field)
    // TODO: Delete project (cascade to project_members, tasks, messages, invitations, activity_log)
    // TODO: Invitation flow with email token, expiry, accept/decline
    // TODO: Activity log insertion on project actions

    return projects.filter(Boolean);
};

export const getProjectById = async (projectId: string): Promise<any> => {
    const docSnap = await getDoc(doc(db, "projects", projectId));
    if (!docSnap.exists()) throw new Error("Project not found");
    return { id: docSnap.id, ...docSnap.data() };
};

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

export const getProjectMembers = async (projectId: string) => {
    const snap = await getDocs(query(projectMembersRef, where("project_id", "==", projectId)));
    const memberRows = snap.docs.map(d => d.data());

    const members = await Promise.all(
        memberRows.map(async (row: any) => {
            // fetch user data from profile
            const userSnap = await getDoc(doc(db, "profiles", row.user_id));
            const profile = userSnap.exists() ? userSnap.data() : null;
            return {
                id: row.user_id,
                name: profile?.username || "Unknown",
                avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username || "U"}&background=2563EB&color=fff&size=200`,
                role: row.role,
            };
        })
    );

    return members;
};

export const getCurrentUserRole = async (projectId: string, userId: string) => {
    const q = query(
        projectMembersRef,
        where("project_id", "==", projectId),
        where("user_id", "==", userId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data().role;
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