export interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions?: Array<{ id: string; name: string }>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  totalPermissions: number;
  directPermissions: number;
}

export type AdminTabType = "dashboard" | "roles" | "users" | "user-data";

export interface AdminTab {
  id: AdminTabType;
  label: string;
}
