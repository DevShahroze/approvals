"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getClientAuth, isClientFirebaseConfigured } from "@/lib/firebase/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
    if (bypass) {
      setDevMode(true);
      setUser({ uid: "dev-user", email: "dev@local.test" });
      setLoading(false);
      return;
    }

    if (!isClientFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    const auth = getClientAuth();
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        });
      }
    });
  }, []);

  async function loginEmail(email, password) {
    const auth = getClientAuth();
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function loginGoogle() {
    const auth = getClientAuth();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function logout() {
    if (devMode) {
      document.cookie = "session=; Max-Age=0; path=/";
      window.location.href = "/login";
      return;
    }
    const auth = getClientAuth();
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, loading, devMode, loginEmail, loginGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
