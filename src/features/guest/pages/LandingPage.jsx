import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingButton from '../../../components/common/LoadingButton';
import medicalProfessional from '../../../assets/medical-professional.png';
import healthChart from '../../../assets/health-chart.png';

const LandingPage = () => {
  const navigate = useNavigate(); 
  const [isGetStartedLoading, setIsGetStartedLoading] = useState(false);
  const [isCreateAccountLoading, setIsCreateAccountLoading] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const handleGetStarted = () => {
    setIsGetStartedLoading(true);
    setTimeout(() => {
      setIsGetStartedLoading(false);
      navigate('/detection'); 
    }, 500);
  };

  const handleLogin = () => {
    setIsLoginLoading(true);
    setTimeout(() => {
      setIsLoginLoading(false);
      navigate('/auth/login');
    }, 500);
  };

  const handleCreateAccount = () => {
    setIsCreateAccountLoading(true);
    setTimeout(() => {
      setIsCreateAccountLoading(false);
      navigate('/auth/register'); 
    }, 500);
  };

  return (
    <div className="w-full bg-[#FAFAFA]">
      <section className="max-w-7xl mx-auto px-8 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 bg-[#0A58CA] rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-[#0A58CA] tracking-wide uppercase">
              RESEARCH-BACKED AI PROTOTYPE v2.0
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1]">
            Screening Dini <span className="text-[#0A58CA]">Melanoma</span> Berbasis Multi-Model AI.
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-xl">
            Platform pemantauan kesehatan kulit digital terintegrasi yang dikembangkan oleh Universitas Telkom dan HUMIC Engineering untuk membantu deteksi awal lesi kulit berisiko tinggi secara terukur.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <LoadingButton 
              onClick={handleGetStarted}
              isLoading={isGetStartedLoading}
              className="py-3.5 px-8 text-base shadow-lg shadow-blue-600/10"
            >
              Mulai Screening Mandiri
            </LoadingButton>
            <LoadingButton
              onClick={handleLogin}
              isLoading={isLoginLoading}
              className="py-3.5 px-8 text-base shadow-lg shadow-blue-600/10"
            >
              Login
            </LoadingButton>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">93.4%</p>
              <p className="text-xs font-medium text-gray-500 mt-1">Akurasi Pengujian Model AI</p>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">Grad-CAM</p>
              <p className="text-xs font-medium text-gray-500 mt-1">Teknologi Pemetaan Piksel Visual</p>
            </div>
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/40 to-transparent rounded-full blur-3xl -z-10"></div>
          <img 
            src={medicalProfessional} 
            alt="MySkin AI Interface" 
            className="w-full max-w-md md:max-w-full h-auto object-contain rounded-3xl"
          />
        </div>
      </section>

      <section className="bg-white py-12 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-6">
            DIKEMBANGKAN OLEH INSTITUSI RESMI
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-75">
            <span className="text-lg font-extrabold text-gray-700 tracking-tight">UNIVERSITAS TELKOM</span>
            <span className="text-lg font-extrabold text-gray-700 tracking-tight">HUMIC ENGINEERING</span>
            <span className="text-lg font-extrabold text-gray-700 tracking-tight">FAKULTAS INFORMATIKA</span>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-8 py-24 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="order-2 md:order-1">
          <img 
            src={healthChart} 
            alt="AI Analysis Metrics" 
            className="w-full max-w-md md:max-w-full h-auto mx-auto rounded-3xl"
          />
        </div>
        <div className="space-y-6 order-1 md:order-2">
          <div className="w-12 h-12 bg-blue-50 text-[#0A58CA] rounded-2xl flex items-center justify-center shadow-sm border border-blue-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Transparansi Klasifikasi Citra dengan Grad-CAM
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Model AI kami tidak bekerja seperti kotak hitam (*black box*). Melalui integrasi **Grad-CAM**, platform secara transparan memberikan visualisasi area piksel kulit yang menjadi dasar keputusan prediksi, mempermudah validasi klinis awal.
          </p>
          <ul className="space-y-3 pt-2">
            {[
              "Skrining berbasis Multi-Model AI Arsitektur Deep Learning.",
              "Deteksi segmentasi lesi otomatis yang presisi.",
              "Format penyimpanan data rekam medis terenkripsi aman."
            ].map((item, idx) => (
              <li key={idx} className="flex items-start text-sm text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-24 border-t border-gray-100 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
              Alur Kerja Klinis Terintegrasi
            </h2>
            <p className="text-gray-500 text-sm">
              Tiga langkah linear yang menghubungkan Pasien, Kecerdasan Buatan, dan Dokter Spesialis Kulit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "AI Lesion Screening",
                desc: "Ambil atau unggah foto lesi kulit Anda ke sistem melalui Dashboard Pasien untuk mendapatkan analisis indikasi risiko awal otomatis dari AI."
              },
              {
                step: "02",
                title: "Expert Verification",
                desc: "Ajukan hasil skrining mandiri tersebut kepada Dokter Spesialis Kulit aktif yang terdaftar resmi di platform untuk mendapatkan tinjauan medis valid."
              },
              {
                step: "03",
                title: "Interactive Consultation",
                desc: "Gunakan ruang obrolan aman untuk berkonsultasi, berdiskusi mengenai hasil deteksi dengan asisten cerdas Gemma AI, dan unduh ringkasan laporan klinis resmi."
              }
            ].map((item, idx) => (
              <div key={idx} className="relative p-8 rounded-3xl bg-[#FAFAFA] border border-gray-100 hover:border-blue-200 transition group">
                <span className="text-5xl font-black text-blue-600/10 group-hover:text-blue-600/20 transition absolute top-6 right-8">
                  {item.step}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-3 mt-4">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 px-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto bg-[#0A58CA] rounded-3xl p-10 md:p-16 text-center text-white shadow-xl shadow-blue-600/10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
            Uji Coba Fungsi Penggunaan Sistem
          </h2>
          <p className="text-blue-100 mb-10 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Gunakan kredensial pengujian resmi dari lembar panduan operasional proyek untuk mengeksplorasi seluruh fitur utama platform dari sisi Pasien maupun Dokter.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <LoadingButton 
              variant="white"
              onClick={handleCreateAccount}
              isLoading={isCreateAccountLoading}
              className="py-3 px-8 text-base w-full sm:w-auto font-bold text-[#0A58CA]"
            >
              Mulai Eksplorasi Sekarang
            </LoadingButton>
          </div>
        </div>
      </section>

      <footer className="bg-[#FAFAFA] border-t border-gray-100 py-12 px-8 text-center text-xs font-semibold text-gray-400 tracking-wider uppercase">
        <p>© 2026 MySkin Project Team • Program Studi S-1 Informatika Universitas Telkom</p>
        <p className="mt-2 text-[10px] tracking-normal font-medium text-gray-400 lowercase">
          dikembangkan bersama pusat penelitian health and biomedical intelligence (humic) engineering
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;