import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layouts/Sidebar";
import AuthenticatedHeader from "./AuthenticatedHeader";

export default function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-14">
        {" "}
        {/* Add ml-14 here */}
        <AuthenticatedHeader />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
