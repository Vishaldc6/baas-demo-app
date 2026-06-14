import supabase from "./config";

export const getProjectList = async (userId: string) => {
  if (!userId) return [];

  // fetch project ids with associated project members
  const { data: userMemberships, error: membershipError } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", userId);



  if (membershipError) throw new Error(membershipError.message);
  if (!userMemberships?.length) return [];

  const projectIds = userMemberships.map((pm: any) => pm.project_id);

  // fetch projects data as per project ids, ordered by created_at (newest first)
  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .in("id", projectIds)
    .order("created_at", { ascending: false });

  if (projectError) throw new Error(projectError.message);

  // fetch project members as per project ids
  const { data: projectMembers, error: membersError } = await supabase
    .from("project_members")
    .select("project_id, user_id, role")
    .in("project_id", projectIds);

  if (membersError) throw new Error(membersError.message);

  // fetch total task counts as per project ids 
  const { data: taskCounts, error: tasksError } = await supabase
    .from("tasks")
    .select("project_id, id")
    .in("project_id", projectIds);



  if (tasksError) throw new Error(tasksError.message);

  const taskCountMap: Record<string, number> = {};
  for (const t of taskCounts || []) {
    taskCountMap[t.project_id] = (taskCountMap[t.project_id] || 0) + 1;
  }

  const projectsWithMembers = projects?.map((p: any) => {
    const members = projectMembers?.filter((pm: any) => pm.project_id === p.id);
    return { ...p, members, taskCount: taskCountMap[p.id] || 0 };
  });

  // TODO: Edit project (update name, description, color, icon) — use updateProject(projectId, data)
  // TODO: Archive / unarchive project (toggle is_archived field)
  // TODO: Delete project (cascade to project_members, tasks, messages, invitations, activity_log)
  // TODO: Invitation flow with email token, expiry, accept/decline
  // TODO: Activity log insertion on project actions



  return projectsWithMembers;
};

export const getProjectById = async (projectId: string) => {
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) throw new Error(error.message);
  return project;
};

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


  if (projectError) {
    throw new Error(`Failed to create project: ${projectError.message}`);
  }

  const projectId = project.id;

  // Prepare members payload
  const membersToInsert = [
    // ALREADY CREATED IN Supabase Project Creation function
    // {
    //   project_id: projectId,
    //   user_id: userId,
    //   role: "owner",
    // },
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
  if (membersToInsert.length) {
    const { error: membersError } = await supabase
      .from("project_members")
      .insert(membersToInsert);


    if (membersError) {
      throw new Error(`Failed to add members: ${membersError.message}`);
    }
  }

  return projectId;
};

export const searchUsersByKeyword = async (searchString: string, currentUserId: string) => {
  // Search profiles by username or email (email column added to profiles table)
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, email")
    .neq("id", currentUserId)
    .or(`username.ilike.%${searchString}%,email.ilike.%${searchString}%`)
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
