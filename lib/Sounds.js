import SoundPool from "./SoundPool.js";
import SoundName from "../src/enums/SoundName.js";

export default class Sounds {
	constructor() {
		this.sounds = {};
	}

	load(soundDefinitions) {
		soundDefinitions.forEach((soundDefinition) => {
			this.sounds[soundDefinition.name] = new SoundPool(
				soundDefinition.path,
				soundDefinition.size,
				soundDefinition.volume,
				soundDefinition.loop,
			);
		});
	}

	get(name) {
		return this.sounds[name];
	}

	/**
	 * Check if sound effects are enabled from settings
	 */
	areSoundEffectsEnabled() {
		try {
			const savedSettings = localStorage.getItem('headSoccerSettings');
			if (savedSettings) {
				const settings = JSON.parse(savedSettings);
				return settings.soundEffectsEnabled ?? true;
			}
		} catch (e) {
			// If error reading settings, default to enabled
		}
		return true;
	}

	play(name) {
		// Check if sound effects are disabled
		// Background music always plays regardless of sound effects setting
		if (!this.areSoundEffectsEnabled() && name !== SoundName.BackgroundMusic) {
			return; // Don't play sound effect
		}
		
		this.get(name).play();
	}

	pause(name) {
		this.get(name).pause();
	}

	stop(name) {
		this.get(name).stop()
	}
}