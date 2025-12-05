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

	reset(x, y) {
		// Reset ball to center after goal
		matter.Body.setPosition(this.body, { x, y });
		matter.Body.setVelocity(this.body, { x: 0, y: 0 });
		matter.Body.setAngularVelocity(this.body, 0);
	}
}