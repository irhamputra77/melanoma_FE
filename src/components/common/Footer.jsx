import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-white px-8 py-12 md:px-16 border-t border-gray-100 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Kolom Informasi Brand Proyek */}
        <div className="md:col-span-2">
          <div className="text-[#0A58CA] font-black text-2xl tracking-tight mb-4">
            MySkin<span className="text-gray-900">.</span>
          </div>
          <p className="text-gray-500 text-sm max-w-md leading-relaxed">
            Platform purwarupa penelitian penapisan dini melanoma berbasis integrasi teknologi Multi-Model AI yang dikembangkan secara kolaboratif.
          </p>
        </div>
        
        {/* Kolom Navigasi Utama (Hanya Menyisakan Fitur Eksis) */}
        <div className="md:col-span-2 md:flex md:justify-end">
          <div className="min-w-[150px]">
            <h4 className="font-bold text-gray-900 mb-4 tracking-wide uppercase text-xs">Features</h4>
            <ul className="space-y-3 text-sm text-gray-500 font-medium">
              <li>
                <Link to="/patient/dashboard" className="hover:text-[#0A58CA] transition">
                  Detection AI
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bagian Bawah Footer (Data Legalitas & Afiliasi Riset Aktual) */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center text-xs text-gray-400 gap-4 font-medium tracking-wide uppercase">
        <p>© 2026 MySkin Project Team • S-1 Informatika Universitas Telkom</p>
        <p className="max-w-xl text-left md:text-right text-[10px] tracking-normal font-medium text-gray-400 lowercase">
          dikembangkan bersama pusat penelitian health and biomedical intelligence (humic) engineering
        </p>
      </div>
    </footer>
  );
};

export default Footer;