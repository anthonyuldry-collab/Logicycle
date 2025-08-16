
import React from 'react';
import { PowerProfile } from '../../types';

interface PowerComparisonChartProps {
  fresh?: PowerProfile;
  kj15?: PowerProfile;
  kj30?: PowerProfile;
  riderWeightKg?: number;
  width?: number;
  height?: number;
  displayUnit: 'W' | 'W/kg'; // Added displayUnit prop
}

const PowerComparisonChart: React.FC<PowerComparisonChartProps> = ({
  fresh,
  kj15,
  kj30,
  riderWeightKg,
  width = 550,
  height = 350,
  displayUnit,
}) => {
  const allMetrics: Array<{ key: keyof PowerProfile; label: string; unit: 'W' | 'W/kg' }> = [
    { key: 'power5s', label: 'PMax 5s', unit: 'W' },
    { key: 'power5s', label: 'PMax 5s', unit: 'W/kg' },
    { key: 'power1min', label: 'PMax 1min', unit: 'W' },
    { key: 'power1min', label: 'PMax 1min', unit: 'W/kg' },
    { key: 'power5min', label: 'PMax 5min', unit: 'W' },
    { key: 'power5min', label: 'PMax 5min', unit: 'W/kg' },
    { key: 'criticalPower', label: 'FTP', unit: 'W' },
    { key: 'criticalPower', label: 'FTP', unit: 'W/kg' },
  ];

  const filteredMetrics = allMetrics.filter(metric => metric.unit === displayUnit);

  const profiles = [
    { data: fresh, color: '#4A90E2', label: 'Frais' }, // Light Blue
    { data: kj15, color: '#F5A623', label: '15kJ/kg' }, // Orange
    { data: kj30, color: '#D0021B', label: '30kJ/kg' }, // Red
  ];

  const chartData = filteredMetrics.map(metric => {
    const values = profiles.map(p => {
      let rawValue = p.data?.[metric.key];
      if (rawValue === undefined || rawValue === null) return 0;
      if (metric.unit === 'W/kg') {
        return riderWeightKg && riderWeightKg > 0 ? rawValue / riderWeightKg : 0;
      }
      return rawValue;
    });
    return { label: `${metric.label}`, unit: metric.unit, values }; // Removed unit from label, added as separate prop
  });

  const barPadding = 0.2;
  const groupPadding = 0.3;
  const numMetrics = chartData.length;
  const numProfiles = profiles.length;

  const margin = { top: 40, right: 20, bottom: 70, left: 50 }; // Increased top margin for value text
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const maxValue = Math.max(10, ...chartData.flatMap(d => d.values)) * 1.15; // Increased padding for text

  const metricGroupWidth = chartWidth / numMetrics;
  const barWidth = metricGroupWidth * (1 - groupPadding) / numProfiles * (1 - barPadding);
  const actualBarWidth = Math.max(1, barWidth); 

  return (
    <svg width={width} height={height} className="bg-slate-700 rounded text-xs">
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Y Axis */}
        {Array.from({ length: 6 }).map((_, i) => {
          const y = chartHeight - (i / 5) * chartHeight;
          const value = (maxValue / 5) * i;
          return (
            <g key={`y-axis-${i}`}>
              <line
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="rgba(107, 114, 128, 0.3)"
              />
              <text
                x={-5}
                y={y + 3}
                fill="rgb(203, 213, 225)"
                textAnchor="end"
              >
                {Math.round(value)}
              </text>
            </g>
          );
        })}
        {/* Bars and X Axis Labels */}
        {chartData.map((d, i) => {
          const metricGroupX = i * metricGroupWidth + (metricGroupWidth * groupPadding / 2);
          return (
            <g key={`metric-group-${i}`}>
                {/* X Axis Label for each metric group */}
                <text
                    key={`x-label-${i}`}
                    x={metricGroupX + (metricGroupWidth * (1-groupPadding) / 2)}
                    y={chartHeight + 20}
                    textAnchor="middle"
                    fill="rgb(203, 213, 225)"
                    className="font-semibold"
                >
                    {d.label}
                </text>

                {/* Bars for each profile within the group */}
                {d.values.map((value, j) => {
                    const barX = metricGroupX + j * (actualBarWidth + (metricGroupWidth * (1 - groupPadding) * barPadding / (numProfiles-1 || 1)));
                    const barHeight = (value / maxValue) * chartHeight;
                    const barY = chartHeight - barHeight;

                    return (
                        <g key={`bar-${i}-${j}`}>
                            <rect
                                x={barX}
                                y={barY}
                                width={actualBarWidth}
                                height={barHeight}
                                fill={profiles[j].color}
                                rx="1"
                            />
                            <text
                                x={barX + actualBarWidth / 2}
                                y={barY - 5}
                                textAnchor="middle"
                                fill="rgb(226, 232, 240)"
                            >
                                {value.toFixed(1)}
                            </text>
                        </g>
                    );
                })}
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(0, ${chartHeight + 40})`}>
          {profiles.map((p, i) => (
            <g key={`legend-${i}`} transform={`translate(${i * 100}, 0)`}>
              <rect
                x={0}
                y={0}
                width={12}
                height={12}
                fill={p.color}
                rx="2"
              />
              <text x={18} y={10} fill="rgb(203, 213, 225)">
                {p.label}
              </text>
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
};

export default PowerComparisonChart;
