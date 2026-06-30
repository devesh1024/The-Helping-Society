import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, setAccessToken, clearAccessToken, getAccessToken } from "@/lib/api";

export type AppRole = "super_admin" | "admin" | "user";
export type AdminType = "khabri" | "professor" | null;

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string | null;
  user_type: "student" | "faculty" | "contributor" | "admin" | "alumni";
  verified: boolean;
  is_disabled: boolean;
  is_banned: boolean;
  
  // Student fields
  registrationNumber?: string;
  branch?: string | null;
  yearOfRegistration?: number;
  dob?: string;
  isCoreTeam?: boolean;

  // Contributor fields
  organizationName?: string;
  roleInOrganization?: string;

  // Alumni fields
  yearOfGraduation?: number;
  currentCompany?: string;
  currentRole?: string;
  linkedin?: string;

  // Backward compatibility helper
  year?: number;
}

export interface AppUser {
  id: string;
  email: string;
  role: 'student' | 'faculty' | 'contributor' | 'admin' | 'alumni';
  fullName: string;
}

interface AuthContextValue {
  user: AppUser | null;
  profile: Profile | null;
  roles: AppRole[];
  adminType: AdminType;
  loading: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isKhabri: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const mapUserToProfile = (u: any): Profile | null => {
  if (!u) return null;
  const currentYear = new Date().getFullYear();
  let computedYear: number | null = null;
  
  if (u.role === 'student' && u.yearOfRegistration) {
    computedYear = currentYear - u.yearOfRegistration + 1;
    if (computedYear < 1) computedYear = 1;
    if (computedYear > 4) computedYear = 4;
  } else if (u.year) {
    computedYear = u.year;
  }

  const branchMap: Record<string, string> = {
    cs: "Computer Science Engineering",
    ec: "Electronics and communication engineering",
    ee: "Electrical Engineering",
    cm: "Chemical Engineering",
    me: "Mechanical engineering",
    ce: "Civil Engineering",
  };

  return {
    id: u._id,
    full_name: u.fullName || "",
    email: u.email || "",
    mobile_number: u.phoneNumber || null,
    user_type: u.role,
    verified: u.status === 'active',
    is_disabled: u.status === 'disabled',
    is_banned: u.status === 'banned',
    registrationNumber: u.registrationNumber,
    branch: u.branch ? (branchMap[u.branch.toLowerCase()] || u.branch) : null,
    yearOfRegistration: u.yearOfRegistration,
    dob: u.dob ? new Date(u.dob).toISOString().split('T')[0] : undefined,
    isCoreTeam: u.isCoreTeam,
    organizationName: u.organizationName,
    roleInOrganization: u.roleInOrganization,
    yearOfGraduation: u.yearOfGraduation,
    currentCompany: u.currentCompany,
    currentRole: u.currentRole,
    linkedin: u.linkedin,
    year: computedYear || undefined,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [adminType, setAdminType] = useState<AdminType>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const response = await api.get("/auth/me");
      const u = response.data.data.user;
      
      setUser({
        id: u._id,
        email: u.email,
        role: u.role,
        fullName: u.fullName
      });

      const prof = mapUserToProfile(u);
      setProfile(prof);

      // Determine roles and adminType
      const rolesList: AppRole[] = [];
      let at: AdminType = null;
      if (u.role === 'admin') {
        rolesList.push('admin', 'super_admin');
        at = 'khabri';
      } else if (u.role === 'contributor') {
        rolesList.push('admin');
        at = 'khabri';
      } else if (u.role === 'faculty') {
        rolesList.push('user');
        at = 'professor';
      } else if (u.role === 'alumni') {
        rolesList.push('user');
      } else if (u.role === 'student') {
        rolesList.push('user');
        if (u.isCoreTeam) {
          rolesList.push('admin');
          at = 'khabri';
        }
      }
      setRoles(rolesList);
      setAdminType(at);
    } catch (err) {
      setUser(null);
      setProfile(null);
      setRoles([]);
      setAdminType(null);
      throw err;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const existingToken = getAccessToken();
        if (existingToken) {
          await loadProfile();
        } else {
          const response = await api.post("/auth/refresh-token");
          const { accessToken } = response.data.data;
          setAccessToken(accessToken);
          await loadProfile();
        }
      } catch (err) {
        clearAccessToken();
        setUser(null);
        setProfile(null);
        setRoles([]);
        setAdminType(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleAuthExpired = () => {
      clearAccessToken();
      setUser(null);
      setProfile(null);
      setRoles([]);
      setAdminType(null);
    };

    window.addEventListener("auth-session-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("auth-session-expired", handleAuthExpired);
    };
  }, []);

  const signOut = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Logout request failed:", e);
    } finally {
      clearAccessToken();
      setUser(null);
      setProfile(null);
      setRoles([]);
      setAdminType(null);
    }
  };

  const signIn = async (token: string) => {
    setAccessToken(token);
    await loadProfile();
  };

  const refresh = async () => {
    try {
      await loadProfile();
    } catch (err) {
      console.error("Refresh profile failed:", err);
    }
  };

  const value: AuthContextValue = {
    user,
    profile,
    roles,
    adminType,
    loading,
    isVerified: !!profile?.verified && !profile?.is_disabled && !profile?.is_banned,
    isAdmin: roles.includes("admin") || roles.includes("super_admin"),
    isSuperAdmin: roles.includes("super_admin"),
    isKhabri: adminType === "khabri" || roles.includes("super_admin"),
    signOut,
    refresh,
    signIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
