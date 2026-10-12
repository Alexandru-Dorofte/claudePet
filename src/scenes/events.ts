import { BLUE, CREAM, GREEN, GREY, INK, LILAC, NOTE, ORANGE, PINK, QUESTION, SILVER, YELLOW, type Variant } from "../art";

const BANG = ["#", "#", ".", "#"];
const CROSS = ["##..##", ".####.", "..##..", ".####.", "##..##"];
const RED = "#E5534B";
const STAR = [".#.", "###", ".#."];
const PARTY = [PINK, YELLOW, BLUE, GREEN, LILAC];
const CONFETTI = [1, 20, 5, 15, 9, 22, 3, 12, 18, 7, 13, 0]; // x of each falling bit

export const oops: Variant[] = [
	// a tool failed: a big red ✗ flashes up, the crab flinches with claws up and shakes
	(f, pose) => {
		pose.eyes = "closed";
		pose.arms = [true, true];
		pose.legShift = f % 2;
		return { dy: f % 4 === 0 ? -1 : 0, props: ({ sprite }) => f % 6 < 4 && sprite(9, 0, CROSS, RED) };
	},
];

export const compacting: Variant[] = [
	// a hydraulic press comes down, squashes it flat, then lifts again
	(f, pose) => {
		const s = [0, 1, 2, 2, 1, 0][f % 6];
		pose.squash = s;
		pose.eyes = s ? "closed" : "open";
		return {
			props: ({ rect }) => {
				rect(2, 0, 20, 1, GREY); // frame: beam, posts, base
				rect(2, 0, 1, 17, GREY);
				rect(21, 0, 1, 17, GREY);
				rect(2, 16, 20, 1, GREY);
				rect(11, 1, 2, 3 + s, SILVER); // piston
				rect(4, 4 + s, 16, 2, SILVER); // plate, resting on the crab's head
			},
		};
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
