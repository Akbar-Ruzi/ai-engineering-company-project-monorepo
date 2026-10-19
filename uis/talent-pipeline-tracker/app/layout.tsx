import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { CandidateDraftsProvider } from "@/context/candidate-drafts";
import { CandidateUpdatesProvider } from "@/context/candidate-updates";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Talent Pipeline Tracker | HealthCore",
  description:
    "Manage HealthCore's recruitment pipeline: search candidates, track hiring statuses and stages, and maintain candidate details and internal interview notes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Shares saved candidates between the details and the list (all routes) */}
        <CandidateUpdatesProvider>
          {/* Keeps unsaved edits when switching between drawer and full page */}
          <CandidateDraftsProvider>{children}</CandidateDraftsProvider>
        </CandidateUpdatesProvider>
      </body>
    </html>
  );
}
