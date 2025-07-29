import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/modules/auth";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ClientsProvider } from "@/modules/clients/context/ClientsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Client Mar-IA",
  description: "Sistema de gestión de clientes y cobranza",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
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
          <AuthProvider>
            <ClientsProvider>
              <DashboardLayout>
                {children}
              </DashboardLayout>
            </ClientsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
