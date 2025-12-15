import PowerUp from './PowerUp.js';
import PowerUpType from '../enums/PowerUpType.js';
import ImageName from '../enums/ImageName.js';
import { context, images } from '../globals.js';

export default class SpeedBoost extends PowerUp {
	/**
	 * Speed Boost powerup increases the players movement speed.
	 */
	constructor(x, y) {
		super(x, y, PowerUpType.SpeedBoost);
		this.icon = images.get(ImageName.SpeedIcon);
	}

	collect(player) {
		super.collect(player);
		
		// Apply speed boost effect
		player.hasSpeedBoost = true;
		player.speedBoostTimer = PowerUp.DURATION;	
	}

	getColor() {
		return '#FFD700'; // Gold/yellow
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
			context.font = 'bold 24px Arial';
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.fillText('⚡', 0, 0);
		}
	}
}