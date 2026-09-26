'use client';

import React from 'react';
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
      backgroundColor: 'rgba(206, 255, 0, 0.2)',
      borderColor: '#CEFF00',
      borderWidth: 2,
      pointBackgroundColor: '#CEFF00',
      pointBorderColor: '#000000',
      pointHoverBackgroundColor: '#FFFFFF',
      pointHoverBorderColor: '#CEFF00',
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
      backgroundColor: 'rgba(0, 210, 255, 0.2)',
      borderColor: '#00D2FF',
      borderWidth: 2,
      pointBackgroundColor: '#00D2FF',
      pointBorderColor: '#000000',
      pointHoverBackgroundColor: '#FFFFFF',
      pointHoverBorderColor: '#00D2FF',
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
    animation: {
      duration: 400,
      easing: 'easeOutQuart' as const,
    },
    scales: {
      r: {
        angleLines: {
          color: '#27272A',
        },
        grid: {
          color: '#27272A',
          circular: true,
        },
        pointLabels: {
          color: '#E4E4E7',
          font: {
            size: 11,
            weight: 600 as const,
            family: 'Inter, system-ui, sans-serif',
          },
        },
        ticks: {
          backdropColor: 'transparent',
          color: '#71717A',
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
          color: '#F4F4F5',
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
        bodyColor: '#E2E8F0',
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
        <Radar
          key={`${playerName}-${comparisonPlayerName}-${datasets.map(d => d.data.join(',')).join('-')}`}
          data={chartData}
          options={options}
          redraw={true}
        />
      </div>
    </div>
  );
};
