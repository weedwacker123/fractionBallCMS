import { buildCollection, buildProperty } from "@firecms/core";

/**
 * Users Collection
 * User management with role-based access
 */

// User role enum
const roleValues = {
  admin: "Admin",
  content_manager: "Content Manager",
  teacher: "Teacher",
};

export interface User {
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
}

export const usersCollection = buildCollection<User>({
  id: "users",
  name: "Users",
  singularName: "User",
  path: "users",
  icon: "People",
  group: "User Management",
  description: "Manage users, roles, and access permissions",

  permissions: ({ authController }: any) => {
    const isAdmin = authController?.extra?.role === "admin";
    return { read: isAdmin, edit: isAdmin, create: isAdmin, delete: isAdmin };
  },

  properties: {
    email: buildProperty({
      name: "Email",
      dataType: "string",
      validation: {
        required: true,
        email: true,
      },
      description: "User's email address",
    }),

    displayName: buildProperty({
      name: "Display Name",
      dataType: "string",
      validation: { required: true, min: 2, max: 100 },
      description: "User's display name",
    }),

    role: buildProperty({
      name: "Role",
      dataType: "string",
      enumValues: roleValues,
      validation: { required: true },
      description: "User role determines access permissions",
    }),

    isActive: buildProperty({
      name: "Active",
      dataType: "boolean",
      description: "Enable or disable this user's access",
    }),

    lastLogin: buildProperty({
      name: "Last Login",
      dataType: "string",
      readOnly: true,
      description: "Last login timestamp",
    }),

    loginCount: buildProperty({
      name: "Login Count",
      dataType: "number",
      readOnly: true,
      description: "Total number of logins",
    }),

    createdAt: buildProperty({
      name: "Created At",
      dataType: "string",
      readOnly: true,
    }),

    updatedAt: buildProperty({
      name: "Updated At",
      dataType: "string",
      readOnly: true,
    }),
  },
});
