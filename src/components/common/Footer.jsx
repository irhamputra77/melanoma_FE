import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-white px-8 py-12 md:px-16 border-t border-gray-100 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <div className="text-blue-600 font-bold text-2xl tracking-tight mb-4">
            MySkin
          </div>
          <p className="text-gray-500 text-sm max-w-sm">
            Building the world's most advanced clinical AI unit for dermatological health and melanoma prevention.
          </p>
        </div>
        
        {/* Footer Link Columns (NFR-USE-05) */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Product</h4>
          <ul className="space-y-3 text-sm text-gray-500">
            <li><Link to="/detection-ai" className="hover:text-blue-600">Detection AI</Link></li>
            <li><Link to="/history" className="hover:text-blue-600">History</Link></li>
            <li><Link to="/clinical-review" className="hover:text-blue-600">Clinical Review</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-gray-900 mb-4">Company</h4>
          <ul className="space-y-3 text-sm text-gray-500">
            <li><Link to="/about" className="hover:text-blue-600">About Us</Link></li>
            <li><Link to="/medical-team" className="hover:text-blue-600">Medical Team</Link></li>
            <li><Link to="/privacy" className="hover:text-blue-600">Privacy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-gray-900 mb-4">Support</h4>
          <ul className="space-y-3 text-sm text-gray-500">
            <li><Link to="/help" className="hover:text-blue-600">Help Center</Link></li>
            <li><Link to="/contact" className="hover:text-blue-600">Contact</Link></li>
          </ul>
        </div>
      </div>
      
      {/* Footer Bottom (NFR-USE-05) */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center text-xs text-gray-400 gap-4">
        <p>© 2026 The Clinical Atelier. All rights reserved.</p>
        <p className="max-w-xl text-left md:text-right">
          <span className="font-bold text-gray-500">Medical Disclaimer:</span> MySkin is an AI-assisted screening tool and does not provide a definitive medical diagnosis. It must be used in conjunction with a qualified medical professional for any serious concerns.
        </p>
      </div>
    </footer>
  );
};

export default Footer;