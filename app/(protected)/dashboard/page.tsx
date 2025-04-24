// ./app/(protected)/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from '@/states/useAuthStore';
import { FileUploadModal } from "@/components/file-upload-modal"
import { FileCard } from "@/components/file-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusIcon } from "lucide-react"
import { Navbar } from "@/components/Navbar";
import { fetchUserFiles } from "@/lib/fetchUserFiles";
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, User } from "firebase/auth";
import { useFilesStore } from "@/states/useFilesStore";
import useSharedFiles from "@/lib/useSharedFiles";
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

export default function Dashboard() {

  // Mock shared data


  const { files, setFiles, setSharedFiles } = useFilesStore();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  useEffect(() => {
    const loadFiles = async () => {
      if (user) {
        const userFiles = await fetchUserFiles(user.uid);
        setFiles(userFiles);
      }
    };

    loadFiles();
  }, [user]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const sharedFilesData = useSharedFiles(user?.email as string);

  useEffect(() => {
    if (sharedFilesData) {
      setSharedFiles(sharedFilesData)
    }
  }, [sharedFilesData]);


  return (
    <Navbar>
      <div>Signed in as: <span className="font-medium text-blue-600">{useAuthStore.getState().email}</span></div>
      <section className="container mx-auto py-8 px-4 space-y-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Files</h1>
          <Button variant={"default"} className="!bg-blue-600 text-white" onClick={() => setIsUploadModalOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </div>

        <Tabs defaultValue="my-files" className="w-full">
          <TabsList className="mb-6 !bg-slate-100">
            <TabsTrigger value="my-files" className="cursor-pointer">My Files</TabsTrigger>
            <TabsTrigger value="shared" className="cursor-pointer">Shared with me</TabsTrigger>
          </TabsList>

          <TabsContent value="my-files" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files && files?.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shared" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedFilesData.map((file) => (
                <FileCard key={file.id} file={file} isSharedWithMe />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <FileUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
      </section>
    </Navbar>

  );
}





