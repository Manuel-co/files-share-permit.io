"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileUpIcon, Loader2Icon } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { toast } from "sonner"
import { doc, updateDoc, query, collection, getDocs, where, getDoc } from "firebase/firestore"
import { useFilesStore } from "@/states/useFilesStore"
import { fetchUserFiles } from "@/lib/fetchUserFiles"

interface FileEditModalProps {
  isOpen: boolean
  onClose: () => void
  sharedWithMe: boolean
}

export function FileEditModal({ isOpen, onClose, sharedWithMe }: FileEditModalProps) {
  const { selectedFile, setFiles } = useFilesStore()
  const [title, setTitle] = useState(selectedFile?.title || "")
  const [description, setDescription] = useState(selectedFile?.description || "")
  const [file, setFile] = useState<File | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)


  useEffect(() => {
    setTitle(selectedFile?.title || "")
    setDescription(selectedFile?.description || "")
    setFile(null)
  }, [selectedFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !auth.currentUser) return

    setIsUpdating(true)
    try {
      let newFileUrl = selectedFile.file
      let newFileKey = ""

      if (file && file.name !== selectedFile.file.split("/").pop()) {
        // Step 1: Delete old file from AWS
        await fetch("/api/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl: selectedFile.file }),
        })

        // Step 2: Upload new file to AWS
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileType: file.type, userId: auth.currentUser.uid }),
        })

        const { uploadUrl, fileKey } = await res.json()
        newFileKey = fileKey

        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        })

        newFileUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${newFileKey}`
      }

      // Check if title and description actually changed
      const isTitleChanged = title !== selectedFile.title;
      const isDescriptionChanged = description !== selectedFile.description;

      if (!isTitleChanged && !isDescriptionChanged && newFileUrl === selectedFile.file) {
        toast.info("No changes detected.")
        setIsUpdating(false)
        return
      }

      // Step 3: Update Firestore record
      // const userDoc = doc(db, "users", sharedWithMe ? selectedFile?.owner as string : auth.currentUser?.uid);
      // let userDocRef;
      // if (sharedWithMe) {
      //   // Query Firestore for the user document using their email
      //   const ownerQuery = query(collection(db, "users"), where("email", "==", selectedFile.owner));
      //   const ownerSnapshot = await getDocs(ownerQuery);

      //   if (ownerSnapshot.empty) {
      //     throw new Error("Owner document not found.");
      //   }

      //   userDocRef = ownerSnapshot.docs[0].ref; // Get the document reference
      // } else {
      //   userDocRef = doc(db, "users", auth.currentUser?.uid as string);
      // }

      // // Fetch the user document data
      // const userDocSnap = await getDoc(userDocRef);
      // if (!userDocSnap.exists()) {
      //   throw new Error("User document not found.");
      // }

      // const userData = userDocSnap.data();
      // const files = userData.files || [];

      // // Find and update the correct file in the `files` array
      // const updatedFiles = files.map((file: any) =>
      //   file.id === selectedFile.id
      //     ? {
      //       ...file,
      //       file: newFileUrl,
      //       title,
      //       description,
      //       uploadedAt: new Date().toISOString(),
      //     }
      //     : file
      // );

      // // Update Firestore with the modified files array
      // await updateDoc(userDocRef, { files: updatedFiles });

      let userDocRef;
      if (sharedWithMe) {
        // Query Firestore for the user document using their email
        const ownerQuery = query(collection(db, "users"), where("email", "==", selectedFile.owner));
        const ownerSnapshot = await getDocs(ownerQuery);

        if (ownerSnapshot.empty) {
          throw new Error("Owner document not found.");
        }

        userDocRef = ownerSnapshot.docs[0].ref; // Get the document reference
      } else {
        userDocRef = doc(db, "users", auth.currentUser?.uid as string);
      }

      // Fetch the owner's document data
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        throw new Error("User document not found.");
      }

      const userData = userDocSnap.data();
      const files = userData.files || [];

      // Find and update the correct file in the `files` array
      const updatedFiles = files.map((file: any) =>
        file.id === selectedFile.id
          ? {
            ...file,
            file: newFileUrl,
            title,
            description,
            uploadedAt: new Date().toISOString(),
          }
          : file
      );

      // Update Firestore with the modified files array
      await updateDoc(userDocRef, { files: updatedFiles });

      /** ---- Now update `filesSharedWith` for all users the file was shared with ---- */

      // Step 1: Fetch all users
      const allUsersQuery = query(collection(db, "users"));
      const allUsersSnapshot = await getDocs(allUsersQuery);

      // Step 2: Filter users who have the file in their `filesSharedWith`
      const usersWithFileShared = allUsersSnapshot.docs.filter((doc) => {
        const userData = doc.data();
        return userData.filesSharedWith?.some((file: any) => file.id === selectedFile.id);
      });

      // Step 3: Update the `filesSharedWith` array for each user
      const updateSharedPromises = usersWithFileShared.map(async (userDoc) => {
        const userDocRef = userDoc.ref;
        const userData = userDoc.data();

        const updatedSharedFiles = userData.filesSharedWith.map((file: any) =>
          file.id === selectedFile.id
            ? {
              ...file,
              file: newFileUrl,
              title,
              description,
              uploadedAt: new Date().toISOString(),
            }
            : file
        );

        return updateDoc(userDocRef, { filesSharedWith: updatedSharedFiles });
      });

      // Execute updates in parallel
      await Promise.all(updateSharedPromises);



      toast.success("File updated successfully!");
      setFile(null)
      onClose()
      setFiles(await fetchUserFiles(auth.currentUser.uid))
    } catch (error) {
      console.error("Update failed:", error)
      toast.error("Update failed. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit File</DialogTitle>
          <DialogDescription>Update file details or replace the file.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdate}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="file">Replace File (Optional)</Label>
              <Input id="file" type="file" onChange={handleFileChange} />
              {file && <p className="text-xs text-muted-foreground">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <FileUpIcon className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
