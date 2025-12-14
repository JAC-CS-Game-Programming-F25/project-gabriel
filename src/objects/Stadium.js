import { context, CANVAS_HEIGHT, CANVAS_WIDTH, images } from '../globals.js';
import ImageName from '../enums/ImageName.js';

export default class Stadium {
	/**
	 * The stadium background/field for Head Soccer.
	 */
	constructor() {
		this.backgroundGraphic = images.get(ImageName.Background);
	}

	render() {
		context.save();
		
		const img = this.backgroundGraphic.image;
		
		// Check if background image is loaded
		if (img && img.complete && img.naturalWidth > 0) {
			// Scale and draw the background to fill the entire canvas
			context.drawImage(
				img, 
				0, 0, 
				img.naturalWidth, 
				img.naturalHeight,
				0, 0,
				CANVAS_WIDTH,
				CANVAS_HEIGHT
			);
		} else {
			// Fallback to blue sky if image not loaded
			context.fillStyle = '#87CEEB';
			context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		}
		
		context.restore();
	}
}