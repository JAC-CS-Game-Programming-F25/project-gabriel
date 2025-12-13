import PowerUp from './PowerUp.js';
import PowerUpType from '../enums/PowerUpType.js';
import ImageName from '../enums/ImageName.js';
import { context, images } from '../globals.js';

export default class BigHead extends PowerUp {
	/**
	 * Big Head powerup doubles player's head size
	 */
	constructor(x, y) {
		super(x, y, PowerUpType.BigHead);
		this.icon = images.get(ImageName.BigHeadIcon);
	}

	collect(player) {
		super.collect(player);
		
		// Apply big head effect
		player.hasBigHead = true;
		player.bigHeadTimer = PowerUp.DURATION;
		
		console.log(`Player ${player.playerNumber} got BIG HEAD!`);
	}

	getColor() {
		return '#FF69B4'; // Hot pink
	}

	renderIcon() {
		// Draw the icon sprite centered 
		const image = this.icon?.image || this.icon;
		
		if (image && image instanceof HTMLImageElement) {
			const iconSize = PowerUp.RADIUS * 1.5; // Make icon slightly bigger than circle
			context.drawImage(
				image,
				-iconSize / 2,
				-iconSize / 2,
				iconSize,
				iconSize
			);
		} else {
			// Fallback to emoji if sprite not loaded for some reason
			context.fillStyle = 'white';
			context.font = 'bold 20px Arial';
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.fillText('↕', 0, 0);
		}
	}
}