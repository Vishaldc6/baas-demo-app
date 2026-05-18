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
  
  // Transform to a flat array
  return data.map((item: any) => ({
    id: item.profiles?.id || item.user_id,
    name: item.profiles?.username || item.profiles?.email || 'Unknown',
    avatar: item.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${item.profiles?.username || 'U'}`,
    role: item.role
  }));
};
