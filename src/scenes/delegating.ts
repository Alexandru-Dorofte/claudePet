import { CREAM, GREEN, GREY, INK, SILVER, type Variant } from "../art";

export const delegating: Variant[] = [
	// waving a flag to send the mini crabs off
	(f, pose) => {
		pose.arms = [f % 4 < 2, true];
		return {
			props: ({ rect }) => {
				rect(19, 1, 1, 6, GREY); // pole, held in the raised right claw
				rect(20, 1, f % 2 ? 3 : 2, 2, CREAM);
				rect(20, 3, f % 2 ? 2 : 3, 1, CREAM);
			},
		};
	},
	// shouting orders through a megaphone, sound waves pulsing
	(f, pose) => {
		pose.arms = [false, true];
		pose.ex = 1;
		return {
			props: ({ rect, sprite }) => {
				rect(18, 5, 1, 2, GREY); // handle down to the claw
				sprite(16, 0, ["...#", "..##", "####", "####", "..##", "...#"], CREAM);
				if (f % 4 > 0) rect(21, 1, 1, 4, SILVER);
				if (f % 4 > 1) rect(23, 0, 1, 6, SILVER);
			},
		};
	},
	// ticking items off a clipboard
	(f, pose) => {
		pose.eyes = "down";
		pose.ex = -1;
		pose.arms = [false, f % 2 === 1];
		return {
			props: ({ rect }) => {
				rect(0, 9, 5, 8, GREY);
				rect(1, 10, 3, 6, CREAM);
				rect(1, 8, 3, 1, SILVER); // clip
				for (let i = 0; i < 3; i++) {
					if (i < f % 4) rect(1, 11 + i * 2, 3, 1, GREEN);
					else rect(1, 11 + i * 2, 1, 1, SILVER), rect(2, 11 + i * 2, 2, 1, INK);
				}
			},
		};
	},
];
