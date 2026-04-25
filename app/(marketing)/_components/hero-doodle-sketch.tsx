import type { ReactNode } from "react";

// ──────────────────────────────────────────────────────────────────────
// Hand-drawn marginalia for the hero. Every doodle is a freehand SVG
// stroke — no fills, no chips, no borders — so the marks read as ink
// scribbled onto the peach paper rather than "icons on a page".
//
// Strokes are intentionally a touch loose: bezier control points are
// nudged off-center, lines wobble through quadratic curves, and a few
// shapes are deliberately drawn unevenly. The whole field is rendered
// through a turbulence filter that adds a subtle pen-jitter, which is
// what sells the hand-drawn feel from across the room.
// ──────────────────────────────────────────────────────────────────────

type DoodleProps = {
	size: number;
	stroke?: number;
};

const base = (s: number, sw: number) => ({
	width: s,
	height: s,
	stroke: "currentColor",
	strokeWidth: sw,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
	fill: "none" as const,
});

const Heart = ({ size, stroke = 1.6 }: DoodleProps) => (
	<svg viewBox="0 0 32 30" {...base(size, stroke)} aria-hidden>
		<path d="M16 26 C 5.5 18, 1.8 11, 6.5 5.5 C 10.2 1.5, 14 3.5, 16 7.5 C 18 3.2, 22.2 1.6, 25.8 5.8 C 30.6 11.4, 26.2 18, 16 26 Z" />
	</svg>
);

const Star = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 32 32" {...base(size, stroke)} aria-hidden>
		<path d="M16 3 L19.6 12.2 L29.4 12.6 L21.6 18.6 L24.4 28 L16 22.6 L7.4 28 L10.4 18.6 L2.6 12.6 L12.4 12.2 Z" />
	</svg>
);

const Sparkle = ({ size, stroke = 1.4 }: DoodleProps) => (
	<svg viewBox="0 0 24 24" {...base(size, stroke)} aria-hidden>
		<path d="M12 2 C 12.4 8, 13 10.6, 22 12 C 13.2 13.2, 12.4 16, 12 22 C 11.6 16, 11 13.2, 2 12 C 11 10.6, 11.6 8, 12 2 Z" />
	</svg>
);

const HashTag = ({ size, stroke = 1.6 }: DoodleProps) => (
	<svg viewBox="0 0 24 24" {...base(size, stroke)} aria-hidden>
		<path d="M9 3 L7 21" />
		<path d="M17 3.4 L15 20.6" />
		<path d="M3.4 9 L21 9.4" />
		<path d="M2.8 16 L20.4 15.6" />
	</svg>
);

const At = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 24 24" {...base(size, stroke)} aria-hidden>
		<circle cx="12" cy="12" r="3.5" />
		<path d="M15.5 12 v 2 a 2.4 2.4 0 0 0 4.8 0 v -2 a 8.4 8.4 0 1 0 -3.6 6.9" />
	</svg>
);

const Smiley = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 24 24" {...base(size, stroke)} aria-hidden>
		<circle cx="12" cy="12" r="9" />
		<path d="M9 10.2 q 0 -0.4 0 0" strokeWidth={2.2} />
		<path d="M15 10.2 q 0 -0.4 0 0" strokeWidth={2.2} />
		<path d="M8 14 Q 12 18, 16 14" />
	</svg>
);

const Bubble = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 30 26" {...base(size, stroke)} aria-hidden>
		<path d="M3 6 Q 3 2.4, 7 2.4 H 23 Q 27 2.4, 27 6.4 V 14 Q 27 18, 23 18 H 13 L 8.5 22.6 L 9 18 H 7 Q 3 18, 3 14 Z" />
	</svg>
);

const MusicNote = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 24 24" {...base(size, stroke)} aria-hidden>
		<ellipse cx="7.5" cy="18.5" rx="3" ry="2.2" />
		<ellipse cx="17.5" cy="16" rx="3" ry="2.2" />
		<path d="M10.4 18 V 6 L 20.4 4 V 16" />
	</svg>
);

const Lightning = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 24 24" {...base(size, stroke)} aria-hidden>
		<path d="M14 2 L 4.5 14 L 11 14 L 9.4 22 L 19.4 9.4 L 13.4 9.4 L 15.6 2.4 Z" />
	</svg>
);

const Eye = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 28 20" {...base(size, stroke)} aria-hidden>
		<path d="M2 10 Q 8 2, 14 2 Q 20 2, 26 10 Q 20 18, 14 18 Q 8 18, 2 10 Z" />
		<circle cx="14" cy="10" r="3" />
	</svg>
);

const Camera = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 24 22" {...base(size, stroke)} aria-hidden>
		<path d="M2.6 6.4 H 7.6 L 9.6 3.6 H 14.6 L 16.6 6.4 H 21.4 V 19 H 2.6 Z" />
		<circle cx="12" cy="12.6" r="3.6" />
	</svg>
);

const PaperPlane = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 24 22" {...base(size, stroke)} aria-hidden>
		<path d="M22 2 L 2 11 L 9 13 L 12 21 Z" />
		<path d="M22 2 L 9 13" />
	</svg>
);

const Bell = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 24 24" {...base(size, stroke)} aria-hidden>
		<path d="M6 16.4 V 11 a 6 6 0 1 1 12 0 V 16.4 L 20.4 18.4 H 3.6 Z" />
		<path d="M10 21 a 2 2 0 0 0 4 0" />
	</svg>
);

const SunBurst = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 24 24" {...base(size, stroke)} aria-hidden>
		<circle cx="12" cy="12" r="3.4" />
		<path d="M12 2.4 V 5.4" />
		<path d="M12 18.6 V 21.6" />
		<path d="M2.4 12 H 5.4" />
		<path d="M18.6 12 H 21.6" />
		<path d="M5 5 L 7.2 7.2" />
		<path d="M16.8 16.8 L 19 19" />
		<path d="M5 19 L 7.2 16.8" />
		<path d="M16.8 7.2 L 19 5" />
	</svg>
);

const Spiral = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 24 24" {...base(size, stroke)} aria-hidden>
		<path d="M12 12 q 0 -1.4 1.4 -1.4 q 2.8 0 2.8 2.8 q 0 4.2 -4.2 4.2 q -5.6 0 -5.6 -5.6 q 0 -7 7 -7 q 8.4 0 8.4 8.4" />
	</svg>
);

const Squiggle = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 36 12" width={size} height={(size * 12) / 36}
		stroke="currentColor" strokeWidth={stroke}
		strokeLinecap="round" strokeLinejoin="round" fill="none" aria-hidden>
		<path d="M2 7 Q 6 1, 10 7 T 18 7 T 26 7 T 34 7" />
	</svg>
);

const ArrowSwoop = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 36 16" width={size} height={(size * 16) / 36}
		stroke="currentColor" strokeWidth={stroke}
		strokeLinecap="round" strokeLinejoin="round" fill="none" aria-hidden>
		<path d="M2 13 Q 12 -2, 30 9" />
		<path d="M26 4 L 30.5 9 L 25 11" />
	</svg>
);

const Asterisk = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 16 16" {...base(size, stroke)} aria-hidden>
		<path d="M8 1.6 V 14.4" />
		<path d="M2.4 4.6 L 13.6 11.4" />
		<path d="M13.6 4.6 L 2.4 11.4" />
	</svg>
);

const Plus = ({ size, stroke = 1.6 }: DoodleProps) => (
	<svg viewBox="0 0 16 16" {...base(size, stroke)} aria-hidden>
		<path d="M8 2.6 V 13.4" />
		<path d="M2.6 8 H 13.4" />
	</svg>
);

const Dots = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 28 8" width={size} height={(size * 8) / 28}
		stroke="currentColor" strokeWidth={stroke}
		strokeLinecap="round" strokeLinejoin="round" fill="currentColor" aria-hidden>
		<circle cx="4" cy="4" r="1.4" />
		<circle cx="14" cy="4" r="1.4" />
		<circle cx="24" cy="4" r="1.4" />
	</svg>
);

const Tilde = ({ size, stroke = 1.6 }: DoodleProps) => (
	<svg viewBox="0 0 24 8" width={size} height={(size * 8) / 24}
		stroke="currentColor" strokeWidth={stroke}
		strokeLinecap="round" strokeLinejoin="round" fill="none" aria-hidden>
		<path d="M2 5 Q 6 -1, 12 4 T 22 4" />
	</svg>
);

const ThumbsUp = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 24 24" {...base(size, stroke)} aria-hidden>
		<path d="M3.4 11 H 7 V 21 H 3.4 Z" />
		<path d="M7 11 L 11.6 3.4 Q 14 1.6, 14 5 V 9.4 H 19 Q 21.6 9.4, 21 12.4 L 19.6 19 Q 19 21, 17 21 H 7 Z" />
	</svg>
);

const Quote = ({ size, stroke = 1.6 }: DoodleProps) => (
	<svg viewBox="0 0 24 24" {...base(size, stroke)} aria-hidden>
		<path d="M5 6 Q 2.6 6, 2.6 9 V 13 H 7 V 9 Q 7 6.6, 5 6 Z" />
		<path d="M16 6 Q 13.6 6, 13.6 9 V 13 H 18 V 9 Q 18 6.6, 16 6 Z" />
	</svg>
);

const Exclaim = ({ size, stroke = 1.6 }: DoodleProps) => (
	<svg viewBox="0 0 8 24" width={(size * 8) / 24} height={size}
		stroke="currentColor" strokeWidth={stroke}
		strokeLinecap="round" strokeLinejoin="round" fill="currentColor" aria-hidden>
		<path d="M4 3 L 4 16" stroke="currentColor" fill="none" />
		<circle cx="4" cy="20" r="1.4" />
	</svg>
);

const Curly = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 28 12" width={size} height={(size * 12) / 28}
		stroke="currentColor" strokeWidth={stroke}
		strokeLinecap="round" strokeLinejoin="round" fill="none" aria-hidden>
		<path d="M2 6 q 2 -4 4 0 q 2 4 4 0 q 2 -4 4 0 q 2 4 4 0 q 2 -4 4 0" />
	</svg>
);

const Underline = ({ size, stroke = 1.6 }: DoodleProps) => (
	<svg viewBox="0 0 32 8" width={size} height={(size * 8) / 32}
		stroke="currentColor" strokeWidth={stroke}
		strokeLinecap="round" strokeLinejoin="round" fill="none" aria-hidden>
		<path d="M2 5 Q 10 1, 18 3.6 T 30 4" />
	</svg>
);

const Repost = ({ size, stroke = 1.5 }: DoodleProps) => (
	<svg viewBox="0 0 24 24" {...base(size, stroke)} aria-hidden>
		<path d="M4 9 L 4 6.5 Q 4 4, 6.4 4 H 18" />
		<path d="M14.4 1.6 L 18 4 L 14.4 6.4" />
		<path d="M20 15 L 20 17.5 Q 20 20, 17.6 20 H 6" />
		<path d="M9.6 22.4 L 6 20 L 9.6 17.6" />
	</svg>
);

// ──────────────────────────────────────────────────────────────────────
// Layout — perimeter heavy, center column kept clear for the headline
// and signup. Sizes vary widely so the wall feels hand-placed, not
// gridded.
// ──────────────────────────────────────────────────────────────────────

type Doodle = {
	node: ReactNode;
	x: number;
	y: number;
	rot: number;
	op: number; // 0–100, baseline is 22
};

const D = (
	node: ReactNode,
	x: number,
	y: number,
	rot: number,
	op = 22,
): Doodle => ({ node, x, y, rot, op });

const DOODLES: Doodle[] = [
	// ── top band
	D(<Heart size={30} />,        4,  9,  -12, 24),
	D(<Sparkle size={18} />,      11, 4,  6,   18),
	D(<Bubble size={32} />,       17, 18, -7,  22),
	D(<HashTag size={22} />,      26, 8,  9,   20),
	D(<Star size={20} />,         33, 19, -4,  20),
	D(<At size={26} />,           42, 6,  6,   22),
	D(<Sparkle size={14} />,      48, 22, -10, 18),
	D(<ThumbsUp size={26} />,     56, 4,  -3,  22),
	D(<Squiggle size={36} />,     62, 17, 5,   18),
	D(<Bell size={22} />,         70, 6,  -8,  22),
	D(<Smiley size={26} />,       77, 17, 7,   22),
	D(<MusicNote size={22} />,    85, 5,  -5,  22),
	D(<Quote size={20} />,        92, 18, 6,   20),
	D(<Asterisk size={16} />,     97, 7,  0,   22),

	// ── upper-middle / margins
	D(<Lightning size={22} />,    3,  26, 8,   22),
	D(<Dots size={28} />,         9,  35, -12, 18),
	D(<Plus size={14} />,         15, 28, 0,   22),
	D(<Eye size={28} />,          93, 28, -6,  22),
	D(<Curly size={28} />,        88, 36, 4,   18),
	D(<Tilde size={24} />,        97, 35, 0,   18),

	// ── upper sides — sketch annotations near the headline edges
	D(<ArrowSwoop size={36} />,   8,  44, -8,  18),
	D(<Sparkle size={14} />,      4,  50, 0,   22),
	D(<Star size={16} />,         95, 46, 12,  20),
	D(<Underline size={28} />,    93, 52, -4,  18),

	// ── middle sides — sparser (stay out of the form)
	D(<Camera size={26} />,       4,  60, -7,  22),
	D(<PaperPlane size={24} />,   10, 70, 6,   22),
	D(<Heart size={18} />,        15, 60, -10, 22),
	D(<Repost size={26} />,       95, 60, 7,   22),
	D(<HashTag size={20} />,      90, 70, -5,  22),
	D(<Asterisk size={14} />,     85, 62, 0,   22),

	// ── lower-middle
	D(<SunBurst size={26} />,     5,  79, 4,   22),
	D(<Tilde size={24} />,        13, 86, -8,  18),
	D(<Spiral size={24} />,       95, 79, 6,   22),
	D(<Plus size={14} />,         88, 86, 0,   22),
	D(<Sparkle size={16} />,      96, 92, -6,  20),

	// ── bottom band
	D(<Bubble size={28} />,       20, 92, -6,  22),
	D(<Star size={18} />,         28, 87, 8,   20),
	D(<Exclaim size={20} />,      33, 95, -4,  22),
	D(<MusicNote size={22} />,    40, 88, 7,   22),
	D(<Smiley size={22} />,       48, 95, -3,  22),
	D(<Lightning size={20} />,    55, 88, 5,   22),
	D(<Quote size={18} />,        61, 95, -8,  20),
	D(<Heart size={20} />,        67, 88, 4,   22),
	D(<Curly size={28} />,        74, 94, -2,  18),
	D(<ThumbsUp size={22} />,     80, 88, 6,   22),
	D(<Dots size={26} />,         84, 95, 0,   18),
];

export function HeroDoodleSketch() {
	return (
		<div
			aria-hidden
			className="pointer-events-none absolute inset-0 overflow-hidden"
		>
			{/* Subtle pen-jitter filter — just enough to break the perfect
			    geometry of the SVG strokes so they read as hand-drawn.
			    Rendered once, referenced by every doodle below. */}
			<svg className="absolute h-0 w-0" aria-hidden>
				<defs>
					<filter id="pen-jitter" x="-5%" y="-5%" width="110%" height="110%">
						<feTurbulence
							type="fractalNoise"
							baseFrequency="0.022"
							numOctaves={2}
							seed={7}
							result="noise"
						/>
						<feDisplacementMap
							in="SourceGraphic"
							in2="noise"
							scale="1.2"
						/>
					</filter>
				</defs>
			</svg>

			<div
				className="absolute inset-0 text-ink"
				style={{ filter: "url(#pen-jitter)" }}
			>
				{DOODLES.map((d, i) => (
					<span
						key={i}
						className="absolute inline-flex"
						style={{
							left: `${d.x}%`,
							top: `${d.y}%`,
							opacity: d.op / 100,
							transform: `translate(-50%, -50%) rotate(${d.rot}deg)`,
						}}
					>
						{d.node}
					</span>
				))}
			</div>
		</div>
	);
}
