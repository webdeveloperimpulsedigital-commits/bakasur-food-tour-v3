import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bhookasur.com'),
  title: "Bhookasur Ka Food Tour – Interactive Food Campaign & Contest",
  description: "Travel across iconic Indian restaurants with Bhookasur! Feed his legendary appetite, fill the food meter, experience the Gastrium moment, and participate in the grand campaign.",
  keywords: ["Bhookasur", "Food Tour", "Gastrium", "Indian Food", "Pune", "Mumbai", "Delhi", "Food Campaign"],
  openGraph: {
    title: "Bhookasur Ka Food Tour – Interactive Food Campaign",
    description: "Feed Bhookasur legendary dishes, fill the food meter, and win grand contest rewards!",
    type: "website",
    images: [
      {
        url: "/images/final-frames/food-tour-img.jpg",
        width: 1080,
        height: 1080,
        alt: "Bhookasur Ka Food Tour"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Bhookasur Ka Food Tour",
    description: "Feed Bhookasur legendary dishes, fill the food meter, and win grand contest rewards!",
    images: ["/images/final-frames/food-tour-img.jpg"]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}

