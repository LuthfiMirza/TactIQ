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
        className={cn('flex items-center justify-center bg-zinc-800 text-zinc-500', className)}
        style={size ? { width: size, height: size } : undefined}
      >
        <User className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('object-cover', className)}
      style={size ? { width: size, height: size } : undefined}
      onError={() => setFailed(true)}
    />
  );
}
