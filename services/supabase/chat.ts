import supabase from "./config";

export const getProjectMessages = async (projectId: string) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const sendMessage = async (projectId: string, senderId: string, content: string) => {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      project_id: projectId,
      sender_id: senderId,
      content: content,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// TODO: Paginate — add range() with cursor for large projects
export const getUserProjectsWithLatestMessage = async (userId: string) => {
  const { data: memberships, error: memError } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", userId);

  if (memError) throw new Error(memError.message);
  if (!memberships || memberships.length === 0) return [];

  const projectIds = memberships.map(m => m.project_id);

  const { data: projects, error: projError } = await supabase
    .from("projects")
    .select("*")
    .in("id", projectIds);

  if (projError) throw new Error(projError.message);
  if (!projects) return [];

  const result = await Promise.all(
    projects.map(async (project) => {
      const { data: messages, error: msgError } = await supabase
        .from("messages")
        .select("content, created_at, sender:profiles!sender_id(username)")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (msgError) {
        return { id: project.id, name: project.name, latestMessage: null };
      }

      const latestMessage =
        messages && messages.length > 0
          ? {
            text: messages[0].content,
            senderName: (messages[0] as any).sender?.username || "Unknown",
            createdAt: messages[0].created_at,
          }
          : null;

      return {
        id: project.id,
        name: project.name,
        latestMessage,
      };
    })
  );

  return result;
};

export const listenToNewMessages = (projectId: string, callback: (message: any) => void) => {
  console.log(`[Chat] Setting up realtime subscription for project: ${projectId}`);

  const subscription = supabase
    .channel(`project-messages-${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `project_id=eq.${projectId}`,
      },
      (payload: any) => {
        console.log('[Chat] Realtime payload received: ', { newmsg: payload.new });
        callback(payload.new);
      }
    )
    .subscribe((status: string, err?: Error) => {
      console.log(`[Chat] Realtime subscription status: ${status}`, err ? { error: err } : '');
      if (status === 'TIMED_OUT') {
        console.warn('[Chat] Realtime subscription timed out — check Supabase Replication settings');
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('[Chat] Realtime channel error — check RLS policies and Replication config');
      }
    });

  return subscription;
};
