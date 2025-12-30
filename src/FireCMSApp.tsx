/**
 * FractionBall CMS - FireCMS v3 Self-Hosted Implementation
 * A complete CMS for managing educational content in Firebase
 */

import { FireCMSFirebaseApp, FirebaseUserWrapper } from "@firecms/firebase";
import { Authenticator } from "@firecms/core";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

import { firebaseConfig } from "./firebase-config";

// Direct Firestore test - bypasses FireCMS entirely
async function testDirectFirestore() {
  console.log("🔥 DIRECT TEST: Starting direct Firestore SDK test...");
  try {
    // Get or initialize Firebase app
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    console.log("🔥 DIRECT TEST: Firebase app initialized:", app.name);

    // Get Firestore instance - explicitly use "default" database (not "(default)")
    const db = getFirestore(app, "default");
    console.log("🔥 DIRECT TEST: Firestore instance obtained");
    console.log("🔥 DIRECT TEST: Project ID from config:", firebaseConfig.projectId);

    // Try to read activities collection directly
    console.log("🔥 DIRECT TEST: Attempting to read 'activities' collection...");
    const activitiesRef = collection(db, "activities");
    const snapshot = await getDocs(activitiesRef);

    console.log("🔥 DIRECT TEST: Query completed!");
    console.log("🔥 DIRECT TEST: Documents found:", snapshot.size);
    console.log("🔥 DIRECT TEST: Empty?", snapshot.empty);

    if (!snapshot.empty) {
      snapshot.forEach((doc) => {
        console.log("🔥 DIRECT TEST: Doc ID:", doc.id, "Data:", JSON.stringify(doc.data()).substring(0, 200));
      });
    } else {
      console.error("❌ DIRECT TEST: Collection is EMPTY - Firebase SDK returns no data!");
      console.error("❌ This confirms the issue is NOT FireCMS - it's Firebase SDK or AppCheck/permissions");
      console.error("📋 NEXT STEPS:");
      console.error("   1. Go to Firebase Console: https://console.firebase.google.com/project/fractionball-lms/appcheck");
      console.error("   2. If AppCheck is enabled, add localhost to debug tokens OR disable it temporarily");
      console.error("   3. Check API key restrictions: https://console.cloud.google.com/apis/credentials?project=fractionball-lms");
    }
  } catch (error) {
    console.error("❌ DIRECT TEST: Firestore query FAILED with error:", error);
  }
}

// Run the test immediately
testDirectFirestore();

// Import all collections
import {
  activitiesCollection,
  videosCollection,
  resourcesCollection,
  usersCollection,
  taxonomiesCollection,
  pagesCollection,
  menuItemsCollection,
  faqsCollection,
  communityPostsCollection,
} from "./collections";

// Custom authenticator - allows Google sign-in and checks admin access
const fractionBallAuthenticator: Authenticator<FirebaseUserWrapper> = async ({
  user,
  authController,
  dataSourceDelegate,
}) => {
  console.log("🔍 AUTH: Starting authentication for", user?.email);

  if (!user?.email) return false;

  try {
    // Test: Query users collection
    console.log("🔍 AUTH: Querying users collection...");
    const userEntities = await dataSourceDelegate.fetchCollection({
      path: "users",
      filter: { email: ["==", user.email] },
    });
    console.log("🔍 AUTH: Users query returned", userEntities?.length ?? 0, "results");

    // Test: Also query activities to diagnose the issue
    console.log("🔍 AUTH: Testing activities collection query...");
    const testActivities = await dataSourceDelegate.fetchCollection({
      path: "activities",
    });
    console.log("🔍 AUTH: Activities query returned", testActivities?.length ?? 0, "results");
    if (testActivities && testActivities.length > 0) {
      console.log("🔍 AUTH: First activity:", JSON.stringify(testActivities[0], null, 2));
    } else {
      console.warn("⚠️ AUTH: Activities collection is EMPTY - this is the problem!");
    }

    if (userEntities && userEntities.length > 0) {
      const member = userEntities[0].values as { role?: string };
      authController.setExtra({ role: member.role || "teacher" });
      return true;
    }

    // Allow first-time users (they'll be created as teachers)
    // For admin access, they need to be added to the users collection first
    authController.setExtra({ role: "teacher" });
    return true;
  } catch (error) {
    console.error("❌ AUTH: Firestore query FAILED:", error);
    // Still allow access even if user lookup fails
    authController.setExtra({ role: "teacher" });
    return true;
  }
};

// All collections for the CMS - explicitly set databaseId to "default"
const collections = [
  { ...activitiesCollection, databaseId: "default" },
  { ...videosCollection, databaseId: "default" },
  { ...resourcesCollection, databaseId: "default" },
  { ...pagesCollection, databaseId: "default" },
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
