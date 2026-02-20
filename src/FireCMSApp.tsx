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
} from "./collections";

// Authenticator — Firebase Auth handles login; just allow all authenticated users.
const fractionBallAuthenticator: Authenticator<FirebaseUserWrapper> = async () => {
  return true;
};

const collections = [
  { ...activitiesCollection, databaseId: "default" },
  { ...menuItemsCollection, databaseId: "default" },
  { ...faqsCollection, databaseId: "default" },
  { ...communityPostsCollection, databaseId: "default" },
  { ...taxonomiesCollection, databaseId: "default" },
  { ...usersCollection, databaseId: "default" },
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
