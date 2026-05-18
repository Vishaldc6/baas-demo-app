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
  if (taskData.attachment) {
    const publicUrl = await uploadTaskAttachment(data.id, taskData.attachment);
    data.attachment = publicUrl;
  }

  return data;
};

export const uploadTaskAttachment = async (taskId: string, file: any): Promise<string> => {
  const fileName = file.name || "attachment.file";
  const filePath = `task-${taskId}/${fileName}`;

  // Read the file as a blob for upload
  const response = await fetch(file.uri);
  const blob = await response.blob();

  // Upload to the "task-attachments" bucket (upsert to overwrite previous attachment)
  const { error: uploadError } = await supabase.storage
    .from("task-attachments")
    .upload(filePath, blob, {
      contentType: file.mimeType || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload attachment: ${uploadError.message}`);
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("task-attachments").getPublicUrl(filePath);

  // -- PENDING --
  // attachment column not found error
  // Update the task with the new attachment URL
  // const { error: updateError } = await supabase
  //   .from("tasks")
  //   .update({ attachment: publicUrl })
  //   .eq("id", taskId);

  // if (updateError) {
  //   throw new Error(`Failed to update task with attachment: ${updateError.message}`);
  // }

  return publicUrl;
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
