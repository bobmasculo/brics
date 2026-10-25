(function() {
    'use strict';

    const MAP_WIDTH = 105000; // Aumentado para caber interiores distantes
    const MAP_HEIGHT = 105000;
    const TILE_SIZE = 32;
    const MAX_HEALTH = 100;
    const UI_BAR_HEIGHT = 85; 
    const BUTTON_HEIGHT = 25;
    const BUTTON_PADDING = 25;
    const BUTTON_WIDTH = 30;  
    const COLORS = { 
        TEAM: 0x66ccff,
        BUTTON_INACTIVE: 0x4444ff,
        BUTTON_ACTIVE: 0x22aa22,
        BUTTON_TEXT_INACTIVE: '#ffffff',
        BUTTON_TEXT_ACTIVE: '#ffff00',
        HEALTH_TEXT: '#ffffff',
        HEALTH_STROKE: '#000000',
        HIGHLIGHT: 0xffff00,
        CLICK_MARKER: 0xff0000, 
        SHOOT_LINE: 0xff0000,
        SHOOT_LINE_ACTIVE: 0xffff00
    };

    const SOUNDS = {
        'shoot': 'assets/audio/tiro_c.mp3',
        'npc_hit': 'assets/audio/ataque_alien.wav',
        'npc_death': 'assets/audio/npc_morre.wav',
        'player_hit': 'assets/audio/ataque_alien.wav',
        'player_death': 'assets/audio/acertou_tiro.wav',
        'extraction_radio': 'assets/audio/npc_morre.wav', 
        'mission1_quest1': 'assets/audio/tt/parte_1_purga_nexus.mp3',
        'mission1_quest2': 'assets/audio/tt/parte_2_purga_nexus.mp3',
        'mission1_quest3': 'assets/audio/tt/parte_3_purga_nexus.mp3',
        'mission1_quest4': 'assets/audio/tt/parte_4_purga_nexus.mp3',
        'mission1_quest5': 'assets/audio/tt/parte_5_purga_nexus.mp3',
        'alert': 'assets/audio/alarme.wav',
        'explosion': 'assets/audio/alarme.wav',
        'intro': 'assets/musicas/intro.mp3',
        'missao_1': 'assets/musicas/missao_1.mp3' ,
        'missao_2': 'assets/musicas/missao_2.mp3' ,
        'missao_3': 'assets/musicas/missao_3.mp3'   
    };

    const PLAYER_SPEED = 100;
    const SHOOT_DISTANCE = 400;
    const MOVE_DISTANCE = 10000;
    const SHOOT_DAMAGE = 10; 
    const STEALTH_VISION_REDUCTION = 0.7; // 70% de redução
    const ARMOR_HIT_REDUCTION_FACTOR = 0.01; // Cada 100 de armor reduz chance de hit em 1%
    const MONEY_PER_KILL = 0; // Dinheiro ganho por abate (Desativado, agora é por drop)
    const DASH_DISTANCE = 200; // Distância do Dash (Espaço)
    const DASH_COOLDOWN = 6000; // Cooldown do Dash em ms
    const TEAM_XP_DROP_VALUE = 150; // XP ganho ao pegar o item do time
    const TEAM_MONEY_DROP_VALUE = 150; // Dinheiro ganho ao pegar o item do time
    const TEAM_XP_DROP_CHANCE = 0.4; // Chance de drop (40%)

    // 0 = 100% para quem matou. 1 = 100% dividido para o time. 0.4 = 40% time, 60% bônus para quem matou.
    const XP_DISTRIBUTION_RATIO = 0.4; 

    // --- CONFIGURAÇÃO DE XP ---
    const XP_BASE = 500; 
    const XP_RATE = 1.2; 

    const getXpDetails = (totalXp) => {
        let level = 1;
        let xpRequired = XP_BASE;
        let remainingXp = totalXp;

        while (remainingXp >= xpRequired) {
            remainingXp -= xpRequired;
            level++;
            xpRequired = Math.floor(xpRequired * XP_RATE);
        }
        return { level, currentLevelXp: remainingXp, xpForNextLevel: xpRequired };
    };

    const WEAPONS = {
        'pistol': { 
            name: 'Pistola', 
            minDamage: 40, 
            maxDamage: 60, 
            range: 500,
            shootType: 'game_feel', // Corrigido para usar o sistema de projétil com textura
            projectileSpeed: 1100, 
            projectileTexture: 'plasma_bullet', // Agora usa sua imagem carregada
            projectileScale: 0.08, // Ajuste o tamanho do tiro aqui (0.3 = 30% do tamanho original)
            projectileRotation: -1.57, // Correção de rotação (-90 graus)
            projectileLight: {
                color: 0x00ffff, // Ciano (combina com o plasma)
                radius: 0,
                intensity: 0.5
            },
            image: 'assets/armas/pistola.png', 
            critChance: 0.3,
            muzzleFlash: {
                texture: 'flash_texture', // Coloque o nome da sua textura aqui
                scale: 0.15,
                rotation: -1.57 // -90 graus (ajuste se a imagem apontar para baixo)
            }
        },
        'shotgun': { 
            name: 'Escopeta', 
            minDamage: 90, 
            maxDamage: 120, 
            range: 550, 
            shootType: 'game_feel_rifle', // Novo tipo de tiro
            projectileSpeed: 1100, 
            projectileTexture: 'plasma_bullet_rifle', 
            projectileScale: 0.06, 
            projectileRotation: -1.57, 
            image: 'assets/armas/shotgun.png', 
            critChance: 0.3,
            projectileLight: {
                color: 0x00ffff, // Ciano (combina com o plasma)
                radius: 0,
                intensity: 0.5
            },
            muzzleFlash: {
                texture: 'flash_texture', // Coloque o nome da sua textura aqui
                scale: 0.25,
                rotation: -1.57 // -90 graus (ajuste se a imagem apontar para baixo)
            }
        },
        'flamethrower': { 
            name: 'Lança-Chamas', 
            minDamage: 2, 
            maxDamage: 5, 
            range: 250, 
            shootType: 'flamethrower', 
            image: 'assets/armas/shotgun.png', 
            burnDamage: 5,
            burnDuration: 3000
        },
        'bg9000': { 
            name: 'BG9000', 
            minDamage: 40, 
            maxDamage: 60, 
            range: 750, 
            image: 'assets/armas/metralhadora.png',   
            critChance: 0.3,
            shootType: 'projectile',
            projectileSpeed: 1350   
        },
        'hyper_blaster': { 
            name: 'Hyper Blaster', 
            minDamage: 10, 
            maxDamage: 15, 
            range: 600, 
            image: 'assets/armas/metralhadora.png',   
            critChance: 0.5,
            shootType: 'game_feel', // Novo tipo de tiro
            projectileSpeed: 1800   
        },
        'plasma_cannon': { 
            name: 'Canhão de Plasma', 
            minDamage: 30, 
            maxDamage: 80, 
            range: 1500, 
            image: 'assets/armas/metralhadora.png',   
            critChance: 0.4,
            shootType: 'game_feel', // Agora usa o sistema game_feel
            projectileSpeed: 800,
            projectileTexture: 'plasma_bullet', // Textura personalizada
            projectileScale: 1.0, // Escala normal (sem squash)
            muzzleFlash: {
                texture: 'flash_texture',
                scale: 0.3,
                rotation: -1.57,
                tint: 0x00ffff // Flash azulado
            }
        },
        'bomba': { name: 'bomba', minDamage: 45, maxDamage: 55, range: 400, image: 'assets/bombas/bomb.png' },
        'smoke_grenade':{ name: 'granada', minDamage: 5, maxDamage: 10, range: 400, image: 'assets/bombas/bomb.png' },
      
        'reviver': { name: 'Desfibrilador', desc: 'Revive aliado (Lv1, 10HP).', image: 'assets/bombas/med.png' }
    };
 
    const DROPS = [
        { key: 'shotgun', chance: 0.05, scale: 0.08 }, 
        { key: 'medkit', chance: 0.5, scale: 0.38 },
        { key: 'xp_team_money', chance: TEAM_XP_DROP_CHANCE, scale: 0.05 },
    ];

    // Itens de AÇÃO: os únicos que podem ficar no Acesso Rápido / atalhos 1-4 (são usados direto pelo player).
    // Armas, armaduras e o resto ficam só na Mochila.
    const ACTION_ITEMS = ['medkit', 'smoke_grenade', 'reviver', 'bomba'];
    const isActionItem = (itemKey) => !!itemKey && ACTION_ITEMS.includes(itemKey);

    // Garante a regra no array de inventário (0-3 = Acesso Rápido, 4+ = Mochila):
    // itens que não são de ação saem das posições 0-3 e vão para a Mochila. Altera o array recebido.
    const normalizeInventory = (inventory) => {
        if (!Array.isArray(inventory)) return inventory;
        const quick = [];
        const moved = [];
        inventory.slice(0, 4).forEach(item => {
            if (item === null || isActionItem(item)) quick.push(item);
            else moved.push(item);
        });
        const backpack = [...moved, ...inventory.slice(4)].filter(item => item !== null); // Mochila não guarda espaços vazios
        if (backpack.length > 0) {
            while (quick.length < 4) quick.push(null); // Preenche o Acesso Rápido para a Mochila começar no índice 4
        } else {
            while (quick.length > 0 && quick[quick.length - 1] === null) quick.pop();
        }
        inventory.length = 0;
        inventory.push(...quick, ...backpack);
        return inventory;
    };

    const ARMORS = {
        'helmet': { name: 'Elmo Basico', image: 'assets/armadura/helmo.png', type: 'helmet', slot: 1,armor: 20 },
        'chest': { name: 'Peito Basico', image: 'assets/armadura/peito.png', type: 'chest', slot: 2,armor: 20 },
        'leg': { name: 'Perna Basica', image: 'assets/armadura/calca.png', type: 'leg', slot: 3,armor: 40 }
    };

    const SCENARIO_ASSETS = {
        'predio': 'assets/cenario/quadrado.jpeg',
        'chao_interior': 'assets/interiores/Preview6.png', 
        'mesa': 'assets/cenario/predio.png'
    };

    // Função auxiliar para criar arrays de range numérico
    const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const PLAYER_TYPES = {

        'Player_1': {
            textureKey: 'player_1',
            path: 'assets/personagens/BRICS1.png', 
            frameWidth: 128, 
            frameHeight: 128,
            bodyWidth: 40,   
            bodyHeight: 122,  
            bodyOffset: { x: 52, y: 10 }, 
            armor: 40,
            attackStrength: 30,
            speed: PLAYER_SPEED,
            inventory: ['pistol', 'medkit'], // Equipado para teste
            frameRate: 8,
            scale: 0.65,
            get displayHeight() { return this.frameHeight * this.scale; },
            get displayWidth() { return this.frameWidth * this.scale; },
            healthTextOffset: -20,
            highlightOffset: -45,
            animationFrames: {
                down: range(8, 11),
                left: range(25, 28),
                right: range(21, 24),
                up: range(12, 15),
                idle_down: [8],
                idle_left: [25],
                idle_right: [21],
                idle_up: [12],
               // down_right: range(143, 151), 
                //down_left: range(117, 125),  
               // up_right: range(143, 151),   
               // up_left: range(117, 125),    
              //  idle: [0],
                morto: [16],
                //shoot_down: [8], 
                shoot_left: [4,5,6,7],
                shoot_right: [0,1,2,3],
                shoot_up: [31,12],
                shoot_up_left: [29],
                shoot_up_right: [30]
            }
        },
        'Player_2': {
            textureKey: 'player_2',
            path: 'assets/personagens/BRICS2.png', 
            frameWidth: 128, 
            frameHeight: 128,
            armor: 40,
            attackStrength: 30,
            speed: PLAYER_SPEED,
            inventory: ['pistol', 'medkit'],
            frameRate: 8,
            scale: 1.0,
            bodyWidth: 32,   
            bodyHeight: 72,  
            bodyOffset: { x: 52, y: 50 }, 
            get displayHeight() { return this.frameHeight * this.scale; },
            get displayWidth() { return this.frameWidth * this.scale; },
            healthTextOffset: -20,
            highlightOffset: -45,
            animationFrames: {
                down: range(8, 11),
                left: range(25, 28),
                right: range(21, 24),
                up: range(12, 15),
                idle_down: [8],
                idle_left: [25],
                idle_right: [21],
                idle_up: [12],
               // down_right: range(143, 151), 
                //down_left: range(117, 125),  
               // up_right: range(143, 151),   
               // up_left: range(117, 125),    // Placeholder: usando frames de 'left'
              //  idle: [0],
                morto: [16],
                //shoot_down: [8], 
                shoot_left: [4,5,6,7],
                shoot_right: [0,1,2,3],
                shoot_up: [31,12],
                shoot_up_left: [29],
                shoot_up_right: [30]
            }
        }, 
        'Player_3': {
            textureKey: 'player_3',
            path: 'assets/personagens/BRICS3.png', 
            frameWidth: 128, 
            frameHeight: 128,
            armor: 40,
             bodyWidth: 32,   
            bodyHeight: 72,  
            bodyOffset: { x: 52, y: 50 }, 
            attackStrength: 30,
            frameRate: 8,
            inventory: ['pistol', 'medkit'],
            speed: PLAYER_SPEED,
            scale: 1.0,
            get displayHeight() { return this.frameHeight * this.scale; },
            get displayWidth() { return this.frameWidth * this.scale; },
            healthTextOffset: -20,
            highlightOffset: -45,
            animationFrames: {
                down: range(8, 11),
                left: range(25, 28),
                right: range(21, 24),
                up: range(12, 15),
                idle_down: [8],
                idle_left: [25],
                idle_right: [21],
                idle_up: [12],
               // down_right: range(143, 151), 
                //down_left: range(117, 125),  
               // up_right: range(143, 151),   
               // up_left: range(117, 125),    // Placeholder: usando frames de 'left'
              //  idle: [0],
                morto: [16],
                //shoot_down: [8], 
                shoot_left: [4,5,6,7],
                shoot_right: [0,1,2,3],
                shoot_up: [31,12],
                shoot_up_left: [29],
                shoot_up_right: [30]
            }
        },
        'Player_4': {
            textureKey: 'player_4',
            path: 'assets/personagens/BRICS4.png', 
            frameWidth: 128, 
            frameHeight: 128,
            armor: 40,
             bodyWidth: 32,   
            bodyHeight: 72,  
            bodyOffset: { x: 52, y: 50 }, 
            attackStrength: 30,
            frameRate: 8,
            inventory: ['pistol', 'medkit'],
            speed: PLAYER_SPEED,
            scale: 1.0,
            get displayHeight() { return this.frameHeight * this.scale; },
            get displayWidth() { return this.frameWidth * this.scale; },
            healthTextOffset: -20,
            highlightOffset: -45,
            animationFrames: {
                down: range(8, 11),
                left: range(25, 28),
                right: range(21, 24),
                up: range(12, 15),
                idle_down: [8],
                idle_left: [25],
                idle_right: [21],
                idle_up: [12],
               // down_right: range(143, 151), 
                //down_left: range(117, 125),  
               // up_right: range(143, 151),   
               // up_left: range(117, 125),    // Placeholder: usando frames de 'left'
              //  idle: [0],
                morto: [16],
                //shoot_down: [8], 
                shoot_left: [4,5,6,7],
                shoot_right: [0,1,2,3],
                shoot_up: [31,12],
                shoot_up_left: [29],
                shoot_up_right: [30]
            }
        },
        'Player_5': {
            textureKey: 'player_5',
            path: 'assets/personagens/BRICS5.png', 
            frameWidth: 128, 
            frameHeight: 128,
             bodyWidth: 32,   
            bodyHeight: 72,  
            bodyOffset: { x: 52, y: 50 }, 
            armor: 40,
            attackStrength: 30,
            frameRate: 8,
            inventory: ['pistol', 'medkit'],
            speed: PLAYER_SPEED,
            scale: 1.0,
            get displayHeight() { return this.frameHeight * this.scale; },
            get displayWidth() { return this.frameWidth * this.scale; },
            healthTextOffset: -20,
            highlightOffset: -45,
            animationFrames: {
                down: range(8, 11),
                left: range(25, 28),
                right: range(21, 24),
                up: range(12, 15),
                idle_down: [8],
                idle_left: [25],
                idle_right: [21],
                idle_up: [12],
               // down_right: range(143, 151), 
                //down_left: range(117, 125),  
               // up_right: range(143, 151),   
               // up_left: range(117, 125),    // Placeholder: usando frames de 'left'
              //  idle: [0],
                morto: [16],
                //shoot_down: [8], 
                shoot_left: [4,5,6,7],
                shoot_right: [0,1,2,3],
                shoot_up: [31,12],
                shoot_up_left: [29],
                shoot_up_right: [30]
            }
        }


        
    };

    const ALL_PLAYERS = [
        { x: 178, y: 1253, type: 'Player_1', name: 'John' },
        { x: 242, y: 1253, type: 'Player_2', name: 'Mike' },
        { x: 210, y: 1285, type: 'Player_3', name: 'Sarah' },
        { x: 178, y: 1317, type: 'Player_4', name: 'David' },
        { x: 242, y: 1317, type: 'Player_5', name: 'Emily' },
    ];

    // Lógica para definir quantidade de players
    const urlParams = new URLSearchParams(window.location.search);
    const urlPlayerCount = parseInt(urlParams.get('players'));
    
    let playerCount = 3; // Padrão alterado para 3

    if (urlPlayerCount && !isNaN(urlPlayerCount)) {
        playerCount = urlPlayerCount;
    } else if (window.missionConfig && window.missionConfig.playerCount) {
        playerCount = window.missionConfig.playerCount;
    }

    // Garante que esteja entre 1 e 5 e fatia o array original
    const PLAYERS = ALL_PLAYERS.slice(0, Math.max(1, Math.min(5, playerCount)));

    const UI_LAYOUT = {
        mainBar: {
            totalSlots: 4,
            fixedSlots: {
                0: 'pistol',
                1: 'medkit' 
            }
        },
        inventoryPopup: {
            armorSlots: ['helmet', 'chest', 'leg'] // Ordem de exibição: Elmo, Peito, Perna
        }
    };

    const LASER_OFFSETS = {
        'up': { x: 0, y: -25 },
        'down': { x: 0, y: -5 },
        'left': { x: -40, y: 0 },
        'right': { x: 20, y: 0 }
    };

    // --- CONFIGURAÇÕES PADRÃO (DEFAULTS) ---
    const DEFAULTS = {
        ISOMETRIC_MODE: true, // Define se o jogo inicia em modo isométrico (true/false)
        ISOMETRIC_SKEW_X: 0.7, // Correção de ângulo X para isometria
        ZOOM: 1.8,             // Nível de zoom padrão
        FULLSCREEN: true,      // Inicia em tela cheia ao começar (requer interação)
        LANGUAGE: 'en',        // Idioma padrão ('pt' ou 'en')
        VOLUME: {
            MUSIC: 0.5,        // Volume de música (0.0 a 1.0)
            SFX: 0.2,          // Volume de efeitos sonoros
            VOICE: 0         // Volume de vozes
        }
    };

    const savedFont = localStorage.getItem('brics_font') || 'Arial';
    const savedFontScale = parseFloat(localStorage.getItem('brics_font_scale')) || 1.0;

    window.gameConfig = {
        MAP_WIDTH,
        MAP_HEIGHT,
        TILE_SIZE,
        MAX_HEALTH,
        UI_BAR_HEIGHT,
        BUTTON_HEIGHT,
        BUTTON_PADDING,
        BUTTON_WIDTH,
        COLORS,
        SOUNDS,
        PLAYER_SPEED,
        SHOOT_DISTANCE,
        MOVE_DISTANCE,
        SHOOT_DAMAGE,
        STEALTH_VISION_REDUCTION,
        ARMOR_HIT_REDUCTION_FACTOR,
        MONEY_PER_KILL,
        DASH_DISTANCE,
        DASH_COOLDOWN,
        TEAM_XP_DROP_VALUE,
        TEAM_MONEY_DROP_VALUE,
        XP_DISTRIBUTION_RATIO,
        XP_BASE,
        XP_RATE,
        getXpDetails, // Exporta a função auxiliar
        WEAPONS,
        DROPS,
        ACTION_ITEMS,
        isActionItem,
        normalizeInventory,
        ARMORS,
        SCENARIO_ASSETS,
        // Habilita desenho dos corpos para debug (útil para ajustar bodyWidth/bodyHeight/offset)
        DEBUG_DRAW_BODIES: false,
        MAP_OBJECTS: window.missionConfig ? window.missionConfig.MAP_OBJECTS : [],
        INTERIORS: window.missionConfig ? window.missionConfig.INTERIORS : [],
        NPCS: window.missionConfig ? window.missionConfig.NPCS : [],
        PLAYER_TYPES,
        ALL_PLAYERS, // Exporta a lista completa para ser fatiada depois
        PLAYERS,
        UI_LAYOUT,
        LASER_OFFSETS,
        DEFAULTS,
        FONT_FAMILY: savedFont,
        FONT_SCALE: savedFontScale,
        DEFAULT_NPC_MUZZLE_FLASH: {
            texture: 'flash_texture',
            scale: 0.15,
            rotation: -1.57
        }
    };

})();