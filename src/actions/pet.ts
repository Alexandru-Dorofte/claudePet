import streamDeck, { action, SingletonAction } from "@elgato/streamdeck";
import { execFile } from "node:child_process";
import { closeSync, openSync, readdirSync, readFileSync, readSync, rmSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { draw } from "../crab";
import { LIFE, SCENES, type Mood } from "../scenes";
import { drawUsage, usage } from "../usage";

const HOME = homedir();
// written by hooks/claudepet.sh: the mood, one file per running subagent, the session transcript's path
const STATE_FILE = join(HOME, ".claudepet");
const AGENTS_DIR = join(HOME, ".claudepet-agents");
const TRANSCRIPT_FILE = join(HOME, ".claudepet-transcript");

const FRAME_MS = 200;
// ponytail: a tool running longer than this also looks idle; refresh the file from the hook if that bites
const SLEEP_AFTER_MS = 5 * 60_000;
const ACTIVITY_MS = 45_000; // while living, a new activity this often
const BEDTIME = [0, 7]; // local hours: asleep from midnight to 7am, living the rest of the day
// ponytail: a subagent silent this long is assumed dead (crashed session never sent SubagentStop)
const AGENT_STALE_MS = 10 * 60_000;
const DANCE_MS = 8_000;
const OOPS_MS = 3_000;
const HOLD_MS = 500; // a press held this long shows the usage card instead
const CARD_MS = 6_000;

// Key press opens a normal Ghostty window and types `claude` into its shell
const OPEN_CLAUDE = ["-na", "Ghostty.app", "--args", `--working-directory=${join(HOME, "Development")}`, "--input=raw:claude\\n"];
// Drop Claude Code session markers in case Stream Deck was started from inside a Claude session;
// inherited, they make the new `claude` think it's a child session (no transcripts).
const CLEAN_ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("CLAUDE")));

// What the key says per mood; the busy ones also get Claude Code's spinner symbol in front
const BUSY: Mood[] = ["thinking", "working", "reading", "writing", "searching", "browsing", "delegating", "compacting"];
const VERB: Partial<Record<Mood, string>> = {
	listening: "Waiting…",
	thinking: "Thinking…",
	working: "Working…",
	reading: "Reading…",
	writing: "Editing…",
	searching: "Searching…",
	browsing: "Browsing…",
	delegating: "Delegating…",
	compacting: "Compacting…",
	attention: "Needs you!",
	oops: "Oops…",
};

function moodFor(state: string, age: number): Mood {
	if (state === "attention") return "attention"; // keep asking until answered, however long that takes
	if (state === "done" && age < DANCE_MS) return "dancing";
	if (age > SLEEP_AFTER_MS || state === "sleeping") return offDuty();
	if (state === "done") return "listening";
	if (state === "oops") return age < OOPS_MS ? "oops" : "thinking"; // Claude carries on after a failed tool
	return Object.hasOwn(SCENES, state) ? (state as Mood) : "listening";
}

/** An activity for this time of day (as an index into SCENES.living), different from `current` when possible. */
function activity(current: number): number {
	const h = new Date().getHours();
	const pool = h < 18 ? LIFE.day : LIFE.evening;
	const options = pool.map((v) => SCENES.living.indexOf(v)).filter((i) => i !== current % SCENES.living.length);
	return options.length ? options[Math.floor(Math.random() * options.length)] : current;
}

/** Claude Code isn't running (or long idle): asleep at night, off doing his own thing by day. */
function offDuty(): Mood {
	const h = new Date().getHours();
	return h >= BEDTIME[0] && h < BEDTIME[1] ? "sleeping" : "living";
}

/** Reads the last `bytes` of a file (whole lines may be cut at the start). */
function tail(path: string, size: number, bytes: number): string {
	const buf = Buffer.allocUnsafe(Math.min(size, bytes));
	const fd = openSync(path, "r");
	try {
		readSync(fd, buf, 0, buf.length, size - buf.length);
	} finally {
		closeSync(fd);
	}
	return buf.toString("utf8");
}

/** Newest-first JSON entries of the transcript tail; the cut first line is skipped. */
function* entries(text: string): Generator<{ type?: string; subtype?: string; timestamp?: string; uuid?: string; durationMs?: number; message?: { content?: unknown } }> {
	const lines = text.split("\n");
	for (let i = lines.length - 1; i > 0; i--) {
		if (!lines[i]) continue;
		try {
			yield JSON.parse(lines[i]);
		} catch {
			// a line still being written: skip it
		}
	}
}

// --- "Baked for 1m 52s", computed exactly the way Claude Code does it ---
const PAST = ["Baked", "Brewed", "Churned", "Cogitated", "Cooked", "Crunched", "Sautéed", "Worked"];

// Claude Code's string hash; it picks the past-tense word from the turn_duration entry's uuid
function ccHash(s: string): number {
	let e = 0;
	for (let n = 0; n < s.length; n++) e = ((e << 5) - e + s.charCodeAt(n)) | 0;
	return e;
}

// Claude Code's duration format: 0s, 45s, 1m 52s, 2h 3m 4s, 1d 2h 3m
function formatDuration(ms: number): string {
	if (ms < 60_000) return ms === 0 ? "0s" : ms < 1 ? `${(ms / 1000).toFixed(1)}s` : `${Math.floor(ms / 1000)}s`;
	let d = Math.floor(ms / 86_400_000);
	let h = Math.floor((ms % 86_400_000) / 3_600_000);
	let m = Math.floor((ms % 3_600_000) / 60_000);
	let s = Math.round((ms % 60_000) / 1000);
	if (s === 60) (s = 0), m++;
	if (m === 60) (m = 0), h++;
	if (h === 24) (h = 0), d++;
	if (d > 0) return `${d}d ${h}h ${m}m`;
	if (h > 0) return `${h}h ${m}m ${s}s`;
	if (m > 0) return `${m}m ${s}s`;
	return `${s}s`;
}

const bakedFor = (uuid: string, ms: number) => `${PAST[(ccHash(uuid) >>> 0) % PAST.length]} for ${formatDuration(ms)}`;

/** Watches the session transcript, re-reading its tail only when it grows. */
class Transcript {
	private size = -1;
	private text = "";
	private seen = new Map<string, number>(); // per question: the size it last looked at

	/** The tail if the file grew since `question` last looked, else "" (nothing new to look at). */
	private fresh(question: string): string {
		try {
			const path = readFileSync(TRANSCRIPT_FILE, "utf8").trim();
			const { size } = statSync(path);
			if (size !== this.size) (this.size = size), (this.text = tail(path, size, 64 * 1024));
			if (this.seen.get(question) === size) return "";
			this.seen.set(question, size);
			return this.text;
		} catch {
			return ""; // no transcript yet
		}
	}

	/** "Baked for 1m 52s" for the turn that ended at `since`, if Claude Code wrote one (short turns get none). */
	bakedSince(since: number): string {
		for (const e of entries(this.fresh("baked"))) {
			if (e.subtype !== "turn_duration") continue;
			// only this turn's: written around the Stop hook, not a previous turn's
			return Date.parse(e.timestamp ?? "") >= since - 10_000 ? bakedFor(e.uuid ?? "", e.durationMs ?? 0) : "";
		}
		return "";
	}

	/** Whether the user pressed Esc after `since`. Claude Code fires no hook for that, it only logs it. */
	interruptedSince(since: number): boolean {
		for (const e of entries(this.fresh("interrupted"))) {
			if (Date.parse(e.timestamp ?? "") < since) return false;
			const content = e.message?.content;
			const first = Array.isArray(content) ? content[0] : content;
			if (e.type === "user" && typeof first === "object" && first && String((first as { text?: unknown }).text).startsWith("[Request interrupted by user")) return true;
		}
		return false;
	}
}

function runningAgents(): number {
	try {
		const now = Date.now();
		let n = 0;
		for (const f of readdirSync(AGENTS_DIR)) {
			const path = join(AGENTS_DIR, f);
			if (now - statSync(path).mtimeMs < AGENT_STALE_MS) n++;
			else rmSync(path, { force: true }); // left behind by a crashed session
		}
		return n;
	} catch {
		return 0;
	}
}

/**
 * The Claude crab. Animates based on what Claude Code is doing; press the key to open Claude Code,
 * hold it to see token usage.
 */
@action({ UUID: "com.alexandru.claudepet.pet" })
export class Pet extends SingletonAction {
	private frame = 0;
	private state = { word: "", since: -1 }; // last read of STATE_FILE
	private mood: Mood = "sleeping";
	private variant = 0;
	private agents = 0;
	private baked = "";
	private interrupted = false;
	private transcript = new Transcript();
	private lastSvg = "";
	private downAt = 0;
	private cardUntil = 0; // the usage card is up until then; tick() leaves the key alone meanwhile

	constructor() {
		super();
		setInterval(() => this.tick(), FRAME_MS);
	}

	override onKeyDown(): void {
		this.downAt = Date.now();
	}

	// Decided on release: a press on the card closes it, a long press shows it, a short one opens Claude Code.
	override onKeyUp(): void {
		const now = Date.now();
		if (now < this.cardUntil) (this.cardUntil = 0), (this.lastSvg = "");
		else if (now - this.downAt >= HOLD_MS) this.showUsage();
		else this.openClaude();
	}

	private showUsage(): void {
		let transcript = "";
		try {
			transcript = readFileSync(TRANSCRIPT_FILE, "utf8").trim();
		} catch {
			// no session yet: today's total still counts
		}
		const image = `data:image/svg+xml;base64,${Buffer.from(drawUsage(usage(transcript))).toString("base64")}`;
		this.cardUntil = Date.now() + CARD_MS;
		this.lastSvg = "";
		for (const a of this.actions) if (a.isKey()) void a.setImage(image);
	}

	// One Claude Code is enough: if a session is already running, bring Ghostty to the front instead of opening another.
	private openClaude(): void {
		execFile("ps", ["-axo", "tty=,comm="], (err, out) => {
			const running = !err && out.split("\n").some((l) => /^\s*ttys\S+\s+(\S*\/)?claude\s*$/.test(l) || /^\s*ttys\S+\s+\S*\/claude\/versions\//.test(l));
			const args = running ? ["-a", "Ghostty"] : OPEN_CLAUDE;
			execFile("open", args, { env: CLEAN_ENV }, (e) => e && streamDeck.logger.error(`Opening Claude Code failed: ${e.message}`));
		});
	}

	override onWillAppear(): void {
		this.lastSvg = ""; // a newly shown key needs a frame even if nothing changed
	}

	private readState(): void {
		try {
			const since = statSync(STATE_FILE).mtimeMs;
			if (since === this.state.since) return;
			const word = readFileSync(STATE_FILE, "utf8").trim();
			// empty = caught the hook between truncating and writing; keep the old state, retry next tick
			if (word) (this.state = { word, since }), (this.interrupted = false);
		} catch {
			this.state = { word: "sleeping", since: 0 }; // no file yet: Claude Code hasn't run
		}
	}

	private tick(): void {
		const keys = [...this.actions].filter((a) => a.isKey());
		if (keys.length === 0 || Date.now() < this.cardUntil) return;

		this.readState();
		let mood = moodFor(this.state.word, Date.now() - this.state.since);
		const busy = BUSY.includes(mood);
		if (busy && !this.interrupted && this.frame % 5 === 0) this.interrupted = this.transcript.interruptedSince(this.state.since);
		if (busy && this.interrupted) mood = "listening";

		if (mood !== this.mood) {
			this.mood = mood;
			this.variant = mood === "living" ? activity(-1) : Math.floor(Math.random() * SCENES[mood].length); // a fresh animation each time
			this.baked = "";
		} else if (mood === "living" && this.frame % (ACTIVITY_MS / FRAME_MS) === 0) {
			this.variant = activity(this.variant); // a different activity, never the same twice in a row
		}
		if (mood === "dancing" && !this.baked) this.baked = this.transcript.bakedSince(this.state.since); // until Claude Code writes it
		if (this.frame % 5 === 0) this.agents = runningAgents();

		const text = mood === "dancing" ? this.baked : (VERB[mood] ?? "");
		const svg = draw(mood, this.variant, this.frame++, this.agents, text, BUSY.includes(mood));
		if (svg === this.lastSvg) return;
		this.lastSvg = svg;
		const image = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
		for (const k of keys) void k.setImage(image);
	}
}
