import streamDeck from "@elgato/streamdeck";

import { Pet } from "./actions/pet";

streamDeck.actions.registerAction(new Pet());

streamDeck.connect();
