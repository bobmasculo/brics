export default class VirtualJoystick {
    constructor(scene, x, y, radius = 60, deadzone = 10) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.deadzone = deadzone;
        this.stick = null;
        this.base = null;
        this.forceX = 0;
        this.forceY = 0;
        this.isVisible = true;
        this.activePointer = null;

        this.create();
    }

    create() {
        // Create the base of the joystick
        this.base = this.scene.add.circle(this.x, this.y, this.radius, 0x888888, 0.5)
            .setScrollFactor(0)
            .setDepth(11000)
            .setAlpha(0.8)
            .setVisible(true);

        // Create the moving stick of the joystick
        this.stick = this.scene.add.circle(this.x, this.y, this.radius / 2, 0xffffff, 0.7)
            .setScrollFactor(0)
            .setDepth(11001)
            .setAlpha(0.8)
            .setVisible(true);
    }

    activate(x, y, pointer) {
		// Se quiser que o joystick seja FIXO, não alteramos this.x e this.y
		// Caso queira que ele apareça onde você toca, mantenha as linhas abaixo:
        // this.x = x;
        // this.y = y;
        // this.base.setPosition(x, y);

        this.activePointer = pointer;
        this.isVisible = true;

        this.stick.setPosition(x, y).setVisible(true);
		
		this.forceX = 0;
		this.forceY = 0;
    }

    update() {
        if (!this.isVisible || !this.activePointer) return;

        if (!this.activePointer.isDown) {
            this.hide();
            return;
        }

        let distance = Phaser.Math.Distance.Between(this.x, this.y, this.activePointer.x, this.activePointer.y);
        let angle = Phaser.Math.Angle.Between(this.x, this.y, this.activePointer.x, this.activePointer.y);

		if (distance < this.deadzone) {
			this.stick.setPosition(this.x, this.y);
			this.forceX = 0;
			this.forceY = 0;
			return;
		}

        distance = Math.min(distance, this.radius);

        this.stick.x = this.x + Math.cos(angle) * distance;
        this.stick.y = this.y + Math.sin(angle) * distance;

        this.forceX = Math.cos(angle) * ((distance - this.deadzone) / (this.radius - this.deadzone));
        this.forceY = Math.sin(angle) * ((distance - this.deadzone) / (this.radius - this.deadzone));
    }

    show() {
        this.isVisible = true;
        this.stick.setVisible(true);
        this.base.setVisible(true);
    }

    hide() {
		// Agora o hide não esconde mais visualmente, apenas reseta o estado lógico
        this.activePointer = null;
		// Opcional: manter isVisible true para o UnitController saber que a área está ocupada
        this.isVisible = true; 
        this.stick.setPosition(this.x, this.y);
        this.forceX = 0;
        this.forceY = 0;
    }

    destroy() {
        if (this.stick) this.stick.destroy();
        if (this.base) this.base.destroy();
    }
}