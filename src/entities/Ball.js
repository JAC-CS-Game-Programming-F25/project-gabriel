import Circle from './Circle.js';
import BodyType from '../enums/BodyType.js';
import GameEntity from './GameEntity.js';
import { matter } from '../globals.js';

export default class Ball extends Circle {
	static RADIUS = 15;
	static SPRITE_MEASUREMENTS = [{ x: 0, y: 0, width: 30, height: 30 }]; // Placeholder for now

	constructor(x, y) {
		super(x, y, Ball.RADIUS, {
			label: BodyType.Ball,
			density: 0.003,
			restitution: 0.9,
			friction: 0.1,
		});

		this.sprites = GameEntity.generateSprites(Ball.SPRITE_MEASUREMENTS);
		this.renderOffset = { x: -15, y: -15 };
	}

	update(dt) {
		super.update(dt);
		
		// Prevent ball from going too fast (anti-tunneling)
		const maxSpeed = 50;
		const velocity = this.body.velocity;
		const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
		
		if (speed > maxSpeed) {
			// Scale velocity down to max speed
			const scale = maxSpeed / speed;
			matter.Body.setVelocity(this.body, {
				x: velocity.x * scale,
				y: velocity.y * scale
			});
		}

		// Anti-stuck mechanism: if ball is moving very slowly at high altitude, give it a lil nudge
		const isHighUp = this.body.position.y < 400; // Upper half of screen
		if (speed < 0.5 && isHighUp && Math.abs(velocity.y) < 0.3) {
			// Ball is nearly stationary up high, give it a nudge to keep it moving
			matter.Body.applyForce(this.body, this.body.position, {
				x: (Math.random() - 0.5) * 0.003,
				y: -0.002 // Slight upward nudge
			});
		}
	}

	reset(x, y) {
		// Reset ball to center after goal
		matter.Body.setPosition(this.body, { x, y });
		matter.Body.setVelocity(this.body, { x: 0, y: 0 });
		matter.Body.setAngularVelocity(this.body, 0);
	}
}