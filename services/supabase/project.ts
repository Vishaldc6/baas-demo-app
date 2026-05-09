import supabase from "./config";

export const getProjectList = async () => {

  // -- PENDING -- 
  // associate projects only

  // fetch project ids from project_members
  // fetch projects based on fetched ids

  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("*");
  console.log({ projects, projectError });

  const { data: projectMembers, error: projectMembersError } = await supabase.from('project_members')
    .select('*')
    .in('project_id', (projects || []).map((p: any) => p.id));
  console.log({ projectMembers, projectMembersError });

  const projectsWithMembers = projects?.map((p: any) => {
    const members = projectMembers?.filter((pm: any) => pm.project_id === p.id);
    return { ...p, members };
  });

  return projectsWithMembers
}

export const createProject = async (
  userId: string,
  projectData: any,
  initialMembers: any[] = []
) => {
  // Insert project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: projectData.name,
      description: projectData.description,
      color: projectData.color,
      icon: projectData.icon,
      created_by: userId,
    })
    .select("id")
    .single();
  console.log({ projectError });

  if (projectError) {
    throw new Error(`Failed to create project: ${projectError.message}`);
  }

  const projectId = project.id;

  // Prepare members payload
  const membersToInsert = [
    {
      project_id: projectId,
      user_id: userId,
      role: "owner",
    },
  ];

  for (const member of initialMembers) {
    if (member.id !== userId) {
      membersToInsert.push({
        project_id: projectId,
        user_id: member.id,
        role: "member",
      });
    }
  }

  // Insert all members
  const { error: membersError } = await supabase
    .from("project_members")
    .insert(membersToInsert);

  if (membersError) {
    throw new Error(`Failed to add members: ${membersError.message}`);
  }

  return projectId;
};

export const searchUsersByKeyword = async (searchString: string, currentUserId: string) => {
  // -- PENDING --
  // -- search by email not just username --


  // Query profiles table matching username (since there's no email in profiles schema)
  // Exclude the current user from the results
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .neq("id", currentUserId)
    .or(`username.ilike.%${searchString}%`)
    .limit(20);

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return data || [];
};

export const addMembersToProject = async (projectId: string, members: any[]) => {
  if (!members || members.length === 0) return;

  const membersToInsert = members.map((member) => ({
    project_id: projectId,
    user_id: member.id,
    role: "member",
  }));

  // Supabase will throw a unique constraint error if we try to insert duplicates 
  // because of UNIQUE(project_id, user_id). 
  // We can use upsert with ON CONFLICT DO NOTHING (ignoreDuplicates: true in supabase-js)
  const { error } = await supabase
    .from("project_members")
    .upsert(membersToInsert, { onConflict: "project_id,user_id", ignoreDuplicates: true });

  if (error) {
    throw new Error(`Failed to add members: ${error.message}`);
  }
};
