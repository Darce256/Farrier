import { Link } from "react-router-dom";
import jteLogo from "@/assets/jte.png"; // Make sure this path is correct

export const Footer = () => {
  return (
    <footer className="w-full bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center mb-4 sm:mb-0">
          <img src={jteLogo} alt="JT Evolutions Logo" className="h-8 w-auto" />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 sm:mb-0">
          © 2024 JTE, Inc. All rights reserved.
        </p>
        <nav className="flex gap-4 sm:gap-6">
          <Link
            className="text-xs hover:underline underline-offset-4"
            to="/terms"
          >
            Terms of Service
          </Link>
          <Link
            className="text-xs hover:underline underline-offset-4"
            to="/privacy"
          >
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
};
