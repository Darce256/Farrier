import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import jteLogo from "@/assets/jte.png";
import { EULAContent } from "@/components/pages/EULA";
import PrivacyPolicy from "@/components/pages/PrivacyPolicy";

export const Footer = () => {
  const [isEulaOpen, setIsEulaOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <footer className="w-full bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center mb-4 sm:mb-0">
          <a
            href="https://jtevolutions.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img
              src={jteLogo}
              alt="JT Evolutions Logo"
              className="h-8 w-auto"
            />
          </a>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 sm:mb-0">
          © 2024 JTE, Inc. All rights reserved.
        </p>
        <nav className="flex gap-4 sm:gap-6">
          <Dialog open={isEulaOpen} onOpenChange={setIsEulaOpen}>
            <DialogTrigger asChild>
              <button className="text-xs hover:underline underline-offset-4">
                Terms of Service
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Terms of Service</DialogTitle>
              </DialogHeader>
              <EULAContent />
            </DialogContent>
          </Dialog>

          <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
            <DialogTrigger asChild>
              <button className="text-xs hover:underline underline-offset-4">
                Privacy Policy
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Privacy Policy</DialogTitle>
              </DialogHeader>
              <PrivacyPolicy />
            </DialogContent>
          </Dialog>
        </nav>
      </div>
    </footer>
  );
};
