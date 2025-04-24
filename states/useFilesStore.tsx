import { File } from "@/app/(protected)/dashboard/page";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface FilesState {
  files: File[];
  sharedFiles: File[];
  setSharedFiles: (sharedFiles: File[]) => void;
  selectedFile: File;
  setSelectedFile: (selectedFile: File) => void;
  setFiles: (files: File[]) => void;
  clearFiles: () => void;
}

export const useFilesStore = create<FilesState>()(
  persist(
    (set) => ({
      files: [],
      sharedFiles: [],
      setSharedFiles: (sharedFiles) => set({ sharedFiles }),
      selectedFile: {} as File,
      setSelectedFile: (selectedFile) => set({ selectedFile }),
      setFiles: (files) => set({ files }),
      clearFiles: () => set({ files: [] }), // Clears files from state
    }),
    {
      name: "files-storage", // Key for localStorage
      storage: createJSONStorage(() => localStorage), // Persist using localStorage
      partialize: (state) => ({ files: state.files }), // Persist only files
    }
  )
);