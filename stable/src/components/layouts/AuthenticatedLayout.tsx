import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layouts/Sidebar";
import AuthenticatedHeader from "./AuthenticatedHeader";
import { Footer } from "../ui/nav/Footer";

export default function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col sm:ml-14">
        <AuthenticatedHeader />
        <main className="flex-1 p-4 sm:p-6 md:p-8 mt-16 sm:mt-0">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
