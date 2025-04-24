import { db } from "@/lib/firebase"; // Adjust import based on your project structure
import { doc, getDoc, getDocFromServer } from "firebase/firestore";

/**
 * Fetches the list of files for a given user from Firestore.
 * @param {string} userId - The ID of the authenticated user.
 * @returns {Promise<Array>} - An array of file objects or an empty array if no files exist.
 */
export const fetchUserFiles = async (userId: string) => {
  try {
    if (!userId) throw new Error("User ID is required");

    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDocFromServer(userDocRef); // 👈 Forces fresh fetch

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      return userData.files || []; // Return files array or empty array if not found
    }

    return [];
  } catch (error) {
    console.error("Error fetching user files:", error);
    return [];
  }
};
