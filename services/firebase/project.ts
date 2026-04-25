import { collection, doc, getDocs, query, serverTimestamp, setDoc, where, writeBatch } from "firebase/firestore";
import { db, projectMembersRef, userRef } from "./config";

const checkMembershipExists = async (projectId: string, userId: string) => {
    const q = query(
        projectMembersRef,
        where("project_id", "==", projectId),
        where("user_id", "==", userId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

export const createProjectFirebase = async (userId: string, projectData: any, initialMembers: any[] = []) => {
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

export const searchUsersByEmail = async (searchString: string) => {
    // Basic prefix search on email or username using >= and <=
    // For a more robust search, you might need Algolia or similar, 
    // but for this demo we'll just do a simple query or fetch all and filter if it's small.
    // Let's assume username is the primary search for now.

    // Using a broad query and filtering in memory for this demo 
    // since Firebase doesn't support generic 'LIKE' queries well without third party tools.
    const snapshot = await getDocs(userRef);
    const users: any[] = [];
    const searchLower = searchString.toLowerCase();

    // -- PENDING --
    // -- dont show current user from results--
    // -- add where query --

    snapshot.forEach((doc) => {
        const data = doc.data();
        const username = (data.username || "").toLowerCase();
        const email = (data.email || "").toLowerCase();

        if (username.includes(searchLower) || email.includes(searchLower)) {
            users.push(data);
        }
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