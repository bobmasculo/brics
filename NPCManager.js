export default class NPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = [];
        this.npcGroup = null;
        this.npcProjectiles = null;
    }

    preload() {
        // Carrega os assets definidos na configuração de missões
        // Assume que window.gameConfig.NPCS é o array de configuração
        if (window.gameConfig && window.gameConfig.NPCS) {
            window.gameConfig.NPCS.forEach(npcConfig => {
                if (npcConfig.path && npcConfig.texture) {
                    this.scene.load.spritesheet(npcConfig.texture, npcConfig.path, {
                        frameWidth: npcConfig.frameWidth || npcConfig.width,
                        frameHeight: npcConfig.frameHeight || npcConfig.height
                    });
                }
            });
        }  

        // Carrega assets de NPCs definidos dentro dos STEPS da missão (Spawn dinâmico)
        if (window.missionConfig && window.missionConfig.OBJECTIVES && window.missionConfig.OBJECTIVES.steps) {
            window.missionConfig.OBJECTIVES.steps.forEach(step => {
                if (step.spawnNpcs) {
                    step.spawnNpcs.forEach(npcConfig => {
                        if (npcConfig.path && npcConfig.texture) {
                            this.scene.load.spritesheet(npcConfig.texture, npcConfig.path, {
                                frameWidth: npcConfig.frameWidth || npcConfig.width,
                                frameHeight: npcConfig.frameHeight || npcConfig.height
                            });
                        }
                    });
                }
            });
        }
        if (window.missionConfig && window.missionConfig.OBJECTIVES && window.missionConfig.OBJECTIVES.punishments) {
            const punishments = window.missionConfig.OBJECTIVES.punishments;
            Object.values(punishments).forEach(npcList => {
                if (Array.isArray(npcList)) {
                    npcList.forEach(npcConfig => {
                        if (npcConfig.path && npcConfig.texture) {
                            this.scene.load.spritesheet(npcConfig.texture, npcConfig.path, {
                                frameWidth: npcConfig.frameWidth || npcConfig.width,
                                frameHeight: npcConfig.frameHeight || npcConfig.height
                            });
                        }
                    });
                }
            });
        }
    }



    create() {
        this.npcGroup = this.scene.physics.add.group();
        this.npcProjectiles = this.scene.physics.add.group();

        // Gera textura de quadrado branco para NPCs experimentais
        if (!this.scene.textures.exists('white_square')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 8, 8);
            graphics.generateTexture('white_square', 8, 8);
            graphics.destroy();
        }

        // Gera textura de bala se não existir
        if (!this.scene.textures.exists('bullet')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffaa00, 3); // Laranja/Amarelo
            graphics.fillCircle(3, 3, 3);
            graphics.generateTexture('bullet', 6, 6);
        }

        if (window.gameConfig && window.gameConfig.NPCS) {
            window.gameConfig.NPCS.forEach(data => {
                // Lógica de Respawn para NPCs do Mapa (Não-Steps)
                const mapNpcData = { ...data };
                // Se não tiver respawnTime definido e não for um alvo (Boss), define padrão
                if (mapNpcData.respawnTime === undefined && !mapNpcData.isTarget) {
                    mapNpcData.respawnTime = 60000; // 60 segundos padrão
                }
                this.createNPC(mapNpcData);
            });
        }

        // Cria animações genéricas para os NPCs (assumindo spritesheet padrão)
        // Se seus spritesheets forem diferentes, precisaremos ajustar isso
        this.createAnimations();

        // --- EFEITO DE SANGUE ---
        // Gera a textura programaticamente para não depender de arquivo externo
        if (!this.scene.textures.exists('blood_particle')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xcc0000, 1); // Vermelho escuro
            graphics.fillCircle(3, 3, 3);
            graphics.generateTexture('blood_particle', 6, 6);
        }

        // Inicializa o emissor de partículas
        this.bloodEmitter = this.scene.add.particles(0, 0, 'blood_particle', {
            lifespan: 500,
            speed: { min: 50, max: 150 },
            scale: { start: 1, end: 0 },
            gravityY: 200,
            emitting: false
        });
        this.bloodEmitter.setDepth(9000); // Garante que o sangue apareça acima do chão e NPCs

        // --- TEXTURA DE POÇA DE SANGUE ---
        // Gera a textura programaticamente para não depender de arquivo externo
        if (!this.scene.textures.exists('blood_puddle')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0x8a0303, 0.8); // Vermelho sangue escuro
            graphics.fillEllipse(16, 8, 20, 10); // Formato oval
            graphics.generateTexture('blood_puddle', 32, 16);
        }

        // --- TEXTURA DE QUEIMADURA (BURN MARK) ---
        if (!this.scene.textures.exists('burn_mark')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0x111111, 0.7); // Preto/Cinza escuro
            graphics.fillEllipse(16, 8, 24, 12);
            graphics.generateTexture('burn_mark', 32, 16);
        }

        // --- TEXTURA DE FUMAÇA DE ESCAPAMENTO ---
        if (!this.scene.textures.exists('exhaust_smoke_particle')) {
            const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x888888, 1);
            g.fillCircle(8, 8, 8); // Círculo cinza
            g.generateTexture('exhaust_smoke_particle', 16, 16);
            g.destroy();
        }

        // --- TEXTURA DE SETA (TARGET) ---
        if (!this.scene.textures.exists('arrow_marker_enemy')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xff0000, 1); // Vermelho
            graphics.fillTriangle(0, 0, 24, 0, 12, 24); // Triângulo apontando para baixo
            graphics.generateTexture('arrow_marker_enemy', 24, 24);
            graphics.destroy();
        }

        // --- TEXTURA DE FAROL (HEADLIGHT BEAM) ---
        if (!this.scene.textures.exists('headlight_beam')) {
            const canvas = this.scene.textures.createCanvas('headlight_beam', 300, 128);
            const ctx = canvas.context;
            
            // Gradiente linear horizontal (fade out)
            const grd = ctx.createLinearGradient(0, 0, 300, 0);
            grd.addColorStop(0, 'rgba(255, 255, 200, 0.5)'); // Amarelo claro na origem
            grd.addColorStop(1, 'rgba(255, 255, 255, 0)');   // Transparente no final
            
            ctx.fillStyle = grd;
            
            // Desenha forma de cone suave
            ctx.beginPath();
            ctx.moveTo(0, 64); // Origem (Centro vertical)
            ctx.lineTo(300, 0); // Abertura superior
            ctx.lineTo(300, 128); // Abertura inferior
            ctx.fill();
            
            canvas.refresh();
        }

        // --- TEXTURA DE SKID MARK (Derrapagem) ---
        if (!this.scene.textures.exists('skid_mark')) {
            const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x111111, 0.5); // Preto semitransparente
            g.fillCircle(3, 3, 3);
            g.generateTexture('skid_mark', 6, 6);
            g.destroy();
        }

        // Configura colisões dos NPCs com o mundo
        this.setupCollisions();

        // --- DEBUG GRAPHICS ---
        this.debugGraphics = this.scene.add.graphics().setDepth(99999);
        this.isDebugVisible = false;
        this.isVisionDebugVisible = false;
        this.isTargetDebugVisible = false;
        this.isDirectionDebugVisible = false;
    }

    spawnNpcs(npcList) {
        if (!npcList || !Array.isArray(npcList)) return;

        npcList.forEach(data => {
            const npc = this.createNPC(data);

            // Efeito de Fade In (Aparecer gradualmente)
            if (npc) {
                npc.setAlpha(0);
                if (npc.healthBar) npc.healthBar.setAlpha(0);
                if (npc.healthText) npc.healthText.setAlpha(0);

                this.scene.tweens.add({
                    targets: [npc, npc.healthBar, npc.healthText].filter(t => t),
                    alpha: 1,
                    duration: 100 //Atraso para o NPC aparecer no meio da animação de summon
                });
            }

            // --- EFEITO DE SUMMON (ANIMAÇÃO) ---
            const summonSprite = this.scene.add.sprite(data.x, data.y, 'summon_effect');
            summonSprite.setDepth(data.y - 1); // Fica um pouco atrás do NPC para o NPC aparecer "de dentro"
            summonSprite.play('summon_anim');

            summonSprite.on('animationcomplete', () => {
                summonSprite.destroy();
            });
        });
    }

    setupCollisions() {
        // Colisão com obstáculos do cenário (Prédios, muros, etc)
        if (this.scene.scenarioManager && this.scene.scenarioManager.getObstacles) {
            this.scene.physics.add.collider(this.npcGroup, this.scene.scenarioManager.getObstacles());
        }

        // Colisão com obstáculos de interiores (Paredes internas, móveis)
        if (this.scene.interiorsManager && this.scene.interiorsManager.getObstacles) {
            this.scene.physics.add.collider(this.npcGroup, this.scene.interiorsManager.getObstacles());
        }

        // Colisão com limites visuais do mapa (Paredes invisíveis) - REMOVIDO
        // Isso permite que os NPCs saiam um pouco da tela e evita que fiquem presos nas bordas
        // if (this.scene.mapBoundaries) {
        //     this.scene.physics.add.collider(this.npcGroup, this.scene.mapBoundaries);
        // }
    }

    createNPC(data) {
        // Cria uma cópia mutável dos dados do NPC
        let finalData = { ...data };

        // Se um groupId for fornecido, mescla as propriedades do grupo.
        // As propriedades individuais do NPC em config_missoes.js sobrescrevem as do grupo.
        if (finalData.groupId && window.npcGroupConfig && window.npcGroupConfig[finalData.groupId]) {
            const groupDefaults = window.npcGroupConfig[finalData.groupId];
            finalData = { ...groupDefaults, ...finalData };
        } else if (finalData.groupId) {
            console.warn(`NPCManager: Grupo '${finalData.groupId}' não encontrado em window.npcGroupConfig.`);
        }

        const npc = this.npcGroup.create(finalData.x, finalData.y, finalData.texture);
        npc.spawnData = data; // Salva configuração para respawn

        // Propriedades visuais e físicas
        npc.setScale(finalData.scale || 1);
        npc.setCollideWorldBounds(true);
        npc.setInteractive();

        // Configuração de Imobilidade (Adicionado)
        if (finalData.isImmovable) {
            npc.setImmovable(true);
            if (npc.body) {
                npc.body.allowGravity = false;
            }
        }

        // --- AJUSTE DE CORPO (HITBOX) ---
        if (finalData.bodyWidth !== undefined && finalData.bodyHeight !== undefined) {
            npc.body.setSize(finalData.bodyWidth, finalData.bodyHeight);
        }
        if (finalData.bodyOffset) {
            npc.body.setOffset(finalData.bodyOffset.x, finalData.bodyOffset.y);
        }

        // Dados de Jogo
        // --- LÓGICA DE NÍVEL ---
        const baseHp = 100;
        const baseDamage = 1;
        const baseCooldown = 1500; // Base cooldown
        const level = (finalData.level !== undefined) ? finalData.level : 1; // Default level 1
        
        // Cálculo: Base + 10% por nível
        const levelMultiplier = 1 + (level * 1.1);
        // Cálculo Velocidade: +5% por nível
        const speedMultiplier = 1 + (level * 0.01);
        
        const calculatedHp = Math.floor(baseHp * levelMultiplier);
        const calculatedDamage = Math.floor(baseDamage * levelMultiplier);
        
        // Aplica redução de cooldown baseada no nível, mesmo se houver valor fixo
        const sourceCooldown = (finalData.attackCooldown !== undefined) ? finalData.attackCooldown : baseCooldown;
        const calculatedCooldown = Math.floor(sourceCooldown / speedMultiplier);

        npc.level = level;
        npc.hp = (finalData.hp !== undefined) ? finalData.hp : calculatedHp;
        npc.maxHp = npc.hp;
        npc.speed = (finalData.speed !== undefined) ? finalData.speed : 60;
        npc.healthBarOffset = (finalData.healthBarOffset !== undefined) ? finalData.healthBarOffset : 40;
        npc.healthTextOffset = (finalData.healthTextOffset !== undefined) ? finalData.healthTextOffset : npc.healthBarOffset;
        npc.highlightOffset = (finalData.highlightOffset !== undefined) ? finalData.highlightOffset : 90;

        // IA e Combate
        npc.visionRadius = finalData.visionRadius || 200;
        npc.baseVisionRadius = npc.visionRadius; // Armazena o valor base para modificadores
        npc.attackRadius = finalData.attackRadius || 40;
        npc.damage = (finalData.damage !== undefined) ? finalData.damage : calculatedDamage;
        npc.attackCooldown = calculatedCooldown;
        npc.lastAttackTime = 0;
        npc.isProvoked = finalData.isProvoked || false;
        npc.isDead = false;
        npc.isTarget = finalData.isTarget || false;
        npc.isCivilian = finalData.isCivilian || false; // Nova flag para civis
        npc.disableFlee = finalData.disableFlee || false; // Nova flag para desativar fuga
        npc.triggersPunishment = finalData.triggersPunishment || false; // Nova flag para punição
        npc.isRanged = finalData.isRanged || false; // Nova flag para atiradores
        npc.shootType = finalData.shootType || 'raycast'; // 'raycast' ou 'projectile'
        npc.projectileSpeed = finalData.projectileSpeed || 400;
        npc.projectileTexture = finalData.projectileTexture || 'plasma_bullet';
        npc.projectileScale = (finalData.projectileScale !== undefined) ? finalData.projectileScale : 0.28;
        npc.projectileRotation = (finalData.projectileRotation !== undefined) ? finalData.projectileRotation : -1.57;
        npc.projectileLight = finalData.projectileLight;
        npc.beamOffsetX = finalData.beamOffsetX || 0;
        npc.beamOffsetY = finalData.beamOffsetY || 0;
        
        // Configuração do flash de disparo (Automático para Ranged)
        if (finalData.muzzleFlash) {
            npc.muzzleFlash = finalData.muzzleFlash;
        } else if (npc.isRanged) {
            npc.muzzleFlash = window.gameConfig.DEFAULT_NPC_MUZZLE_FLASH;
        }

        // Propriedades de Healer (Médico)
        npc.isHealer = finalData.isHealer || false;
        npc.healRadius = finalData.healRadius || 200;
        npc.healAmount = finalData.healAmount || 20;
        npc.healCooldown = finalData.healCooldown || 3000;
        npc.lastHealTime = 0;
        npc.lastDirection = 'down'; // Direção padrão inicial
        npc.isShooting = false; // Flag para controlar animação de tiro

        // --- PATRULHA ALEATÓRIA ---
        npc.startX = finalData.x; // Posição de origem (Home)
        npc.startY = finalData.y;
        npc.patrolRadius = finalData.patrolRadius || 200; // Raio de patrulha
        npc.nextPatrolTime = 0;
        npc.patrolTarget = null;

        npc.waypoints = finalData.waypoints || [];
        npc.currentWaypointIndex = 0;
        npc.waypointStartTime = 0;
        npc.waypointTimeout = 0;
        npc.isEnemy = !npc.isCivilian; // Civis não são inimigos
        npc.id = finalData.id;
        npc.groupId = finalData.groupId; // Define o grupo do NPC vindo da config
        npc.isInvulnerable = finalData.isInvulnerable || false; // Propriedade de invulnerabilidade
        npc.unlocks = finalData.unlocks; // Define qual ID este NPC desbloqueia ao morrer
        npc.healthBasedTint = finalData.healthBasedTint || false;

        // --- Pathfinding ---
        npc.path = null;
        npc.currentPathIndex = 0;
        npc.lastPathRecalc = 0;

        npc.originalTextureKey = finalData.texture; // Guarda a textura original para fallback de animação
        npc.frameRate = finalData.frameRate; // Armazena o frameRate específico da instância

        // --- WAYPOINT OFFSET (Ajuste de origem do movimento) ---
        npc.waypointOffset = finalData.waypointOffset || { x: 0, y: 0 };

        // --- ANGLE OFFSETS (Ajuste de rotação por direção) ---
        npc.angleOffsets = finalData.angleOffsets || {};

        // --- SCALE OFFSETS (Ajuste de escala por direção) ---
        npc.scaleOffsets = finalData.scaleOffsets || {};
        npc.baseScaleX = npc.scaleX;
        npc.baseScaleY = npc.scaleY;

        // --- SOMBRA ---
        if (finalData.hasShadow !== false) {
            npc.shadow = this.scene.add.ellipse(0, 0, 40, 20, 0x000000, 0.2)
                .setVisible(this.scene.showShadows || false);
        }

        // --- EFEITO DE FUMAÇA (se configurado) ---
        if (finalData.exhaustEffect && finalData.exhaustEffect.enabled) {
            npc.exhaustEmitter = this.scene.add.particles(0, 0, 'exhaust_smoke_particle', {
                speed: { min: 20, max: 50 },
                angle: { min: 250, max: 290 }, // Direcionado para cima e para trás
                scale: { start: 0.2, end: 2 },
                alpha: { start: 0.4, end: 0 },
                lifespan: 1200,
                frequency: 100,
                blendMode: 'NORMAL'
            });
            npc.exhaustEmitter.stop(); // Começa desligado
            npc.exhaustEffectConfig = finalData.exhaustEffect;
        }

        // --- FARÓIS (HEADLIGHTS) ---
        if (finalData.headlights && finalData.headlights.enabled) {
            npc.headlights = [];
            // Cria 2 feixes de luz (Esquerdo e Direito)
            for(let i=0; i<2; i++) {
                const beam = this.scene.add.image(0, 0, 'headlight_beam'); 
                beam.setOrigin(0, 0.5); // Origem na base do feixe
                beam.setBlendMode(Phaser.BlendModes.ADD);
                beam.setVisible(false); // Começa invisível
                npc.headlights.push(beam);
            }
            npc.headlightsConfig = finalData.headlights;
        }

        // Adiciona à lista de controle
        this.npcs.push(npc);

        // Barra de Vida
        npc.healthBar = this.scene.add.graphics();
        npc.healthText = null; // Texto para modo numérico
        this.drawHealthBar(npc);

        // --- DEBUG DE DIREÇÃO ---
        const debugTextStyle = {
            fontSize: '12px',
            stroke: '#000000',
            strokeThickness: 2,
            fontStyle: 'bold'
        };

        npc.dirDebugText = this.scene.add.text(npc.x, npc.y - 60, '', {
            ...debugTextStyle,
            fill: '#00ff00' // Verde para direção
        }).setOrigin(0.5).setDepth(10000).setVisible(false);

        npc.animDebugText = this.scene.add.text(npc.x, npc.y - 48, '', {
            ...debugTextStyle,
            fill: '#ffff00' // Amarelo para chave de animação
        }).setOrigin(0.5).setDepth(10000).setVisible(false);

        return npc;
    }

    createAnimations() {
        // Cria animações básicas baseadas nas texturas carregadas
        // Exemplo genérico: Down (0-3), Left (4-7), Right (8-11), Up (12-15)
        // Ajuste os frames conforme seu spritesheet real

        const createAnim = (data) => {
            const key = data.texture;
            if (!key) return;

            if (data.animationFrames) {
                const { down, left, right, up, down_left, down_right, up_left, up_right, morto, idle, idle_down, idle_left, idle_right, idle_up, shoot_down, shoot_left, shoot_right, shoot_up, shoot_up_left, shoot_up_right, shoot_down_left, shoot_down_right } = data.animationFrames;
                const frameRate = data.frameRate || 8;

                if (down && !this.scene.anims.exists(`${key}_down`)) this.scene.anims.create({ key: `${key}_down`, frames: this.scene.anims.generateFrameNumbers(key, { frames: down }), frameRate, repeat: -1 });
                if (left && !this.scene.anims.exists(`${key}_left`)) this.scene.anims.create({ key: `${key}_left`, frames: this.scene.anims.generateFrameNumbers(key, { frames: left }), frameRate, repeat: -1 });
                if (right && !this.scene.anims.exists(`${key}_right`)) this.scene.anims.create({ key: `${key}_right`, frames: this.scene.anims.generateFrameNumbers(key, { frames: right }), frameRate, repeat: -1 });
                if (up && !this.scene.anims.exists(`${key}_up`)) this.scene.anims.create({ key: `${key}_up`, frames: this.scene.anims.generateFrameNumbers(key, { frames: up }), frameRate, repeat: -1 });
                if (down_left && !this.scene.anims.exists(`${key}_down_left`)) this.scene.anims.create({ key: `${key}_down_left`, frames: this.scene.anims.generateFrameNumbers(key, { frames: down_left }), frameRate, repeat: -1 });
                if (down_right && !this.scene.anims.exists(`${key}_down_right`)) this.scene.anims.create({ key: `${key}_down_right`, frames: this.scene.anims.generateFrameNumbers(key, { frames: down_right }), frameRate, repeat: -1 });
                if (up_left && !this.scene.anims.exists(`${key}_up_left`)) this.scene.anims.create({ key: `${key}_up_left`, frames: this.scene.anims.generateFrameNumbers(key, { frames: up_left }), frameRate, repeat: -1 });
                if (up_right && !this.scene.anims.exists(`${key}_up_right`)) this.scene.anims.create({ key: `${key}_up_right`, frames: this.scene.anims.generateFrameNumbers(key, { frames: up_right }), frameRate, repeat: -1 });
                if (morto && !this.scene.anims.exists(`${key}_morto`)) this.scene.anims.create({ key: `${key}_morto`, frames: this.scene.anims.generateFrameNumbers(key, { frames: morto }), frameRate, repeat: 0 });
                if (idle && !this.scene.anims.exists(`${key}_idle`)) this.scene.anims.create({ key: `${key}_idle`, frames: this.scene.anims.generateFrameNumbers(key, { frames: idle }), frameRate, repeat: -1 });
                if (idle_down && !this.scene.anims.exists(`${key}_idle_down`)) this.scene.anims.create({ key: `${key}_idle_down`, frames: this.scene.anims.generateFrameNumbers(key, { frames: idle_down }), frameRate, repeat: -1 });
                if (idle_left && !this.scene.anims.exists(`${key}_idle_left`)) this.scene.anims.create({ key: `${key}_idle_left`, frames: this.scene.anims.generateFrameNumbers(key, { frames: idle_left }), frameRate, repeat: -1 });
                if (idle_right && !this.scene.anims.exists(`${key}_idle_right`)) this.scene.anims.create({ key: `${key}_idle_right`, frames: this.scene.anims.generateFrameNumbers(key, { frames: idle_right }), frameRate, repeat: -1 });
                if (idle_up && !this.scene.anims.exists(`${key}_idle_up`)) this.scene.anims.create({ key: `${key}_idle_up`, frames: this.scene.anims.generateFrameNumbers(key, { frames: idle_up }), frameRate, repeat: -1 });
                if (shoot_down && !this.scene.anims.exists(`${key}_shoot_down`)) this.scene.anims.create({ key: `${key}_shoot_down`, frames: this.scene.anims.generateFrameNumbers(key, { frames: shoot_down }), frameRate, repeat: 0 });
                if (shoot_left && !this.scene.anims.exists(`${key}_shoot_left`)) this.scene.anims.create({ key: `${key}_shoot_left`, frames: this.scene.anims.generateFrameNumbers(key, { frames: shoot_left }), frameRate, repeat: 0 });
                if (shoot_right && !this.scene.anims.exists(`${key}_shoot_right`)) this.scene.anims.create({ key: `${key}_shoot_right`, frames: this.scene.anims.generateFrameNumbers(key, { frames: shoot_right }), frameRate, repeat: 0 });
                if (shoot_up && !this.scene.anims.exists(`${key}_shoot_up`)) this.scene.anims.create({ key: `${key}_shoot_up`, frames: this.scene.anims.generateFrameNumbers(key, { frames: shoot_up }), frameRate, repeat: 0 });
                if (shoot_up_left && !this.scene.anims.exists(`${key}_shoot_up_left`)) this.scene.anims.create({ key: `${key}_shoot_up_left`, frames: this.scene.anims.generateFrameNumbers(key, { frames: shoot_up_left }), frameRate, repeat: 0 });
                if (shoot_up_right && !this.scene.anims.exists(`${key}_shoot_up_right`)) this.scene.anims.create({ key: `${key}_shoot_up_right`, frames: this.scene.anims.generateFrameNumbers(key, { frames: shoot_up_right }), frameRate, repeat: 0 });
                if (shoot_down_left && !this.scene.anims.exists(`${key}_shoot_down_left`)) this.scene.anims.create({ key: `${key}_shoot_down_left`, frames: this.scene.anims.generateFrameNumbers(key, { frames: shoot_down_left }), frameRate, repeat: 0 });
                if (shoot_down_right && !this.scene.anims.exists(`${key}_shoot_down_right`)) this.scene.anims.create({ key: `${key}_shoot_down_right`, frames: this.scene.anims.generateFrameNumbers(key, { frames: shoot_down_right }), frameRate, repeat: 0 });
            }
        };

        if (window.gameConfig.NPCS) {
            window.gameConfig.NPCS.forEach(createAnim);
        }

        // Cria animações para NPCs definidos nos passos da missão (Spawn Dinâmico)
        if (window.missionConfig && window.missionConfig.OBJECTIVES && window.missionConfig.OBJECTIVES.steps) {
            window.missionConfig.OBJECTIVES.steps.forEach(step => {
                if (step.spawnNpcs) {
                    step.spawnNpcs.forEach(createAnim);
                }
            });
        }

        // Cria animações para NPCs de punição
        if (window.missionConfig && window.missionConfig.OBJECTIVES && window.missionConfig.OBJECTIVES.punishments) {
            const punishments = window.missionConfig.OBJECTIVES.punishments;
            Object.values(punishments).forEach(npcList => {
                if (Array.isArray(npcList)) {
                    npcList.forEach(createAnim);
                }
            });
        }
    }

    updateNpcVision(isInstance, isStealth) {
        const stealthReduction = window.gameConfig.STEALTH_VISION_REDUCTION || 0.7;
        this.npcs.forEach(npc => {
            if (npc.baseVisionRadius) {
                let vision = npc.baseVisionRadius;
                // Modo Instância aumenta a visão
                if (isInstance) {
                    vision *= 1.10;
                }
                // Modo Furtivo reduz a visão
                if (isStealth) {
                    vision *= (1 - stealthReduction);
                }
                npc.visionRadius = vision;
            }
        });
    }

    toggleShadows(visible) {
        this.npcs.forEach(npc => {
            if (npc.shadow) npc.shadow.setVisible(visible);
        });
    }

    toggleDebug(forceState = null) {
        if (forceState !== null) {
            this.isDebugVisible = forceState;
        } else {
            this.isDebugVisible = !this.isDebugVisible;
        }

        if (!this.isDebugVisible) {
            this.debugGraphics.clear();
        }
        return this.isDebugVisible;
    }

    toggleVisionDebug() {
        this.isVisionDebugVisible = !this.isVisionDebugVisible;
        if (!this.isDebugVisible && !this.isVisionDebugVisible) {
            this.debugGraphics.clear();
        }
        return this.isVisionDebugVisible;
    }

    toggleTargetDebug() {
        this.isTargetDebugVisible = !this.isTargetDebugVisible;
        if (!this.isDebugVisible && !this.isVisionDebugVisible && !this.isTargetDebugVisible) {
            this.debugGraphics.clear();
        }
        return this.isTargetDebugVisible;
    }

    toggleDirectionDebug() {
        this.isDirectionDebugVisible = !this.isDirectionDebugVisible;
        if (!this.isDirectionDebugVisible) {
            this.npcs.forEach(npc => {
                if (npc.dirDebugText) {
                    npc.dirDebugText.setVisible(false);
                }
                if (npc.animDebugText) {
                    npc.animDebugText.setVisible(false);
                }
            });
        }
        return this.isDirectionDebugVisible;
    }

    drawDebug(npc) {
        const g = this.debugGraphics;

        // Debug de Waypoints (Tecla I)
        if (this.isDebugVisible) {
            // Desenha linha até o destino atual (Waypoint ou Patrulha)
            if (npc.waypoints && npc.waypoints.length > 0) {
                // Caminho completo dos waypoints (Ciano)
                g.lineStyle(1, 0x00ffff, 0.5);
                for (let i = 0; i < npc.waypoints.length; i++) {
                    const p1 = npc.waypoints[i];
                    const p2 = npc.waypoints[(i + 1) % npc.waypoints.length];
                    g.strokeCircle(p1.x, p1.y, 3);
                    g.lineBetween(p1.x, p1.y, p2.x, p2.y);
                }

                // Linha para o alvo atual (Verde)
                const target = npc.waypoints[npc.currentWaypointIndex];
                if (target) {
                    g.lineStyle(2, 0x00ff00, 0.8);
                    g.lineBetween(npc.x, npc.y, target.x, target.y);
                    g.fillStyle(0x00ff00, 1);
                    g.fillCircle(target.x, target.y, 4);
                }
            } else if (npc.patrolTarget) {
                // Linha para alvo de patrulha aleatória (Magenta)
                g.lineStyle(2, 0xff00ff, 0.8);
                g.lineBetween(npc.x, npc.y, npc.patrolTarget.x, npc.patrolTarget.y);
                g.strokeCircle(npc.patrolTarget.x, npc.patrolTarget.y, 4);
            }
        }

        // Debug de Visão e Ataque (Tecla P)
        if (this.isVisionDebugVisible) {
            // Área de Visão (Amarelo)
            g.lineStyle(1, 0xffff00, 0.3);
            g.strokeCircle(npc.x, npc.y, npc.visionRadius);

            // Área de Ataque (Vermelho)
            g.lineStyle(1, 0xff0000, 0.5);
            g.strokeCircle(npc.x, npc.y, npc.attackRadius);

            // --- Cone de Visão (FOV) para Inimigos ---
            if (!npc.isCivilian) {
                let angle = 0;
                if (npc.currentTarget) {
                    angle = Phaser.Math.Angle.Between(npc.x, npc.y, npc.currentTarget.x, npc.currentTarget.y);
                } else if (npc.body && npc.body.velocity.length() > 10) {
                    angle = npc.body.velocity.angle();
                } else if (npc.lastDirection) {
                    const dirMap = {
                        'right': 0, 'down_right': Math.PI/4, 'down': Math.PI/2, 'down_left': 3*Math.PI/4,
                        'left': Math.PI, 'up_left': -3*Math.PI/4, 'up': -Math.PI/2, 'up_right': -Math.PI/4
                    };
                    if (dirMap[npc.lastDirection] !== undefined) angle = dirMap[npc.lastDirection];
                }

                const fov = Math.PI / 2; // 90 graus
                g.fillStyle(0xffff00, 0.15); // Amarelo translúcido
                g.beginPath();
                g.moveTo(npc.x, npc.y);
                g.arc(npc.x, npc.y, npc.visionRadius, angle - fov / 2, angle + fov / 2);
                g.closePath();
                g.fillPath();
            }
        }

        // Debug de Target Lines (Linhas até o alvo)
        if (this.isTargetDebugVisible && npc.currentTarget && npc.currentTarget.health > 0) {
            // Linha Magenta conectando NPC ao Alvo
            g.lineStyle(2, 0xff00ff, 0.7);
            g.lineBetween(npc.x, npc.y, npc.currentTarget.x, npc.currentTarget.y);
        }
    }

    notifyGunshot(x, y, range = 300) {
        this.npcs.forEach(npc => {
            if (npc.active && !npc.isDead && npc.isCivilian) {
                if (npc.disableFlee) return;

                const dist = Phaser.Math.Distance.Between(x, y, npc.x, npc.y);
                if (dist <= range) {
                    npc.isFleeing = true;
                    npc.fleeSource = { x, y };
                    npc.fleeTimer = 3000 + Math.random() * 2000; // Foge por 3-5 segundos
                    if (!npc.originalSpeed) npc.originalSpeed = npc.speed;
                    npc.speed = npc.originalSpeed * 1.8; // Corre mais rápido
                    
                    this.showFloatingText(npc.x, npc.y - 60, "!", '#ffff00');
                }
            }
        });
    }

    update(time, delta) {
        if (this.isDebugVisible || this.isVisionDebugVisible || this.isTargetDebugVisible) this.debugGraphics.clear();

        // Colisão Projéteis NPC x Jogadores
        if (this.npcProjectiles.getLength() > 0) {
            const playerSprites = this.scene.players.filter(p => p.health > 0 && p.sprite && p.sprite.active).map(p => p.sprite);
            if (playerSprites.length > 0) {
                this.scene.physics.overlap(this.npcProjectiles, playerSprites, (proj, playerSprite) => {
                    const player = this.scene.players.find(p => p.sprite === playerSprite);
                    if (player) {
                        this.onNpcProjectileHit(proj, player);
                    }
                });
            }

            // Colisão Projéteis NPC x Cenário
            const obstacleGroups = [];
            if (this.scene.scenarioManager && this.scene.scenarioManager.getObstacles) obstacleGroups.push(this.scene.scenarioManager.getObstacles());
            if (this.scene.interiorsManager && this.scene.interiorsManager.getObstacles) obstacleGroups.push(this.scene.interiorsManager.getObstacles());
            obstacleGroups.forEach(grp => {
                if (grp) this.scene.physics.collide(this.npcProjectiles, grp, (proj) => proj.destroy());
            });
        }

        this.npcs.forEach(npc => {
            if (!npc.active) return;

            // Depth Sort (2.5D)
            npc.setDepth(npc.y);

            // Atualiza posição da sombra
            if (npc.shadow && npc.shadow.visible) {
                const footY = npc.y + (npc.displayHeight / 2) - 5;
                npc.shadow.setPosition(npc.x, footY);
                npc.shadow.setDepth(npc.y - 1);
            }

            // Atualiza posição da seta de objetivo (com animação de flutuar)
            if (npc.objectiveMarker && npc.objectiveMarker.visible) {
                const floatOffset = Math.sin(time / 150) * 5;
                const highlightOff = (npc.highlightOffset !== undefined) ? npc.highlightOffset : 90;
                npc.objectiveMarker.setPosition(npc.x, npc.y - highlightOff + floatOffset);
                npc.objectiveMarker.setDepth(9999); // Sempre no topo
            }

            // Atualiza efeito de fumaça do escapamento
            if (npc.exhaustEmitter) {
                const isMoving = npc.body.velocity.length() > 10;
                // Ativa se estiver movendo E o toggle global estiver ligado
                if (isMoving && this.scene.showExhaustSmoke) {
                    let direction = 'down_right'; // Padrão
                    if (npc.anims.currentAnim) {
                        const keyParts = npc.anims.currentAnim.key.split('_');
                        // Pega a parte da direção, ex: 'carro_1_down_right' -> 'down_right'
                        if (keyParts.length > 2) {
                            direction = keyParts.slice(2).join('_');
                        }
                    }

                    const offsetConfig = npc.exhaustEffectConfig.offsets[direction];
                    if (offsetConfig) {
                        const exhaustX = npc.x + offsetConfig.x;
                        const exhaustY = npc.y + offsetConfig.y;

                        npc.exhaustEmitter.setPosition(exhaustX, exhaustY);
                        npc.exhaustEmitter.setDepth(npc.depth - 1); // Fumaça atrás do veículo

                        if (!npc.exhaustEmitter.emitting) npc.exhaustEmitter.start();
                    }
                } else {
                    // Para a fumaça se o carro parar ou o efeito for desligado globalmente
                    if (npc.exhaustEmitter.emitting) npc.exhaustEmitter.stop();
                }
            }

            // --- ATUALIZA FARÓIS ---
            if (npc.headlights) {
                let direction = 'down_right'; // Padrão
                if (npc.anims.currentAnim) {
                    const keyParts = npc.anims.currentAnim.key.split('_');
                    // Pega a parte da direção. Ex: 'CARRO_1_down_right' -> 'down_right'
                    if (keyParts.length > 2) {
                        direction = keyParts.slice(2).join('_');
                    }
                }

                const config = npc.headlightsConfig.offsets[direction];
                if (config) {
                    npc.headlights.forEach((beam, index) => {
                        const pos = config[index];
                        if (pos) {
                            beam.setPosition(npc.x + pos.x, npc.y + pos.y);
                            beam.setAngle(pos.angle);
                            // Ajusta profundidade para ficar acima do chão mas abaixo de objetos altos se necessário
                            beam.setDepth(npc.depth + (pos.depthOffset || 1));
                            beam.setVisible(true);
                            // Efeito de tremulação leve
                            beam.setAlpha(0.4 + Math.random() * 0.05);
                        } else {
                            beam.setVisible(false);
                        }
                    });
                } else {
                    npc.headlights.forEach(beam => beam.setVisible(false));
                }
            }

            const mode = this.scene.healthDisplayMode || 'default';
            const barOffset = (npc.healthBarOffset !== undefined) ? npc.healthBarOffset : 40;
            const textOffset = (npc.healthTextOffset !== undefined) ? npc.healthTextOffset : barOffset;
            
            let barY = npc.y - barOffset;
            let textY = npc.y - textOffset;

            if (mode === 'both') {
                if (barOffset === textOffset) {
                    textY = npc.y - (textOffset + 20);
                    barY = npc.y - (barOffset + 10);
                }
            }

            if (npc.healthBar && npc.healthBar.visible) {
                npc.healthBar.setPosition(npc.x, barY);
                npc.healthBar.setDepth(npc.y + 1);
            }
            if (npc.healthText && npc.healthText.visible) {
                npc.healthText.setPosition(npc.x, textY);
                npc.healthText.setDepth(npc.y + 1);
            }

            // --- ATUALIZA DEBUG DE DIREÇÃO ---
            if (this.isDirectionDebugVisible && npc.active && !npc.isDead) {
                const yOffset = npc.healthBarOffset || 40;
                const dirY = npc.y - yOffset - 22;
                const animY = npc.y - yOffset - 10;

                if (npc.dirDebugText) {
                    const direction = `DIR: ${(npc.lastDirection || 'idle').toUpperCase()}`;
                    npc.dirDebugText.setText(direction);
                    npc.dirDebugText.setPosition(npc.x, dirY);
                    npc.dirDebugText.setDepth(npc.y + 100);
                    npc.dirDebugText.setVisible(true);
                }
                if (npc.animDebugText) {
                    const animKey = (npc.anims && npc.anims.currentAnim) ? npc.anims.currentAnim.key : 'none';
                    npc.animDebugText.setText(`ANIM: ${animKey}`);
                    npc.animDebugText.setPosition(npc.x, animY);
                    npc.animDebugText.setDepth(npc.y + 100);
                    npc.animDebugText.setVisible(true);
                }
            } else {
                if (npc.dirDebugText && npc.dirDebugText.visible) npc.dirDebugText.setVisible(false);
                if (npc.animDebugText && npc.animDebugText.visible) npc.animDebugText.setVisible(false);
            }

            // Lógica de Healer (Médico)
            if (npc.isHealer && !npc.isDead) {
                this.updateHealer(npc, time);
            }

            // Se estiver sob efeito de knockback, pula a lógica de movimento da IA para não cancelar o empurrão
            if (npc.isKnockedBack) return;

            // --- Lógica de Fuga (Civis) ---
            if (npc.isFleeing) {
                npc.fleeTimer -= delta;
                if (npc.fleeTimer <= 0) {
                    npc.isFleeing = false;
                    npc.speed = npc.originalSpeed || 60;
                    npc.body.setVelocity(0);
                } else {
                    // Foge da fonte do som
                    const angle = Phaser.Math.Angle.Between(npc.fleeSource.x, npc.fleeSource.y, npc.x, npc.y);
                    this.scene.physics.velocityFromRotation(angle, npc.speed, npc.body.velocity);
                    this.updateAnimation(npc);
                    return; // Pula o resto da IA (waypoints/patrulha)
                }
            }

            // --- Lógica de Queimadura (Burn) ---
            if (npc.isBurning) {
                npc.burnDuration -= delta;
                npc.burnTimer = (npc.burnTimer || 0) + delta;
                
                if (npc.burnTimer >= 500) { // Dano a cada 0.5s
                    npc.burnTimer = 0;
                    this.takeDamage(npc, npc.burnDamage, npc.burnSource);
                }
                
                if (npc.burnDuration <= 0) {
                    this.removeBurn(npc);
                }
            }
            // -----------------------------------

            // IA: Perseguição e Ataque
            let isChasing = false;
            let isFacingTarget = false;
            npc.currentTarget = null; // Reseta o alvo para debug a cada frame

            // Civis não perseguem nem atacam
            if (!npc.isCivilian) {
                let target = null;
                // Aplica o cheat de visão se estiver ativo (0 se desligado, normal se ligado)
                const currentVision = this.scene.disableEnemyVision ? 0 : npc.visionRadius;
                let minDist = npc.isProvoked ? Infinity : currentVision;

                // Procura o jogador mais próximo
                if (this.scene.players) {
                    this.scene.players.forEach(player => {
                        if (player.sprite && player.sprite.active && player.health > 0) {
                            const dist = Phaser.Math.Distance.Between(npc.x, npc.y, player.x, player.y);
                            if (dist < minDist) {
                                minDist = dist;
                                target = player;
                            }
                        }
                    });
                }

                if (target) {
                    npc.currentTarget = target; // Armazena o alvo encontrado para debug
                    isChasing = true;

                    // Se for uma torre (speed 0) ou estiver atacando, olha para o alvo
                    if (npc.speed === 0 || minDist <= npc.attackRadius) {
                        this.faceTarget(npc, target);
                        isFacingTarget = true;
                    }

                    if (minDist <= npc.attackRadius) {
                        npc.body.setVelocity(0);
                        npc.path = null; // Limpa o caminho ao chegar no alcance de ataque
                        this.tryAttack(npc, target, time);
                    } else {
                        // --- LÓGICA DE PERSEGUIÇÃO COM A* ---
                        if (npc.speed > 0) {
                            const pathRecalcInterval = 1000; // Recalcula o caminho a cada 1 segundo

                            // Verifica se é hora de recalcular o caminho
                            if (time > (npc.lastPathRecalc || 0) + pathRecalcInterval) {
                                npc.lastPathRecalc = time;
                                this.scene.gridManager.findPath(npc.x, npc.y, target.x, target.y, (path) => {
                                    if (path && path.length > 1) {
                                        npc.path = path;
                                        npc.currentPathIndex = 1; // Começa a se mover para o segundo ponto do caminho
                                    } else {
                                        npc.path = null; // Nenhum caminho encontrado
                                    }
                                });
                            }

                            // Se um caminho existe, segue-o
                            if (npc.path && npc.path.length > npc.currentPathIndex) {
                                const nextPoint = npc.path[npc.currentPathIndex];
                                this.scene.physics.moveTo(npc, nextPoint.x, nextPoint.y, npc.speed);

                                const distanceToNextPoint = Phaser.Math.Distance.Between(npc.x, npc.y, nextPoint.x, nextPoint.y);
                                if (distanceToNextPoint < 10) {
                                    npc.currentPathIndex++;
                                    if (npc.currentPathIndex >= npc.path.length) {
                                        npc.path = null; // Chegou ao fim, força recalcular
                                    }
                                }
                            } else {
                                // Se não houver caminho, para e espera o próximo recalculo
                                npc.body.setVelocity(0);
                            }

                            // Lógica de Grupo: Cercar o jogador
                            if (npc.groupId) {
                                const groupMembers = this.npcs.filter(n => n.groupId === npc.groupId && n.active && !n.isDead);
                                const count = groupMembers.length;

                                if (count > 1) {
                                    const index = groupMembers.indexOf(npc);
                                    const radius = Math.max(60, npc.attackRadius * 0.8); // Raio do cerco (80% do alcance de ataque)
                                    const angle = (Math.PI * 2 / count) * index;

                                    // A lógica de pathfinding já mira no alvo, o cerco pode ser uma melhoria futura
                                }
                            }
                        } else {
                            npc.body.setVelocity(0);
                        }
                    }
                }
            }

            // Lógica de Waypoints (apenas se não estiver perseguindo)
            if (!isChasing) {
                npc.path = null; // Limpa o caminho se perder o alvo
                if (npc.waypoints.length > 0 && npc.speed > 0) {
                    const target = npc.waypoints[npc.currentWaypointIndex];

                    // Ajuste de origem do waypoint (ex: pés ou base do carro)
                    const offX = npc.waypointOffset ? npc.waypointOffset.x : 0;
                    const offY = npc.waypointOffset ? npc.waypointOffset.y : 0;
                    
                    // O alvo para o centro do corpo é (Target - Offset)
                    const moveX = target.x - offX;
                    const moveY = target.y - offY;

                    // Move para o waypoint ajustado
                    this.scene.physics.moveTo(npc, moveX, moveY, npc.speed);

                    if (!npc.waypointStartTime) {
                        npc.waypointStartTime = time;
                        // Calcula timeout dinâmico: (distância / velocidade) * 1000 para ms
                        // Adiciona margem de segurança: dobro do tempo necessário + 5 segundos
                        const totalDist = Phaser.Math.Distance.Between(npc.x, npc.y, moveX, moveY);
                        const minTime = (totalDist / npc.speed) * 1000;
                        npc.waypointTimeout = minTime * 2 + 5000;
                    }

                    const isBlocked = npc.body.blocked.left || npc.body.blocked.right || npc.body.blocked.up || npc.body.blocked.down;

                    // Verifica distância para trocar de waypoint
                    // Verifica se o ponto de origem (npc + offset) chegou no target
                    const dist = Phaser.Math.Distance.Between(npc.x + offX, npc.y + offY, target.x, target.y);
                    
                    if (dist < 5 || isBlocked || (time - npc.waypointStartTime > npc.waypointTimeout)) {
                        npc.currentWaypointIndex++;
                        if (npc.currentWaypointIndex >= npc.waypoints.length) {
                            npc.currentWaypointIndex = 0; // Loop
                        }
                        npc.waypointStartTime = 0; // Reseta o timer para o próximo waypoint
                        npc.waypointTimeout = 0;

                        if (isBlocked) {
                            // Para imediatamente para recalcular o caminho para o próximo waypoint
                            npc.body.setVelocity(0);
                        }
                    }
                } else if (npc.speed > 0) {
                    // --- PATRULHA ALEATÓRIA (Se não tiver waypoints) ---
                    if (npc.patrolTarget) {
                        // Move para o ponto de patrulha (velocidade reduzida para parecer mais natural)
                        this.scene.physics.moveTo(npc, npc.patrolTarget.x, npc.patrolTarget.y, npc.speed * 0.5);

                        const dist = Phaser.Math.Distance.Between(npc.x, npc.y, npc.patrolTarget.x, npc.patrolTarget.y);

                        // Inicializa tempo de início da patrulha se não existir
                        if (!npc.patrolStartTime) npc.patrolStartTime = time;

                        // Verifica se está bloqueado (bateu em parede/borda)
                        const isBlocked = npc.body.blocked.left || npc.body.blocked.right || npc.body.blocked.up || npc.body.blocked.down;

                        // Se chegou perto (10px) 
                        // OU se demorou muito (reduzido para 8s)
                        // OU se bateu em algo (isBlocked)
                        if (dist < 10 || (time - npc.patrolStartTime > 8000) || isBlocked) {
                            npc.body.setVelocity(0);
                            npc.patrolTarget = null;
                            npc.patrolStartTime = 0;

                            if (isBlocked) {
                                // Se foi bloqueado, tenta sair quase imediatamente (0.1s a 0.5s)
                                npc.nextPatrolTime = time + 100 + Math.random() * 400;
                            } else {
                                // Se chegou ao destino, espera um pouco menos que antes (1s a 3s)
                                npc.nextPatrolTime = time + 1000 + Math.random() * 2000;
                            }
                        }
                    } else {
                        npc.body.setVelocity(0);
                        if (time > npc.nextPatrolTime) {
                            // Escolhe novo ponto aleatório ao redor da posição inicial (Home)
                            const angle = Math.random() * Math.PI * 2;
                            const r = Math.random() * npc.patrolRadius;
                            let destX = npc.startX + Math.cos(angle) * r;
                            let destY = npc.startY + Math.sin(angle) * r;

                            // Garante que o ponto de patrulha esteja dentro do mapa
                            const mapW = window.gameConfig.MAP_WIDTH || 5000;
                            const mapH = window.gameConfig.MAP_HEIGHT || 5000;
                            const margin = 150; // Aumentado para evitar que NPCs grandes fiquem presos na borda

                            destX = Phaser.Math.Clamp(destX, margin, mapW - margin);
                            destY = Phaser.Math.Clamp(destY, margin, mapH - margin);

                            npc.patrolTarget = { x: destX, y: destY };
                            npc.patrolStartTime = time; // Marca o início do movimento
                        }
                    }
                } else {
                    // Para se for estático (speed 0)
                    npc.body.setVelocity(0);
                }
            }

            // --- LÓGICA DE DERRAPAGEM (SKID MARKS) ---
            if (npc.body && npc.body.speed > 80) { // Apenas se estiver rápido
                const currentAngle = Math.atan2(npc.body.velocity.y, npc.body.velocity.x);
                
                if (npc.lastMoveAngle !== undefined) {
                    const diff = Phaser.Math.Angle.Wrap(currentAngle - npc.lastMoveAngle);
                    // Se a mudança de ângulo for brusca (> 0.08 rad ~= 4.5 graus)
                    if (Math.abs(diff) > 0.08) {
                        this.createSkidMarks(npc);
                    }
                }
                npc.lastMoveAngle = currentAngle;
            }

            // --- DEBUG DRAWING ---
            if ((this.isDebugVisible || this.isVisionDebugVisible || this.isTargetDebugVisible) && npc.active && !npc.isDead) {
                this.drawDebug(npc);
            }

            // Animação baseada na velocidade
            this.updateAnimation(npc, isFacingTarget);
        });
    }

    tryAttack(npc, target, time) {
        if (time > npc.lastAttackTime + npc.attackCooldown) {
            npc.lastAttackTime = time;

            // Aplica dano se o alvo tiver método de receber dano
            // Antes de aplicar dano, verifica se a linha de visão está livre
            let blocked = false;
            try {
                if (this.scene && this.scene.unitController && typeof this.scene.unitController.isLineBlocked === 'function') {
                    blocked = this.scene.unitController.isLineBlocked(npc.x, npc.y, target.x, target.y);
                }
            } catch (e) { blocked = false; }

            if (blocked) {
                if (this.scene && typeof this.scene.showWarning === 'function') this.scene.showWarning('TIRO BLOQUEADO');
                return; // Não aplica dano nem visual de tiro
            }

            if (npc.isRanged) {
                // --- ATAQUE À DISTÂNCIA ---
                const startX = npc.x + (npc.beamOffsetX || 0);
                const startY = npc.y + (npc.beamOffsetY || 0);
                const targetX = target.x;
                const targetY = target.y;

                // --- ANIMAÇÃO DE TIRO ---
                const angle = Phaser.Math.Angle.Between(npc.x, npc.y, target.x, target.y);
                const deg = Phaser.Math.RadToDeg(angle);
                let animDir = 'down';

                if (deg >= -22.5 && deg <= 22.5) animDir = 'right';
                else if (deg > 22.5 && deg < 67.5) animDir = 'down_right';
                else if (deg >= 67.5 && deg <= 112.5) animDir = 'down';
                else if (deg > 112.5 && deg < 157.5) animDir = 'down_left';
                else if (deg >= 157.5 || deg <= -157.5) animDir = 'left';
                else if (deg > -157.5 && deg < -112.5) animDir = 'up_left';
                else if (deg >= -112.5 && deg <= -67.5) animDir = 'up';
                else if (deg > -67.5 && deg < -22.5) animDir = 'up_right';

                const shootKey = `${npc.texture.key}_shoot_${animDir}`;
                if (this.scene.anims.exists(shootKey)) {
                    npc.isShooting = true;
                    if (npc.frameRate) {
                        if (!npc.anims.isPlaying || npc.anims.currentAnim.key !== shootKey) {
                            const animObj = this.scene.anims.get(shootKey);
                            npc.play({ key: shootKey, frameRate: npc.frameRate, repeat: animObj ? animObj.repeat : 0 });
                        }
                    } else {
                        npc.play(shootKey, true);
                    }
                    // Quando a animação terminar, libera para andar/idle novamente
                    npc.once('animationcomplete', () => { npc.isShooting = false; });
                }

                // Som de tiro
                if (this.scene.soundManager) this.scene.soundManager.playShoot();

                // Notifica tiro para civis fugirem
                this.notifyGunshot(npc.x, npc.y);

                // --- EFEITO DE RECUO (KNOCKBACK) ---
                const knockbackAngle = Phaser.Math.Angle.Between(targetX, targetY, npc.x, npc.y);
                const knockbackDistance = 2;
                this.scene.tweens.add({
                    targets: npc,
                    x: npc.x + Math.cos(knockbackAngle) * knockbackDistance,
                    y: npc.y + Math.sin(knockbackAngle) * knockbackDistance,
                    duration: 25,
                    yoyo: true,
                    ease: 'Sine.easeInOut'
                });

                // --- EFEITO DE CÁPSULA (SHELL CASING) ---
                this.scene.shotManager.createShellCasing(npc.x, npc.y);

                this.scene.shotManager.fire({
                    shootType: npc.shootType,
                    startX: startX,
                    startY: startY,
                    targetX: targetX,
                    targetY: targetY,
                    damage: npc.damage,
                    isCritical: false,
                    source: npc,
                    target: target,
                    config: npc,
                    projectileGroup: this.npcProjectiles
                });
            } else {
                // --- ATAQUE CORPO A CORPO (MELEE) ---
                if (target.takeDamage) {
                    target.takeDamage(npc.damage);
                }
                // Feedback visual (pequeno "pulo" na direção do alvo)
                this.scene.tweens.add({
                    targets: npc,
                    x: npc.x + (target.x - npc.x) * 0.2,
                    y: npc.y + (target.y - npc.y) * 0.2,
                    duration: 100,
                    yoyo: true
                });
            }
        }
    }

    createSkidMarks(npc) {
        // Calcula vetor perpendicular à direção do movimento para posicionar as marcas nas rodas
        const angle = Math.atan2(npc.body.velocity.y, npc.body.velocity.x);
        const perpAngle = angle + Math.PI / 2;
        
        // Distância das rodas em relação ao centro (ajuste conforme a largura do corpo)
        // Usa metade da largura do corpo como base, ou um valor fixo se não tiver corpo
        const offsetDist = (npc.body ? npc.body.width / 2 : 20) * 0.8; 
        
        const offX = Math.cos(perpAngle) * offsetDist;
        const offY = Math.sin(perpAngle) * offsetDist;
        
        // Roda Esquerda e Direita
        this.spawnSkidMark(npc.x + offX, npc.y + offY);
        this.spawnSkidMark(npc.x - offX, npc.y - offY);
    }

    spawnSkidMark(x, y) {
        const mark = this.scene.add.image(x, y, 'skid_mark');
        mark.setDepth(1); // No chão (acima do bg, abaixo de tudo)
        mark.setAlpha(0.5);
        
        this.scene.tweens.add({
            targets: mark,
            alpha: 0,
            duration: 2000, // Desaparece em 2 segundos
            onComplete: () => mark.destroy()
        });
    }

    onNpcProjectileHit(projectile, player) {
        if (!projectile.active) return;

        if (player && player.takeDamage) {
            player.takeDamage(projectile.damage);
        }

        // Se for tiro de Torre, cria explosão
        if (projectile.source && projectile.source.id && projectile.source.id.includes('torre')) {
            this.scene.shotManager.createExplosionEffect(projectile.x, projectile.y);
        }

        projectile.destroy();
    }

    faceTarget(npc, target) {
        if (npc.isShooting) return; // Não sobrescreve se estiver atirando

        const angle = Phaser.Math.Angle.Between(npc.x, npc.y, target.x, target.y);
        const deg = Phaser.Math.RadToDeg(angle);
        const key = npc.originalTextureKey;
        let anim = 'down';

        if (deg >= -22.5 && deg <= 22.5) anim = 'right';
        else if (deg > 22.5 && deg < 67.5) anim = 'down_right';
        else if (deg >= 67.5 && deg <= 112.5) anim = 'down';
        else if (deg > 112.5 && deg < 157.5) anim = 'down_left';
        else if (deg >= 157.5 || deg <= -157.5) anim = 'left';
        else if (deg > -157.5 && deg < -112.5) anim = 'up_left';
        else if (deg >= -112.5 && deg <= -67.5) anim = 'up';
        else if (deg > -67.5 && deg < -22.5) anim = 'up_right';

        const animKey = `${key}_${anim}`;
        if (this.scene.anims.exists(animKey)) {
            if (npc.texture.key !== key) npc.setTexture(key);
            if (npc.frameRate) {
                if (!npc.anims.isPlaying || npc.anims.currentAnim.key !== animKey) {
                    const animObj = this.scene.anims.get(animKey);
                    npc.play({ key: animKey, frameRate: npc.frameRate, repeat: animObj ? animObj.repeat : -1 });
                }
            } else {
                npc.play(animKey, true);
            }

            if (npc.angleOffsets && npc.angleOffsets[anim] !== undefined) {
                npc.setAngle(npc.angleOffsets[anim]);
            } else {
                npc.setAngle(0);
            }

            if (npc.scaleOffsets) {
                const offset = npc.scaleOffsets[anim];
                if (offset) {
                    const sx = (offset.x !== undefined) ? offset.x : (typeof offset === 'number' ? offset : 1);
                    const sy = (offset.y !== undefined) ? offset.y : (typeof offset === 'number' ? offset : 1);
                    npc.setScale(npc.baseScaleX * sx, npc.baseScaleY * sy);
                } else {
                    npc.setScale(npc.baseScaleX, npc.baseScaleY);
                }
            }
        } else {
            // Fallback para direções cardinais se a diagonal não existir
            const parts = anim.split('_'); // ex: 'down_right' -> ['down', 'right']
            let fallbackKey = `${key}_${parts[0]}`; // Tenta a parte vertical primeiro (down)
            
            // Se a vertical não existir, tenta a horizontal (right)
            if (parts.length > 1 && !this.scene.anims.exists(fallbackKey)) {
                fallbackKey = `${key}_${parts[1]}`;
            }

            if (this.scene.anims.exists(fallbackKey)) {
                if (npc.texture.key !== key) npc.setTexture(key);
                if (npc.frameRate) {
                    if (!npc.anims.isPlaying || npc.anims.currentAnim.key !== fallbackKey) {
                        const animObj = this.scene.anims.get(fallbackKey);
                        npc.play({ key: fallbackKey, frameRate: npc.frameRate, repeat: animObj ? animObj.repeat : -1 });
                    }
                } else {
                    npc.play(fallbackKey, true);
                }
                npc.setAngle(0); // Reseta ângulo no fallback
                if (npc.baseScaleX !== undefined) npc.setScale(npc.baseScaleX, npc.baseScaleY);
            } else {
                npc.setTexture('placeholder_square');
                npc.setAngle(0);
            }
        }
    }

    updateAnimation(npc, isFacingTarget = false) {
        if (npc.isShooting) return; // Não sobrescreve se estiver atirando

        const v = npc.body.velocity;
        const key = npc.originalTextureKey;

        // Se estiver parado (ou quase), não sobrescreve a animação (permite que faceTarget controle)
        if (Math.abs(v.x) < 1 && Math.abs(v.y) < 1) {
            if (!isFacingTarget) {
                // Tenta tocar idle direcional
                const idleDir = npc.lastDirection || 'down';
                const idleKey = `${key}_idle_${idleDir}`;

                if (this.scene.anims.exists(idleKey)) {
                    if (npc.texture.key !== key) npc.setTexture(key);
                    if (npc.frameRate) {
                        if (!npc.anims.isPlaying || npc.anims.currentAnim.key !== idleKey) {
                            const animObj = this.scene.anims.get(idleKey);
                            npc.play({ key: idleKey, frameRate: npc.frameRate, repeat: animObj ? animObj.repeat : -1 });
                        }
                    } else {
                        npc.play(idleKey, true);
                    }

                    if (npc.angleOffsets && npc.angleOffsets[idleDir] !== undefined) {
                        npc.setAngle(npc.angleOffsets[idleDir]);
                    } else {
                        npc.setAngle(0);
                    }

                    if (npc.scaleOffsets) {
                        const offset = npc.scaleOffsets[idleDir];
                        if (offset) {
                            const sx = (offset.x !== undefined) ? offset.x : (typeof offset === 'number' ? offset : 1);
                            const sy = (offset.y !== undefined) ? offset.y : (typeof offset === 'number' ? offset : 1);
                            npc.setScale(npc.baseScaleX * sx, npc.baseScaleY * sy);
                        } else {
                            npc.setScale(npc.baseScaleX, npc.baseScaleY);
                        }
                    }
                } else if (this.scene.anims.exists(`${key}_idle`)) {
                    if (npc.frameRate) {
                        if (!npc.anims.isPlaying || npc.anims.currentAnim.key !== `${key}_idle`) {
                            const animObj = this.scene.anims.get(`${key}_idle`);
                            npc.play({ key: `${key}_idle`, frameRate: npc.frameRate, repeat: animObj ? animObj.repeat : -1 });
                        }
                    } else {
                        npc.play(`${key}_idle`, true);
                    }
                    npc.setAngle(0);
                    if (npc.baseScaleX !== undefined) npc.setScale(npc.baseScaleX, npc.baseScaleY);
                } else {
                    npc.stop();
                }
            }
            return;
        }

        const angle = Math.atan2(v.y, v.x);
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

        // Atualiza a última direção para o idle correto
        npc.lastDirection = anim;

        const animKey = `${key}_${anim}`;
        if (this.scene.anims.exists(animKey)) {
            if (npc.texture.key !== key) npc.setTexture(key);
            if (npc.frameRate) {
                if (!npc.anims.isPlaying || npc.anims.currentAnim.key !== animKey) {
                    const animObj = this.scene.anims.get(animKey);
                    npc.play({ key: animKey, frameRate: npc.frameRate, repeat: animObj ? animObj.repeat : -1 });
                }
            } else {
                npc.play(animKey, true);
            }

            if (npc.angleOffsets && npc.angleOffsets[anim] !== undefined) {
                npc.setAngle(npc.angleOffsets[anim]);
            } else {
                npc.setAngle(0);
            }

            if (npc.scaleOffsets) {
                const offset = npc.scaleOffsets[anim];
                if (offset) {
                    const sx = (offset.x !== undefined) ? offset.x : (typeof offset === 'number' ? offset : 1);
                    const sy = (offset.y !== undefined) ? offset.y : (typeof offset === 'number' ? offset : 1);
                    npc.setScale(npc.baseScaleX * sx, npc.baseScaleY * sy);
                } else {
                    npc.setScale(npc.baseScaleX, npc.baseScaleY);
                }
            }
        } else {
            // Fallback para direções cardinais se a diagonal não existir
            const parts = anim.split('_'); // ex: 'down_right' -> ['down', 'right']
            let fallbackKey = `${key}_${parts[0]}`; // Tenta a parte vertical primeiro (down)
            
            // Se a vertical não existir, tenta a horizontal (right)
            if (parts.length > 1 && !this.scene.anims.exists(fallbackKey)) {
                fallbackKey = `${key}_${parts[1]}`;
            }

            if (this.scene.anims.exists(fallbackKey)) {
                if (npc.texture.key !== key) npc.setTexture(key);
                if (npc.frameRate) {
                    if (!npc.anims.isPlaying || npc.anims.currentAnim.key !== fallbackKey) {
                        const animObj = this.scene.anims.get(fallbackKey);
                        npc.play({ key: fallbackKey, frameRate: npc.frameRate, repeat: animObj ? animObj.repeat : -1 });
                    }
                } else {
                    npc.play(fallbackKey, true);
                }
                npc.setAngle(0);
                if (npc.baseScaleX !== undefined) npc.setScale(npc.baseScaleX, npc.baseScaleY);
            } else {
                npc.setTexture('placeholder_square');
                npc.setAngle(0);
            }
        }
    }

    takeDamage(npc, amount, source = null, isCriticalHit = false) { // Aceita source e flag de crítico
        if (!npc.active || npc.isDead) return;

        // Se for invulnerável, ignora o dano e mostra feedback
        if (npc.isInvulnerable) {
            this.showFloatingText(npc.x, npc.y, "BLINDADO", '#aaaaaa');
            return;
        }

        // Ao receber dano, o NPC é provocado e começa a perseguir imediatamente
        npc.isProvoked = true;

        // Lógica de Grupo: Se o NPC tem um grupo, alerta todos os outros membros
        if (npc.groupId) {
            this.npcs.forEach(otherNpc => {
                if (otherNpc.active && !otherNpc.isDead && otherNpc.groupId === npc.groupId) {
                    otherNpc.isProvoked = true;
                }
            });
        }

        npc.hp -= amount;

        // --- Lógica de Barra Dinâmica ---
        if (this.scene.healthDisplayMode === 'dynamic') {
            npc.showDynamicHealthBar = true;
            if (npc.dynamicHealthBarTimer) npc.dynamicHealthBarTimer.remove(false);
            npc.dynamicHealthBarTimer = this.scene.time.delayedCall(3000, () => {
                npc.showDynamicHealthBar = false;
                if (npc.active && !npc.isDead) this.drawHealthBar(npc);
            });
        }

        this.drawHealthBar(npc);

        // Registra estatísticas se o dano veio de um jogador
        if (source && this.scene.players && this.scene.players.includes(source)) {
            if (this.scene.missionManager) {
                this.scene.missionManager.recordHit(); // Registra que um tiro acertou
                this.scene.missionManager.recordDamage(amount); // Registra a quantidade de dano
            }
            // Log de Acessibilidade (Acerto)
            if (this.scene.accessibilityManager) {
                const targetName = npc.id || 'Inimigo';
                this.scene.accessibilityManager.log(`Acertou ${targetName} (Dano: ${amount})`, '#00ffff');
            }
        }

        // Som de acerto no NPC
        if (this.scene.soundManager) {
            this.scene.soundManager.playNpcHit();
        }

        if (npc.healthBasedTint) {
            const percent = Math.max(0, npc.hp / npc.maxHp);
            if (percent > 0) {
                const color = this.scene.getHealthColor(percent);
                npc.setTint(color);
            }
        } else {
            // Feedback visual de dano
            npc.setTint(0xff0000);
            this.scene.time.delayedCall(150, () => {
                if (npc.active && !npc.isDead) {
                    if (npc.isBurning) npc.setTint(0xff4400); // Restaura cor de fogo se ainda estiver queimando
                    else npc.clearTint();
                }
            });
        }
        // --- KNOCKBACK (Recuo estilo Syndicate) ---
        // Aplica recuo se houver uma fonte de dano e o NPC não for imóvel (ex: torres)
        if (source && npc.body && !npc.body.immovable) {
            const knockbackForce = 20; // Força do empurrão (ajuste para mais/menos impacto)
            const knockbackDuration = 100; // Duração em ms (curto para ser um "tranco")

            // Calcula o ângulo entre a fonte do tiro e o NPC
            const angle = Phaser.Math.Angle.Between(source.x, source.y, npc.x, npc.y);
            
            npc.isKnockedBack = true;
            
            // Aplica velocidade na direção oposta ao tiro
            this.scene.physics.velocityFromRotation(angle, knockbackForce, npc.body.velocity);
            
            // Reseta o estado após o tempo definido
            this.scene.time.delayedCall(knockbackDuration, () => {
                if (npc.active && !npc.isDead && npc.body) {
                    npc.isKnockedBack = false;
                    npc.body.setVelocity(0);
                }
            });
        }

        // Efeito de partículas de sangue
        if (this.bloodEmitter) {
            this.bloodEmitter.explode(8, npc.x, npc.y);
        }

        // Floating Combat Text (Dano Flutuante Individual)
        // Gera um deslocamento aleatório em X para evitar que os números fiquem uns sobre os outros
        const randomX = Phaser.Math.Between(-20, 20);
        const offset = (npc.healthTextOffset !== undefined) ? npc.healthTextOffset : ((npc.healthBarOffset !== undefined) ? npc.healthBarOffset : 40);

        // Dano Crítico (> 85 ou flag isCriticalHit): Amarelo e Maior
        const isCritical = isCriticalHit || amount > 85;
        const fontSize = isCritical ? '18px' : '10px';
        const color = isCritical ? '#ffff00' : '#b51c1c';

        const damageText = this.scene.add.text(npc.x + randomX, npc.y - offset, `-${amount}`, {
            fontSize: fontSize, fill: color, stroke: '#000000', strokeThickness: 4, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3000);

        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 50, // Sobe 50 pixels
            alpha: 0,
            duration: 800,
            onComplete: () => {
                damageText.destroy();
            }
        });

        if (npc.hp <= 0) {
            npc.isDead = true;

            // Som de morte do NPC
            if (this.scene.soundManager) {
                this.scene.soundManager.playNpcDeath();
            }

            // Notifica o MissionManager sobre o abate
            if (this.scene.missionManager) {
                this.scene.missionManager.onEnemyKilled(npc, source); // Repassa quem matou
            }

            this.destroyNPC(npc);

            // Tenta dropar itens
            if (this.scene.itemsManager && window.missionConfig && window.missionConfig.NPCS) {
                const npcConfig = window.missionConfig.NPCS.find(c => c.id === npc.id);
                // Verifica se o NPC tem um drop específico
                if (npcConfig && npcConfig.drop) {
                    if (Math.random() <= npcConfig.drop.chance) {
                        this.scene.itemsManager.spawnItem(npc.x, npc.y, npcConfig.drop.key, npcConfig.drop.scale);
                    }
                } else {
                    // Se não, tenta a lista de drops globais
                    this.scene.itemsManager.tryDrop(npc.x, npc.y);
                }
            }
        }
    }

    destroyNPC(npc) {
        // Lógica de Respawn
        if (npc.spawnData && npc.spawnData.respawnTime > 0) {
            const respawnDelay = npc.spawnData.respawnTime;
            this.scene.time.delayedCall(respawnDelay, () => {
                if (this.scene && this.scene.sys && this.scene.sys.isActive()) {
                    this.createNPC(npc.spawnData);
                }
            });
        }

        if (npc.healthBar) npc.healthBar.destroy();
        if (npc.healthText) npc.healthText.destroy();
        if (npc.exhaustEmitter) npc.exhaustEmitter.destroy();
        if (npc.shadow) npc.shadow.destroy();
        if (npc.burnEmitter) npc.burnEmitter.destroy(); // Limpa partículas de fogo
        if (npc.objectiveMarker) npc.objectiveMarker.destroy(); // Limpa seta de objetivo
        if (npc.dirDebugText) npc.dirDebugText.destroy();
        if (npc.animDebugText) npc.animDebugText.destroy();
        
        // Limpa faróis
        if (npc.headlights) {
            npc.headlights.forEach(beam => beam.destroy());
            npc.headlights = null;
        }

        // Para o tween de dano antes de destruir o texto para evitar erro 'reading duration'
        if (npc.damageTween) {
            npc.damageTween.stop();
            npc.damageTween = null;
        }
        if (npc.dynamicHealthBarTimer) {
            npc.dynamicHealthBarTimer.remove(false);
            npc.dynamicHealthBarTimer = null;
        }
        if (npc.damageText) npc.damageText.destroy();

        // Cria a poça de sangue no local da morte
        this.createBloodPuddle(npc.x, npc.y);

        // --- LÓGICA PARA NPC COM TINT POR VIDA ---
        if (npc.healthBasedTint) {
            npc.setTint(0x333333); // Cinza escuro para "morto"
            if (npc.body) npc.body.enable = false; // Desativa o corpo físico para não interagir mais
            this.npcs = this.npcs.filter(n => n !== npc); // Remove da lista de atualização/alvo
            // Não destrói o sprite, ele fica no mapa
            return;
        }

        const deadKey = `${npc.texture.key}_morto`;
        if (this.scene.anims.exists(deadKey)) {
            npc.body.stop();
            npc.body.enable = false; // Desabilita física
            npc.play(deadKey);
            this.npcs = this.npcs.filter(n => n !== npc); // Remove da lista de atualização/alvo
            npc.setDepth(1); // Garante que o corpo fique no chão (abaixo dos vivos)

            // Faz o corpo sumir gradualmente após a animação de morte
            this.scene.tweens.add({
                targets: npc,
                alpha: 0,
                duration: 1500,
                delay: 10000000, // Espera 1 segundo mostrando o corpo
                onComplete: () => npc.destroy()
            });
        } else {
            // Se não tem animação de morte, encolhe e some rápido
            this.scene.tweens.add({
                targets: npc,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => npc.destroy()
            });
            this.npcs = this.npcs.filter(n => n !== npc);
        }
    }

    createBloodPuddle(x, y) {
        const puddle = this.scene.add.sprite(x, y, 'blood_puddle')
            .setAlpha(0) // Começa invisível
            .setDepth(1) // Baixa profundidade para ficar no chão
            .setScale(0.1); // Começa pequena

        // Animação de poça crescendo (espalhando) e depois sumindo
        this.scene.tweens.add({
            targets: puddle,
            scale: { from: 0.1, to: 1.5 }, // Cresce
            alpha: { from: 0.9, to: 0 },   // Some gradualmente
            delay: 200, // Aparece um pouco depois da morte
            duration: 15000, // Dura 15 segundos
            ease: 'Sine.easeOut',
            onComplete: () => puddle.destroy()
        });
    }

    setVulnerable(targetIds) {
        const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
        this.npcs.forEach(npc => {
            if (ids.includes(npc.id)) {
                npc.isInvulnerable = false;
                this.showFloatingText(npc.x, npc.y, "ESCUDO DESATIVADO", '#ff0000');
            }
        });
    }

    showFloatingText(x, y, message, color) {
        const text = this.scene.add.text(x, y - 40, message, {
            fontSize: '14px', fontFamily: 'Arial', color: color, stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(5000);

        this.scene.tweens.add({
            targets: text,
            y: y - 80,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }

    updateHealer(npc, time) {
        if (time > npc.lastHealTime + npc.healCooldown) {
            let healedAny = false;

            // Procura aliados (outros NPCs não civis) feridos dentro do raio
            this.npcs.forEach(ally => {
                if (ally !== npc && ally.active && !ally.isDead && !ally.isCivilian && ally.hp < ally.maxHp) {
                    const dist = Phaser.Math.Distance.Between(npc.x, npc.y, ally.x, ally.y);
                    if (dist <= npc.healRadius) {
                        this.healNpc(ally, npc.healAmount);
                        healedAny = true;

                        // Efeito visual: Raio de cura verde
                        const relX = ally.x - npc.x;
                        const relY = ally.y - npc.y;
                        const beam = this.scene.add.line(npc.x, npc.y, 0, 0, relX, relY, 0x00ff00)
                            .setOrigin(0, 0).setDepth(2000).setLineWidth(2);

                        this.scene.tweens.add({ targets: beam, alpha: 0, duration: 300, onComplete: () => beam.destroy() });
                    }
                }
            });

            if (healedAny) {
                npc.lastHealTime = time;
                // Efeito visual: Onda de cura no healer
                const circle = this.scene.add.circle(npc.x, npc.y, 10, 0x00ff00, 0.3).setDepth(npc.depth - 1);
                this.scene.tweens.add({
                    targets: circle,
                    scale: npc.healRadius / 10,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => circle.destroy()
                });
            }
        }
    }

    healNpc(npc, amount) {
        npc.hp = Math.min(npc.maxHp, npc.hp + amount);
        this.drawHealthBar(npc);
        this.showFloatingText(npc.x, npc.y - 30, `+${amount}`, '#00ff00');
    }

    drawHealthBar(npc) {
        const mode = this.scene.healthDisplayMode || 'default';

        // Reseta visibilidade
        if (npc.healthBar) npc.healthBar.setVisible(false);
        if (npc.healthText) npc.healthText.setVisible(false);

        // --- NOVO MODO: GROUP ID ---
        if (mode === 'groupId') {
            if (npc.groupId) { // Only show if it has a groupId
                if (!npc.healthText) { // Reutiliza o healthText para isso
                    npc.healthText = this.scene.add.text(0, 0, '', {
                        fontSize: '10px', fontFamily: 'Arial', fill: '#00ffff', stroke: '#000000', strokeThickness: 2, fontStyle: 'bold'
                    }).setOrigin(0.5);
                }
                npc.healthText.setVisible(true);
                npc.healthText.setText(npc.groupId);
                npc.healthText.setColor('#00ffff'); // Cor Ciano para o ID do grupo
            }
            // Não mostra barra de vida neste modo, apenas o ID
            return;
        }

        // --- NOVO MODO: ID ---
        if (mode === 'id') {
            if (npc.id) {
                if (!npc.healthText) {
                    npc.healthText = this.scene.add.text(0, 0, '', {
                        fontSize: '10px', fontFamily: 'Arial', fill: '#ff00ff', stroke: '#000000', strokeThickness: 2, fontStyle: 'bold'
                    }).setOrigin(0.5);
                }
                npc.healthText.setVisible(true);
                npc.healthText.setText(npc.id);
                npc.healthText.setColor('#ff00ff'); // Magenta para o ID único
            }
            return;
        }

        // --- NOVO MODO: LEVEL ---
        if (mode === 'level') {
            if (!npc.healthText) {
                npc.healthText = this.scene.add.text(0, 0, '', {
                    fontSize: '10px', fontFamily: 'Arial', fill: '#ffff00', stroke: '#000000', strokeThickness: 2, fontStyle: 'bold'
                }).setOrigin(0.5);
            }
            npc.healthText.setVisible(true);
            npc.healthText.setText(`Lv ${npc.level || 1}`);
            npc.healthText.setColor('#ffff00'); // Amarelo para Nível
            return;
        }

        // --- MODO BARRA (ou Default para NPCs) ---
        if (mode === 'bar' || mode === 'default' || mode === 'both' || (mode === 'dynamic' && npc.showDynamicHealthBar)) {
            if (!npc.healthBar) npc.healthBar = this.scene.add.graphics();
            npc.healthBar.setVisible(true);
            npc.healthBar.clear();

            const width = 32;
            const height = 4;
            const x = -width / 2;
            const y = 0;

            // Fundo (Preto)
            npc.healthBar.fillStyle(0x000000);
            npc.healthBar.fillRect(x, y, width, height);

            // Vida Atual (Cor Dinâmica)
            const percent = Phaser.Math.Clamp(npc.hp / npc.maxHp, 0, 1);

            const color = this.scene.getHealthColor(percent);

            npc.healthBar.fillStyle(color);
            npc.healthBar.fillRect(x, y, width * percent, height);
        }

        // --- MODO NUMÉRICO ---
        if (mode === 'number' || mode === 'both') {
            if (!npc.healthText) {
                npc.healthText = this.scene.add.text(0, 0, '', {
                    fontSize: '10px', fontFamily: 'Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 2, fontStyle: 'bold'
                }).setOrigin(0.5);
            }
            npc.healthText.setVisible(true);
            npc.healthText.setColor('#ffffff'); // Garante que a cor seja branca para HP
            const hp = Math.max(0, Math.floor(npc.hp));
            npc.healthText.setText(`${hp}/${npc.maxHp}`);
        }
    }

    applyBurn(npc, damagePerTick, duration, source) {
        if (!npc.active || npc.isDead) return;

        // Se já estiver queimando, apenas renova a duração
        if (npc.isBurning) {
            npc.burnDuration = duration;
            return;
        }

        npc.isBurning = true;
        npc.burnDuration = duration;
        npc.burnDamage = damagePerTick;
        npc.burnSource = source;
        npc.burnTimer = 0;

        npc.setTint(0xff4400); // Cor Laranja/Fogo

        // Cria partículas de fogo no NPC
        if (!this.scene.textures.exists('fire_particle')) {
             const g = this.scene.make.graphics({x:0, y:0, add:false});
             g.fillStyle(0xffaa00, 1);
             g.fillCircle(4,4,4);
             g.generateTexture('fire_particle', 8, 8);
             g.destroy();
        }
        
        npc.burnEmitter = this.scene.add.particles(0, 0, 'fire_particle', {
            speed: { min: 10, max: 30 },
            scale: { start: 0.8, end: 0 },
            lifespan: 600,
            quantity: 2,
            blendMode: 'ADD'
        });
        npc.burnEmitter.startFollow(npc);
    }

    removeBurn(npc) {
        npc.isBurning = false;
        npc.clearTint();
        if (npc.burnEmitter) {
            npc.burnEmitter.destroy();
            npc.burnEmitter = null;
        }
    }

    setTargetIndicators(targetIds) {
        this.npcs.forEach(npc => {
            if (targetIds.includes(npc.id)) {
                if (!npc.objectiveMarker) {
                    npc.objectiveMarker = this.scene.add.image(npc.x, npc.y - 90, 'arrow_marker_enemy');
                    npc.objectiveMarker.setDepth(9999);
                }
                npc.objectiveMarker.setVisible(true);
            } else {
                if (npc.objectiveMarker) {
                    npc.objectiveMarker.setVisible(false);
                }
            }
        });
    }
}