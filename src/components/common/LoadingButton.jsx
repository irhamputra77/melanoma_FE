import React from 'react';

const LoadingButton = ({ 
  children, 
  isLoading = false, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition duration-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 py-2 px-4';
  
  const variantClasses = {
    primary: 'bg-[#0A58CA] text-white hover:bg-blue-700 disabled:bg-blue-300',
    white: 'bg-white text-blue-600 border border-blue-600 hover:bg-gray-50 disabled:bg-gray-100',
    link: 'text-white hover:text-blue-100 p-0 shadow-none'
  };

  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${isLoading ? 'relative cursor-not-allowed opacity-80' : ''}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5 mr-2 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Memuat...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;