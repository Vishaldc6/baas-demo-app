import { addDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { app, db, tasksRef } from "./config";

// Initialize Firebase Storage
const storage = getStorage(app);

export interface TaskData {
  project_id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_id?: string | null;
  created_by: string;
  due_date?: string;
  position?: number;
  attachment?: any;
}

export const createTask = async (taskData: TaskData) => {
  const { attachment, ...restTaskData } = taskData;
  const docRef = await addDoc(tasksRef, {
    ...restTaskData,
    status: taskData.status || "todo",
    priority: taskData.priority || "none",
    position: taskData.position || 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  let attachmentUrl = null;
  if (attachment) {
    attachmentUrl = await uploadTaskAttachment(docRef.id, attachment);
  }

  return { id: docRef.id, ...restTaskData, attachment: attachmentUrl };
};

export const uploadTaskAttachment = async (taskId: string, file: any): Promise<string> => {
  const fileName = file.name || "attachment.file";
  const storagePath = `task-attachments/task-${taskId}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  // Read the file as an ArrayBuffer
  const arrayBuffer = await fetch(file.uri).then((res) => res.arrayBuffer());

  // Upload to Firebase Storage
  await uploadBytes(storageRef, arrayBuffer, {
    contentType: file.mimeType || "application/octet-stream",
  });

  // Get the download URL
  const downloadUrl = await getDownloadURL(storageRef);

  // Update the task document in Firestore with the attachment URL
  const taskRef = doc(tasksRef, taskId);
  await updateDoc(taskRef, {
    attachment: downloadUrl,
    updated_at: serverTimestamp(),
  });

  return downloadUrl;
};

export const updateTask = async (taskId: string, updates: Partial<TaskData>) => {
  const taskRef = doc(tasksRef, taskId);
  await updateDoc(taskRef, {
    ...updates,
    updated_at: serverTimestamp(),
  });
};

// TODO: Task reorder (update position field on multiple tasks)
// TODO: Task delete

export const getTasksByProject = async (projectId: string, lastDocId?: string | null, pageSize = 7) => {
  // Sorted by created_at (newest first) via Firestore orderBy — requires composite index
  const q = query(
    tasksRef,
    where("project_id", "==", projectId),
    orderBy("created_at", "desc"),
  );
  const snapshot = await getDocs(q);
  const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  let startIndex = 0;
  if (lastDocId) {
    const index = allTasks.findIndex(t => t.id === lastDocId);
    if (index !== -1) {
      startIndex = index + 1;
    }
  }

  const pageTasks = allTasks.slice(startIndex, startIndex + pageSize);
  const hasMore = allTasks.length > startIndex + pageSize;
  const nextLastDocId = pageTasks.length > 0 ? pageTasks[pageTasks.length - 1].id : null;

  return {
    data: pageTasks,
    hasMore,
    lastDoc: nextLastDocId
  };
};

export const getTasksByAssignee = async (assigneeId: string, lastDocId?: string | null, pageSize = 7) => {
  const q = query(
    tasksRef,
    where("assignee_id", "==", assigneeId),
  );
  const snapshot = await getDocs(q);
  const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Sort tasks in-memory by creation time (newest first)
  const sortedTasks = tasks.sort((a: any, b: any) => {
    const aTime = a.created_at?.toMillis ? a.created_at.toMillis() : (a.created_at ? new Date(a.created_at).getTime() : 0);
    const bTime = b.created_at?.toMillis ? b.created_at.toMillis() : (b.created_at ? new Date(b.created_at).getTime() : 0);
    return bTime - aTime;
  });

  let startIndex = 0;
  if (lastDocId) {
    const index = sortedTasks.findIndex(t => t.id === lastDocId);
    if (index !== -1) {
      startIndex = index + 1;
    }
  }

  const pageTasks = sortedTasks.slice(startIndex, startIndex + pageSize);
  const hasMore = sortedTasks.length > startIndex + pageSize;
  const nextLastDocId = pageTasks.length > 0 ? pageTasks[pageTasks.length - 1].id : null;

  if (pageTasks.length === 0) return { data: [], hasMore: false, lastDoc: null };

  // Fetch unique project names for pageTasks only (optimization!)
  const projectIds = Array.from(new Set(pageTasks.map((t: any) => t.project_id).filter(Boolean)));
  const projectCache = new Map<string, string>();

  await Promise.all(
    projectIds.map(async (projectId) => {
      try {
        const projectDoc = await getDoc(doc(db, "projects", projectId));
        if (projectDoc.exists()) {
          projectCache.set(projectId, projectDoc.data().name || "Unknown Project");
        } else {
          projectCache.set(projectId, "Unknown Project");
        }
      } catch (e) {
        console.error(`Failed to fetch project ${projectId}:`, e);
        projectCache.set(projectId, "Unknown Project");
      }
    })
  );

  const data = pageTasks.map((task: any) => ({
    ...task,
    project_name: projectCache.get(task.project_id) || "Unknown Project",
  }));

  return {
    data,
    hasMore,
    lastDoc: nextLastDocId
  };
};

