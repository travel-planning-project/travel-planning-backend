import React from 'react';
import { Link } from 'react-router-dom';
import { MapIcon } from '@heroicons/react/24/outline';

const Footer: React.FC = () => {
  return (
    <footer className="gradient-primary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white opacity-5 rounded-full floating"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-white opacity-5 rounded-full floating" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="icon-container w-12 h-12">
                <MapIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">✈️ TravelPlanner</span>
            </div>
            <p className="text-white/90 text-lg max-w-md leading-relaxed">
              Your smart travel companion for planning amazing trips. Discover flights, hotels,
              attractions, and manage your travel expenses all in one place. 🌍✨
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">
              🔗 Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-white/80 hover:text-white text-base font-medium transition-all duration-300 hover:translate-x-1 inline-block">
                  🏠 Home
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-white/80 hover:text-white text-base font-medium transition-all duration-300 hover:translate-x-1 inline-block">
                  🔍 Search
                </Link>
              </li>
              <li>
                <Link to="/trips" className="text-white/80 hover:text-white text-base font-medium transition-all duration-300 hover:translate-x-1 inline-block">
                  ✈️ My Trips
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">
              🆘 Support
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-white/80 hover:text-white text-base font-medium transition-all duration-300 hover:translate-x-1 inline-block">
                  💬 Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white text-base font-medium transition-all duration-300 hover:translate-x-1 inline-block">
                  📧 Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white text-base font-medium transition-all duration-300 hover:translate-x-1 inline-block">
                  🔒 Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white text-base font-medium transition-all duration-300 hover:translate-x-1 inline-block">
                  📋 Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="text-center text-white/80 text-lg font-medium">
            © 2024 TravelPlanner. Made with ❤️ for travelers worldwide. All rights reserved. 🌟
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
