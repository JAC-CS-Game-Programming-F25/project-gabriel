import { context, CANVAS_HEIGHT, CANVAS_WIDTH, images } from '../globals.js';
import ImageName from '../enums/ImageName.js';

export default class Stadium {
	/**
	 * The stadium background/field for Head Soccer.
	 */
	constructor() {
		this.background = images.get(ImageName.Background);
	}

	render() {
		// Simple sky blue background for now
		context.save();
		context.fillStyle = '#87CEEB';
		context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		context.restore();
	}
}