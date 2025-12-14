import State from '../../../lib/State.js';
import { sounds } from '../../globals.js';
import SoundName from '../../enums/SoundName.js';

export default class CollectedState extends State {
	constructor(powerup) {
		super();
		this.powerup = powerup;
	}

	enter(player) {
		this.player = player;
		
		sounds.play(SoundName.PowerUpCollect);
		this.powerup.collected = true;
		this.powerup.visible = false;
		
		this.powerup.stateMachine.change('effect-active', player);
	}
}