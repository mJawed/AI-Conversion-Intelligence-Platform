import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "AI Growth | Conversion Intelligence",
  description: "Understand visitor behaviour and improve website conversions."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
