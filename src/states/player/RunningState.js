import State from '../../../lib/State.js';
import { matter } from '../../globals.js';

const { Body } = matter;

export default class RunningState extends State {
	constructor(player) {
		super();
		this.player = player;
	}

	update(dt) {
		const onGround = this.player.isOnGround();
		const baseSpeed = 0.04;
		const speedMultiplier = this.player.hasSpeedBoost ? 1.8 : 1.0;
		const airControlMultiplier = onGround ? 1.0 : 0.3;
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
		
		if (!this.player.input.isKeyHeld(this.player.controls.left) && 
		    !this.player.input.isKeyHeld(this.player.controls.right)) {
			this.player.stateMachine.change('idle');
			return;
		}
		
		if (this.player.input.isKeyPressed(this.player.controls.jump) && onGround) {
			this.player.stateMachine.change('jumping');
			return;
		}
		
		if (this.player.input.isKeyPressed(this.player.controls.kick)) {
			this.player.stateMachine.change('kicking');
			return;
		}
	}
}