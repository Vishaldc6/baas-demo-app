import { addDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { tasksRef } from "./config";

export interface TaskData {
  project_id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_id?: string;
  created_by: string;
  due_date?: string;
  position?: number;
}

export const createTask = async (taskData: TaskData) => {
  const docRef = await addDoc(tasksRef, {
    ...taskData,
    status: taskData.status || "todo",
    priority: taskData.priority || "none",
    position: taskData.position || 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return { id: docRef.id, ...taskData };
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

export const getTasksByProject = async (projectId: string) => {
  const q = query(
    tasksRef,
    where("project_id", "==", projectId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getTasksByAssignee = async (assigneeId: string) => {
  const q = query(
    tasksRef,
    where("assignee_id", "==", assigneeId),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
