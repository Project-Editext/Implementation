import { Geist, Geist_Mono } from "next/font/google";
import '/public/css/globals.css'
import '/public/css/styles.css'
import Header from "@/components/Header";
import { ClerkProvider } from '@clerk/nextjs';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Editext Application",
  description: "Editext is a robust interactive text editor created to streamline document editing",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body 
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <Header/>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

