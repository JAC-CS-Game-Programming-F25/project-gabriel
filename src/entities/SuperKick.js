import PowerUp from './PowerUp.js';
import PowerUpType from '../enums/PowerUpType.js';
import { context } from '../globals.js';

export default class SuperKick extends PowerUp {
	/**
	 * Super Kick powerup grants one powerful shot with triple force
	 */
	constructor(x, y) {
		super(x, y, PowerUpType.SuperKick);
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
		// Draw flame/fire symbol
		context.fillStyle = 'white';
		context.font = 'bold 24px Arial';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText('🔥', 0, 0);
	}
}