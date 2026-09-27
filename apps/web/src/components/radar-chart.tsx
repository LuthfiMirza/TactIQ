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
  type ChartDataset,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { PlayerRadarMetrics } from '@tactiq/shared-types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface RadarChartProps {
  metrics?: PlayerRadarMetrics;
  playerName?: string;
  comparisonMetrics?: PlayerRadarMetrics;
  comparisonPlayerName?: string;
  className?: string;
  showLegend?: boolean;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  metrics,
  playerName = 'Target Player',
  comparisonMetrics,
  comparisonPlayerName = 'Comparison Player',
  className = '',
  showLegend = true,
}) => {
  const labels = ['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical', 'Vision'];

  const targetData = [
    metrics?.pace ?? 50,
    metrics?.shooting ?? 50,
    metrics?.passing ?? 50,
    metrics?.dribbling ?? 50,
    metrics?.defending ?? 50,
    metrics?.physical ?? 50,
    metrics?.vision ?? 50,
  ];

  const datasets: ChartDataset<'radar'>[] = [
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
      comparisonMetrics?.pace ?? 50,
      comparisonMetrics?.shooting ?? 50,
      comparisonMetrics?.passing ?? 50,
      comparisonMetrics?.dribbling ?? 50,
      comparisonMetrics?.defending ?? 50,
      comparisonMetrics?.physical ?? 50,
      comparisonMetrics?.vision ?? 50,
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
    maintainAspectRatio: false,
    animation: {
      duration: 400,
      easing: 'easeOutQuart' as const,
    },
    layout: {
      padding: {
        top: 12,
        bottom: 6,
        left: 8,
        right: 8,
      },
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
          padding: 4,
          font: {
            size: 10,
            weight: 600 as const,
            family: 'Inter, system-ui, sans-serif',
          },
        },
        ticks: {
          backdropColor: 'transparent',
          color: '#71717A',
          stepSize: 20,
          font: {
            size: 8.5,
          },
        },
        min: 0,
        max: 100,
      },
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          color: '#F4F4F5',
          font: {
            size: 11,
            weight: 600 as const,
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 10,
          boxWidth: 8,
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
      <div className="w-full max-w-[340px] h-[240px] sm:h-[280px]">
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
