import { BLUE, CREAM, GREY, LILAC, NOTE, YELLOW, type Variant } from "../art";

const Z = ["####", "..#.", ".#..", "####"];
const MOON = [".##.", "##..", "##..", "##..", ".##."];
const BUBBLE = [["#"], [".#.", "#.#", ".#."], [".###.", "#...#", "#...#", "#...#", ".###."]];

export const sleeping: Variant[] = [
	// breathing slowly, Z's drifting up
	(f, pose) => {
		pose.eyes = "closed";
		const p = Math.floor((f % 9) / 3);
		return { dy: f % 10 < 5 ? 0 : 1, props: ({ sprite }) => sprite(18 + p, 2 - p, Z, LILAC) };
	},
	// under a crescent moon with stars twinkling one after another
	(f, pose) => {
		pose.eyes = "closed";
		return {
			dy: f % 10 < 5 ? 0 : 1,
			props: ({ rect, sprite }) => {
				sprite(1, 0, MOON, YELLOW);
				[[8, 1], [13, 3], [17, 1], [21, 2], [22, 6]].forEach(([x, y], i) => {
					if ((f + i * 2) % 5 < 3) rect(x, y, 1, 1, CREAM);
					if ((f + i * 2) % 5 === 1) for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) rect(x + a, y + b, 1, 1, CREAM);
				});
			},
		};
	},
	// a snore bubble inflates beside it, then pops
	(f, pose) => {
		pose.eyes = "closed";
		const t = f % 10;
		const b = BUBBLE[Math.min(t >> 1, 2)];
		const o = (5 - b.length) >> 1;
		return {
			dy: t < 7 ? 0 : 1,
			props: ({ rect, sprite }) => {
				if (t < 7) sprite(19 + o, 1 + o, b, LILAC);
				else if (t === 7) for (const [x, y] of [[18, 0], [22, 0], [18, 5], [22, 5], [20, 3]]) rect(x, y, 1, 1, CREAM);
			},
		};
	},
];

export const listening: Variant[] = [
	// looking around, a little hop and a wave now and then
	(f, pose) => {
		pose.ex = [0, 0, 0, 1, 1, 1, 0, 0, 0, -1, -1, -1][f % 12];
		if (f % 40 >= 34) pose.arms = [false, f % 2 === 0];
		return { dy: f % 30 === 15 ? -1 : 0 };
	},
	// a big stretch: claws up, eyes shut, rises on tiptoe, then a blink and back to waiting
	(f, pose) => {
		const t = f % 16;
		const s = t >= 3 && t < 9;
		pose.arms = [s, s];
		if (s) pose.eyes = "closed";
		if (t === 2 || t === 9) pose.squash = 1;
		if (t === 12) pose.eyes = "closed";
		return { dy: s ? -1 : 0 };
	},
	// headphones on, eyes closed, nodding to the beat while notes float up from both ears
	(f, pose) => {
		const nod = f % 4 < 2 ? 0 : 1;
		pose.eyes = "closed";
		pose.squash = nod; // head dips on the beat
		pose.legShift = nod;
		return {
			props: ({ rect, sprite }) => {
				rect(6, 4 + nod, 12, 1, GREY); // headband
				rect(5, 5 + nod, 1, 2, GREY);
				rect(18, 5 + nod, 1, 2, GREY);
				rect(4, 7 + nod, 2, 3, BLUE); // ear cups
				rect(18, 7 + nod, 2, 3, BLUE);
				for (const [k, x, c] of [[0, 0, CREAM], [5, 20, LILAC]] as const) {
					const y = 4 - ((f + k) % 9); // a note rises from each ear cup
					if (y >= -4) sprite(x, y, NOTE, c);
				}
			},
		};
	},
];
