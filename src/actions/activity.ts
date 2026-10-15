import { action, SingletonAction } from "@elgato/streamdeck";
import { readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { CREAM, GREY, INK, ORANGE } from "../art";

const HOME = homedir();
// written by hooks/claudepet.sh
const STEP_FILE = join(HOME, ".claudepet-step"); // tool, cwd, input JSON; mtime = start
const END_FILE = join(HOME, ".claudepet-step-end"); // "done" | "failed"; mtime = end
const STATE_FILE = join(HOME, ".claudepet"); // the crab's mood word

const FRAME_MS = 120; // Claude Code's spinner steps at about this rate
const SHIMMER_MS = 2_400; // one sweep of the shimmer across the tool name
const SPIN = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"]; // Claude Code's spinner, out and back
const IDLE = ["done", "listening", "sleeping", "attention"]; // moods where no tool is running

const ARG = "#DAD8D0";
const DIM = "#6E6C66";
const RED = "#E5534B";
const PER_LINE = 12; // Menlo at 3 units on the 24-unit key

type Step = { name: string; arg: string; start: number; end: number; failed: boolean };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Paths the way the terminal shows them: relative to the project, else ~/… */
const short = (p: string, cwd: string) => (cwd && p.startsWith(`${cwd}/`) ? p.slice(cwd.length + 1) : p.startsWith(`${HOME}/`) ? `~${p.slice(HOME.length)}` : p);

/** Claude Code's label for a tool call: Bash(npm run build), Update(src/x.ts), Search(pattern: "x")… */
function label(tool: string, input: Record<string, unknown>, cwd: string): { name: string; arg: string } {
	const s = (k: string) => (typeof input[k] === "string" ? (input[k] as string) : "");
	switch (tool) {
		case "Bash":
			return { name: "Bash", arg: s("command").split("\n")[0] };
		case "Read":
			return { name: "Read", arg: short(s("file_path"), cwd) };
		case "Edit":
		case "MultiEdit":
			return { name: input.old_string === "" ? "Create" : "Update", arg: short(s("file_path"), cwd) };
		case "Write":
			return { name: "Write", arg: short(s("file_path"), cwd) };
		case "NotebookEdit":
			return { name: "Edit Notebook", arg: short(s("notebook_path"), cwd) };
		case "Grep":
		case "Glob":
			return { name: "Search", arg: `pattern: "${s("pattern")}"` };
		case "WebSearch":
			return { name: "Web Search", arg: `"${s("query")}"` };
		case "WebFetch":
			return { name: "Fetch", arg: s("url").replace(/^https?:\/\//, "") };
		case "Agent":
		case "Task":
			return { name: "Agent", arg: s("description") };
	}
	const mcp = tool.match(/^mcp__(.+?)__(.+)$/); // mcp__server__tool -> "tool", server below
	if (mcp) return { name: mcp[2], arg: mcp[1] };
	return { name: tool, arg: s("description") || s("command") || s("file_path") || s("pattern") };
}

/** Up to three lines, breaking at the last space or after the last "/" that fits; the last line cut with … */
function wrap(text: string, max = 3): string[] {
	const lines: string[] = [];
	let rest = text.trim();
	while (rest && lines.length < max) {
		if (rest.length <= PER_LINE || lines.length === max - 1) {
			// the last line takes what's left, cut with … if needed
			lines.push(rest);
			rest = "";
			break;
		}
		let cut = PER_LINE;
		for (let i = PER_LINE; i > 0; i--) {
			if (rest[i] === " ") (cut = i), (i = 0);
			else if (rest[i - 1] === "/") (cut = i), (i = 0);
		}
		lines.push(rest.slice(0, cut).trimEnd());
		rest = rest.slice(cut).trimStart();
	}
	return lines.map((l) => (l.length > PER_LINE ? `${l.slice(0, PER_LINE - 1)}…` : l));
}

const clock = (ms: number) => `${Math.floor(ms / 60_000)}:${String(Math.floor((ms % 60_000) / 1000)).padStart(2, "0")}`;
const took = (ms: number) => (ms < 60_000 ? `${Math.max(1, Math.round(ms / 1000))}s` : `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`);

/** The key: marker + tool name, the wrapped argument, and a time or status line. */
export function drawActivity(step: Step | undefined, idle: boolean, now: number): string {
	if (!step) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="144" height="144"><rect width="24" height="24" fill="${INK}"/></svg>`;
	const running = !step.end && !idle;
	const font = `font-family="Menlo, monospace" font-weight="bold"`;
	let marker: string, nameFill: string, defs = "", foot = "", time: string;
	if (running) {
		marker = `<text x="2.1" y="4.7" font-size="3.4" text-anchor="middle" fill="${ORANGE}">${SPIN[Math.floor(now / FRAME_MS) % SPIN.length]}</text>`;
		// shimmer: a bright band sweeps left to right through the name, then a pause off the right edge
		const x = -6 + ((now % SHIMMER_MS) / SHIMMER_MS) * 36;
		defs = `<defs><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="${x}" y1="0" x2="${x + 6}" y2="0"><stop offset="0" stop-color="${GREY}"/><stop offset="0.5" stop-color="#FFFFFF"/><stop offset="1" stop-color="${GREY}"/></linearGradient></defs>`;
		nameFill = "url(#s)";
		time = clock(now - step.start);
	} else {
		const dot = step.failed ? RED : GREY;
		marker = `<circle cx="2.1" cy="3.6" r="1" fill="${dot}"/>`;
		nameFill = idle ? GREY : CREAM;
		if (step.failed) foot = "failed";
		else if (idle) foot = "idle";
		time = step.end ? took(step.end - step.start) : "";
	}
	const argFill = idle && !running ? DIM : ARG;
	const args = wrap(step.arg)
		.map((l, i) => `<text x="1.4" y="${10.2 + i * 3.9}" font-size="3" fill="${argFill}">${esc(l)}</text>`)
		.join("");
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="144" height="144">${defs}<rect width="24" height="24" fill="${INK}"/><g ${font}>` +
		marker +
		`<text x="3.8" y="4.7" font-size="3.25" fill="${nameFill}">${esc(step.name)}</text>` +
		args +
		(foot ? `<text x="1.4" y="22.4" font-size="2.6" fill="${step.failed ? RED : GREY}">${foot}</text>` : "") +
		(time ? `<text x="22.6" y="22.4" font-size="2.6" text-anchor="end" fill="${GREY}">${time}</text>` : "") +
		`</g></svg>`
	);
}

function readStep(): Step | undefined {
	try {
		const start = statSync(STEP_FILE).mtimeMs;
		const [tool = "", cwd = "", json = "{}"] = readFileSync(STEP_FILE, "utf8").split("\n");
		if (!tool) return undefined; // caught mid-write
		let input: Record<string, unknown> = {};
		try {
			input = JSON.parse(json);
		} catch {
			// unexpected input: show the bare name
		}
		let end = 0;
		let failed = false;
		try {
			const t = statSync(END_FILE).mtimeMs;
			if (t >= start) (end = t), (failed = readFileSync(END_FILE, "utf8").trim() === "failed");
		} catch {
			// no step has finished yet
		}
		return { ...label(tool, input, cwd), start, end, failed };
	} catch {
		return undefined; // Claude Code hasn't run a tool yet
	}
}

function isIdle(): boolean {
	try {
		return IDLE.includes(readFileSync(STATE_FILE, "utf8").trim());
	} catch {
		return true;
	}
}

/** The step Claude Code is on, labelled the way the terminal shows it, with its spinner and shimmer. */
@action({ UUID: "com.alexandru.claudepet.activity" })
export class Activity extends SingletonAction {
	private lastSvg = "";

	constructor() {
		super();
		setInterval(() => this.tick(), FRAME_MS);
	}

	override onWillAppear(): void {
		this.lastSvg = ""; // a newly shown key needs a frame
	}

	private tick(): void {
		const keys = [...this.actions].filter((a) => a.isKey());
		if (!keys.length) return;
		const svg = drawActivity(readStep(), isIdle(), Date.now());
		if (svg === this.lastSvg) return;
		this.lastSvg = svg;
		const image = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
		for (const k of keys) void k.setImage(image);
	}
}
