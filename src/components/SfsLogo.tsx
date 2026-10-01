import React from 'react';

interface SfsLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'white';
}

export const SfsLogo: React.FC<SfsLogoProps> = ({ 
  className = 'w-full h-auto object-contain', 
  variant = 'full' 
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Isotipo SFS Vectorial: Fábrica tecnológica y circuito integrado */}
      <svg
        viewBox="0 0 160 85"
        className="w-14 sm:w-16 h-auto flex-shrink-0 object-contain"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sfs-chimney" x1="28" y1="20" x2="48" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0072CE" />
            <stop offset="0.6" stopColor="#004D99" />
            <stop offset="1" stopColor="#0B2A5B" />
          </linearGradient>

          <linearGradient id="sfs-building" x1="55" y1="20" x2="88" y2="75" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0284C7" />
            <stop offset="0.7" stopColor="#004D99" />
            <stop offset="1" stopColor="#081F44" />
          </linearGradient>

          <linearGradient id="sfs-gable" x1="12" y1="36" x2="32" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#004D99" />
            <stop offset="1" stopColor="#0B2A5B" />
          </linearGradient>

          <linearGradient id="sfs-swoosh-orange" x1="8" y1="72" x2="110" y2="72" gradientUnits="userSpaceOnUse">
            <stop stopColor="#DC2626" />
            <stop offset="0.35" stopColor="#F37021" />
            <stop offset="0.85" stopColor="#FB923C" />
            <stop offset="1" stopColor="#FDBA74" />
          </linearGradient>

          <linearGradient id="sfs-swoosh-blue" x1="20" y1="78" x2="135" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0B2A5B" />
            <stop offset="0.5" stopColor="#0072CE" />
            <stop offset="1" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        {/* Bloques de datos digitales naranja */}
        <rect x="42" y="4" width="8" height="8" rx="1.5" fill="#F37021" />
        <rect x="54" y="9" width="7" height="7" rx="1.2" fill="#F37021" opacity="0.9" />
        <rect x="34" y="14" width="7.5" height="7.5" rx="1.2" fill="#F37021" opacity="0.85" />
        <rect x="48" y="18" width="8.5" height="8.5" rx="1.5" fill="#F37021" />

        {/* Silueta de fábrica */}
        <polygon points="8,70 8,50 20,40 20,70" fill="#081F44" />
        <polygon points="20,70 20,40 34,30 34,70" fill="url(#sfs-gable)" />
        <path d="M34 70L38 24H49L53 70H34Z" fill="url(#sfs-chimney)" />

        {/* Edificio tecnológico moderno */}
        <polygon points="56,32 90,16 90,70 56,70" fill="url(#sfs-building)" />
        <line x1="62" y1="41" x2="84" y2="31" stroke="#E0F2FE" strokeWidth="3" strokeLinecap="round" />
        <line x1="62" y1="50" x2="84" y2="40" stroke="#E0F2FE" strokeWidth="3" strokeLinecap="round" />
        <line x1="62" y1="59" x2="84" y2="49" stroke="#E0F2FE" strokeWidth="3" strokeLinecap="round" />

        {/* Circuitos integrados */}
        <path d="M90 38H106V20H117" stroke="#0072CE" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="120" cy="20" r="5.5" fill="#0072CE" />
        <circle cx="120" cy="20" r="2.5" fill="white" />

        <path d="M90 52H112V42H128" stroke="#0072CE" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="131" cy="42" r="6" fill="#0072CE" />
        <circle cx="131" cy="42" r="2.8" fill="white" />

        <path d="M90 63H122" stroke="#0072CE" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="127" cy="63" r="5.5" fill="#F37021" />
        <circle cx="127" cy="63" r="2.5" fill="white" />

        {/* Arcos vectoriales en degradé */}
        <path d="M8 73C30 83 85 82 118 63C105 74 60 79 24 74Z" fill="url(#sfs-swoosh-orange)" />
        <path d="M18 76C48 85 105 80 138 52C128 67 80 79 38 77Z" fill="url(#sfs-swoosh-blue)" />
      </svg>

      {/* Nombre completo de la empresa: Software Factory and Services */}
      {variant !== 'compact' && (
        <div className="flex flex-col justify-center leading-tight select-none min-w-0">
          <span
            className={`font-black uppercase tracking-tight text-xs sm:text-sm font-sans leading-none ${
              variant === 'white' ? 'text-white' : 'text-[#0B2A5B]'
            }`}
            style={{ letterSpacing: '-0.02em', fontWeight: 900 }}
          >
            SOFTWARE FACTORY
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`h-[1.5px] flex-1 ${variant === 'white' ? 'bg-white/40' : 'bg-[#0B2A5B]/40'}`} />
            <span
              className={`text-[11px] font-bold tracking-[0.16em] uppercase whitespace-nowrap ${
                variant === 'white' ? 'text-blue-100' : 'text-[#0B2A5B]'
              }`}
            >
              AND SERVICES
            </span>
            <span className={`h-[1.5px] flex-1 ${variant === 'white' ? 'bg-white/40' : 'bg-[#0B2A5B]/40'}`} />
          </div>
        </div>
      )}
    </div>
  );
};
