import supabase from "./config";

export const getProjectMembers = async (projectId: string) => {
  const { data, error } = await supabase
    .from("project_members")
    .select(`
      user_id,
      role,
      profiles:user_id ( id, username, avatar_url )
    `)
    .eq("project_id", projectId)
    .order("joined_at", { ascending: true });

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

export const removeMemberFromProject = async (projectId: string, userId: string) => {
  const { data, error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data;
};

/*
// TODO: Implement member management functions when needed in the future
export const updateMemberRole = async (projectId: string, userId: string, role: string) => {
  // const { data, error } = await supabase
  //   .from("project_members")
  //   .update({ role })
  //   .eq("project_id", projectId)
  //   .eq("user_id", userId);
  // if (error) throw new Error(error.message);
  // return data;
};

export const isLastOwner = async (projectId: string, userId: string) => {
  // Query count of owners for projectId. If count is 1 and this user is owner, return true.
  return false;
};
*/

