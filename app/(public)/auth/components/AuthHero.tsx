'use client';

import React from 'react';
import Image from 'next/image';

interface AuthHeroProps {
  imageSrc?: string;
  videoSrc?: string;
  claim: {
    primary: string;
    secondary: string;
  };
  logos?: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
}

export function AuthHero({ imageSrc, videoSrc, claim, logos }: AuthHeroProps) {
  return (
    <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-800 ring-inset ring-white/10 flex flex-col justify-center items-center p-8 md:p-12">
      {/* Background Media */}
      {imageSrc && (
        <div className="absolute inset-0">
          <Image
            src={imageSrc}
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}
      
      {videoSrc && (
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Particle Pattern Overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full bg-[radial-gradient(circle_at_50%_30%,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:40px_40px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Image
              src="/favicon.png"
              alt="Client MAR-IA"
              width={56}
              height={56}
              className="w-14 h-14"
            />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              MAR-IA
            </h3>
            <div className="text-xs text-orange-100 font-medium tracking-widest uppercase">
              CRM Inteligente
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-xl md:text-2xl font-medium tracking-[0.02em] text-white/95 leading-tight">
            {claim.primary}
          </h1>
          <p className="text-base md:text-lg font-light text-orange-100/90 leading-relaxed">
            {claim.secondary}
          </p>
        </div>
        
        {/* Features highlights */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-300/30 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-sm text-white/90 font-medium">Scoring IA</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-300/30 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-sm text-white/90 font-medium">Multi-canal</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-300/30 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm text-white/90 font-medium">Analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-300/30 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm text-white/90 font-medium">Automatización</span>
            </div>
          </div>
        </div>

        {/* Company Logos Row */}
        {logos && logos.length > 0 && (
          <div className="flex items-center justify-center gap-x-6 pt-8">
            {logos.map((logo, index) => (
              <div
                key={index}
                className="opacity-60 hover:opacity-90 transition-opacity duration-300 mix-blend-screen"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width || 80}
                  height={logo.height || 32}
                  className="h-8 w-auto object-contain filter brightness-0 invert"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}