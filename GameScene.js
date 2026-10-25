import AnimationManager from './AnimationManager.js';
import Player from './Player.js';
import UIManager from './UI-config.js';
import ScenarioManager from './ScenarioManager.js';
import InteriorsManager from './InteriorsManager.js';
import UnitController from './UnitController.js';
import NPCManager from './NPCManager.js';
import Minimap from './Minimap.js';
import CharacterPanel from './CharacterPanel.js';
import InventoryPanel from './InventoryPanel.js';
import MissionManager from './MissionManager.js';
import SoundManager from './SoundManager.js';
import ItemsManager from './ItemsManager.js';
import InformationManager from './InformationManager.js';
import TeamLevelManager from './TeamLevelManager.js';
import OptionsPanel from './OptionsPanel.js';
import LoadingManager from './LoadingManager.js';
import LanguageManager from './LanguageManager.js';
import KeyboardManager from './KeyboardManager.js';
import TempoManager from './TempoManager.js';
import AccessibilityManager from './AccessibilityManager.js';
import VirtualJoystick from './VirtualJoystick.js';
import InsanityPipeline from './InsanityPipeline.js';
import DebugPanel from './DebugPanel.js';
import IsometricPipeline from './IsometricPipeline.js';
import GridManager from './GridManager.js';
import ShotManager from './ShotManager.js';
 
export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.animManager = null;
        this.uiManager = null;
        this.scenarioManager = null;
        this.interiorsManager = null;
        this.npcManager = null;
        this.missionManager = null;
        this.soundManager = null;
        this.itemsManager = null;
        this.informationManager = null;
        this.teamLevelManager = null;
        this.loadingManager = null;
        this.languageManager = null;
        this.keyboardManager = null;
        this.gridManager = null;
        this.tempoManager = null;
		this.virtualJoystick = null;
        this.shotManager = null;
        this.accessibilityManager = null;
        this.minimap = null;
        this.characterPanel = null;
        this.inventoryPanel = null;
        this.optionsPanel = null;
        this.debugPanel = null;
        this.players = [];
        this.showRange = false;
        this.rangeOverlay = null;
        this.rangeMaskGraphics = null;
        this.mapBoundaries = null; // Grupo para as paredes invisíveis
        this.bloodOverlay = null; // Vinheta de sangue
        this.isStealthMode = false; // Novo estado para modo furtivo
        this.stealthDuration = 10000; // 20 segundos de duração
        this.stealthCooldown = 15000; // 60 segundos (1 minuto) de espera
        this.currentStealthTime = 0;
        this.currentCooldownTime = 0;
        this.instructionsContainer = null;
        this.instructionsBlocker = null; // Referência para o blocker de instruções
        this.showHealthBars = false; // Estado inicial das barras de vida
        this.healthDisplayMode = localStorage.getItem('brics_health_mode') || 'dynamic'; // Carrega preferência ou usa padrão (Dinâmico)
        this.isPaused = false; // Estado de Pause
        this.pauseContainer = null; // Container visual do Pause
        this.disableEnemyVision = false; // Cheat: Desabilitar visão dos inimigos
        this.isGodMode = false; // Cheat: God Mode
        this.isWarpMode = false; // Estado para mirar o Warp
        this.warpCooldown = 180000; // 3 minutos para o Warp global
        this.currentWarpCooldown = 0;
        this.currentQuickDashCooldown = 0; // Cooldown do novo Dash (Espaço)
        this.warpInstructionText = null; // Texto de instrução do Warp
        this.warpTimeoutEvent = null; // Timer para cancelamento automático do Warp
        this.insanityEffect = null; // Efeito de distorção de insanidade
        this.isIsometricTest = window.gameConfig.DEFAULTS.ISOMETRIC_MODE; // Flag para o teste de visão isométrica
        this.isometricEffect = null; // Efeito de shear para teste isométrico
        this.isometricZoomX = window.gameConfig.DEFAULTS.ISOMETRIC_SKEW_X; // Fator de escala horizontal para visão isométrica
        this.isGridMovementTest = false; // Flag para o teste de movimento em grade

        // --- BARRA DE STEALTH ---
        this.stealthBarBg = null;
        this.stealthBarFill = null;

        // --- Variáveis de Clima (Novo sistema) ---
        this.weatherTypes = [
            'none',
            'light', 'standard', 'heavy', 'storm',
            'fog_light', 'fog_heavy',
            'light_puddles', 'standard_puddles', 'heavy_puddles', 'storm_puddles',
            'wind_light', 'wind_medium', 'wind_strong',
            'sand_light', 'sand_medium', 'sand_heavy'
        ];
        this.currentWeatherIndex = 0;
        this.rainEmitter = null;
        this.fogEmitter = null;
        this.windEmitter = null;
        this.puddleTimer = null;
        this.puddlesGroup = null;
        this.lightningTimer = null;
        this.showShadows = true; // Estado das sombras (Padrão: Ligado)
        this.showFps = false; // Estado do FPS (Padrão: Desligado)
        this.showExhaustSmoke = true; // Efeito de fumaça do carro (Padrão: Ligado)
        this.targetBrightness = 1.0;
        this.fpsText = null;

        // --- Câmeras ---
        this.uiCamera = null;
        this.targetZoom = window.gameConfig.DEFAULTS.ZOOM;
        this.colorBlindMode = localStorage.getItem('brics_colorblind') || 'NONE';
        this.worldColorFX = null;
        this.uiColorFX = null;
        this.squadName = localStorage.getItem('brics_squad_name') || 'TASK FORCE';
    }

    preload() {
        // --- TELA DE LOADING ---
        // O LoadingManager é especial e precisa ser criado no preload para monitorar o carregamento.
        this.loadingManager = new LoadingManager(this);
        this.loadingManager.create();

        // --- INICIALIZAÇÃO DOS MANAGERS COM PRELOAD ---
        // Estes managers precisam ser criados antes do preload() da cena para carregar seus próprios assets.
        this.animManager = new AnimationManager(this);
        this.scenarioManager = new ScenarioManager(this);
        this.npcManager = new NPCManager(this);
        this.soundManager = new SoundManager(this);
        this.informationManager = new InformationManager(this);

        // O AnimationManager carrega todos os spritesheets definidos no config
        this.animManager.preload();
        this.scenarioManager.preload();
        this.npcManager.preload();
        this.soundManager.preload();
        this.informationManager.preload(); // Carrega assets dos NPCs de informação

        // Aqui você carregaria outros assets da cena (mapas, sons, ui, etc)
        // Carrega o mapa definido na missão atual
        const mapImage = (window.missionConfig && window.missionConfig.mapImage) ? window.missionConfig.mapImage : 'assets/mapa/chao.jpg';
        this.load.image('map', mapImage);

        // armas
        this.load.image('pistol', 'assets/armas/pistola.png');
        this.load.image('shotgun', 'assets/armas/shotgun.png');
        this.load.image('bg9000', 'assets/armas/metralhadora.png');
        this.load.image('bomba', 'assets/bombas/bomb.png');
        this.load.image('documento', 'assets/efeitos/fumaca.png'); // Adiciona a textura para o item 'documento'
        this.load.image('medkit', 'assets/ui/medekit.png');
        this.load.image('reviver', 'assets/bombas/bomb.png');
        this.load.image('machinegun', 'assets/armas/metralhadora.png');
        //armaduras
        this.load.image('helmet', 'assets/armadura/bota.png');
        this.load.image('chest', 'assets/armadura/peito.png');
        this.load.image('leg', 'assets/armadura/calca.png');
        //players
        this.load.image('player_face_1', 'assets/img_players/1.png');
        this.load.image('player_face_2', 'assets/img_players/2.png');
        this.load.image('player_face_3', 'assets/img_players/3.png');
        this.load.image('player_face_4', 'assets/img_players/4.png');
        this.load.image('player_face_5', 'assets/img_players/5.png');
        this.load.image('player_face_morta', 'assets/img_players/caveira.png');
        this.load.image('BLOCK', 'assets/cenario/quadrado.png');
        //Dinheiro xp
        this.load.image('xp_team_money', 'assets/ui/dinheiro2.png');


        // Carrega a imagem da borda da UI
        this.load.image('ui_border', 'assets/ui/fundo.png');
        this.load.image('ui_tal', 'assets/cenario/top_down_military_set.png');
        this.load.image('ui_bg', 'assets/ui/barra.png');
        this.load.image('all_icon', 'assets/ui/all_icon.png');
        this.load.image('blink_icon', 'assets/ui/blink.png');
        this.load.image('steath_icon', 'assets/ui/steath.png');
        this.load.image('help_icon', 'assets/ui/ajuda.png');
        this.load.image('gear_icon', 'assets/ui/gear.png');
        this.load.image('opcoes_icon', 'assets/ui/opcoes.png');
        this.load.image('volume_icon', 'assets/ui/volume.png');

        // Imagens do Mapa Tela Cheia
        this.load.image('full_map_1', 'assets/mapa/1.png');
        this.load.image('full_map_2', 'assets/mapa/2.png');
        this.load.image('full_map_3', 'assets/mapa/3.png');
        this.load.image('flash_texture', 'assets/efeitos/gun_tiro.png');

        this.load.image('white_square', 'assets/cenario/quadrado.jpeg');
        

        this.load.image('portal', 'assets/mapa/portal.png');

        this.load.image('plasma_bullet', 'assets/efeitos/gun_tiro.png');
        this.load.image('plasma_bullet_rifle', 'assets/efeitos/rifle_tiro.png');



        this.load.spritesheet('nevoeiro', 'assets/efeitos/fumaca.png', { frameWidth: 13132, frameHeight: 3132 });
        this.load.spritesheet('exhaust_smoke_particle', 'assets/efeitos/fumaca.png', { frameWidth: 32, frameHeight: 32 });



        this.load.image('smoke_grenade', 'assets/bombas/bomb.png');

        // Carrega o spritesheet da fumaça (Certifique-se de ter este arquivo ou ajuste o caminho)
        this.load.spritesheet('smoke_effect', 'assets/efeitos/flame.png', { frameWidth: 32, frameHeight: 32 });



        // Carrega o spritesheet da mira (Ajuste o caminho e dimensões conforme seu arquivo)
        this.load.spritesheet('crosshair_anim', 'assets/ui/mira.png', { frameWidth: 32, frameHeight: 32 });

        // Carrega o spritesheet do efeito de summon (SUBSTITUA COM SEU ARQUIVO E DIMENSÕES)
        this.load.spritesheet('summon_effect', 'assets/efeitos/summon_effect.png', { frameWidth: 128, frameHeight: 128 });
    }

    create() {
        // Expõe a GameScene globalmente para que o comando forceJoystick() funcione em tempo real
        window.gameScene = this;

        // Recarrega o nome do esquadrão do localStorage sempre que a cena inicia
        this.squadName = localStorage.getItem('brics_squad_name') || 'BRICS';

        // Dimensões da imagem de fundo (Área jogável principal)
        const visualMapWidth = window.gameConfig.VISUAL_MAP_WIDTH || 3200;
        const visualMapHeight = window.gameConfig.VISUAL_MAP_HEIGHT || 1800;

        // --- INICIALIZAÇÃO DOS MANAGERS ---
        // É crucial instanciar os managers em create() e não no constructor,
        // pois a cena ainda não está totalmente pronta no constructor.
        this.uiManager = new UIManager(this);
        this.interiorsManager = new InteriorsManager(this);
        this.missionManager = new MissionManager(this);
        this.itemsManager = new ItemsManager(this);
        this.teamLevelManager = new TeamLevelManager(this);
        this.languageManager = new LanguageManager(this);
        this.keyboardManager = new KeyboardManager(this);
        this.tempoManager = new TempoManager(this);
        this.accessibilityManager = new AccessibilityManager(this);
        this.shotManager = new ShotManager(this);

        // Carrega preferência de sombras
        const savedShadows = localStorage.getItem('brics_shadows');
        if (savedShadows !== null) {
            this.showShadows = (savedShadows === 'true');
        }

        // Carrega preferência de FPS
        const savedFps = localStorage.getItem('brics_show_fps');
        if (savedFps !== null) {
            this.showFps = (savedFps === 'true');
        }

        // O mundo físico continua GRANDE (5000x5000) para caber interiores e lógica off-screen
        this.physics.world.setBounds(0, 0, window.gameConfig.MAP_WIDTH, window.gameConfig.MAP_HEIGHT);

        // Apenas a CÂMERA fica presa na imagem
        this.cameras.main.setBounds(0, 0, visualMapWidth, visualMapHeight);
        this.cameras.main.setName('WorldCamera');

        // Carrega preferência de zoom
        const savedZoom = localStorage.getItem('brics_zoom');
        if (savedZoom !== null) {
            this.targetZoom = Phaser.Math.Clamp(parseFloat(savedZoom), 0.9, 2.7);
        }
        this.cameras.main.setZoom(this.targetZoom);

        // Carrega preferência de brilho
        const savedBrightness = localStorage.getItem('brics_brightness');
        if (savedBrightness !== null) {
            this.targetBrightness = parseFloat(savedBrightness);
        }

        // Cria a Câmera de UI (Sobreposta, sem limites)
        this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.uiCamera.setName('UICamera');

        // --- INICIALIZA FILTROS DE COR (WEBGL) ---
        if (this.cameras.main.postFX) {
            this.worldColorFX = this.cameras.main.postFX.addColorMatrix();
            this.uiColorFX = this.uiCamera.postFX.addColorMatrix();
        }

        this.cursors = this.input.keyboard.createCursorKeys();

        // Fundo
        // Usa o tamanho visual definido (3200x1600)
        this.add.image(0, 0, 'map').setOrigin(0, 0).setDepth(-100)
            .setDisplaySize(visualMapWidth, visualMapHeight);

        // Cria paredes invisíveis para segurar o jogador na área da imagem
        this.createMapBoundaries(visualMapWidth, visualMapHeight);

        // Cria as animações no sistema do Phaser
        this.animManager.create();

        // Cria o cenário e obstáculos
        this.scenarioManager.create();

        // Cria os interiores (entradas e saídas)
        this.interiorsManager.create();

        // Cria os NPCs
        this.npcManager.create();

        // Inicializa o SoundManager
        this.soundManager.create();

        // Toca a música da missão atual
        this.playMissionMusic();

        // Cria a UI
        this.uiManager.create();

        // Inicializa o ItemsManager
        this.itemsManager.create();

        // Cria o Gerenciador de Informações (NPCs de diálogo)
        this.informationManager.create();

        // Cria o Gerenciador de Missão (Objetivos e Timer)
        this.missionManager.create();

        // Cria o Gerenciador de Nível do Time
        this.teamLevelManager.create();

        // Cria o Gerenciador de Idioma

        // Cria o Gerenciador de Teclado (WASD)
        this.keyboardManager.create();

        // Cria o Gerenciador de Tempo (Clima Automático)
        this.tempoManager.create();

        // Cria o Gerenciador de Grid (para movimento em grade)
        this.gridManager = new GridManager(this, window.gameConfig.TILE_SIZE, window.gameConfig.TILE_SIZE);
        this.gridManager.create();

        // Cria o Gerenciador de Acessibilidade (Legendas)
        this.accessibilityManager.create();

        // Inicializa o Joystick Virtual no mobile ou se forçado via console
        if (window.gameConfig.IS_MOBILE || window.forceJoystickEnabled) {
            this.setupJoystick();
        }

        // Cria o ShotManager (Gera texturas de tiro)
        this.shotManager.create();

        // --- BARRA DE STEALTH (Visual) ---
        this.stealthBarBg = this.add.rectangle(0, 0, 200, 8, 0x000000)
            .setStrokeStyle(1, 0xffffff)
            .setScrollFactor(0)
            .setDepth(10005)
            .setVisible(false);

        this.stealthBarFill = this.add.rectangle(0, 0, 198, 6, 0x00ffff) // Ciano
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(10006)
            .setVisible(false);

        // --- Overlay de Brilho ---
        this.brightnessOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(100000) // Topmost
            .setVisible(true);

        this.setBrightness(this.targetBrightness);

        // --- MAPA POPUP ---

        this.currentMapIndex = 0;
        this.mapImageKeys = ['full_map_1', 'full_map_2', 'full_map_3'];


        // Configurações de tamanho do Popup (Ajuste aqui)
        this.mapPopupWidth = 700;
        this.mapPopupHeight = 500;

        this.mapContainer = this.add.container(this.scale.width / 2, this.scale.height / 2)
            .setScrollFactor(0)
            .setDepth(20000) // Acima de tudo
            .setVisible(false);

        // Fundo do popup (Janela)
        this.mapBg = this.add.rectangle(0, 0, this.mapPopupWidth, this.mapPopupHeight, 0x000000, 0.9)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive(); // Bloqueia cliques na área do mapa

        this.mapImage = this.add.image(0, 0, this.mapImageKeys[0]);

        this.mapContainer.add([this.mapBg, this.mapImage]);

        // Itera sobre a lista de players no config e cria cada um
        if (window.gameConfig && window.gameConfig.PLAYERS) {
            window.gameConfig.PLAYERS.forEach((spawnData, index) => {
                // Cria o player e o adiciona ao array de controle da cena
                const player = new Player(this, spawnData);
                player.squadIndex = index + 1;

                // Só adiciona se o player foi criado com sucesso (tem sprite)
                if (player.sprite) {
                    this.players.push(player);
                    // Adiciona colisão entre o player e os obstáculos do cenário
                    // Colisor com callback: ao colidir com obstáculo, para o movimento da unidade
                    const scenarioObs = this.scenarioManager.getObstacles();
                    if (scenarioObs) {
                        this.physics.add.collider(player.sprite, scenarioObs, (playerSprite, obstacle) => {
                            if (playerSprite && playerSprite._unit && playerSprite._unit.stopMovement) {
                                playerSprite._unit.stopMovement();
                            }
                        });
                    }

                    const interiorObs = this.interiorsManager.getObstacles();
                    if (interiorObs) {
                        this.physics.add.collider(player.sprite, interiorObs, (playerSprite, obstacle) => {
                            if (playerSprite && playerSprite._unit && playerSprite._unit.stopMovement) {
                                playerSprite._unit.stopMovement();
                            }
                        });
                    }
                    // Adiciona colisão com as bordas do mapa visual
                    if (this.mapBoundaries) this.physics.add.collider(player.sprite, this.mapBoundaries);
                }
            });
        }

        // Centraliza a câmera no primeiro jogador ao iniciar
        if (this.players.length > 0) {
            const p = this.players[0];
            this.cameras.main.centerOn(p.x, p.y);
        }

        // Inicializa o Painel de Personagem (Unificado)
        this.characterPanel = new CharacterPanel(this);
        this.characterPanel.create();

        // Inicializa o Painel de Inventário (Novo)
        this.inventoryPanel = new InventoryPanel(this);
        this.inventoryPanel.create();

        // Inicializa o Painel de Opções
        this.optionsPanel = new OptionsPanel(this);
        this.optionsPanel.create();

        // Inicializa o Painel de Debug
        this.debugPanel = new DebugPanel(this);
        this.debugPanel.create();

        // --- CONFIGURAÇÃO DOS SHADERS (POST-PROCESSING) ---
        if (this.renderer.pipelines && this.renderer.pipelines.add) {
            const postPipelines = [];

            // Efeito de Insanidade
            if (this.renderer.pipelines.has('Insanity')) {
                this.renderer.pipelines.remove('Insanity');
            }
            this.insanityEffect = this.renderer.pipelines.add('Insanity', new InsanityPipeline(this.game));
            if (this.insanityEffect) {
                this.insanityEffect.active = false; // Começa desativado
                postPipelines.push(this.insanityEffect);
            }

            // Efeito Isométrico (Shear)
            if (this.renderer.pipelines.has('Isometric')) {
                this.renderer.pipelines.remove('Isometric');
            }
            this.isometricEffect = this.renderer.pipelines.add('Isometric', new IsometricPipeline(this.game));
            if (this.isometricEffect) {
                this.isometricEffect.active = false; // Começa desativado
                postPipelines.push(this.isometricEffect);
            }

            if (postPipelines.length > 0) {
                this.cameras.main.setPostPipeline(postPipelines);
            }
        }

        // Aplica o zoom e efeitos iniciais (importante se o modo isométrico estiver ativo por padrão)
        this.applyCurrentZoom();

        // Aplica o filtro de daltonismo inicial (se houver salvo)
        this.applyColorBlindFilter();

        // Inicializa o controlador de unidades (Syndicate style)
        this.unitController = new UnitController(this, this.players, this.npcManager, this.itemsManager);

        // Inicializa o Minimapa
        this.minimap = new Minimap(this, this.players, this.npcManager);
        this.minimap.create();

        // Estado de ação não é mais necessário para alternar entre andar/atirar
        this.actionMode = 'default';

        // Cria a mira (crosshair) - inicialmente invisível
        this.crosshair = this.add.circle(0, 0, 5, 0xff0000, 0.4).setStrokeStyle(1, 0xff0000).setDepth(9999).setScrollFactor(0).setVisible(false);

        // Cria a animação da mira
        if (!this.anims.exists('spin_crosshair')) {
            this.anims.create({
                key: 'spin_crosshair',
                frames: this.anims.generateFrameNumbers('crosshair_anim'),
                frameRate: 10,
                repeat: -1
            });
        }

        // Cria a animação da fumaça
        if (!this.anims.exists('smoke_anim')) {
            this.anims.create({
                key: 'smoke_anim',
                frames: this.anims.generateFrameNumbers('smoke_effect'),
                frameRate: 15,
                repeat: -1
            });
        }

        // Cria a animação do efeito de summon
        if (!this.anims.exists('summon_anim')) {
            this.anims.create({
                key: 'summon_anim',
                frames: this.anims.generateFrameNumbers('summon_effect', { start: 0, end: 4 }), // 5 frames
                frameRate: 10,
                repeat: 0 // Toca apenas uma vez
            });
        }

        // Cria o sprite da mira animada
        this.crosshairSprite = this.add.sprite(0, 0, 'crosshair_anim')
            .play('spin_crosshair')
            .setDepth(9999)
            .setScrollFactor(0)
            .setVisible(false);

        this.currentCursor = 'default';

        // Atualiza a mira com o movimento do mouse
        this.input.on('pointermove', (pointer) => {
            const isOverUI = pointer.y > this.scale.height - window.gameConfig.UI_BAR_HEIGHT;

            // Verifica estado do InformationManager
            const infoMgr = this.informationManager;
            const isInstanceMode = infoMgr ? infoMgr.isInstanceMode : false; // false = Normal, true = Instance
            const isDialogOpen = infoMgr ? infoMgr.isDialogOpen() : false;

            // Verifica se painéis estão abertos para restaurar o cursor do mouse
            const isCharPanelOpen = this.characterPanel && this.characterPanel.isVisible;
            const isInventoryOpen = this.inventoryPanel && this.inventoryPanel.isVisible;
            const isHelpOpen = this.instructionsContainer && this.instructionsContainer.visible;
            const isOptionsOpen = this.optionsPanel && this.optionsPanel.isVisible;

            // --- LÓGICA DE CURSOR PARA WARP (BLINK) ---
            if (this.isWarpMode && !isOverUI && !isDialogOpen && !isCharPanelOpen && !isInventoryOpen && !isHelpOpen && !isOptionsOpen) {
                // CORREÇÃO: Usar zoomX e zoomY separados para o modo isométrico
                const cam = this.cameras.main;
                const screenX = (pointer.worldX - cam.worldView.x) * cam.zoomX;
                const screenY = (pointer.worldY - cam.worldView.y) * cam.zoomY;

                this.crosshair.setPosition(screenX, screenY).setVisible(true);
                this.crosshairSprite.setVisible(false); // Esconde sprite de tiro

                if (this.currentCursor !== 'none') {
                    this.input.setDefaultCursor('none');
                    this.currentCursor = 'none';
                }

                // Verifica validade
                const isInvalid = this.missionManager && this.missionManager.isPointInObstacles(pointer.worldX, pointer.worldY);

                if (isInvalid) {
                    this.crosshair.setStrokeStyle(2, 0xff0000); // Vermelho (Inválido)
                    this.crosshair.setFillStyle(0xff0000, 0.3);
                } else {
                    this.crosshair.setStrokeStyle(2, 0x00ff00); // Verde (Válido)
                    this.crosshair.setFillStyle(0x00ff00, 0.3);
                }
                return;
            }

            // Verifica se a unidade tem uma arma válida equipada
            let hasWeapon = true;
            if (this.unitController && this.unitController.selectedUnits.length === 1) {
                const u = this.unitController.selectedUnits[0];
                // Se não tem arma selecionada OU a arma selecionada não existe na config de armas
                if (!u.selectedWeapon || (window.gameConfig.WEAPONS && !window.gameConfig.WEAPONS[u.selectedWeapon])) {
                    hasWeapon = false;
                }
            }

            // Mira aparece apenas se:
            // 1. Não está sobre a UI
            // 2. Está no Modo Instância (Agressivo)
            // 3. Diálogo NÃO está aberto (para poder ver o mouse e clicar no OK)
            // 4. Nenhum painel (Char, Ajuda, Opções, Inventário) está aberto
            // 5. Tem uma arma válida equipada
            const showCrosshair = !isOverUI && isInstanceMode && !isDialogOpen && !isCharPanelOpen && !isInventoryOpen && !isHelpOpen && !isOptionsOpen && hasWeapon;

            if (showCrosshair) {
                // Ajusta para coordenadas de tela (Screen Space) pois o crosshair tem ScrollFactor(0)
                // CORREÇÃO: Usar zoomX e zoomY separados para o modo isométrico
                const cam = this.cameras.main;
                const screenX = (pointer.worldX - cam.worldView.x) * cam.zoomX;
                const screenY = (pointer.worldY - cam.worldView.y) * cam.zoomY;
                this.crosshair.setPosition(screenX, screenY).setVisible(true);
                this.crosshairSprite.setPosition(screenX, screenY).setVisible(true); // Atualiza o sprite animado

                // Reseta estilo da mira para o padrão de tiro (Vermelho)
                this.crosshair.setStrokeStyle(1, 0xff0000);
                this.crosshair.setFillStyle(0xff0000, 0.4);

                if (this.currentCursor !== 'none') {
                    this.input.setDefaultCursor('none'); // Esconde o cursor padrão
                    this.currentCursor = 'none';
                }
            } else {
                this.crosshair.setVisible(false);
                this.crosshairSprite.setVisible(false); // Esconde o sprite animado

                // Em modo normal, usa 'pointer'. Em modo instância (quando não mostra mira), usa 'default'.
                const targetCursor = isInstanceMode ? 'default' : 'pointer';
                if (this.currentCursor !== targetCursor) {
                    this.input.setDefaultCursor(targetCursor);
                    this.currentCursor = targetCursor;
                }
            }
        });



        // Configuração do Overlay de Range (Vermelho Transparente)
        // Usamos add.graphics e setScrollFactor(0) para garantir que a máscara acompanhe a tela corretamente
        this.rangeMaskGraphics = this.add.graphics().setVisible(false).setScrollFactor(0);
        const mask = new Phaser.Display.Masks.BitmapMask(this, this.rangeMaskGraphics);
        mask.invertAlpha = true; // Inverte para mostrar o vermelho ONDE NÃO TEM o círculo

        this.rangeOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xff0000, 0.3)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(8000).setVisible(false);
        this.rangeOverlay.setMask(mask);

        // Configuração do Overlay de Sangue (Vinheta Vermelha)
        this.bloodOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xff0000, 0)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(8500) // Acima do range, abaixo do minimapa/UI
            .setVisible(false);

        // Cria o painel de instruções (inicialmente invisível)
        this.createInstructions();

        // Grid
        this.addGrid();
        this.input.keyboard.on('keydown-H', () => this.toggleGrid());
        this.input.keyboard.on('keydown-M', () => this.handleButtonClick('mapa'));
        this.input.keyboard.on('keydown-R', () => this.handleButtonClick('range'));
        this.input.keyboard.on('keydown-C', () => this.handleButtonClick('personagem'));
        this.input.keyboard.on('keydown-O', () => this.toggleObjectives());

        // Tecla G para abrir o Inventário/Gear (Novo)
        this.input.keyboard.on('keydown-G', () => {
            this.handleButtonClick('inventory');
        });


        // Tecla P para PAUSE (Substitui Debug)
        this.input.keyboard.on('keydown-P', () => {
            this.togglePause();
        });

        // Teclas Q e E para ciclar seleção de personagens
        this.input.keyboard.on('keydown-E', () => this.unitController.selectNextUnit()); // E para o próximo
        this.input.keyboard.on('keydown-Q', () => this.unitController.selectPreviousUnit()); // Q para o anterior

        // Tecla W para Warp
        this.input.keyboard.on('keydown-B', () => this.handleButtonClick('warp'));
        // Tecla F para Stealth
        this.input.keyboard.on('keydown-F', () => this.handleButtonClick('stealth'));
        // Tecla CTRL para Dash Rápido
        this.input.keyboard.on('keydown-CTRL', () => this.performQuickDash());

        // Tecla SHIFT para Parar (Hold Position)
        this.input.keyboard.on('keydown-SHIFT', () => {
            if (this.unitController) {
                this.unitController.selectedUnits.forEach(u => {
                    if (u.stopMovement) u.stopMovement();
                });
            }
        });

        // Teclas 1-4 para usar itens/armas (Atalhos da UI)
        this.input.keyboard.on('keydown-ONE', () => this.uiManager.handleItemSlotClick(0));
        this.input.keyboard.on('keydown-TWO', () => this.uiManager.handleItemSlotClick(1));
        this.input.keyboard.on('keydown-THREE', () => this.uiManager.handleItemSlotClick(2));
        this.input.keyboard.on('keydown-FOUR', () => this.uiManager.handleItemSlotClick(3));

        // Tecla 5 para alternar Câmera Automática (Mouse)
        this.input.keyboard.on('keydown-FIVE', () => {
            if (this.unitController) this.unitController.toggleAutoCameraFollow();
        });

        // Tecla I para Alternar Instância (Normal/Agressiva)
        this.input.keyboard.on('keydown-I', () => {
            this.handleButtonClick('instance');
        });

        // --- CHEAT CODE (war3d) ---
        this.cheatBuffer = '';
        this.input.keyboard.on('keydown', (event) => {
            // Captura apenas caracteres imprimíveis
            if (event.key.length === 1) {
                this.cheatBuffer += event.key.toLowerCase();
                // Mantém o buffer curto para economizar memória
                if (this.cheatBuffer.length > 10) this.cheatBuffer = this.cheatBuffer.slice(-10);

                if (this.cheatBuffer.endsWith('war3d')) {
                    this.closeAllMenus();
                    if (this.debugPanel) this.debugPanel.toggle();
                    this.cheatBuffer = '';
                    if (this.uiManager) this.uiManager.updateStatus("CHEAT: DEBUG MENU");
                }
            }
        });

        // --- Tecla de Clima (0) ---
        this.input.keyboard.on('keydown-ZERO', () => this.cycleWeather());

        // --- Tecla de Sombra (9) ---
        this.input.keyboard.on('keydown-NINE', () => this.toggleShadows());

        // --- Tecla de Fumaça (8) ---
        this.input.keyboard.on('keydown-EIGHT', () => this.toggleExhaustSmoke()); 

        // --- Tecla de Efeito do Timer (7) ---
        this.input.keyboard.on('keydown-SEVEN', () => {
            if (this.missionManager) {
                const isEnabled = this.missionManager.toggleTimerGlow();
                if (this.uiManager) {
                    const statusKey = isEnabled ? 'status_timer_glow_on' : 'status_timer_glow_off';
                    this.uiManager.updateStatus(this.languageManager.get(statusKey));
                }
            }
        });

        // --- Teclas de Zoom (+ / -) ---
        this.input.keyboard.on('keydown-PLUS', () => this.adjustZoom(0.05));
        this.input.keyboard.on('keydown-NUMPAD_ADD', () => this.adjustZoom(0.05));
        this.input.keyboard.on('keydown-MINUS', () => this.adjustZoom(-0.05));
        this.input.keyboard.on('keydown-NUMPAD_SUBTRACT', () => this.adjustZoom(-0.05));

        // --- Tecla de Teste Isométrico (Numpad 4) ---
        this.input.keyboard.on('keydown-NUMPAD_FOUR', () => this.toggleIsometricTest());

        // --- Tecla de Teste de Movimento em Grade (Numpad 5) ---
        this.input.keyboard.on('keydown-NUMPAD_FIVE', () => this.toggleGridMovementTest());

        // --- FPS Text ---
        this.fpsText = this.add.text(this.scale.width / 2, 40, 'FPS: 0', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100000).setVisible(this.showFps);

        // Tecla ESC para fechar janelas ou abrir Opções
        this.input.keyboard.on('keydown-ESC', () => {
            // Se a missão acabou, ignora para deixar o MissionManager lidar com o ESC
            if (this.missionManager && this.missionManager.isGameOver) return;

            // Verifica se alguma janela está aberta
            const anyOpen = (this.mapContainer && this.mapContainer.visible) ||
                            (this.informationManager && (this.informationManager.isShopOpen() || this.informationManager.isDialogOpen())) ||
                            (this.inventoryPanel && this.inventoryPanel.isVisible) ||
                            (this.characterPanel && this.characterPanel.isVisible) ||
                            (this.instructionsContainer && this.instructionsContainer.visible) ||
                            (this.optionsPanel && this.optionsPanel.isVisible) ||
                            (this.debugPanel && this.debugPanel.isVisible);

            if (anyOpen) {
                this.closeAllMenus();
            } else {
                this.handleButtonClick('opcoes');
            }
        });

        // Listener para redimensionamento da tela (ex: entrar/sair de tela cheia)
        this.scale.on('resize', this.handleResize, this);

        // Remove o listener quando a cena for desligada
        this.events.on('shutdown', () => {
            window.gameScene = null; // Limpa a referência ao sair da cena
            this.scale.off('resize', this.handleResize, this);

            // Para todos os timers da cena para evitar que executem durante o restart
            if (this.puddleTimer) {
                this.puddleTimer.remove(false);
                this.puddleTimer = null;
            }
            if (this.lightningTimer) {
                this.lightningTimer.remove(false);
                this.lightningTimer = null;
            }
            if (this.warpTimeoutEvent) {
                this.warpTimeoutEvent.remove(false);
                this.warpTimeoutEvent = null;
            }
        });

        // Tenta bloquear a tecla ESC ao entrar em tela cheia (Funciona em Chrome/Edge)
        this.scale.on('enterfullscreen', () => {
            localStorage.setItem('brics_fullscreen', 'true');
            if (navigator.keyboard && navigator.keyboard.lock) {
                navigator.keyboard.lock(['Escape']).catch(e => console.log('Erro ao travar ESC:', e));
            }
            // Força atualização da UI após um breve delay para garantir dimensões corretas
            this.time.delayedCall(200, () => {
                this.handleResize(this.scale.gameSize);
            });
        });
        this.scale.on('leavefullscreen', () => {
            localStorage.setItem('brics_fullscreen', 'false');
        });

        // Listener para mudança de idioma
        this.events.on('languageChanged', () => {
            // Em vez de reiniciar a cena (o que perderia o progresso do jogo),
            // vamos recriar/atualizar os componentes de UI que contêm texto.
            this.updateAllUITexts();
        });
    }

    updateAllUITexts() {
        // Recria UIs complexas que já possuem um método para isso.
        // Isso garante que todos os seus textos internos sejam atualizados.
        if (this.uiManager) this.uiManager.destroyAndRecreate();
        if (this.characterPanel) this.characterPanel.destroyAndRecreate();
        if (this.inventoryPanel) this.inventoryPanel.destroyAndRecreate();
        if (this.debugPanel) this.debugPanel.destroyAndRecreate();
        
        // Se o painel de opções estiver visível, ele também precisa ser recriado.
        if (this.optionsPanel && this.optionsPanel.isVisible) {
            this.optionsPanel.destroyAndRecreate();
        }

        // Atualiza a lista de objetivos.
        if (this.missionManager) this.missionManager.updateUI();
        
        // Atualiza o texto da tela de pause, se ela existir.
        this.updatePauseScreenText();
    }

    updatePauseScreenText() {
        // Se a tela de pause já foi criada, apenas atualiza o texto.
        if (this.pauseContainer) {
            const textObject = this.pauseContainer.getAt(1); // O texto é o segundo elemento adicionado.
            if (textObject) {
                textObject.setText(this.languageManager.get('game_paused'));
            }
        }
    }

    handleResize(gameSize) {
        // Redimensiona a câmera de UI
        if (this.uiCamera) {
            this.uiCamera.setSize(gameSize.width, gameSize.height);
        }
        // Redesenha a UI principal que depende do tamanho da tela
        if (this.uiManager) {
            this.uiManager.destroyAndRecreate();
        }
        // Redesenha o minimapa
        if (this.minimap) {
            this.minimap.destroyAndRecreate();
        }
        // Redesenha o painel de opções, preservando a visibilidade
        if (this.optionsPanel) {
            this.optionsPanel.destroyAndRecreate();
        }
        // Redesenha o painel de debug
        if (this.debugPanel) {
            this.debugPanel.destroyAndRecreate();
        }
        // Redesenha o painel de personagem, preservando a visibilidade
        if (this.characterPanel) {
            this.characterPanel.destroyAndRecreate();
        }
        // Redesenha o painel de inventário
        if (this.inventoryPanel) {
            this.inventoryPanel.destroyAndRecreate();
        }
        if (this.accessibilityManager && this.accessibilityManager.resize) {
            this.accessibilityManager.resize(gameSize.width, gameSize.height);
        }
        // Reposiciona containers simples
        if (this.instructionsContainer) {
            this.instructionsContainer.setPosition(gameSize.width / 2, gameSize.height / 2);
        }
        if (this.instructionsBlocker) {
            this.instructionsBlocker.setSize(gameSize.width, gameSize.height);
        }
        // Redimensiona overlays de tela cheia
        if (this.bloodOverlay) {
            this.bloodOverlay.setSize(gameSize.width, gameSize.height);
        }
        if (this.rangeOverlay) {
            this.rangeOverlay.setSize(gameSize.width, gameSize.height);
        }
        // Redimensiona o MissionManager (Timer e Barra de Sobrevivência)
        if (this.missionManager) {
            this.missionManager.resize(gameSize.width, gameSize.height);
        }
        // Redimensiona o overlay de Pause
        if (this.pauseContainer) {
            const bg = this.pauseContainer.list[0];
            const text = this.pauseContainer.list[1];
            bg.setPosition(gameSize.width / 2, gameSize.height / 2).setSize(gameSize.width, gameSize.height);
            text.setPosition(gameSize.width / 2, gameSize.height / 2);
        }
        // Reposiciona FPS
        if (this.fpsText) {
            this.fpsText.setPosition(gameSize.width / 2, 40);
        }
        if (this.mapContainer) {
            this.mapContainer.setPosition(gameSize.width / 2, gameSize.height / 2);
        }
        if (this.warpInstructionText) {
            this.warpInstructionText.setPosition(gameSize.width / 2, gameSize.height / 3);
        }
        if (this.brightnessOverlay && this.brightnessOverlay.scene) {
            this.brightnessOverlay.setSize(gameSize.width, gameSize.height);
        }
    }

    playMissionMusic() {
        const urlParams = new URLSearchParams(window.location.search);
        const missionId = urlParams.get('mission') || 'missao1';
        // Mapeia 'missao1' para 'missao_1' (formato da chave no config.js)
        const soundKey = missionId.replace('missao', 'missao_');

        if (this.soundManager) {
            this.soundManager.play(soundKey, { loop: true, volume: 0.4 });
        }
    }

    createMapBoundaries(width, height) {
        this.mapBoundaries = this.physics.add.staticGroup();
        const thickness = 100; // Espessura da parede invisível

        // Parede Direita
        this.mapBoundaries.create(width + thickness / 2, height / 2, null).setSize(thickness, height).setVisible(false);
        // Parede Inferior
        this.mapBoundaries.create(width / 2, height + thickness / 2, null).setSize(width, thickness).setVisible(false);
        // Parede Esquerda
        this.mapBoundaries.create(-thickness / 2, height / 2, null).setSize(thickness, height).setVisible(false);
        // Parede Superior
        this.mapBoundaries.create(width / 2, -thickness / 2, null).setSize(width, thickness).setVisible(false);
    }

    createInstructions() {
        this.instructionsContainer = this.add.container(this.scale.width / 2, this.scale.height / 2)
            .setScrollFactor(0).setDepth(10006).setVisible(false);

        // Blocker para Instructions (Fundo transparente que fecha ao clicar)
        this.instructionsBlocker = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.01)
            .setInteractive()
            .setScrollFactor(0);
        this.instructionsBlocker.on('pointerdown', () => this.handleButtonClick('instrucoes'));
        this.instructionsContainer.add(this.instructionsBlocker);

        const bg = this.add.rectangle(0, 0, 420, 580, 0x000000, 0.9)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive(); // Bloqueia interação
        
        // Impede que o clique no painel feche a janela
        bg.on('pointerdown', (pointer, localX, localY, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
        });
        
        const title = this.add.text(0, -260, this.languageManager.get('instructions_title'), {
            fontSize: '20px', color: '#00ff00', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Posiciona o conteúdo abaixo do título e alinha pelo topo para evitar sobreposição.
        const content = this.add.text(0, -230, this.languageManager.get('instructions_content'),
            { fontSize: '16px', color: '#ffffff', align: 'center', fontFamily: 'Arial', lineSpacing: 6 }
        ).setOrigin(0.5, 0);

        this.instructionsContainer.add([bg, title, content]);
    }

    adjustZoom(delta) {
        this.targetZoom = Phaser.Math.Clamp(this.targetZoom + delta, 0.9, 2.7);
        this.saveZoom();
        this.applyCurrentZoom();
        if (this.uiManager) this.uiManager.updateStatus(this.languageManager.get('status_zoom', { value: this.targetZoom.toFixed(1) }));
    }

    setZoom(value) {
        this.targetZoom = Phaser.Math.Clamp(value, 0.9, 2.7);
        this.saveZoom();
        this.applyCurrentZoom();
    }

    saveZoom() {
        localStorage.setItem('brics_zoom', this.targetZoom);
    }

    setBrightness(value) {
        this.targetBrightness = Phaser.Math.Clamp(value, 0.5, 1.5);
        localStorage.setItem('brics_brightness', this.targetBrightness);

        if (this.brightnessOverlay) {
            if (this.targetBrightness < 1.0) {
                this.brightnessOverlay.setFillStyle(0x000000, 1 - this.targetBrightness);
                this.brightnessOverlay.setBlendMode(Phaser.BlendModes.NORMAL);
            } else {
                this.brightnessOverlay.setFillStyle(0xffffff, this.targetBrightness - 1);
                this.brightnessOverlay.setBlendMode(Phaser.BlendModes.ADD);
            }
        }

        if (this.optionsPanel) this.optionsPanel.updateBrightnessDisplay();
    }

    toggleIsometricTest() {
        this.isIsometricTest = !this.isIsometricTest;
        this.applyCurrentZoom();
        if (this.uiManager) { 
            const statusKey = this.isIsometricTest ? 'status_isometric_on' : 'status_isometric_off';
            this.uiManager.updateStatus(this.languageManager.get(statusKey));
        }
    }

    toggleGridMovementTest() {
        this.isGridMovementTest = !this.isGridMovementTest;
        if (this.uiManager) {
            const statusKey = this.isGridMovementTest ? 'status_grid_movement_on' : 'status_grid_movement_off';
            this.uiManager.updateStatus(this.languageManager.get(statusKey));
        }
    }

    applyCurrentZoom() {
        if (this.isIsometricTest) {
            // Achata o eixo Y para simular uma visão isométrica/dimétrica
            // Ajustado X para 0.7 para compensar a largura e deixar os personagens menos "gordos"
            this.cameras.main.setZoom(this.targetZoom * this.isometricZoomX, this.targetZoom * 0.6);

            // Ativa o shader de shear para adicionar a "rotação"
            if (this.isometricEffect) {
                this.isometricEffect.active = true;
                this.isometricEffect.shear = -0.5; // Valor negativo inclina para a esquerda
            }
        } else {
            // Restaura o zoom normal
            this.cameras.main.setZoom(this.targetZoom);
            // Desativa o shader
            if (this.isometricEffect) {
                this.isometricEffect.active = false;
            }
        }
    }

    setIsometricZoomX(value) {
        this.isometricZoomX = value;
        this.applyCurrentZoom();
    }

    update(time, delta) {
        // Atualiza painéis de UI que precisam seguir o mouse (tooltips), mesmo se pausado.
        if (this.characterPanel) {
            this.characterPanel.update();
        }
        if (this.inventoryPanel) {
            this.inventoryPanel.update();
        }

        // Atualiza FPS
        if (this.showFps && this.fpsText) {
            this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
        }

        if (!this.isPaused) {
            // --- LÓGICA DE STEALTH (Timer e Cooldown) ---
            if (this.isStealthMode) {
                this.currentStealthTime -= delta;

                // Atualiza Barra de Stealth
                const { width } = this.scale;
                const barX = width / 2;
                const barY = 45; // Abaixo do timer

                if (this.stealthBarBg) this.stealthBarBg.setPosition(barX, barY).setVisible(true);

                const percent = Math.max(0, this.currentStealthTime / this.stealthDuration);
                const maxWidth = 198;

                if (this.stealthBarFill) {
                    this.stealthBarFill.setPosition(barX - maxWidth / 2, barY).setVisible(true);
                    this.stealthBarFill.width = maxWidth * percent;
                }

                if (this.currentStealthTime <= 0) {
                    this.exitStealthMode();
                }
            } else {
                if (this.stealthBarBg && this.stealthBarBg.visible) this.stealthBarBg.setVisible(false);
                if (this.stealthBarFill && this.stealthBarFill.visible) this.stealthBarFill.setVisible(false);

                if (this.currentCooldownTime > 0) {
                    this.currentCooldownTime -= delta;
                    if (this.currentCooldownTime <= 0) {
                        this.currentCooldownTime = 0;
                        if (this.uiManager) { 
                            this.uiManager.updateStatus(this.languageManager.get('status_stealth_ready'));
                            this.uiManager.enableButton('stealth', true);
                            this.uiManager.flashButton('stealth');
                        }
                    }
                }
            }

            // --- LÓGICA DE DASH (Cooldown) ---
            if (this.currentQuickDashCooldown > 0) {
                this.currentQuickDashCooldown -= delta;
                if (this.currentQuickDashCooldown <= 0) {
                    this.currentQuickDashCooldown = 0; 
                    if (this.uiManager) { 
                        this.uiManager.updateStatus(this.languageManager.get('status_dash_ready'));
                        this.uiManager.enableButton('dash', true);
                        this.uiManager.flashButton('dash');
                    }
                }
            }

            // --- LÓGICA DE WARP/BLINK (Cooldown) ---
            if (this.currentWarpCooldown > 0) {
                this.currentWarpCooldown -= delta;
                if (this.currentWarpCooldown <= 0) {
                    this.currentWarpCooldown = 0;
                    if (this.uiManager) {
                        this.uiManager.enableButton('warp', true);
                        this.uiManager.flashButton('warp');
                    }
                }
            }

            // Movimento da Câmera
            const cam = this.cameras.main;
            const speed = 10;
            const isKeyDown = this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown;

            // Só permite movimento manual da câmera se o modo teclado NÃO estiver ativo
            if (isKeyDown && (!this.keyboardManager || !this.keyboardManager.isActive)) {
                cam.stopFollow();

                if (this.cursors.left.isDown) cam.scrollX -= speed;
                if (this.cursors.right.isDown) cam.scrollX += speed;
                if (this.cursors.up.isDown) cam.scrollY -= speed;
                if (this.cursors.down.isDown) cam.scrollY += speed;
            }

            // Atualiza lógica de cada player (barra de vida, depth sort)
            this.players.forEach(p => {
                p.update();
            });

            // Atualiza verificação de interiores (entrar/sair)
            this.interiorsManager.update();

            // Atualiza NPCs
            this.npcManager.update(time, delta);

            // Atualiza Itens (Coleta)
            this.itemsManager.update();

            // Atualiza Missão (Timer e Condições de Vitória/Derrota)
            this.missionManager.update(time, delta);

            // Atualiza InformationManager (Depth sort dos NPCs de info)
            this.informationManager.update(time, delta);

            // Atualiza Minimapa
            if (this.minimap) this.minimap.update();

            // Processa a lógica de movimento do Joystick
            this.handleJoystickMovement();

            // Atualiza Gerenciador de Teclado
            if (this.keyboardManager) this.keyboardManager.update(time, delta);

            // Atualiza Gerenciador de Tempo (Ciclo Climático)
            if (this.tempoManager) this.tempoManager.update(time, delta);

            // Atualiza os slots da UI (Barra inferior)
            if (this.uiManager && this.unitController) {
                this.uiManager.updateItemSlots(this.unitController.selectedUnits);
                this.uiManager.updatePlayerSlots(); // Atualiza vida e seleção dos retratos
                this.uiManager.updateTeamInfo(); // Atualiza a barra de XP do time
            }

            // Enable/disable buttons based on selection
            if (this.uiManager && this.unitController) {
                const selectedUnits = this.unitController.selectedUnits;
                const activeUnits = this.players.filter(p => p.sprite && p.sprite.active);
                const allSelected = activeUnits.length > 0 && activeUnits.every(p => selectedUnits.includes(p));
                const enableButtons = !allSelected; // Disable if all selected
                this.uiManager.enableButton('range', enableButtons);
                this.uiManager.enableButton('personagem', true);
            }

            // Atualiza Overlay de Range

            if (this.showRange && this.rangeOverlay) {
                const selectedUnits = (this.unitController && this.unitController.selectedUnits) ? this.unitController.selectedUnits : [];


                // Regra: Só funciona se tiver APENAS UMA unidade selecionada
                if (selectedUnits.length === 1) {
                    this.rangeOverlay.setVisible(true);

                    let range = window.gameConfig.SHOOT_DISTANCE || 400;
                    const cam = this.cameras.main;
                    const unit = selectedUnits[0];


                    if (unit.selectedWeapon && window.gameConfig.WEAPONS[unit.selectedWeapon]) {
                        range = window.gameConfig.WEAPONS[unit.selectedWeapon].range;

                    } else {

                    }


                    if (unit.sprite && unit.sprite.active) {

                        this.rangeMaskGraphics.clear();
                        this.rangeMaskGraphics.fillStyle(0xffffff);
                        // O range está em unidades do mundo: converte para pixels de tela (zoomX/zoomY diferem no modo isométrico)
                        this.rangeMaskGraphics.fillEllipse(0, 0, range * 2 * cam.zoomX, range * 2 * cam.zoomY);

                        // Atualiza a posição do gráfico da máscara para seguir o player (em coordenadas de tela)
                        const screenX = (unit.x - cam.worldView.x) * cam.zoomX;
                        const screenY = (unit.y - cam.worldView.y) * cam.zoomY;

                        this.rangeMaskGraphics.setPosition(screenX, screenY);
                    } else {

                    }
                } else {
                    // Se não tiver exatamente 1 unidade, esconde o overlay

                    this.rangeOverlay.setVisible(false);
                }
            } else if (this.rangeOverlay) {

                this.rangeOverlay.setVisible(false);
            }

            // Atualiza Overlay de Sangue (Vida Baixa < 20%)
            if (this.unitController && this.unitController.selectedUnits.length > 0) {
                // Verifica se algum personagem selecionado está com vida crítica (usa a vida máxima de cada unidade)
                const hasLowHealth = this.unitController.selectedUnits.some(u => {
                    const maxHealth = u.maxHp || window.gameConfig.MAX_HEALTH || 100;
                    return (u.health / maxHealth) < 0.2 && u.health > 0;
                });

                if (hasLowHealth) {
                    this.bloodOverlay.setVisible(true);
                    // Efeito pulsante (senoide) para dar urgência
                    const alpha = 0.2 + Math.abs(Math.sin(time * 0.005)) * 0.15;
                    this.bloodOverlay.setFillStyle(0xff0000, alpha);
                } else {
                    this.bloodOverlay.setVisible(false);
                }
            } else {
                this.bloodOverlay.setVisible(false);
            }

            // --- EFEITO DE ONDULAÇÃO NAS POÇAS ---
            if (this.puddlesGroup) {
                // Verifica Jogadores
                this.players.forEach(player => {
                    if (player.sprite && player.sprite.active && player.sprite.body && player.sprite.body.speed > 10) {
                        this.physics.overlap(player.sprite, this.puddlesGroup, () => {
                            this.triggerRipple(player, time);
                        });
                    }
                });

                // Verifica NPCs
                if (this.npcManager && this.npcManager.npcs) {
                    this.npcManager.npcs.forEach(npc => {
                        if (npc.active && npc.body && npc.body.speed > 10) {
                            this.physics.overlap(npc, this.puddlesGroup, () => {
                                this.triggerRipple(npc, time);
                            });
                        }
                    });
                }
            }
        }

        // Gerencia filtros de câmera (Separa UI do Mundo) - Executado no final para pegar itens recriados
        this.updateCameraFilters();

        // Atualiza o efeito de insanidade na tela
        this.updateInsanityEffect();
    }

    updateCameraFilters() {
        // IDs das câmeras (Bitmask)
        // Main Camera (World) geralmente é ID 1
        // UI Camera será ID 2
        const worldCamID = this.cameras.main.id;
        const uiCamID = this.uiCamera ? this.uiCamera.id : 0;

        if (!uiCamID) return;

        // Itera sobre todos os objetos da cena para definir onde devem aparecer
        this.children.list.forEach(child => {
            // Heurística: Se scrollFactor é 0, é UI. Se não, é Mundo.
            // Exceção: Chuva/Clima (rainEmitter) tem scroll 0 mas queremos que apareça na UI Camera (overlay fixo)
            // ou na World Camera? Se for overlay de tela, UI Camera é o lugar certo.

            if (child.scrollFactorX === 0 && child.scrollFactorY === 0) {
                // É UI: Esconde da câmera do Mundo
                if (child.cameraFilter !== worldCamID) child.cameraFilter = worldCamID;
            } else {
                // É Mundo: Esconde da câmera de UI
                if (child.cameraFilter !== uiCamID) child.cameraFilter = uiCamID;
            }
        });
    }

    cycleColorBlindMode() {
        const modes = ['NONE', 'PROTANOPIA', 'DEUTERANOPIA', 'TRITANOPIA'];
        const currentIndex = modes.indexOf(this.colorBlindMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.colorBlindMode = modes[nextIndex];
        localStorage.setItem('brics_colorblind', this.colorBlindMode);

        if (this.uiManager) this.uiManager.updatePlayerSlots();
        if (this.optionsPanel) this.optionsPanel.updateColorBlindDisplay();

        // Atualiza barras de vida dos NPCs imediatamente
        if (this.npcManager && this.npcManager.npcs) {
            this.npcManager.npcs.forEach(npc => {
                if (npc.active && !npc.isDead) this.npcManager.drawHealthBar(npc);
            });
        }

        // Atualiza barras de vida dos Players imediatamente (se visíveis)
        this.players.forEach(p => {
            if (p.sprite && p.sprite.active && p.health > 0 && p.drawHealthBar) p.drawHealthBar();
        });

        // Aplica o filtro global de WebGL
        this.applyColorBlindFilter();
    }

    applyColorBlindFilter() {
        // Só funciona em WebGL
        if (!this.worldColorFX || !this.uiColorFX) return;

        // Reseta filtros anteriores
        this.worldColorFX.reset();
        this.uiColorFX.reset();

        const mode = this.colorBlindMode;

        if (mode === 'NONE') return;

        // 1. Aumenta o contraste globalmente (ajuda na distinção)
        const contrastAmount = 1.2;
        this.worldColorFX.contrast(contrastAmount);
        this.uiColorFX.contrast(contrastAmount);

        // 2. Rotaciona as cores (Hue Shift) para separar tons confusos
        if (mode === 'PROTANOPIA' || mode === 'DEUTERANOPIA') {
            // Vermelho/Verde: Rotaciona para afastar o Verde do Vermelho (Verde vira mais Azulado)
            this.worldColorFX.hue(40);
            this.uiColorFX.hue(40);
        } else if (mode === 'TRITANOPIA') {
            this.worldColorFX.hue(90);
            this.uiColorFX.hue(90);
        }
    }

    getHealthColor(percent) {
        const mode = this.colorBlindMode;

        if (mode === 'PROTANOPIA' || mode === 'DEUTERANOPIA') {
            // Azul / Amarelo / Laranja (Alto contraste para Vermelho-Verde)
            if (percent > 0.6) return 0x0077ff;
            if (percent > 0.3) return 0xffd700;
            return 0xff4400;
        }
        if (mode === 'TRITANOPIA') {
            // Ciano / Branco / Vermelho (Evita confusão Azul-Verde e Amarelo-Violeta)
            if (percent > 0.6) return 0x00ffff;
            if (percent > 0.3) return 0xffffff;
            return 0xff0000;
        }
        // Padrão (NONE)
        if (percent > 0.6) return 0x00ff00;
        if (percent > 0.3) return 0xffff00;
        return 0xff0000;
    }

    getEntityColor(type) {
        const mode = this.colorBlindMode;

        let colors = {
            player: 0x00ff00, // Verde
            enemy: 0xff0000,  // Vermelho
            civilian: 0xffff00, // Amarelo
            target: 0xffffff  // Branco
        };

        if (mode === 'PROTANOPIA' || mode === 'DEUTERANOPIA') {
            colors.player = 0x0077ff; // Azul (Aliado)
            colors.enemy = 0xffd700;  // Amarelo/Ouro (Inimigo)
            colors.civilian = 0xffffff; // Branco (Neutro)
        } else if (mode === 'TRITANOPIA') {
            colors.player = 0x00ffff; // Ciano
            colors.enemy = 0xff0000;  // Vermelho
            colors.civilian = 0xff00ff; // Magenta
        }

        return colors[type] || 0xffffff;
    }

    toggleShadows() {
        this.showShadows = !this.showShadows;
        localStorage.setItem('brics_shadows', this.showShadows);
        this.players.forEach(p => {
            if (p.toggleShadow) p.toggleShadow(this.showShadows);
        });
        if (this.npcManager) {
            this.npcManager.toggleShadows(this.showShadows);
        }
        if (this.informationManager) {
            this.informationManager.toggleShadows(this.showShadows);
        }
        if (this.uiManager) { 
            const statusKey = this.showShadows ? 'status_shadows_on' : 'status_shadows_off';
            this.uiManager.updateStatus(this.languageManager.get(statusKey));
        }
        // Atualiza o painel de opções se estiver aberto
        if (this.optionsPanel && this.optionsPanel.isVisible) {
            this.optionsPanel.updateShadowsDisplay();
        }
    }
 
    toggleFps() {
        this.showFps = !this.showFps;
        localStorage.setItem('brics_show_fps', this.showFps);
        if (this.fpsText) this.fpsText.setVisible(this.showFps);

        if (this.uiManager) {
            const statusKey = this.showFps ? 'options_on' : 'options_off';
            this.uiManager.updateStatus(`${this.languageManager.get('options_fps')}: ${this.languageManager.get(statusKey)}`);
        }
        // Atualiza o painel de opções se estiver aberto
        if (this.optionsPanel && this.optionsPanel.isVisible) {
            this.optionsPanel.updateFpsDisplay();
        }
    }

    toggleExhaustSmoke() {
        this.showExhaustSmoke = !this.showExhaustSmoke;
        if (this.uiManager) { 
            const statusKey = this.showExhaustSmoke ? 'status_exhaust_smoke_on' : 'status_exhaust_smoke_off';
            this.uiManager.updateStatus(this.languageManager.get(statusKey));
        }
        // A lógica de mostrar/esconder é tratada no NPCManager.update
    }

    spawnNewTeamMember() {
        const currentCount = this.players.length;
        if (currentCount >= 5) return;

        const nextIndex = currentCount;
        if (nextIndex >= window.gameConfig.ALL_PLAYERS.length) return;

        const spawnData = window.gameConfig.ALL_PLAYERS[nextIndex];

        // Determina posição de spawn perto do líder (primeiro jogador vivo)
        let spawnX = spawnData.x;
        let spawnY = spawnData.y;

        const leader = this.players.find(p => p.health > 0);
        if (leader) {
            spawnX = leader.x + 40;
            spawnY = leader.y;
        }

        // Cria configuração com nova posição
        const newPlayerConfig = { ...spawnData, x: spawnX, y: spawnY };

        const player = new Player(this, newPlayerConfig);
        player.squadIndex = nextIndex + 1;

        if (player.sprite) {
            this.players.push(player);

            // Adiciona colisões (Cenário, Interiores, Bordas) - mesmo callback dos players iniciais
            const stopOnHit = (playerSprite) => {
                if (playerSprite && playerSprite._unit && playerSprite._unit.stopMovement) {
                    playerSprite._unit.stopMovement();
                }
            };
            const scenarioObs = this.scenarioManager.getObstacles();
            if (scenarioObs) this.physics.add.collider(player.sprite, scenarioObs, stopOnHit);

            const interiorObs = this.interiorsManager.getObstacles();
            if (interiorObs) this.physics.add.collider(player.sprite, interiorObs, stopOnHit);

            if (this.mapBoundaries) this.physics.add.collider(player.sprite, this.mapBoundaries);

            // Efeito visual de Summon
            if (this.anims.exists('summon_anim')) {
                const effect = this.add.sprite(spawnX, spawnY, 'summon_effect').play('summon_anim');
                effect.setDepth(spawnY + 100);
                effect.once('animationcomplete', () => effect.destroy());
            }

            // Aplica configuração atual de sombra
            if (player.toggleShadow) player.toggleShadow(this.showShadows);

            // Atualiza UI
            if (this.uiManager) {
                this.uiManager.updatePlayerSlots();
                // this.uiManager.updateStatus(`REFORÇOS: ${player.name} entrou no esquadrão!`);
            }

            // Notificação de Reforço (Rank e Nome)
            let rankKey = 'notification_rank_soldier';
            if (nextIndex === 3) rankKey = 'notification_rank_lieutenant';
            if (nextIndex === 4) rankKey = 'notification_rank_colonel';

            this.showReinforcementNotification(this.languageManager.get(rankKey), player.name);

            // Seleciona todos automaticamente para incluir o novo membro
            this.handleButtonClick('todos');
        }
    }
 
    showReinforcementNotification(rank, name) {
        const { width, height } = this.scale;

        const container = this.add.container(width / 2, height / 2).setScrollFactor(0).setDepth(100000);

        // Texto Principal
        const mainText = this.add.text(0, -40, this.languageManager.get('notification_reinforcements_arriving'), {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#00ffff', // Ciano (Neon)
            stroke: '#000000',
            strokeThickness: 6,
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        // Texto do Rank e Nome
        const subText = this.add.text(0, 20, `${rank}: ${name}`, {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffd700', // Dourado
            stroke: '#000000',
            strokeThickness: 6,
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        container.add([mainText, subText]);
        container.setScale(0);

        // Animação de Entrada (Pop)
        this.tweens.add({
            targets: container,
            scale: 1,
            duration: 500,
            ease: 'Back.out',
            onComplete: () => {
                // Espera 3 segundos
                this.time.delayedCall(3000, () => {
                    // Animação de Saída (Fade out e sobe)
                    this.tweens.add({
                        targets: container,
                        alpha: 0,
                        y: height / 2 - 100,
                        duration: 500,
                        onComplete: () => container.destroy()
                    });
                });
            }
        });
    }

    // --- NOVO SISTEMA DE CLIMA ---

    cycleWeather() {
        this.currentWeatherIndex = (this.currentWeatherIndex + 1) % this.weatherTypes.length;
        const newWeather = this.weatherTypes[this.currentWeatherIndex]; 
        this.applyWeather(newWeather);

        let statusText = '';
        switch (newWeather) {
            case 'none': statusText = 'Clima: Limpo'; break; // TODO: Translate
            case 'light': statusText = 'Clima: Chuva Leve'; break; // TODO: Translate
            case 'standard': statusText = 'Clima: Chuva'; break; // TODO: Translate
            case 'heavy': statusText = 'Clima: Tempestade'; break; // TODO: Translate
            case 'storm': statusText = 'Clima: Trovoada'; break; // TODO: Translate
            case 'fog_light': statusText = 'Clima: Neblina Dispersa'; break; // TODO: Translate
            case 'fog_heavy': statusText = 'Clima: Neblina Densa'; break; // TODO: Translate
            case 'light_puddles': statusText = 'Clima: Chuva Leve + Poças'; break; // TODO: Translate
            case 'standard_puddles': statusText = 'Clima: Chuva + Poças'; break; // TODO: Translate
            case 'heavy_puddles': statusText = 'Clima: Tempestade + Poças'; break; // TODO: Translate
            case 'storm_puddles': statusText = 'Clima: Trovoada + Poças'; break; // TODO: Translate
            case 'wind_light': statusText = 'Clima: Ventania Leve'; break; // TODO: Translate
            case 'wind_medium': statusText = 'Clima: Ventania Média'; break; // TODO: Translate
            case 'wind_strong': statusText = 'Clima: Ventania Forte'; break; // TODO: Translate
            case 'sand_light': statusText = 'Clima: Tempestade de Areia Leve'; break; // TODO: Translate
            case 'sand_medium': statusText = 'Clima: Tempestade de Areia Média'; break; // TODO: Translate
            case 'sand_heavy': statusText = 'Clima: Tempestade de Areia Forte'; break; // TODO: Translate
        }
        if (this.uiManager) this.uiManager.updateStatus(statusText);
    }

    applyWeather(weatherType) {
        // Limpa efeitos anteriores
        this.stopRain();
        this.stopLightning();
        this.stopFog();
        this.stopPuddles();
        this.stopWind();

        switch (weatherType) {
            case 'light':
                this.startRain({ quantity: 2, frequency: 20, speedY: { min: 600, max: 800 }, speedX: { min: -10, max: 10 } });
                break;
            case 'standard':
                this.startRain({ quantity: 6, frequency: 5, speedY: { min: 800, max: 1200 }, speedX: { min: -20, max: 20 } });
                break;
            case 'heavy':
                // Chuva com vento
                this.startRain({ quantity: 10, frequency: 1, speedY: { min: 900, max: 1300 }, speedX: { min: 150, max: 200 } });
                break;
            case 'storm':
                // Chuva com vento e raios
                this.startRain({ quantity: 12, frequency: 1, speedY: { min: 1000, max: 1400 }, speedX: { min: 200, max: 250 } });
                this.startLightning();
                break;
            case 'fog_light':
                this.startFog({ alpha: 0.3, quantity: 1, frequency: 6000, scale: { min: 2, max: 4 } });
                break;
            case 'fog_heavy':
                this.startFog({ alpha: 0.6, quantity: 2, frequency: 800, scale: { min: 4, max: 8 } });
                break;
            case 'light_puddles':
                this.startRain({ quantity: 2, frequency: 20, speedY: { min: 600, max: 800 }, speedX: { min: -10, max: 10 } });

                this.startPuddles();
                break;
            case 'standard_puddles':
                this.startRain({ quantity: 6, frequency: 5, speedY: { min: 800, max: 1200 }, speedX: { min: -20, max: 20 } });

                this.startPuddles();
                break;
            case 'heavy_puddles':
                this.startRain({ quantity: 10, frequency: 1, speedY: { min: 900, max: 1300 }, speedX: { min: 150, max: 200 } });
                this.startLightning();
                this.startPuddles();
                break;
            case 'storm_puddles':
                this.startRain({ quantity: 12, frequency: 1, speedY: { min: 1000, max: 1400 }, speedX: { min: 200, max: 250 } });
                this.startLightning();
                this.startPuddles();
                break;
            case 'wind_light':
                this.startWind({ speedX: { min: 400, max: 600 }, quantity: 1, frequency: 300, alpha: 0.4, scale: { min: 0.5, max: 1 } });
                break;
            case 'wind_medium':
                this.startWind({ speedX: { min: 800, max: 1200 }, quantity: 2, frequency: 100, alpha: 0.6, scale: { min: 0.8, max: 1.2 } });
                break;
            case 'wind_strong':
                this.startWind({ speedX: { min: 1500, max: 2000 }, quantity: 5, frequency: 40, alpha: 0.8, scale: { min: 1, max: 1.5 } });
                break;
            case 'sand_light':
                this.startSandstorm({ quantity: 2, frequency: 20, speedY: { min: 600, max: 800 }, speedX: { min: 200, max: 300 } });
                break;
            case 'sand_medium':
                this.startSandstorm({ quantity: 6, frequency: 5, speedY: { min: 800, max: 1200 }, speedX: { min: 400, max: 600 } });
                break;
            case 'sand_heavy':
                this.startSandstorm({ quantity: 12, frequency: 1, speedY: { min: 1000, max: 1400 }, speedX: { min: 700, max: 900 } });
                break;
            case 'none':
            default:
                // Nenhum efeito
                break;
        }
    }

    startRain(config) {
        // Gera a textura da gota de chuva se não existir
        if (!this.textures.exists('rain_drop')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xccccff, 0.6); // Azul claro quase branco
            g.fillRect(0, 0, 2, 15); // Traço fino e comprido
            g.generateTexture('rain_drop', 2, 15);
            g.destroy();
        }

        const { width } = this.scale;

        // Cria o emissor de partículas fixo na tela (ScrollFactor 0)
        this.rainEmitter = this.add.particles(0, 0, 'rain_drop', {
            x: { min: -100, max: width + 100 }, // Área maior para compensar o vento
            y: -50, // Começa acima da tela
            lifespan: 1000,
            speedY: config.speedY,
            speedX: config.speedX,
            quantity: config.quantity,
            frequency: config.frequency,
            alpha: { start: 0.8, end: 0.2 },
            scale: { start: 1, end: 0.5 },
            blendMode: 'ADD'
        });

        this.rainEmitter.setScrollFactor(0);
        this.rainEmitter.setDepth(9998); // Abaixo da UI, acima do jogo
    }

    startSandstorm(config) {
        // Gera a textura da partícula de areia se não existir
        if (!this.textures.exists('sand_particle')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x8b6a2e, 1);
            g.fillRect(0, 0, 2, 10); // Traço um pouco menor que a chuva
            g.generateTexture('sand_particle', 2, 10);
            g.destroy();
        }

        const { width } = this.scale;

        // Reutiliza rainEmitter para que stopRain() funcione para limpar (já que são mutuamente exclusivos)
        this.rainEmitter = this.add.particles(0, 0, 'sand_particle', {
            x: { min: -100, max: width + 100 },
            y: -50,
            lifespan: 1000,
            speedY: config.speedY,
            speedX: config.speedX,
            quantity: config.quantity,
            frequency: config.frequency,
            alpha: { start: 0.8, end: 0.2 },
            scale: { start: 1, end: 0.5 },
            blendMode: 'NORMAL' // Areia é opaca/poeira, NORMAL fica melhor que ADD
        });

        this.rainEmitter.setScrollFactor(0);
        this.rainEmitter.setDepth(9998);
    }

    stopRain() {
        if (this.rainEmitter) {
            this.rainEmitter.destroy();
            this.rainEmitter = null;
        }
    }

    startFog(config) {
        const { width, height } = this.scale;

        this.fogEmitter = this.add.particles(0, 0, 'nevoeiro', {
            x: { min: -100, max: width + 100 },
            y: { min: 0, max: height },
            lifespan: 60000,
            speedX: { min: 10, max: 30 }, // Vento suave
            scale: config.scale,
            alpha: { start: 0, end: config.alpha, ease: 'Sine.easeInOut', yoyo: true },
            quantity: config.quantity,
            frequency: config.frequency,
            blendMode: 'ADD'
        });

        this.fogEmitter.setScrollFactor(0);
        this.fogEmitter.setDepth(9997); // Abaixo da chuva
    }

    stopFog() {
        if (this.fogEmitter) {
            this.fogEmitter.destroy();
            this.fogEmitter = null;
        }
    }

    startWind(config) {
        if (!this.textures.exists('wind_particle')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff, 0.5);
            g.fillRect(0, 0, 20, 2); // Traço horizontal (poeira/vento)
            g.generateTexture('wind_particle', 20, 2);
            g.destroy();
        }

        const { width, height } = this.scale;

        // Calcula tempo de vida para atravessar a tela com base na velocidade
        const minSpeed = config.speedX.min || config.speedX;
        const lifespan = ((width + 100) / minSpeed) * 1000;

        this.windEmitter = this.add.particles(0, 0, 'wind_particle', {
            x: -50,
            y: { min: 0, max: height },
            lifespan: lifespan,
            speedX: config.speedX,
            speedY: { min: -20, max: 20 },
            scale: config.scale,
            alpha: { start: config.alpha, end: 0 },
            quantity: config.quantity,
            frequency: config.frequency,
            blendMode: 'ADD'
        });

        this.windEmitter.setScrollFactor(0);
        this.windEmitter.setDepth(9997); // Mesma profundidade da neblina
    }

    stopWind() {
        if (this.windEmitter) {
            this.windEmitter.destroy();
            this.windEmitter = null;
        }
    }

    startPuddles() {
        if (!this.textures.exists('water_puddle')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x4444ff, 0.3); // Azul translúcido
            g.fillEllipse(32, 16, 60, 30);

            // Adiciona brilho especular (Reflexo do céu)
            g.fillStyle(0xaaddff, 0.4); // Azul claro
            g.fillEllipse(20, 10, 15, 6); // Reflexo principal

            g.fillStyle(0xffffff, 0.3); // Branco
            g.fillEllipse(45, 22, 6, 3); // Reflexo secundário

            g.generateTexture('water_puddle', 64, 32);
            g.destroy();
        }

        if (!this.puddlesGroup) {
            this.puddlesGroup = this.physics.add.group();
        }

        this.puddleTimer = this.time.addEvent({
            delay: 300, // Cria uma poça a cada 300ms
            loop: true,
            callback: () => {
                // Verificação de segurança: Aborta se a cena estiver sendo desligada ou não existir mais.
                // Essencial para evitar erros durante o reinício da cena (ex: troca de idioma no Lobby).
                if (!this.sys || !this.sys.isActive()) {
                    return;
                }
                const cam = this.cameras.main;
                // Cria poças aleatoriamente dentro da visão da câmera
                const x = cam.scrollX + Math.random() * cam.width;
                const y = cam.scrollY + Math.random() * cam.height;

                const puddle = this.puddlesGroup.create(x, y, 'water_puddle');
                puddle.setDepth(y); // Ordenação de profundidade correta no mundo
                puddle.setScale(0);
                puddle.setAlpha(0);

                this.tweens.add({
                    targets: puddle,
                    scaleX: { from: 0.5, to: 1 + Math.random() },
                    scaleY: { from: 0.5, to: 1 + Math.random() },
                    alpha: { start: 0, to: 0.5, yoyo: true, hold: 2000, duration: 1000 }, // Aparece, espera, some
                    duration: 4000, // Vida total da poça
                    onComplete: () => puddle.destroy()
                });
            }
        });
    }

    stopPuddles() {
        if (this.puddleTimer) {
            this.puddleTimer.remove(false);
            this.puddleTimer = null;
        }
    }

    triggerRipple(unit, time) {
        if (!unit._lastRippleTime || time > unit._lastRippleTime + 250) {
            unit._lastRippleTime = time;
            const x = unit.x;
            const y = unit.y;
            this.createRipple(x, y);
        }
    }

    createRipple(x, y) {
        const ripple = this.add.circle(x, y + 15, 5).setStrokeStyle(1, 0xffffff, 0.5).setFillStyle(0, 0);
        ripple.setDepth(y);
        ripple.setScale(1, 0.5); // Perspectiva isométrica

        this.tweens.add({
            targets: ripple,
            scaleX: 4,
            scaleY: 2,
            alpha: 0,
            duration: 600,
            onComplete: () => ripple.destroy()
        });
    }

    startLightning() {
        this.lightningTimer = this.time.addEvent({
            delay: Phaser.Math.Between(4000, 12000), // Raio a cada 4-12 segundos
            callback: () => {
                // Verificação de segurança: Aborta se a cena estiver sendo desligada.
                if (!this.sys || !this.sys.isActive()) {
                    return;
                }
                this.cameras.main.flash(300, 255, 255, 255, false);
            },
            loop: true
        });
    }

    stopLightning() {
        if (this.lightningTimer) {
            this.lightningTimer.remove(false);
            this.lightningTimer = null;
        }
    }

    addGrid() {
        // Limita a grade à área visual do mapa (o mundo físico de 105000px geraria milhares de linhas)
        const { TILE_SIZE } = window.gameConfig;
        const MAP_WIDTH = window.gameConfig.VISUAL_MAP_WIDTH || 3200;
        const MAP_HEIGHT = window.gameConfig.VISUAL_MAP_HEIGHT || 1800;
        this.gridGraphics = this.add.graphics();
        this.gridGraphics.lineStyle(1, 0xffffff, 0.3);
        for (let x = 0; x <= MAP_WIDTH; x += TILE_SIZE) {
            this.gridGraphics.lineBetween(x, 0, x, MAP_HEIGHT);
        }
        for (let y = 0; y <= MAP_HEIGHT; y += TILE_SIZE) {
            this.gridGraphics.lineBetween(0, y, MAP_WIDTH, y);
        }
        this.gridGraphics.setDepth(50);
        this.gridGraphics.setVisible(false);
    }

    toggleGrid() {
        if (this.gridGraphics) {
            this.gridGraphics.setVisible(!this.gridGraphics.visible);
        }
    }

    toggleHealthBars() {
        this.showHealthBars = !this.showHealthBars;
        this.players.forEach(p => {
            if (p.toggleHealthBar) p.toggleHealthBar(this.showHealthBars);
        });
        const status = this.showHealthBars ? "Ligado" : "Desligado";
        this.uiManager.updateStatus(`Barra de Vida: ${status}`);
    }

    toggleObjectives() {
        if (this.missionManager) {
            const mode = this.missionManager.toggleObjectives();
            let status = "Objetivos: Ocultos";
            if (mode === 1) status = "Objetivos: Padrão";
            else if (mode === 2) status = "Objetivos: Texto (Sem Caixa)";
            else if (mode === 3) status = "Objetivos: Fundo Negro";
            this.uiManager.updateStatus(status);
        }
    }

    togglePause() {
        // Não permite alternar o pause se um diálogo estiver aberto (pois ele força o pause)
        if (this.informationManager && this.informationManager.isDialogOpen()) return;
        // Não permite alternar o pause se painéis modais estiverem abertos
        if (this.characterPanel && this.characterPanel.isVisible) return;
        if (this.inventoryPanel && this.inventoryPanel.isVisible) return;
        if (this.instructionsContainer && this.instructionsContainer.visible) return;
        if (this.optionsPanel && this.optionsPanel.isVisible) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.world.pause();
            if (this.anims && this.anims.pauseAll) this.anims.pauseAll();
            this.showPauseScreen();
            if (this.uiManager) this.uiManager.updateStatus(this.languageManager.get('game_paused'));
        } else {
            this.physics.world.resume();
            this.anims.resumeAll();
            this.hidePauseScreen();
            if (this.uiManager) this.uiManager.updateStatus(this.languageManager.get('game_resumed'));
        }
    }

    showPauseScreen() {
        if (!this.pauseContainer) {
            const { width, height } = this.scale;
            this.pauseContainer = this.add.container(0, 0).setDepth(30000).setScrollFactor(0); // z-index alto
            const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
            const text = this.add.text(width / 2, height / 2, this.languageManager.get('game_paused'), {
                fontSize: '64px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 6
            }).setOrigin(0.5);
            this.pauseContainer.add([bg, text]);
        }
        this.pauseContainer.setVisible(true);
    }

    hidePauseScreen() {
        if (this.pauseContainer) {
            this.pauseContainer.setVisible(false);
        }
    }

    updateStealthVisuals() {
        const alpha = this.isStealthMode ? 0.5 : 1.0;
        this.players.forEach(player => {
            if (player.sprite) {
                player.sprite.setAlpha(alpha);
            }
        });
    }

    // Centraliza a lógica de atualização da visão dos NPCs
    updateNpcVision() {
        if (this.npcManager) {
            const isInstance = this.informationManager ? this.informationManager.isInstanceMode : false;
            this.npcManager.updateNpcVision(isInstance, this.isStealthMode);
        }
    }

    switchToAggressiveMode() {
        if (this.informationManager) {
            // Se estiver em stealth, quebra e inicia cooldown
            if (this.isStealthMode) {
                this.isStealthMode = false;
                this.currentCooldownTime = this.stealthCooldown; 
                this.showWarning(this.languageManager.get('warning_stealth_broken'));
                if (this.uiManager) {
                    this.uiManager.toggleButtonState('stealth', false);
                    this.uiManager.enableButton('stealth', false);
                }
            }

            const wasAggressive = this.informationManager.isInstanceMode;

            // MODO AGRESSIVO
            this.informationManager.isInstanceMode = true;
            this.isStealthMode = false;

            if (this.uiManager) {
                this.uiManager.updateButtonLabel('instance', "AGRESSIVA");
            }

            // Só mostra o aviso na tela se o estado mudou (evita spam ao tomar dano contínuo)
            if (!wasAggressive) {
                this.showModeWarning(this.languageManager.get('notification_mode_combat'), "#ff0000", true);
            }

            // Atualiza visuais e lógica
            this.updateStealthVisuals();
            this.informationManager.updateCursorForMode();
            this.updateNpcVision();
        }
    }

    performWarp(x, y) {
        // Verifica se o local é válido (não é obstáculo)
        if (this.missionManager && this.missionManager.isPointInObstacles(x, y)) { 
            this.showWarning(this.languageManager.get('warning_invalid_location'));
            return;
        }

        // Limpa o timer de cancelamento se o warp for executado com sucesso
        if (this.warpTimeoutEvent) {
            this.warpTimeoutEvent.remove(false);
            this.warpTimeoutEvent = null;
        }

        this.isWarpMode = false;
        this.hideWarpInstruction();
        this.currentWarpCooldown = this.warpCooldown;

        if (this.uiManager) {
            this.uiManager.toggleButtonState('warp', false);
            this.uiManager.enableButton('warp', false); // Desabilita (fica cinza)
            this.uiManager.updateStatus("BLINK EXECUTADO!"); // TODO: Translate
        }

        if (this.informationManager) this.informationManager.updateCursorForMode(); // Restaura cursor

        // Teleporta todos os jogadores vivos
        let count = 0;
        this.players.forEach(p => {
            if (p.health > 0) {
                // Salva a direção atual para manter após o teleporte
                const savedDirection = p.lastDirection;

                // Offset para não ficarem todos no mesmo pixel (formação simples)
                const offsetX = (count % 2) * 40 - 20;
                const offsetY = Math.floor(count / 2) * 40 - 20;

                const targetX = x + offsetX;
                const targetY = y + offsetY;

                if (p.sprite) {
                    p.sprite.setPosition(targetX, targetY);
                    if (p.sprite.body) p.sprite.body.reset(targetX, targetY);
                }
                if (p.stopMovement) p.stopMovement();

                // Restaura a direção e atualiza a animação de idle
                if (savedDirection) {
                    p.lastDirection = savedDirection;
                    if (p.playIdle) p.playIdle();
                }

                // Efeito visual de chegada (Summon)
                if (this.anims.exists('summon_anim')) {
                    const effect = this.add.sprite(targetX, targetY, 'summon_effect').play('summon_anim');
                    effect.setDepth(targetY + 100);
                    effect.once('animationcomplete', () => effect.destroy());
                }
                count++;
            }
        });

        // Centraliza a câmera no local do dash
        this.cameras.main.centerOn(x, y);
        if (this.soundManager) this.soundManager.play('extraction_radio', { volume: 0.5 }); // Som placeholder
    }

    createGhost(player) {
        if (!player.sprite || !player.sprite.active) return;

        const ghost = this.add.sprite(player.x, player.y, player.sprite.texture.key, player.sprite.frame.name);
        ghost.setAlpha(0.5);
        ghost.setTint(0x00ffff); // Ciano para efeito tecnológico
        ghost.setDepth(player.y - 1);
        ghost.setScale(player.sprite.scaleX, player.sprite.scaleY);

        this.tweens.add({
            targets: ghost,
            alpha: 0,
            duration: 300,
            onComplete: () => ghost.destroy()
        });
    }

    performQuickDash() {
        // Verifica Cooldown
        if (this.currentQuickDashCooldown > 0) { 
            const remaining = (this.currentQuickDashCooldown / 1000).toFixed(1); 
            this.showBigWarning(this.languageManager.get('warning_dash_cooldown', { remaining: remaining }));
            return;
        }

        // Encontra o líder (primeira unidade selecionada ou primeiro vivo)
        let leader = null;
        if (this.unitController && this.unitController.selectedUnits.length > 0) {
            leader = this.unitController.selectedUnits[0];
        } else {
            leader = this.players.find(p => p.health > 0);
        }

        if (!leader || leader.health <= 0) return;

        // Configurações
        const distance = window.gameConfig.DASH_DISTANCE || 200;
        const cooldown = window.gameConfig.DASH_COOLDOWN || 3000;
        const dashDuration = 200; // Duração do dash em ms
        const dashSpeed = (distance / dashDuration) * 1000; // Calcula velocidade necessária

        // Determina direção baseada na última direção do personagem
        let dx = 0;
        let dy = 0;
        const dir = leader.lastDirection || 'down';

        if (dir.includes('left')) dx = -1;
        if (dir.includes('right')) dx = 1;
        if (dir.includes('up')) dy = -1;
        if (dir.includes('down')) dy = 1;

        // Se estiver parado (sem direção clara), dash para baixo por padrão
        if (dx === 0 && dy === 0) dy = 1;

        // Normaliza diagonal
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Aplica o Dash para TODOS os jogadores vivos
        this.players.forEach(player => {
            if (player.health > 0 && player.sprite && player.sprite.active) {
                // Marca como dashing para evitar interferência de outros controles
                player.isDashing = true;

                // Para movimento atual
                if (player.stopMovement) player.stopMovement();

                // Aplica velocidade
                if (player.sprite.body) {
                    player.sprite.body.setVelocity(dx * dashSpeed, dy * dashSpeed);
                }

                // Cria timer para o rastro (Ghost Trail)
                const trailTimer = this.time.addEvent({
                    delay: 40,
                    callback: () => this.createGhost(player),
                    loop: true
                });

                // Finaliza o dash
                this.time.delayedCall(dashDuration, () => {
                    player.isDashing = false;
                    trailTimer.remove();
                    if (player.sprite && player.sprite.body) {
                        player.sprite.body.setVelocity(0, 0);
                    }
                });
            }
        });

        this.currentQuickDashCooldown = cooldown;
    }

    closeAllMenus() {
        // Fecha Mapa
        if (this.mapContainer && this.mapContainer.visible) {
            this.mapContainer.setVisible(false);
            if (this.uiManager) this.uiManager.updateStatus(this.languageManager.get('status_map_closed'));
        }

        // Fecha Instruções
        if (this.instructionsContainer && this.instructionsContainer.visible) {
            this.instructionsContainer.setVisible(false);
            if (this.uiManager) this.uiManager.toggleButtonState('instrucoes', false);
        }

        // Fecha Painel de Personagem
        if (this.characterPanel && this.characterPanel.isVisible) {
            this.characterPanel.toggle(); 
            if (this.uiManager) this.uiManager.toggleButtonState('personagem', false);
        }

        // Fecha Inventário
        if (this.inventoryPanel && this.inventoryPanel.isVisible) {
            this.inventoryPanel.toggle();
            if (this.uiManager) this.uiManager.toggleButtonState('inventory', false);
        }

        // Fecha Opções
        if (this.optionsPanel && this.optionsPanel.isVisible) {
            this.optionsPanel.toggle();
        }

        // Fecha Debug
        if (this.debugPanel && this.debugPanel.isVisible) {
            this.debugPanel.toggle();
        }

        // Fecha Diálogos/Loja (InformationManager)
        if (this.informationManager) {
            if (this.informationManager.isShopOpen()) this.informationManager.hideShop(false);
            else if (this.informationManager.isDialogOpen()) this.informationManager.hideDialog(false);
        }

        // Reseta o estado de pause (quem for abrir o próximo menu pausará novamente se necessário)
        this.hidePauseScreen();
        this.isPaused = false;
        this.physics.world.resume();
        if (this.anims) this.anims.resumeAll();
    }

    // Chamado pelo UIManager quando clica nos botões
    handleButtonClick(key) {
        // Lógica para o botão TODOS
        if (key === 'todos') {
            const allSelected = this.unitController.toggleSelectAll(); 
            const statusKey = allSelected ? 'status_all_units_selected' : 'status_selection_cleared';
            this.uiManager.updateStatus(this.languageManager.get(statusKey));
            // Não altera o modo de ação, apenas seleciona
            return;
        }

        // Lógica para o botão MAPA
        if (key === 'mapa') {
            if (this.mapContainer.visible) {
                this.cycleMapImage();
            } else {
                this.closeAllMenus();
                this.openMap();
            }
            return;
        }

        // Lógica para o botão RANGE
        if (key === 'range') {
            this.showRange = !this.showRange;

            this.uiManager.toggleButtonState('range', this.showRange); 
            if (this.showRange) { 
                this.uiManager.updateStatus(this.languageManager.get('status_range_on'));
            } else { 
                this.uiManager.updateStatus(this.languageManager.get('status_range_off'));
            }
            return;
        }

        // Lógica para o botão INSTRUÇÕES (AJUDA)
        if (key === 'instrucoes') {
            const wasVisible = this.instructionsContainer.visible;
            this.closeAllMenus();
            const isVisible = !wasVisible;
            if (isVisible) this.instructionsContainer.setVisible(true);
            this.uiManager.toggleButtonState('instrucoes', isVisible);

            // Pausa/Despausa o jogo ao abrir/fechar ajuda
            if (isVisible) {
                this.isPaused = true;
                this.physics.world.pause();
                this.anims.pauseAll();
            } else {
                this.isPaused = false;
                this.physics.world.resume();
                this.anims.resumeAll();
            }
            return;
        }

        // Lógica para o botão PERSONAGEM (Unificado)
        if (key === 'personagem') {
            const wasVisible = this.characterPanel && this.characterPanel.isVisible;
            this.closeAllMenus();
            if (this.characterPanel) {
                const isVisible = !wasVisible && this.characterPanel.toggle();
                this.uiManager.toggleButtonState('personagem', isVisible);

                // Pausa/Despausa o jogo ao abrir/fechar painel de personagem
                if (isVisible) {
                    this.isPaused = true;
                    this.physics.world.pause();
                    this.anims.pauseAll();
                } else {
                    this.isPaused = false;
                    this.physics.world.resume();
                    this.anims.resumeAll();
                }
            }

            // Centraliza a câmera na unidade selecionada
            if (this.unitController && this.unitController.selectedUnits.length > 0) {
                const unit = this.unitController.selectedUnits[0];
                if (unit.sprite && unit.sprite.active) {
                    this.cameras.main.centerOn(unit.x, unit.y);
                }
            }
            return;
        }

        // Lógica para o botão INVENTARIO (BAG)
        if (key === 'inventory') {
            const wasVisible = this.inventoryPanel && this.inventoryPanel.isVisible;
            this.closeAllMenus();
            if (this.inventoryPanel) {
                const isVisible = !wasVisible && this.inventoryPanel.toggle();
                this.uiManager.toggleButtonState('inventory', isVisible);

                // Pausa/Despausa o jogo ao abrir/fechar inventário
                if (isVisible) {
                    this.isPaused = true;
                    this.physics.world.pause();
                    this.anims.pauseAll();
                } else {
                    this.isPaused = false;
                    this.physics.world.resume();
                    this.anims.resumeAll();
                }

            }
            return;
        }

        // Lógica para o botão OPÇÕES
        if (key === 'opcoes') {
            const wasVisible = this.optionsPanel && this.optionsPanel.isVisible;
            this.closeAllMenus();
            if (this.optionsPanel) {
                const isVisible = !wasVisible && this.optionsPanel.toggle();

                // Pausa/Despausa o jogo ao abrir/fechar painel de opções
                if (isVisible) {
                    this.isPaused = true;
                    this.physics.world.pause();
                    this.anims.pauseAll();
                } else {
                    this.isPaused = false;
                    this.physics.world.resume();
                    this.anims.resumeAll();
                }
            }
            return;
        }

        // Lógica para o botão INSTANCE
        if (key === 'instance') {
            if (this.informationManager) {
                // Alterna entre Normal e Agressivo
                if (this.informationManager.isInstanceMode) {
                    // Vai para Normal
                    this.informationManager.isInstanceMode = false; 
                    this.uiManager.updateButtonLabel('instance', "NORMAL"); 
                    this.uiManager.updateStatus(this.languageManager.get('status_mode_normal'));
                    this.showModeWarning(this.languageManager.get('notification_mode_social'), "#00ff00");
                } else {
                    // Vai para Agressivo
                    // Se estiver em Stealth, sai dele
                    if (this.isStealthMode) {
                        this.exitStealthMode();
                    } 

                    this.informationManager.isInstanceMode = true;
                    this.uiManager.updateButtonLabel('instance', "AGRESSIVA");
                    this.showModeWarning("MODO DE COMBATE", "#ff0000", true);
                }

                // Atualiza visuais e lógica
                this.updateStealthVisuals();
                this.informationManager.updateCursorForMode(); // Atualiza cursor (mão/mira)
                this.updateNpcVision();
            }
            return;
        }

        // Lógica para o botão STEALTH
        if (key === 'stealth') {
            if (this.isStealthMode) {
                this.exitStealthMode();
            } else {
                if (this.currentCooldownTime > 0) { 
                    const remaining = (this.currentCooldownTime / 1000).toFixed(1); 
                    this.showBigWarning(this.languageManager.get('warning_stealth_cooldown', { remaining: remaining }));
                    return;
                }

                // Se estiver em modo agressivo, volta para normal antes de entrar em stealth
                if (this.informationManager && this.informationManager.isInstanceMode) {
                    this.informationManager.isInstanceMode = false;
                    this.uiManager.updateButtonLabel('instance', "NORMAL");
                }

                this.isStealthMode = true;
                this.currentStealthTime = this.stealthDuration;
                this.uiManager.updateStatus(this.languageManager.get('status_stealth_on', { duration: this.stealthDuration / 1000 }));
                this.uiManager.toggleButtonState('stealth', true); 

                this.updateStealthVisuals();
                if (this.informationManager) this.informationManager.updateCursorForMode();
                this.updateNpcVision();
            }
            return;
        }

        // Lógica para o botão WARP
        if (key === 'warp') {
            if (this.currentWarpCooldown > 0) { 
                const remaining = (this.currentWarpCooldown / 1000).toFixed(1); 
                this.showBigWarning(this.languageManager.get('warning_blink_cooldown', { remaining: remaining }));
                return;
            }

            if (this.isWarpMode) {
                this.cancelWarpMode(this.languageManager.get('status_warp_cancelled'));
            } else {
                this.isWarpMode = true;
                this.uiManager.toggleButtonState('warp', true); 
                this.uiManager.updateStatus(this.languageManager.get('status_warp_select_destination'));
                this.showWarpInstruction();

                // Inicia timer de 5 segundos para cancelar automaticamente
                if (this.warpTimeoutEvent) this.warpTimeoutEvent.remove(false);
                this.warpTimeoutEvent = this.time.delayedCall(5000, () => { 
                    this.cancelWarpMode(this.languageManager.get('status_warp_cancelled_timeout'));
                });
            }
            return;
        }

    }

    exitStealthMode() {
        if (!this.isStealthMode) return;

        this.isStealthMode = false;
        this.currentCooldownTime = this.stealthCooldown;

        // Volta para o modo Normal
        if (this.informationManager) {
            this.informationManager.isInstanceMode = false;
        }

        if (this.uiManager) {
            this.uiManager.updateButtonLabel('instance', "NORMAL");
            this.uiManager.toggleButtonState('stealth', false);
            this.uiManager.enableButton('stealth', false); 
            this.uiManager.updateStatus(this.languageManager.get('status_stealth_ended'));
        }

        this.updateStealthVisuals();
        if (this.informationManager) this.informationManager.updateCursorForMode();
        this.updateNpcVision();
    }

    openMap() {
        const imgKey = this.mapImageKeys[this.currentMapIndex];
        this.mapImage.setTexture(imgKey);

        // Ajusta escala para caber no popup (com margem)
        const maxWidth = this.mapPopupWidth - 20;
        const maxHeight = this.mapPopupHeight - 20;

        const scaleX = maxWidth / this.mapImage.width;
        const scaleY = maxHeight / this.mapImage.height;
        const scale = Math.min(scaleX, scaleY, 1); // 1 para não dar upscale se for pequeno
        this.mapImage.setScale(scale);

        this.mapContainer.setVisible(true);

        // Pausa o jogo
        this.isPaused = true;
        this.physics.world.pause();
        this.anims.pauseAll();

        if (this.uiManager) this.uiManager.updateStatus(this.languageManager.get('status_map_page', { current: this.currentMapIndex + 1, total: 3 }));
    }

    closeMap() {
        this.mapContainer.setVisible(false);

        // Resume o jogo
        this.isPaused = false;
        this.physics.world.resume();
        this.anims.resumeAll();

        if (this.uiManager) this.uiManager.updateStatus(this.languageManager.get('status_map_closed'));
    }

    cycleMapImage() {
        // Se estiver no último mapa, fecha e reseta o ciclo para o início
        if (this.currentMapIndex >= this.mapImageKeys.length - 1) {
            this.closeMap();
            this.currentMapIndex = 0;
            return;
        }
        this.currentMapIndex++;
        const imgKey = this.mapImageKeys[this.currentMapIndex];
        this.mapImage.setTexture(imgKey);

        // Reajusta escala
        const maxWidth = this.mapPopupWidth - 20;
        const maxHeight = this.mapPopupHeight - 20;
        const scaleX = maxWidth / this.mapImage.width;
        const scaleY = maxHeight / this.mapImage.height;
        const scale = Math.min(scaleX, scaleY, 1);
        this.mapImage.setScale(scale);

        if (this.uiManager) this.uiManager.updateStatus(this.languageManager.get('status_map_page', { current: this.currentMapIndex + 1, total: 3 }));
    }

    showWarpInstruction() {
        if (this.warpInstructionText) this.warpInstructionText.destroy();

        this.warpInstructionText = this.add.text(this.scale.width / 2, this.scale.height / 3, this.languageManager.get('warp_instruction'), {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 6,
            fontStyle: 'bold',
            align: 'center'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(100000);

        this.tweens.add({
            targets: this.warpInstructionText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }

    hideWarpInstruction() {
        if (this.warpInstructionText) {
            this.warpInstructionText.destroy();
            this.warpInstructionText = null;
        }
    }

    cancelWarpMode(reason) {
        if (!this.isWarpMode) return;

        this.isWarpMode = false;
        this.hideWarpInstruction();

        if (this.warpTimeoutEvent) {
            this.warpTimeoutEvent.remove(false);
            this.warpTimeoutEvent = null;
        }

        if (this.uiManager) {
            this.uiManager.toggleButtonState('warp', false);
            this.uiManager.updateStatus(reason || this.languageManager.get('status_warp_cancelled'));
        }
    }

    // Mostra aviso grande no meio da tela
    showWarning(text) {
        const warning = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            text,
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#c71919',
                stroke: '#000000',
                strokeThickness: 1,
                fontStyle: 'bold',
                align: 'center'
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(90000);

        this.tweens.add({
            targets: warning,
            alpha: { from: 0, to: 1 },
            duration: 300,
            ease: 'Linear',
            onComplete: () => {
                this.tweens.add({
                    targets: warning,
                    alpha: 0,
                    duration: 300,
                    delay: 700,
                    onComplete: () => warning.destroy()
                });
            }
        });
    }

    showBigWarning(text, fontSize = '64px') {
        const warning = this.add.text(
            this.scale.width / 2, 
            this.scale.height / 2,
            text,
            {
                fontSize: fontSize, // Bem grande
                fontFamily: 'Arial',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6,
                fontStyle: 'bold',
                align: 'center'
            }
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(90000);

        this.tweens.add({
            targets: warning,
            alpha: 0,
            duration: 1000,
            delay: 500,
            onComplete: () => warning.destroy()
        });
    }

    showModeWarning(text, color, blink = false) {
        const { width, height } = this.scale;
        const warning = this.add.text(width / 2, height / 2 - 80, text, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: color,
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold',
            align: 'center'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(90000);

        if (blink) {
            this.tweens.add({
                targets: warning,
                alpha: 0,
                duration: 150,
                yoyo: true,
                repeat: 7,
                onComplete: () => warning.destroy()
            });
        } else {
            warning.setAlpha(0);
            this.tweens.add({
                targets: warning,
                alpha: 1,
                duration: 300,
                hold: 1000,
                yoyo: true,
                onComplete: () => warning.destroy()
            });
        }
    }

	setupJoystick() {
		if (this.virtualJoystick) return;
		
		// Define uma posição fixa (ex: 150px da esquerda, 150px acima da barra de UI)
		const x = 150;
		const y = this.scale.height - window.gameConfig.UI_BAR_HEIGHT - 120;
		
		this.virtualJoystick = new VirtualJoystick(this, x, y, 60, 15);
		console.log(`[JOYSTICK DEBUG] Fixo em X=${x} Y=${y}`);
		
		this.input.on('pointerdown', (pointer) => {
			if (!this.virtualJoystick) return;

			const isOverUI = pointer.y > this.scale.height - window.gameConfig.UI_BAR_HEIGHT;
			// Ativa se clicar perto da base do joystick (dentro do raio + margem)
			const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.virtualJoystick.x, this.virtualJoystick.y);
			if (!isOverUI && dist < 100) {
				this.virtualJoystick.activate(pointer.x, pointer.y, pointer);
			}
		});
	}

	handleJoystickMovement() {
		if (!this.virtualJoystick) return;
		
		// Atualiza a lógica interna do joystick para calcular forceX e forceY baseados no ponteiro ativo
		this.virtualJoystick.update();

		// Se não houver força aplicada (joystick parado ou inativo), não faz nada
		if (this.virtualJoystick.forceX === 0 && this.virtualJoystick.forceY === 0) return;

		const selectedUnits = this.unitController ? this.unitController.selectedUnits : [];
		if (selectedUnits.length === 0) return;

		const leader = selectedUnits[0];
		if (!leader || leader.health <= 0 || !leader.sprite || !leader.sprite.active) return;

		const speed = leader.speed || 100;
		const vx = this.virtualJoystick.forceX * speed;
		const vy = this.virtualJoystick.forceY * speed;

		leader.sprite.body.setVelocity(vx, vy);

		// Cancela movimentos de clique para evitar conflitos
		leader.isMoving = false;
		leader.moveTarget = null;

		// Atualiza animação baseada na direção do joystick
		if (Math.abs(vx) > 5 || Math.abs(vy) > 5) {
			const angle = Math.atan2(vy, vx);
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

			if (leader.lastDirection !== anim) {
				leader.lastDirection = anim;
				if (leader.playAnimation) leader.playAnimation(anim);
			}
		} else {
			if (leader.playIdle) leader.playIdle();
		}

		// --- MOVIMENTO DOS SEGUIDORES (Mantém a formação do esquadrão ao usar o joystick) ---
		const formationRadius = 30;
		const stopThreshold = 10;
		const followers = selectedUnits.filter(p => p !== leader && p.health > 0);

		followers.forEach((player, index) => {
			if (player.isDashing) return;

			// Calcula posição na formação circular ao redor do líder
			const angle = (index / followers.length) * Math.PI * 2;
			const targetX = leader.x + Math.cos(angle) * formationRadius;
			const targetY = leader.y + Math.sin(angle) * formationRadius;
			const dist = Phaser.Math.Distance.Between(player.x, player.y, targetX, targetY);

			if (dist > stopThreshold) {
				this.physics.moveTo(player.sprite, targetX, targetY, player.speed || 100);
				player.isMoving = false; // Cancela movimento por clique
				player.moveTarget = null;

				if (player.sprite.body) {
					const v = player.sprite.body.velocity;
					if (Math.abs(v.x) > 10 || Math.abs(v.y) > 10) {
						let anim = Math.abs(v.x) > Math.abs(v.y) ? (v.x > 0 ? 'right' : 'left') : (v.y > 0 ? 'down' : 'up');
						if (player.lastDirection !== anim) {
							player.lastDirection = anim;
							if (player.playAnimation) player.playAnimation(anim);
						}
					}
				}
			} else {
				if (player.sprite.body) player.sprite.body.setVelocity(0, 0);
				if (player.playIdle) player.playIdle();
			}
		});

		// Faz a câmera seguir o líder durante o movimento analógico
		if (this.unitController && this.unitController.autoCameraFollow && this.cameras.main._follow !== leader.sprite) {
			this.cameras.main.startFollow(leader.sprite, true, 0.1, 0.1);
		}
	}

    updateInsanityEffect() {
        if (!this.insanityEffect) return;

        let maxInsanity = 0;
        const selectedUnits = this.unitController ? this.unitController.selectedUnits : [];

        // A insanidade do jogador é mais importante quando ele está no controle.
        // Vamos basear o efeito na maior insanidade entre as unidades selecionadas.
        if (selectedUnits.length > 0) {
            selectedUnits.forEach(unit => {
                if (unit.insanity > maxInsanity) {
                    maxInsanity = unit.insanity;
                }
            });
        } else {
            // Se ninguém estiver selecionado, o efeito é desligado.
            maxInsanity = 0;
        }

        if (maxInsanity > 80) {
            this.insanityEffect.active = true;
            // Mapeia a insanidade de 80-100 para uma amplitude de 0.0 a 0.01 (efeito sutil a forte)
            const amplitude = Phaser.Math.Linear(0, 0.01, (maxInsanity - 80) / 20);
            this.insanityEffect.amplitude = amplitude;
            // A frequência também pode aumentar para um efeito mais caótico
            this.insanityEffect.frequency = 10 + (maxInsanity - 80) / 4; // Frequência de 10 a 15
        } else {
            if (this.insanityEffect.active) {
                this.insanityEffect.active = false;
                this.insanityEffect.amplitude = 0;
            }
        }
    }
}