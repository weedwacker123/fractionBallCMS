/**
 * FractionBall CMS - FireCMS v3 Self-Hosted Implementation
 * A complete CMS for managing educational content in Firebase
 */

import { FireCMSFirebaseApp, FirebaseUserWrapper } from "@firecms/firebase";
import { Authenticator } from "@firecms/core";

import { firebaseConfig } from "./firebase-config";

// Import all collections
import {
  activitiesCollection,
  usersCollection,
  taxonomiesCollection,
  menuItemsCollection,
  faqsCollection,
  communityPostsCollection,
  siteConfigCollection,
} from "./collections";

// Authenticator — let everyone sign in, then fetch their role.
// Non-admins get locked out at the collection permission level.
const fractionBallAuthenticator: Authenticator<FirebaseUserWrapper> = async ({
  user,
  authController,
  dataSourceDelegate,
}) => {
  if (!user?.email) return false;

  try {
    const userEntities = await dataSourceDelegate.fetchCollection({
      path: "users",
      filter: { email: ["==", user.email] },
    });

    if (userEntities && userEntities.length > 0) {
      const member = userEntities[0].values as { role?: string };
      authController.setExtra({ role: (member.role || "viewer").toLowerCase() });
    } else {
      authController.setExtra({ role: "viewer" });
    }
  } catch {
    authController.setExtra({ role: "viewer" });
  }

  return true;
};

const collections = [
  { ...activitiesCollection, databaseId: "default" },
  { ...menuItemsCollection, databaseId: "default" },
  { ...faqsCollection, databaseId: "default" },
  { ...communityPostsCollection, databaseId: "default" },
  { ...taxonomiesCollection, databaseId: "default" },
  { ...usersCollection, databaseId: "default" },
  { ...siteConfigCollection, databaseId: "default" },
];

export default function FireCMSApp() {
  return (
    <FireCMSFirebaseApp
      name="FractionBall CMS"
      firebaseConfig={firebaseConfig}
      collections={collections}
      authenticator={fractionBallAuthenticator}
      signInOptions={["google.com"]}
      dateTimeFormat="MMMM dd, yyyy HH:mm"
      allowSkipLogin={false}
      autoOpenDrawer={false}
    />
  );
}
