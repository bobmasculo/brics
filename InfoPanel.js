export default class InfoPanel {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
    }

    create() {
        const x = 20; // Lado esquerdo
        const y = 20; // Topo
        const width = 200;
        const height = 130;

        // Container para agrupar os elementos do painel
        this.container = this.scene.add.container(x, y)
            .setScrollFactor(0)
            .setDepth(10000)
            .setVisible(false); // Começa invisível

        // Fundo semi-transparente
        const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);
        
        // Borda
        const border = this.scene.add.rectangle(0, 0, width, height).setStrokeStyle(2, 0x00ff00).setOrigin(0);

        // Textos
        this.nameText = this.scene.add.text(10, 10, '', { 
            fontSize: '18px', color: '#ffff00', fontStyle: 'bold', fontFamily: 'Arial' 
        });

        this.statsText = this.scene.add.text(10, 40, '', { 
            fontSize: '14px', color: '#ffffff', fontFamily: 'Arial', lineSpacing: 6
        });

        // Adiciona tudo ao container
        this.container.add([bg, border, this.nameText, this.statsText]);
    }

    update(selectedUnits) {
        // Só mostra o painel se o botão INFO estiver ligado
        if (!this.scene.isInfoMode) {
            if (this.container.visible) this.container.setVisible(false);
            return;
        }

        // Regra: Aparece se 1 selecionado. Se +1 (mais de um) ou 0, desaparece.
        if (selectedUnits && selectedUnits.length === 1) {
            const unit = selectedUnits[0];
            
            // Atualiza os textos
            this.nameText.setText(unit.name ? unit.name.toUpperCase() : 'UNIDADE');
            
            const armor = unit.armor !== undefined ? unit.armor : 0;
            const attack = unit.attackStrength !== undefined ? unit.attackStrength : 0;
            const health = unit.health !== undefined ? Math.floor(unit.health) : 0;

            this.statsText.setText(
                `ARMOR: ${armor}\n` +
                `FORÇA ATAQUE: ${attack}\n` +
                `VIDA: ${health}`
            );

            this.container.setVisible(true);
        } else {
            if (this.container) this.container.setVisible(false);
        }
    }
}