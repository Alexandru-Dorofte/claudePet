import streamDeck from "@elgato/streamdeck";

import { Pet } from "./actions/pet";
import { Quota } from "./actions/quota";

streamDeck.actions.registerAction(new Pet());
streamDeck.actions.registerAction(new Quota());

streamDeck.connect();
