import State from '../../../lib/State.js';
import { matter, sounds } from '../../globals.js';
import SoundName from '../../enums/SoundName.js';

const { Body } = matter;

export default class JumpingState extends State {
	constructor(player) {
		super();
		this.player = player;
	}

	enter() {
		sounds.play(SoundName.Hop);
		Body.applyForce(this.player.head, this.player.head.position, { x: 0, y: -0.35 });
		Body.applyForce(this.player.boot, this.player.boot.position, { x: 0, y: -0.35 });
	}

	update(dt) {
		const baseSpeed = 0.04;
		const speedMultiplier = this.player.hasSpeedBoost ? 1.8 : 1.0;
		const airControlMultiplier = 0.3;
		const speed = baseSpeed * speedMultiplier * airControlMultiplier;
		const maxSpeed = 7 * speedMultiplier;
		const bootVelocity = this.player.boot.velocity;
		
		if (this.player.input.isKeyHeld(this.player.controls.left)) {
			if (bootVelocity.x > -maxSpeed) {
				Body.applyForce(this.player.boot, this.player.boot.position, { x: -speed, y: 0 });
			}
		}
		
		if (this.player.input.isKeyHeld(this.player.controls.right)) {
			if (bootVelocity.x < maxSpeed) {
				Body.applyForce(this.player.boot, this.player.boot.position, { x: speed, y: 0 });
			}
		}
		
		if (this.player.input.isKeyPressed(this.player.controls.kick)) {
			this.player.stateMachine.change('kicking');
			return;
		}
		
		if (this.player.boot.velocity.y > 0) {
			this.player.stateMachine.change('falling');
			return;
		}
	}
}