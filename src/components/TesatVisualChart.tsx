"use client";

import React, { useState } from "react";
import {
  TesatVisualChart as TesatVisualChartData,
  TesatDataTable,
} from "@/lib/schemas/tesat-schema";
import { BarChart3, Eye, Sparkles, TrendingUp, Info } from "lucide-react";

/**
 * Renders a 100% unique SVG Bar Chart directly from a question's own specific DataTable numbers.
 * Zero shared templates: every question with a DataTable has its own exact numbers plotted.
 */
export function TesatDataTableAutoChart({
  table,
  showVietnamese,
}: {
  table: TesatDataTable;
  showVietnamese: boolean;
}) {
  // Extract numeric series from rows
  const parsedRows = table.rows
    .map((r) => {
      const nums = r.values
        .map((v) => {
          const cleaned = String(v).replace(/[^0-9.-]/g, "");
          const n = parseFloat(cleaned);
          return Number.isFinite(n) ? n : null;
        })
        .filter((n): n is number => n !== null);
      return {
        label: r.label,
        v1: nums[0] ?? null,
        v2: nums[1] ?? null,
      };
    })
    .filter((r) => r.v1 !== null);

  if (parsedRows.length < 2) return null;

  const allVals = parsedRows.flatMap((r) =>
    r.v2 !== null ? [Math.abs(r.v1!), Math.abs(r.v2)] : [Math.abs(r.v1!)]
  );
  const maxVal = Math.max(...allVals, 1) * 1.18;
  const col1Name = table.headers[1] || "지표 1";
  const col2Name = table.headers[2] || "지표 2";
  const hasSecondSeries = parsedRows.some((r) => r.v2 !== null);

  return (
    <div className="mt-3 rounded-xl border border-indigo-200/80 bg-white p-3.5 shadow-2xs">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-extrabold text-indigo-900">
          <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
          <span>
            {showVietnamese ? table.titleVi : table.titleKo} ({table.unit})
          </span>
        </span>
        <span className="text-[11px] text-slate-500">출처: {table.source}</span>
      </div>

      <svg viewBox="0 0 460 200" className="w-full h-auto max-h-[195px] select-none">
        <g stroke="#e2e8f0" strokeDasharray="3 3">
          <line x1="55" y1="35" x2="430" y2="35" />
          <line x1="55" y1="85" x2="430" y2="85" />
          <line x1="55" y1="135" x2="430" y2="135" />
        </g>
        <line x1="55" y1="20" x2="55" y2="165" stroke="#1e293b" strokeWidth="1.8" />
        <line x1="55" y1="165" x2="435" y2="165" stroke="#1e293b" strokeWidth="1.8" />

        {/* Legend */}
        <rect x="65" y="4" width="10" height="10" rx="2" fill="#2563eb" />
        <text x="80" y="13" fontSize="10" fontWeight="700" fill="#1e3a8a">
          {col1Name}
        </text>
        {hasSecondSeries && (
          <>
            <rect x="230" y="4" width="10" height="10" rx="2" fill="#059669" />
            <text x="245" y="13" fontSize="10" fontWeight="700" fill="#065f46">
              {col2Name}
            </text>
          </>
        )}

        {parsedRows.map((row, idx) => {
          const step = 350 / parsedRows.length;
          const cx = 95 + idx * step;
          const h1 = Math.max(10, (Math.abs(row.v1!) / maxVal) * 125);
          const y1 = 165 - h1;

          const h2 =
            row.v2 !== null
              ? Math.max(10, (Math.abs(row.v2) / maxVal) * 125)
              : 0;
          const y2 = 165 - h2;

          return (
            <g key={idx}>
              <rect
                x={hasSecondSeries ? cx - 24 : cx - 16}
                y={y1}
                width={hasSecondSeries ? "22" : "32"}
                height={h1}
                rx="3"
                fill="#2563eb"
                fillOpacity="0.85"
              />
              <text
                x={hasSecondSeries ? cx - 13 : cx}
                y={y1 - 4}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="800"
                fill="#1e3a8a"
              >
                {row.v1}
              </text>

              {hasSecondSeries && row.v2 !== null && (
                <>
                  <rect
                    x={cx + 2}
                    y={y2}
                    width="22"
                    height={h2}
                    rx="3"
                    fill="#059669"
                    fillOpacity="0.85"
                  />
                  <text
                    x={cx + 13}
                    y={y2 - 4}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="800"
                    fill="#065f46"
                  >
                    {row.v2}
                  </text>
                </>
              )}

              <text
                x={cx}
                y="184"
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#334155"
              >
                {row.label.slice(0, 12)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface TesatVisualChartProps {
  chart: TesatVisualChartData;
  showVietnamese: boolean;
}

export function TesatVisualChart({ chart, showVietnamese }: TesatVisualChartProps) {
  const [showReadingGuide, setShowReadingGuide] = useState(false);
  const isVi = showVietnamese || showReadingGuide;

  const renderSvgDiagram = () => {
    switch (chart.chartType) {
      case "PPF_OPPORTUNITY_COST":
        return (
          <svg viewBox="0 0 460 250" className="w-full h-auto max-h-[250px] select-none">
            <defs>
              <linearGradient id="ppfArea" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.03" />
              </linearGradient>
            </defs>
            {/* Grid */}
            <g stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1">
              <line x1="65" y1="45" x2="395" y2="45" />
              <line x1="65" y1="95" x2="395" y2="95" />
              <line x1="65" y1="145" x2="395" y2="145" />
              <line x1="165" y1="25" x2="165" y2="205" />
              <line x1="265" y1="25" x2="265" y2="205" />
            </g>
            {/* Axes */}
            <line x1="65" y1="20" x2="65" y2="205" stroke="#1e293b" strokeWidth="2" />
            <line x1="65" y1="205" x2="410" y2="205" stroke="#1e293b" strokeWidth="2" />
            <text x="52" y="22" fontSize="11" fontWeight="700" fill="#1e293b">Y재</text>
            <text x="415" y="209" fontSize="11" fontWeight="700" fill="#1e293b">X재</text>
            <text x="52" y="218" fontSize="11" fontWeight="700" fill="#64748b">O</text>

            {/* PPF Shaded & Curve */}
            <path d="M 65 40 Q 250 45 355 205 L 65 205 Z" fill="url(#ppfArea)" />
            <path d="M 65 40 Q 250 45 355 205" fill="none" stroke="#1d4ed8" strokeWidth="3.2" />

            {/* Dashed Opportunity Cost lines from A to B */}
            <line x1="65" y1="68" x2="175" y2="68" stroke="#64748b" strokeDasharray="4 3" />
            <line x1="175" y1="68" x2="175" y2="205" stroke="#64748b" strokeDasharray="4 3" />
            <line x1="65" y1="122" x2="268" y2="122" stroke="#64748b" strokeDasharray="4 3" />
            <line x1="268" y1="122" x2="268" y2="205" stroke="#64748b" strokeDasharray="4 3" />

            {/* Opportunity cost delta arrows */}
            <path d="M 95 72 L 95 118" stroke="#dc2626" strokeWidth="2" />
            <text x="102" y="99" fontSize="10" fontWeight="700" fill="#dc2626">
              -ΔY (기회비용)
            </text>
            <path d="M 180 188 L 262 188" stroke="#059669" strokeWidth="2" />
            <text x="195" y="182" fontSize="10" fontWeight="700" fill="#059669">
              +ΔX 생산
            </text>

            {/* Points A, B, I, U */}
            <circle cx="175" cy="68" r="5.5" fill="#1d4ed8" stroke="#fff" strokeWidth="1.5" />
            <text x="182" y="63" fontSize="11" fontWeight="800" fill="#1e3a8a">A (효율적)</text>

            <circle cx="268" cy="122" r="5.5" fill="#1d4ed8" stroke="#fff" strokeWidth="1.5" />
            <text x="276" y="120" fontSize="11" fontWeight="800" fill="#1e3a8a">B (효율적)</text>

            <circle cx="155" cy="148" r="5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
            <text x="120" y="165" fontSize="10.5" fontWeight="700" fill="#b45309">I (비효율·유휴자원)</text>

            <circle cx="330" cy="65" r="5" fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
            <text x="295" y="52" fontSize="10.5" fontWeight="700" fill="#b91c1c">U (달성 불가능)</text>
          </svg>
        );

      case "ELASTICITY_REVENUE":
        return (
          <svg viewBox="0 0 460 250" className="w-full h-auto max-h-[250px] select-none">
            {/* Axes */}
            <line x1="60" y1="20" x2="60" y2="205" stroke="#1e293b" strokeWidth="2" />
            <line x1="60" y1="205" x2="415" y2="205" stroke="#1e293b" strokeWidth="2" />
            <text x="22" y="25" fontSize="11" fontWeight="700" fill="#1e293b">가격(P)</text>
            <text x="390" y="224" fontSize="11" fontWeight="700" fill="#1e293b">수량(Q)</text>

            {/* Revenue Rectangles */}
            <rect x="60" y="75" width="120" height="130" fill="#93c5fd" fillOpacity="0.28" stroke="#3b82f6" strokeDasharray="3 3" />
            <rect x="60" y="115" width="215" height="90" fill="#6ee7b7" fillOpacity="0.32" stroke="#059669" strokeDasharray="3 3" />

            {/* Demand Curve D (Elastic slope) */}
            <line x1="75" y1="45" x2="380" y2="185" stroke="#1d4ed8" strokeWidth="3.2" />
            <text x="345" y="168" fontSize="11.5" fontWeight="800" fill="#1d4ed8">수요곡선 D (|Ed| &gt; 1)</text>

            {/* Points */}
            <circle cx="180" cy="93" r="5" fill="#1d4ed8" />
            <text x="186" y="88" fontSize="10.5" fontWeight="700" fill="#1e3a8a">A (P0, Q0)</text>

            <circle cx="275" cy="137" r="5.5" fill="#059669" />
            <text x="282" y="132" fontSize="10.5" fontWeight="800" fill="#065f46">B (P1↓ → Q1↑↑, TR 증가!)</text>

            {/* Labels on Axes */}
            <text x="36" y="96" fontSize="10.5" fontWeight="700" fill="#1e293b">P0</text>
            <text x="36" y="140" fontSize="10.5" fontWeight="700" fill="#059669">P1</text>
            <text x="172" y="220" fontSize="10.5" fontWeight="700" fill="#1e293b">Q0</text>
            <text x="268" y="220" fontSize="10.5" fontWeight="700" fill="#059669">Q1</text>

            {/* Annotation badge */}
            <rect x="195" y="26" width="205" height="44" rx="6" fill="#eff6ff" stroke="#bfdbfe" />
            <text x="205" y="43" fontSize="10" fontWeight="700" fill="#1e40af">• 탄력적(|Ed| &gt; 1): 가격 인하 시 TR 증가</text>
            <text x="205" y="59" fontSize="10" fontWeight="700" fill="#1e40af">• 비탄력적(|Ed| &lt; 1): 가격 인상 시 TR 증가</text>
          </svg>
        );

      case "PRICE_CONTROL_CEILING_FLOOR":
        return (
          <svg viewBox="0 0 460 250" className="w-full h-auto max-h-[250px] select-none">
            <line x1="65" y1="20" x2="65" y2="205" stroke="#1e293b" strokeWidth="2" />
            <line x1="65" y1="205" x2="410" y2="205" stroke="#1e293b" strokeWidth="2" />
            <text x="25" y="26" fontSize="11" fontWeight="700" fill="#1e293b">가격(P)</text>
            <text x="385" y="223" fontSize="11" fontWeight="700" fill="#1e293b">거래량(Q)</text>

            {/* Deadweight Loss Triangle */}
            <polygon points="155,70 155,154 225,112" fill="#fca5a5" fillOpacity="0.55" stroke="#dc2626" strokeWidth="1.5" />
            <text x="160" y="115" fontSize="9.5" fontWeight="800" fill="#991b1b">자중손실</text>

            {/* Supply S and Demand D */}
            <line x1="95" y1="190" x2="355" y2="35" stroke="#059669" strokeWidth="3" />
            <text x="360" y="40" fontSize="11.5" fontWeight="800" fill="#059669">S (공급)</text>

            <line x1="95" y1="35" x2="355" y2="190" stroke="#1d4ed8" strokeWidth="3" />
            <text x="360" y="192" fontSize="11.5" fontWeight="800" fill="#1d4ed8">D (수요)</text>

            {/* Equilibrium E* */}
            <line x1="65" y1="112" x2="225" y2="112" stroke="#64748b" strokeDasharray="3 3" />
            <line x1="225" y1="112" x2="225" y2="205" stroke="#64748b" strokeDasharray="3 3" />
            <circle cx="225" cy="112" r="5" fill="#1e293b" />
            <text x="232" y="109" fontSize="11" fontWeight="800" fill="#1e293b">E*(P*, Q*)</text>
            <text x="42" y="116" fontSize="10.5" fontWeight="700" fill="#1e293b">P*</text>

            {/* Price Floor Pf (above P*) */}
            <line x1="65" y1="70" x2="375" y2="70" stroke="#d97706" strokeWidth="2" strokeDasharray="5 3" />
            <text x="20" y="74" fontSize="10" fontWeight="800" fill="#b45309">가격하한(Pf)</text>
            <text x="210" y="63" fontSize="10" fontWeight="800" fill="#b45309">← 초과공급 (Qs &gt; Qd) →</text>

            {/* Price Ceiling Pc (below P*) */}
            <line x1="65" y1="154" x2="375" y2="154" stroke="#dc2626" strokeWidth="2.2" />
            <text x="20" y="158" fontSize="10" fontWeight="800" fill="#dc2626">가격상한(Pc)</text>
            <text x="205" y="170" fontSize="10" fontWeight="800" fill="#dc2626">← 초과수요 (Qd &gt; Qs) →</text>

            <line x1="155" y1="70" x2="155" y2="205" stroke="#64748b" strokeDasharray="3 3" />
            <text x="145" y="220" fontSize="10" fontWeight="700" fill="#dc2626">Q1(거래량)</text>
            <text x="220" y="220" fontSize="10" fontWeight="700" fill="#1e293b">Q*</text>
          </svg>
        );

      case "EXTERNALITY_PIGOU":
        return (
          <svg viewBox="0 0 460 250" className="w-full h-auto max-h-[250px] select-none">
            <line x1="65" y1="20" x2="65" y2="205" stroke="#1e293b" strokeWidth="2" />
            <line x1="65" y1="205" x2="410" y2="205" stroke="#1e293b" strokeWidth="2" />
            <text x="20" y="26" fontSize="10.5" fontWeight="700" fill="#1e293b">비용·편익</text>
            <text x="382" y="222" fontSize="11" fontWeight="700" fill="#1e293b">생산량(Q)</text>

            {/* Deadweight loss from overproduction */}
            <polygon points="200,108 265,142 265,72" fill="#fde68a" fillOpacity="0.7" stroke="#d97706" strokeWidth="1.5" />
            <text x="269" y="108" fontSize="9.5" fontWeight="800" fill="#b45309">사회적 순손실</text>

            {/* SMC (Social Marginal Cost) */}
            <line x1="85" y1="165" x2="325" y2="38" stroke="#dc2626" strokeWidth="3" />
            <text x="260" y="34" fontSize="10.5" fontWeight="800" fill="#dc2626">SMC (사회적 한계비용)</text>

            {/* PMC (Private Marginal Cost) */}
            <line x1="115" y1="195" x2="365" y2="62" stroke="#059669" strokeWidth="3" />
            <text x="335" y="88" fontSize="10.5" fontWeight="800" fill="#059669">PMC (사적 한계비용)</text>

            {/* MB = D */}
            <line x1="85" y1="48" x2="365" y2="192" stroke="#1d4ed8" strokeWidth="3" />
            <text x="340" y="180" fontSize="10.5" fontWeight="800" fill="#1d4ed8">MB (사회적 편익)</text>

            {/* Social Optimum E* vs Market Em */}
            <circle cx="200" cy="108" r="5.5" fill="#dc2626" />
            <text x="135" y="102" fontSize="10.5" fontWeight="800" fill="#dc2626">E* (사회적 최적)</text>
            <line x1="200" y1="108" x2="200" y2="205" stroke="#dc2626" strokeDasharray="3 3" />
            <text x="192" y="220" fontSize="10.5" fontWeight="800" fill="#dc2626">Q*</text>

            <circle cx="265" cy="142" r="5.5" fill="#1e293b" />
            <text x="272" y="150" fontSize="10.5" fontWeight="800" fill="#1e293b">Em (시장균형)</text>
            <line x1="265" y1="142" x2="265" y2="205" stroke="#1e293b" strokeDasharray="3 3" />
            <text x="255" y="220" fontSize="10.5" fontWeight="800" fill="#1e293b">Qm (과다생산)</text>
          </svg>
        );

      case "TAX_SUBSIDY_DWL":
        return (
          <svg viewBox="0 0 460 250" className="w-full h-auto max-h-[250px] select-none">
            <line x1="65" y1="20" x2="65" y2="205" stroke="#1e293b" strokeWidth="2" />
            <line x1="65" y1="205" x2="410" y2="205" stroke="#1e293b" strokeWidth="2" />
            <text x="25" y="26" fontSize="11" fontWeight="700" fill="#1e293b">가격(P)</text>
            <text x="382" y="222" fontSize="11" fontWeight="700" fill="#1e293b">거래량(Q)</text>

            {/* Consumer vs Producer Tax Burden boxes */}
            <rect x="65" y="82" width="115" height="32" fill="#93c5fd" fillOpacity="0.45" />
            <text x="72" y="102" fontSize="9.5" fontWeight="800" fill="#1e3a8a">소비자 부담</text>
            <rect x="65" y="114" width="115" height="32" fill="#6ee7b7" fillOpacity="0.45" />
            <text x="72" y="134" fontSize="9.5" fontWeight="800" fill="#065f46">생산자 부담</text>

            {/* DWL Triangle */}
            <polygon points="180,82 180,146 232,114" fill="#fca5a5" fillOpacity="0.65" stroke="#dc2626" />
            <text x="184" y="118" fontSize="9" fontWeight="800" fill="#991b1b">DWL</text>

            {/* S0 and St (Tax shifted supply) */}
            <line x1="100" y1="195" x2="360" y2="55" stroke="#059669" strokeWidth="2.8" />
            <text x="364" y="60" fontSize="11" fontWeight="800" fill="#059669">S0</text>

            <line x1="100" y1="131" x2="320" y2="15" stroke="#dc2626" strokeWidth="2.8" strokeDasharray="5 3" />
            <text x="325" y="24" fontSize="11" fontWeight="800" fill="#dc2626">St (S0 + 조세 t)</text>

            {/* Demand D */}
            <line x1="95" y1="35" x2="360" y2="192" stroke="#1d4ed8" strokeWidth="2.8" />
            <text x="364" y="192" fontSize="11" fontWeight="800" fill="#1d4ed8">D</text>

            {/* Labels */}
            <text x="42" y="86" fontSize="10" fontWeight="700" fill="#1e3a8a">Pc</text>
            <text x="42" y="118" fontSize="10" fontWeight="700" fill="#1e293b">P0</text>
            <text x="42" y="150" fontSize="10" fontWeight="700" fill="#065f46">Ps</text>
            <line x1="180" y1="82" x2="180" y2="205" stroke="#64748b" strokeDasharray="3 3" />
            <line x1="232" y1="114" x2="232" y2="205" stroke="#64748b" strokeDasharray="3 3" />
            <text x="172" y="220" fontSize="10" fontWeight="700" fill="#dc2626">Qt</text>
            <text x="225" y="220" fontSize="10" fontWeight="700" fill="#1e293b">Q0</text>
          </svg>
        );

      case "INDIFFERENCE_BUDGET":
        return (
          <svg viewBox="0 0 460 250" className="w-full h-auto max-h-[250px] select-none">
            <line x1="65" y1="20" x2="65" y2="205" stroke="#1e293b" strokeWidth="2" />
            <line x1="65" y1="205" x2="410" y2="205" stroke="#1e293b" strokeWidth="2" />
            <text x="35" y="26" fontSize="11" fontWeight="700" fill="#1e293b">Y재</text>
            <text x="385" y="222" fontSize="11" fontWeight="700" fill="#1e293b">X재</text>

            {/* Budget Line BL */}
            <line x1="65" y1="42" x2="345" y2="205" stroke="#dc2626" strokeWidth="2.8" />
            <text x="285" y="192" fontSize="10.5" fontWeight="800" fill="#dc2626">예산선 (기울기 = Px/Py)</text>

            {/* Indifference Curves U1, U2 */}
            <path d="M 105 32 Q 155 155 355 172" fill="none" stroke="#1d4ed8" strokeWidth="3" />
            <text x="360" y="174" fontSize="11" fontWeight="800" fill="#1d4ed8">무차별곡선 U*</text>

            <path d="M 85 60 Q 130 175 310 192" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" />
            <text x="315" y="195" fontSize="10" fontWeight="700" fill="#64748b">U0 (낮은 효용)</text>

            {/* Tangency E* */}
            <circle cx="196" cy="118" r="6" fill="#059669" stroke="#fff" strokeWidth="1.5" />
            <text x="206" y="112" fontSize="11" fontWeight="800" fill="#065f46">
              E* (최적점: MUx/Px = MUy/Py)
            </text>
            <line x1="65" y1="118" x2="196" y2="118" stroke="#64748b" strokeDasharray="3 3" />
            <line x1="196" y1="118" x2="196" y2="205" stroke="#64748b" strokeDasharray="3 3" />
            <text x="42" y="122" fontSize="10" fontWeight="700" fill="#1e293b">Y*</text>
            <text x="190" y="220" fontSize="10" fontWeight="700" fill="#1e293b">X*</text>
          </svg>
        );

      case "AD_AS_MACRO":
        return (
          <svg viewBox="0 0 460 250" className="w-full h-auto max-h-[250px] select-none">
            <line x1="65" y1="20" x2="65" y2="205" stroke="#1e293b" strokeWidth="2" />
            <line x1="65" y1="205" x2="410" y2="205" stroke="#1e293b" strokeWidth="2" />
            <text x="18" y="28" fontSize="10.5" fontWeight="700" fill="#1e293b">물가(P)</text>
            <text x="345" y="223" fontSize="10.5" fontWeight="700" fill="#1e293b">실질 GDP (Y)</text>

            {/* LRAS Vertical */}
            <line x1="235" y1="22" x2="235" y2="205" stroke="#475569" strokeWidth="2.5" strokeDasharray="5 3" />
            <text x="215" y="16" fontSize="10.5" fontWeight="800" fill="#334155">LRAS (장기총공급)</text>
            <text x="225" y="220" fontSize="10.5" fontWeight="800" fill="#334155">Yf(잠재GDP)</text>

            {/* SRAS0 and SRAS1 (Supply shock shift left) */}
            <line x1="105" y1="185" x2="365" y2="45" stroke="#059669" strokeWidth="3" />
            <text x="368" y="48" fontSize="11" fontWeight="800" fill="#059669">SRAS0</text>

            <line x1="75" y1="155" x2="325" y2="22" stroke="#dc2626" strokeWidth="2.8" strokeDasharray="5 3" />
            <text x="295" y="18" fontSize="10.5" fontWeight="800" fill="#dc2626">SRAS1 (공급충격)</text>

            {/* AD0 and AD1 */}
            <line x1="95" y1="40" x2="365" y2="188" stroke="#1d4ed8" strokeWidth="3" />
            <text x="368" y="190" fontSize="11" fontWeight="800" fill="#1d4ed8">AD0</text>

            {/* Equilibrium E0 and Stagflation E1 */}
            <circle cx="235" cy="115" r="5.5" fill="#1e293b" />
            <text x="243" y="118" fontSize="10.5" fontWeight="800" fill="#1e293b">E0 (균형)</text>

            <circle cx="195" cy="94" r="5.5" fill="#dc2626" />
            <text x="82" y="90" fontSize="10" fontWeight="800" fill="#dc2626">E1: 스태그플레이션(P↑·Y↓)</text>
          </svg>
        );

      case "PHILLIPS_CURVE":
        return (
          <svg viewBox="0 0 460 250" className="w-full h-auto max-h-[250px] select-none">
            <line x1="65" y1="20" x2="65" y2="205" stroke="#1e293b" strokeWidth="2" />
            <line x1="65" y1="205" x2="410" y2="205" stroke="#1e293b" strokeWidth="2" />
            <text x="15" y="26" fontSize="10" fontWeight="700" fill="#1e293b">물가상승률(π)</text>
            <text x="355" y="223" fontSize="10.5" fontWeight="700" fill="#1e293b">실업률(u)</text>

            {/* LRPC Vertical */}
            <line x1="220" y1="22" x2="220" y2="205" stroke="#dc2626" strokeWidth="3" />
            <text x="180" y="16" fontSize="10.5" fontWeight="800" fill="#dc2626">장기 필립스 곡선(LRPC)</text>
            <text x="202" y="220" fontSize="10.5" fontWeight="800" fill="#dc2626">Un (자연실업률)</text>

            {/* SRPC0 and SRPC1 */}
            <path d="M 95 42 Q 175 145 365 182" fill="none" stroke="#1d4ed8" strokeWidth="3" />
            <text x="325" y="170" fontSize="10.5" fontWeight="800" fill="#1d4ed8">단기 SRPC0</text>

            <path d="M 135 28 Q 215 115 390 148" fill="none" stroke="#d97706" strokeWidth="2.5" strokeDasharray="5 3" />
            <text x="315" y="128" fontSize="10" fontWeight="800" fill="#b45309">SRPC1 (기대인플레↑)</text>

            <circle cx="220" cy="136" r="5.5" fill="#1e293b" />
            <text x="228" y="133" fontSize="10" fontWeight="800" fill="#1e293b">A</text>
            <circle cx="220" cy="96" r="5.5" fill="#dc2626" />
            <text x="228" y="94" fontSize="10" fontWeight="800" fill="#dc2626">B (장기 균형)</text>
          </svg>
        );

      case "LORENZ_GINI":
        return (
          <svg viewBox="0 0 460 250" className="w-full h-auto max-h-[250px] select-none">
            {/* Box */}
            <rect x="85" y="25" width="260" height="175" fill="#f8fafc" stroke="#1e293b" strokeWidth="2" />
            {/* Shaded Area A */}
            <path d="M 85 200 L 345 25 Q 265 175 85 200 Z" fill="#93c5fd" fillOpacity="0.45" />
            {/* 45 degree line */}
            <line x1="85" y1="200" x2="345" y2="25" stroke="#059669" strokeWidth="2.5" strokeDasharray="4 3" />
            <text x="155" y="95" fontSize="10.5" fontWeight="800" fill="#065f46">완전평등선 (45°)</text>

            {/* Lorenz Curve */}
            <path d="M 85 200 Q 265 175 345 25" fill="none" stroke="#1d4ed8" strokeWidth="3.2" />
            <text x="242" y="145" fontSize="11" fontWeight="800" fill="#1e3a8a">로렌츠 곡선</text>

            {/* Area A and Area B labels */}
            <text x="205" y="122" fontSize="14" fontWeight="900" fill="#1d4ed8">면적 A</text>
            <text x="275" y="178" fontSize="14" fontWeight="900" fill="#64748b">면적 B</text>

            {/* Formula Callout */}
            <rect x="358" y="65" width="94" height="75" rx="8" fill="#eff6ff" stroke="#93c5fd" />
            <text x="366" y="88" fontSize="10.5" fontWeight="800" fill="#1e3a8a">지니계수 공식</text>
            <text x="368" y="110" fontSize="12" fontWeight="900" fill="#dc2626">G = A / (A+B)</text>
            <text x="366" y="128" fontSize="9.5" fontWeight="700" fill="#475569">0(평등) ~ 1(불평등)</text>

            <text x="72" y="216" fontSize="10" fontWeight="700" fill="#1e293b">0%</text>
            <text x="332" y="216" fontSize="10" fontWeight="700" fill="#1e293b">100% (인구 누적)</text>
            <text x="45" y="32" fontSize="10" fontWeight="700" fill="#1e293b">100%</text>
          </svg>
        );

      case "GAME_THEORY_MATRIX":
        return (
          <div className="my-2 overflow-x-auto">
            <table className="w-full text-center border-collapse rounded-xl overflow-hidden border border-slate-300 bg-white text-xs">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="p-2.5 border border-slate-600 font-bold">
                    구분 (A기업 \ B기업)
                  </th>
                  <th className="p-2.5 border border-slate-600 font-bold text-amber-300">
                    B기업: 가격 유지 (협조)
                  </th>
                  <th className="p-2.5 border border-slate-600 font-bold text-emerald-300">
                    B기업: 할인 경쟁 (우월전략)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2.5 border border-slate-200 font-bold bg-slate-100 text-slate-800">
                    A기업: 가격 유지 (협조)
                  </td>
                  <td className="p-3 border border-slate-200 bg-blue-50/50 font-semibold text-slate-800">
                    <div className="text-sm font-extrabold text-blue-900">(70억, 70억)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">파레토 최적 (담합/협조해)</div>
                  </td>
                  <td className="p-3 border border-slate-200 font-semibold text-slate-700">
                    <div className="text-sm font-bold">(20억, 90억)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">A 손해 · B 독식</div>
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 border border-slate-200 font-bold bg-slate-100 text-slate-800">
                    A기업: 할인 경쟁 (우월전략)
                  </td>
                  <td className="p-3 border border-slate-200 font-semibold text-slate-700">
                    <div className="text-sm font-bold">(90억, 20억)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">A 독식 · B 손해</div>
                  </td>
                  <td className="p-3 border-2 border-rose-500 bg-rose-50 font-bold text-rose-900">
                    <div className="text-sm font-extrabold text-rose-700">★ (40억, 40억)</div>
                    <div className="text-[11px] text-rose-600 mt-0.5">내시균형 (용의자의 딜레마)</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case "BOK_RATE_INFLATION_TREND":
      case "EXCHANGE_RATE_BOP_CHART":
      case "CORP_FINANCE_BAR_LINE": {
        const pts = chart.seriesData ?? [
          { label: "Q1", value1: 100, value2: 10 },
          { label: "Q2", value1: 120, value2: 14 },
          { label: "Q3", value1: 135, value2: 18 },
          { label: "Q4", value1: 115, value2: 12 },
        ];
        const maxV1 = Math.max(...pts.map((p) => p.value1), 1) * 1.15;
        const maxV2 = Math.max(...pts.map((p) => p.value2 ?? 0), 1) * 1.2;

        return (
          <svg viewBox="0 0 460 245" className="w-full h-auto max-h-[245px] select-none">
            {/* Grid */}
            <g stroke="#e2e8f0" strokeDasharray="3 3">
              <line x1="60" y1="45" x2="400" y2="45" />
              <line x1="60" y1="95" x2="400" y2="95" />
              <line x1="60" y1="145" x2="400" y2="145" />
            </g>
            <line x1="60" y1="25" x2="60" y2="195" stroke="#1e293b" strokeWidth="2" />
            <line x1="60" y1="195" x2="405" y2="195" stroke="#1e293b" strokeWidth="2" />

            {/* Legend */}
            <rect x="70" y="8" width="12" height="10" rx="2" fill="#3b82f6" />
            <text x="86" y="17" fontSize="10" fontWeight="700" fill="#1e3a8a">
              {chart.seriesLabel1Ko || "지표 1 (막대)"}
            </text>
            <circle cx="245" cy="13" r="4.5" fill="#dc2626" />
            <text x="255" y="17" fontSize="10" fontWeight="700" fill="#991b1b">
              {chart.seriesLabel2Ko || "지표 2 (꺾은선)"}
            </text>

            {/* Bars for value1 */}
            {pts.map((pt, idx) => {
              const step = 310 / pts.length;
              const cx = 95 + idx * step;
              const barH = Math.max(12, (pt.value1 / maxV1) * 145);
              const barY = 195 - barH;
              return (
                <g key={pt.label}>
                  <rect
                    x={cx - 18}
                    y={barY}
                    width="36"
                    height={barH}
                    rx="4"
                    fill="#3b82f6"
                    fillOpacity="0.82"
                  />
                  <text
                    x={cx}
                    y={barY - 5}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="800"
                    fill="#1e3a8a"
                  >
                    {pt.value1}
                  </text>
                  <text
                    x={cx}
                    y="214"
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="700"
                    fill="#334155"
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}

            {/* Line for value2 */}
            {pts.length > 1 && (
              <polyline
                fill="none"
                stroke="#dc2626"
                strokeWidth="3"
                points={pts
                  .map((pt, idx) => {
                    const step = 310 / pts.length;
                    const cx = 95 + idx * step;
                    const ly = 195 - ((pt.value2 ?? 0) / maxV2) * 145;
                    return `${cx},${ly}`;
                  })
                  .join(" ")}
              />
            )}
            {pts.map((pt, idx) => {
              const step = 310 / pts.length;
              const cx = 95 + idx * step;
              const ly = 195 - ((pt.value2 ?? 0) / maxV2) * 145;
              return (
                <g key={`line-${pt.label}`}>
                  <circle cx={cx} cy={ly} r="5" fill="#dc2626" stroke="#fff" strokeWidth="1.5" />
                  <rect x={cx - 16} y={ly - 22} width="32" height="14" rx="3" fill="#fef2f2" />
                  <text
                    x={cx}
                    y={ly - 12}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="800"
                    fill="#dc2626"
                  >
                    {pt.value2}
                  </text>
                </g>
              );
            })}
          </svg>
        );
      }

      case "SUPPLY_DEMAND_SHIFT":
      default:
        return (
          <svg viewBox="0 0 460 250" className="w-full h-auto max-h-[250px] select-none">
            <line x1="65" y1="20" x2="65" y2="205" stroke="#1e293b" strokeWidth="2" />
            <line x1="65" y1="205" x2="410" y2="205" stroke="#1e293b" strokeWidth="2" />
            <text x="25" y="26" fontSize="11" fontWeight="700" fill="#1e293b">가격(P)</text>
            <text x="382" y="222" fontSize="11" fontWeight="700" fill="#1e293b">거래량(Q)</text>

            {/* Supply S0 & S1 */}
            <line x1="100" y1="190" x2="345" y2="40" stroke="#059669" strokeWidth="3" />
            <text x="350" y="44" fontSize="11" fontWeight="800" fill="#059669">S0 (공급)</text>

            {/* Demand D0 & D1 (Right shift) */}
            <line x1="90" y1="45" x2="335" y2="192" stroke="#1d4ed8" strokeWidth="3" />
            <text x="340" y="195" fontSize="11" fontWeight="800" fill="#1d4ed8">D0</text>

            <line x1="145" y1="30" x2="385" y2="175" stroke="#dc2626" strokeWidth="2.8" strokeDasharray="5 3" />
            <text x="388" y="176" fontSize="11" fontWeight="800" fill="#dc2626">D1 (수요 증가)</text>

            {/* Equilibrium E0 -> E1 */}
            <circle cx="216" cy="119" r="5.5" fill="#1e293b" />
            <text x="175" y="115" fontSize="10.5" fontWeight="800" fill="#1e293b">E0(P0, Q0)</text>

            <circle cx="252" cy="96" r="5.5" fill="#dc2626" />
            <text x="260" y="96" fontSize="10.5" fontWeight="800" fill="#dc2626">E1(P1↑, Q1↑)</text>

            <line x1="65" y1="119" x2="216" y2="119" stroke="#64748b" strokeDasharray="3 3" />
            <line x1="216" y1="119" x2="216" y2="205" stroke="#64748b" strokeDasharray="3 3" />
            <line x1="65" y1="96" x2="252" y2="96" stroke="#dc2626" strokeDasharray="3 3" />
            <line x1="252" y1="96" x2="252" y2="205" stroke="#dc2626" strokeDasharray="3 3" />

            <text x="42" y="123" fontSize="10" fontWeight="700" fill="#1e293b">P0</text>
            <text x="42" y="99" fontSize="10" fontWeight="700" fill="#dc2626">P1</text>
            <text x="208" y="220" fontSize="10" fontWeight="700" fill="#1e293b">Q0</text>
            <text x="246" y="220" fontSize="10" fontWeight="700" fill="#dc2626">Q1</text>
          </svg>
        );
    }
  };

  return (
    <div className="my-5 rounded-2xl border-2 border-indigo-100 bg-gradient-to-b from-slate-50/90 to-white p-4 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-extrabold text-white shadow-xs">
            <BarChart3 className="w-3.5 h-3.5" />
            {chart.figureCode} 시각 자료 · BIỂU ĐỒ KINH TẾ
          </span>
          <span className="text-xs font-bold text-slate-800">
            {chart.titleKo}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowReadingGuide((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          {isVi ? "Ẩn giải thích biểu đồ" : "Cách đọc biểu đồ (Tiếng Việt)"}
        </button>
      </div>

      {isVi && (
        <div className="mb-3 rounded-xl bg-indigo-50/70 border border-indigo-200/70 px-3.5 py-2 text-xs font-semibold text-indigo-950">
          📊 <span className="font-bold">{chart.titleVi}</span>
          <span className="ml-2 text-slate-500">({chart.source})</span>
        </div>
      )}

      {/* Main SVG / Visual Canvas */}
      <div className="rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-2xs">
        {renderSvgDiagram()}
      </div>

      {/* Key Annotations & 5-Second Reading Trick */}
      <div className="mt-3 grid grid-cols-1 gap-2">
        <div className="rounded-xl bg-slate-100/80 px-3.5 py-2.5 text-xs text-slate-700 space-y-1">
          {(isVi ? chart.annotationsVi : chart.annotationsKo).map((note, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <span>{note}</span>
            </div>
          ))}
        </div>

        {isVi && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50/90 px-3.5 py-2.5 text-xs text-amber-950">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-amber-900">Mẹo đọc nhanh biểu đồ: </span>
              <span className="font-medium">{chart.readingTipVi}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Info className="w-3 h-3" />
          출처: {chart.source}
        </span>
        <span>
          축 기준: {isVi ? `${chart.xAxisLabelVi} / ${chart.yAxisLabelVi}` : `${chart.xAxisLabelKo} / ${chart.yAxisLabelKo}`}
        </span>
      </div>
    </div>
  );
}
