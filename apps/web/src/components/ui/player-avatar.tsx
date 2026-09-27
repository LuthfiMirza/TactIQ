'use client';

import React, { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerAvatarProps {
  src?: string;
  alt: string;
  className?: string;
  size?: number;
}

export function PlayerAvatar({ src, alt, className, size }: PlayerAvatarProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn('flex items-center justify-center bg-zinc-800/60 rounded-xl text-zinc-500 border border-zinc-700/50 shrink-0', className)}
        style={{
          ...(size ? { width: size, height: size } : {}),
          maskImage: 'none',
          WebkitMaskImage: 'none',
        }}
      >
        <User className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('max-w-full max-h-full object-cover object-[center_top] shrink-0', className)}
      style={size ? { width: size, height: size } : undefined}
      onError={() => setFailed(true)}
    />
  );
}
