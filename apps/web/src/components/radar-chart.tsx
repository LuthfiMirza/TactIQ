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
      backgroundColor: 'rgba(16, 185, 129, 0.25)', // Neon emerald fill
      borderColor: '#10B981', // Neon emerald border
      borderWidth: 2.5,
      pointBackgroundColor: '#10B981',
      pointBorderColor: '#0B0E14',
      pointHoverBackgroundColor: '#FFFFFF',
      pointHoverBorderColor: '#10B981',
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
      backgroundColor: 'rgba(6, 182, 212, 0.25)', // Cyan fill
      borderColor: '#06B6D4', // Cyan border
      borderWidth: 2,
      pointBackgroundColor: '#06B6D4',
      pointBorderColor: '#0B0E14',
      pointHoverBackgroundColor: '#FFFFFF',
      pointHoverBorderColor: '#06B6D4',
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
          color: 'rgba(255, 255, 255, 0.08)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.06)',
          circular: true,
        },
        pointLabels: {
          color: '#94A3B8',
          font: {
            size: 11,
            weight: 600 as const,
            family: 'Inter, system-ui, sans-serif',
          },
        },
        ticks: {
          backdropColor: 'transparent',
          color: 'rgba(148, 163, 184, 0.6)',
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
          color: '#E2E8F0',
          font: {
            size: 12,
            weight: 500 as const,
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 16,
          boxWidth: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#1E2638',
        titleColor: '#F8FAFC',
        bodyColor: '#38BDF8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
      },
    },
  };

  return (
    <div className={`relative flex items-center justify-center p-3 bg-tactiq-card/80 border border-tactiq-border rounded-xl backdrop-blur-md ${className}`}>
      <div className="w-full max-w-[380px] h-[340px]">
        <Radar data={chartData} options={options} />
      </div>
    </div>
  );
};
