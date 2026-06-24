import MainLayout from "@/components/layout/MainLayout";

export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <MainLayout>{children}</MainLayout>;
}
