// This file is deprecated. All operations have been consolidated into services/supabase/project.ts.
export * from "./project";

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

