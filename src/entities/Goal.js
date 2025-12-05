import Rectangle from './Rectangle.js';
import BodyType from '../enums/BodyType.js';
import { context } from '../globals.js';

export default class Goal extends Rectangle {
	static WIDTH = 100;
	static HEIGHT = 300;

	/**
	 * A goal zone that detects when the ball enters.
	 * 
	 * @param {number} x
	 * @param {number} y
	 * @param {number} playerNumber Which player defends this goal (1 or 2)
	 */
	constructor(x, y, playerNumber) {
		super(x, y, Goal.WIDTH, Goal.HEIGHT, {
			label: BodyType.Goal,
			isStatic: true,
			isSensor: true, // Sensor = triggers events but doesn't collide with anything
		});

		this.playerNumber = playerNumber;
		this.renderOffset = { x: -Goal.WIDTH / 2, y: -Goal.HEIGHT / 2 };
	}

	render() {
		context.save();
		context.translate(this.body.position.x, this.body.position.y);
		
		// Draw goal posts
		context.fillStyle = 'white';
		context.fillRect(this.renderOffset.x, this.renderOffset.y, 10, Goal.HEIGHT);
		context.fillRect(this.renderOffset.x + Goal.WIDTH - 10, this.renderOffset.y, 10, Goal.HEIGHT);
		context.fillRect(this.renderOffset.x, this.renderOffset.y, Goal.WIDTH, 10);
		
		// Draw net pattern
		context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
		context.lineWidth = 2;
		for (let i = 0; i < Goal.HEIGHT; i += 20) {
			context.beginPath();
			context.moveTo(this.renderOffset.x, this.renderOffset.y + i);
			context.lineTo(this.renderOffset.x + Goal.WIDTH, this.renderOffset.y + i);
			context.stroke();
		}
		for (let i = 0; i < Goal.WIDTH; i += 20) {
			context.beginPath();
			context.moveTo(this.renderOffset.x + i, this.renderOffset.y);
			context.lineTo(this.renderOffset.x + i, this.renderOffset.y + Goal.HEIGHT);
			context.stroke();
		}
		
		context.restore();
	}
}