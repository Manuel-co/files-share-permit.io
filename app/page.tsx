"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We use a timeout to ensure router is ready
    const timeout = setTimeout(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        
        if (user) {
          router.push("/dashboard"); 
        } else {
          router.push("/login");
        }
        
        setLoading(false);
      }, (error) => {
        console.error("Auth state error:", error);
        router.push("/login");
        setLoading(false);
      });

      return () => {
        clearTimeout(timeout);
        unsubscribe();
      };
    }, 100);

    return () => clearTimeout(timeout);
  }, [router]);

  // More visible loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-700 border-l-blue-500 border-r-blue-700 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}