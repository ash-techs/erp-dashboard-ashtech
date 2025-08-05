import React from 'react';
import {
  Linkedin,
  Mail,
  Globe
} from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-transparent text-gray-700 dark:text-gray-300 py-6">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center space-y-4">
        
        {/* Text */}
        <div className="text-sm text-center">
          © {new Date().getFullYear()} Developed by{" "}
          <a
            href="https://www.linkedin.com/company/ash-tech-virtual-software-house/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Ash Tech's
          </a>. All rights reserved.
        </div>

        {/* Icons */}
        <div className="flex space-x-5">
          <a
            href="mailto:shehzadaashan@gmail.com"
            aria-label="Email"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Mail size={20} />
          </a>
          <a
            href="https://ash-techs.github.io/portfolio"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Website"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Globe size={20} />
          </a>
          <a
            href="https://www.linkedin.com/company/ash-tech-virtual-software-house/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Linkedin size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;