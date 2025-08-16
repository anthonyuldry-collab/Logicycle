import React, { useMemo } from 'react';
import { Rider } from '../types';
import SectionWrapper from '../components/SectionWrapper';
import { SPIDER_CHART_CHARACTERISTICS_CONFIG } from '../constants';

const SpiderChart: React.FC<{ data: { axis: string; value: number }[]; size?: number; maxValue?: number }> = ({ data, size = 300, maxValue = 100 }) => {
    const numAxes = data.length;
    if (numAxes < 3) return <p className="text-xs text-center text-gray-400">Données insuffisantes pour le graphique radar.</p>;

    const angleSlice = (Math.PI * 2) / numAxes;
    const radius = size / 2.5;
    const center = size / 2;

    const points = data.map((d, i) => {
        const value = Math.max(0, Math.min(d.value || 0, maxValue));
        const x = center + radius * (value / maxValue) * Math.cos(angleSlice * i - Math.PI / 2);
        const y = center + radius * (value / maxValue) * Math.sin(angleSlice * i - Math.PI / 2);
        return `${x},${y}`;
    }).join(' ');

    const axisLines = data.map((d, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const x2 = center + radius * Math.cos(angle);
        const y2 = center + radius * Math.sin(angle);
        const labelOffset = 15;
        const lx = center + (radius + labelOffset) * Math.cos(angle);
        const ly = center + (radius + labelOffset) * Math.sin(angle);
        let textAnchor = "middle";
        if (lx > center + 3) textAnchor = "start";
        else if (lx < center - 3) textAnchor = "end";
        return { x1: center, y1: center, x2, y2, label: d.axis, lx, ly, textAnchor };
    });
    
    const gridLevels = 5;
    const concentricPolygons = Array.from({ length: gridLevels }).map((_, levelIndex) => {
        const levelRadius = radius * ((levelIndex + 1) / gridLevels);
        return data.map((d, i) => {
            const x = center + levelRadius * Math.cos(angleSlice * i - Math.PI / 2);
            const y = center + levelRadius * Math.sin(angleSlice * i - Math.PI / 2);
            return `${x},${y}`;
        }).join(' ');
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
            <g>
                {concentricPolygons.map((polyPoints, i) => (
                    <polygon key={`grid-${i}`} points={polyPoints} fill="none" stroke="#e2e8f0" strokeOpacity="0.2" strokeWidth="1" />
                ))}
                {axisLines.map((line, i) => (
                    <g key={`axis-${i}`}>
                        <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#e2e8f0" strokeOpacity="0.3" strokeWidth="1" />
                        <text
                            x={line.lx}
                            y={line.ly}
                            fontSize="12"
                            fill="#f1f5f9"
                            fontWeight="bold"
                            textAnchor={line.textAnchor as any}
                            dominantBaseline="middle"
                        >
                            {line.label}
                        </text>
                    </g>
                ))}
                <polygon points={points} fill="rgba(239, 169, 182, 0.4)" stroke="#efa9b6" strokeWidth="2" />
                 {data.map((d, i) => {
                    const value = Math.max(0, Math.min(d.value || 0, maxValue));
                    const x = center + radius * (value / maxValue) * Math.cos(angleSlice * i - Math.PI / 2);
                    const y = center + radius * (value / maxValue) * Math.sin(angleSlice * i - Math.PI / 2);
                    return <circle key={`point-${i}`} cx={x} cy={y} r="3" fill="#efa9b6" />;
                })}
            </g>
        </svg>
    );
};

interface AutomatedPerformanceProfileSectionProps {
  rider: Rider;
}

export const AutomatedPerformanceProfileSection: React.FC<AutomatedPerformanceProfileSectionProps> = ({ rider }) => {
    const spiderChartData = useMemo(() => {
        return SPIDER_CHART_CHARACTERISTICS_CONFIG.map(char => ({
            axis: char.label,
            value: (rider as any)[char.key] || 0,
        }));
    }, [rider]);

    return (
        <SectionWrapper title="Profil de Performance Automatisé">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
                <p className="text-slate-300 text-center mb-6">
                    Ce profil est calculé automatiquement à partir de vos données de puissance (PPR).
                    Plus vos données sont complètes (y compris les profils de fatigue), plus le profil sera précis.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div>
                        <SpiderChart data={spiderChartData} />
                    </div>
                    <div className="space-y-4">
                        {spiderChartData.map(char => (
                            <div key={char.axis} className="flex flex-col">
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="font-semibold text-slate-200">{char.axis}</span>
                                    <span className="font-mono text-lg font-bold text-white">{char.value.toFixed(0)}</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2.5">
                                    <div className="bg-gradient-to-r from-pink-500 to-violet-500 h-2.5 rounded-full" style={{ width: `${char.value}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="mt-8 pt-6 border-t border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <h4 className="text-slate-400 text-sm font-medium">Note de Performance Générale</h4>
                        <p className="text-3xl font-bold text-white mt-1">{rider.generalPerformanceScore?.toFixed(0) || 'N/A'} <span className="text-lg text-slate-300">/ 100</span></p>
                        <p className="text-xs text-slate-500 mt-1">Reflète votre adéquation avec votre profil qualitatif.</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <h4 className="text-slate-400 text-sm font-medium">Indice de Résistance à la Fatigue</h4>
                        <p className="text-3xl font-bold text-white mt-1">{rider.fatigueResistanceScore?.toFixed(0) || 'N/A'} <span className="text-lg text-slate-300">/ 100</span></p>
                        <p className="text-xs text-slate-500 mt-1">Capacité à maintenir la puissance après un effort.</p>
                    </div>
                </div>
            </div>
        </SectionWrapper>
    );
};
