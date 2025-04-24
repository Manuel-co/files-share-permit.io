"use client"
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { notFound } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export function FilePreview() {
  const searchParams = useSearchParams();
  const fileUrl = searchParams.get('file');

  if (!fileUrl) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <h1 className="text-xl font-semibold">File Preview</h1>
      {fileUrl ? (
        <div className="w-full max-w-3xl p-4 border rounded-lg shadow-lg bg-white">
          {fileUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
            <img src={fileUrl} alt="Preview" className="w-full h-auto rounded-lg" />
          ) : fileUrl.match(/\.(pdf)$/i) ? (
            <iframe src={fileUrl} className="w-full h-[500px] border rounded-lg" />
          ) : fileUrl.match(/\.(mp4|webm|ogg|mov|quicktime)$/i) ? (
            <video controls className="w-full rounded-lg">
              <source
                src={fileUrl}
                type={fileUrl.endsWith('.quicktime') ? 'video/quicktime' : `video/${fileUrl.split('.').pop()}`}
              />
              Your browser does not support the video tag.
            </video>
          ) : (
            <p className="text-gray-500">Preview not available for this file type.</p>
          )}
          <div className="mt-4">
            <a href={fileUrl} download className="block w-full">
              <button className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer w-full py-2 px-4 rounded-lg">
                Download File
              </button>
            </a>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">No file available to preview.</p>
      )}
    </div>
  );
}



export default function PreviewPage() {
  const searchParams = useSearchParams();
  const file = searchParams.get('file');

  if (!file) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Suspense
        fallback={
          <div className="container mx-auto py-8 px-4">
            <Card className="max-w-5xl mx-auto overflow-hidden">
              <div className="p-6 border-b">
                <div className="animate-pulse flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800" />
                  <div className="flex-1">
                    <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="animate-pulse flex flex-col items-center gap-4">
                  <div className="h-[400px] w-full bg-gray-200 dark:bg-gray-800 rounded-lg" />
                </div>
              </div>
            </Card>
          </div>
        }
      >
        <FilePreview />
      </Suspense>
    </div>
  );
} 