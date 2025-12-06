import Rectangle from './Rectangle.js';
import BodyType from '../enums/BodyType.js';

export default class Wall extends Rectangle {
	/**
	 * An invisible wall that keeps the ball and players on screen.
	 * Walls dont move and are invisible
	 * 
	 * @param {number} x
	 * @param {number} y
	 * @param {number} width
	 * @param {number} height
	 */
	constructor(x, y, width, height) {
		super(x, y, width, height, {
			label: BodyType.Wall,
			isStatic: true, // Walls dont move
			restitution: 0.6, // Bouncy so ball bounces off
			friction: 0.3,
		});
	}

	render() {
		// Walls are invisible so we don't render anything
	}
}