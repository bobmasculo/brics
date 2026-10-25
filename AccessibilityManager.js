// /var/www/html/brics/AccessibilityManager.js
export default class AccessibilityManager {
    constructor(scene) {
        this.scene = scene;
        this.isActive = localStorage.getItem('brics_accessibility_captions') === 'true';
        this.container = null;
        this.textLine = null; // Apenas uma linha de texto
    }
 
    create() {
        const { width, height } = this.scene.scale;
        // Posiciona acima da barra de UI (que tem altura ~85)
        const boxWidth = 500;
        const boxHeight = 40; // Altura reduzida
        const x = width / 2;
        const y = height - 120; // Posição ajustada

        this.container = this.scene.add.container(x, y).setScrollFactor(0).setDepth(30000).setVisible(this.isActive);

        // Fundo preto com borda de alto contraste (Ciano/Amarelo)
        const bg = this.scene.add.rectangle(0, 0, boxWidth, boxHeight, 0x000000, 0.85)
            .setStrokeStyle(3, 0x00ffff);
        this.container.add(bg);

        // Cria a linha de texto única
        this.textLine = this.scene.add.text(0, 0, '', {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
                align: 'center', fontStyle: 'bold', wordWrap: { width: boxWidth - 20 }
            }).setOrigin(0.5);
        this.container.add(this.textLine);

        // Tecla de Atalho N
        this.scene.input.keyboard.on('keydown-N', () => {
            this.toggle();
        });
    }

    toggle() {
        this.isActive = !this.isActive;
        localStorage.setItem('brics_accessibility_captions', this.isActive);
        this.container.setVisible(this.isActive);
        if (this.isActive) {
            this.log("--- MODO ACESSIBILIDADE ATIVADO ---", '#ffffff');
            if (this.scene.uiManager) {
                this.scene.uiManager.updateStatus("Legendas (N): LIGADO");
            }
        } else {
            if (this.scene.uiManager) {
                this.scene.uiManager.updateStatus("Legendas (N): DESLIGADO");
            }
        }
        // Atualiza o painel de opções se estiver aberto
        if (this.scene.optionsPanel) {
            this.scene.optionsPanel.updateAccessibilityDisplay();
        }
    }

    log(message, color = '#ffffff') {
        if (!this.isActive || !this.textLine) return;

        // Atualiza a única linha de texto
        this.textLine.setText(message);
        this.textLine.setColor(color);
    }

    resize(width, height) {
        if (this.container) {
            this.container.setPosition(width / 2, height - 120);
        }
    }

    // Auxiliar para converter ângulo em texto de direção
    getDirectionFromAngle(angleRad) {
        const deg = Phaser.Math.RadToDeg(angleRad);
        if (deg >= -45 && deg <= 45) return "LESTE";
        if (deg > 45 && deg < 135) return "SUL";
        if (deg >= 135 || deg <= -135) return "OESTE";
        return "NORTE";
    }
}
