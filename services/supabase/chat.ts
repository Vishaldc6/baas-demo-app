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

// send message
export const sendMessage = async (projectId: string, userId: string, message: string) => {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      project_id: projectId,
      user_id: userId,
      message: message,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// listener for new messages
export const listenToNewMessages = () => {
  const subscription = supabase
    .channel("public:messages")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload: any) => {
        console.log("New message received:", payload);
      }
    )
    .subscribe();

  return subscription;
};

