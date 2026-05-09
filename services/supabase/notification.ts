import { supabase } from "./config"

export const fetchAllNotifications = async (userId: string) => {
    // PENDING:
    // user_id included in receiver id list
    const { data, error } = await supabase.from("notifications").select()
        // .or(`user_id.eq.${userId},receiver_ids.cs.{${userId}}`)
        .order("created_at", { ascending: false })
    return { data, error }
}

// fetch count of un-read notifications

// mark-as-read notifications