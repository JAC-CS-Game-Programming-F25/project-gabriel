import State from '../../../lib/State.js';

export default class InactiveState extends State {
	constructor(powerup) {
		super();
		this.powerup = powerup;
	}

	enter() {
		this.spawnTimer = 0;
		this.spawnInterval = 15 + Math.random() * 5;
	}

	update(dt) {
		this.spawnTimer += dt;
		
		if (this.spawnTimer >= this.spawnInterval) {
			this.powerup.stateMachine.change('spawning');
		}
	}
}