"use client"

import { useState } from "react"
import { FileShareModal } from "@/components/file-share-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  DownloadIcon,
  FileIcon,
  FileTextIcon,
  FileTypeIcon,
  MoreVerticalIcon,
  PencilIcon,
  ShareIcon,
  Trash2Icon,
  FileSpreadsheetIcon,
  FileIcon as FilePresentationIcon,
  FileArchiveIcon,
  Video,
  Image
} from "lucide-react"
import { File } from "@/app/(protected)/dashboard/page"
import Link from "next/link"
import { FileEditModal } from "@/components/file-edit-modal";
import { useFilesStore } from "@/states/useFilesStore"
import { auth, db } from "@/lib/firebase"
import { arrayRemove, doc, updateDoc } from "firebase/firestore"
import { toast } from "sonner"
import { fetchUserFiles } from "@/lib/fetchUserFiles"

interface FileCardProps {
  file: File
  isSharedWithMe?: boolean
}

export function FileCard({ file, isSharedWithMe = false }: FileCardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { setSelectedFile, selectedFile, setFiles } = useFilesStore()

  // Function to get the appropriate icon based on file type
  const getFileIcon = () => {
    console.log(file.type)
    const fileType = file?.type?.split("/")[0]
    switch (fileType) {
      case "application":
        switch (file.type) {
          case "application/pdf":
            return <FileTextIcon className="h-12 w-12 text-red-500" />
          case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            return <FileSpreadsheetIcon className="h-12 w-12 text-green-500" />
          case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
            return <FilePresentationIcon className="h-12 w-12 text-orange-500" />
          case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return <FileIcon className="h-12 w-12 text-blue-500" />
          case "application/zip":
            return <FileArchiveIcon className="h-12 w-12 text-purple-500" />
          default:
            return <FileTypeIcon className="h-12 w-12 text-gray-500" />
        }
      case "video":
        return <Video className="h-12 w-12 text-purple-500" />
      case "image":
        return <Image className="h-12 w-12 text-yellow-500" />
      default:
        return <FileTypeIcon className="h-12 w-12 text-gray-500" />
    }
  }

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }


  const handleDelete = async () => {
    if (!selectedFile || !auth.currentUser) return;

    toast.promise(
      (async () => {
        try {
          // Step 1: Delete file from AWS S3
          const res = await fetch("/api/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileUrl: selectedFile.file }),
          });

          if (!res.ok) throw new Error("Failed to delete file from S3");

          // Step 2: Remove file entry from Firestore
          const userDoc = doc(db, "users", auth.currentUser!.uid as string);
          await updateDoc(userDoc, {
            files: arrayRemove(selectedFile),
          });

          // Step 3: Delete Permit resource instance
          const permitRes = await fetch("/api/delete-permit-resource-instance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId: selectedFile.id }),
          });

          if (!permitRes.ok) throw new Error("Failed to delete Permit resource instance");

          // Step 4: Fetch updated files list
          setFiles(await fetchUserFiles(auth.currentUser!.uid as string));

          return "File deleted successfully!";
        } catch (error) {
          console.error("Delete failed:", error);
          throw error; // Ensures `toast.promise` only triggers the error message if there's an actual failure
        }
      })(),
      {
        loading: "Deleting file...",
        success: (msg) => msg, // Uses the returned success message
        error: "Delete failed. Please try again.",
      }
    );
  };



  return (
    <>
      <TooltipProvider>
        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <h3 className="font-semibold leading-none tracking-tight">{file.title}</h3>
              <p className="text-sm text-muted-foreground">
                {file.size} • {formatDate(file.uploadedAt)}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVerticalIcon className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href={`/dashboard/download?file=${file.file}`} className="flex gap-1 items-center" target="_blank">
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download
                  </Link>
                </DropdownMenuItem>
                {!isSharedWithMe && (
                  <>
                    <DropdownMenuItem onClick={() => {
                      setSelectedFile(file)
                      setIsShareModalOpen(true)
                    }
                    }>
                      <ShareIcon className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedFile(file)
                        setIsEditModalOpen(true)
                      }}
                    >
                      <PencilIcon className="mr-2 h-4 w-4" />
                      Edit details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        setSelectedFile(file)
                        handleDelete()
                      }}
                    >
                      <Trash2Icon className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}

                {
                  file.role?.toLowerCase() === "admin" ? (
                    <>
                      <DropdownMenuItem onClick={() => {
                        setSelectedFile(file)
                        setIsShareModalOpen(true)
                      }
                      }>
                        <ShareIcon className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          console.log("file selected", file)
                          setSelectedFile(file)
                          setIsEditModalOpen(true)
                        }}
                      >
                        <PencilIcon className="mr-2 h-4 w-4" />
                        Edit details
                      </DropdownMenuItem>
                    </>
                  ) : file.role?.toLowerCase() === "editor" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedFile(file)
                          setIsEditModalOpen(true)
                        }}
                      >
                        <PencilIcon className="mr-2 h-4 w-4" />
                        Edit details
                      </DropdownMenuItem>
                    </>
                  ) 
                }
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4 bg-muted/30 rounded-md">{getFileIcon()}</div>
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{file.description}</p>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            {isSharedWithMe ? (
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src="/placeholder.svg?height=24&width=24" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{file.owner}</span>
              </div>
            ) : (
              <div className="text-xs">
                <p className="mb-3">
                  Users with Access:
                </p>
                <div className="flex items-center">
                  {file.sharedWith && file.sharedWith.length > 0 ? (
                    <>
                      <ShareIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Shared with {file.sharedWith.length} {file.sharedWith.length === 1 ? "person" : "people"}
                      </span>
                    </>
                  ) : (
                    <Badge className="text-xs text-white bg-blue-800">Only you</Badge>
                  )}
                </div>
              </div>
            )}
            {isSharedWithMe && (
              <Badge variant="outline" className="text-xs">
                {file.role}
              </Badge>
            )}
          </CardFooter>

          <FileShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            fileId={file.id}
            fileName={file.title}
            sharedWithMe={isSharedWithMe}
          />
        </Card>
      </TooltipProvider>
      <FileEditModal sharedWithMe={isSharedWithMe} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </>
  )
}

