import { addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { db, messagesRef } from "./config";

export const getProjectMessages = async (projectId: string) => {
  const q = query(
    messagesRef,
    where("project_id", "==", projectId),
    orderBy("created_at", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const sendMessage = async (projectId: string, senderId: string, content: string) => {
  const docRef = await addDoc(messagesRef, {
    project_id: projectId,
    sender_id: senderId,
    content,
    created_at: serverTimestamp(),
  });
  return { id: docRef.id, project_id: projectId, sender_id: senderId, content };
};

// TODO: Paginate — limit + startAfter cursor for large projects
// TODO: Optimize — this runs N+3 queries per project; consider denormalizing lastMessage into project doc for scale
export const getUserProjectsWithLatestMessage = async (userId: string) => {
  const memberQuery = query(
    collection(db, "project_members"),
    where("user_id", "==", userId)
  );
  const memberSnapshot = await getDocs(memberQuery);
  if (memberSnapshot.empty) return [];

  const projectIds = memberSnapshot.docs.map(d => d.data().project_id);

  const result = await Promise.all(
    projectIds.map(async (projectId) => {
      const projectSnap = await getDoc(doc(db, "projects", projectId));
      if (!projectSnap.exists()) return null;
      const projectData: any = { id: projectSnap.id, ...projectSnap.data() };

      const messageQuery = query(
        messagesRef,
        where("project_id", "==", projectId),
        orderBy("created_at", "desc"),
        limit(1)
      );
      const messageSnap = await getDocs(messageQuery);
      let latestMessage: any = null;
      let senderName = null;

      if (!messageSnap.empty) {
        const msgData = messageSnap.docs[0].data();
        const msgCreatedAt = msgData.created_at?.toMillis
          ? new Date(msgData.created_at.toMillis()).toISOString()
          : null;
        latestMessage = { id: messageSnap.docs[0].id, ...msgData, createdAt_: msgCreatedAt };

        try {
          const senderSnap = await getDoc(doc(db, "profiles", msgData.sender_id));
          if (senderSnap.exists()) {
            senderName = senderSnap.data().username || "Unknown";
          }
        } catch {
          senderName = "Unknown";
        }
      }

      return {
        id: projectId,
        name: projectData.name || "Untitled",
        latestMessage: latestMessage
          ? { text: latestMessage.content, senderName, createdAt: latestMessage.createdAt_ }
          : null,
      };
    })
  );

  return result.filter(Boolean);
};

// -- PENDING ADVANCED CHAT FEATURES (TO BE DEMONSTRATED LATER) --
// TODO: Reply to message (schema supports reply_to_id)
// TODO: Edit message content (schema supports is_edited)
// TODO: Soft delete message (schema supports is_deleted)
// TODO: Mentions (schema supports mentions array)
// TODO: Paginated Message Loading (cursor-based pagination via startAfter)

/**
 * Real-time message listener for Firebase Firestore.
 * 
 * NOTE (Real-time Signature Mismatch Comparison):
 * Firestore's onSnapshot() is document-set based. Every time there is an update (an insert,
 * modify, or delete) to any message in the query, Firestore sends the FULL snapshot of all
 * matching documents. The callback receives the entire parsed messages array, making local
 * state management simple but consuming more client-side bandwith/reads.
 */
export const listenToProjectMessages = (projectId: string, callback: (messages: any[]) => void) => {
  const q = query(
    messagesRef,
    where("project_id", "==", projectId),
    orderBy("created_at", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.created_at?.toMillis
        ? new Date(data.created_at?.toMillis()).toISOString()
        : null;
      return { id: doc.id, ...data, createdAt_: createdAt };
    });
    callback(messages);
  });
};
