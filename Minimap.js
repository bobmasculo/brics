export default class Minimap {
    constructor(scene, players, npcManager) {
        this.scene = scene;
        this.players = players;
        this.npcManager = npcManager;
        this.visible = true;
        this.wavePhase = 0; // Controla o ciclo da animação da onda
    }

    create() {
        // Configurações do Radar
        this.radarSize = 150; // Tamanho do lado do quadrado (Aumentado)
        
        // Posição no canto superior direito (com margem)
        this.radarX = this.scene.scale.width - (this.radarSize / 2) - 20;
        this.radarY = (this.radarSize / 2) + 20;
        
        // Container para agrupar todos os elementos do radar e facilitar o toggle
        this.container = this.scene.add.container(this.radarX, this.radarY).setScrollFactor(0).setDepth(9000);

        // 1. Fundo do Radar (Quadrado Escuro com borda verde)
        this.bg = this.scene.add.graphics();
        this.bg.fillStyle(0x000000, 0.6); // Fundo preto semitransparente
        // Desenha o quadrado centralizado no container
        this.bg.fillRect(-this.radarSize / 2, -this.radarSize / 2, this.radarSize, this.radarSize);
        this.bg.lineStyle(2, 0x00ff00, 1); // Borda verde neon
        this.bg.strokeRect(-this.radarSize / 2, -this.radarSize / 2, this.radarSize, this.radarSize);
        this.container.add(this.bg);

        // 2. Efeito de Onda (Radar Pulse Circular)
        this.wave = this.scene.add.graphics();
        this.container.add(this.wave);
        

        // 3. Elemento gráfico para os pontos (blips)
        this.blips = this.scene.add.graphics();
        this.container.add(this.blips);
    }

    update() {
        if (!this.visible) return;

        // --- Atualiza a Animação de Onda (Agora individual por alvo) ---

        let totalX = 0;
        let totalY = 0;
        let aliveCount = 0;

        this.players.forEach(p => {
            if (p.health > 0 && p.sprite && p.sprite.active) {
                totalX += p.x;
                totalY += p.y;
                aliveCount++;
            }
        });

        const cam = this.scene.cameras.main;
        const centerX = (aliveCount > 0) ? (totalX / aliveCount) : cam.worldView.centerX;
        const centerY = (aliveCount > 0) ? (totalY / aliveCount) : cam.worldView.centerY;

        // 2. Define o Zoom: Quanto do mundo cabe no radar?
        const viewRange = 2500; 
        const scale = this.radarSize / viewRange;

        // Determina quais IDs devem receber o efeito de destaque (Alvo)
        // Modo Normal: NPCs de Informação
        // Modo Agressivo: Alvos da Missão (Inimigos)
        const isInstanceMode = this.scene.informationManager ? this.scene.informationManager.isInstanceMode : false;
        let targetIds = [];

        if (isInstanceMode) {
            if (this.scene.missionManager) {
                targetIds = this.scene.missionManager.getActiveTargets();
            }
        } else {
            if (this.scene.informationManager && this.scene.informationManager.infoNpcs) {
                targetIds = this.scene.informationManager.infoNpcs.map(n => n.id);
            }
        }

        // --- Atualiza a Animação de Onda (Pulsos nos Alvos) ---
        this.wave.clear();
        
        const drawWaveEffect = (npc) => {
            // Calcula distância e velocidade do pulso
            const dist = Phaser.Math.Distance.Between(npc.x, npc.y, centerX, centerY);
            const maxDist = 100; // Distância onde o pulso começa a acelerar
            const minSpeed = 0.0195; // ~3 segundos (Longe)
            const maxSpeed = 0.016; // ~1 segundo (Perto)
            
            // Fator de proximidade (0 = longe, 1 = perto)
            const proximity = 1 - Phaser.Math.Clamp(dist / maxDist, 0, 1);
            const speed = minSpeed + (maxSpeed - minSpeed) * proximity;

            // Atualiza fase individual do NPC
            if (npc._radarPhase === undefined) npc._radarPhase = Math.random(); // Começo aleatório
            npc._radarPhase += speed;
            if (npc._radarPhase > 1) npc._radarPhase = 0;

            const dx = (npc.x - centerX) * scale;
            const dy = (npc.y - centerY) * scale;
            
            // Verifica se está dentro do radar
            const limit = (this.radarSize / 2);
            if (Math.abs(dx) <= limit && Math.abs(dy) <= limit) {
                const maxPulseRadius = 40; // Tamanho do pulso
                const currentRadius = maxPulseRadius * npc._radarPhase;
                const alpha = 1 - npc._radarPhase;
                
                this.wave.lineStyle(2, 0xffffff, alpha); // Branco para alvos
                this.wave.strokeCircle(dx, dy, currentRadius);
            }
        };

        // Aplica efeito de onda em NPCs de Combate
        if (this.npcManager && this.npcManager.npcs) {
            this.npcManager.npcs.forEach(npc => {
                if (npc.active && !npc.isDead && targetIds.includes(npc.id)) {
                    drawWaveEffect(npc);
                }
            });
        }

        // Aplica efeito de onda em NPCs de Informação
        if (this.scene.informationManager && this.scene.informationManager.infoNpcs) {
            this.scene.informationManager.infoNpcs.forEach(npc => {
                if (npc.active && targetIds.includes(npc.id)) {
                    drawWaveEffect(npc);
                }
            });
        }

        // --- Atualiza os Pontos (Blips) ---
        this.blips.clear();

        // Função auxiliar para desenhar pontos apenas se estiverem dentro do radar
        const drawBlip = (x, y, color, radius = 3) => {
            // Calcula a posição relativa ao centro da câmera
            const dx = (x - centerX) * scale;
            const dy = (y - centerY) * scale;

            // Verifica se o ponto está dentro do quadrado do radar (Clipping)
            // Subtraímos uma margem para garantir que o ponto não toque a borda
            const limit = (this.radarSize / 2) - (radius + 1);
            
            if (Math.abs(dx) <= limit && Math.abs(dy) <= limit) {
                this.blips.fillStyle(color, 1);
                this.blips.fillCircle(dx, dy, radius);
            }
        };

        // Função auxiliar para desenhar triângulo (Quest Target)
        const drawTriangleBlip = (x, y, color, size = 6) => {
            const dx = (x - centerX) * scale;
            const dy = (y - centerY) * scale;
            const limit = (this.radarSize / 2) - (size + 1);
            
            if (Math.abs(dx) <= limit && Math.abs(dy) <= limit) {
                const time = this.scene.time.now;

                // Onda de radar pulsante (Círculo expandindo)
                const waveProgress = (time % 1500) / 1500; // Ciclo de 1.5 segundos
                const waveRadius = size + (size * 2 * waveProgress); // Expande até 3x o tamanho
                const waveAlpha = 1 - waveProgress; // Desaparece conforme expande

                this.blips.lineStyle(1, color, waveAlpha);
                this.blips.strokeCircle(dx, dy, waveRadius);

                // Efeito de piscar (Blink) para chamar atenção
                const alpha = 0.3 + 0.7 * Math.abs(Math.sin(time / 200));
                this.blips.fillStyle(color, alpha);
                // Triângulo apontando para baixo
                this.blips.fillTriangle(dx - size, dy - size, dx + size, dy - size, dx, dy + size);
            }
        };

        // Desenha Jogadores (Verde)
        this.players.forEach(p => {
            // Verifica se o sprite existe e está ativo
            if (p.sprite && p.sprite.active && p.health > 0) {
                drawBlip(p.x, p.y, this.scene.getEntityColor('player'));
            }
        });

        // Desenha NPCs de Combate (Vermelho = Inimigo, Amarelo = Civil)
        if (this.npcManager && this.npcManager.npcs) {
            this.npcManager.npcs.forEach(npc => {
                if (npc.active && !npc.isDead) {
                    // Se for alvo da missão (tem a seta visível), desenha triângulo
                    if (npc.objectiveMarker && npc.objectiveMarker.visible) {
                        drawTriangleBlip(npc.x, npc.y, this.scene.getEntityColor('enemy'), 6);
                    } else {
                        let color = npc.isCivilian ? this.scene.getEntityColor('civilian') : this.scene.getEntityColor('enemy');
                        if (targetIds.includes(npc.id)) color = 0xffffff; // Branco se for alvo do radar
                        drawBlip(npc.x, npc.y, color);
                    }
                }
            });
        }

        // Desenha NPCs de Informação (Ciano = Info)
        if (this.scene.informationManager && this.scene.informationManager.infoNpcs) {
            this.scene.informationManager.infoNpcs.forEach(npc => {
                if (npc.active) {
                    // Se for alvo da missão (tem a seta visível), desenha triângulo
                    if (npc.objectiveMarker && npc.objectiveMarker.visible) {
                        drawTriangleBlip(npc.x, npc.y, this.scene.getEntityColor('civilian'), 6);
                    } else {
                        let color = 0x00ffff; // Ciano padrão
                        if (targetIds.includes(npc.id)) color = 0xffffff; // Branco se for alvo do radar
                        drawBlip(npc.x, npc.y, color);
                    }
                }
            });
        }

        // --- OBJETIVOS DA MISSÃO (Azul quando próximo) ---
        // Usa a configuração do MissionManager que é mais confiável
        if (this.scene.missionManager && this.scene.missionManager.config) {
            const objs = this.scene.missionManager.config;
            const proximity = 500; // Distância para aparecer no radar

            // Função auxiliar para verificar se ALGUM jogador vivo está perto do alvo
            const isPlayerClose = (tx, ty) => {
                return this.players.some(p => 
                    p.sprite && p.sprite.active && p.health > 0 &&
                    Phaser.Math.Distance.Between(p.x, p.y, tx, ty) <= proximity
                );
            };

            // Ponto de Extração
            if (objs.extractionPoint) {
                if (isPlayerClose(objs.extractionPoint.x, objs.extractionPoint.y)) {
                    drawBlip(objs.extractionPoint.x, objs.extractionPoint.y, 0x00ffff, 6); // Ciano (Mais visível), maior (6px)
                }
            }

            // Ponto de Bomba
            if (objs.bombingPoint) {
                const isBombed = this.scene.missionManager && this.scene.missionManager.bombingMet;
                if (!isBombed && isPlayerClose(objs.bombingPoint.x, objs.bombingPoint.y)) {
                    drawBlip(objs.bombingPoint.x, objs.bombingPoint.y, 0x00ffff, 6); // Ciano, maior (6px)
                }
            }
        }
    }

    toggle() {
        this.visible = !this.visible;
        this.container.setVisible(this.visible);
        return this.visible;
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
        }
        this.container = null;
        this.bg = null;
        this.wave = null;
        this.blips = null;
    }

    destroyAndRecreate() {
        this.destroy();
        this.create();
        // Restaura o estado de visibilidade anterior (this.visible não é alterado por destroy/create)
        if (this.container) this.container.setVisible(this.visible);
    }
}
