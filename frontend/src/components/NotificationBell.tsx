import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);

  const load = async () => {
    if (!user) return;
    try {
      const res = await api.get("/notifications");
      const list = res.data.data.notifications || [];
      const mapped = list.map((n: any) => ({
        id: n._id,
        title: n.title,
        body: n.message,
        link: n.link,
        read: n.isRead,
        created_at: n.createdAt,
      }));
      setItems(mapped);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      load();
    }, 10000);
    return () => {
      clearInterval(interval);
    };
  }, [user]);

  const unread = items.filter((i) => !i.read).length;

  const markRead = async () => {
    if (!user || unread === 0) return;
    try {
      await api.patch("/notifications/read-all");
      load();
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  };

  return (
    <Popover onOpenChange={(o) => o && markRead()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold grid place-items-center">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border">
          <p className="font-semibold text-sm">Notifications</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">No notifications yet.</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => n.link && navigate(n.link)}
                className="w-full text-left px-4 py-3 hover:bg-muted border-b border-border/50 last:border-0"
              >
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
