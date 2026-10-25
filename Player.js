// /var/www/html/brics/Player.js

export default class Player {
    constructor(scene, spawnConfig) { 
        this.scene = scene;
        this.spawnConfig = spawnConfig; // Objeto { x, y, type } vindo do config.js
        this.squadIndex = 0; // Será definido pela GameScene na criação
        
        // Busca a configuração visual baseada no tipo (ex: 'Player_1')
        this.typeConfig = window.gameConfig.PLAYER_TYPES[spawnConfig.type];

        if (!this.typeConfig) {
            console.error(`Configuração para o tipo '${spawnConfig.type}' não encontrada.`);
            return;
        } 
   
        // Define a velocidade (usa a do tipo se existir, senão usa a global)
        this.speed = this.typeConfig.speed || window.gameConfig.PLAYER_SPEED;
         
        // Atributos de Combate e Info
        this.name = spawnConfig.name || 'Soldado';

        // Carrega a classe específica deste jogador (salva no Lobby)
        // Se não houver, usa 'Combate' como padrão
        this.class = localStorage.getItem(`brics_player_class_${this.name}`) || 'Combate';

        this.armor = this.typeConfig.armor || 0;
        this.attackStrength = this.typeConfig.attackStrength || 0;
        
        // Inventário
        // Cria uma cópia do inventário para que cada instância tenha a sua própria, evitando problemas de referência.
        this.inventory = [...(this.typeConfig.inventory || ['pistol'])];
        this.selectedWeapon = this.inventory.length > 0 ? this.inventory[0] : null;
        
        // Remove a arma selecionada do inventário para evitar duplicação (aparecer na mochila e na mão)
        if (this.selectedWeapon) {
            const index = this.inventory.indexOf(this.selectedWeapon);
            if (index > -1) {
                this.inventory.splice(index, 1);
            }
        }
        
        // Armaduras Equipadas (Padrão para teste)
        this.equippedArmors = {
            helmet: 'helmet', 
            chest: 'chest',
            leg: 'leg'
        };

        // Cria o sprite na cena com Física (Arcade Physics)
        this.sprite = this.scene.physics.add.sprite(
            this.spawnConfig.x, 
            this.spawnConfig.y, 
            this.typeConfig.textureKey
        );

        // Referência de volta para a instância do Player (útil em callbacks de colisão)
        this.sprite._unit = this;

        this.sprite.setScale(this.typeConfig.scale);
        this.sprite.setCollideWorldBounds(true);

        // --- SOMBRA ---
        // Elipse preta com muita transparência (0.1) para parecer cinza claro
        this.shadow = this.scene.add.ellipse(0, 0, 40, 20, 0x000000, 0.3)
            .setVisible(this.scene.showShadows); 

        // --- AJUSTE DE COLISÃO (HITBOX) ---
        // Configura o tamanho e posição da caixa de colisão se definido no config.js
       if (this.typeConfig.bodyWidth !== undefined && this.typeConfig.bodyHeight !== undefined) {
           this.sprite.body.setSize(this.typeConfig.bodyWidth, this.typeConfig.bodyHeight);
      }        if (this.typeConfig.bodyOffset) {
           this.sprite.body.setOffset(this.typeConfig.bodyOffset.x, this.typeConfig.bodyOffset.y);
       }
         
         // Configura Vida e Texto


        // Aplica escala
        this.sprite.setScale(this.typeConfig.scale);
        this.sprite.setCollideWorldBounds(true);
        
        // Configura Vida e Texto
        this.health = window.gameConfig.MAX_HEALTH;
        
        // --- SISTEMA DE INSANIDADE ---
        this.insanity = 0; // 0 a 100%
        
        // --- SISTEMA DE NÍVEL E XP ---
        this.xp = 0;
        this.level = 1;
        this.loadStats(); // Carrega dados salvos
        window.gameConfig.normalizeInventory(this.inventory); // Acesso Rápido (0-3) só com itens de ação
        
        this.recalculateStats(); // Calcula atributos baseados no nível
        this.health = this.maxHp; // Começa com a vida cheia do novo nível
        
        // Barra de Vida (Restaurada)
        this.healthBar = this.scene.add.graphics();
        this.healthText = null; // Texto para modo numérico
        this.drawHealthBar(); // Desenha e define visibilidade com base no modo atual
        
        // Propriedades de movimento
        this.isMoving = false;
        this.moveTarget = null;
        this.lastDirection = 'down'; // Direção padrão para idle

        // --- Pathfinding Properties ---
        this.path = null;
        this.currentPathIndex = 0;

        // Inicia a animação 'idle'
        
        // Calcula a armadura inicial com base nos itens padrão
        this.recalculateArmor();
        this.playIdle();

        // Habilita interação (clique)
        // Usar pixelPerfect para evitar que a caixa transparente bloqueie cliques em NPCs próximos
        this.sprite.setInteractive({ pixelPerfect: true, alphaTolerance: 1 });
    }

    // Chamado todo frame pela Scene
    update() {
        // Segurança: Se o sprite não foi criado ou foi destruído, não faz nada
        if (!this.sprite || !this.sprite.active) return;
        if (this.health <= 0) return; // Não atualiza lógica se estiver morto (corpo no chão)

        // Atualiza posição da sombra
        if (this.shadow) {
            const footY = this.sprite.y + (this.sprite.displayHeight / 2) - 5;
            this.shadow.setPosition(this.sprite.x, footY);
            this.shadow.setDepth(this.sprite.y - 1); // Sempre abaixo do player
        }

        // Ordenação de profundidade (Depth Sort) para efeito 2.5D
        this.sprite.setDepth(this.sprite.y);

        const mode = this.scene.healthDisplayMode || 'default';
        let barY = this.sprite.y - 50;
        let textY = this.sprite.y - 50;

        if (mode === 'both') {
            textY = this.sprite.y - 60; // Texto mais acima
            barY = this.sprite.y - 50;  // Barra um pouco mais abaixo
        }

        // Atualiza posição da barra de vida
        if (this.healthBar && this.healthBar.visible) {
            this.healthBar.setPosition(this.sprite.x, barY);
            this.healthBar.setDepth(this.sprite.y + 1);
        }
        // Atualiza posição do texto de vida
        if (this.healthText && this.healthText.visible) {
            this.healthText.setPosition(this.sprite.x, textY);
            this.healthText.setDepth(this.sprite.y + 1);
        }

        // Lógica de movimento
        if (this.isMoving && this.moveTarget) {
            const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, this.moveTarget.x, this.moveTarget.y);
            
            // Verifica se chegou ao destino (tolerância de 5px)
            if (distance < 5) {
                // --- LÓGICA DE PATHFINDING ---
                if (this.path) {
                    this.currentPathIndex++;
                    if (this.currentPathIndex < this.path.length) {
                        const nextTarget = this.path[this.currentPathIndex];
                        this.moveTo(nextTarget.x, nextTarget.y);
                        return; // Não para o movimento ainda
                    }
                }

                this.sprite.body.reset(this.moveTarget.x, this.moveTarget.y); // Para o corpo e ajusta posição final
                this.isMoving = false;
                this.moveTarget = null;
                this.path = null; // Limpa o caminho ao chegar
                this.playIdle();
            }
        }
    }

    // Recalcula atributos baseados no nível (Fórmula do usuário)
    recalculateStats() {
        const hpFactor = 0.25;   // +25% de vida por level
        const dmgFactor = 0.15;  // +15% de dano base por level
        
        const baseHp = window.gameConfig.MAX_HEALTH || 100;
        const baseAttack = this.typeConfig.attackStrength || 0;
        
        this.maxHp = Math.floor(baseHp * (1 + this.level * hpFactor));
        this.attackStrength = Math.floor(baseAttack * (1 + this.level * dmgFactor));
    }

    // Recalcula a armadura total (Base + Equipamentos)
    recalculateArmor() {
        let totalArmor = this.typeConfig.armor || 0;
        
        if (this.equippedArmors) {
            const armorConfig = window.gameConfig.ARMORS || {};
            Object.values(this.equippedArmors).forEach(itemKey => {
                if (itemKey && armorConfig[itemKey]) {
                    totalArmor += (armorConfig[itemKey].armor || 0);
                }
            });
        }
        this.armor = totalArmor;
    }

    // Método para tocar animações (ex: 'up', 'down', 'left', 'right', 'idle')
    playAnimation(animName) {
        const key = `${this.typeConfig.textureKey}_${animName}`;
        
        if (this.scene.anims.exists(key)) {
            this.sprite.play(key, true); // true = ignora se já estiver tocando a mesma
        } else {
            console.warn(`Animação não encontrada: ${key}`);
        }
    }

    // Comando para mover a unidade
    moveTo(targetX, targetY) {
        this.isMoving = true;
        this.moveTarget = { x: targetX, y: targetY };

        // Usa física para mover (permite colisão)
        this.scene.physics.moveTo(this.sprite, targetX, targetY, this.speed);

        // Determina animação baseada na direção
        const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, targetX, targetY);
        const deg = Phaser.Math.RadToDeg(angle);
        let anim = 'down';

        if (deg >= -22.5 && deg <= 22.5) anim = 'right';
        else if (deg > 22.5 && deg < 67.5) anim = 'down_right';
        else if (deg >= 67.5 && deg <= 112.5) anim = 'down';
        else if (deg > 112.5 && deg < 157.5) anim = 'down_left';
        else if (deg >= 157.5 || deg <= -157.5) anim = 'left';
        else if (deg > -157.5 && deg < -112.5) anim = 'up_left';
        else if (deg >= -112.5 && deg <= -67.5) anim = 'up';
        else if (deg > -67.5 && deg < -22.5) anim = 'up_right';

        this.lastDirection = anim; // Atualiza a última direção para o idle correto

        // Tenta tocar a animação calculada. Se não existir (ex: não configurada no config.js),
        // o método playAnimation vai avisar no console, mas podemos fazer um fallback inteligente aqui se quiser.
        // Por enquanto, confiamos que se a chave existe no config, ela toca.
        // Se quiser fallback para 4 direções caso a diagonal falhe:
        if (!this.scene.anims.exists(`${this.typeConfig.textureKey}_${anim}`)) {
             // Fallback simples: remove a parte diagonal (ex: down_right -> down)
             if (anim.includes('down')) anim = 'down';
             else if (anim.includes('up')) anim = 'up';
             else if (anim.includes('left')) anim = 'left';
             else if (anim.includes('right')) anim = 'right';
        }

        this.playAnimation(anim);
    }

    // Novo método para iniciar o seguimento de um caminho
    followPath(path) {
        if (!path || path.length < 2) { // Precisa de pelo menos um ponto de início e um de destino
            this.stopMovement();
            return;
        }

        this.path = path;
        this.currentPathIndex = 1; // Começa a se mover para o primeiro ponto do caminho (índice 1)
        this.isMoving = true;
        
        const firstTarget = this.path[this.currentPathIndex];
        this.moveTo(firstTarget.x, firstTarget.y);
    }

    // Para imediatamente o movimento causado por moveTo (por exemplo, ao colidir)
    stopMovement() {
        this.isMoving = false;
        this.moveTarget = null;
        this.path = null; // Limpa o caminho ao parar
        this.currentPathIndex = 0;
        if (this.sprite && this.sprite.body) {
            if (this.sprite.body.setVelocity) {
                this.sprite.body.setVelocity(0, 0);
            } else {
                this.sprite.body.velocity && (this.sprite.body.velocity.x = 0);
                this.sprite.body.velocity && (this.sprite.body.velocity.y = 0);
            }
        }
        this.playIdle();
    }

    // Toca a animação de tiro baseada na direção do alvo
    performShoot(targetX, targetY) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        const deg = Phaser.Math.RadToDeg(angle);
        
        let direction = 'down';
        if (deg >= -22.5 && deg <= 22.5) direction = 'right';
        else if (deg > 22.5 && deg < 67.5) direction = 'down_right';
        else if (deg >= 67.5 && deg <= 112.5) direction = 'down';
        else if (deg > 112.5 && deg < 157.5) direction = 'down_left';
        else if (deg >= 157.5 || deg <= -157.5) direction = 'left';
        else if (deg > -157.5 && deg < -112.5) direction = 'up_left';
        else if (deg >= -112.5 && deg <= -67.5) direction = 'up';
        else if (deg > -67.5 && deg < -22.5) direction = 'up_right';

        this.lastDirection = direction; // Atualiza direção ao atirar

        const animName = `shoot_${direction}`;
        const key = `${this.typeConfig.textureKey}_${animName}`;

        // Só toca se a animação existir no config
        if (this.scene.anims.exists(key)) {
            this.sprite.play(key);
            
            // Quando terminar o tiro, volta para idle ou continua andando se estiver em movimento
            this.sprite.once('animationcomplete', () => {
                if (this.health > 0) {
                    if (!this.isMoving) {
                        this.playIdle();
                    } else {
                        // Se estiver andando, a lógica de update/moveTo cuidará da animação, 
                        // mas podemos forçar a retomada aqui se necessário.
                    }
                }
            });
        }
    }

    // Toca a animação de idle baseada na última direção
    playIdle() {
        if (this.isDead) return; // Não tira o cadáver da animação de morte
        let anim = `idle_${this.lastDirection}`;
        
        // Fallback para diagonais: se não houver idle diagonal, usa cardinal
        if (!this.scene.anims.exists(`${this.typeConfig.textureKey}_${anim}`)) {
             if (this.lastDirection.includes('down')) anim = 'idle_down';
             else if (this.lastDirection.includes('up')) anim = 'idle_up';
             else if (this.lastDirection.includes('left')) anim = 'idle_left';
             else if (this.lastDirection.includes('right')) anim = 'idle_right';
             else anim = 'idle_down'; // Fallback padrão
        }
        
        // Se a animação direcional existir, toca ela. Senão, tenta 'idle' genérico.
        if (this.scene.anims.exists(`${this.typeConfig.textureKey}_${anim}`)) {
            this.playAnimation(anim);
        } else {
            this.playAnimation('idle');
        }
    }

    // Feedback visual de seleção
    setSelected(isSelected) {
        // Limpa seleção anterior se houver
        if (this.selectionBox) {
            this.selectionBox.destroy();
            this.selectionBox = null;
        }
        
        // Limpa animação anterior se houver
        if (this.selectionTween) {
            this.selectionTween.stop();
            this.selectionTween = null;
        }

        // O quadrado amarelo foi removido conforme solicitado.
        // A seleção agora é indicada apenas pela UI (retratos).
    }

    // Getters para facilitar acesso à posição
    get x() { return this.sprite.x; }
    get y() { return this.sprite.y; }

    takeDamage(amount, source = null) {
        // Unidade morta não recebe mais dano (beams, DoT e tiros já disparados)
        if (this.isDead || this.health <= 0) return;

        // Se God Mode estiver ativo, ignora qualquer dano
        if (this.scene.isGodMode) return;

        // --- Lógica de Armor (Chance de Bloqueio) ---
        const reductionFactor = window.gameConfig.ARMOR_HIT_REDUCTION_FACTOR || 0.01;
        // Fórmula: (Armor / 100) * Fator. Ex: 40 armor / 100 * 0.01 = 0.004 (0.4% chance)
        const blockChance = (this.armor / 100) * reductionFactor;

        if (Math.random() < blockChance) {
             // Feedback visual de bloqueio
             const text = this.scene.add.text(this.x, this.y - 50, "BLOCK", {
                fontSize: '16px', color: '#aaaaaa', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(6000);

            this.scene.tweens.add({
                targets: text, y: this.y - 100, alpha: 0, duration: 1000, onComplete: () => text.destroy()
            });

            // Ainda muda para modo agressivo pois foi atacado, mesmo que tenha bloqueado
            if (this.scene && this.scene.switchToAggressiveMode) {
                this.scene.switchToAggressiveMode();
            }
            return; // Bloqueou o tiro, não toma dano
        }

        this.health = Math.max(0, this.health - amount);
        this.drawHealthBar(); // Atualiza a barra visualmente

        // Mudar para modo agressivo automaticamente ao receber dano
        if (this.scene && this.scene.switchToAggressiveMode) {
            this.scene.switchToAggressiveMode();
        }

        // Log de Acessibilidade (Recebeu Dano)
        if (this.scene.accessibilityManager) {
            const sourceName = (source && source.id) ? source.id : 'Inimigo Desconhecido';
            this.scene.accessibilityManager.log(`${this.name} recebeu tiro de ${sourceName} (Dano: ${amount})`, '#ff0000');
        }

        // Som de acerto no jogador
        if (this.scene.soundManager) {
            this.scene.soundManager.playPlayerHit();
        }

        // Efeito visual de dano
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            this.sprite.clearTint();
        });

        // Efeito de partículas de sangue (Igual aos NPCs)
        if (this.scene.npcManager && this.scene.npcManager.bloodEmitter) {
            this.scene.npcManager.bloodEmitter.explode(8, this.x, this.y);
        }

        if (this.health <= 0 && !this.isDead) {
            // Som de morte do jogador
            if (this.scene.soundManager) {
                this.scene.soundManager.playPlayerDeath();
            }
            // Remove da seleção se estiver selecionado
            if (this.scene.unitController) {
                this.scene.unitController.deselectUnit(this);
            }
            this.die();
        }
    }

    die() {
        // Zera movimento/caminho para não retomar o destino antigo ao reviver
        this.stopMovement();
        if (this.scene.gridManager) this.scene.gridManager.cancelPath(this);

        this.isDead = true;
        
        // Avisa que o player morreu
        if (this.scene && this.scene.showWarning) {
            this.scene.showWarning(`${this.name.toUpperCase()} MORREU!`);
        }

        // Reset de XP e Nível ao morrer
        this.xp = 0;
        this.level = 1;
        this.recalculateStats();
        this.saveStats();

        if (this.selectionBox) {
            this.selectionBox.destroy();
            this.selectionBox = null;
        }

        // Desativa física e interação
        if (this.sprite.body) this.sprite.body.enable = false;
        this.sprite.removeInteractive();

        // Toca animação de morte
        const deathAnimKey = `${this.typeConfig.textureKey}_morto`;
        if (this.scene.anims.exists(deathAnimKey)) {
            this.sprite.play(deathAnimKey, true);

            // Garante que a animação pare no último quadro e não entre em loop ou mude
            this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + deathAnimKey, () => {
                this.sprite.stop();
            }, this);
        } else {
            // Fallback se não houver animação: escurece e deita (rotação opcional)
            this.sprite.setTint(0x555555);
            this.sprite.setAngle(90);
        }

        // Garante que o corpo fique "no chão" (atrás de unidades vivas que passem por cima)
        this.sprite.setDepth(0);
    }

    revive() {
        this.isDead = false;
        this.health = 10; // Revive com 10 de vida
        this.insanity = 0; // Reseta a insanidade ao reviver
        this.xp = 0;
        this.level = 1; // Revive no nível 1
        this.recalculateStats();
        
        if (this.sprite) {
            this.sprite.clearTint();
            this.sprite.setAngle(0);
            this.sprite.setAlpha(1);
            if (this.sprite.body) this.sprite.body.enable = true;
            this.sprite.setInteractive({ pixelPerfect: true, alphaTolerance: 1 });
            this.stopMovement(); // Garante que volta parado (sem velocidade/caminho antigos)
        }
        this.drawHealthBar();
        this.saveStats();
    }

    heal(amount) {
        if (this.health <= 0) return; // Não cura se estiver morto
        const maxHealth = this.maxHp || window.gameConfig.MAX_HEALTH || 100;
        if (this.health >= maxHealth) return;

        this.health = Math.min(maxHealth, this.health + amount);
        this.drawHealthBar();

        // Feedback visual de cura
        const text = this.scene.add.text(this.x, this.y - 50, `+${amount}`, {
            fontSize: '20px', color: '#00ff00', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6000);

        this.scene.tweens.add({
            targets: text, y: this.y - 100, alpha: 0, duration: 1000, onComplete: () => text.destroy()
        });
    }

    useMedkit() {
        if (this.inventory.includes('medkit')) {
            const maxHealth = this.maxHp || window.gameConfig.MAX_HEALTH || 100;
            if (this.health > 0 && this.health < maxHealth) {
                this.heal(50); // Valor de cura do medkit
                this.removeItem('medkit');
            }
        }
    }

    useSmokeGrenade() {
        if (this.inventory.includes('smoke_grenade')) {
            this.removeItem('smoke_grenade');
            
            // Cria a nuvem de fumaça (Sprite animado)
            const smoke = this.scene.add.sprite(this.x, this.y, 'smoke_effect');
            smoke.play('smoke_anim');
            smoke.setDepth(5000);
            
            // Inicializa lista global de fumaças na cena se não existir
            if (!this.scene.smokeClouds) this.scene.smokeClouds = [];
            this.scene.smokeClouds.push(smoke);

            // Animação de expansão
            this.scene.tweens.add({
                targets: smoke,
                scale: { from: 0.1, to: 4 }, // Escala 4x (64px * 4 = 256px de diâmetro)
                alpha: { from: 0.8, to: 0.5 },
                duration: 500,
            });

            // Remove após 10 segundos com efeito de dissipação
            this.scene.time.delayedCall(10000, () => {
                this.scene.tweens.add({
                    targets: smoke,
                    alpha: 0,
                    duration: 1500,
                    onComplete: () => {
                        smoke.destroy();
                        if (this.scene.smokeClouds) {
                            this.scene.smokeClouds = this.scene.smokeClouds.filter(s => s !== smoke);
                        }
                    }
                });
            });
        }
    }

    destroy() {
        // Remove o sprite e o texto de vida da cena
        if (this.selectionBox) this.selectionBox.destroy();
        if (this.selectionTween) this.selectionTween.stop();
        this.sprite.destroy();
        if (this.healthBar) this.healthBar.destroy();
        if (this.healthText) this.healthText.destroy();
        if (this.shadow) this.shadow.destroy();
    }

    toggleShadow(visible) {
        if (this.shadow) this.shadow.setVisible(visible);
    }

    removeItem(itemKey) {
        const index = this.inventory.indexOf(itemKey);
        if (index > -1) {
            this.inventory.splice(index, 1);
            // If the removed item was the selected weapon, select another one (e.g., pistol)
            if (this.selectedWeapon === itemKey) {
                this.selectedWeapon = 'pistol'; // Fallback to pistol
            }
        }
    }

    drawHealthBar() {
        let mode = this.scene.healthDisplayMode || 'default';
        const maxHealth = this.maxHp || window.gameConfig.MAX_HEALTH || 100;
        const currentHealth = Math.floor(this.health);

        // Para players, os modos 'groupId' e 'id' não se aplicam, então tratamos como 'default' (oculto)
        if (mode === 'groupId' || mode === 'id') {
            mode = 'default';
        }

        // Reseta visibilidade (esconde tudo por padrão)
        if (this.healthBar) this.healthBar.setVisible(false);
        if (this.healthText) this.healthText.setVisible(false);

        // --- MODO LEVEL ---
        if (mode === 'level') {
            if (!this.healthText) {
                this.healthText = this.scene.add.text(0, 0, '', {
                    fontSize: '12px', fontFamily: 'Arial', fill: '#ffff00', stroke: '#000000', strokeThickness: 2, fontStyle: 'bold'
                }).setOrigin(0.5);
            }
            this.healthText.setVisible(true);
            this.healthText.setText(`Lv ${this.level || 1}`);
            this.healthText.setColor('#ffff00');
            return;
        }

        // --- MODO NÚMERO DO ESQUADRÃO (Syndicate Style) ---
        if (mode === 'squad_number') {
            if (!this.healthText) {
                this.healthText = this.scene.add.text(0, 0, '', {
                    fontSize: '16px', // Um pouco maior para o número
                    fontFamily: 'Arial', 
                    fill: '#ffffff', 
                    stroke: '#000000', 
                    strokeThickness: 3, 
                    fontStyle: 'bold'
                }).setOrigin(0.5);
            }
            this.healthText.setVisible(true);
            this.healthText.setText(`${this.squadIndex || '?'}`);
            return;
        }

        // No modo 'default', players não mostram barra
        if (mode === 'default') return;

        // --- MODO BARRA ---
        if (mode === 'bar' || mode === 'both') {
            if (!this.healthBar) this.healthBar = this.scene.add.graphics();
            this.healthBar.setVisible(true);
            this.healthBar.clear();
            
            const width = 32;
            const height = 4;
            const x = -width / 2;
            const y = 0;
            
            // Fundo (Preto)
            this.healthBar.fillStyle(0x000000);
            this.healthBar.fillRect(x, y, width, height);
            
            // Vida Atual (Cor Dinâmica)
            const percent = Phaser.Math.Clamp(this.health / maxHealth, 0, 1);
            
            // Barra de Vida AZUL (Solicitado)
            this.healthBar.fillStyle(0x0088ff);
            this.healthBar.fillRect(x, y, width * percent, height);
        }
        
        // --- MODO NUMÉRICO ---
        if (mode === 'number' || mode === 'both') {
            if (!this.healthText) {
                this.healthText = this.scene.add.text(0, 0, '', {
                    fontSize: '12px', fontFamily: 'Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 2, fontStyle: 'bold'
                }).setOrigin(0.5);
            }
            this.healthText.setVisible(true);
            this.healthText.setText(`${currentHealth}/${maxHealth}`);
        }
    }

    toggleHealthBar(visible) {
        if (this.healthBar) this.healthBar.setVisible(visible);
    }

    // --- MÉTODOS DE PERSISTÊNCIA E XP ---
    loadStats() {
        try {
            if (!this.name) return;
            const key = `brics_player_${this.name}`;
            const saved = localStorage.getItem(key);
            if (saved) {
                const data = JSON.parse(saved);
                this.insanity = data.insanity || 0;
                this.xp = data.xp || 0;
                // Recalcula nível usando a nova lógica progressiva
                const details = window.gameConfig.getXpDetails(this.xp);
                this.level = details.level;

                // Carrega inventário e equipamentos se existirem
                if (data.inventory) this.inventory = data.inventory;
                if (data.selectedWeapon !== undefined) this.selectedWeapon = data.selectedWeapon;
                if (data.equippedArmors) this.equippedArmors = data.equippedArmors;
            } else {
                // Se não há dados salvos, reseta para os valores padrão.
                this.insanity = 0;
                this.xp = 0;
                this.level = 1;
            }

            // Lida com o parâmetro 'reset_levels' do botão "Tentar de Novo"
            const urlParams = new URLSearchParams(window.location.search);
            const resetLevels = urlParams.get('reset_levels') === '1';
            if (resetLevels) {
                this.xp = 0;
                this.level = 1;
                // A insanidade não é resetada aqui, preservando-a ao tentar novamente.
                this.saveStats();
            }
        } catch (e) {
            console.warn("Falha ao carregar stats do player", e);
        }
    } 

    saveStats() {
        try {
            if (!this.name) return;
            const key = `brics_player_${this.name}`;
            const data = { 
                xp: this.xp, 
                insanity: this.insanity,
                inventory: this.inventory,
                selectedWeapon: this.selectedWeapon,
                equippedArmors: this.equippedArmors
            };
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn("Falha ao salvar stats do player", e);
        }
    }

    gainXp(amount) {
        const oldLevel = this.level;
        this.xp += amount;
        
        const details = window.gameConfig.getXpDetails(this.xp);
        this.level = details.level;
        
        if (this.level > oldLevel) {
            this.recalculateStats(); // Atualiza MaxHP e Dano
            this.health = this.maxHp; // Cura completa ao subir de nível
            this.drawHealthBar(); // Atualiza a barra de vida visualmente

            if (this.scene.uiManager) {
                this.scene.uiManager.updateStatus(`LEVEL UP! ${this.name} alcançou o nível ${this.level}!`);
            }
            
            // --- EFEITO VISUAL DE LEVEL UP (Partículas Douradas) ---
            if (!this.scene.textures.exists('gold_particle')) {
                const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
                graphics.fillStyle(0xffd700, 1); // Dourado
                graphics.fillCircle(4, 4, 4);
                graphics.generateTexture('gold_particle', 8, 8);
                graphics.destroy();
            }

            const emitter = this.scene.add.particles(this.x, this.y, 'gold_particle', {
                lifespan: 2000,
                speedY: { min: -200, max: -400 }, // Sobe rápido
                speedX: { min: -50, max: 50 },    // Espalha levemente
                scale: { start: 1, end: 0 },      // Diminui até sumir
                emitting: false
            });
            emitter.setDepth(6000); // Acima de tudo
            emitter.explode(50, this.x, this.y); // Explode 50 partículas
            this.scene.time.delayedCall(2500, () => emitter.destroy());

            // Efeito visual de Level Up
            const text = this.scene.add.text(this.x, this.y - 60, "LEVEL UP!", {
                fontSize: '24px', color: '#ffff00', stroke: '#000000', strokeThickness: 4, fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(6000);
            
            this.scene.tweens.add({
                targets: text, y: this.y - 120, alpha: 0, duration: 2500, onComplete: () => text.destroy()
            });
        }
        this.saveStats();
    }

    gainInsanity(amount) {
        if (this.health <= 0) return;
        
        this.insanity = Math.min(100, this.insanity + amount);
        
        // Feedback visual de insanidade
        const text = this.scene.add.text(this.x, this.y - 80, `+${amount}% LOUCURA`, {
            fontSize: '12px', color: '#00ff00', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6000);

        this.scene.tweens.add({
            targets: text, y: this.y - 110, alpha: 0, duration: 2000, onComplete: () => text.destroy()
        });

        if (this.insanity >= 100) {
            this.succumbToInsanity();
        }
    }

    succumbToInsanity() {
        if (this.health <= 0) return;

        // 1. Criação do NPC inimigo baseado no jogador
        if (this.scene.npcManager) {
            const weaponConfig = window.gameConfig.WEAPONS[this.selectedWeapon] || {};
            
            const npcData = {
                x: this.x,
                y: this.y,
                texture: this.typeConfig.textureKey,
                name: `Possuído ${this.name}`,
                hp: this.health * 1.5, // Bônus de vida por virar "boss"
                maxHp: this.maxHp * 1.5,
                speed: this.speed,
                visionRadius: 400,
                attackRadius: weaponConfig.range || 200,
                damage: this.attackStrength * 1.2,
                isRanged: true,
                isProvoked: true, // Ataca imediatamente
                isEnemy: true,
                isCivilian: false,
                groupId: 'insane_players',
                // Configurações de tiro baseadas na arma do player
                shootType: weaponConfig.shootType || 'raycast',
                projectileTexture: weaponConfig.projectileTexture,
                projectileSpeed: weaponConfig.projectileSpeed,
                projectileScale: weaponConfig.projectileScale,
                projectileRotation: weaponConfig.projectileRotation,
                muzzleFlash: weaponConfig.muzzleFlash
            };

            this.scene.npcManager.createNPC(npcData);
            if (this.scene.showBigWarning && this.scene.languageManager) {
                this.scene.showBigWarning(this.scene.languageManager.get('warning_agent_insane'), '80px');
                if (this.scene.cameras && this.scene.cameras.main) {
                    this.scene.cameras.main.shake(1000, 0.05); // Shake intenso por 1 segundo
                }
            } else {
                this.scene.showWarning(`${this.name} ENLOUQUECEU! MATE-O!`);
            }
        }

        // 2. Remove o jogador da lista e da cena
        if (this.scene.unitController) this.scene.unitController.deselectUnit(this);
        
        const index = this.scene.players.indexOf(this);
        if (index > -1) this.scene.players.splice(index, 1);

        this.destroy(); // Remove o sprite do jogador
        if (this.scene.uiManager) this.scene.uiManager.updatePlayerSlots(); // Atualiza UI
    }
}
