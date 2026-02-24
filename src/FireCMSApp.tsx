/**
 * FractionBall CMS - FireCMS v3 Self-Hosted Implementation
 * A complete CMS for managing educational content in Firebase
 */

import { FireCMSFirebaseApp, FirebaseUserWrapper } from "@firecms/firebase";
import {
  Authenticator,
  EntityCollectionsBuilder,
  EnumValueConfig,
} from "@firecms/core";

import { firebaseConfig } from "./firebase-config";

// Import all collections
import {
  activitiesCollection,
  buildUsersCollection,
  taxonomiesCollection,
  menuItemsCollection,
  faqsCollection,
  buildCommunityPostsCollection,
  rolesCollection,
} from "./collections";
import type { Taxonomy, Role } from "./collections";

// Authenticator — Firebase Auth handles login; just allow all authenticated users.
const fractionBallAuthenticator: Authenticator<FirebaseUserWrapper> = async () => {
  return true;
};

/**
 * Collections builder that fetches dynamic data from Firestore:
 * 1. community_category taxonomy → communityPosts category enum
 * 2. roles → users role enum
 */
const collectionsBuilder: EntityCollectionsBuilder = async ({ dataSource }) => {
  let communityPosts;
  let users;

  // Fetch community categories (existing logic)
  try {
    const taxonomyEntities = await dataSource.fetchCollection<Taxonomy>({
      path: "taxonomies",
      filter: {
        type: ["==", "community_category"],
        active: ["==", true],
      },
    });

    const enumValues: EnumValueConfig[] = [];
    for (const entity of taxonomyEntities) {
      const values = entity.values?.values ?? [];
      for (const v of values) {
        if (v.key && v.label) {
          enumValues.push({ id: v.key, label: v.label });
        }
      }
    }

    communityPosts = enumValues.length > 0
      ? buildCommunityPostsCollection(enumValues)
      : buildCommunityPostsCollection();
  } catch (error) {
    console.warn(
      "Failed to fetch community_category taxonomy, using defaults:",
      error
    );
    communityPosts = buildCommunityPostsCollection();
  }

  // Fetch roles for dynamic user role dropdown
  try {
    const roleEntities = await dataSource.fetchCollection<Role>({
      path: "roles",
    });

    const roleEnumValues: EnumValueConfig[] = roleEntities
      .map((entity) => ({
        id: entity.values.key,
        label: entity.values.name,
        order: entity.values.displayOrder ?? 999,
      }))
      .sort((a, b) => (a.order as number) - (b.order as number))
      .map(({ id, label }) => ({ id, label }));

    users = roleEnumValues.length > 0
      ? buildUsersCollection(roleEnumValues)
      : buildUsersCollection();
  } catch (error) {
    console.warn(
      "Failed to fetch roles, using default role values:",
      error
    );
    users = buildUsersCollection();
  }

  return [
    { ...activitiesCollection, databaseId: "default" },
    { ...menuItemsCollection, databaseId: "default" },
    { ...faqsCollection, databaseId: "default" },
    { ...communityPosts, databaseId: "default" },
    { ...taxonomiesCollection, databaseId: "default" },
    { ...rolesCollection, databaseId: "default" },
    { ...users, databaseId: "default" },
  ];
};

export default function FireCMSApp() {
  return (
    <FireCMSFirebaseApp
      name="FractionBall CMS"
      firebaseConfig={firebaseConfig}
      collections={collectionsBuilder}
      authenticator={fractionBallAuthenticator}
      signInOptions={["google.com"]}
      dateTimeFormat="MMMM dd, yyyy HH:mm"
      allowSkipLogin={false}
      autoOpenDrawer={false}
    />
  );
}
