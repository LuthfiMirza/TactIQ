'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Shield, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('analyst@tactiq.pro');
  const [password, setPassword] = useState('••••••••••••');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    login(email);
    setTimeout(() => {
      router.push('/');
    }, 400);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#CEFF00] text-black font-black text-xl shadow-lg shadow-[#CEFF00]/10 mb-2">
            TQ
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">TactIQ Intelligence Portal</h1>
          <p className="text-xs text-zinc-400">
            Sign in to access matchday xG telemetry, player dossiers, and live tracking.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[#27272A] bg-[#121215] p-6 sm:p-8 shadow-xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Staff Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="analyst@tactiq.pro"
                  className="w-full bg-[#18181C] border border-zinc-800 focus:border-[#CEFF00]/60 focus:ring-1 focus:ring-[#CEFF00]/30 text-xs text-zinc-100 pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300">Access Token / Password</label>
                <span className="text-[10px] text-zinc-500">SSO / Club Auth</span>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#18181C] border border-zinc-800 focus:border-[#CEFF00]/60 focus:ring-1 focus:ring-[#CEFF00]/30 text-xs text-zinc-100 pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-2.5">
              <CheckCircle2 size={14} className="text-[#CEFF00] shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                <strong className="text-zinc-200">Demo Analyst Session:</strong> One-click bypass active. Click below to authenticate directly.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#CEFF00] text-black font-extrabold text-xs shadow-md shadow-[#CEFF00]/15 hover:bg-[#bde800] active:scale-98 transition-all disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          <div className="pt-2 text-center border-t border-zinc-800/80">
            <Link
              href="/"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Matchday Overview
            </Link>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500">
          <Shield size={12} className="text-zinc-500" />
          <span>TactIQ UEFA / Opta Verified Analyst Portal</span>
        </div>
      </div>
    </div>
  );
}
