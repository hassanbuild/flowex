import type { ReactNode } from "react";
import { AppThemeProvider } from "../../components/AppThemeProvider";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AppThemeProvider>
      {children}
    </AppThemeProvider>
  );
}