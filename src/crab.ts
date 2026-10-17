import { CREAM, crab, INK, kit, rest } from "./art";
import { SCENES, type Mood } from "./scenes";

const SPINNER = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"]; // Claude Code's spinner, ping-ponged
const MAX_MINIS = 3; // ponytail: more subagents than this still show 3; add a "+N" badge if that matters
const MINI = 0.3; // 16x10 crab -> 4.8x3
// One text size for everything, so the words never jump in size. 15 characters fit across the key:
// the longest line is "✻ Delegating...". Longer text (e.g. "Cooked for 1m 53s") wraps onto two lines.
const TEXT_SIZE = 2.6;
const TEXT_FITS = 15;

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * One frame of the key as an SVG.
 * @param variant which of the mood's animations (any integer; wrapped to the mood's count)
 * @param f       frame number, 5 per second
 * @param agents  running subagents, drawn as mini crabs
 * @param text    bottom line, e.g. "Thinking…" or "Baked for 1m 52s"
 * @param spin    prefix the text with Claude Code's spinner symbol
 */
export function draw(mood: Mood, variant: number, f: number, agents = 0, text = "", spin = false): string {
	const out: string[] = [];
	const d = kit(out);

	const variants = SCENES[mood];
	const pose = rest();
	const scene = variants[variant % variants.length](f, pose);
	if (f % 18 === 0 || f % 47 === 2) pose.eyes = "closed"; // a natural blink every few seconds, sometimes a double
	crab(d, 4 + (scene.dx ?? 0), 6 + (scene.dy ?? 0), pose);
	scene.props?.(d);
	d.end();

	// subagents: small crabs in a row under the big one, each busy out of step with the others
	const n = Math.min(agents, MAX_MINIS);
	const w = 16 * MINI;
	for (let i = 0; i < n; i++) {
		const mini: string[] = [];
		const busy = rest();
		busy.eyes = i % 2 ? "open" : "down";
		busy.arms = (f + i) % 2 ? [true, false] : [false, true];
		busy.legShift = i === 2 ? ((f + i) % 2 ? 1 : -1) : 0;
		const m = kit(mini);
		crab(m, 0, 0, busy);
		m.end();
		const x = (24 - n * w - (n - 1) * 1.2) / 2 + i * (w + 1.2);
		out.push(`<g transform="translate(${x.toFixed(2)} 16.6) scale(${MINI})">${mini.join("")}</g>`);
	}

	if (text) {
		// "Thinking…" -> "Thinking." "Thinking.." "Thinking...", padded so the word doesn't shift as the dots change
		const word = text.endsWith("…") ? `${text.slice(0, -1)}${".".repeat(1 + (Math.floor(f / 2) % 3)).padEnd(3, "\u00A0")}` : text;
		const line = spin ? `${SPINNER[f % SPINNER.length]} ${word}` : word;
		// wrap after "for" so the time stays together ("Cooked for" / "1m 53s"), else at the last space that fits
		const at = line.indexOf(" for ");
		const cut = at > 0 ? at + 4 : line.lastIndexOf(" ", TEXT_FITS);
		const lines = line.length > TEXT_FITS && cut > 0 ? [line.slice(0, cut), line.slice(cut + 1)] : [line];
		lines.forEach((l, i) =>
			out.push(
				`<text x="12" y="${22.6 - (lines.length - 1 - i) * 2.9}" text-anchor="middle" font-size="${TEXT_SIZE}" font-family="Menlo, monospace" font-weight="bold" fill="${CREAM}">${xml(l)}</text>`,
			),
		);
	}

	const bg = mood === "sleeping" && n === 0 ? "#0B0B0A" : INK;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="144" height="144" shape-rendering="crispEdges"><rect width="24" height="24" fill="${bg}"/>${out.join("")}</svg>`;
}
