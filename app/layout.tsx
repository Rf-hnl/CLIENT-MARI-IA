import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/modules/auth";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { GlobalStateProvider } from "@/contexts/GlobalStateContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Auth Module - Client Mar-IA",
  description: "Authentication module with Firebase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalStateProvider>
            <AuthProvider>
              <DashboardLayout>
                {children}
              </DashboardLayout>
            </AuthProvider>
          </GlobalStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
