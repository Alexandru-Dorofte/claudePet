import { BLUE, CREAM, GREEN, GREY, INK, LILAC, NOTE, ORANGE, PINK, QUESTION, SILVER, YELLOW, type Variant } from "../art";

const BANG = ["#", "#", ".", "#"];
const DROP = [".#.", "###", "###", ".#."];
const STAR = [".#.", "###", ".#."];
const ORBIT = [[11, 1], [15, 1], [17, 2], [15, 3], [11, 3], [7, 3], [5, 2], [7, 1]];
const PARTY = [PINK, YELLOW, BLUE, GREEN, LILAC];
const CONFETTI = [1, 20, 5, 15, 9, 22, 3, 12, 18, 7, 13, 0]; // x of each falling bit

export const oops: Variant[] = [
	// a tool failed: claws up, eyes shut, sweat drop
	(f, pose) => {
		pose.eyes = "closed";
		pose.arms = [true, true];
		return { props: ({ sprite }) => sprite(19, 1 + (f % 3), DROP, "#9CC6F0") };
	},
	// dizzy: stars circling its head
	(f, pose) => {
		pose.ex = f % 2 ? 1 : -1;
		pose.legShift = f % 2 ? 1 : 0;
		return {
			props: ({ sprite }) => {
				for (let k = 0; k < 3; k++) {
					const [x, y] = ORBIT[(f + k * 3) % 8];
					sprite(x, y - 1, STAR, k ? CREAM : YELLOW);
				}
			},
		};
	},
];

export const compacting: Variant[] = [
	// squished flat under a press
	(f, pose) => {
		const s = f % 4 < 2 ? 0 : 2;
		pose.squash = s;
		pose.eyes = "closed";
		return { props: ({ rect }) => rect(4, 4 + s, 16, 1, SILVER) };
	},
	// squeezing an accordion shut overhead
	(f, pose) => {
		const s = [0, 1, 2, 1][f % 4];
		pose.arms = [true, true];
		pose.squash = s;
		pose.eyes = s ? "closed" : "open";
		return {
			props: ({ rect }) => {
				const hw = 8 - s * 3;
				for (let x = 12 - hw + 1; x < 12 + hw - 1; x++) rect(x, 1, 1, 4, x % 2 ? CREAM : SILVER);
				rect(12 - hw, 0, 1, 6, ORANGE), rect(11 + hw, 0, 1, 6, ORANGE);
			},
		};
	},
];

export const attention: Variant[] = [
	// needs permission: jumping with a "!"
	(f, pose) => {
		pose.arms = [true, true];
		return { dy: f % 2 ? -2 : 0, props: ({ sprite }) => sprite(12, 0, BANG, YELLOW) };
	},
	// holding up a "?" sign and waving the other claw
	(f, pose) => {
		pose.arms = [f % 2 === 1, true];
		pose.eyes = "up";
		const x = f % 2;
		return {
			props: ({ rect, sprite }) => {
				rect(14 + x, 0, 7, 7, CREAM);
				sprite(16 + x, 1, QUESTION, INK);
			},
		};
	},
];

export const dancing: Variant[] = [
	// turn finished: dancing with a music note
	(f, pose) => {
		pose.arms = f % 2 ? [true, false] : [false, true];
		pose.legShift = f % 2 ? 1 : -1;
		return { dy: f % 2 ? -1 : 0, props: ({ sprite }) => sprite(f % 2 ? 1 : 19, 1, NOTE, CREAM) };
	},
	// confetti raining down while it bounces
	(f, pose) => {
		pose.arms = f % 2 ? [true, true] : [false, false];
		pose.eyes = "up";
		return {
			dy: f % 2 ? -1 : 0,
			props: ({ rect }) => {
				for (let k = 0; k < 12; k++) rect(CONFETTI[k], (f + k * 7) % 17, 1, 1, PARTY[k % 5]);
			},
		};
	},
	// under a disco ball, light sparkles flashing
	(f, pose) => {
		pose.arms = f % 2 ? [true, false] : [false, true];
		pose.legShift = f % 2 ? 1 : -1;
		return {
			props: ({ rect, sprite }) => {
				rect(11.5, 0, 1, 1, GREY);
				sprite(10, 1, [".##.", "####", "####", ".##."], SILVER);
				rect(10 + (f % 2) * 2, 2, 1, 1, CREAM), rect(13 - (f % 2) * 2, 3, 1, 1, CREAM);
				for (let k = 0; k < 4; k++) sprite([1, 19, 2, 20][k], [2, 4, 9, 11][k] + (k < 2 ? 0 : 1), STAR, (f + k) % 2 ? PARTY[(f + k) % 5] : INK);
			},
		};
	},
];
