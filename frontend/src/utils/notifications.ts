import { supabase } from "@/integrations/supabase/client";

export const createNotification = async ({
  user_id,
  title,
  body,
  link
}: {
  user_id: string | null;
  title: string;
  body?: string;
  link?: string;
}) => {
  const { error } = await supabase.from("notifications").insert({
    user_id,
    title,
    body,
    link,
    read: false
  });
  if (error) console.error("Notification error:", error);
};

export const notifyAdmins = async (title: string, body: string, link: string) => {
  // Get all admins and super admins
  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id")
    .or("role.eq.admin,role.eq.super_admin");
  
  if (!roles) return;

  const uniqueAdminIds = Array.from(new Set(roles.map(r => r.user_id)));
  
  // Insert for each admin
  const notifications = uniqueAdminIds.map(uid => ({
    user_id: uid,
    title,
    body,
    link,
    read: false
  }));

  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications);
  }
};
