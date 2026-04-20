import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AI Image Generator",
};

export default function ImageGeneratorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
