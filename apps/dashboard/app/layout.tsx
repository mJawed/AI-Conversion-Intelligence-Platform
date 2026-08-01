import type { Metadata } from "next";
import "./styles.css";
import { AccountProvider } from "./lib/account-context";

export const metadata: Metadata = {
  title: "AI Growth | Conversion Intelligence",
  description: "Understand visitor behaviour and improve website conversions."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to main content</a><AccountProvider>{children}</AccountProvider></body></html>;
}
