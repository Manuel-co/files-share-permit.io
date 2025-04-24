import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

export const metadata: Metadata = {
  title: "File Share App dashboard",
  description: "Upload, share and download files easily and securely",
};

const inter = Inter({ subsets: ["latin"] });

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
