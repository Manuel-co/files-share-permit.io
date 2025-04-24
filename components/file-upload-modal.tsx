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
import { auth, db } from "@/lib/firebase" // Ensure Firebase is properly configured
import { toast } from "sonner"
import { arrayUnion, doc, setDoc } from "firebase/firestore"
import { useFilesStore } from "@/states/useFilesStore"
import { fetchUserFiles } from "@/lib/fetchUserFiles";
import { onAuthStateChanged, User } from "firebase/auth"
import { v4 as uuidv4 } from "uuid";


interface FileUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FileUploadModal({ isOpen, onClose }: FileUploadModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { setFiles } = useFilesStore()

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const loadFiles = async () => {
    if (user) {
      const userFiles = await fetchUserFiles(user.uid);
      setFiles(userFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Auto-fill title with file name if empty
      if (!title) {
        setTitle(selectedFile.name.split(".")[0])
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !auth.currentUser) return


    setIsUploading(true);

    try {
      // Step 1: Get signed URL
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileType: file.type, userId: auth.currentUser.uid }),
      });

      const { uploadUrl, fileKey } = await res.json();

      // Step 2: Upload file to S3
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      // Step 3: Construct Firestore record
      const fileUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileKey}`;
      const newFileRecord = {
        id: uuidv4(), // Generate a random unique ID
        file: fileUrl,
        title,
        description,
        type: file.type,
        size: (file.size / 1024).toFixed(2) + " KB", // Convert bytes to KB
        uploadedAt: new Date().toISOString(),
        sharedWith: [], // Initially empty
        owner: auth.currentUser.email, // owner's email
        role: "owner", // Default role for uploader
      };

      // Step 4: Save file record to Firestore
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        { files: arrayUnion(newFileRecord) },
        { merge: true }
      );
      toast.success("File uploaded successfully!");

      // Step 5: Create resource instance on permit
      try {
        // create resource instance on permit using the id of the file
        toast.promise(
          fetch("/api/permit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId: newFileRecord.id }),
          }),
          {
            loading: "Creating permit resource instance...",
            success: "Resource instance created successfully!",
            error: "Failed to create resource.",
          }
        );
      }
      catch (error) {
        console.error("Resource instance creation failed:", error);
        toast.error("Upload failed. Please try again.");
      }

      // ✅ Clear fields after upload
      setFile(null);
      setTitle("");
      setDescription("");
      onClose();
      // refetch user files
      loadFiles();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>Upload a file to your personal storage.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter file title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter file description (optional)"
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="file">File</Label>
              <div className="flex items-center gap-2">
                <Input id="file" type="file" onChange={handleFileChange} className="flex-1" required />
              </div>
              {file && (
                <p className="text-xs text-muted-foreground">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file || isUploading}>
              {isUploading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FileUpIcon className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

