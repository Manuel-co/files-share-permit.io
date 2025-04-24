import { useEffect, useState } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";

const db = getFirestore();

export interface File {
  id: string;
  title: string;
  description: string;
  type: string;
  size: string;
  uploadedAt: string;
  sharedWith?: { email: string; role: string; expiry: string }[];
  owner?: string;
  role?: string;
  file: string;
}

const getUserRole = async (userId: string) => {
  try {
    const response = await fetch("/api/get-user-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    console.log("this is 🔥🔥🔥🔥🔥🔥", data);

    if (!response.ok) {
      console.error(`Error fetching role:`, data.error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error calling getUserRole API:`, error);
    return null;
  }
};

const removeExpiredFile = async (userEmail: string, fileId: string) => {
  try {
    const userDocRef = doc(db, "users", userEmail);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) return;

    const userData = userDocSnap.data();
    const updatedFiles = userData.filesSharedWith.filter(
      (file: File) => file.id !== fileId
    );

    await updateDoc(userDocRef, { filesSharedWith: updatedFiles });

    console.log(`Expired file ${fileId} removed successfully.`);
  } catch (error) {
    console.error(`Error removing expired file ${fileId}:`, error);
  }
};

const useSharedFiles = (userEmail: string) => {
  const [sharedFiles, setSharedFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchSharedFiles = async () => {
      if (!userEmail) return;
      try {
        // Query Firestore for the user document using their email
        const q = query(
          collection(db, "users"),
          where("email", "==", userEmail)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.warn("User document not found.");
          return;
        }

        const userDocSnap = querySnapshot.docs[0]; // Get the first matching document
        const userData = userDocSnap.data(); // Extract data

        console.log("User Document:", userData);

        const { filesSharedWith } = userData;
        if (!filesSharedWith || filesSharedWith.length === 0) return;

        const now = Date.now();
        const updatedFiles = [];

        // Fetch user roles for all shared files in one request
        const rolesResponse = await getUserRole(userEmail);

        if (!rolesResponse || !rolesResponse.roles) {
          console.warn("No roles returned from Permit.");
          return;
        }

        interface RoleEntry {
          fileId: string;
          role: string;
        }

        const rolesMap = new Map(
          rolesResponse.roles.map((entry: RoleEntry) => [
            entry.fileId,
            entry.role,
          ])
        );

        for (const file of filesSharedWith) {
          const { id: fileId, expiry } = file;

          if (expiry && now >= expiry) {
            await removeExpiredFile(userEmail, fileId);
            continue;
          }

          // Match the role from the response based on fileId
          const role = rolesMap.get(fileId) || null;
          console.log(`Role for ${fileId} from permit:`, role);

          updatedFiles.push({ ...file, role });
        }

        setSharedFiles(updatedFiles);
      } catch (error) {
        console.error("Error fetching shared files:", error);
      }
    };

    fetchSharedFiles();
  }, [userEmail]);

  return sharedFiles;
};

export default useSharedFiles;
