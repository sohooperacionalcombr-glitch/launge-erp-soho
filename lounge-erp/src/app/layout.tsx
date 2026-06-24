import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "LoungeERP — Soho",
  description: "Sistema de gestão de camarotes e reservas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-night-900 text-white antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#252530",
              color: "#fff",
              border: "1px solid #3d3d4a",
            },
            success: { iconTheme: { primary: "#d4852a", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
