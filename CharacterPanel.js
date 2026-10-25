export default class CharacterPanel {
    constructor(scene) {
        this.scene = scene;
        this.elements = [];
        this.isVisible = false;
        this.tooltip = null;
        this.connections = []; // Armazena dados das conexões para redesenho
        this.linesGraphics = null; // Objeto gráfico para as linhas
        this.unlockedBoxes = []; // Referências para caixas desbloqueadas (para animação)
        this.glowAlpha = 0.5; // Valor alfa para animação de brilho
    } 
 
    create() { 
        const width = 800;
        const height = 600;
        const panelX = this.scene.scale.width / 2;
        const panelY = this.scene.scale.height / 2;
 
        // Fundo (Usa textura se disponível, senão retângulo)
        let bg;
        if (this.scene.textures.exists('ui_tal')) {
            bg = this.scene.add.image(panelX, panelY, 'ui_tal')
                .setDisplaySize(width, height)
                .setScrollFactor(0).setDepth(10010).setInteractive();
        } else {
            bg = this.scene.add.rectangle(panelX, panelY, width, height, 0x000000, 0.95)
                .setStrokeStyle(4, 0xffff00)
                .setScrollFactor(0).setDepth(10010).setInteractive();
        }

        bg.on('pointerdown', (pointer, localX, localY, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
        });

        // Título Principal
        const titleText = this.scene.add.text(panelX, panelY - height/2 + 35, 'ÁRVORE DE TALENTOS', {
            fontSize: '25px', color: '#2d2d2b', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // --- Pontos de Talento ---
        const level = this.scene.teamLevelManager ? this.scene.teamLevelManager.level : 1;
        const unlockedCount = this.scene.teamLevelManager ? this.scene.teamLevelManager.talents.length : 0;
        const availablePoints = Math.max(0, level - unlockedCount);

        const pointsText = this.scene.add.text(panelX, panelY - height/2 + 65, `PONTOS DISPONÍVEIS: ${availablePoints}`, {
            fontSize: '18px', color: '#040404', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // --- Container do Tooltip ---
        this.tooltip = this.scene.add.container(0, 0).setDepth(20000).setVisible(false).setScrollFactor(0);
        const ttBg = this.scene.add.rectangle(0, 0, 180, 50, 0x000000, 0.9).setStrokeStyle(1, 0xffff00).setOrigin(0);
        const ttText = this.scene.add.text(10, 10, '', { fontSize: '12px', color: '#ffffff', wordWrap: { width: 160 } });
        this.tooltip.add([ttBg, ttText]);
        this.tooltipText = ttText;
        this.tooltipBg = ttBg;

        // --- Posições das Árvores ---
        const branchStartY = panelY - height/2 + 120; 
        const techBranchX = panelX - 200;
        const armamentBranchX = panelX + 200;

        // --- Dados dos Talentos ---
        const techTalents = [
            { id: 't1', label: 'Análise\nTática', icon: 'documento', desc: 'Ganha 5% a mais de XP.', tier: 1 },
            { id: 't2a', label: 'Hack\nBásico', icon: 'hack_icon', desc: 'Permite desativar portas eletrônicas simples.', tier: 2, parent: 't1' },
            { id: 't2b', label: 'Escudo\nLeve', icon: 'shield_icon', desc: 'Escudo pessoal que absorve 50 de dano.', tier: 2, parent: 't1' },
            { id: 't2c', label: 'Radar\nAtivo', icon: 'scope_icon', desc: 'Aumenta o raio de visão no minimapa.', tier: 2, parent: 't1' },
            { id: 't3a', label: 'Overclock\nNeural', icon: 'brain_icon', desc: 'Aumenta a velocidade de movimento em 10%.', tier: 3, parent: 't2a' },
            { id: 't3b', label: 'Drone\nReparo', icon: 'drone_icon', desc: 'Drone passivo que cura 1 HP/s.', tier: 3, parent: 't2b' },
            { id: 't3c', label: 'Scan\nInimigo', icon: 'scope_icon', desc: 'Mostra HP dos inimigos.', tier: 3, parent: 't2c' },
            { id: 't4a', label: 'WARP', icon: 'blink_icon', desc: 'Habilidade de teleporte tático.', tier: 4, parent: 't3a' },
            { id: 't4b', label: 'Pulso\nEMP', icon: 'emp_icon', desc: 'Desativa eletrônicos próximos ao atacar.', tier: 4, parent: 't3b' },
            { id: 't4c', label: 'Camuflagem', icon: 'steath_icon', desc: 'Fica invisível por 5s.', tier: 4, parent: 't3c' },
            { id: 't5a', label: 'teste 1', icon: 'void_icon', desc: 'ULTIMATE: Cria um buraco negro temporário.', tier: 5, parent: ['t4a'], isFinal: true },
             { id: 't5b', label: 'teste 2', icon: 'void_icon', desc: 'ULTIMATE: Cria um buraco negro temporário.', tier: 5, parent: ['t4b'], isFinal: true },
             { id: 't5c', label: 'teste 3', icon: 'void_icon', desc: 'ULTIMATE: Cria um buraco negro temporário.', tier: 5, parent: ['t4c'], isFinal: true }
        ];

        const armamentTalents = [
            { id: 'a1', label: 'Treino\nBásico', icon: 'pistol', desc: 'Aumenta a precisão em 5%.', tier: 1 },
            { id: 'a2a', label: 'Munição\nAP', icon: 'ammo_icon', desc: 'Ignora 10% da armadura inimiga.', tier: 2, parent: 'a1' },
            { id: 'a2b', label: 'Recarga\nVeloz', icon: 'reload_icon', desc: 'Diminui o tempo de recarga em 15%.', tier: 2, parent: 'a1' },
            { id: 'a2c', label: 'Mira\nLaser', icon: 'scope_icon', desc: 'Aumenta precisão em 10%.', tier: 2, parent: 'a1' },
            { id: 'a3a', label: 'Crítico\nFatal', icon: 'crit_icon', desc: 'Aumenta chance de crítico em 10%.', tier: 3, parent: 'a2a' },
            { id: 'a3b', label: 'Granada\nTática', icon: 'grenade_icon', desc: 'Aumenta raio de explosão de granadas.', tier: 3, parent: 'a2b' },
            { id: 'a3c', label: 'Pente\nEstendido', icon: 'ammo_icon', desc: 'Aumenta munição máxima.', tier: 3, parent: 'a2c' },
            { id: 'a4a', label: '+20%\nDANO', icon: 'shotgun', desc: 'Aumenta dano de armas em 20%.', tier: 4, parent: 'a3a' },
            { id: 'a4b', label: 'Cadência\nAlta', icon: 'fire_rate_icon', desc: 'Aumenta velocidade de ataque em 15%.', tier: 4, parent: 'a3b' },
            { id: 'a4c', label: 'Tiro\nCerteiro', icon: 'scope_icon', desc: 'Primeiro tiro causa dano dobrado.', tier: 4, parent: 'a3c' },
            { id: 'a5a', label: 'Chuva de\nBalas', icon: 'minigun_icon', desc: 'ULTIMATE: Dispara em todas as direções.', tier: 5, parent: ['a4a'], isFinal: true },
            { id: 't5b', label: 'teste 2', icon: 'void_icon', desc: 'ULTIMATE: Cria um buraco negro temporário.', tier: 5, parent: ['t4b'], isFinal: true },
             { id: 't5c', label: 'teste 3', icon: 'void_icon', desc: 'ULTIMATE: Cria um buraco negro temporário.', tier: 5, parent: ['t4c'], isFinal: true }
        ];

        // Inicializa gráficos de linha
        this.linesGraphics = this.scene.add.graphics().setDepth(10011).setScrollFactor(0);
        this.elements.push(this.linesGraphics);
        this.connections = [];
        this.unlockedBoxes = [];

        // --- Criar as Árvores ---
        this.createTalentBranch(techBranchX, branchStartY, 'COMBATE', techTalents, availablePoints);
        this.createTalentBranch(armamentBranchX, branchStartY, 'INFULTRAÇÃO', armamentTalents, availablePoints);

        // Animação de Brilho (Tween)
        this.scene.tweens.add({
            targets: this,
            glowAlpha: { from: 0.3, to: 1 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            onUpdate: () => { if (this.isVisible) this.drawConnections(); }
        });
        
        // Borda Negra
        const border = this.scene.add.rectangle(panelX, panelY, width, height)
            .setStrokeStyle(2, 0x000000);

        this.elements.push(bg, border, titleText, pointsText);
        this.elements.forEach(el => el.setScrollFactor(0).setDepth(10010));
        this.elements.forEach(el => el.setVisible(false));
    }

    createTalentBranch(branchX, startY, title, talentData, availablePoints) {
        const talentPositions = {}; // Armazena as posições {x, y} de cada talento pelo ID

        // Título da Árvore
        const branchTitle = this.scene.add.text(branchX, startY - 40, title, {
            fontSize: '16px', color: '#2c352c', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.elements.push(branchTitle);

        // --- 1. Desenhar Caixas e Textos (para pegar as posições) ---
        const talentSize = 45; // Reduzido de 70
        const tierGap = 75; // Reduzido de 100

        talentData.forEach(talent => {
            const y = startY + (talent.tier - 1) * tierGap;
            let x = branchX;
            // Lógica de ramificação baseada no ID (termina em 'a' vai pra esquerda, 'b' pra direita, 'c' centro)
            if (talent.id.endsWith('a')) x -= 60;
            if (talent.id.endsWith('b')) x += 60;
            // 'c' ou outros ficam no centro (x original)

            talentPositions[talent.id] = { x, y };

            // Verifica Estado
            const isUnlocked = this.scene.teamLevelManager.talents.includes(talent.id);
            
            // Verifica se o pai está desbloqueado
            let parentUnlocked = true;
            if (talent.parent) {
                const parents = Array.isArray(talent.parent) ? talent.parent : [talent.parent];
                parentUnlocked = parents.some(pid => this.scene.teamLevelManager.talents.includes(pid));
            }

            const canUnlock = !isUnlocked && parentUnlocked && availablePoints > 0;

            // Cores
            let bgColor = 0x222222; // Locked
            let strokeColor = 0x555555;
            let textColor = '#ffffff';

            if (isUnlocked) {
                bgColor = 0x444400; // Unlocked
                strokeColor = 0xffff00;
                textColor = '#ffffff';
            } else if (canUnlock) {
                strokeColor = 0xaaaaaa; // Disponível
                textColor = '#ffffff';
            }

            if (talent.isFinal) {
                bgColor = 0x330000; // Final (Locked)
                strokeColor = 0xff0000;
                textColor = '#ffffff';
                if (isUnlocked) {
                    bgColor = 0x880000; // Final (Unlocked)
                    textColor = '#ffffff';
                }
            }

            const box = this.scene.add.rectangle(x, y, talentSize, talentSize, bgColor)
                .setStrokeStyle(2, strokeColor)
                .setInteractive({ useHandCursor: true });

            if (isUnlocked) {
                this.unlockedBoxes.push(box);
                box.isFinal = talent.isFinal; // Marca para saber a cor do pulso
            }

            let content;
            if (talent.icon && this.scene.textures.exists(talent.icon)) {
                content = this.scene.add.image(x, y, talent.icon)
                    .setDisplaySize(talentSize - 10, talentSize - 10);
                
                if (!isUnlocked) {
                    content.setTint(0x555555); // Escurece se não desbloqueado
                } else {
                    content.clearTint();
                }
            } else {
                content = this.scene.add.text(x, y, talent.label, {
                    fontSize: '9px', color: textColor, align: 'center', fontStyle: 'bold',
                    stroke: '#000000', strokeThickness: 2
                }).setOrigin(0.5);
            }

            // Tooltip
            box.on('pointerover', () => {
                this.showTooltip(talent.desc);
                box.setStrokeStyle(3, 0xffffff);
            });
            box.on('pointerout', () => {
                this.hideTooltip();
                box.setStrokeStyle(2, strokeColor);
            });

            // Clique para desbloquear
            box.on('pointerdown', () => {
                if (canUnlock) {
                    this.scene.teamLevelManager.talents.push(talent.id);
                    this.scene.teamLevelManager.saveStats();
                    this.destroyAndRecreate(); // Recria o painel para atualizar tudo
                }
            });

            this.elements.push(box, content);
        });

        // --- 2. Desenhar Linhas de Conexão ---
        talentData.forEach(talent => {
            if (talent.parent) {
                const childPos = talentPositions[talent.id];
                const parents = Array.isArray(talent.parent) ? talent.parent : [talent.parent];
                const isUnlocked = this.scene.teamLevelManager.talents.includes(talent.id);
                
                parents.forEach(parentId => {
                    const parentPos = talentPositions[parentId];
                    if (parentPos && childPos) {
                        // Armazena conexão para desenhar no update/tween
                        // A linha brilha se o talento filho estiver desbloqueado (caminho ativo)
                        this.connections.push({
                            x1: parentPos.x,
                            y1: parentPos.y + talentSize / 2,
                            x2: childPos.x,
                            y2: childPos.y - talentSize / 2,
                            unlocked: isUnlocked
                        });
                    }
                });
            }
        });
    }

    drawConnections() {
        if (!this.linesGraphics) return;
        this.linesGraphics.clear();
        
        this.connections.forEach(conn => {
            if (conn.unlocked) {
                this.linesGraphics.lineStyle(4, 0xffff00, this.glowAlpha * 0.6); // Brilho externo
                this.linesGraphics.lineBetween(conn.x1, conn.y1, conn.x2, conn.y2);
                this.linesGraphics.lineStyle(2, 0xffffff, 1); // Núcleo branco
                this.linesGraphics.lineBetween(conn.x1, conn.y1, conn.x2, conn.y2);
            } else {
                this.linesGraphics.lineStyle(3, 0x555555, 0.8); // Linha cinza estática
                this.linesGraphics.lineBetween(conn.x1, conn.y1, conn.x2, conn.y2);
            }
        });

        // Atualiza pulso das caixas desbloqueadas
        this.unlockedBoxes.forEach(box => {
            const baseColor = box.isFinal ? 0xff0000 : 0xffff00;
            // Pulsa a borda
            box.setStrokeStyle(2 + this.glowAlpha * 2, baseColor, 0.8 + this.glowAlpha * 0.2);
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;
        const isVisible = this.isVisible;

        if (isVisible) {
            this.updateContent();
        }

        // Garante que o tooltip comece escondido ao abrir o painel
        if (this.tooltip) {
            this.tooltip.setVisible(false);
        }
        
        this.elements.forEach(el => el.setVisible(isVisible));
        
        return isVisible;
    }

    destroy() {
        this.scene.tweens.killTweensOf(this);
        this.elements.forEach(el => el.destroy());
        this.elements = [];
        if (this.tooltip) {
            this.tooltip.destroy();
            this.tooltip = null;
        }
    }

    destroyAndRecreate() {
        const wasVisible = this.isVisible;
        this.destroy();
        this.create();
        if (wasVisible) {
            // Força o toggle a reabrir o painel e atualizar seu conteúdo
            this.isVisible = false;
            this.toggle();
        }
    }

    update() {
        // Este método agora é chamado mesmo com o jogo pausado, para que a lógica de UI funcione.
        if (this.isVisible && this.tooltip && this.tooltip.visible) {
            // Atualiza posição do tooltip para seguir o mouse
            const pointer = this.scene.input.activePointer;
            this.tooltip.setPosition(pointer.x + 15, pointer.y + 15);
        }
    }

    updateContent() {
        // Este painel agora é estático, não precisa ser atualizado com a seleção da unidade.
    }

    showTooltip(text) {
        if (this.tooltipText && this.tooltipBg) {
            this.tooltipText.setText(text);
            // Ajusta o tamanho do fundo baseado no texto
            const width = this.tooltipText.width + 20;
            const height = this.tooltipText.height + 20;
            this.tooltipBg.setSize(width, height);
            
            this.tooltip.setVisible(true);
        }
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.setVisible(false);
        }
    }
}