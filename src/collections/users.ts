import { buildCollection, buildProperty, EnumValues } from "@firecms/core";

/**
 * Users Collection
 * User management with dynamic role assignment.
 * Role enum values are loaded from the Firestore `roles` collection at runtime.
 */

// Default role enum (fallback when roles collection not yet loaded)
const defaultRoleValues: EnumValues = {
  ADMIN: "Admin",
  CONTENT_MANAGER: "Content Manager",
  REGISTERED_USER: "Registered User",
};

export interface User {
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  loginCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Build the users collection with dynamic role enum values.
 * Roles are managed via the Roles collection.
 */
export function buildUsersCollection(roleEnumValues?: EnumValues) {
  return buildCollection<User>({
    id: "users",
    name: "Users",
    singularName: "User",
    path: "users",
    icon: "People",
    group: "User Management",
    description: "Manage users and assign roles",

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
        enumValues: roleEnumValues ?? defaultRoleValues,
        validation: { required: true },
        description: "User role (defined in Roles collection)",
      }),

      isActive: buildProperty({
        name: "Active",
        dataType: "boolean",
        description: "Enable or disable this user's access",
      }),

      lastLogin: buildProperty({
        name: "Last Login",
        dataType: "date",
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
        dataType: "date",
        readOnly: true,
      }),

      updatedAt: buildProperty({
        name: "Updated At",
        dataType: "date",
        readOnly: true,
      }),
    },
  });
}

// Default export for backward compatibility
export const usersCollection = buildUsersCollection();
