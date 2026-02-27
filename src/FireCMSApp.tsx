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
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  where,
} from "firebase/firestore";

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
import type { Role } from "./collections";

const ROLE_CACHE_TTL_MS = 60_000;
const COMMUNITY_CATEGORY_CACHE_TTL_MS = 60_000;
let cachedRolesByKey: Map<string, Partial<Role>> | null = null;
let cachedRoleEnumValues: EnumValueConfig[] | null = null;
let rolesCacheExpiresAt = 0;
let cachedCommunityCategoryEnumValues: EnumValueConfig[] | null = null;
let communityCategoryCacheExpiresAt = 0;

function isRolesCacheFresh() {
  return Date.now() < rolesCacheExpiresAt;
}

function isCommunityCategoryCacheFresh() {
  return Date.now() < communityCategoryCacheExpiresAt;
}

async function loadRolesCache(forceRefresh = false): Promise<{
  byKey: Map<string, Partial<Role>>;
  enumValues: EnumValueConfig[];
}> {
  if (!forceRefresh && cachedRolesByKey && cachedRoleEnumValues && isRolesCacheFresh()) {
    return {
      byKey: cachedRolesByKey,
      enumValues: cachedRoleEnumValues,
    };
  }

  const db = getFirestore();
  const roleSnapshot = await getDocs(collection(db, "roles"));

  const byKey = new Map<string, Partial<Role>>();
  const roleEnumValues: Array<EnumValueConfig & { order: number }> = [];

  roleSnapshot.docs.forEach((roleDoc) => {
    const values = roleDoc.data() as Partial<Role> | undefined;
    const rawKey = values?.key;
    const rawName = values?.name;

    const key = typeof rawKey === "string" && rawKey.trim().length > 0
      ? rawKey.trim()
      : roleDoc.id;
    if (!key) return;

    const label = typeof rawName === "string" && rawName.trim().length > 0
      ? rawName.trim()
      : key;
    const order = typeof values?.displayOrder === "number" ? values.displayOrder : 999;

    byKey.set(key, { ...values, key, name: label });
    roleEnumValues.push({ id: key, label, order });
  });

  const sortedEnumValues = roleEnumValues
    .sort((a, b) => (a.order as number) - (b.order as number))
    .map(({ id, label }) => ({ id, label }));

  cachedRolesByKey = byKey;
  cachedRoleEnumValues = sortedEnumValues;
  rolesCacheExpiresAt = Date.now() + ROLE_CACHE_TTL_MS;

  return {
    byKey,
    enumValues: sortedEnumValues,
  };
}

async function getRoleByKey(roleKey: string): Promise<Partial<Role> | undefined> {
  const cached = await loadRolesCache();
  const fromCache = cached.byKey.get(roleKey);
  if (fromCache) return fromCache;

  const db = getFirestore();
  const roleByKey = await getDocs(
    query(collection(db, "roles"), where("key", "==", roleKey), limit(1))
  );
  const roleData = roleByKey.docs[0]?.data() as Partial<Role> | undefined;
  if (!roleData) return undefined;

  // Refresh and update cache map with discovered key.
  const refreshed = await loadRolesCache(true);
  const normalizedKey = (roleData.key ?? roleKey) as string;
  refreshed.byKey.set(normalizedKey, roleData);
  return roleData;
}

async function loadCommunityCategoryEnumValues(forceRefresh = false): Promise<EnumValueConfig[]> {
  if (!forceRefresh && cachedCommunityCategoryEnumValues && isCommunityCategoryCacheFresh()) {
    return cachedCommunityCategoryEnumValues;
  }

  const db = getFirestore();
  const snapshot = await getDocs(
    query(
      collection(db, "taxonomies"),
      where("type", "==", "community_category"),
      where("active", "==", true)
    )
  );

  const byId = new Map<string, EnumValueConfig>();
  snapshot.docs.forEach((docSnap) => {
    const values = (docSnap.data() as { values?: Array<{ key?: string; label?: string }> } | undefined)?.values ?? [];
    values.forEach((v) => {
      if (v.key && v.label) byId.set(v.key, { id: v.key, label: v.label });
    });
  });

  const enumValues = Array.from(byId.values());
  cachedCommunityCategoryEnumValues = enumValues;
  communityCategoryCacheExpiresAt = Date.now() + COMMUNITY_CATEGORY_CACHE_TTL_MS;
  return enumValues;
}

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

    // Fetch role permissions from short-lived in-memory cache
    let roleData = await getRoleByKey(roleKey);
    if (!roleData) {
      roleData = (await getDoc(doc(db, "roles", roleKey))).data() as Partial<Role> | undefined;
    }

    const permissions = roleData?.permissions || {};
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
        name: roleData?.name || roleKey,
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
const collectionsBuilder: EntityCollectionsBuilder = async () => {
  let communityPosts;
  let users;

  const [communityResult, rolesResult] = await Promise.allSettled([
    loadCommunityCategoryEnumValues(),
    loadRolesCache(),
  ]);

  if (communityResult.status === "fulfilled") {
    const enumValues = communityResult.value;
    communityPosts = enumValues.length > 0
      ? buildCommunityPostsCollection(enumValues)
      : buildCommunityPostsCollection();
  } else {
    console.warn(
      "Failed to fetch community_category taxonomy, using defaults:",
      communityResult.reason
    );
    communityPosts = buildCommunityPostsCollection();
  }

  if (rolesResult.status === "fulfilled") {
    const roleEnumValues = rolesResult.value.enumValues;
    users = roleEnumValues.length > 0
      ? buildUsersCollection(roleEnumValues)
      : buildUsersCollection();
  } else {
    console.warn(
      "Failed to fetch roles, using default role values:",
      rolesResult.reason
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
