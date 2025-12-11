import PowerUp from './PowerUp.js';
import PowerUpType from '../enums/PowerUpType.js';
import { context } from '../globals.js';

export default class SpeedBoost extends PowerUp {
	/**
	 * Speed Boost powerup increases the players movement speed.
	 */
	constructor(x, y) {
		super(x, y, PowerUpType.SpeedBoost);
	}

	collect(player) {
		super.collect(player);
		
		// Apply speed boost effect
		player.hasSpeedBoost = true;
		player.speedBoostTimer = PowerUp.DURATION;
		
		console.log(`Player ${player.playerNumber} got SPEED BOOST!`);
	}

	getColor() {
		return '#FFD700'; // Gold/yellow
	}

	renderIcon() {
		// Draw lightning bolt symbol
		context.fillStyle = 'white';
		context.font = 'bold 24px Arial';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText('⚡', 0, 0);
	}
}