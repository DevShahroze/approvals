import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";

export const metadata = {
  title: "Job Approvals — Automation Hub",
  description: "Personal AI job application platform with mandatory approval",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
