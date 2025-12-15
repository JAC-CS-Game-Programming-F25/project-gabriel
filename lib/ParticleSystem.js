/**
 * ParticleSystem - Manages and renders particles for visual effects
 */
export default class ParticleSystem {
	constructor() {
		this.particles = [];
	}

	/**
	 * Create a burst of particles at a position
	 */
	burst(x, y, count, colors, speed = 200) {
		for (let i = 0; i < count; i++) {
			const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
			const particleSpeed = speed * (0.5 + Math.random() * 0.5);
			const vx = Math.cos(angle) * particleSpeed;
			const vy = Math.sin(angle) * particleSpeed - 100; // Slight upward bias
			
			const color = colors[Math.floor(Math.random() * colors.length)];
			const size = 3 + Math.random() * 4;
			const lifetime = 0.5 + Math.random() * 0.5;
			
			this.particles.push({
				x, y, vx, vy, 
				color, size, lifetime,
				age: 0,
				gravity: 400
			});
		}
	}

	/**
	 * Create confetti particles (for goals scord)
	 */
	confetti(x, y, count) {
		const confettiColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#ffa500'];
		
		for (let i = 0; i < count; i++) {
			const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
			const speed = 300 + Math.random() * 200;
			const vx = Math.cos(angle) * speed;
			const vy = Math.sin(angle) * speed;
			
			this.particles.push({
				x, y, vx, vy,
				color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
				size: 4 + Math.random() * 3,
				lifetime: 1.0 + Math.random() * 0.5,
				age: 0,
				gravity: 500,
				rotation: Math.random() * Math.PI * 2,
				rotationSpeed: (Math.random() - 0.5) * 10
			});
		}
	}

	update(dt) {
		this.particles.forEach(p => {
			p.age += dt;
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.vy += p.gravity * dt;
			if (p.rotation !== undefined) {
				p.rotation += p.rotationSpeed * dt;
			}
		});

		// Remove dead particles
		this.particles = this.particles.filter(p => p.age < p.lifetime);
	}

	render(context) {
		this.particles.forEach(p => {
			const alpha = 1 - (p.age / p.lifetime);
			if (alpha <= 0) return;

			context.save();
			context.globalAlpha = alpha;
			
			if (p.rotation !== undefined) {
				// Rectangular confetti
				context.translate(p.x, p.y);
				context.rotate(p.rotation);
				context.fillStyle = p.color;
				context.fillRect(-p.size / 2, -p.size, p.size, p.size * 2);
			} else {
				// Circular particles
				context.fillStyle = p.color;
				context.beginPath();
				context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
				context.fill();
			}
			
			context.restore();
		});
	}

	clear() {
		this.particles = [];
	}
}