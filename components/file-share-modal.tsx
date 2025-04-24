"use client"

import type React from "react"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2Icon, ShareIcon } from "lucide-react"
import { useFilesStore } from "@/states/useFilesStore"
import { toast } from "sonner"
import { auth, db } from "@/lib/firebase"
import { arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { File } from "@/app/(protected)/dashboard/page"

interface FileShareModalProps {
  isOpen: boolean
  onClose: () => void
  fileId: string
  fileName: string
  sharedWithMe: boolean
}

export function FileShareModal({ isOpen, onClose, fileName, sharedWithMe }: FileShareModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("")
  const [selectedRole, setSelectedRole] = useState("viewer")
  const [selectedDuration, setSelectedDuration] = useState("7 days")
  const [isSharing, setIsSharing] = useState(false)

  const getDurationInMs = (duration: string) => {
    const oneDayMs = 24 * 60 * 60 * 1000;
    switch (duration) {
      case "7 days":
        return 7 * oneDayMs;
      case "2 weeks":
        return 14 * oneDayMs;
      case "a month":
        return 30 * oneDayMs;
      default:
        return 0;
    }
  };



  const { selectedFile } = useFilesStore()

  const handleShare = async () => {
    if (!selectedFile || !auth.currentUser || !recipientEmail || !selectedRole || !selectedDuration) {
      toast.error("All fields are required!");
      return;
    }

    if (selectedRole === "admin" && selectedDuration !== "unlimited") {
      toast.error("Admin role can only have unlimited duration.");
      return;
    }

    setIsSharing(true);
    const expiryTimestamp = selectedDuration === "unlimited" ? null : Date.now() + getDurationInMs(selectedDuration);

    toast.promise(
      (async () => {
        // Step 1: Check if the recipient exists in Firestore
        const recipientQuery = query(collection(db, "users"), where("email", "==", recipientEmail));
        const recipientSnapshot = await getDocs(recipientQuery);

        if (recipientSnapshot.empty) {
          throw new Error("Recipient not found.");
        }

        const recipientDoc = recipientSnapshot.docs[0].ref;

        // Step 2: Update recipient's `filesSharedWith` array
        await updateDoc(recipientDoc, {
          filesSharedWith: arrayUnion({
            title: selectedFile.title,
            id: selectedFile.id,
            description: selectedFile.description,
            file: selectedFile.file,
            owner: auth.currentUser?.email as string,
            expiry: expiryTimestamp,
            type: selectedFile.type,
            uploadedAt: selectedFile.uploadedAt,
            size: selectedFile.size,
          }),
        });

        console.log("testing fire 🔥", selectedFile?.owner as string, auth.currentUser?.uid as string, sharedWithMe ? selectedFile?.owner as string : auth.currentUser?.uid as string)
        // const ownerDocRef = doc(db, "users", sharedWithMe ? selectedFile?.owner as string : auth.currentUser?.uid as string);
        let ownerDocRef;
        if (sharedWithMe) {
          // Query Firestore for the user document using their email
          const ownerQuery = query(collection(db, "users"), where("email", "==", selectedFile.owner));
          const ownerSnapshot = await getDocs(ownerQuery);

          if (ownerSnapshot.empty) {
            throw new Error("Owner document not found.");
          }

          ownerDocRef = ownerSnapshot.docs[0].ref; // Get the first matching document ref
        } else {
          ownerDocRef = doc(db, "users", auth.currentUser?.uid as string);
        }
        const ownerDocSnap = await getDoc(ownerDocRef);

        if (!ownerDocSnap.exists()) {
          throw new Error("Owner document not found.");
        }

        const ownerData = ownerDocSnap.data();
        const files = ownerData.files || [];

        // Update the correct file's `sharedWith` array
        const updatedFiles = files.map((file: File) => {
          if (file.id === selectedFile.id) {
            return {
              ...file,
              sharedWith: file.sharedWith
                ? [...file.sharedWith, { email: recipientEmail, role: selectedRole, expiry: expiryTimestamp }]
                : [{ email: recipientEmail, role: selectedRole, expiry: expiryTimestamp }],
            };
          }
          return file;
        });

        // Update Firestore with the modified files array
        await updateDoc(ownerDocRef, { files: updatedFiles });

        // Step 6: Add the file to the recipient's `filesSharedWith`
        // const recipientDocRef = doc(db, "users", recipientEmail);

        // console.log("this is recipeint 😔", recipientDocRef)
        // await updateDoc(recipientDocRef, {
        //   filesSharedWith: arrayUnion({
        //     ...selectedFile,
        //     role: selectedRole,
        //     expiry: expiryTimestamp,
        //     owner: selectedFile.owner, // Keep track of the original owner
        //   }),
        // });

        // toast.success("File shared successfully!");


        // Step 6: Assign the user to the file resource instance in Permit.io
        const permitResponse = await fetch("/api/add-user-to-permit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: recipientEmail, role: selectedRole, fileId: selectedFile.id }),
        });

        if (!permitResponse.ok) {
          throw new Error("Failed to assign user in Permit.io.");
        }

        return "File shared successfully!";
      })(),
      {
        loading: "Sharing file...",
        success: (message) => {
          setIsSharing(false);
          onClose();
          return message;
        },
        error: (error) => {
          setIsSharing(false);
          return error.message
            ? error.message
            : "Failed to share file. Please try again later.";
        }
      },
    );
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
          <DialogDescription>Share &quot;{fileName}&quot; with others</DialogDescription>
        </DialogHeader>
        <form>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Permission</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-600 bg-white">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-600 bg-white">
                    <SelectItem value="7 days">7 days</SelectItem>
                    <SelectItem value="2 weeks">2 weeks</SelectItem>
                    <SelectItem value="a month">A month</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSharing}>
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              disabled={!recipientEmail || isSharing}
            >
              {isSharing ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <ShareIcon className="mr-2 h-4 w-4" />
                  Share
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

