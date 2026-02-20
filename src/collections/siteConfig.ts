import { buildCollection, buildProperty } from "@firecms/core";

/**
 * Site Configuration Collection
 * Key-value store for site-wide settings
 * Allows admins to configure file limits, pagination, and other settings
 */

export interface SiteConfig {
  key: string;
  value: any;
  description: string;
  dataType: string;
  updatedAt: Date;
}

export const siteConfigCollection = buildCollection<SiteConfig>({
  id: "siteConfig",
  name: "Site Configuration",
  singularName: "Config",
  path: "siteConfig",
  icon: "Settings",
  group: "Configuration",
  description: "Site-wide configuration values (file limits, pagination, etc.)",

  properties: {
    key: buildProperty({
      name: "Config Key",
      dataType: "string",
      validation: { required: true },
      description: "Unique identifier (e.g., 'max_video_size', 'allowed_video_types')",
    }),

    value: buildProperty({
      name: "Value",
      dataType: "string",
      multiline: true,
      description: "Configuration value. Use JSON for arrays/objects.",
    }),

    description: buildProperty({
      name: "Description",
      dataType: "string",
      multiline: true,
      description: "Explain what this config does",
    }),

    dataType: buildProperty({
      name: "Data Type",
      dataType: "string",
      enumValues: {
        string: "String",
        number: "Number",
        boolean: "Boolean",
        json: "JSON (Array/Object)",
      },
      description: "Type of the value for proper parsing",
    }),

    updatedAt: buildProperty({
      name: "Updated At",
      dataType: "date",
      readOnly: true,
    }),
  },
});
