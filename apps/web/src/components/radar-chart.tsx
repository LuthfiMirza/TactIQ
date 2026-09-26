'use client';

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { PlayerRadarMetrics } from '@tactiq/shared-types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface RadarChartProps {
  metrics: PlayerRadarMetrics;
  playerName?: string;
  comparisonMetrics?: PlayerRadarMetrics;
  comparisonPlayerName?: string;
  className?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  metrics,
  playerName = 'Target Player',
  comparisonMetrics,
  comparisonPlayerName = 'Comparison Player',
  className = '',
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const labels = ['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical', 'Vision'];

  const targetData = [
    metrics.pace,
    metrics.shooting,
    metrics.passing,
    metrics.dribbling,
    metrics.defending,
    metrics.physical,
    metrics.vision,
  ];

  const datasets: any[] = [
    {
      label: playerName,
      data: targetData,
      backgroundColor: 'rgba(0, 168, 63, 0.18)',
      borderColor: '#00A83F',
      borderWidth: 2,
      pointBackgroundColor: '#00A83F',
      pointBorderColor: '#FFFFFF',
      pointHoverBackgroundColor: '#FFFFFF',
      pointHoverBorderColor: '#00A83F',
      pointRadius: 4,
      pointHoverRadius: 6,
    },
  ];

  if (comparisonMetrics) {
    const compData = [
      comparisonMetrics.pace,
      comparisonMetrics.shooting,
      comparisonMetrics.passing,
      comparisonMetrics.dribbling,
      comparisonMetrics.defending,
      comparisonMetrics.physical,
      comparisonMetrics.vision,
    ];

    datasets.push({
      label: comparisonPlayerName,
      data: compData,
      backgroundColor: 'rgba(2, 132, 199, 0.18)',
      borderColor: '#0284C7',
      borderWidth: 2,
      pointBackgroundColor: '#0284C7',
      pointBorderColor: '#FFFFFF',
      pointHoverBackgroundColor: '#FFFFFF',
      pointHoverBorderColor: '#0284C7',
      pointRadius: 4,
      pointHoverRadius: 6,
    });
  }

  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        angleLines: {
          color: isDark ? '#27272A' : '#E2E8F0',
        },
        grid: {
          color: isDark ? '#27272A' : '#E2E8F0',
          circular: true,
        },
        pointLabels: {
          color: isDark ? '#E4E4E7' : '#334155',
          font: {
            size: 11,
            weight: 600 as const,
            family: 'Inter, system-ui, sans-serif',
          },
        },
        ticks: {
          backdropColor: 'transparent',
          color: isDark ? '#71717A' : '#94A3B8',
          stepSize: 20,
          font: {
            size: 9,
          },
        },
        min: 0,
        max: 100,
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDark ? '#F4F4F5' : '#1E293B',
          font: {
            size: 12,
            weight: 600 as const,
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 16,
          boxWidth: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#121215',
        titleColor: '#FFFFFF',
        bodyColor: '#10B981',
        borderColor: '#27272A',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
      },
    },
  };

  return (
    <div className={`relative flex items-center justify-center p-2 bg-slate-50/60 dark:bg-[#18181C] rounded-xl border border-slate-100 dark:border-[#27272A] transition-colors ${className}`}>
      <div className="w-full max-w-[380px] h-[320px]">
        <Radar data={chartData} options={options} />
      </div>
    </div>
  );
};
