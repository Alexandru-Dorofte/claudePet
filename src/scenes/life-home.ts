import { BLUE, BROWN, CREAM, GREEN, GREY, INK, LILAC, NOTE, ORANGE, PINK, SILVER, YELLOW, type Draw, type Variant } from "../art";

const SCREEN = "#2B3A55";
const BRASS = "#B8862B"; // the sax's shaded side
const IRON = "#5A5852"; // the camping stove
const SAX = ["YD.YYYY", "YD..YY.", "YD..Y..", ".YD.Y..", "..YDD.."]; // Y brass, D shade
const TROPHY = ["#.###.#", ".#####.", "..###..", "...#...", "..###.."];
const STAR = [".#.", "###", ".#."];
const HEART = ["##.##", "#####", ".###.", "..#.."];
// facing left: ears, head, tail curling up at the back, body, legs (two leg poses for walking)
const CAT = ["#.#.....#", "###....#.", "########.", ".#######.", ".#.#.#.#."];
const CAT_STEP = [...CAT.slice(0, 4), "#.#.#.#.."];
const mirror = (rows: string[]) => rows.map((r) => [...r].reverse().join(""));

/** A wisp of steam rising from (x, y): three puffs drifting up and wobbling, fading to grey as they rise. */
const steam = (rect: Draw["rect"], x: number, y: number, f: number) => {
	for (let k = 0; k < 3; k++) {
		const up = (f + k * 2) % 6;
		rect(x + (((f + k) >> 1) % 2), y - up, 1, 1, up > 2 ? GREY : SILVER);
	}
};

// playing a retro handheld game, hopping over obstacles, then a victory jump when it wins
const handheld: Variant = (f, pose) => {
	const t = f % 30;
	const won = t >= 22;
	const dy = won ? [-1, -2, -1, 0][t % 4] : 0;
	pose.eyes = won ? "up" : "down";
	if (won) pose.legShift = t % 2;
	return {
		dy,
		props: ({ rect, sprite }) => {
			const y = 10 + dy;
			rect(6, y, 12, 7, GREY); // console, gripped by both claws
			rect(8, y + 1, 8, 3, won ? (t % 2 ? YELLOW : GREEN) : GREEN); // screen
			if (!won) {
				const ob = 15 - (t % 8); // obstacle scrolling left
				rect(ob, y + 3, 1, 1, CREAM);
				rect(9, y + (ob <= 11 && ob >= 9 ? 2 : 3), 1, 1, INK); // player hops over it
			}
			rect(8, y + 5, 3, 1, INK), rect(9, y + 4, 1, 3, INK); // d-pad
			rect(14, y + 5, 1, 1, PINK), rect(15, y + 4, 1, 1, PINK); // A/B
			if (won) for (const [x, sy, k] of [[1, 2, 0], [20, 4, 1], [3, 9, 1], [20, 11, 0]]) if ((t + k) % 2) sprite(x, sy, STAR, YELLOW);
		},
	};
};

// frying an egg on a camping stove: it sizzles, he tosses the pan, the egg flips through the air and lands back sunny side up, happy wiggle
const egg: Variant = (f, pose) => {
	const t = f % 40;
	const k = t - 16; // toss progress
	const flying = k >= 1 && k <= 7;
	pose.ex = 1;
	pose.eyes = flying ? "up" : t >= 28 ? "closed" : "down";
	pose.arms = [false, k === 0 || k === 1]; // the toss: the claw jerks the pan up
	if (t >= 28) pose.legShift = t % 2;
	return {
		dx: -4,
		props: ({ rect }) => {
			// stove: grate on two legs, blue gas flames licking the pan
			rect(18, 14, 6, 1, IRON), rect(18, 15, 1, 2, IRON), rect(23, 15, 1, 2, IRON);
			for (const x of [19, 21]) rect(x + (f % 2), 13, 1, 1, BLUE);
			// pan: handle in the right claw, held up 3 rows during the toss
			const py = pose.arms[1] ? 8 : 11;
			rect(16, py, 2, 1, BROWN);
			rect(18, py, 1, 1, GREY), rect(23, py, 1, 1, GREY), rect(18, py + 1, 6, 1, GREY);
			// the egg: white with the yolk on top (yolk below = upside down), or edge-on mid-flip
			const sunny = (y: number) => (rect(19, y, 4, 1, CREAM), rect(20, y - 1, 2, 1, YELLOW));
			const flipped = (y: number) => (rect(19, y, 4, 1, CREAM), rect(20, y + 1, 2, 1, YELLOW));
			const edge = (y: number) => rect(21, y, 1, 2, CREAM);
			if (!flying) sunny(py);
			else [() => edge(5), () => flipped(2), () => flipped(1), () => edge(1), () => sunny(4), () => sunny(7), () => sunny(10)][k - 1]();
			if (!flying && k !== 0 && t % 3 === 0) rect(t % 2 ? 19 : 22, py - 1, 1, 1, CREAM); // sizzle pop
			if (!pose.arms[1] && !flying) steam(rect, 22, 9, f);
		},
	};
};

// gaming on the floor in front of a little TV: mashing the controller as the hero jumps, then a trophy and a victory jump
const tvGame: Variant = (f, pose) => {
	const t = f % 45;
	const won = t >= 34;
	const dy = won ? [0, -1, -2, -1][t % 4] : f % 2;
	pose.ex = won ? 0 : 1;
	pose.eyes = won ? "up" : pose.eyes;
	if (won) pose.arms = [true, true];
	pose.legShift = won ? t % 2 : 0;
	return {
		dx: -4,
		dy,
		props: ({ rect, sprite }) => {
			rect(16, 13, 8, 1, BROWN), rect(17, 14, 1, 2, BROWN), rect(22, 14, 1, 2, BROWN); // low TV stand
			rect(16, 6, 8, 7, GREY); // TV
			rect(17, 7, 6, 5, SCREEN);
			if (!won) {
				const s = t % 12;
				rect(17, 11, 6, 1, GREEN); // ground
				rect(22 - (s >> 1), 10, 1, 1, PINK); // a baddie walking left
				rect(18, s >= 6 && s < 10 ? 8 : 10, 1, 1, YELLOW); // the hero jumps over it
				// controller between both claws, bouncing with the mashing
				const y = 10 + dy;
				rect(2, y, 12, 1, GREY), rect(2, y + 1, 3, 1, GREY), rect(11, y + 1, 3, 1, GREY); // body and two grips
				rect(3, y + 1, 2, 1, INK); // d-pad, on the left grip
				rect(11, y, 1, 1, f % 2 ? PINK : CREAM), rect(12, y + 1, 1, 1, f % 2 ? CREAM : BLUE); // buttons
			} else {
				if (t % 2) sprite(18, 8, STAR, YELLOW); // a star on screen: you win
				rect(3, 16, 10, 1, GREY); // controller dropped on the floor
				sprite(4, 0, TROPHY, YELLOW);
				if (t % 2) sprite(0, 1, STAR, CREAM), sprite(11, 2, STAR, CREAM);
			}
		},
	};
};

// painting a sunset on an easel stroke by stroke, brush in claw, then stepping back to admire it
const painting: Variant = (f, pose) => {
	const t = f % 40;
	const p = Math.min(t, 18); // strokes done
	const painting = t < 18;
	pose.ex = 1;
	pose.arms = [false, painting];
	if (t >= 24 && t < 32) pose.eyes = "closed"; // proud
	return {
		dx: painting ? -3 : -4,
		dy: t >= 24 && t < 32 && t % 4 < 2 ? -1 : 0,
		props: ({ rect }) => {
			rect(20, 1, 1, 2, BROWN); // easel
			rect(17, 3, 7, 7, BROWN);
			rect(18, 11, 1, 6, BROWN), rect(22, 11, 1, 6, BROWN), rect(20, 10, 1, 6, BROWN);
			rect(18, 4, 5, 5, CREAM);
			const rows = [LILAC, PINK, ORANGE, BLUE, BLUE]; // sky to sea, 3 frames a row
			let bx = 18;
			let by = 4;
			rows.forEach((c, i) => {
				const len = Math.max(0, Math.min(5, (p - i * 3) * 2));
				if (len) rect(18, 4 + i, len, 1, c);
				if (len && p < (i + 1) * 3) (bx = 17 + len), (by = 4 + i);
			});
			if (p >= 16) rect(20, 5, 1, 1, YELLOW), rect(19, 6, 3, 1, YELLOW); // the sun
			if (p >= 17) rect(20, 7, 1, 1, CREAM), rect(19, 8, 3, 1, CREAM); // its reflection
			if (painting) {
				if (t >= 15) (bx = 20), (by = 6);
				// brush handle from the raised claw (top-right at 16,7) to the bristles on the canvas
				const n = Math.max(bx - 17, Math.abs(by - 7));
				for (let i = 0; i < n; i++) rect(17 + Math.round(((bx - 17) * i) / n), 7 + Math.round(((by - 7) * i) / n), 1, 1, GREY);
				rect(bx, by, 1, 1, t >= 15 ? YELLOW : rows[Math.floor(p / 3)]);
			} else if (t >= 24 && t < 32 && t % 2) rect(16, 1, 1, 1, CREAM), rect(23, 0, 1, 1, CREAM);
		},
	};
};

// overhead press: barbell from the waist up to the chest, pressed over the head, back down; five reps light five dots, a proud flex, then crouching to pick it up again
const barbell: Variant = (f, pose) => {
	const t = f % 40;
	const s = t % 6; // 0 waist, 1 strain, 2 chest, 3-4 overhead, 5 chest
	const flex = t >= 30 && t < 38;
	const pickup = t >= 38; // crouching to pick the bar up off the floor for the next set
	const overhead = t < 30 && (s === 3 || s === 4);
	const reps = Math.min(5, Math.floor(t / 6) + (overhead ? 1 : 0));
	pose.arms = flex || (t < 30 && s >= 2) ? [true, true] : [false, false];
	pose.squash = pickup ? 2 : t < 30 && s === 1 ? 1 : 0; // the strain before the lift
	if (pose.squash || flex || overhead) pose.eyes = "closed";
	return {
		dy: flex && t % 4 < 2 ? -1 : 0,
		props: ({ rect }) => {
			for (let i = 0; i < 5; i++) rect(7 + i * 2.5, 1, 1, 1, i < reps ? (flex && t % 2 ? CREAM : YELLOW) : GREY);
			if (flex) {
				rect(3, 16, 18, 1, SILVER); // barbell dropped on the floor
				rect(1, 15, 2, 3, GREY), rect(21, 15, 2, 3, GREY);
				if (t % 4 < 2) rect(3, 5, 1, 1, BLUE), rect(20, 4, 1, 1, BLUE); // sweat
				return;
			}
			// the bar sits on top of the claws; overhead the claws stretch up to it above the head
			let y = 6 + pose.squash + (pose.arms[0] ? 1 : 4);
			if (overhead) (y = 4), rect(4, 5, 2, 2, ORANGE), rect(18, 5, 2, 2, ORANGE);
			rect(3, y, 18, 1, SILVER);
			rect(1, y - 2, 2, 5, GREY), rect(21, y - 2, 2, 5, GREY);
		},
	};
};

// holding a cup of tea in the right claw, steam curling up, raising it to the mouth for a sip, then a contented sigh with a little heart
const tea: Variant = (f, pose) => {
	const t = f % 40;
	const sip = t >= 10 && t < 18;
	const sigh = t >= 18 && t < 34;
	pose.ex = sip ? 0 : 1;
	if (sip || sigh) pose.eyes = "closed";
	pose.squash = t >= 20 && t < 26 ? 1 : 0; // the big exhale
	return {
		props: ({ rect, sprite }) => {
			const y = 10 + pose.squash; // level with the lowered right claw
			if (sip) {
				// cup at the mouth, tipped towards it, the claw still on its handle side
				rect(14, y, 1, 1, BROWN), rect(15, y, 3, 1, CREAM);
				rect(14, y + 1, 4, 1, CREAM), rect(15, y + 2, 2, 1, CREAM);
			} else {
				rect(20, y, 1, 1, CREAM), rect(21, y, 2, 1, BROWN), rect(23, y, 1, 1, CREAM); // cup in the claw, tea showing
				rect(20, y + 1, 4, 1, CREAM), rect(21, y + 2, 2, 1, CREAM);
				steam(rect, 21, y - 1, f);
			}
			if (sigh) sprite(10, 2 - Math.floor((t - 18) / 6), HEART, PINK);
		},
	};
};

// a little cat strolls in and sits by him, gets patted on the head (purring, a heart pops up), then wanders off
const cat: Variant = (f, pose) => {
	const t = f % 64;
	const x = t < 20 ? 24 - Math.floor(t / 2) : t < 44 ? 14 : 14 + Math.floor((t - 44) / 2);
	const walking = t < 20 || t >= 44;
	const pat = t >= 22 && t < 40;
	const down = pat && t % 4 >= 2; // claw resting on its head
	pose.ex = 1;
	pose.eyes = down ? "closed" : pose.eyes;
	pose.arms = [false, (t >= 20 && t < 44 && !down) || (walking && x < 16)]; // claw up, out of the cat's way
	return {
		dx: -4,
		props: ({ rect, sprite }) => {
			const rows = walking && t % 2 ? CAT_STEP : CAT;
			sprite(x, 11, t >= 44 ? mirror(rows) : rows, SILVER);
			if (!down) rect(t >= 44 ? x + 7 : x + 1, 12, 1, 1, INK); // eye (shut while purring)
			if (down) rect(14, 10, 2, 2, ORANGE); // the claw, resting on its head
			if (pat && t >= 28) sprite(17, 8 - Math.floor((t - 28) / 4), HEART, PINK);
		},
	};
};

// reading a book in a rocking chair, rocking gently back and forth, a page turning now and then
const rocking: Variant = (f, pose) => {
	const r = [-1, 0, 1, 0][Math.floor(f / 3) % 4]; // rock: back, upright, forward
	const ox = 4 + r;
	const t = f % 25;
	pose.eyes = "down";
	pose.ex = t < 22 ? [-1, 0, 1, 0][Math.floor(f / 2) % 4] : 0;
	return {
		dx: r,
		dy: -1,
		props: ({ rect }) => {
			const lean = 1 - r; // the chair back tilts with the rock
			for (let y = 3; y < 16; y++) rect(ox - 1 - Math.round(((15 - y) * lean) / 12), y, 1, 1, BROWN);
			rect(ox - 1, 15, 16, 1, BROWN); // seat
			rect(ox + 3, 16, 1, 1, BROWN), rect(ox + 12, 16, 1, 1, BROWN);
			rect(ox + 3, 17, 10, 1, BROWN); // rocker, its ends tipping
			rect(ox, r < 0 ? 17 : r > 0 ? 15 : 16, 3, 1, BROWN);
			rect(ox + 13, r > 0 ? 17 : r < 0 ? 15 : 16, 3, 1, BROWN);
			rect(ox + 2, 10, 6, 4, CREAM); // book, held open between the claws
			rect(ox + 8, 10, 6, 4, CREAM);
			rect(ox + 8, 10, 1, 4, SILVER);
			rect(ox + 3, 11, 4, 1, GREY), rect(ox + 3, 12, 3, 1, GREY);
			rect(ox + 10, 11, 3, 1, GREY), rect(ox + 10, 12, 4, 1, GREY);
			if (t >= 22) rect(ox + [9, 8, 3][t - 22], 9, [5, 1, 5][t - 22], 4, CREAM); // page lifting, upright, landing on the left
		},
	};
};

// playing the saxophone, swaying to the tune: mouthpiece in the mouth, right claw on the keys, notes puffing out of the bell
const sax: Variant = (f, pose) => {
	const r = [-1, 0, 1, 0][Math.floor(f / 2) % 4];
	const dx = r - 2;
	const ox = 4 + dx;
	pose.eyes = "closed";
	pose.squash = f % 4 === 0 ? 1 : 0; // a breath on the beat
	pose.legShift = r;
	return {
		dx,
		props: ({ rect, sprite }) => {
			const t = 6 + pose.squash; // body top; mouth at t+4, claws (lowered) at t+4..t+5
			const px = (x: number, y: number, c: string) => rect(ox + x, t + y, 1, 1, c);
			px(10, 5, INK); // mouthpiece
			px(11, 5, YELLOW), px(12, 4, YELLOW), px(13, 4, YELLOW); // neck curving from the mouth to the body
			// body down from under the claw, bow at the bottom, bell rising and flaring open to the upper right
			SAX.forEach((row, j) => [...row].forEach((c, i) => c !== "." && px(14 + i, 6 + j, c === "Y" ? YELLOW : BRASS)));
			rect(ox + 14, t + 4, 2, 2, ORANGE); // the claw on the upper keys
			for (const k of [0, 6]) {
				const y = t + 1 - ((f + k) % 12);
				if (y >= -4) sprite(ox + 17 + ((f + k) % 12 > 6 ? 1 : 0), y, NOTE, CREAM);
			}
		},
	};
};

/** Clawd's home life, by time of day: morning 7-12, afternoon 12-18, evening 18-24. */
export const home: { morning: Variant[]; afternoon: Variant[]; evening: Variant[] } = {
	morning: [egg, barbell, tea],
	afternoon: [painting, cat, sax, handheld],
	evening: [rocking, tvGame, tea, handheld],
};
