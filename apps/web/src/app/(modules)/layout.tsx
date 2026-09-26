'use client';

import React from 'react';

export default function ModulesLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="max-w-[1360px] mx-auto px-3 sm:px-6 py-5">
      {children}
    </main>
  );
}
