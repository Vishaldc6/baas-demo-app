import supabase from "./config";

export const getProjectMembers = async (projectId: string) => {
  const { data, error } = await supabase
    .from("project_members")
    .select(`
      user_id,
      role,
      profiles:user_id ( id, username, avatar_url )
    `)
    .eq("project_id", projectId);

  if (error) throw new Error(error.message);
  return data.map((item: any) => ({
    id: item.profiles?.id || item.user_id,
    name: item.profiles?.username || "Unknown",
    avatar: item.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${item.profiles?.username || "U"}&background=2563EB&color=fff&size=200`,
    role: item.role,
  }));
};

export const getCurrentUserRole = async (projectId: string, userId: string) => {
  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data?.role;
};
