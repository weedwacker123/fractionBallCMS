/**
 * FractionBall CMS - FireCMS v3 Self-Hosted Implementation
 * A complete CMS for managing educational content in Firebase
 */

import { useEffect, useState } from "react";
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
  buildRolesCollection,
  permissionKeys,
  taxonomiesCollection,
  menuItemsCollection,
  faqsCollection,
  buildCommunityPostsCollection,
  rolesCollection,
} from "./collections";
import type { Role } from "./collections";

const ROLE_CACHE_TTL_MS = 60_000;
const COMMUNITY_CATEGORY_CACHE_TTL_MS = 60_000;
const FIRESTORE_OP_TIMEOUT_MS = 4_000;
let cachedRolesByKey: Map<string, Partial<Role>> | null = null;
let cachedRoleEnumValues: EnumValueConfig[] | null = null;
let rolesCacheExpiresAt = 0;
let cachedCommunityCategoryEnumValues: EnumValueConfig[] | null = null;
let communityCategoryCacheExpiresAt = 0;
let rolesLoadInFlight: Promise<void> | null = null;
let communityLoadInFlight: Promise<void> | null = null;

function isRolesCacheFresh() {
  return Date.now() < rolesCacheExpiresAt;
}

function isCommunityCategoryCacheFresh() {
  return Date.now() < communityCategoryCacheExpiresAt;
}

function clearDynamicCaches() {
  cachedRolesByKey = null;
  cachedRoleEnumValues = null;
  rolesCacheExpiresAt = 0;
  cachedCommunityCategoryEnumValues = null;
  communityCategoryCacheExpiresAt = 0;
}

if (typeof window !== "undefined") {
  window.addEventListener("fractionball:roles-changed", () => {
    clearDynamicCaches();
  });
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      reject(new Error(`${label} timed out after ${FIRESTORE_OP_TIMEOUT_MS}ms`));
    }, FIRESTORE_OP_TIMEOUT_MS);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function toPermissionLabel(permissionKey: string): string {
  return permissionKey
    .split("_")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
    .join(" ");
}

function primeRolesCacheInBackground() {
  if (rolesLoadInFlight || (cachedRoleEnumValues && isRolesCacheFresh())) return;
  rolesLoadInFlight = loadRolesCache(true)
    .then(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("fractionball:roles-loaded"));
      }
    })
    .catch((error) => {
      console.warn("Background roles load failed:", error);
    })
    .finally(() => {
      rolesLoadInFlight = null;
    });
}

function primeCommunityCategoriesInBackground() {
  if (communityLoadInFlight || (cachedCommunityCategoryEnumValues && isCommunityCategoryCacheFresh())) return;
  communityLoadInFlight = loadCommunityCategoryEnumValues(true)
    .then(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("fractionball:community-categories-loaded"));
      }
    })
    .catch((error) => {
      console.warn("Background community category load failed:", error);
    })
    .finally(() => {
      communityLoadInFlight = null;
    });
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
  const roleSnapshot = await withTimeout(
    getDocs(collection(db, "roles")),
    "roles collection fetch"
  );

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
  const fromCache = cachedRolesByKey?.get(roleKey);
  if (fromCache) return fromCache;

  const db = getFirestore();
  const roleByKey = await withTimeout(
    getDocs(query(collection(db, "roles"), where("key", "==", roleKey), limit(1))),
    "role-by-key fetch"
  );
  const roleData = roleByKey.docs[0]?.data() as Partial<Role> | undefined;
  if (!roleData) return undefined;

  if (!cachedRolesByKey) cachedRolesByKey = new Map<string, Partial<Role>>();
  const normalizedKey = (roleData.key ?? roleKey) as string;
  cachedRolesByKey.set(normalizedKey, roleData);
  return roleData;
}

async function loadCommunityCategoryEnumValues(forceRefresh = false): Promise<EnumValueConfig[]> {
  if (!forceRefresh && cachedCommunityCategoryEnumValues && isCommunityCategoryCacheFresh()) {
    return cachedCommunityCategoryEnumValues;
  }

  const db = getFirestore();
  const snapshot = await withTimeout(
    getDocs(
      query(
        collection(db, "taxonomies"),
        where("type", "==", "community_category"),
        where("active", "==", true)
      )
    ),
    "community categories fetch"
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
    const userSnap = await withTimeout(
      getDoc(doc(db, "users", user.uid)),
      "user role lookup"
    );
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
      roleData = (
        await withTimeout(getDoc(doc(db, "roles", roleKey)), "role doc lookup")
      ).data() as Partial<Role> | undefined;
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
  const communityEnumValues = cachedCommunityCategoryEnumValues;
  if (!communityEnumValues || !isCommunityCategoryCacheFresh()) {
    primeCommunityCategoriesInBackground();
  }
  const communityPosts = communityEnumValues && communityEnumValues.length > 0
    ? buildCommunityPostsCollection(communityEnumValues)
    : buildCommunityPostsCollection();

  const roleEnumValues = cachedRoleEnumValues;
  if (!roleEnumValues || !isRolesCacheFresh()) {
    primeRolesCacheInBackground();
  }
  const users = roleEnumValues && roleEnumValues.length > 0
    ? buildUsersCollection(roleEnumValues)
    : buildUsersCollection();

  let dynamicRolesCollection = rolesCollection;
  if (cachedRolesByKey && cachedRolesByKey.size > 0) {
    const dynamicPermissionLabels: Record<string, string> = { ...permissionKeys };
    cachedRolesByKey.forEach((role) => {
      const permissions = role.permissions ?? {};
      Object.keys(permissions).forEach((permissionKey) => {
        if (!dynamicPermissionLabels[permissionKey]) {
          dynamicPermissionLabels[permissionKey] = toPermissionLabel(permissionKey);
        }
      });
    });
    dynamicRolesCollection = buildRolesCollection(dynamicPermissionLabels);
  }

  return [
    { ...activitiesCollection, databaseId: "default" },
    { ...menuItemsCollection, databaseId: "default" },
    { ...faqsCollection, databaseId: "default" },
    { ...communityPosts, databaseId: "default" },
    { ...taxonomiesCollection, databaseId: "default" },
    { ...dynamicRolesCollection, databaseId: "default" },
    { ...users, databaseId: "default" },
  ];
};

export default function FireCMSApp() {
  const [appKey, setAppKey] = useState(0);

  useEffect(() => {
    const onRolesLoaded = () => setAppKey((k) => k + 1);
    const onCommunityLoaded = () => setAppKey((k) => k + 1);
    window.addEventListener("fractionball:roles-loaded", onRolesLoaded);
    window.addEventListener("fractionball:community-categories-loaded", onCommunityLoaded);
    primeRolesCacheInBackground();
    primeCommunityCategoriesInBackground();
    return () => {
      window.removeEventListener("fractionball:roles-loaded", onRolesLoaded);
      window.removeEventListener("fractionball:community-categories-loaded", onCommunityLoaded);
    };
  }, []);

  return (
    <FireCMSFirebaseApp
      key={appKey}
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
