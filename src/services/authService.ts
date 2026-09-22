import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type Unsubscribe,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

export function observeAuthState(callback: (user: User | null) => void): Unsubscribe {
  if (!auth) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error("Firebase is not configured. Add .env.local with your VITE_FIREBASE_* values.");
  }

  const credential = await signInWithPopup(auth, googleProvider);
  await saveUserProfile(credential.user);
  return credential.user;
}

export async function signInAsGuest(): Promise<User> {
  if (!auth) {
    throw new Error("Firebase is not configured. Add .env.local with your VITE_FIREBASE_* values.");
  }

  const credential = await signInAnonymously(auth);
  await saveUserProfile(credential.user);
  return credential.user;
}

export async function signOutCurrentUser(): Promise<void> {
  if (!auth) {
    return;
  }

  await signOut(auth);
}

async function saveUserProfile(user: User): Promise<void> {
  if (!db) {
    return;
  }

  await setDoc(
    doc(db, "users", user.uid),
    {
      defaultDisplayName: user.displayName ?? "Guest",
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
