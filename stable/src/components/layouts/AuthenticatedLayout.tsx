import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layouts/Sidebar";
import AuthenticatedHeader from "./AuthenticatedHeader";
import { Footer } from "../ui/nav/Footer";

// Add these mappings to your breadcrumb logic
const pathSegmentToBreadcrumb: Record<string, string> = {
  dashboard: "Dashboard",
  horses: "Horses",
  notes: "Notes",
  inbox: "Inbox",
  calendar: "Calendar",
  "shoeings-approval-panel": "Admin Panel",
  customers: "Customers",
  edit: "Edit",
  new: "New",
};

// Update the breadcrumb generation to handle customer routes
const generateBreadcrumbs = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];
  let path = "";

  segments.forEach((segment, index) => {
    path += `/${segment}`;

    // Special handling for customer routes
    if (segment === "customers") {
      breadcrumbs.push({
        label: "Customers",
        href: "/shoeings-approval-panel?tab=customers",
      });
      return;
    }

    // Handle edit/new customer routes
    if (segment === "edit" || segment === "new") {
      breadcrumbs.push({
        label: segment === "edit" ? "Edit Customer" : "New Customer",
        href: path,
      });
      return;
    }

    // Skip IDs in breadcrumbs
    if (segments[index - 1] === "customers" && segment.length === 36) {
      return;
    }

    const label = pathSegmentToBreadcrumb[segment] || segment;
    breadcrumbs.push({
      label,
      href: path,
    });
  });

  return breadcrumbs;
};

export default function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col sm:ml-14">
        <AuthenticatedHeader />
        <main className="flex-1 p-4 sm:p-6 md:p-8 mt-2 sm:mt-0">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
