'use client';

import React from 'react';

export default function ModulesLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="pt-24 max-w-7xl mx-auto px-6 py-8">
      {children}
    </main>
  );
}
