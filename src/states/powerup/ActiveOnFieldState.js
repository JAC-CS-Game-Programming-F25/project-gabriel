import State from '../../../lib/State.js';
import { matter } from '../../globals.js';

export default class ActiveOnFieldState extends State {
	constructor(powerup) {
		super();
		this.powerup = powerup;
	}

	enter() {
		this.powerup.activeOnField = true;
	}

	update(dt) {
		this.powerup.bobTimer += dt * this.powerup.bobSpeed;
		const offset = Math.sin(this.powerup.bobTimer) * this.powerup.bobAmount;
		matter.Body.setPosition(this.powerup.body, {
			x: this.powerup.body.position.x,
			y: this.powerup.baseY + offset
		});
	}

	exit() {
		this.powerup.activeOnField = false;
	}
}