import { buildCollection, buildProperty, EntityReference } from "@firecms/core";

/**
 * Community Posts Collection
 * Forum posts with moderation support
 * Per TRD: Flagging and moderation confirmed as critical
 */

// Post status enum - includes flagged state per TRD
const statusValues = {
  active: "Active",
  flagged: "Flagged (Needs Review)",
  deleted: "Deleted",
};

export interface CommunityPost {
  authorId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  isFlagged: boolean;
  flagReason?: string;
  flaggedAt?: string;
  flaggedBy?: EntityReference;
  moderatedBy?: EntityReference;
  moderatedAt?: string;
  moderationNotes?: string;
  status: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export const communityPostsCollection = buildCollection<CommunityPost>({
  id: "communityPosts",
  name: "Community Posts",
  singularName: "Community Post",
  path: "communityPosts",
  icon: "Forum",
  group: "Community",
  description: "Community forum posts with moderation tools",

  permissions: () => ({
    read: true,
    edit: true,
    create: true,
    delete: true,
  }),

  properties: {
    authorId: buildProperty({
      name: "Author",
      dataType: "string",
      validation: { required: true },
      description: "Post author (user ID)",
    }),

    title: buildProperty({
      name: "Title",
      dataType: "string",
      validation: { required: true, min: 5, max: 200 },
      description: "Post title",
    }),

    content: buildProperty({
      name: "Content",
      dataType: "string",
      multiline: true,
      markdown: true,
      validation: { required: true },
      description: "Post content (supports Markdown)",
    }),

    category: buildProperty({
      name: "Category",
      dataType: "string",
      description: "Post category",
    }),

    tags: buildProperty({
      name: "Tags",
      dataType: "array",
      of: {
        dataType: "string",
      },
      description: "Post tags for filtering",
    }),

    // Moderation fields
    isPinned: buildProperty({
      name: "Pinned",
      dataType: "boolean",
      description: "Pin to top of list",
    }),

    isFlagged: buildProperty({
      name: "Flagged",
      dataType: "boolean",
      description: "Has been flagged for review",
    }),

    flagReason: buildProperty({
      name: "Flag Reason",
      dataType: "string",
      multiline: true,
      description: "Reason for flagging",
    }),

    flaggedAt: buildProperty({
      name: "Flagged At",
      dataType: "string",
      description: "When the post was flagged",
    }),

    flaggedBy: buildProperty({
      name: "Flagged By",
      dataType: "reference",
      path: "users",
      description: "User who flagged the post",
    }),

    moderatedBy: buildProperty({
      name: "Moderated By",
      dataType: "reference",
      path: "users",
      description: "Admin who reviewed/moderated the post",
    }),

    moderatedAt: buildProperty({
      name: "Moderated At",
      dataType: "string",
      description: "When moderation action was taken",
    }),

    moderationNotes: buildProperty({
      name: "Moderation Notes",
      dataType: "string",
      multiline: true,
      description: "Admin notes about moderation actions",
    }),

    status: buildProperty({
      name: "Status",
      dataType: "string",
      enumValues: statusValues,
      validation: { required: true },
      description: "Post status",
    }),

    viewCount: buildProperty({
      name: "View Count",
      dataType: "number",
      readOnly: true,
      description: "Number of views",
    }),

    commentCount: buildProperty({
      name: "Comment Count",
      dataType: "number",
      readOnly: true,
      description: "Number of comments",
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

  // Subcollection for comments
  subcollections: [
    buildCollection({
      id: "comments",
      name: "Comments",
      singularName: "Comment",
      path: "comments",
      icon: "Comment",
      description: "Comments on this post",

      properties: {
        authorId: buildProperty({
          name: "Author",
          dataType: "reference",
          path: "users",
          validation: { required: true },
        }),

        content: buildProperty({
          name: "Content",
          dataType: "string",
          multiline: true,
          validation: { required: true },
        }),

        isFlagged: buildProperty({
          name: "Flagged",
          dataType: "boolean",
        }),

        flagReason: buildProperty({
          name: "Flag Reason",
          dataType: "string",
        }),

        moderatedBy: buildProperty({
          name: "Moderated By",
          dataType: "reference",
          path: "users",
        }),

        status: buildProperty({
          name: "Status",
          dataType: "string",
          enumValues: statusValues,
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
    }),
  ],
});
