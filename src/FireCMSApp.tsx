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
  usersCollection,
  taxonomiesCollection,
  menuItemsCollection,
  faqsCollection,
  buildCommunityPostsCollection,
} from "./collections";
import type { Taxonomy } from "./collections";

// Authenticator — Firebase Auth handles login; just allow all authenticated users.
const fractionBallAuthenticator: Authenticator<FirebaseUserWrapper> = async () => {
  return true;
};

/**
 * Collections builder that fetches community_category taxonomy from Firestore
 * and injects dynamic enumValues into the communityPosts collection.
 */
const collectionsBuilder: EntityCollectionsBuilder = async ({ dataSource }) => {
  let communityPosts;

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

  return [
    { ...activitiesCollection, databaseId: "default" },
    { ...menuItemsCollection, databaseId: "default" },
    { ...faqsCollection, databaseId: "default" },
    { ...communityPosts, databaseId: "default" },
    { ...taxonomiesCollection, databaseId: "default" },
    { ...usersCollection, databaseId: "default" },
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
