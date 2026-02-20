import { buildCollection, buildProperty, EntityReference } from "@firecms/core";

/**
 * Activities Collection
 * Main educational activities with full taxonomy support
 * Required fields per TRD: title, videos (with title/caption), resources (with title/caption), lessonPdf
 */

// Grade level enum
const gradeLevelValues = {
  0: "Kindergarten",
  1: "Grade 1",
  2: "Grade 2",
  3: "Grade 3",
  4: "Grade 4",
  5: "Grade 5",
  6: "Grade 6",
  7: "Grade 7",
  8: "Grade 8",
  9: "Grade 9",
  10: "Grade 10",
  11: "Grade 11",
  12: "Grade 12",
};

// Status values
const statusValues = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

// Video types
const videoTypeValues = {
  prerequisite: "Prerequisite",
  instructional: "Instructional",
  related: "Related",
};

// Resource types
const resourceTypeValues = {
  pdf: "PDF",
  pptx: "PowerPoint",
  docx: "Word Doc",
};

// Location values for activities
const locationValues = {
  classroom: "Classroom",
  court: "Court",
  both: "Both",
};

// Icon type values
const iconTypeValues = {
  cone: "Cone",
  "bottle-cap": "Bottle Cap",
  person: "Person",
  ball: "Ball",
  basketball: "Basketball",
  pizza: "Pizza",
  hands: "Hands",
  running: "Running",
  "number-line": "Number Line",
  soccer: "Soccer",
  obstacle: "Obstacle",
  multiply: "Multiply",
  divide: "Divide",
  ratio: "Ratio",
  percent: "Percent",
  algebra: "Algebra",
  trophy: "Trophy",
  compare: "Compare",
};

// Activity type interface
export interface Activity {
  title: string;
  slug: string;
  description?: string;
  gradeLevel: number[];
  activityNumber: number;
  order: number;
  location: string;
  iconType: string;
  tags: string[];
  taxonomy: Record<string, any>;
  // Lesson content fields (matching the screenshot layout)
  estimatedTime?: number;
  learningObjectives?: string[];
  lessonOverview?: {
    partNumber: number;
    title: string;
    description: string;
  }[];
  materials?: string[];
  gameRules?: string[];
  keyTerms?: { [key: string]: string };
  // Prerequisites
  prerequisites?: string[];
  prerequisiteActivities?: EntityReference[];
  // Related Videos (direct uploads)
  relatedVideos?: {
    fileUrl: string;
    thumbnailUrl?: string;
    title: string;
    caption?: string;
    type: string;
    displayOrder: number;
    duration?: number;
  }[];
  // Teacher Resources (direct uploads)
  teacherResources?: {
    fileUrl: string;
    title: string;
    caption?: string;
    type: string;
  }[];
  // Student Resources (direct uploads)
  studentResources?: {
    fileUrl: string;
    title: string;
    caption?: string;
    type: string;
  }[];
  lessonPdf: string;
  thumbnailUrl?: string;
  status: string;
  createdBy?: EntityReference;
  createdAt: Date;
  updatedAt: Date;
}

export const activitiesCollection = buildCollection<Activity>({
  id: "activities",
  name: "Activities",
  singularName: "Activity",
  path: "activities",
  icon: "SportsBasketball",
  group: "Content",
  description: "Educational activities with videos, resources, and lesson plans",
  
  permissions: () => ({
    read: true,
    edit: true,
    create: true,
    delete: true,
  }),

  properties: {
    title: buildProperty({
      name: "Activity Title",
      dataType: "string",
      validation: { required: true, min: 3, max: 200 },
      description: "The title of this activity",
    }),

    slug: buildProperty({
      name: "URL Slug",
      dataType: "string",
      validation: { required: true },
      description: "URL-friendly identifier (e.g., 'half-and-half-hoops')",
    }),

    description: buildProperty({
      name: "Description",
      dataType: "string",
      multiline: true,
      markdown: true,
      description: "Detailed description of the activity (supports Markdown)",
    }),

    activityNumber: buildProperty({
      name: "Activity Number",
      dataType: "number",
      validation: { required: true, min: 1 },
      description: "Sequence number within the grade (1, 2, 3, etc.)",
    }),

    order: buildProperty({
      name: "Display Order",
      dataType: "number",
      validation: { min: 0 },
      description: "Order for display in lists (lower numbers appear first)",
    }),

    location: buildProperty({
      name: "Location",
      dataType: "string",
      enumValues: locationValues,
      validation: { required: true },
      description: "Where the activity takes place",
    }),

    iconType: buildProperty({
      name: "Icon Type",
      dataType: "string",
      enumValues: iconTypeValues,
      description: "Icon to display for this activity",
    }),

    gradeLevel: buildProperty({
      name: "Grade Levels",
      dataType: "array",
      of: {
        dataType: "number",
        enumValues: gradeLevelValues,
      },
      validation: { required: true, min: 1 },
      description: "Target grade levels for this activity",
    }),

    tags: buildProperty({
      name: "Tags",
      dataType: "array",
      of: {
        dataType: "string",
      },
      description: "Tags for categorization (e.g., fractions, decimals, court-1)",
    }),

    taxonomy: buildProperty({
      name: "Taxonomy",
      dataType: "map",
      keyValue: true,
      description: "Taxonomy tags for this activity. Keys should match taxonomy types (e.g., topic, court, classroom, standard). Values are the taxonomy value keys.",
    }),

    prerequisiteActivities: buildProperty({
      name: "Prerequisite Activities",
      dataType: "array",
      of: {
        dataType: "reference",
        path: "activities",
      },
      description: "Activities that should be completed before this one",
    }),

    // ========== LESSON CONTENT FIELDS ==========
    estimatedTime: buildProperty({
      name: "Estimated Time (minutes)",
      dataType: "number",
      validation: { min: 1 },
      description: "Estimated time to complete the activity in minutes (e.g., 45)",
    }),

    learningObjectives: buildProperty({
      name: "Learning Objectives",
      dataType: "array",
      of: {
        dataType: "string",
      },
      description: "What students will be able to do after completing this activity",
    }),

    lessonOverview: buildProperty({
      name: "Lesson Overview",
      dataType: "array",
      description: "Parts/sections of the lesson",
      of: {
        dataType: "map",
        properties: {
          partNumber: {
            name: "Part Number",
            dataType: "number",
            validation: { required: true, min: 1 },
          },
          title: {
            name: "Part Title",
            dataType: "string",
            validation: { required: true },
          },
          description: {
            name: "Description",
            dataType: "string",
            multiline: true,
            validation: { required: true },
          },
        },
      },
    }),

    materials: buildProperty({
      name: "Materials",
      dataType: "array",
      of: {
        dataType: "string",
      },
      description: "Materials needed for the activity (e.g., Running record, Pencil, Cones)",
    }),

    gameRules: buildProperty({
      name: "Game Rules",
      dataType: "array",
      of: {
        dataType: "string",
      },
      description: "Rules and instructions for the game/activity",
    }),

    keyTerms: buildProperty({
      name: "Key Terms",
      dataType: "map",
      keyValue: true,
      description: "Key terms and their definitions (term → definition)",
    }),

    // ========== DIRECT VIDEO UPLOADS (Related Videos) ==========
    relatedVideos: buildProperty({
      name: "Related Videos (Direct Upload)",
      dataType: "array",
      description: "Upload videos directly - these appear in the Related Videos section",
      of: {
        dataType: "map",
        properties: {
          fileUrl: {
            name: "Video File",
            dataType: "string",
            validation: { required: true },
            storage: {
              storagePath: "activity-videos",
              acceptedFiles: ["video/mp4", "video/webm", "video/quicktime"],
              maxSize: 500 * 1024 * 1024, // 500MB
              metadata: {
                cacheControl: "max-age=3600",
              },
            },
          },
          thumbnailUrl: {
            name: "Thumbnail",
            dataType: "string",
            storage: {
              storagePath: "thumbnails/activity-videos",
              acceptedFiles: ["image/*"],
              maxSize: 2 * 1024 * 1024, // 2MB
            },
          },
          title: {
            name: "Video Title",
            dataType: "string",
            validation: { required: true },
          },
          caption: {
            name: "Caption",
            dataType: "string",
            multiline: true,
          },
          type: {
            name: "Video Type",
            dataType: "string",
            enumValues: videoTypeValues,
            validation: { required: true },
          },
          displayOrder: {
            name: "Display Order",
            dataType: "number",
            validation: { required: true, min: 0 },
          },
          duration: {
            name: "Duration (seconds)",
            dataType: "number",
            validation: { min: 0 },
          },
        },
      },
    }),

    // ========== DIRECT TEACHER RESOURCES UPLOAD ==========
    teacherResources: buildProperty({
      name: "Teacher Resources (Direct Upload)",
      dataType: "array",
      description: "Upload teacher resources directly (PDFs, Excel sheets, etc.)",
      of: {
        dataType: "map",
        properties: {
          fileUrl: {
            name: "Resource File",
            dataType: "string",
            validation: { required: true },
            storage: {
              storagePath: "activity-resources/teacher",
              acceptedFiles: [
                "application/pdf",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              ],
              maxSize: 50 * 1024 * 1024, // 50MB
              metadata: {
                cacheControl: "max-age=3600",
              },
            },
          },
          title: {
            name: "Resource Title",
            dataType: "string",
            validation: { required: true },
          },
          caption: {
            name: "Caption/Description",
            dataType: "string",
            multiline: true,
          },
          type: {
            name: "Resource Type",
            dataType: "string",
            enumValues: resourceTypeValues,
            validation: { required: true },
          },
        },
      },
    }),

    // ========== DIRECT STUDENT RESOURCES UPLOAD ==========
    studentResources: buildProperty({
      name: "Student Resources (Direct Upload)",
      dataType: "array",
      description: "Upload student resources directly (worksheets, handouts, etc.)",
      of: {
        dataType: "map",
        properties: {
          fileUrl: {
            name: "Resource File",
            dataType: "string",
            validation: { required: true },
            storage: {
              storagePath: "activity-resources/student",
              acceptedFiles: [
                "application/pdf",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              ],
              maxSize: 50 * 1024 * 1024, // 50MB
              metadata: {
                cacheControl: "max-age=3600",
              },
            },
          },
          title: {
            name: "Resource Title",
            dataType: "string",
            validation: { required: true },
          },
          caption: {
            name: "Caption/Description",
            dataType: "string",
            multiline: true,
          },
          type: {
            name: "Resource Type",
            dataType: "string",
            enumValues: resourceTypeValues,
            validation: { required: true },
          },
        },
      },
    }),

    lessonPdf: buildProperty({
      name: "Lesson Plan PDF",
      dataType: "string",
      // validation: { required: true },  // Relaxed: Django seeds with empty string
      storage: {
        storagePath: "lesson-plans",
        acceptedFiles: ["application/pdf"],
        maxSize: 10 * 1024 * 1024, // 10MB
        metadata: {
          cacheControl: "max-age=3600",
        },
      },
      description: "Upload the lesson plan PDF (required)",
    }),

    thumbnailUrl: buildProperty({
      name: "Thumbnail Image",
      dataType: "string",
      storage: {
        storagePath: "thumbnails/activities",
        acceptedFiles: ["image/*"],
        maxSize: 2 * 1024 * 1024, // 2MB
        metadata: {
          cacheControl: "max-age=86400",
        },
      },
      description: "Activity thumbnail image",
    }),

    status: buildProperty({
      name: "Status",
      dataType: "string",
      enumValues: statusValues,
      validation: { required: true },
      description: "Publication status",
    }),

    createdBy: buildProperty({
      name: "Created By",
      dataType: "reference",
      path: "users",
      readOnly: true,
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
