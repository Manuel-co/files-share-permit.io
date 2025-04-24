// lib/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "./firebase";
import Cookies from "js-cookie";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";

// Register User
export const registerUser = async (email: string, password: string) => {
  try {
    // Create the user account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Store user in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      createdAt: serverTimestamp(), // Add creation timestamp
    });

    return { success: true, user };
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred";

    if (error instanceof FirebaseError) {
      console.error("Firebase error:", error.code, error.message);
      errorMessage = error.message;
    } else if (error instanceof Error) {
      console.error("General error:", error.message);
      errorMessage = error.message;
    } else {
      console.error("Unexpected error:", error);
    }

    return { success: false, error: errorMessage };
  }
};

// Login User
export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const token = await userCredential.user.getIdToken(); // Get Firebase Auth Token

  // Store token in cookies
  // Save token to cookie
  Cookies.set("token", token, {
    expires: 7, // 7 days
    path: "/",
  });

  // Send token to API to store in a secure HTTP-only cookie
  // await fetch("/api/set-cookie", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ token }),
  //   credentials: "include", // Ensure cookies are sent with requests
  // });

  console.log("Login successful, token saved to cookie");
  return userCredential.user;
};

// Logout User
export const logoutUser = async () => {
  await signOut(auth);
  // Remove token from cookies
  Cookies.remove("token");
};
