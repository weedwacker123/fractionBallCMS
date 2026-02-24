/**
 * Collection Exports
 * All FireCMS collection schemas for Fraction Ball Admin
 */

export { activitiesCollection } from "./activities";
export { taxonomiesCollection } from "./taxonomies";
export { menuItemsCollection } from "./menuItems";
export { faqsCollection } from "./faqs";
export { communityPostsCollection, buildCommunityPostsCollection } from "./communityPosts";
export { usersCollection, buildUsersCollection } from "./users";
export { siteConfigCollection } from "./siteConfig";
export { rolesCollection } from "./roles";

// Re-export types
export type { Activity } from "./activities";
export type { Taxonomy, TaxonomyValue } from "./taxonomies";
export type { MenuItem } from "./menuItems";
export type { FAQ } from "./faqs";
export type { CommunityPost } from "./communityPosts";
export type { User } from "./users";
export type { Role } from "./roles";
export type { SiteConfig } from "./siteConfig";


