import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Tambahan Import
import LoadingButton from '../../../components/common/LoadingButton';
import medicalProfessional from '../../../assets/medical-professional.png';
import healthChart from '../../../assets/health-chart.png';

const LandingPage = () => {
  const navigate = useNavigate(); // Inisialisasi navigate
  const [isGetStartedLoading, setIsGetStartedLoading] = useState(false);
  const [isCreateAccountLoading, setIsCreateAccountLoading] = useState(false);
  const [isLearnMoreLoading, setIsLearnMoreLoading] = useState(false);

  const handleGetStarted = () => {
    setIsGetStartedLoading(true);
    setTimeout(() => {
      setIsGetStartedLoading(false);
      navigate('/detection'); // Arahkan ke Detection Page
    }, 500);
  };

  const handleLogin = () => {
    navigate('/auth/login');
  };

  const handleCreateAccount = () => {
    setIsCreateAccountLoading(true);
    setTimeout(() => setIsCreateAccountLoading(false), 2000);
  };

  const handleLearnMore = () => {
    setIsLearnMoreLoading(true);
    setTimeout(() => setIsLearnMoreLoading(false), 2000);
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold mb-6 tracking-wide">
            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" fillRule="evenodd"></path></svg>
            <span>FDA-CLEARED AI ENGINE</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
            The Clinical <br />
            <span className="text-blue-600">Atelier</span> of Skin <br />
            Health.
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-md leading-relaxed">
            Harnessing the precision of bespoke medical AI to detect melanoma and skin concerns in seconds. Expert clinical oversight, reimagined for your home.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <LoadingButton 
              onClick={handleGetStarted}
              isLoading={isGetStartedLoading}
              className="py-3 px-8 text-base"
            >
              Get Started
            </LoadingButton>
            <button
              type="button"
              onClick={handleLogin}
              className="rounded-xl border border-blue-600 px-8 py-3 text-base font-semibold text-blue-600 transition hover:bg-blue-50"
            >
              Login
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl overflow-hidden h-[500px]">
            {/* Substitute with appropriate medical image as shown in design */}
            <img src={medicalProfessional} alt="Dermatologist examining patient's skin" className="w-full h-full object-cover" />
          </div>
          
          {/* AI Info Overlays (NFR-USE-01) */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl w-64 text-center">
            <h3 className="text-blue-600 font-bold text-xl mb-1">Scanning...</h3>
            <p className="text-gray-500 text-xs font-medium">Neural processing 88%</p>
          </div>

          <div className="absolute -bottom-6 left-8 bg-white rounded-2xl p-5 shadow-xl w-72">
            <div className="flex items-center space-x-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs font-bold text-gray-500 tracking-wider">ANALYSIS READY</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">98.4%</p>
            <p className="text-xs text-gray-500 mt-1">AI Confidence Score in detecting Melanocytic lesions.</p>
          </div>
        </div>
      </section>

      {/* Features Grid (NFR-USE-05) */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Precision in Every Pixel</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Our multi-layered approach combines rapid AI screening with the nuanced judgment of clinical experts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Feature Cards (NFR-USE-01) */}
            <div className="sm:col-span-2 bg-[#F8F9FA] rounded-3xl p-10 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Neural Detection</h3>
                <p className="text-gray-500 max-w-md">
                  Our proprietary AI model trained on over 2 million dermatological images identifies risks with surgical precision in under 10 seconds.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-8">
                <span className="bg-white text-blue-700 text-xs font-bold px-4 py-2 rounded-full shadow-sm">INSTANT SCREENING</span>
                <span className="bg-white text-blue-700 text-xs font-bold px-4 py-2 rounded-full shadow-sm">PATTERN RECOGNITION</span>
              </div>
            </div>

            <div className="bg-[#F8F9FA] rounded-3xl p-10">
              <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center mb-6 text-green-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">History Tracking</h3>
              <p className="text-gray-500 text-sm">
                Map your skin's evolution over time with our chronological log system. Early detection is a journey, not a single snapshot.
              </p>
            </div>

            <div className="bg-[#0A58CA] rounded-3xl p-10 text-white">
              <div className="w-12 h-12 bg-blue-500/50 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Doctor Verification</h3>
              <p className="text-blue-100 text-sm mb-8">
                High-risk detections are automatically routed to our board-certified dermatologists for priority human review.
              </p>
              <LoadingButton 
                variant="link"
                onClick={handleLearnMore}
                isLoading={isLearnMoreLoading}
                className="text-white font-bold text-sm flex items-center hover:text-blue-100 p-0 shadow-none ring-0 focus:ring-0"
              >
                LEARN MORE <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </LoadingButton>
            </div>

            <div className="sm:col-span-2 bg-[#F8F9FA] rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:w-1/2 mb-6 md:mb-0">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Holistic Analytics</h3>
                <p className="text-gray-500 text-sm">
                  Get a comprehensive "Skin Health Score" based on UV exposure, localized changes, and systemic health data integration.
                </p>
              </div>
              <div className="md:w-1/2 w-full h-32 rounded-xl overflow-hidden shadow-inner">
                {/* Chart-like element as shown in design */}
                <img src={healthChart} alt="Health Analytics Chart" className="w-full h-full object-cover opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section (NFR-USE-05) */}
      <section className="bg-[#F8F9FA] py-24">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-3 gap-16 items-center">
          <div className="lg:col-span-1">
            <h2 className="text-4xl font-extrabold text-gray-900 leading-tight mb-4 tracking-tight">
              Trusted by 200k+ Patients Worldwide.
            </h2>
            <p className="text-gray-500 mb-8 max-w-sm">
              We are redefining the standard of preventative care through transparency and clinical excellence.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-4xl font-extrabold text-blue-600">4.9/5</span>
              <span className="text-xs font-bold text-gray-500 tracking-widest leading-tight">APP STORE<br />RATING</span>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <div className="flex text-blue-600 mb-4">
                {[...Array(5)].map((_, i) => <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>)}
              </div>
              <p className="text-gray-800 italic mb-6">
                "The piece of mind MySkin provides is invaluable. Being able to track a suspicious mole and have it verified by a doctor within hours saved me from months of anxiety."
              </p>
              <div className="flex items-center space-x-3">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Sarah Jenkins" className="w-10 h-10 rounded-full bg-gray-100" />
                <div>
                  <p className="font-bold text-sm text-gray-900">Sarah Jenkins</p>
                  <p className="text-xs text-gray-500">Verified Patient</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <div className="flex text-blue-600 mb-4">
                {[...Array(5)].map((_, i) => <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>)}
              </div>
              <p className="text-gray-800 italic mb-6">
                "As a practitioner, I recommend MySkin to all my patients for home monitoring between annual checks. It's the most sophisticated tool I've seen in the space."
              </p>
              <div className="flex items-center space-x-3">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" alt="Dr. Marcus Chen" className="w-10 h-10 rounded-full bg-gray-100" />
                <div>
                  <p className="font-bold text-sm text-gray-900">Dr. Marcus Chen</p>
                  <p className="text-xs text-gray-500">Dermatologist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action Section (NFR-USE-05) */}
      <section className="bg-white py-24 px-8">
        <div className="max-w-6xl mx-auto bg-[#0A58CA] rounded-3xl p-16 text-center text-white">
          <h2 className="text-4xl font-extrabold mb-4 tracking-tight leading-tight">
            Ready to prioritize your skin health?
          </h2>
          <p className="text-blue-100 mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of users who take control of their skin monitoring with the power of Clinical AI. Secure, rapid, and clinical-grade.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <LoadingButton 
              variant="white"
              onClick={handleCreateAccount}
              isLoading={isCreateAccountLoading}
              className="py-3 px-8 text-base w-full sm:w-auto"
            >
              Create Free Account
            </LoadingButton>
            <div className="flex items-center text-blue-100 text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              HIPAA Compliant & Secure
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
