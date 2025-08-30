'use client';

import React from 'react';

interface AuthSplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function AuthSplitLayout({ left, right }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-orange-500 via-orange-600 to-orange-800 text-foreground px-4 md:px-8 flex items-center justify-center py-8">
      <div className="mx-auto max-w-[1100px] w-full rounded-lg bg-white/10 backdrop-blur-sm ring-1 ring-white/20 overflow-hidden grid md:grid-cols-2 min-h-[600px] shadow-2xl">
        {left}
        {right}
      </div>
    </div>
  );
}