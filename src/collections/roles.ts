import { buildCollection, buildProperty } from "@firecms/core";

/**
 * Roles Collection
 * Dynamic role definitions with configurable permissions.
 * Roles control what LMS sections a user can access.
 */

// All permission keys the LMS recognizes.
// Keep in sync with PERMISSION_KEYS in LMS accounts/role_service.py
export const permissionKeys: Record<string, string> = {
  "community.create": "Community: Create Posts",
  "community.moderate": "Community: Moderate",
  "content.manage": "Content: Create/Edit/Delete",
  "content.approve": "Content: Approve Workflow",
  "cms.access": "CMS: Access Interface",
  "reports.view": "Reports: View Dashboards",
  "library.videos": "Library: Video Access",
  "library.resources": "Library: Resource Access",
  "dashboard.view": "Dashboard: Teacher Dashboard",
  "users.manage": "Admin: Manage Users",
  "schools.manage": "Admin: Manage Schools",
  "bulk.upload": "Content: Bulk Upload",
  "notes.access": "Notes: Personal Notes",
};

export interface Role {
  key: string;
  name: string;
  description?: string;
  isSystem: boolean;
  displayOrder: number;
  permissions: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export const rolesCollection = buildCollection<Role>({
  id: "roles",
  name: "Roles",
  singularName: "Role",
  path: "roles",
  icon: "Security",
  group: "User Management",
  description:
    "Define roles and their permissions. Users are assigned a role which controls what they can access in the LMS.",
  propertiesOrder: [
    "key",
    "name",
    "description",
    "isSystem",
    "displayOrder",
    "permissions",
    "createdAt",
    "updatedAt",
  ],

  properties: {
    key: buildProperty({
      name: "Role Key",
      dataType: "string",
      validation: { required: true, min: 2, max: 50 },
      description:
        "Unique identifier (e.g., ADMIN, CONTENT_MANAGER). Stored on user records.",
    }),

    name: buildProperty({
      name: "Display Name",
      dataType: "string",
      validation: { required: true, min: 2, max: 100 },
      description: "Human-readable role name shown in UI",
    }),

    description: buildProperty({
      name: "Description",
      dataType: "string",
      multiline: true,
      description: "Describe what this role is intended for",
    }),

    isSystem: buildProperty({
      name: "System Role",
      dataType: "boolean",
      description:
        "System roles (ADMIN, CONTENT_MANAGER, REGISTERED_USER) cannot be deleted",
      readOnly: true,
    }),

    displayOrder: buildProperty({
      name: "Display Order",
      dataType: "number",
      validation: { required: true, min: 0 },
      description: "Controls sort order in dropdowns (lower = first)",
    }),

    permissions: buildProperty({
      name: "Permissions",
      dataType: "map",
      description: "Toggle which permissions this role grants",
      properties: Object.fromEntries(
        Object.entries(permissionKeys).map(([key, label]) => [
          key,
          buildProperty({
            name: label,
            dataType: "boolean",
          }),
        ])
      ),
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
