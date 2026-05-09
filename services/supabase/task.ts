import supabase from "./config";

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
  attachment?: any
}

export const createTask = async (taskData: TaskData) => {
  const { data, error } = await supabase
    .from("tasks")
    .insert([
      {
        project_id: taskData.project_id,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || "todo",
        priority: taskData.priority || "none",
        assignee_id: taskData.assignee_id,
        created_by: taskData.created_by,
        due_date: taskData.due_date,
        position: taskData.position || 0,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // upload attached file
  // await uploadTaskAttachment(data.id, taskData.attachment);

  return data;
};

export const uploadTaskAttachment = async (taskId: string, file: File) => {
  const { data, error } = await supabase.storage
    .from("task-attachments")
    .upload(`task-${taskId}/${file.name}`, file);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getTasksByProject = async (projectId: string) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getTasksByAssignee = async (assigneeId: string) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("assignee_id", assigneeId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
