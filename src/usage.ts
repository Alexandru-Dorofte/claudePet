// "Usage at a glance": token counts read from Claude Code's own transcripts, and the key that shows them.
//
// Every API call is an assistant entry carrying message.usage (written once per content block, so
// counted once per message.id). Tokens here = input + cache writes + output; cache reads are left out,
// they re-count the whole context on every call (~70M for a long session) and would drown the rest.
// No $: Claude Code only writes its cost (a cost-state entry) when a session exits, so the live one has none.
import { closeSync, openSync, readdirSync, readSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { CREAM, crab, GREY, INK, kit, rest } from "./art";

const PROJECTS = join(homedir(), ".claude", "projects");

export type Usage = { time: number; turns: number; tokens: number; today: number };

/** What one transcript has added up so far. Transcripts only grow, so each read starts where the last stopped. */
type Tally = { offset: number; ids: Set<string>; tokens: number; byDay: Map<string, number>; turns: number; first: number; last: number };
const tallies = new Map<string, Tally>();

const day = (ms: number) => new Date(ms).toLocaleDateString("sv"); // local YYYY-MM-DD

function update(path: string, size: number): Tally {
	let t = tallies.get(path);
	if (!t || size < t.offset) tallies.set(path, (t = { offset: 0, ids: new Set(), tokens: 0, byDay: new Map(), turns: 0, first: 0, last: 0 }));
	if (size === t.offset) return t;
	const buf = Buffer.allocUnsafe(size - t.offset);
	const fd = openSync(path, "r");
	try {
		readSync(fd, buf, 0, buf.length, t.offset);
	} finally {
		closeSync(fd);
	}
	const end = buf.lastIndexOf(10) + 1; // stop before a line still being written
	t.offset += end;
	for (const line of buf.toString("utf8", 0, end).split("\n")) {
		// only parse lines that can matter: most are tool output
		if (!line.includes('"kind":"human"') && !line.includes('"usage"')) continue;
		try {
			const e = JSON.parse(line);
			const time = Date.parse(e.timestamp ?? "");
			if (time) (t.first ||= time), (t.last = time);
			if (e.type === "user" && e.origin?.kind === "human") t.turns++; // a prompt you typed
			const u = e.message?.usage;
			if (e.type !== "assistant" || !u || t.ids.has(e.message.id)) continue;
			t.ids.add(e.message.id);
			const n = (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.output_tokens ?? 0);
			t.tokens += n;
			if (time) t.byDay.set(day(time), (t.byDay.get(day(time)) ?? 0) + n);
		} catch {
			// not an entry after all
		}
	}
	return t;
}

/**
 * This session (`transcript` plus its subagents) and today's total over every transcript.
 * Only files touched today are read; stat first, then read only what was appended since last time.
 */
export function usage(transcript: string): Usage {
	const midnight = new Date().setHours(0, 0, 0, 0);
	const today = day(Date.now());
	const session = transcript.replace(/\.jsonl$/, "");
	const out: Usage = { time: 0, turns: 0, tokens: 0, today: 0 };
	let files: string[] = [];
	try {
		files = readdirSync(PROJECTS, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".jsonl"));
	} catch {
		return out; // no Claude Code here
	}
	for (const f of files) {
		const path = join(PROJECTS, f);
		const mine = !!transcript && (path === transcript || path.startsWith(`${session}/`));
		let st;
		try {
			st = statSync(path);
		} catch {
			continue;
		}
		if (st.mtimeMs < midnight && !mine) continue;
		const t = update(path, st.size);
		out.today += t.byDay.get(today) ?? 0;
		if (!mine) continue;
		out.tokens += t.tokens;
		if (path === transcript) (out.turns = t.turns), (out.time = t.last - t.first);
	}
	return out;
}

const count = (n: number) => (n < 1000 ? `${n}` : n < 999_500 ? `${Math.round(n / 1000)}k` : `${(n / 1e6).toFixed(1)}M`);
const hm = (ms: number) => (ms < 3_600_000 ? `${Math.round(ms / 60_000)}m` : `${Math.floor(ms / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m`);

/** The usage card: a small crab over four label/value lines, in the same type as the crab key. */
export function drawUsage(u: Usage): string {
	const out: string[] = [];
	const d = kit(out);
	crab(d, 0, 0, rest());
	d.end();
	const lines = [
		["Session", hm(u.time)],
		["Turns", `${u.turns}`],
		["Tokens", count(u.tokens)],
		["Today", count(u.today)],
	];
	const text = lines.map(
		([label, value], i) =>
			`<text x="0.6" y="${11.4 + i * 3.6}" fill="${GREY}">${label}</text><text x="23.4" y="${11.4 + i * 3.6}" text-anchor="end" fill="${CREAM}">${value}</text>`,
	);
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="144" height="144" shape-rendering="crispEdges"><rect width="24" height="24" fill="${INK}"/><g transform="translate(8 1.4) scale(0.5)">${out.join("")}</g><g font-size="2.6" font-family="Menlo, monospace" font-weight="bold">${text.join("")}</g></svg>`;
}
