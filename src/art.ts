// Drawing kit shared by every scene: palette, the 24x24 grid helpers and Clawd himself.
//
// Grid layout (1 unit = 6px on the 144px key):
//   y 0-5      props above the crab (clouds, notes, Z's…)
//   y 6-15     the crab: claws x4-5 / x18-19, body x6-17 (y6-13), legs y14-15
//   y 16.6-19.6 subagent mini crabs        y 19.8-23  text line
// Scenes may reach y17 (a held book, a surfboard); the mini crabs draw over that. Nothing goes lower.

export const ORANGE = "#D97757"; // Claude's orange
export const INK = "#141413";
export const CREAM = "#FAF9F5";
export const GREY = "#8E8C84";
export const SILVER = "#C2C0B6";
export const BLUE = "#6A9BCC";
export const GREEN = "#5DA34A";
export const YELLOW = "#F2C14E";
export const PINK = "#E8798F";
export const LILAC = "#8B8FD9";
export const BROWN = "#A8553A";

/** A music note ♪ */
export const NOTE = ["..##", "..#.", "..#.", "###.", "##.."];

/** A "?" (thinking, waiting for an answer) */
export const QUESTION = ["###", "..#", ".#.", "...", ".#."];

export type Rect = (x: number, y: number, w: number, h: number, c?: string) => void;
export type Draw = {
	rect: Rect;
	/** Pixel art: "#" is a pixel in colour c, anything else is transparent. */
	sprite: (x: number, y: number, rows: string[], c: string) => void;
};

export type Pose = {
	eyes: "open" | "closed" | "up" | "down";
	ex: number; // eye look offset, -1..1
	arms: [boolean, boolean]; // left/right claw raised?
	legShift: number;
	squash: number; // flattens the body from the top, 0..2
};

/** A scene variant: pose the crab, optionally move it (dx -4..4 keeps it on the key, dy bounces), and draw props on top of it. */
export type Scene = { dx?: number; dy?: number; props?: (d: Draw) => void };
export type Variant = (f: number, pose: Pose) => Scene;

export const rest = (): Pose => ({ eyes: "open", ex: 0, arms: [false, false], legShift: 0, squash: 0 });

/**
 * Draws into `out` as SVG. Consecutive rects of one colour merge into a single <path>, which keeps
 * frames small and quick for Stream Deck to render while preserving draw order. Call end() when done.
 */
export function kit(out: string[]): Draw & { end: () => void } {
	let colour = "";
	let path = "";
	const end = () => {
		if (path) out.push(`<path fill="${colour}" d="${path}"/>`);
		path = "";
	};
	const rect: Rect = (x, y, w, h, c = ORANGE) => {
		if (c !== colour) end(), (colour = c);
		path += `M${x} ${y}h${w}v${h}H${x}z`;
	};
	const sprite = (x: number, y: number, rows: string[], c: string) => {
		for (let j = 0; j < rows.length; j++)
			for (let i = 0; i < rows[j].length; i++) if (rows[j][i] === "#") rect(x + i, y + j, 1, 1, c);
	};
	return { rect, sprite, end };
}

/**
 * Clawd, traced from Claude Code's welcome-screen block art (▐▛███▜▌ / ▝▜█████▛▘ / ▘▘ ▝▝):
 * a 16x10 box with its top-left at (ox, top): 2x2 claws, 12x8 body, four 1x2 legs.
 */
export function crab({ rect }: Draw, ox: number, top: number, p: Pose): void {
	const t = top + p.squash;
	const h = 8 - p.squash;
	for (const x of [3, 5, 10, 12]) rect(ox + x + p.legShift, t + h, 1, 2);
	rect(ox + 2, t, 12, h);
	rect(ox, t + (p.arms[0] ? 1 : 4), 2, 2);
	rect(ox + 14, t + (p.arms[1] ? 1 : 4), 2, 2);
	for (const [i, x] of [
		[0, 4],
		[1, 11],
	]) {
		if (p.eyes === "closed") rect(ox + x - i, t + 3, 2, 1, INK);
		else rect(ox + x + p.ex, t + (p.eyes === "up" ? 1 : p.eyes === "down" ? 3 : 2), 1, 2, INK);
	}
}
