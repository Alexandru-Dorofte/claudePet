import type { Variant } from "../art";
import { browsing } from "./browsing";
import { delegating } from "./delegating";
import { attention, compacting, dancing, oops } from "./events";
import { listening, sleeping } from "./idle";
import { home } from "./life-home";
import { outdoors } from "./life-outdoors";
import { reading } from "./reading";
import { searching } from "./searching";
import { thinking } from "./thinking";
import { working } from "./working";
import { writing } from "./writing";

/** Claude Code isn't running: Clawd does his own thing, picked from what suits the time of day. */
export const LIFE = {
	// 7:00-18:00, one big list (mornings are mostly slept through anyway)
	day: [...new Set([...outdoors.morning, ...outdoors.afternoon, ...home.morning, ...home.afternoon])],
	evening: [...outdoors.evening, ...home.evening], // 18:00-24:00
};

/** Every mood and its animation variants; the plugin picks one at random each time a mood starts. */
export const SCENES = {
	sleeping,
	living: [...new Set([...LIFE.day, ...LIFE.evening])],
	listening,
	thinking,
	working,
	reading,
	writing,
	searching,
	browsing,
	delegating,
	oops,
	compacting,
	attention,
	dancing,
} satisfies Record<string, Variant[]>;

export type Mood = keyof typeof SCENES;
