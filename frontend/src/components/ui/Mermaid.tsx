import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

let initialized = false;

function ensureInit() {
    if (initialized) return;
    initialized = true;
    mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'Inter, ui-sans-serif, sans-serif',
        fontSize: 13,
        flowchart: { curve: 'basis', padding: 20, useMaxWidth: true },
        themeVariables: {
            // Dark glass palette matching Obsidian Glass theme
            background: '#0d1122',
            mainBkg: '#1a1f3a',
            nodeBorder: '#6366f1',
            primaryColor: '#1e2340',
            primaryBorderColor: '#6366f1',
            primaryTextColor: '#e2e8f0',
            secondaryColor: '#161b35',
            secondaryTextColor: '#94a3b8',
            tertiaryColor: '#141930',
            tertiaryTextColor: '#94a3b8',
            lineColor: '#6366f1',
            textColor: '#e2e8f0',
            nodeTextColor: '#e2e8f0',
            clusterBkg: '#12172b',
            clusterBorder: '#4f46e5',
            titleColor: '#a5b4fc',
            edgeLabelBackground: '#1a1f3a',
            labelBackground: '#1a1f3a',
            labelTextColor: '#e2e8f0',
            fontSize: '13px',
        },
    });
}


interface MermaidProps {
    chart: string;
}

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!chart?.trim()) return;
        ensureInit();

        let cancelled = false;

        const renderChart = async () => {
            setError(null);
            setSvg('');
            try {
                const uniqueId = `mermaid-d${Date.now()}`;
                const { svg: raw } = await mermaid.render(uniqueId, chart.trim());
                if (!cancelled) {
                    // Patch SVG: ensure background is transparent so our wrapper shows through
                    const patched = raw
                        .replace(/\<svg([^>]*)>/, (_m, attrs) => {
                            // Remove any hardcoded background fills
                            const cleanAttrs = attrs.replace(/style="[^"]*background[^"]*"/i, '');
                            return `<svg${cleanAttrs}><style>
svg { background: transparent !important; }
.node rect, .node circle, .node ellipse, .node polygon {
    fill: #1e2340 !important;
    stroke: #6366f1 !important;
    stroke-width: 1.5px;
}
.node .label, text, tspan, .nodeLabel, .edgeLabel, .cluster-label {
    fill: #e2e8f0 !important;
    color: #e2e8f0 !important;
    font-family: 'Inter', sans-serif !important;
}
.edgePath .path { stroke: #6366f1 !important; stroke-width: 1.5px; }
marker path { fill: #6366f1 !important; }
.cluster rect { fill: #12172b !important; stroke: #4f46e5 !important; }
.edgeLabel { background: #1a1f3a !important; }
.edgeLabel rect { fill: #1a1f3a !important; }
</style>`;
                        });
                    setSvg(patched);
                }
            } catch (err: any) {
                if (!cancelled) {
                    console.error('Mermaid render error:', err);
                    setError('Could not render diagram.');
                }
            }
        };

        renderChart();
        return () => { cancelled = true; };
    }, [chart]);

    if (error) {
        return (
            <div className="my-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs font-medium">
                ⚠️ Diagram could not be rendered.
            </div>
        );
    }

    if (!svg) {
        return (
            <div className="my-4 flex items-center justify-center p-8 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Rendering diagram...
                </div>
            </div>
        );
    }

    return (
        <div
            className="mermaid-diagram-wrapper my-6 overflow-x-auto rounded-2xl"
            style={{
                background: 'linear-gradient(135deg, rgba(13,17,34,0.95) 0%, rgba(20,25,48,0.98) 100%)',
                padding: '24px 16px',
                border: '1px solid rgba(99,102,241,0.2)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    maxWidth: '100%',
                }}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        </div>
    );
};
