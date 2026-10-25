export default class MissionManager {
    constructor(scene) {
        this.scene = scene;
        this.config = {};

        this.kills = 0;
        this.killedTargets = []; // Rastreia quais alvos específicos morreram
        this.civilianKills = 0; // Contador de civis mortos
        this.punishmentTriggeredCount = 0; // Contador de punições acionadas (Civis + Torres)
        this.bombingMet = false; // Rastreia se a bomba foi plantada
        this.extractionMet = false; // Rastreia se chegou na extração
        this.talkedNpcs = []; // Rastreia IDs de NPCs com quem já falou
        this.returnedToNpc = false; // Rastreia se retornou ao NPC final
        this.startTime = 0;

        this.shotsFired = 0;
        this.shotsHit = 0;
        this.damageDealt = 0;

        // Controle de Chain Quests
        this.currentStep = 0;
        this.stepState = { talked: false, bombing: false, extraction: false, startKills: 0, survivalMet: false, stepStartTime: 0, lastRespawnTime: 0 };

        this.isGameOver = false;

        // Elementos de UI
        this.timerText = null;
        this.objectiveText = null;
        this.objectivesBg = null; // Fundo da caixa de objetivos
        this.objectivesContainer = null; // Container principal
        this.oneMinuteWarningShown = false; // Controle para o aviso de 1 minuto
        this.showTimerGlow = true; // Glow do timer ligado por padrão

        // Barra de Sobrevivência
        this.survivalBarBg = null;
        this.survivalBarFill = null;
        this.survivalText = null;
        this.sparksEmitter = null; // Emissor de partículas para efeitos
        this.visualTimerState = null; // Estado do timer visual persistente
    }

    create() {
        // Lê a configuração e reseta o estado (importante para o restart da cena)
        const configSource = window.missionConfig || window.gameConfig || {};
        this.config = configSource.OBJECTIVES || {};

        this.kills = 0;
        this.killedTargets = [];
        this.bombingMet = false;
        this.civilianKills = 0;
        this.punishmentTriggeredCount = 0;
        this.extractionMet = false;
        this.talkedNpcs = [];
        this.returnedToNpc = false;
        this.isGameOver = false;

        this.shotsFired = 0;
        this.shotsHit = 0;
        this.damageDealt = 0;

        this.currentStep = 0;
        this.objectiveDisplayMode = 1; // 0: Oculto, 1: Padrão (Caixa), 2: Texto (Sem Caixa)
        this.loadPreferences(); // Carrega preferência salva
        this.stepState = { talked: false, bombing: false, extraction: false, startKills: 0, survivalMet: false, stepStartTime: 0, lastRespawnTime: 0, visualTimerStarted: false };
        this.visualTimerState = null;

        // Relógio de jogo ativo (só avança no update, que não roda com o jogo pausado/diálogos abertos)
        this.activeTime = 0;
        this.startTime = 0;
        this.oneMinuteWarningShown = false;

        // Carrega preferência de glow do timer
        const savedGlow = localStorage.getItem('brics_timer_glow');
        if (savedGlow !== null) {
            this.showTimerGlow = (savedGlow === 'true');
        }

        if (!this.config) return;


        // 1. Timer (Mantém no topo, centralizado e maior)
        const timerStyle = { fontSize: '24px', fontFamily: 'Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 4, align: 'center', fontStyle: 'bold' };
        this.timerText = this.scene.add.text(this.scene.scale.width / 2, 10, '', timerStyle)
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(10000);

        if (this.showTimerGlow) {
            this.timerText.setShadow(0, 0, '#ffffff', 8, true, true);
            this.timerText.setColor('#ffff00');
        }

        // 2. Caixa de Objetivos (À Esquerda)
        const boxX = 5;
        const boxY = 5;
        const boxWidth = 484; // Aumentado para dar mais espaço ao texto (320 + 20%)
        const startX = -350; // Posição inicial fora da tela (esquerda)
        
        this.objectivesContainer = this.scene.add.container(startX, boxY).setScrollFactor(0).setDepth(10000);

        // Fundo semitransparente (inicia em startX)
        this.objectivesBg = this.scene.add.rectangle(0, 0, boxWidth, 100, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0x800080, 0.8); // Borda ROXA (Purple)
        
        this.objectivesContainer.add(this.objectivesBg);

        this.updateUI();

        // Animação de Slide In (Entrada deslizante)
        this.scene.tweens.add({
            targets: this.objectivesContainer,
            x: boxX,
            duration: 1000,
            ease: 'Power2', // Movimento suave (começa rápido, termina devagar)
            delay: 500      // Espera meio segundo antes de entrar
        });

        // 3. Barra de Sobrevivência (Topo, abaixo do timer principal)
        const barWidth = 300;
        const barHeight = 24;
        const barX = this.scene.scale.width / 2;
        const barY = 50; // Abaixo do timer principal (y=10)

        this.survivalBarBg = this.scene.add.rectangle(barX, barY, barWidth, barHeight, 0x000000)
            .setOrigin(0.5).setScrollFactor(0).setDepth(10000).setStrokeStyle(2, 0xffffff).setVisible(false);

        // Preenchimento (começa cheio)
        this.survivalBarFill = this.scene.add.rectangle(barX - barWidth / 2 + 2, barY, 0, barHeight - 4, 0x00ff00)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(10000).setVisible(false);

        this.survivalText = this.scene.add.text(barX, barY, '', {
            fontSize: '16px', fontFamily: 'Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(10001).setVisible(false);

        // --- EFEITO DE FAÍSCAS (Inicialização) ---
        if (!this.scene.textures.exists('spark_particle')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffff00, 1);
            graphics.fillCircle(2, 2, 2);
            graphics.generateTexture('spark_particle', 4, 4);
        }
        this.sparksEmitter = this.scene.add.particles(0, 0, 'spark_particle', {
            lifespan: 500,
            speed: { min: 100, max: 300 },
            scale: { start: 1, end: 0 },
            quantity: 2,
            emitting: false
        });
        this.sparksEmitter.setDepth(5000);


        // Visualização do Ponto de Extração no mapa
        if (this.config.extractionPoint) {
            this.createExtractionZone();
        }

        // Visualização do Ponto de Bomba no mapa
        if (this.config.bombingPoint) {
            this.createBombingZone();
        }

        // Se houver steps, inicializa o estado do primeiro passo
        if (this.config.steps && this.config.steps.length > 0) {
            this.stepState.startKills = 0;
            // Atualiza a UI imediatamente para mostrar o primeiro passo
            this.updateUI();

            // Verifica se o primeiro passo já tem spawn de NPCs
            const firstStep = this.config.steps[0];
            if (firstStep.spawnNpcs && this.scene.npcManager) {
                this.scene.npcManager.spawnNpcs(firstStep.spawnNpcs);
            }

            // Toca o som do primeiro passo, se houver
            if (firstStep.sound && this.scene.soundManager) {
                this.scene.soundManager.play(firstStep.sound, { type: 'quest' });
            }
        }

        // Exibe o briefing da missão se configurado (Diálogo inicial)
        if (this.config.briefing) {
            const briefingText = (typeof this.config.briefing === 'string') ? this.config.briefing : this.config.briefing.text;
            const briefingSound = (typeof this.config.briefing === 'object') ? this.config.briefing.sound : null;

            // Mostra o diálogo
            if (briefingText && this.scene.informationManager && this.scene.languageManager) {
                const translatedBriefing = this.scene.languageManager.get(briefingText);
                this.scene.informationManager.showDialog(translatedBriefing);
            }
            // Toca o som do briefing
            if (briefingSound && this.scene.soundManager) {
                this.scene.soundManager.play(briefingSound, { type: 'quest' });
            }
        }
    }

    update(time, delta) {
        if (this.isGameOver || !this.config) return;

        // Usa o tempo ativo em vez do relógio da cena: pausa, mapa, ajuda e diálogos não consomem o tempo da missão
        this.activeTime = (this.activeTime || 0) + delta;
        time = this.activeTime;

        // 1. Verificar Tempo Limite
        if (this.config.timeLimit) {
            const elapsed = time - this.startTime;
            const remaining = this.config.timeLimit - elapsed;

            this.updateTimerUI(remaining);

            // Aviso de 1 minuto (60000 ms)
            if (remaining <= 60000 && remaining > 0 && !this.oneMinuteWarningShown) {
                this.oneMinuteWarningShown = true;
                this.scene.showWarning(this.scene.languageManager.get('warning_one_minute_left'));
                if (this.scene.soundManager) this.scene.soundManager.playAlert();
            }

            if (remaining <= 0) {
                this.failMission(this.scene.languageManager.get('fail_reason_time_out'));
            }
        }

        // 2. Verificar se Todos os Jogadores Morreram
        // Filtra jogadores que têm vida > 0
        if (this.scene.players && this.scene.players.length > 0) {
            const alivePlayers = this.scene.players.filter(p => p.health > 0);

            // Se havia jogadores no início e agora não tem nenhum vivo
            if (alivePlayers.length === 0) {
                this.failMission(this.scene.languageManager.get('fail_reason_squad_eliminated'));
            }
        }

        // 3. Verificar Ponto de Extração
        const currentObj = this.config.steps ? this.config.steps[this.currentStep] : this.config;
        if (currentObj && currentObj.extractionPoint) {
            this.checkExtraction(currentObj.extractionPoint);
        } else if (this.config.extractionPoint && !this.config.steps) {
            // Fallback para extração global (modo clássico)
            this.checkExtraction(this.config.extractionPoint);
        }

        // 4. Verificar Survival Time (Chain Quest)
        if (this.config.steps) {
            const currentObj = this.config.steps[this.currentStep];

            // --- VISUAL TIMER (Persistente, não bloqueante) ---
            if (currentObj && currentObj.visualTimer && !this.stepState.visualTimerStarted) {
                this.visualTimerState = {
                    remaining: currentObj.visualTimer,
                    total: currentObj.visualTimer,
                    label: currentObj.timerLabel || "TEMPO"
                };
                this.stepState.visualTimerStarted = true;
            }

            // Atualiza o Visual Timer Global
            if (this.visualTimerState) {
                this.visualTimerState.remaining -= delta;
                if (this.visualTimerState.remaining <= 0) {
                    this.visualTimerState = null;
                }
            }

            const isSurvival = currentObj && currentObj.survivalTime;

            if (isSurvival && !this.stepState.survivalMet) {
                // Inicializa o tempo de início do passo se ainda não foi definido
                if (!this.stepState.stepStartTime) {
                    this.stepState.stepStartTime = time;
                    this.stepState.lastRespawnTime = time;
                }

                const elapsed = time - this.stepState.stepStartTime;
                const remaining = Math.max(0, currentObj.survivalTime - elapsed);

                if (!currentObj.hideTimer) {
                    this.updateSurvivalBar(remaining, currentObj.survivalTime, currentObj.timerLabel);
                } else if (this.visualTimerState) {
                    // Se o timer da missão está oculto, mostra o timer visual persistente se houver
                    this.updateSurvivalBar(this.visualTimerState.remaining, this.visualTimerState.total, this.visualTimerState.label);
                }

                // Efeito de Faíscas durante o timer
                if (currentObj.effect === 'sparks' && currentObj.effectPosition) {
                    this.sparksEmitter.setPosition(currentObj.effectPosition.x, currentObj.effectPosition.y);
                    if (!this.sparksEmitter.emitting) this.sparksEmitter.start();
                } else {
                    if (this.sparksEmitter.emitting) this.sparksEmitter.stop();
                }

                // Lógica de Respawn Periódico
                if (currentObj.respawnInterval && currentObj.spawnNpcs && currentObj.spawnNpcs.length > 0) {
                    if (time - this.stepState.lastRespawnTime >= currentObj.respawnInterval) {
                        this.stepState.lastRespawnTime = time;
                        if (this.scene.npcManager) {
                            this.scene.npcManager.spawnNpcs(currentObj.spawnNpcs);
                            if (this.scene.uiManager) this.scene.uiManager.updateStatus(this.scene.languageManager.get('status_enemy_reinforcements'));
                        }
                    }
                }

                if (elapsed >= currentObj.survivalTime) {
                    this.stepState.survivalMet = true;
                    // Verifica se os NPCs devem ser mantidos vivos após o tempo
                    if (currentObj.keepNpcsAliveAfterSurvival !== true) {
                        this.killStepNpcs(currentObj);
                    }
                    this.checkWinCondition();
                }
            } else {
                // Se não estiver em um passo de sobrevivência ativo, desenha o visual timer se existir
                if (this.visualTimerState) {
                    this.updateSurvivalBar(this.visualTimerState.remaining, this.visualTimerState.total, this.visualTimerState.label);
                } else {
                    this.hideSurvivalBar();
                }

                if (this.sparksEmitter && this.sparksEmitter.emitting) this.sparksEmitter.stop();
            }
        }

        // 3. Verificar Condições de Vitória
        this.checkWinCondition();
    }

    onEnemyKilled(npc, killer = null) {
        if (this.isGameOver) return;

        // Se não for civil, conta como abate e dá XP
        if (!npc.isCivilian) {
            this.kills++;
            
            // --- Mecânica de Insanidade ---
            // Ganha insanidade ao matar.
            if (killer && killer.gainInsanity) {
                // 2% por kill normal
                killer.gainInsanity(2);
            }

            // --- XP por Abate ---
            let teamXp = 25; // TESTE: Aumentado para garantir Level Up (Base é 500)
            let totalXp = 150; // XP total pelo abate

            if (npc.isTarget) {
                teamXp = 75;
                totalXp = 250;
            }

            // --- Nova Lógica de Distribuição de XP ---
            const distributionRatio = window.gameConfig.XP_DISTRIBUTION_RATIO !== undefined ? window.gameConfig.XP_DISTRIBUTION_RATIO : 0;
            const livingPlayers = this.scene.players.filter(p => p.health > 0);

            if (livingPlayers.length > 0) {
                const sharedXp = totalXp * distributionRatio;
                const killerBonusXp = totalXp * (1 - distributionRatio);

                const xpPerPlayer = sharedXp / livingPlayers.length;

                // Distribui o XP para todos os jogadores vivos
                livingPlayers.forEach(player => {
                    if (player.gainXp) {
                        let xpGained = Math.floor(xpPerPlayer);
                        let text = `+${xpGained} XP`;
                        let color = '#00ffff'; // Cor para XP compartilhado

                        // Se for quem matou, adiciona o bônus
                        if (player === killer) {
                            const bonus = Math.floor(killerBonusXp);
                            xpGained += bonus;
                            text = `+${xpGained} XP`;
                            color = '#ffff00'; // Cor dourada para o killer
                        }

                        if (xpGained > 0) {
                            player.gainXp(xpGained);
                            this.showFloatingText(player.x, player.y - 40, text, color);
                        }
                    }
                });
            }

        }

        // Se for civil OU tiver a flag de punição, aciona a punição
        if (npc.isCivilian || npc.triggersPunishment) {
            this.punishmentTriggeredCount++; // Incrementa o contador de punições

            if (npc.isCivilian) {
                this.civilianKills++;

                // --- Mecânica de Insanidade (Civil) ---
                if (killer && killer.gainInsanity) {
                    // 15% por matar civil (Punição alta)
                    killer.gainInsanity(15);
                }

                // Penalidade financeira por matar civil
                if (this.scene.teamLevelManager) {
                    this.scene.teamLevelManager.gainMoney(-300);
                    this.showFloatingText(npc.x, npc.y - 60, "-300 B$", '#ff0000');
                }

                // Mecânica de Fator de Perigosidade
                if (this.config.dangerFactor) {
                    // Aumenta a visão de todos os inimigos vivos
                    if (this.scene.npcManager && this.scene.npcManager.npcs) {
                        this.scene.npcManager.npcs.forEach(n => {
                            if (n.active && !n.isCivilian) {
                                n.visionRadius += this.config.dangerFactor;
                                if (n.baseVisionRadius) {
                                    n.baseVisionRadius += this.config.dangerFactor; // Mantém o base sincronizado
                                }
                            }
                        });
                    }

                    this.scene.showWarning(this.scene.languageManager.get('warning_npcs_more_aggressive'));
                    if (this.scene.soundManager) {
                        this.scene.soundManager.playAlert();
                    }
                }

            }
            this.triggerPunishment(killer);
        }

        // Verifica se o NPC morto é o alvo da missão de assassinato
        const targets = this.getTargets();
        if (targets.length > 0 && npc && npc.id) {
            if (targets.includes(npc.id)) {
                if (!this.killedTargets.includes(npc.id)) {
                    this.killedTargets.push(npc.id);
                }
            }
        }

        // Lógica de Desbloqueio: Se o NPC morto desbloqueia outro (ex: Boss -> Torre)
        if (npc.unlocks && this.scene.npcManager) {
            this.scene.npcManager.setVulnerable(npc.unlocks);
        }

        this.updateUI();
        this.checkWinCondition();
    }

    triggerPunishment(killer) {
        console.log('matou');
        if (!this.config.punishments) return;

        // Tenta pegar a punição específica para a quantidade atual de mortes
        let punishmentList = this.config.punishments[this.punishmentTriggeredCount];

        // Se não houver específica, usa o default (se existir)
        if (!punishmentList && this.config.punishments['default']) {
            punishmentList = this.config.punishments['default'];
        }

        if (punishmentList && Array.isArray(punishmentList)) {
            // Define o ponto de origem (perto do assassino ou centro da tela)
            let originX, originY;
            if (killer) {
                originX = killer.x;
                originY = killer.y;
            } else {
                const cam = this.scene.cameras.main;
                originX = cam.scrollX + cam.width / 2;
                originY = cam.scrollY + cam.height / 2;
            }

            // Prepara a lista de NPCs para spawnar, adicionando posições
            const npcsToSpawn = punishmentList.map(config => {
                let spawnX, spawnY;
                let attempts = 0;
                let valid = false;

                // Tenta encontrar uma posição válida (fora de obstáculos) até 15 vezes
                while (!valid && attempts < 15) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 300 + Math.random() * 200;
                    spawnX = originX + Math.cos(angle) * distance;
                    spawnY = originY + Math.sin(angle) * distance;

                    if (!this.isPointInObstacles(spawnX, spawnY)) {
                        valid = true;
                    }
                    attempts++;
                }

                return {
                    ...config,
                    x: spawnX,
                    y: spawnY,
                    id: `punisher_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    isImmovable: false,
                    isProvoked: true // Força a perseguição imediata
                };
            });

            if (this.scene.npcManager) {
                this.scene.npcManager.spawnNpcs(npcsToSpawn);
                this.scene.showWarning(this.scene.languageManager.get('warning_alert_level_reinforcements', { level: this.punishmentTriggeredCount }));
                if (this.scene.soundManager) this.scene.soundManager.playAlert();
            }
        }
    }

    // Verifica se um ponto (x, y) está dentro de algum obstáculo (cenário, interiores ou limites)
    isPointInObstacles(x, y) {
        const groups = [];
        if (this.scene.scenarioManager && this.scene.scenarioManager.getObstacles) groups.push(this.scene.scenarioManager.getObstacles());
        if (this.scene.interiorsManager && this.scene.interiorsManager.getObstacles) groups.push(this.scene.interiorsManager.getObstacles());
        if (this.scene.mapBoundaries) groups.push(this.scene.mapBoundaries);

        for (const group of groups) {
            if (!group) continue;
            const children = group.getChildren();
            for (const child of children) {
                if (!child.active) continue;

                // Prioriza verificação via corpo físico (hitTest) se existir
                if (child.body) {
                    if (child.body.hitTest(x, y)) return true;
                }
                // Fallback para limites visuais (getBounds)
                else if (child.getBounds) {
                    if (child.getBounds().contains(x, y)) return true;
                }
            }
        }
        return false;
    }

    onNpcTalked(npcId) {
        if (this.isGameOver) return;

        // Lógica para Chain Quests (Steps)
        if (this.config.steps) {
            const currentObj = this.config.steps[this.currentStep];
            if (currentObj && currentObj.talkToNpc === npcId) {
                this.stepState.talked = true;
                this.updateUI();
                this.checkWinCondition();
                return;
            }
        }

        // Objetivo 1: Falar com NPC para pegar info (talkToNpc: 'id')
        if (this.config.talkToNpc && this.config.talkToNpc === npcId) {
            if (!this.talkedNpcs.includes(npcId)) {
                this.talkedNpcs.push(npcId);
                this.updateUI();
                this.checkWinCondition();
            }
        }

        // Objetivo 2: Retornar ao NPC para finalizar (returnToNpc: 'id')
        if (this.config.returnToNpc && this.config.returnToNpc === npcId) {
            // Só conta se todos os OUTROS objetivos principais já foram cumpridos
            if (this.arePrimaryObjectivesMet()) {
                this.returnedToNpc = true;
                this.updateUI();
                this.checkWinCondition();
            } else {
                // Feedback se o jogador tentar finalizar antes da hora
                if (this.scene.uiManager) {
                    this.scene.uiManager.updateStatus(this.scene.languageManager.get('status_complete_objectives_first'));
                }
            }
        }
    }

    tryPlantBomb(player) {
        // Verifica se o objetivo atual requer bomba
        const currentObj = this.config.steps ? this.config.steps[this.currentStep] : this.config;

        if (this.config.steps && this.stepState.bombing) return false; // Já plantou neste passo
        if (!this.config.steps && this.bombingMet) return false; // Já completou (modo clássico)

        // Usa o ponto de bomba do passo atual ou o global
        const bombPoint = currentObj.bombingPoint || this.config.bombingPoint;
        if (!bombPoint) return false;

        const { x, y, radius } = bombPoint;
        const r = radius || 50;

        // Verifica se o jogador específico está na zona
        if (player.sprite && player.sprite.active && player.health > 0) {
            const dist = Phaser.Math.Distance.Between(player.x, player.y, x, y);
            if (dist <= r) {
                if (this.config.steps) {
                    this.stepState.bombing = true;
                } else {
                    this.bombingMet = true;
                }

                // Consome a bomba
                player.removeItem('bomba');

                // Efeitos
                this.scene.cameras.main.shake(500, 0.02);
                if (this.scene.soundManager) this.scene.soundManager.playExplosion();

                // Efeito de explosão visual
                const explosion = this.scene.add.circle(x, y, 5, 0xff8c00).setDepth(10000);
                this.scene.tweens.add({
                    targets: explosion,
                    radius: 150,
                    alpha: 0,
                    duration: 600,
                    onComplete: () => explosion.destroy()
                });

                this.updateUI();
                this.checkWinCondition(); // Verifica vitória imediatamente
                return true;
            }
        }
        return false;
    }

    checkExtraction(pointConfig) {
        const { x, y, radius } = pointConfig;
        const r = radius || 100;

        let playerInside = false;
        // Verifica se algum jogador vivo está dentro da zona
        this.scene.players.forEach(player => {
            if (player.sprite && player.sprite.active && player.health > 0) {
                const dist = Phaser.Math.Distance.Between(player.x, player.y, x, y);
                if (dist <= r) {
                    playerInside = true;
                }
            }
        });

        // Lógica Sticky: Uma vez visitado, conta como cumprido (para permitir ir ao NPC depois)
        const alreadyMet = this.config.steps ? this.stepState.extraction : this.extractionMet;

        if (playerInside && !alreadyMet) {
            if (this.config.steps) {
                this.stepState.extraction = true;
            } else {
                this.extractionMet = true;
            }

            if (this.scene.soundManager) {
                this.scene.soundManager.playExtractionRadio();
            }
            this.updateUI();
        }
    }

    checkWinCondition() {
        if (this.isGameOver) return;

        // --- Lógica de Chain Quests (Steps) ---
        if (this.config.steps) {
            const currentObj = this.config.steps[this.currentStep];

            if (this.isStepComplete(currentObj)) {
                // Só esconde a barra se NÃO houver um visual timer rodando
                if (!this.visualTimerState) {
                    this.hideSurvivalBar();
                }
                if (this.sparksEmitter && this.sparksEmitter.emitting) this.sparksEmitter.stop();
                // Avança para o próximo passo
                this.currentStep++;

                // Reseta estados temporários do passo
                this.stepState = {
                    talked: false,
                    bombing: false,
                    extraction: false,
                    startKills: this.kills, // Kills contam a partir de agora para o próximo passo
                    survivalMet: false,
                    stepStartTime: 0,
                    lastRespawnTime: 0,
                    visualTimerStarted: false
                };

                if (this.currentStep >= this.config.steps.length) {
                    this.completeMission();
                } else {
                    // Verifica se o novo passo tem elementos visuais para criar no mapa
                    const nextStep = this.config.steps[this.currentStep];
                    if (nextStep.extractionPoint) this.createExtractionZone(nextStep.extractionPoint);
                    if (nextStep.bombingPoint) this.createBombingZone(nextStep.bombingPoint);

                    // Se o próximo passo tiver alvos específicos, torna-os vulneráveis
                    if (nextStep.targetId && this.scene.npcManager) {
                        this.scene.npcManager.setVulnerable(nextStep.targetId);
                    }

                    // Verifica se o novo passo tem NPCs para spawnar (Emboscada/Reforços)
                    if (nextStep.spawnNpcs && this.scene.npcManager) {
                        this.scene.npcManager.spawnNpcs(nextStep.spawnNpcs);
                    }

                    // Toca o som do novo passo, se houver
                    if (nextStep.sound && this.scene.soundManager) {
                        this.scene.soundManager.play(nextStep.sound, { type: 'quest' });
                    }

                    this.updateUI();
                    if (this.scene.uiManager) this.scene.uiManager.updateStatus(this.scene.languageManager.get('status_objective_updated'));
                }
            }
            return;
        }

        // Verifica se os objetivos principais foram cumpridos
        if (!this.arePrimaryObjectivesMet()) return;

        // Se houver objetivo de retornar ao NPC, verifica se foi feito (após os principais)
        if (this.config.returnToNpc && !this.returnedToNpc) return;

        // Se o diálogo estiver aberto, espera o jogador fechar para não sobrepor a tela de vitória
        if (this.scene.informationManager && this.scene.informationManager.isDialogOpen()) {
            return;
        }

        this.completeMission();
    }

    // Verifica se o passo atual da chain quest foi concluído
    isStepComplete(stepConfig) {
        if (!stepConfig) return false;

        // 1. Falar com NPC
        if (stepConfig.talkToNpc && !this.stepState.talked) return false;

        // 2. Matar Alvos Específicos (Acumulativo globalmente)
        if (stepConfig.targetId) {
            const targets = Array.isArray(stepConfig.targetId) ? stepConfig.targetId : [stepConfig.targetId];
            const allKilled = targets.every(t => this.killedTargets.includes(t));
            if (!allKilled) return false;
        }

        // 3. Kills Genéricos (Relativo ao início do passo)
        if (stepConfig.targetKills) {
            const killsInStep = this.kills - this.stepState.startKills;
            if (killsInStep < stepConfig.targetKills) return false;
        }

        // 4. Item Necessário
        if (stepConfig.requiredItem) {
            const hasItem = this.scene.players.some(p => p.inventory.includes(stepConfig.requiredItem));
            if (!hasItem) return false;
        }

        // 5. Plantar Bomba
        if (stepConfig.bombingPoint && !this.stepState.bombing) return false;

        // 6. Ponto de Extração
        if (stepConfig.extractionPoint && !this.stepState.extraction) return false;

        // 7. Tempo de Sobrevivência
        if (stepConfig.survivalTime && !this.stepState.survivalMet) return false;

        return true;
    }

    // Verifica todos os objetivos exceto o "Retornar ao NPC"
    arePrimaryObjectivesMet() {
        // Verifica contagem de abates
        if (this.config.targetKills && this.kills < this.config.targetKills) {
            return false;
        }

        // Verifica alvo específico
        const targets = this.getTargets();
        if (targets.length > 0) {
            const allKilled = targets.every(t => this.killedTargets.includes(t));
            if (!allKilled) return false;
        }

        // Verifica Ponto de Bomba
        if (this.config.bombingPoint && !this.bombingMet) return false;

        // Verifica Extração
        if (this.config.extractionPoint && !this.extractionMet) return false;

        // Verifica Falar com NPC (Info)
        if (this.config.talkToNpc && !this.talkedNpcs.includes(this.config.talkToNpc)) return false;

        // Verifica Item Necessário (Novo)
        if (this.config.requiredItem) {
            const hasItem = this.scene.players.some(p => p.inventory.includes(this.config.requiredItem));
            if (!hasItem) return false;
        }

        return true;
    }

    updateUI() {
        if (!this.objectivesContainer) return;

        // Limpa textos anteriores do container (mantém o bg que é o primeiro filho)
        this.objectivesContainer.each(child => {
            if (child !== this.objectivesBg) child.destroy();
        });

        let currentY = 5;
        const paddingX = 5;
        const boxWidth = 484;

        // 1. HEADER: ## OBJETIVOS ## [ATIVOS] {ROXO} 12 fonte
        const header = this.scene.add.text(paddingX, currentY, this.scene.languageManager.get('objectives_header_active'), {
            fontSize: '17px', fontFamily: 'Arial', color: '#A020F0', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0, 0);
        this.objectivesContainer.add(header);
        currentY += 16;

        // 2. MISSION NAME: FASE 1... {BRANCO} 8 fonte
        const missionNameKey = this.config.missionName;
        const missionName = (missionNameKey ? this.scene.languageManager.get(missionNameKey) : null) || this.scene.languageManager.get('objectives_mission_in_progress');
        console.log(this.config);  
        const missionText = this.scene.add.text(paddingX, currentY, missionName, {
            fontSize: '13px', fontFamily: 'Arial', color: '#FFFFFF', stroke: '#000000', strokeThickness: 1
        }).setOrigin(0, 0);
        this.objectivesContainer.add(missionText);
        currentY += 14; // Pula linha

        // --- UI para Chain Quests ---
        if (this.config.steps) {
            const currentObj = this.config.steps[this.currentStep];
            if (currentObj) {
                if (currentObj.showObjective !== false) {
                    
                    // 3. OBJECTIVE LABEL: [PENDING] OBJ 1.X {AMARELO}
                    // 4. DESCRIPTION: {AZUL} 10 fonte
                    
                    const stepNum = this.currentStep + 1;
                    const labelText = `${this.scene.languageManager.get('objectives_pending_prefix')} 1.${stepNum}`;
                    
                    const label = this.scene.add.text(paddingX, currentY, labelText, {
                        fontSize: '13px', fontFamily: 'Arial', color: '#FFFF00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2
                    }).setOrigin(0, 0);
                    this.objectivesContainer.add(label);

                    const labelWidth = label.width;
                    const instruction = this.scene.languageManager.get(currentObj.instruction) || '';
                    const descText = `: ${instruction}`;
                    
                    const desc = this.scene.add.text(paddingX + labelWidth, currentY, descText, {
                        fontSize: '12px', fontFamily: 'Arial', color: '#00FFFF', wordWrap: { width: boxWidth - (paddingX + labelWidth + 10) }, stroke: '#000000', strokeThickness: 2
                    }).setOrigin(0, 0);
                    this.objectivesContainer.add(desc);

                    currentY += Math.max(label.height, desc.height) + 6;

                    // 5. SUB-OBJECTIVES (Checkboxes): Quadrado Branco fonte 9
                    const subStyle = { fontSize: '13px', fontFamily: 'Arial', color: '#FFFFFF', stroke: '#000000', strokeThickness: 1 };

                    if (currentObj.talkToNpc) {
                        const status = this.stepState.talked ? "☑️" : "⬜";
                        const sub = this.scene.add.text(paddingX, currentY, `${status} ${this.scene.languageManager.get('objective_talk_to')}: ${currentObj.talkToNpc.toUpperCase()}`, subStyle);
                        this.objectivesContainer.add(sub);
                        currentY += 12;
                    }

                    if (currentObj.targetId) {
                        const targets = Array.isArray(currentObj.targetId) ? currentObj.targetId : [currentObj.targetId];
                        targets.forEach(target => {
                            const status = this.killedTargets.includes(target) ? "☑️" : "⬜";
                            const sub = this.scene.add.text(paddingX, currentY, `${status} ${this.scene.languageManager.get('objective_eliminate')}: ${target.toUpperCase()}`, subStyle);
                            this.objectivesContainer.add(sub);
                            currentY += 12;
                        });
                    }

                    if (currentObj.targetKills) {
                        const killsInStep = this.kills - this.stepState.startKills;
                        const done = killsInStep >= currentObj.targetKills;
                        const status = done ? "☑️" : "⬜";
                        const sub = this.scene.add.text(paddingX, currentY, `${status} ${this.scene.languageManager.get('objective_kills')}: ${killsInStep}/${currentObj.targetKills}`, subStyle);
                        this.objectivesContainer.add(sub);
                        currentY += 12;
                    }

                    if (currentObj.requiredItem) {
                        const hasItem = this.scene.players.some(p => p.inventory.includes(currentObj.requiredItem));
                        const status = hasItem ? "☑️" : "⬜";
                        const sub = this.scene.add.text(paddingX, currentY, `${status} ${this.scene.languageManager.get('objective_obtain')}: ${currentObj.requiredItem.toUpperCase()}`, subStyle);
                        this.objectivesContainer.add(sub);
                        currentY += 12;
                    }

                    if (currentObj.bombingPoint) {
                        const status = this.stepState.bombing ? "☑️" : "⬜";
                        const sub = this.scene.add.text(paddingX, currentY, `${status} ${this.scene.languageManager.get('objective_plant_bomb')}`, subStyle);
                        this.objectivesContainer.add(sub);
                        currentY += 12;
                    }

                    if (currentObj.extractionPoint) {
                        const status = this.stepState.extraction ? "☑️" : "⬜";
                        const sub = this.scene.add.text(paddingX, currentY, `${status} ${this.scene.languageManager.get('objective_go_to_extraction')}`, subStyle);
                        this.objectivesContainer.add(sub);
                        currentY += 12;
                    }

                    if (currentObj.survivalTime) {
                        const status = this.stepState.survivalMet ? "☑️" : "⬜";
                        const label = currentObj.timerLabel ? currentObj.timerLabel : this.scene.languageManager.get('objective_survive_the_attack');
                        const sub = this.scene.add.text(paddingX, currentY, `${status} ${label}`, subStyle);
                        this.objectivesContainer.add(sub);
                        currentY += 12;
                    }
                }
            }
        } else {
            // --- UI Clássica (Objetivos Simultâneos) ---
            // Mantendo compatibilidade básica com estilo novo
            const subStyle = { fontSize: '9px', fontFamily: 'Arial', color: '#FFFFFF' };
            
            const targets = this.getTargets();
            if (targets.length > 0) {
                targets.forEach(target => {
                    const status = this.killedTargets.includes(target) ? "☑️" : "⬜";
                    this.objectivesContainer.add(this.scene.add.text(paddingX, currentY, `${status} ${this.scene.languageManager.get('objective_target')}: ${target.toUpperCase()}`, subStyle));
                    currentY += 12;
                });
            }
            // ... (outros tipos clássicos omitidos para brevidade, seguem o mesmo padrão se necessário)
        }

        // Ajusta a altura da caixa de fundo
        if (this.objectivesBg) {
            const newHeight = Math.max(60, currentY + 10);
            this.objectivesBg.setSize(this.objectivesBg.width, newHeight);
            
            // Posiciona o FPS abaixo da caixa de objetivos
            if (this.scene.fpsText) {
                this.scene.fpsText.setPosition(30, newHeight + 5);
            }
        }
        
        this.updateObjectiveVisibility();
        this.updateIndicators(); // Atualiza as setas nos NPCs
    }

    getTargets() {
        let targets = [];

        // 1. Se definido explicitamente nos objetivos globais
        if (this.config.targetId) {
            const globalTargets = Array.isArray(this.config.targetId) ? this.config.targetId : [this.config.targetId];
            targets = targets.concat(globalTargets);
        }

        // 2. Se estiver em uma Chain Quest, adiciona os alvos do passo atual
        if (this.config.steps && this.config.steps[this.currentStep]) {
            const step = this.config.steps[this.currentStep];
            if (step.targetId) {
                const stepTargets = Array.isArray(step.targetId) ? step.targetId : [step.targetId];
                targets = targets.concat(stepTargets);
            }
        }

        // 3. Adiciona NPCs que estão marcados como isTarget (seja do config inicial ou spawnados)
        if (this.scene.npcManager && this.scene.npcManager.npcs) {
            this.scene.npcManager.npcs.forEach(npc => {
                if (npc.isTarget && !targets.includes(npc.id)) targets.push(npc.id);
            });
        }

        return targets;
    }

    // Retorna apenas os alvos que devem aparecer no radar AGORA (baseado no step atual)
    getActiveTargets() {
        let targets = [];
        if (!this.config) return targets;

        // 1. Alvos Globais (Sempre ativos)
        if (this.config.targetId) {
            const globalTargets = Array.isArray(this.config.targetId) ? this.config.targetId : [this.config.targetId];
            targets = targets.concat(globalTargets);
        }

        // 2. Alvos por Etapa (Chain Quest)
        if (this.config.steps) {
            // Se tem steps, pega apenas os do step atual
            if (this.config.steps[this.currentStep]) {
                const step = this.config.steps[this.currentStep];
                if (step.targetId) {
                    const stepTargets = Array.isArray(step.targetId) ? step.targetId : [step.targetId];
                    targets = targets.concat(stepTargets);
                }
            }
        } else {
            // 3. Modo Clássico (Sem steps): Considera todos os NPCs marcados como isTarget
            // Usa a lógica antiga de pegar tudo que é target
            targets = this.getTargets();
        }

        return targets;
    }

    createBombingZone() {
        const { x, y, radius } = this.config.bombingPoint;
        const r = radius || 50;

        const graphics = this.scene.add.graphics();
        graphics.lineStyle(4, 0xffa500, 0.8); // Laranja
        graphics.strokeCircle(x, y, r);
        graphics.fillStyle(0xffa500, 0.2);
        graphics.fillCircle(x, y, r);
        graphics.setDepth(5); // Acima do chão, abaixo das unidades

        this.scene.add.text(x, y, this.scene.languageManager.get('zone_label_bomb'), {
            fontSize: '16px', fill: '#ffa500', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);
    }

    createExtractionZone(customPoint = null) {
        const { x, y, radius } = customPoint || this.config.extractionPoint;
        const r = radius || 100;

        const graphics = this.scene.add.graphics();
        graphics.lineStyle(4, 0x00ff00, 0.8);
        graphics.strokeCircle(x, y, r);
        graphics.fillStyle(0x00ff00, 0.2);
        graphics.fillCircle(x, y, r);
        graphics.setDepth(5); // Acima do chão, abaixo das unidades

        this.scene.add.text(x, y, this.scene.languageManager.get('zone_label_extraction'), {
            fontSize: '10px', fill: '#d3edd3', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);
    }

    killStepNpcs(stepConfig) {
        if (stepConfig.spawnNpcs && this.scene.npcManager) {
            const idsToKill = stepConfig.spawnNpcs.map(n => n.id);
            this.scene.npcManager.npcs.forEach(npc => {
                if (idsToKill.includes(npc.id) && !npc.isDead && npc.active) {
                    this.scene.npcManager.takeDamage(npc, 999999); // Mata instantaneamente
                }
            });
            if (this.scene.uiManager) this.scene.uiManager.updateStatus(this.scene.languageManager.get('status_enemies_eliminated_by_time'));
        }
    }

    updateSurvivalBar(remaining, total, label) {
        if (!this.survivalBarBg.visible) {
            this.survivalBarBg.setVisible(true);
            this.survivalBarFill.setVisible(true);
            this.survivalText.setVisible(true);
        }

        const percent = Math.max(0, remaining / total);
        const width = 300; // Largura total definida no create
        const fillWidth = (width - 4) * percent; // -4 para borda

        this.survivalBarFill.width = fillWidth;

        // Muda cor conforme acaba (Verde -> Amarelo -> Vermelho)
        if (this.scene.getHealthColor) this.survivalBarFill.fillColor = this.scene.getHealthColor(percent);

        const seconds = Math.ceil(remaining / 1000);
        // Usa a chave de tradução como padrão
        const defaultLabel = this.scene.languageManager.get('objective_survive');
        const textLabel = (label !== undefined && label !== null) ? label : defaultLabel;

        // Se tiver rótulo, mostra "LABEL: 20s", senão mostra só "20s"
        const text = (textLabel && textLabel.trim() !== "") ? `${textLabel}: ${seconds}s` : `${seconds}s`;
        this.survivalText.setText(text);
    }

    hideSurvivalBar() {
        if (this.survivalBarBg && this.survivalBarBg.visible) {
            this.survivalBarBg.setVisible(false);
            this.survivalBarFill.setVisible(false);
            this.survivalText.setVisible(false);
        }
    }

    updateTimerUI(remainingMs) {
        if (remainingMs < 0) remainingMs = 0;
        const seconds = Math.floor(remainingMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const partSeconds = seconds % 60;
        const timeString = `${minutes}:${partSeconds.toString().padStart(2, '0')}`;

        this.timerText.setText(`${timeString}`);

        // Pisca em vermelho quando falta menos de 1 minuto (60000 ms)
        if (remainingMs < 60000) {
            if (Math.floor(this.scene.time.now / 500) % 2 === 0) {
                this.timerText.setColor('#ff0000');
            } else {
                this.timerText.setColor(this.showTimerGlow ? '#ffff00' : '#ffffff');
            }
        }
        else if (this.showTimerGlow) this.timerText.setColor('#ffff00');
        else this.timerText.setColor('#ffffff');
    }

    failMission(reason) {
        if (this.isGameOver) return;
        this.isGameOver = true;

        const { width, height } = this.scene.scale;

        // Fundo escuro
        this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
            .setScrollFactor(0)
            .setDepth(200000)
            .setInteractive(); // Bloqueia cliques no jogo

        // Texto de Falha
        const failTitle = this.scene.languageManager.get('mission_failed');
        const casualtiesText = this.scene.languageManager.get('mission_civilian_casualties', { count: this.civilianKills });
        this.scene.add.text(width / 2, height / 2 - 50, `${failTitle}\n${reason}\n${casualtiesText}`, {
            fontSize: '40px', fontFamily: 'Arial', color: '#ff0000', stroke: '#000000', strokeThickness: 4, align: 'center', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200001);

        // Botão Tentar de Novo
        const restartBtn = this.scene.add.text(width / 2, height / 2 + 60, this.scene.languageManager.get('try_again'), {
            fontSize: '24px', fontFamily: 'Arial', color: '#ffffff', backgroundColor: '#333333', padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(200001)
            .setInteractive({ useHandCursor: true });

        // Efeito de hover no botão
        restartBtn.on('pointerover', () => restartBtn.setStyle({ fill: '#ffff00' }));
        restartBtn.on('pointerout', () => restartBtn.setStyle({ fill: '#ffffff' }));

        const restartAction = () => {
            const url = new URL(window.location.href);
            url.searchParams.set('autostart', '1');
            url.searchParams.set('reset_levels', '1'); // Força o reset de níveis
            window.location.href = url.toString();
        };

        restartBtn.on('pointerdown', restartAction);

        // Adiciona listener para a tecla ENTER
        const enterListener = (event) => {
            if (event.key === 'Enter') {
                this.scene.input.keyboard.off('keydown', enterListener);
                restartAction();
            }
        };
        this.scene.input.keyboard.on('keydown', enterListener);
        this.scene.events.once('shutdown', () => this.scene.input.keyboard.off('keydown', enterListener));

        this.scene.physics.pause(); // Pausa o jogo
    }

    completeMission() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        const { width, height } = this.scene.scale;

        // Fundo escuro (um pouco mais opaco para leitura)
        this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9)
            .setScrollFactor(0)
            .setDepth(200000)
            .setInteractive(); // Bloqueia cliques no jogo

        // --- CÁLCULO DA RECOMPENSA ---
        const baseReward = 10000;
        const penaltyPerCivilian = 3500;
        const penalty = this.civilianKills * penaltyPerCivilian;
        const finalReward = Math.max(0, baseReward - penalty);

        const governments = [
            "EuroCorp",
            "Global Trust",
            "Neo-Terra",
            "Omni-Sys",
            "The Syndicate"
        ];

        // Texto de Vitória
        let msg = `${this.scene.languageManager.get('mission_complete')}\n\n`;
        msg += `${this.scene.languageManager.get('mission_complete_funders')}:\n`;
        msg += governments.join(", ") + "\n\n";
        msg += `${this.scene.languageManager.get('mission_complete_base_payment')}: ${baseReward.toLocaleString()} B$\n`;

        if (this.civilianKills > 0) {
            msg += `${this.scene.languageManager.get('mission_civilian_casualties', { count: this.civilianKills })}\n`;
            msg += `${this.scene.languageManager.get('mission_complete_penalty')}: -${penalty.toLocaleString()} B$\n`;
        } else {
            msg += `${this.scene.languageManager.get('mission_civilian_casualties', { count: 0 })} (${this.scene.languageManager.get('mission_complete_no_penalties')})\n`;
        }

        // --- ESTATÍSTICAS DETALHADAS ---
        const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
        msg += `\n${this.scene.languageManager.get('mission_complete_stats_header')}\n`;
        msg += `${this.scene.languageManager.get('mission_complete_shots_fired')}: ${this.shotsFired}\n`;
        msg += `${this.scene.languageManager.get('mission_complete_accuracy')}: ${accuracy}%\n`;
        msg += `${this.scene.languageManager.get('mission_complete_damage_dealt')}: ${this.damageDealt}\n`;

        msg += `\n${this.scene.languageManager.get('mission_complete_total_transfer')}: ${finalReward.toLocaleString()} B$`;

        // Credita o dinheiro ao time
        if (this.scene.teamLevelManager) {
            this.scene.teamLevelManager.gainMoney(finalReward);
        }

        // Salva o progresso individual dos jogadores para garantir persistência
        if (this.scene.players) {
            this.scene.players.forEach(p => {
                if (p.saveStats) p.saveStats();
            });
        }

        this.scene.add.text(width / 2, height / 2, msg, {
            fontSize: '22px', fontFamily: 'Arial', color: '#00ff00', stroke: '#000000', strokeThickness: 3, align: 'center', fontStyle: 'bold', wordWrap: { width: width * 0.8 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200001);

        // Verifica se é a última missão (missao5)
        const urlParams = new URLSearchParams(window.location.search);
        const currentMissionId = urlParams.get('mission') || 'missao1';
        const isLastMission = currentMissionId === 'missao5';
        const btnText = isLastMission ? this.scene.languageManager.get('campaign_complete') : this.scene.languageManager.get('next_mission');

        // Botão Próxima Missão / Concluir
        const nextBtn = this.scene.add.text(width / 2, height - 80, btnText, {
            fontSize: '24px', fontFamily: 'Arial', color: '#ffffff', backgroundColor: '#333333', padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(200001)
            .setInteractive({ useHandCursor: true });

        // Efeito de hover no botão
        nextBtn.on('pointerover', () => nextBtn.setStyle({ fill: '#ffff00' }));
        nextBtn.on('pointerout', () => nextBtn.setStyle({ fill: '#ffffff' }));

        const goToNext = () => {
            if (isLastMission) {
                this.showEndGameScreen();
                return;
            }

            // Lógica para ir para a próxima missão via URL
            const url = new URL(window.location.href);
            const currentMission = url.searchParams.get('mission') || 'missao1';
            const match = currentMission.match(/missao(\d+)/);
            let nextNum = 1;
            if (match) {
                nextNum = parseInt(match[1], 10) + 1;
            }
            const nextMissionId = `missao${nextNum}`;
            url.searchParams.set('mission', nextMissionId);
            url.searchParams.delete('autostart'); // Remove flag para ir ao lobby
            url.searchParams.delete('reset_levels'); // O reset vale só para o "Tentar de Novo", não para as próximas missões
            url.searchParams.set('view', 'base'); // Vai para o laboratório
            window.location.href = url.toString();
        };

        nextBtn.on('pointerdown', goToNext);

        // Adiciona listener para a tecla ESC e ENTER
        const keyListener = (event) => {
            if (event.key === 'Escape' || event.key === 'Enter') {
                this.scene.input.keyboard.off('keydown', keyListener); // Remove para evitar múltiplos disparos
                goToNext();
            }
        };
        this.scene.input.keyboard.on('keydown', keyListener);
        this.scene.events.once('shutdown', () => this.scene.input.keyboard.off('keydown', keyListener));

        this.scene.physics.pause(); // Pausa o jogo
    }

    showEndGameScreen() {
        const { width, height } = this.scene.scale;

        // Fundo preto total
        this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 1)
            .setScrollFactor(0)
            .setDepth(210000)
            .setInteractive(); // Bloqueia tudo

        // Dados finais
        const totalXp = this.scene.teamLevelManager ? this.scene.teamLevelManager.xp : 0;
        const teamLevel = this.scene.teamLevelManager ? this.scene.teamLevelManager.level : 1;

        const text = `${this.scene.languageManager.get('end_game_thank_you')}\n\n` +
            `${this.scene.languageManager.get('end_game_final_status')}:\n` +
            `${this.scene.languageManager.get('end_game_squad_level')}: ${teamLevel}\n` +
            `${this.scene.languageManager.get('end_game_total_xp')}: ${totalXp}\n\n` +
            `"${this.scene.languageManager.get('end_game_quote')}"`;

        this.scene.add.text(width / 2, height / 2 - 50, text, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#00ff00',
            align: 'center',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            lineSpacing: 15
        }).setOrigin(0.5).setScrollFactor(0).setDepth(210001);

        // Botão Voltar ao Menu
        const menuBtn = this.scene.add.text(width / 2, height - 100, this.scene.languageManager.get('end_game_back_to_menu'), {
            fontSize: '24px', fontFamily: 'Arial', color: '#ffffff', backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(210001).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setStyle({ fill: '#ffff00' }));
        menuBtn.on('pointerout', () => menuBtn.setStyle({ fill: '#ffffff' }));

        menuBtn.on('pointerdown', () => {
            // Remove query params para voltar ao lobby
            window.location.href = window.location.pathname;
        });
    }

    toggleObjectives() {
        if (this.objectivesContainer) {
            // Ciclo: 1 (Padrão) -> 2 (Texto) -> 0 (Oculto) -> 1 ...
            this.objectiveDisplayMode++;
            if (this.objectiveDisplayMode > 3) this.objectiveDisplayMode = 0;

            this.updateObjectiveVisibility();
            this.savePreferences();
            return this.objectiveDisplayMode;
        }
        return 0;
    }

    setObjectiveMode(mode) {
        this.objectiveDisplayMode = mode;
        this.updateObjectiveVisibility();
        this.savePreferences();
    }

    loadPreferences() {
        try {
            const saved = localStorage.getItem('brics_objective_mode');
            if (saved !== null) this.objectiveDisplayMode = parseInt(saved, 10);
        } catch (e) { console.warn("Erro ao carregar pref objetivos", e); }
    }

    savePreferences() {
        try {
            localStorage.setItem('brics_objective_mode', this.objectiveDisplayMode);
        } catch (e) { console.warn("Erro ao salvar pref objetivos", e); }
    }

    updateObjectiveVisibility() {
        if (!this.objectivesContainer) return;

        const isVisible = this.objectiveDisplayMode !== 0;
        this.objectivesContainer.setVisible(isVisible);
        
        if (!isVisible) return;

        switch (this.objectiveDisplayMode) {
            case 1: // Padrão (Caixa + Texto)
                if (this.objectivesBg) {
                    this.objectivesBg.setVisible(true);
                    this.objectivesBg.setFillStyle(0x000000, 0.7); // Semi-transparente (Padrão)
                }
                break;
            case 2: // Texto Apenas (Negrito, Sem Caixa)
                if (this.objectivesBg) this.objectivesBg.setVisible(false);
                break;
            case 3: // Fundo Negro (Opaco)
                if (this.objectivesBg) {
                    this.objectivesBg.setVisible(true);
                    this.objectivesBg.setFillStyle(0x000000, 1); // Opaco (Totalmente Negro)
                }
                break;
            case 0: // Oculto
                this.objectivesContainer.setVisible(false);
                break;
        }
    }

    toggleTimerGlow() {
        this.showTimerGlow = !this.showTimerGlow;
        if (this.timerText) {
            if (this.showTimerGlow) {
                // Efeito de Glow (brilho) branco para legibilidade
                this.timerText.setShadow(0, 0, '#ffffff', 8, true, true);
                this.timerText.setColor('#ffff00');
            } else {
                // Reseta a sombra/glow
                this.timerText.setShadow(0, 0, '#000000', 0, false, false);
                this.timerText.setColor('#ffffff');
            }
        }
        localStorage.setItem('brics_timer_glow', this.showTimerGlow);
        return this.showTimerGlow;
    }

    showFloatingText(x, y, message, color) {
        const text = this.scene.add.text(x, y, message, {
            fontSize: '16px', fontFamily: 'Arial', color: color, stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(5000);

        this.scene.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 1500,
            onComplete: () => text.destroy()
        });
    }

    // Método para reposicionar elementos quando a tela muda de tamanho
    resize(width, height) {
        if (this.timerText) {
            this.timerText.setPosition(width / 2, 10);
        }

        const barX = width / 2;
        const barY = 50;

        if (this.survivalBarBg) {
            this.survivalBarBg.setPosition(barX, barY);
        }
        if (this.survivalBarFill) {
            // O preenchimento é alinhado à esquerda, então ajustamos o X
            this.survivalBarFill.setPosition(barX - 300 / 2 + 2, barY);
        }
        if (this.survivalText) {
            this.survivalText.setPosition(barX, barY);
        }
    }

    // Métodos para registro de estatísticas
    recordShotFired() {
        this.shotsFired++;
    }

    recordHit() {
        this.shotsHit++;
    }

    recordDamage(amount) {
        this.damageDealt += amount;
    }

    updateIndicators() {
        let enemyTargets = [];
        let talkTargets = [];

        // Identifica alvos baseados no passo atual ou configuração global
        if (this.config.steps) {
            const step = this.config.steps[this.currentStep];
            if (step) {
                if (step.targetId) {
                    const targets = Array.isArray(step.targetId) ? step.targetId : [step.targetId];
                    // Filtra apenas os que ainda não foram mortos
                    enemyTargets = targets.filter(id => !this.killedTargets.includes(id));
                }
                if (step.talkToNpc && !this.stepState.talked) {
                    talkTargets.push(step.talkToNpc);
                }
            }
        } else {
            // Modo Clássico
            if (this.config.targetId) {
                const targets = Array.isArray(this.config.targetId) ? this.config.targetId : [this.config.targetId];
                enemyTargets = targets.filter(id => !this.killedTargets.includes(id));
            }
            if (this.config.talkToNpc && !this.talkedNpcs.includes(this.config.talkToNpc)) {
                talkTargets.push(this.config.talkToNpc);
            }
        }
        
        // Verifica objetivo de retorno (Extração/Finalização)
        if (this.config.returnToNpc && this.arePrimaryObjectivesMet() && !this.returnedToNpc) {
             talkTargets.push(this.config.returnToNpc);
        }

        // Envia para os gerenciadores
        if (this.scene.npcManager) this.scene.npcManager.setTargetIndicators(enemyTargets);
        if (this.scene.informationManager) this.scene.informationManager.setTargetIndicators(talkTargets);
    }
}