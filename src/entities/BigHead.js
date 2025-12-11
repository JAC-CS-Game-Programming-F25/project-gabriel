import PowerUp from './PowerUp.js';
import PowerUpType from '../enums/PowerUpType.js';
import { context } from '../globals.js';

export default class BigHead extends PowerUp {
	/**
	 * Big Head powerup doubles player's head size
	 */
	constructor(x, y) {
		super(x, y, PowerUpType.BigHead);
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
		// Draw expand/size up symbol
		context.strokeStyle = 'white';
		context.lineWidth = 3;
		context.beginPath();
		context.moveTo(-8, -8);
		context.lineTo(8, 8);
		context.moveTo(8, -8);
		context.lineTo(-8, 8);
		context.stroke();
		
		// Draw arrows pointing outwardss
		context.fillStyle = 'white';
		context.font = 'bold 20px Arial';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText('↔', 0, 0);
	}
}