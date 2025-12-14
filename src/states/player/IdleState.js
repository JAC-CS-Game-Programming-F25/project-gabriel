import State from '../../../lib/State.js';

export default class IdleState extends State {
	constructor(player) {
		super();
		this.player = player;
	}

	update(dt) {
		const onGround = this.player.isOnGround();
		
		if (this.player.input.isKeyHeld(this.player.controls.left) || 
		    this.player.input.isKeyHeld(this.player.controls.right)) {
			this.player.stateMachine.change('running');
			return;
		}
		
		if (this.player.input.isKeyPressed(this.player.controls.jump) && onGround) {
			this.player.stateMachine.change('jumping');
			return;
		}
		
		if (this.player.input.isKeyPressed(this.player.controls.kick)) {
			this.player.stateMachine.change('kicking');
			return;
		}
	}
}