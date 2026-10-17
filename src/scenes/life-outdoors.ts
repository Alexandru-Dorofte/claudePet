import { BLUE, BROWN, CREAM, GREEN, GREY, INK, LILAC, ORANGE, PINK, SILVER, YELLOW, type Pose, type Rect, type Variant } from "../art";

const RED = "#E5534B";
const SAND = "#E3C18A";
const WET_SAND = "#C29A62"; // packed, damp sand: the castle reads apart from the beach
const GRASS = "#3F7A34"; // darker than GREEN: distant hills, the bank
const NIGHT_GRASS = "#2A4A26";
const CHAR = "#5A4636"; // a burnt marshmallow (INK would vanish on the black key)
const FLOWER = [".#.", "#.#", ".#."];
const TENT = ["...#...", "..###..", ".#####.", "#######"];
const KITE = ["..#..", ".###.", "#####", ".###.", ".###.", "..#.."]; // spars cross a third of the way down
const CLOUD = [".##..", "#####"];
const RACKET = [".#.", "#.#", "#.#", ".#."]; // oval rim, strings drawn inside

/** A 1px line from (x0,y0) to (x1,y1). */
const line = (rect: Rect, x0: number, y0: number, x1: number, y1: number, c: string) => {
	const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
	for (let i = 0; i <= n; i++) rect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1, c);
};

/** Top-left of a claw's 2x2 this frame (the crab is drawn at 4+dx, 6+dy), so held props stay in the claw. */
const claw = (p: Pose, dx: number, dy = 0, right = true) => ({
	x: (right ? 18 : 4) + dx,
	y: 6 + dy + p.squash + (p.arms[right ? 1 : 0] ? 1 : 4),
});

// fishing off the bank: the float bobs, dips on a bite, and a fish gets yanked out wriggling on the line
const fishing: Variant = (f, pose) => {
	const t = f % 40;
	const bite = t >= 24 && t < 30;
	const caught = t >= 30;
	pose.ex = 1;
	if (bite) pose.eyes = "open";
	if (caught) pose.eyes = "up";
	pose.arms = [caught, caught];
	return {
		dx: -3,
		props: ({ rect, sprite }) => {
			const c = claw(pose, -3);
			rect(0, 16, 17, 2, GRASS); // bank
			rect(17, 16, 7, 2, BLUE); // pond
			rect(17 + ((f >> 1) % 7), 17, 1, 1, CREAM); // glint drifting across
			if (!caught) {
				const ty = bite && f % 2 ? 5 : 4; // the rod tip bends on a bite
				line(rect, c.x + 2, c.y, 22, ty, BROWN); // rod, butt in the claw
				const fy = bite ? 16 : t % 8 < 4 ? 14 : 15; // float rides the ripples, pulled under on a bite
				line(rect, 22, ty + 1, 22, fy - 1, GREY);
				if (!bite) rect(22, fy, 1, 1, RED), fy < 15 && rect(22, 15, 1, 1, CREAM);
				else rect(21 - (t % 2), 16, 1, 1, CREAM), rect(23 + (t % 2), 16, 1, 1, CREAM); // ripples
			} else {
				const w = t % 2; // wriggle
				line(rect, c.x + 2, c.y, 21, 2, BROWN); // rod hauled up
				line(rect, 22, 2, 22 - w, 3, GREY);
				sprite(21 - w, 4, [".#.", "###", "###", ".#."], SILVER); // the fish, mouth on the hook
				rect(21 - w, 5, 1, 2, BLUE), rect(22 - w, 5, 1, 1, INK); // blue back, eye
				sprite(21 - w, 8, ["#.#"], BLUE); // tail
				if (t < 33) rect(19, 13 - (t - 30) * 2, 1, 1, BLUE), rect(23, 12 - (t - 30) * 2, 1, 1, BLUE); // drips flung up
			}
		},
	};
};

// strolling across the meadow, stopping to wave at the flowers at each end
const strolling: Variant = (f, pose) => {
	const t = f % 40;
	const right = t < 20;
	const p = t % 20; // 14 frames walking, 6 by a flower
	const walk = p < 14;
	const step = walk ? p >> 1 : 6;
	pose.ex = right ? 1 : -1;
	pose.legShift = walk ? (f % 2 ? 1 : -1) : 0;
	if (!walk) (pose.eyes = "down"), (pose.arms = right ? [false, p % 2 === 0] : [p % 2 === 0, false]);
	return {
		dx: right ? -3 + step : 3 - step,
		dy: walk && f % 4 === 1 ? -1 : 0,
		props: ({ rect, sprite }) => {
			rect(0, 0, 3, 3, YELLOW); // sun
			sprite(24 - ((f >> 2) % 32), 1, CLOUD, GREY); // a cloud drifting by
			rect(0, 16, 24, 1, GREEN); // grass
			for (const [x, c] of [[0, PINK], [21, YELLOW]] as const) {
				rect(x + 1, 15, 1, 1, GREEN); // stem
				sprite(x, 12, FLOWER, c);
				rect(x + 1, 13, 1, 1, c === PINK ? YELLOW : ORANGE);
			}
		},
	};
};

// sunbathing under a beach umbrella in shades, tapping a claw and sipping lemonade through a straw
const sunbathing: Variant = (f, pose) => {
	const t = f % 40;
	const sip = t >= 24 && t < 32;
	pose.squash = 2; // lying back: eyes at y10-11, mouth just below
	pose.arms = [t >= 10 && t < 20 && f % 2 === 0, false];
	return {
		props: ({ rect, sprite }) => {
			rect(0, 0, 3, 3, YELLOW); // sun
			rect(3 + (f % 4 < 2 ? 1 : 0), 3, 1, 1, YELLOW);
			const gx = 23 - ((f >> 1) % 30); // seagull gliding past
			if (gx > 2 && gx < 13) sprite(gx, 4 + ((f >> 2) % 2), ["#.#", ".#."], CREAM);
			for (let x = 14; x < 24; x++) rect(x, x === 14 || x === 23 ? 2 : 1, 1, x === 14 || x === 23 ? 1 : 2, ((x - 14) >> 1) % 2 ? CREAM : RED); // umbrella canopy
			rect(22, 3, 1, 13, GREY); // pole
			rect(0, 16, 24, 2, SAND);
			for (let y = 9; y < 15; y++) rect(3, y, 1, 1, y % 2 ? BLUE : CREAM); // lounger backrest…
			rect(4, 15, 16, 1, INK); // (tucks his legs out of sight)
			for (let x = 4; x < 20; x++) rect(x, 14, 1, 1, x % 2 ? BLUE : CREAM); // …seat…
			rect(5, 15, 1, 1, GREY), rect(18, 15, 1, 1, GREY); // …and legs
			rect(7, 10, 3, 2, INK), rect(14, 10, 3, 2, INK), rect(10, 10, 4, 1, INK); // shades over both eyes
			const g = t - 34; // a glint sweeping across the lenses
			rect(g >= 0 && g < 6 ? [7, 8, 9, 14, 15, 16][g] : 7, 10, 1, 1, g >= 0 && g < 6 ? CREAM : GREY);
			// lemonade held beside the right claw; on a sip the straw tips to his mouth
			rect(20, 11, 2, 3, YELLOW), rect(20, 11, 2, 1, CREAM);
			if (sip) rect(19, 10, 2, 1, PINK), rect(18, 11, 1, 1, PINK);
			else rect(21, 9, 1, 2, PINK);
		},
	};
};

// building a sandcastle wall by wall, raising a flag, then a wave washes it away and he starts over
const sandcastle: Variant = (f, pose) => {
	const t = f % 50;
	const n = Math.min(6, t >> 2); // build stage
	const building = t < 28;
	const wave = t >= 36 && t < 44 ? t - 36 : -1;
	pose.ex = 1;
	if (building) (pose.eyes = "down"), (pose.arms = [false, t % 4 < 2]);
	else if (t < 36) (pose.arms = [true, true]), (pose.eyes = "up"); // ta-da
	else if (t >= 40) (pose.eyes = "closed"), (pose.squash = 1); // sulk
	return {
		dx: -4,
		props: ({ rect }) => {
			rect(0, 16, 24, 2, SAND);
			if (t < 39) {
				if (n >= 1) rect(16, 15, 7, 1, WET_SAND); // base
				if (n >= 2) rect(16, 14, 7, 1, WET_SAND);
				if (n >= 3) rect(16, 11, 3, 3, WET_SAND), rect(16, 10, 1, 1, WET_SAND), rect(18, 10, 1, 1, WET_SAND); // left tower, crenellated
				if (n >= 4) rect(20, 11, 3, 3, WET_SAND), rect(20, 10, 1, 1, WET_SAND), rect(22, 10, 1, 1, WET_SAND); // right tower
				if (n >= 5) rect(19, 12, 1, 2, WET_SAND); // wall between
				if (n >= 6) rect(19, 14, 1, 2, INK); // doorway
				if (t >= 28) rect(21, 7, 1, 4, BROWN), rect(22, 7 + (f % 2), 2, 1, RED); // flag flapping on the tower
			} else if (t < 44) rect(16, 15, 7, 1, WET_SAND); // a flattened lump, gone once the wave pulls back
			if (wave >= 0) {
				const front = 23 - wave * 2; // the wave sweeps in from the right…
				const h = wave < 4 ? 4 : 8 - wave; // …then shrinks back
				rect(front, 17 - h, 24 - front, h, BLUE);
				rect(front, 17 - h, 2, 1, CREAM); // foam
			} else if (t >= 44) rect(16 + (t - 44), 16, 2, 1, BLUE); // last of it draining away
		},
	};
};

// watering a potted plant in the sun until it sprouts, buds and blooms
const watering: Variant = (f, pose) => {
	const t = f % 60;
	const pouring = t < 30;
	const h = pouring ? Math.floor(t / 10) + 1 : 4; // stem height
	const proud = t >= 40 && t < 50;
	pose.ex = 1;
	pose.arms = [proud, pouring];
	if (pouring) pose.eyes = "down";
	else if (proud) pose.eyes = "up";
	const dy = proud && f % 2 ? -1 : 0;
	return {
		dx: -4,
		dy,
		props: ({ rect, sprite }) => {
			rect(21, 0, 3, 3, YELLOW); // sun, rays twinkling
			if (f % 4 < 2) rect(19, 1, 1, 1, YELLOW), rect(22, 4, 1, 1, YELLOW);
			else rect(20, 3, 1, 1, YELLOW);
			rect(0, 16, 24, 1, GREEN);
			rect(20, 15, 3, 2, BROWN); // terracotta pot
			rect(19, 14, 5, 1, ORANGE);
			rect(21, 14 - h, 1, h, GREEN); // stem and leaves
			if (h >= 2) rect(20, 12, 1, 1, GREEN);
			if (h >= 3) rect(22, 11, 1, 1, GREEN);
			if (pouring) {
				const c = claw(pose, -4, dy); // claw raised at (14,7)
				rect(c.x + 2, c.y - 1, 1, 2, GREY); // handle, gripped by the claw
				rect(c.x + 3, c.y - 2, 3, 3, SILVER); // can, tipped forward
				rect(c.x + 6, c.y, 1, 1, SILVER), rect(c.x + 7, c.y + 1, 1, 1, GREY); // spout and rose, aimed at the pot
				for (let y = c.y + 2; y < 14 - h; y++) if ((y + f) % 2) rect(c.x + 7, y, 1, 1, BLUE); // water falling onto the plant
			} else {
				rect(15, 14, 3, 2, SILVER), rect(14, 14, 1, 1, GREY), rect(18, 14, 1, 1, GREY); // can set down: handle, body, spout
				if (t < 36) rect(21, 9, 1, 1, PINK); // bud
				else sprite(20, 7, FLOWER, PINK), rect(21, 8, 1, 1, YELLOW); // in bloom
			}
		},
	};
};

// flying a kite on a breezy day, a gust tugs it and he digs in
const kite: Variant = (f, pose) => {
	const t = f % 40;
	const gust = t >= 28 && t < 34;
	const kx = gust ? 19 : 17 + [0, 1, 2, 1][(f >> 2) % 4];
	const ky = gust ? 0 : [1, 0, 0, 1][(f >> 2) % 4];
	const dx = gust ? -3 : -4;
	pose.eyes = "up";
	pose.ex = 1;
	pose.arms = [gust, true];
	if (gust) pose.legShift = f % 2 ? 1 : -1;
	return {
		dx,
		props: ({ rect, sprite }) => {
			const c = claw(pose, dx);
			sprite(23 - ((f >> 1) % 30), 3, CLOUD, GREY); // drifting by, behind the string
			rect(0, 16, 24, 1, GREEN);
			line(rect, c.x + 2, c.y, kx + 1, ky + 3, SILVER); // string, from the claw to the kite's bridle
			sprite(kx, ky, KITE, PINK);
			rect(kx + 2, ky + 2, 1, 1, YELLOW); // where the spars cross
			for (let i = 0; i < 3; i++) rect(kx + 2 + ((i + (f >> 1)) % 2), ky + 6 + i, 1, 1, i % 2 ? LILAC : YELLOW); // bows on the tail, flicking in the wind
		},
	};
};

// camping under the moon by his tent, toasting a marshmallow over the fire until it catches and he blows it out
const camping: Variant = (f, pose) => {
	const t = f % 40;
	const burning = t >= 22 && t < 30;
	const blowing = t >= 28 && t < 34;
	const m = t < 10 ? CREAM : t < 22 ? SAND : t < 34 ? BROWN : t < 38 ? CHAR : ""; // toasting, golden, catching, burnt, (a fresh one)
	pose.ex = 1;
	pose.eyes = t >= 34 ? "down" : burning && !blowing ? "open" : pose.eyes;
	if (blowing) (pose.squash = 1), (pose.eyes = "closed");
	return {
		dx: -4,
		props: ({ rect, sprite }) => {
			sprite(1, 0, [".##", "##.", "##.", ".##"], YELLOW); // moon
			for (const [x, y, k] of [[6, 1, 0], [10, 3, 2], [14, 0, 1], [8, 4, 3]]) if ((f + k) % 6 < 4) rect(x, y, 1, 1, CREAM);
			rect(15, 4, 9, 1, NIGHT_GRASS); // a far ridge…
			sprite(17, 0, TENT, GRASS); // …with the tent pitched on it
			rect(20, 2, 1, 2, INK);
			rect(0, 16, 24, 1, NIGHT_GRASS);
			rect(17, 16, 6, 1, BROWN), rect(18, 15, 1, 1, BROWN), rect(21, 15, 1, 1, BROWN); // crossed logs
			const a = f % 2;
			sprite(18, 11, a ? ["..#.", ".##.", "####", "####"] : [".#..", ".##.", "####", "####"], RED); // flames
			rect(19, 13 - a, 2, 2 + a, ORANGE);
			rect(19 + a, 14, 1, 1, YELLOW);
			for (let k = 0; k < 2; k++) {
				const s = (f + k * 6) % 12; // sparks drifting up and fading
				if (s < 6) rect(22 - k * 5, 11 - s, 1, 1, s < 3 ? YELLOW : ORANGE);
			}
			const c = claw(pose, -4); // right claw, lowered
			line(rect, c.x + 2, c.y, 18, c.y - 1, BROWN); // stick
			if (m) rect(19, c.y - 2, 2, 2, m); // marshmallow, held over the flames
			if (burning) rect(19 + a, c.y - 4, 1, 2, ORANGE), rect(20 - a, c.y - 3, 1, 1, YELLOW);
			if (blowing) rect(14 + (t - 28), c.y - 2, 1, 1, CREAM), t > 28 && rect(13 + (t - 28), c.y - 2, 1, 1, GREY); // a puff of breath
		},
	};
};

// golf: address the teed-up ball, waggle, swing back over his head and through, and the ball pitches onto the
// far green, spins back and drops in the hole
const golf: Variant = (f, pose) => {
	const t = f % 50;
	const BALL = [[20, 11], [21, 8], [22, 5], [22, 3], [23, 1], [23, 1], [23, 2], [23, 3], [22, 3], [21, 3]]; // t16-25: up, over, pitch, spin back
	const swing = t >= 10 && t < 16 ? (t < 12 ? "half" : t < 15 ? "top" : "impact") : t >= 16 && t < 26 ? "finish" : t >= 26 && t < 38 ? "cheer" : "address";
	pose.ex = 1;
	pose.eyes = swing === "finish" || swing === "cheer" ? "up" : "down"; // eye on the ball, then on its flight
	pose.arms = swing === "cheer" ? [true, true] : [false, swing === "half" || swing === "top" || swing === "finish"];
	const dy = swing === "cheer" && f % 2 ? -1 : 0;
	return {
		dx: -4,
		dy,
		props: ({ rect }) => {
			const c = claw(pose, -4, dy);
			// the far green on its hill, the pin standing in the hole, flag fluttering
			rect(18, 5, 6, 1, GRASS);
			rect(19, 4, 5, 1, GREEN);
			rect(20, 4, 2, 1, INK);
			rect(20, 0, 1, 4, CREAM);
			rect(21, 0, 2, 1, RED), rect(21, 1, 1, 1, RED);
			if (f % 2) rect(22, 1, 1, 1, RED);
			rect(0, 16, 24, 1, GREEN); // the tee box
			rect(19, 15, 1, 1, SAND); // tee
			if (t < 16 || t >= 38) rect(19, 14, 1, 1, CREAM); // ball (a new one teed up after the hole)
			else if (t < 26) rect(BALL[t - 16][0], BALL[t - 16][1], 1, 1, CREAM);
			// the club: a straight silver shaft from the claw, grey head
			const grip = (x1: number, y1: number, hx: number, hy: number, hw = 2) => {
				line(rect, c.x + 2, c.y, x1, y1, SILVER);
				rect(hx, hy, hw, 1, GREY);
			};
			if (swing === "address") {
				const up = t % 8 >= 2 && t % 8 < 4 ? 1 : 0; // waggle: the head lifts off the turf
				grip(17, 14 - up, 17, 15 - up);
			} else if (swing === "half") line(rect, c.x + 1, c.y - 1, 14, 3, SILVER), rect(13, 2, 2, 1, GREY); // on the way back
			else if (swing === "top") line(rect, c.x + 1, c.y - 1, 11, 3, SILVER), rect(10, 3, 1, 2, GREY);
			else if (swing === "impact") grip(17, 13, 17, 14);
			else if (swing === "finish") grip(17, 3, 17, 2);
			else grip(16, c.y - 4, 16, c.y - 5); // cheering, club held high
		},
	};
};

// badminton: the shuttlecock floats over the net, he winds up and smashes it back just as it arrives
const badminton: Variant = (f, pose) => {
	const t = f % 24;
	const phase = t >= 21 ? "back" : t === 0 ? "hit" : t < 3 ? "through" : "ready";
	let sx = -1, sy = 0, dir = 1;
	if (t === 0) (sx = 17), (sy = 3), (dir = -1);
	else if (t < 13) (sx = Math.round(17 + (8 * t) / 12)), (sy = Math.round(3 - 12 * (t / 12) * (1 - t / 12)));
	else if (t >= 14) (sx = Math.round(23 - (6 * (t - 14)) / 10)), (sy = Math.round(3 * ((t - 14) / 10) ** 2)), (dir = -1);
	pose.eyes = "up";
	pose.ex = 1;
	pose.arms = [false, phase !== "ready"];
	pose.legShift = t >= 12 && t < 18 ? (f % 2 ? 1 : -1) : 0; // bouncing on his toes, ready
	return {
		dx: -4,
		props: ({ rect, sprite }) => {
			const c = claw(pose, -4);
			rect(0, 16, 24, 1, GREEN);
			rect(19, 10, 1, 6, GREY), rect(23, 10, 1, 6, GREY); // net posts…
			for (let y = 11; y < 14; y++) for (let x = 20; x < 23; x++) if ((x + y) % 2) rect(x, y, 1, 1, GREY); // …mesh…
			rect(19, 10, 5, 1, CREAM); // …and tape
			// racket: silver shaft out of the claw, blue oval rim, grey strings
			const racket = (pts: number[][], hx: number, hy: number) => {
				for (const [x, y] of pts) rect(x, y, 1, 1, SILVER);
				sprite(hx, hy, RACKET, BLUE);
				rect(hx + 1, hy + 1, 1, 2, GREY);
			};
			if (phase === "ready") racket([[c.x + 2, c.y - 1], [c.x + 3, c.y - 2]], c.x + 3, c.y - 6);
			else if (phase === "back") racket([[c.x, c.y - 1], [c.x - 1, c.y - 2]], c.x - 3, c.y - 6);
			else if (phase === "hit") racket([[c.x + 1, c.y - 1], [c.x + 1, c.y - 2]], c.x, c.y - 6);
			else racket([[c.x + 2, c.y - 1], [c.x + 3, c.y - 2]], c.x + 3, c.y - 6);
			if (sx >= 0) {
				rect(sx, sy, 1, 1, CREAM); // cork leading…
				rect(sx - dir, sy, 1, 1, SILVER), rect(sx - 2 * dir, sy - 1, 1, 1, SILVER), rect(sx - 2 * dir, sy + 1, 1, 1, SILVER); // …feather skirt fanning out behind
			}
		},
	};
};

export const outdoors: { morning: Variant[]; afternoon: Variant[]; evening: Variant[] } = {
	morning: [strolling, watering, kite],
	afternoon: [fishing, sunbathing, sandcastle, golf, badminton, kite],
	evening: [camping, fishing, strolling],
};
