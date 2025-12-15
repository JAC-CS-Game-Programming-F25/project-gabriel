import State from '../../../lib/State.js';
import PowerUpType from '../../enums/PowerUpType.js';

export default class EffectActiveState extends State {
	constructor(powerup) {
		super();
		this.powerup = powerup;
	}

	enter(player) {
		this.player = player;
		this.effectDuration = 5.0;
		this.effectTimer = this.effectDuration;
		
		this.applyEffect();
	}

	applyEffect() {
		if (!this.player) return;
		
		switch(this.powerup.type) {
			case PowerUpType.SpeedBoost:
				this.player.hasSpeedBoost = true;
				this.player.speedBoostTimer = this.effectDuration;
				break;
			case PowerUpType.BigHead:
				this.player.hasBigHead = true;
				this.player.bigHeadTimer = this.effectDuration;
				break;
			case PowerUpType.SuperKick:
				this.player.hasSuperKick = true;
				this.player.superKickTimer = this.effectDuration;
		break;
		}
	}

	update(dt) {
		this.effectTimer -= dt;
		
		if (this.effectTimer <= 0) {
			this.powerup.shouldCleanUp = true;
		}
	}
}