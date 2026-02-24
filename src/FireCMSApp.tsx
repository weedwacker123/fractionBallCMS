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
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

/**
 * Authenticator — checks user's Firestore role for CMS permissions.
 * Denies access if user lacks both cms_view and cms_edit.
 * Sets FireCMS roles so collections enforce read-only vs edit.
 */
const fractionBallAuthenticator: Authenticator<FirebaseUserWrapper> = async ({
  user,
  authController,
}) => {
  if (!user) return false;

  try {
    const db = getFirestore();

    // Look up user document by Firebase UID
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (!userSnap.exists()) {
      console.warn("CMS auth: no user document found for", user.uid);
      return false;
    }

    const roleKey = userSnap.data()?.role;
    if (!roleKey) {
      console.warn("CMS auth: user has no role assigned");
      return false;
    }

    // Fetch role permissions
    const roleSnap = await getDoc(doc(db, "roles", roleKey));
    const permissions = roleSnap.data()?.permissions || {};
    const hasCmsView = permissions.cms_view === true;
    const hasCmsEdit = permissions.cms_edit === true;

    if (!hasCmsView && !hasCmsEdit) {
      console.warn("CMS auth: role", roleKey, "lacks cms_view and cms_edit");
      return false;
    }

    // Set FireCMS roles for collection-level permission enforcement
    authController.setUserRoles?.([
      {
        id: roleKey,
        name: roleSnap.data()?.name || roleKey,
        isAdmin: roleKey === "ADMIN",
        defaultPermissions: {
          read: true,
          create: hasCmsEdit,
          edit: hasCmsEdit,
          delete: hasCmsEdit,
        },
      },
    ]);

    return true;
  } catch (error) {
    console.error("CMS auth: failed to check permissions", error);
    // Allow access on error to avoid locking out users during Firestore outages
    return true;
  }
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
