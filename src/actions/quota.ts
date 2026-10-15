import streamDeck, { action, SingletonAction } from "@elgato/streamdeck";
import { execFile } from "node:child_process";

import { CREAM, INK, ORANGE, SILVER } from "../art";

const POLL_MS = 5 * 60_000;
const TRACK = "#2E2D2A";

type Window = { pct: number; resets: number }; // resets: epoch ms
type Numbers = { fiveHour: Window; sevenDay: Window };

// Claude Code's own login. Read through /usr/bin/security, which the item already trusts, so no keychain prompt.
function token(): Promise<string> {
	return new Promise((resolve, reject) =>
		execFile("security", ["find-generic-password", "-s", "Claude Code-credentials", "-w"], (err, out) => {
			if (err) return reject(err);
			try {
				resolve(JSON.parse(out).claudeAiOauth.accessToken);
			} catch (e) {
				reject(e);
			}
		}),
	);
}

/** The same numbers Claude Code's /usage shows. */
async function fetchQuota(): Promise<Numbers> {
	const res = await fetch("https://api.anthropic.com/api/oauth/usage", {
		headers: { Authorization: `Bearer ${await token()}`, "anthropic-beta": "oauth-2025-04-20" },
		signal: AbortSignal.timeout(10_000),
	});
	if (!res.ok) throw new Error(`usage HTTP ${res.status}`); // 401: token expired, Claude Code refreshes it next time it runs
	type Raw = { utilization?: number; resets_at?: string } | null | undefined;
	const d = (await res.json()) as { five_hour?: Raw; seven_day?: Raw };
	const win = (w: Raw): Window => ({ pct: w?.utilization ?? 0, resets: Date.parse(w?.resets_at ?? "") || 0 });
	return { fiveHour: win(d.five_hour), sevenDay: win(d.seven_day) };
}

/** Time left until `at`: 35m, 3h 35m, 20h, 2d 4h (kept to 6 characters so it fits next to "resets"). */
function left(at: number): string {
	const m = Math.max(0, Math.ceil((at - Date.now()) / 60_000));
	if (m < 60) return `${m}m`;
	if (m < 600) return `${Math.floor(m / 60)}h ${m % 60}m`;
	if (m < 1440) return `${Math.floor(m / 60)}h`;
	return `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`;
}

/** Two rows: label + big percent, a bar, and when it resets. `q` undefined = not loaded yet. */
export function drawQuota(q?: Numbers): string {
	const row = (y: number, label: string, w?: Window) => {
		const p = Math.max(0, Math.min(100, w?.pct ?? 0));
		return (
			`<text x="1.0" y="${y + 4.8}" font-size="3.6" fill="${SILVER}">${label}</text>` +
			`<text x="23" y="${y + 5}" font-size="5.6" text-anchor="end" fill="${CREAM}">${w ? `${Math.round(p)}%` : "–"}</text>` +
			`<rect x="1.0" y="${y + 6.3}" width="22" height="1.8" rx="0.9" fill="${TRACK}"/>` +
			(p > 0 ? `<rect x="1.0" y="${y + 6.3}" width="${Math.max(1.8, 22 * (p / 100))}" height="1.8" rx="0.9" fill="${ORANGE}"/>` : "") +
			(w?.resets ? `<text x="1.0" y="${y + 10.9}" font-size="2.9" fill="${SILVER}">resets</text><text x="23" y="${y + 10.9}" font-size="2.9" text-anchor="end" fill="${CREAM}">${left(w.resets)}</text>` : "")
		);
	};
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="144" height="144"><rect width="24" height="24" fill="${INK}"/><g font-family="Menlo, monospace" font-weight="bold">${row(-0.3, "5h", q?.fiveHour)}${row(11.5, "7d", q?.sevenDay)}</g></svg>`;
}

/** Claude's 5-hour and 7-day quota. Refreshes every few minutes; press to refresh now. */
@action({ UUID: "com.alexandru.claudepet.quota" })
export class Quota extends SingletonAction {
	private last?: Numbers;
	private fetchedAt = 0;

	constructor() {
		super();
		setInterval(() => {
			const due = Date.now() - this.fetchedAt >= POLL_MS || [this.last?.fiveHour, this.last?.sevenDay].some((w) => w?.resets && w.resets <= Date.now() && w.resets > this.fetchedAt);
			if (due) void this.refresh();
			else this.show(); // the "resets" countdown moves every minute
		}, 60_000);
	}

	override onWillAppear(): void {
		this.show();
		void this.refresh();
	}

	override onKeyUp(): void {
		void this.refresh();
	}

	private async refresh(): Promise<void> {
		if (![...this.actions].length) return; // not on the deck: don't call the API
		this.fetchedAt = Date.now(); // per attempt, so a failing fetch isn't retried every minute
		try {
			this.last = await fetchQuota();
		} catch (e) {
			streamDeck.logger.warn(`Quota refresh failed: ${(e as Error).message}`); // keep showing the last numbers
		}
		this.show();
	}

	private show(): void {
		const image = `data:image/svg+xml;base64,${Buffer.from(drawQuota(this.last)).toString("base64")}`;
		for (const a of this.actions) if (a.isKey()) void a.setImage(image);
	}
}
