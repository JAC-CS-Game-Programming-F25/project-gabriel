import SpeedBoost from '../entities/SpeedBoost.js';
import BigHead from '../entities/BigHead.js';
import SuperKick from '../entities/SuperKick.js';
import PowerUpType from '../enums/PowerUpType.js';

export default class PowerUpFactory {
	/**
	 * Factory class that creates random powerups.
	 * This implements the Factory Design Pattern.
	 */
	
	/**
	 * Creates a random powerup at the given position.
	 * 
	 * @param {number} x
	 * @param {number} y
	 * @returns {PowerUp} A random powerup instance
	 */
	static createRandom(x, y) {
		const types = [
			PowerUpType.SpeedBoost,
			PowerUpType.BigHead,
			PowerUpType.SuperKick,
		];
		
		// Pick a random type
		const randomType = types[Math.floor(Math.random() * types.length)];
		
		return PowerUpFactory.create(randomType, x, y);
	}

	/**
	 * Creates a specific powerup type at the given position.
	 * 
	 * @param {string} type - PowerUpType enum value
	 * @param {number} x
	 * @param {number} y
	 * @returns {PowerUp} A powerup instance of the specified type
	 */
	static create(type, x, y) {
		switch (type) {
			case PowerUpType.SpeedBoost:
				return new SpeedBoost(x, y);
			case PowerUpType.BigHead:
				return new BigHead(x, y);
			case PowerUpType.SuperKick:
				return new SuperKick(x, y);
			default:
				throw new Error(`Unknown powerup type: ${type}`);
		}
	}
}