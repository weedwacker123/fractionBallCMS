import { buildCollection, buildProperties, buildProperty } from "@firecms/core";

/**
 * Roles Collection
 * Dynamic role definitions with configurable permissions.
 * Roles control what LMS sections a user can access.
 */

// All permission keys the LMS recognizes.
// Keep in sync with PERMISSION_KEYS in LMS accounts/role_service.py
export const permissionKeys: Record<string, string> = {
  "cms_view": "CMS: View",
  "cms_edit": "CMS: Edit",
  "activities_view": "Activities: View",
  "resources_download": "Resources: Download",
  "community_view": "Community: View",
  "community_post": "Community: Post",
  "community_moderate": "Community: Moderate",
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

function buildPermissionProperties(keys: Record<string, string>) {
  return buildProperties<Record<string, boolean>>(
    Object.entries(keys).reduce((acc, [key, label]) => {
      acc[key] = {
        name: label,
        dataType: "boolean",
      };
      return acc;
    }, {} as Record<string, { name: string; dataType: "boolean" }>)
  );
}

export function buildRolesCollection(dynamicPermissionKeys?: Record<string, string>) {
  const mergedPermissionKeys: Record<string, string> = {
    ...permissionKeys,
    ...(dynamicPermissionKeys ?? {}),
  };

  const permissionProperties = buildPermissionProperties(mergedPermissionKeys);

  return buildCollection<Role>({
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

    callbacks: {
      onPreSave: ({ values, status }) => {
        const now = new Date();
        if (status === "new" || status === "copy") {
          values.createdAt = now;
        }
        values.updatedAt = now;

        // Normalize key to UPPER_SNAKE_CASE
        if (values.key) {
          values.key = values.key
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_")
            .replace(/[^A-Z0-9_]/g, "");
        }

        return values;
      },
      onSaveSuccess: ({ context }) => {
        // Re-run collectionsBuilder so the Users role dropdown picks up changes
        context.navigation.refreshNavigation();
      },
      onDelete: ({ context }) => {
        context.navigation.refreshNavigation();
      },
    },

    properties: {
      key: buildProperty({
        name: "Role Key",
        dataType: "string",
        validation: { required: true, min: 2, max: 50 },
        description:
          "Unique identifier (e.g., ADMIN, CONTENT_MANAGER). Auto-converted to UPPER_SNAKE_CASE.",
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

      permissions: buildProperty<Record<string, boolean>>({
        name: "Permissions",
        dataType: "map",
        description: "Toggle which permissions this role grants",
        properties: permissionProperties,
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

export const rolesCollection = buildRolesCollection();
