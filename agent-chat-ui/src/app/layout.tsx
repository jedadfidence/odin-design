import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import { ClientProviders } from "./client-providers";

export const metadata: Metadata = {
  title: "Agent Chat",
  description: "Agent Chat UX by LangChain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;600;700&family=Google+Sans+Code:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
