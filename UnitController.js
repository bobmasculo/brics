export default class UnitController {
    /**
     * @param {Phaser.Scene} scene - A cena atual.
     * @param {Array} players - Array de objetos Player.
     * @param {NPCManager} npcManager - Gerenciador de NPCs.
     * @param {ItemsManager} itemsManager - Gerenciador de Itens.
     */
    constructor(scene, players, npcManager, itemsManager) {
        this.scene = scene;
        this.players = players;
        this.npcManager = npcManager;
        this.itemsManager = itemsManager;
        this.selectedUnits = [];
        this.autoCameraFollow = true;

        // Configurações de Input
        // Desabilita o menu de contexto do botão direito para usá-lo no jogo
        this.scene.input.mouse.disableContextMenu();

        // Listener principal de input
        this.scene.input.on('pointerdown', this.handlePointerDown, this);

        // Tecla de atalho para selecionar TODO o time (Tecla 'T')
        this.selectAllKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
        this.selectAllKey.on('down', () => {
            if (this.scene.handleButtonClick) this.scene.handleButtonClick('todos');
            else this.toggleSelectAll();
        });

        // Seleciona todos por padrão ao iniciar
        this.toggleSelectAll();

        // --- SISTEMA DE PROJÉTEIS ---
        this.projectiles = this.scene.physics.add.group();

        // Colisão Projéteis x NPCs
        if (this.npcManager && this.npcManager.npcGroup) {
            this.scene.physics.add.overlap(this.projectiles, this.npcManager.npcGroup, (proj, npc) => {
                this.onProjectileHit(proj, npc);
            });
        }

        // Colisão Projéteis x Cenário e Interiores
        const obstacleGroups = [];
        if (this.scene.scenarioManager && this.scene.scenarioManager.getObstacles) obstacleGroups.push(this.scene.scenarioManager.getObstacles());
        if (this.scene.interiorsManager && this.scene.interiorsManager.getObstacles) obstacleGroups.push(this.scene.interiorsManager.getObstacles());

        obstacleGroups.forEach(group => {
            if (group) {
                this.scene.physics.add.collider(this.projectiles, group, (proj) => {
                    this.scene.shotManager.createImpactEffect(proj.x, proj.y);
                    proj.destroy();
                });
            }
        });
    }

    refreshHealthDisplay() {
         // Atualiza Players
            this.players.forEach(player => {
                if (player.drawHealthBar) player.drawHealthBar();
            });

            // Atualiza NPCs
            if (this.npcManager && this.npcManager.npcs) {
                this.npcManager.npcs.forEach(npc => {
                    if (this.npcManager.drawHealthBar) this.npcManager.drawHealthBar(npc);
                });
            }

            if (this.scene.uiManager) {
                let statusText = '';
                if (this.scene.healthDisplayMode === 'bar') statusText = 'Barras (Todos)';
                else if (this.scene.healthDisplayMode === 'number') statusText = 'Numérico (Todos)';
                else if (this.scene.healthDisplayMode === 'both') statusText = 'Barra + Texto (Todos)';
                else if (this.scene.healthDisplayMode === 'groupId') statusText = 'ID do Grupo (NPCs)';
                else if (this.scene.healthDisplayMode === 'id') statusText = 'ID Único (NPCs)';
                else if (this.scene.healthDisplayMode === 'dynamic') statusText = 'Dinâmico (Ao Dano)';
                else if (this.scene.healthDisplayMode === 'level') statusText = 'Nível (Todos)';
                else if (this.scene.healthDisplayMode === 'squad_number') statusText = 'Número do Esquadrão (Players)';
                else statusText = 'Padrão (Inimigos: Barra, Players: Oculto)';

                this.scene.uiManager.updateStatus(`Modo de Vida: ${statusText}`);
            }
    }

    startCameraFollow() {
        if (!this.autoCameraFollow) return;
        if (this.scene.keyboardManager && this.scene.keyboardManager.isActive) return;

        if (this.selectedUnits.length > 0) {
            const leader = this.selectedUnits[0];
            if (leader.sprite && leader.sprite.active) {
                this.scene.cameras.main.startFollow(leader.sprite, true, 0.1, 0.1);
            }
        }
    }

    toggleAutoCameraFollow() {
        this.autoCameraFollow = !this.autoCameraFollow;
        if (this.scene.uiManager) { 
            const statusKey = this.autoCameraFollow ? 'status_auto_camera_on' : 'status_auto_camera_off';
            this.scene.uiManager.updateStatus(this.scene.languageManager.get(statusKey));
        }
        if (!this.autoCameraFollow) {
            this.scene.cameras.main.stopFollow();
        } else {
            this.startCameraFollow();
        }
    }

    // Novo método para mover unidades ao longo de um caminho calculado
    moveUnitsOnPath(path) {
        if (!path || this.selectedUnits.length === 0) return;

        // O líder segue o caminho exato
        const leader = this.selectedUnits[0];
        if (leader && leader.followPath) {
            leader.followPath(path);
        }

        // Os seguidores também seguirão o mesmo caminho.
        // Uma implementação mais avançada usaria uma formação em volta do líder.
        const followers = this.selectedUnits.filter(u => u !== leader);
        followers.forEach((follower, index) => {
            if (follower && follower.followPath) {
                // Adiciona um pequeno atraso para que eles não comecem todos no mesmo instante
                this.scene.time.delayedCall(150 * (index + 1), () => {
                    if (follower.active && follower.health > 0) {
                        follower.followPath(path);
                    }
                });
            }
        });
    }

    // Novo método para mover unidades ao longo de um caminho calculado
    moveUnitsOnPath(path) {
        if (!path || this.selectedUnits.length === 0) return;

        // O líder segue o caminho exato
        const leader = this.selectedUnits[0];
        if (leader && leader.followPath) {
            leader.followPath(path);
        }

        // Os seguidores também seguirão o mesmo caminho.
        // Uma implementação mais avançada usaria uma formação em volta do líder.
        const followers = this.selectedUnits.filter(u => u !== leader);
        followers.forEach((follower, index) => {
            if (follower && follower.followPath) {
                // Adiciona um pequeno atraso para que eles não comecem todos no mesmo instante
                this.scene.time.delayedCall(150 * (index + 1), () => {
                    if (follower.sprite && follower.sprite.active && follower.health > 0) {
                        follower.followPath(path);
                    }
                });
            }
        });
    }

    selectNextUnit() {
        this.selectUnitByOffset(1); // 1 para próximo (direita)
    }

    selectPreviousUnit() {
        this.selectUnitByOffset(-1); // -1 para anterior (esquerda)
    }

    selectUnitByOffset(offset) {
        const livingPlayers = this.players.filter(p => p.health > 0);
        if (livingPlayers.length === 0) return;

        let currentIndex = -1;
        if (this.selectedUnits.length > 0) {
            // Encontra o índice da primeira unidade selecionada na lista de jogadores vivos
            currentIndex = livingPlayers.indexOf(this.selectedUnits[0]);
        }

        let newIndex;
        if (currentIndex === -1) {
            // Se nada estiver selecionado, 'próximo' seleciona o primeiro, 'anterior' seleciona o último.
            newIndex = (offset > 0) ? 0 : livingPlayers.length - 1;
        } else {
            newIndex = currentIndex + offset;
        }

        // Lógica de ciclo (wrap around)
        if (newIndex >= livingPlayers.length) {
            newIndex = 0;
        } else if (newIndex < 0) {
            newIndex = livingPlayers.length - 1;
        }

        const newUnitToSelect = livingPlayers[newIndex];

        // Desseleciona todos e seleciona o novo
        this.deselectAll();
        this.selectUnit(newUnitToSelect);

        // Atualiza UI e centraliza a câmera
        this.scene.uiManager.updateItemSlots(this.selectedUnits);
        this.scene.uiManager.updatePlayerSlots();
        this.startCameraFollow();
    }

    handlePointerDown(pointer, currentlyOver) {
        // Ignora cliques se o jogo estiver pausado
        if (this.scene.isPaused) return;

        // Ignora cliques na área da UI (Barra inferior)
        if (pointer.y > this.scene.scale.height - window.gameConfig.UI_BAR_HEIGHT) return;

        // Bloqueia qualquer interação do UnitController se clicar dentro da área do Joystick
        if (this.scene.virtualJoystick && this.scene.virtualJoystick.isVisible) {
            const distToJoystick = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.scene.virtualJoystick.x, this.scene.virtualJoystick.y);
            // Bloqueia se clicar dentro de um raio de 100px do centro do joystick
            if (distToJoystick < 100) {
                return;
            }
        }

        // DIAGNÓSTICO: Lista o que está embaixo do mouse
        let overInfo = "Nada";
        if (currentlyOver && currentlyOver.length > 0) {
            overInfo = currentlyOver.map(obj => obj.type + (obj.texture ? `(${obj.texture.key})` : '')).join(', ');
        }

        console.log(`[DEBUG] UnitController Click at ${pointer.x.toFixed(0)}, ${pointer.y.toFixed(0)}`);
        console.log(`[DEBUG] Objetos sob o mouse: ${overInfo}`);

        // --- PROTEÇÃO DE UI ---
        // Se clicou em qualquer objeto de UI (Depth > 8000), ignora o comando de movimento/tiro.
        // Isso impede que clicar em janelas, botões ou minimapa mova o personagem.
        if (currentlyOver && currentlyOver.some(obj => obj.depth >= 8000)) {
            console.log('[DEBUG] Ignorando clique: Interação com UI detectada');
            return;
        }

        // Ignora cliques se o diálogo de informação estiver aberto
        if (this.scene.informationManager && this.scene.informationManager.isDialogOpen()) {
            console.log('[DEBUG] Ignorando clique: Diálogo aberto');
            return;
        }

        // Ignora cliques se o painel de opções estiver aberto
        if (this.scene.optionsPanel && this.scene.optionsPanel.isVisible) {
            console.log('[DEBUG] Ignorando clique: Painel Opções visível');
            return;
        }

        // Ignora cliques se o painel de personagem estiver aberto
        if (this.scene.characterPanel && this.scene.characterPanel.isVisible) {
            console.log('[DEBUG] Ignorando clique: Painel Personagem visível');
            return;
        }

        // Ignora cliques se o painel de instruções estiver aberto
        if (this.scene.instructionsContainer && this.scene.instructionsContainer.visible) {
            console.log('[DEBUG] Ignorando clique: Instruções visíveis');
            return;
        }

        // --- PROTEÇÃO DE INTERAÇÃO COM NPCs DE INFO ---
        // Se o objeto de maior prioridade sob o mouse for um NPC de informação,
        // não faz nada aqui e deixa o listener próprio do NPC (em InformationManager) lidar com o clique.
        if (currentlyOver.length > 0) {
            const topObject = currentlyOver[0];
            // Acessa o array de sprites dos infoNpcs para verificar
            if (this.scene.informationManager && this.scene.informationManager.infoNpcs.includes(topObject)) {
                // É um NPC de informação, então o UnitController ignora o clique.
                return;
            }
        }

        // --- MODO WARP ---
        if (this.scene.isWarpMode) {
            if (pointer.leftButtonDown()) {
                this.scene.performWarp(pointer.worldX, pointer.worldY);
            } else {
                // Botão direito cancela
                if (this.scene.cancelWarpMode) this.scene.cancelWarpMode("Warp cancelado");
            }
            return;
        }

        // Verifica se há unidades selecionadas antes de processar comandos
        if (this.selectedUnits.length === 0) {
            // Se for botão direito (Mover) OU (botão esquerdo E modo agressivo)
            const isAggressive = this.scene.informationManager && this.scene.informationManager.isInstanceMode;

            if (pointer.rightButtonDown() || isAggressive) {
                if (this.scene.showWarning && this.scene.languageManager) {
                    this.scene.showWarning(this.scene.languageManager.get('warning_no_unit_selected'));
                }
                return;
            }
        }

        const isMobile = window.gameConfig.IS_MOBILE;
        const isAggressive = this.scene.informationManager && this.scene.informationManager.isInstanceMode;

        if (pointer.rightButtonDown() || (isMobile && !isAggressive)) {
            // Botão Direito: Mover (Seleção por clique no personagem removida)
            if (pointer.event.shiftKey) {
                // Shift + Botão Direito: Atirar parado (Hold Position Fire)
                this.selectedUnits.forEach(u => { if (u.stopMovement) u.stopMovement(); });
                this.shootAt(pointer.worldX, pointer.worldY);
            } else {
                let targetX = pointer.worldX;
                let targetY = pointer.worldY;

                // --- TESTE DE MOVIMENTO EM GRADE ---
                if (this.scene.isGridMovementTest && this.scene.gridManager) {
                    // NOVA LÓGICA: Usa A* pathfinding
                    if (this.selectedUnits.length > 0) {
                        const leader = this.selectedUnits[0];
                        this.scene.gridManager.findPath(leader.x, leader.y, targetX, targetY, (path) => {
                            if (path && path.length > 0) {
                                this.moveUnitsOnPath(path);
                                // Cria marcador no destino final
                                this.createClickMarker(path[path.length - 1].x, path[path.length - 1].y); 
                            } else {
                                if (this.scene.uiManager) this.scene.uiManager.updateStatus(this.scene.languageManager.get('warning_cant_reach_destination'));
                            }
                        });
                    }
                } else {
                    // Movimento livre original
                    this.moveSelectedUnits(targetX, targetY);
                    this.createClickMarker(targetX, targetY);
                }
                this.startCameraFollow();
            }
        } else {
            // Botão Esquerdo ou Toque no Mobile em modo Agressivo
            // Determina se estamos no modo de atirar (aceita PT/EN)
            const isShootMode = (this.scene.actionMode === 'shoot' || this.scene.actionMode === 'atirar' || this.scene.actionMode === 'atacar');

            if (!isShootMode && !isAggressive) {
                // Usa a lógica de seleção para cliques normais à esquerda
                this.handleSelection(pointer);
                if (this.getUnitUnderPointer(pointer, this.players)) {
                    this.startCameraFollow();
                }
                return;
            }

            // Verifica se clicou em um NPC (opcional, para mirar especificamente)
            const targetNPC = this.getUnitUnderPointer(pointer, this.npcManager ? this.npcManager.npcs : []);
            this.shootAt(pointer.worldX, pointer.worldY, targetNPC);
        }
    }

    handleSelection(pointer) {
        // Verifica se clicou em alguma unidade do jogador
        const clickedUnit = this.getUnitUnderPointer(pointer, this.players);

        console.log(`[DEBUG] handleSelection: Pointer at (${pointer.worldX}, ${pointer.worldY}), clickedUnit: ${clickedUnit ? clickedUnit.name || 'Unnamed' : 'None'}, isInfoMode: ${this.scene.isInfoMode}, selectedUnits before: ${this.selectedUnits.length}`);

        if (clickedUnit) {
            // Se o modo INFO estiver ligado, usa seleção única (clássica)
            if (this.scene.isInfoMode) {
                console.log('[DEBUG] InfoMode: Deselecting all and selecting clicked unit.');
                this.deselectAll();
                this.selectUnit(clickedUnit);
            } else {
                // Modo padrão: Alterna a seleção (permite selecionar vários clicando um por um)
                console.log('[DEBUG] Default mode: Toggling selection for clicked unit.');
                this.toggleUnitSelection(clickedUnit);
            }
        } else {
            // Clicou no vazio (chão) com botão esquerdo -> Opcional: Deselecionar tudo?
            // this.deselectAll();
        }

        console.log(`[DEBUG] After selection: selectedUnits count: ${this.selectedUnits.length}`);
    }

    handleAction(pointer) {
        if (this.selectedUnits.length === 0) return;

        const targetX = pointer.worldX;
        const targetY = pointer.worldY;

        // Verifica o modo atual na cena (Andar ou Atirar)
        if (this.scene.actionMode === 'atirar') {
            // Verifica se clicou em um NPC
            const targetNPC = this.getUnitUnderPointer(pointer, this.npcManager ? this.npcManager.npcs : []);
            this.shootAt(targetX, targetY, targetNPC);
        } else {
            // Modo padrão: Mover
            // Se clicou no chão, move. Se clicou em inimigo no modo mover, poderia ser ataque automático, mas vamos manter simples.
            this.moveSelectedUnits(targetX, targetY);
            this.createClickMarker(targetX, targetY);
        }
    }

    shootAt(x, y, targetUnit = null) {
        // Impede o tiro se o modo furtivo estiver ativo
        if (this.scene.isStealthMode) { 
            if (this.scene.showWarning && this.scene.languageManager) {
                this.scene.showWarning(this.scene.languageManager.get('warning_no_shooting_in_stealth'));
            }
            return;
        }

        console.log(`Comando: Atirar em (${x}, ${y})`);
        let anyShot = false;

        this.selectedUnits.forEach(unit => {
            // Verifica se a unidade está viva e ativa antes de atirar
            if (!unit.sprite || !unit.sprite.active || unit.health <= 0) return;

            // Obtém atributos da arma equipada
            let range = window.gameConfig.SHOOT_DISTANCE || 400;
            let damage = window.gameConfig.SHOOT_DAMAGE || 10;
            let isCritical = false;
            const wConfig = (unit.selectedWeapon && window.gameConfig.WEAPONS[unit.selectedWeapon]) ? window.gameConfig.WEAPONS[unit.selectedWeapon] : {};
            const shootType = wConfig.shootType || 'raycast'; // 'raycast' ou 'projectile'

            if (unit.selectedWeapon && window.gameConfig.WEAPONS[unit.selectedWeapon]) {
                const wStats = window.gameConfig.WEAPONS[unit.selectedWeapon];
                if (wStats) {
                    range = wStats.range;
                    if (wStats.minDamage !== undefined && wStats.maxDamage !== undefined) {
                        damage = Phaser.Math.Between(wStats.minDamage, wStats.maxDamage);
                    } else {
                        damage = wStats.damage || 10;
                    }

                    // Aplica fator de dano por nível (Fórmula: base * (1 + level * 0.15))
                    const dmgFactor = 0.15;
                    if (unit.level) {
                        damage = Math.floor(damage * (1 + unit.level * dmgFactor));
                    }

                    // Lógica de Crítico (Chance percentual)
                    if (wStats.critChance && Math.random() < wStats.critChance) {
                        damage *= 2; // Dobra o dano
                        isCritical = true;
                    }
                }
            }

            // If a target unit was provided, aim at the target's actual position
            const tx = (targetUnit && (targetUnit.x || (targetUnit.sprite && targetUnit.sprite.x))) ? (targetUnit.x || targetUnit.sprite.x) : x;
            const ty = (targetUnit && (targetUnit.y || (targetUnit.sprite && targetUnit.sprite.y))) ? (targetUnit.y || targetUnit.sprite.y) : y;

            const dist = Phaser.Math.Distance.Between(unit.x, unit.y, tx, ty);
            if (dist > range) return;

            // Verifica se a visão está bloqueada por fumaça (Atirador ou Alvo dentro da fumaça)
            if (this.isObscured(unit.x, unit.y) || this.isObscured(tx, ty)) {
                if (this.scene.showWarning && this.scene.languageManager) {
                    this.scene.showWarning(this.scene.languageManager.get('warning_vision_blocked'));
                }
                return;
            }

            // Verifica se há algum obstáculo físico (cenário/interiores) entre atirador e ponto alvo
            if (this.isLineBlocked(unit.x, unit.y, tx, ty)) {
                if (this.scene.showWarning && this.scene.languageManager) {
                    this.scene.showWarning(this.scene.languageManager.get('warning_shot_blocked'));
                }
                return;
            }

            anyShot = true;

            // Log de Acessibilidade (Tiro)
            if (this.scene.accessibilityManager) {
                const dir = this.scene.accessibilityManager.getDirectionFromAngle(Phaser.Math.Angle.Between(unit.x, unit.y, tx, ty));
                this.scene.accessibilityManager.log(`${unit.name || 'Personagem'} atirou para ${dir}`, '#00ffff');
            }

            // --- EFEITO DE RECUO (KNOCKBACK) ---
            const knockbackAngle = Phaser.Math.Angle.Between(tx, ty, unit.x, unit.y); // Ângulo oposto ao tiro
            const knockbackDistance = 4; // Distância do recuo em pixels
            this.scene.tweens.add({
                targets: unit.sprite,
                x: unit.x + Math.cos(knockbackAngle) * knockbackDistance,
                y: unit.y + Math.sin(knockbackAngle) * knockbackDistance,
                duration: 5, // Duração curta para um efeito rápido
                yoyo: true,   // Retorna para a posição original
                ease: 'Sine.easeInOut'
            });
            // --- FIM DO EFEITO DE RECUO ---

            // Toca animação de tiro (se configurada)
            if (unit.performShoot) {
                unit.performShoot(x, y);
            }

            // Calcula coordenadas relativas para a linha
            // Isso corrige o bug onde a linha desaparece se a câmera estiver longe da origem (0,0)
            const relX = tx - unit.x;
            const relY = ty - unit.y;

            // Toca o som de tiro
            if (this.scene.soundManager) {
                this.scene.soundManager.playShoot();
            }

            // Notifica tiro para civis fugirem
            if (this.npcManager && this.npcManager.notifyGunshot) {
                this.npcManager.notifyGunshot(unit.x, unit.y);
            }

            // Registra estatística de tiro
            if (this.scene.missionManager) {
                this.scene.missionManager.recordShotFired();
            }

            // --- Ajuste da Posição de Origem do Tiro ---
            let offX = 0;
            let offY = -10; // Altura padrão (ajuste para o peito/arma)

            const laserOffsets = window.gameConfig.LASER_OFFSETS || {
                'up': { x: 0, y: -25 },
                'down': { x: 0, y: -5 },
                'left': { x: -20, y: -10 },
                'right': { x: 20, y: -10 }
            };

            if (unit.lastDirection) {
                if (unit.lastDirection.includes('left')) { offX = laserOffsets.left.x; offY = laserOffsets.left.y; }
                if (unit.lastDirection.includes('right')) { offX = laserOffsets.right.x; offY = laserOffsets.right.y; }
                if (unit.lastDirection.includes('up')) offY = laserOffsets.up.y;
                if (unit.lastDirection.includes('down')) offY = laserOffsets.down.y;
            }

            const startX = unit.x + offX;
            const startY = unit.y + offY;

            // --- DISPARO (Raycast ou Projétil) ---
            this.scene.shotManager.fire({
                shootType: shootType,
                startX: startX,
                startY: startY,
                targetX: tx,
                targetY: ty,
                damage: damage,
                isCritical: isCritical,
                source: unit,
                target: targetUnit,
                config: wConfig,
                projectileGroup: this.projectiles
            });
        });

        if (!anyShot) { 
            if (this.scene.showWarning && this.scene.languageManager) {
                this.scene.showWarning(this.scene.languageManager.get('warning_target_out_of_range'));
            }
        }
    }

    onProjectileHit(projectile, npc) {
        if (!projectile.active || !npc.active) return;

        if (this.npcManager) {
            this.npcManager.takeDamage(npc, projectile.damage, projectile.source, projectile.isCritical);
        }

        this.scene.shotManager.createImpactEffect(projectile.x, projectile.y);
        projectile.destroy();
    }

    isObscured(x, y) {
        if (!this.scene.smokeClouds) return false;
        return this.scene.smokeClouds.some(smoke => {
            if (!smoke.active) return false;
            const radius = (smoke.radius || (smoke.width / 2)) * smoke.scale;
            return Phaser.Math.Distance.Between(x, y, smoke.x, smoke.y) <= radius;
        });
    }

    // Verifica se existe algum obstáculo físico bloqueando a linha entre (x1,y1) e (x2,y2)
    isLineBlocked(x1, y1, x2, y2) {
        // Cria a linha geométrica
        const line = new Phaser.Geom.Line(x1, y1, x2, y2);

        // Coleções a checar: cenário e interiores (se existirem)
        const groups = [];
        if (this.scene.scenarioManager && this.scene.scenarioManager.getObstacles) groups.push(this.scene.scenarioManager.getObstacles());
        if (this.scene.interiorsManager && this.scene.interiorsManager.getObstacles) groups.push(this.scene.interiorsManager.getObstacles());

        for (let g = 0; g < groups.length; g++) {
            const grp = groups[g];
            if (!grp || !grp.getChildren) continue;
            const children = grp.getChildren();
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (!child || !child.active) continue;

                // Preferir bounds do corpo se existir (mais preciso para objetos físicos)
                // Primeiro tenta usar getBounds() do display object (mais estável)
                let rect = null;
                if (child.getBounds && typeof child.getBounds === 'function') {
                    try {
                        rect = child.getBounds();
                    } catch (e) {
                        rect = null;
                    }
                }

                // Se não obteve bounds, tenta construir a partir do body (Arcade Body)
                if (!rect && child.body) {
                    const b = child.body;
                    // Algumas versões expõem x/y/width/height diretamente
                    const bx = (typeof b.x !== 'undefined') ? b.x : (b.position && b.position.x) || 0;
                    const by = (typeof b.y !== 'undefined') ? b.y : (b.position && b.position.y) || 0;
                    const bw = b.width || child.displayWidth || 0;
                    const bh = b.height || child.displayHeight || 0;
                    try {
                        rect = new Phaser.Geom.Rectangle(bx, by, bw, bh);
                    } catch (e) {
                        rect = null;
                    }
                }

                if (!rect) continue;
                // Se este child for um collider aproximado (círculo), verifique interseção linha-círculo
                try {
                    const isApprox = !!child._isApprox;
                    if (isApprox) {
                        // Determina raio do círculo: tenta child.radius, fallback para displayWidth/2 ou body.width/2
                        let radius = (typeof child.radius !== 'undefined') ? child.radius : (child.displayWidth ? child.displayWidth / 2 : (child.width ? child.width / 2 : 0));
                        if ((!radius || radius <= 0) && child.body) {
                            radius = (child.body.width || child.body.height) / 2 || radius;
                        }
                        if (radius > 0) {
                            const circ = new Phaser.Geom.Circle(child.x, child.y, radius);
                            if (Phaser.Geom.Intersects.LineToCircle(line, circ)) return true;
                        }
                    }

                    // Se o sprite tem ângulo, constrói um polígono rotacionado e testa interseção com a linha
                    const angleDeg = (typeof child.angle !== 'undefined') ? child.angle : (child.rotation ? Phaser.Math.RadToDeg(child.rotation) : 0);
                    if (angleDeg && Math.abs(angleDeg) > 0.01) {
                        const poly = this._buildRotatedPolygon(child, rect);
                        if (poly && Phaser.Geom.Intersects.LineToPolygon(line, poly)) return true;
                    } else {
                        if (Phaser.Geom.Intersects.LineToRectangle(line, rect)) return true;
                    }
                } catch (e) {
                    // Ignora objetos que causem erros de interseção e continua
                    continue;
                }
            }
        }

        return false;
    }

    moveSelectedUnits(x, y) {
        console.log(`Comando: Mover ${this.selectedUnits.length} unidade(s) para (${x}, ${y})`);

        this.selectedUnits.forEach((unit, index) => {
            // Verifica se a unidade está viva e ativa antes de mover
            if (!unit.sprite || !unit.sprite.active || unit.health <= 0) return;

            // Lógica baseada nas suas regras: "Unidade anda a quantidade designada na ficha"
            // Aqui calculamos a distância e aplicamos o movimento.

            // Pequeno offset para que as unidades não fiquem todas encavaladas no mesmo pixel
            // Formação simples em linha ou grid
            const offsetX = (index % 2) * 30 - 15;
            const offsetY = Math.floor(index / 2) * 30 - 15;

            // Calcula destino considerando obstáculos: se a linha estiver bloqueada, encurta destino
            const desiredX = x + offsetX;
            const desiredY = y + offsetY;

            let finalPoint = { x: desiredX, y: desiredY, blocked: false };
            if (unit.moveTo && this.getReachablePoint) {
                finalPoint = this.getReachablePoint(unit.x, unit.y, desiredX, desiredY, 6, 1);
            }

            // Se bloqueado, avisa o jogador
            if (finalPoint.blocked) {
                if (this.scene.showWarning) this.scene.showWarning(this.scene.languageManager.get('warning_cant_go_there'));
            }

            if (unit.moveTo) {
                if (index === 0 && this.scene.accessibilityManager) {
                    // Loga apenas uma vez para o grupo
                    const angle = Phaser.Math.Angle.Between(unit.x, unit.y, finalPoint.x, finalPoint.y);
                    const dir = this.scene.accessibilityManager.getDirectionFromAngle(angle);
                    this.scene.accessibilityManager.log(`Time movendo para: ${dir}`, '#ffff00');
                }
                unit.moveTo(finalPoint.x, finalPoint.y);
            }
        });
    }

    // Retorna um ponto alcançável ao longo da linha de (x1,y1) -> (x2,y2).
    // Faz uma amostragem em passos para detectar o primeiro ponto dentro de um obstáculo
    // e retorna o ponto anterior recuado por `backoff` pixels. step e backoff em pixels.
    getReachablePoint(x1, y1, x2, y2, step = 8, backoff = 8) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Phaser.Math.Distance.Between(x1, y1, x2, y2);
        if (dist === 0) return { x: x2, y: y2, blocked: false };

        const steps = Math.ceil(dist / step);

        for (let i = 1; i <= steps; i++) {
            const t = Math.min(1, (i * step) / dist);
            const px = x1 + dx * t;
            const py = y1 + dy * t;

            if (this._pointInObstacles(px, py)) {
                // volta para o ponto anterior
                const prevT = Math.max(0, ((i - 1) * step) / dist);
                // aplica backoff em pixels
                let newDistAlong = prevT * dist - backoff;
                newDistAlong = Math.max(0, newDistAlong);
                const newT = newDistAlong / dist;
                const rx = x1 + dx * newT;
                const ry = y1 + dy * newT;
                return { x: rx, y: ry, blocked: true };
            }
        }

        return { x: x2, y: y2, blocked: false };
    }

    // Checa se um ponto (px,py) está dentro de quaisquer obstáculos do cenário/interiores
    _pointInObstacles(px, py) {
        const groups = [];
        if (this.scene.scenarioManager && this.scene.scenarioManager.getObstacles) groups.push(this.scene.scenarioManager.getObstacles());
        if (this.scene.interiorsManager && this.scene.interiorsManager.getObstacles) groups.push(this.scene.interiorsManager.getObstacles());

        for (let g = 0; g < groups.length; g++) {
            const grp = groups[g];
            if (!grp || !grp.getChildren) continue;
            const children = grp.getChildren();
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (!child || !child.active) continue;

                let rect = null;
                if (child.getBounds && typeof child.getBounds === 'function') {
                    try { rect = child.getBounds(); } catch (e) { rect = null; }
                }
                if (!rect && child.body) {
                    const b = child.body;
                    const bx = (typeof b.x !== 'undefined') ? b.x : (b.position && b.position.x) || 0;
                    const by = (typeof b.y !== 'undefined') ? b.y : (b.position && b.position.y) || 0;
                    const bw = b.width || child.displayWidth || 0;
                    const bh = b.height || child.displayHeight || 0;
                    try { rect = new Phaser.Geom.Rectangle(bx, by, bw, bh); } catch (e) { rect = null; }
                }

                if (!rect) continue;
                try {
                    const angleDeg = (typeof child.angle !== 'undefined') ? child.angle : (child.rotation ? Phaser.Math.RadToDeg(child.rotation) : 0);
                    if (angleDeg && Math.abs(angleDeg) > 0.01) {
                        const poly = this._buildRotatedPolygon(child, rect);
                        if (poly && Phaser.Geom.Polygon.Contains(poly, px, py)) return true;
                    } else {
                        if (rect.contains(px, py)) return true;
                    }
                } catch (e) {
                    continue;
                }
            }
        }
        return false;
    }

    // Constrói um Phaser.Geom.Polygon representando o retângulo do display object rotacionado pelo ângulo do sprite
    _buildRotatedPolygon(child, rect) {
        // Usa centro do sprite como pivô (assume origem centralizada ou aproximação razoável)
        const w = child.displayWidth || rect.width || 0;
        const h = child.displayHeight || rect.height || 0;
        const cx = child.x;
        const cy = child.y;

        const halfW = w / 2;
        const halfH = h / 2;

        // Ângulo em radianos
        const ang = (typeof child.angle !== 'undefined') ? Phaser.Math.DegToRad(child.angle) : (child.rotation || 0);

        const corners = [
            { x: -halfW, y: -halfH },
            { x: halfW, y: -halfH },
            { x: halfW, y: halfH },
            { x: -halfW, y: halfH }
        ];

        const points = [];
        for (let i = 0; i < corners.length; i++) {
            const p = corners[i];
            const rx = p.x * Math.cos(ang) - p.y * Math.sin(ang);
            const ry = p.x * Math.sin(ang) + p.y * Math.cos(ang);
            points.push(cx + rx, cy + ry);
        }

        return new Phaser.Geom.Polygon(points);
    }

    toggleSelectAll() {
        // 1. Obtém todas as unidades ativas (com sprite e vida > 0)
        let activeUnits = this.players.filter(unit => unit.sprite && unit.sprite.active && unit.health > 0);

        // 2. Verifica se há um ponto de extração configurado na missão atual
        const missionConfig = window.missionConfig || {};
        const objectives = missionConfig.OBJECTIVES || {};

        if (objectives.extractionPoint) {
            const { x, y, radius } = objectives.extractionPoint;
            const r = radius || 100;

            // Filtra: Mantém apenas as unidades que estão FORA do raio de extração
            activeUnits = activeUnits.filter(unit => {
                const dist = Phaser.Math.Distance.Between(unit.x, unit.y, x, y);
                // Se a distância for maior que o raio, a unidade está fora (deve ser selecionada)
                return dist > r;
            });
        }

        const allSelected = activeUnits.length > 0 && activeUnits.every(unit => this.selectedUnits.includes(unit));

        if (allSelected) {
            this.deselectAll(); 
            if (this.scene.uiManager) this.scene.uiManager.updateStatus(this.scene.languageManager.get('status_selection_cleared'));
            return false;
        } else {
            this.deselectAll(); // Limpa seleção anterior (incluindo quem estava dentro da zona, se houver)
            activeUnits.forEach(unit => this.selectUnit(unit));

            if (this.scene.uiManager) {
                if (activeUnits.length > 0) { 
                    this.scene.uiManager.updateStatus(this.scene.languageManager.get('status_units_selected', { count: activeUnits.length }));
                } else {
                    this.scene.uiManager.updateStatus(this.scene.languageManager.get('status_all_units_in_extraction'));
                }
            }
            this.startCameraFollow();
            return true;
        }
    }

    selectUnit(unit) {
        console.log(`[DEBUG] selectUnit: Attempting to select ${unit.name || 'Unnamed'}`);
        if (!this.selectedUnits.includes(unit)) {
            this.selectedUnits.push(unit);
            if (unit.setSelected) unit.setSelected(true);
            console.log(`[DEBUG] Unit selected, total selected: ${this.selectedUnits.length}`);
        } else {
            console.log(`[DEBUG] Unit already selected`);
        }
    }

    deselectUnit(unit) {
        if (this.selectedUnits.includes(unit)) {
            if (unit.setSelected) unit.setSelected(false);
            this.selectedUnits = this.selectedUnits.filter(u => u !== unit);
            console.log(`[DEBUG] Unit ${unit.name || 'Unnamed'} deselected via deselectUnit`);
        }
    }

    deselectAll() {
        console.log(`[DEBUG] deselectAll: Deselecting ${this.selectedUnits.length} units`);
        this.selectedUnits.forEach(unit => {
            if (unit.setSelected) unit.setSelected(false);
        });
        this.selectedUnits = [];
        console.log(`[DEBUG] All deselected`);
    }

    toggleUnitSelection(unit) {
        console.log(`[DEBUG] toggleUnitSelection: Unit ${unit.name || 'Unnamed'}, currently selected: ${this.selectedUnits.includes(unit)}`);
        if (this.selectedUnits.includes(unit)) {
            // Check if all active units are selected
            const activeUnits = this.players.filter(p => p.sprite && p.sprite.active);
            const allSelected = activeUnits.length > 0 && activeUnits.every(p => this.selectedUnits.includes(p));
            if (allSelected) {
                // If all selected, clicking one deselects others (keeps only this one)
                this.deselectAll();
                this.selectUnit(unit);
                console.log(`[DEBUG] All were selected, deselected others and kept this unit, now selected: ${this.selectedUnits.length}`);
            } else {
                // Normal: deselect this unit
                if (unit.setSelected) unit.setSelected(false);
                this.selectedUnits = this.selectedUnits.filter(u => u !== unit);
                console.log(`[DEBUG] Deselected unit, now selected: ${this.selectedUnits.length}`);
            }
        } else {
            // Select the unit (adds to selection)
            this.selectUnit(unit);
            console.log(`[DEBUG] Selected unit, now selected: ${this.selectedUnits.length}`);
        }
    }

    getUnitUnderPointer(pointer, units) {
        if (!units) return null;
        // Verifica colisão do ponto do mouse com os bounds da unidade
        // Itera de trás para frente para pegar o que está "por cima" visualmente (render order)
        for (let i = units.length - 1; i >= 0; i--) {
            const unit = units[i];

            // Adaptação: Se for um Player (wrapper), usa .sprite. Se for NPC (Sprite direto), usa o próprio unit.
            const spriteToCheck = unit.sprite || unit;

            // Verifica se o sprite existe, está ativo e se o ponto está dentro
            // Verifica health apenas se a propriedade existir (para compatibilidade com NPCs que podem não ter .health exposto)
            const isAlive = (typeof unit.health !== 'undefined') ? unit.health > 0 : true;
            if (spriteToCheck && spriteToCheck.active && isAlive && spriteToCheck.getBounds && spriteToCheck.getBounds().contains(pointer.worldX, pointer.worldY)) {
                return unit;
            }
        }
        return null;
    }

    createClickMarker(x, y) {
        const marker = this.scene.add.circle(x, y, 5, 0x00ff00, 0.8).setDepth(2000);
        this.scene.tweens.add({
            targets: marker,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => marker.destroy()
        });
    }
}