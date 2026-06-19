import { collection, deleteDoc, doc, documentId, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where, writeBatch } from "firebase/firestore";
import { db, projectMembersRef, tasksRef, userRef, messagesRef } from "./config";

const checkMembershipExists = async (projectId: string, userId: string) => {
    const q = query(
        projectMembersRef,
        where("project_id", "==", projectId),
        where("user_id", "==", userId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

export const getProjectList = async (userId: string, lastDocId?: string | null, pageSize = 5) => {
    if (!userId) return { data: [], hasMore: false, lastDoc: null };

    // fetched project member data
    const memberQuery = query(projectMembersRef, where("user_id", "==", userId));
    const memberSnapshot = await getDocs(memberQuery);
    if (memberSnapshot.empty) return { data: [], hasMore: false, lastDoc: null };

    const projectIds = memberSnapshot.docs.map(d => d.data().project_id);

    const projects = await Promise.all(
        projectIds.map(async (projectId) => {
            // fetch project data
            const projectDoc = await getDoc(doc(db, "projects", projectId));
            if (!projectDoc.exists()) return null;
            return { id: projectDoc.id, ...projectDoc.data() };
        })
    );

    // Sort by created_at (newest first)
    const sortedProjects = projects.filter(Boolean).sort((a: any, b: any) => {
        const aTime = a.created_at?.toMillis?.() || 0;
        const bTime = b.created_at?.toMillis?.() || 0;
        return bTime - aTime;
    });

    // Paginate in memory
    let startIndex = 0;
    if (lastDocId) {
        const index = sortedProjects.findIndex(p => p.id === lastDocId);
        if (index !== -1) {
            startIndex = index + 1;
        }
    }

    const pageProjects = sortedProjects.slice(startIndex, startIndex + pageSize);
    const hasMore = sortedProjects.length > startIndex + pageSize;
    const nextLastDocId = pageProjects.length > 0 ? pageProjects[pageProjects.length - 1].id : null;

    // Fetch details for page elements only
    const projectsWithDetails = await Promise.all(
        pageProjects.map(async (projectData: any) => {
            const membersSnap = await getDocs(query(projectMembersRef, where("project_id", "==", projectData.id)));
            const members = membersSnap.docs.map(m => m.data());

            // fetch task count
            const tasksSnap = await getDocs(query(tasksRef, where("project_id", "==", projectData.id)));
            const taskCount = tasksSnap.size;

            return { ...projectData, members, taskCount };
        })
    );

    // TODO: Edit project (updateDoc on name, description, color, icon)
    // TODO: Archive / unarchive project (update is_archived field)
    // TODO: Delete project (cascade to project_members, tasks, messages, invitations, activity_log)
    // TODO: Invitation flow with email token, expiry, accept/decline
    // TODO: Activity log insertion on project actions

    return {
        data: projectsWithDetails,
        hasMore,
        lastDoc: nextLastDocId
    };
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

export const searchUsersByKeyword = async (searchString: string, currentUserId?: string) => {
    const searchLower = searchString.toLowerCase();

    // Search by username prefix
    const usernameQuery = query(
        userRef,
        where("username", ">=", searchLower),
        where("username", "<=", searchLower + "\uf8ff")
    );

    // Search by email prefix
    const emailQuery = query(
        userRef,
        where("email", ">=", searchLower),
        where("email", "<=", searchLower + "\uf8ff")
    );

    const [usernameSnap, emailSnap] = await Promise.all([
        getDocs(usernameQuery),
        getDocs(emailQuery),
    ]);

    const usersMap = new Map<string, any>();

    usernameSnap.forEach((doc) => {
        const data = doc.data();
        if (currentUserId && data.id === currentUserId) return;
        usersMap.set(data.id, data);
    });

    emailSnap.forEach((doc) => {
        const data = doc.data();
        if (currentUserId && data.id === currentUserId) return;
        usersMap.set(data.id, data);
    });

    return Array.from(usersMap.values());
};

export const getProjectMembers = async (projectId: string) => {
    // Sorted by joined_at (oldest first) via Firestore orderBy — requires composite index
    const snap = await getDocs(
        query(projectMembersRef, where("project_id", "==", projectId), orderBy("joined_at", "asc"))
    );
    const memberRows = snap.docs.map(d => d.data());

    if (memberRows.length === 0) return [];

    // Batch fetch all profiles in a single query instead of N individual getDoc calls
    const userIds = memberRows.map((row: any) => row.user_id);
    const profilesSnap = await getDocs(
        query(userRef, where(documentId(), "in", userIds))
    );

    // Build a map for quick lookup
    const profileMap = new Map<string, any>();
    profilesSnap.forEach((doc) => {
        profileMap.set(doc.id, doc.data());
    });

    // Map members with their profile data (preserving joined_at order)
    return memberRows.map((row: any) => {
        const profile = profileMap.get(row.user_id) || null;
        return {
            id: row.user_id,
            name: profile?.username || "Unknown",
            avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username || "U"}&background=2563EB&color=fff&size=200`,
            role: row.role,
        };
    });
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

export const deleteProject = async (projectId: string) => {
    const batch = writeBatch(db);

    // 1. Delete project members
    const membersSnap = await getDocs(query(projectMembersRef, where("project_id", "==", projectId)));
    membersSnap.forEach((d) => {
        batch.delete(d.ref);
    });

    // 2. Delete tasks
    const tasksSnap = await getDocs(query(tasksRef, where("project_id", "==", projectId)));
    tasksSnap.forEach((d) => {
        batch.delete(d.ref);
    });

    // 3. Delete messages
    const messagesSnap = await getDocs(query(messagesRef, where("project_id", "==", projectId)));
    messagesSnap.forEach((d) => {
        batch.delete(d.ref);
    });

    // 4. Delete project doc itself
    const projectDocRef = doc(db, "projects", projectId);
    batch.delete(projectDocRef);

    await batch.commit();
};

export const removeMemberFromProject = async (projectId: string, userId: string) => {

    // TODO: if member get removed then what about the task that assigned to him?
    // - should update status and assignee?

    const membershipId = `${projectId}_${userId}`;
    const membershipRef = doc(db, "project_members", membershipId);
    await deleteDoc(membershipRef);
};

/*
// TODO: Implement member management functions when needed in the future
export const updateMemberRole = async (projectId: string, userId: string, role: string) => {
    // const membershipId = `${projectId}_${userId}`;
    // const membershipRef = doc(db, "project_members", membershipId);
    // await updateDoc(membershipRef, { role, updated_at: serverTimestamp() });
};

export const isLastOwner = async (projectId: string, userId: string) => {
    // Query count of owners for projectId. If count is 1 and this user is owner, return true.
    return false;
};
*/