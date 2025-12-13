import PowerUp from './PowerUp.js';
import PowerUpType from '../enums/PowerUpType.js';
import ImageName from '../enums/ImageName.js';
import { context, images } from '../globals.js';

export default class SuperKick extends PowerUp {
	/**
	 * Super Kick powerup grants one powerful shot with triple force
	 */
	constructor(x, y) {
		super(x, y, PowerUpType.SuperKick);
		this.icon = images.get(ImageName.PowerShotIcon);
	}

	collect(player) {
		super.collect(player);
		
		// Apply super kick effect (one-time use)
		player.hasSuperKick = true;
		player.superKickTimer = PowerUp.DURATION; // Duration just for visual indicator
		
		console.log(`Player ${player.playerNumber} got SUPER KICK!`);
	}

	getColor() {
		return '#FF4500'; // Orange-red (to be like fire)
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
			context.fillText('🔥', 0, 0);
		}
	}
}