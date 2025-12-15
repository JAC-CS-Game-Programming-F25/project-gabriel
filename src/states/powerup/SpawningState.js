import State from '../../../lib/State.js';
import { sounds } from '../../globals.js';
import SoundName from '../../enums/SoundName.js';

export default class SpawningState extends State {
	constructor(powerup) {
		super();
		this.powerup = powerup;
	}

	enter() {
		this.spawnAnimationTimer = 0;
		this.spawnAnimationDuration = 0.5;
		
		sounds.play(SoundName.PowerUpAppear);
		this.powerup.spawning = true;
	}

	update(dt) {
		this.spawnAnimationTimer += dt;
		
		if (this.spawnAnimationTimer >= this.spawnAnimationDuration) {
			this.powerup.stateMachine.change('active-on-field');
		}
	}

	exit() {
		this.powerup.spawning = false; 
	}
}