import OptionsPanel from './OptionsPanel.js';
import SoundManager from './SoundManager.js';
import LanguageManager from './LanguageManager.js';
import KeyboardManager from './KeyboardManager.js';
import TeamLevelManager from './TeamLevelManager.js';

export default class Lobby extends Phaser.Scene {
    constructor() {
        super('Lobby');
        
        // Elementos da cena
        this.introElements = [];
        this.baseElements = [];
        this.classSelectionElements = [];
        this.baseContentElements = [];
        this.playersData = [];
        this.selectedPlayerIndex = -1;
        this.classOptionsContainer = null;
        this.currentView = 'intro';
        this.currentSubView = null;
        this.detailsContainer = null;

        // Referências para elementos responsivos
        this.bg = null;
        this.helpContainer = null;
        this.startBtn = null;
        this.optionsBtn = null;
        this.versionText = null;
        this.brightnessOverlay = null;

        // Managers
        this.optionsPanel = null;
        this.soundManager = null;
        this.keyboardManager = null; 
        this.teamLevelManager = null;
        this.languageManager = null;
        this.missionManager = null;

        // Configurações
        this.targetZoom = 1.0;
        this.showShadows = true;
        this.showFps = false;
        this.targetBrightness = 1.0;
        this.squadName = localStorage.getItem('brics_squad_name') || 'TASK FORCE';
        this.isEditingSquadName = false;
    }

    preload() {
        // Carrega a imagem de entrada
        this.load.image('entrada', 'assets/Intro/INTROnova1920.png');
        this.load.image('btn_start', 'assets/Intro/start.png');
        
        if (window.gameConfig && window.gameConfig.SOUNDS && window.gameConfig.SOUNDS.intro) {
            this.load.audio('intro', window.gameConfig.SOUNDS.intro);
        }
        
        this.load.image('opcoes_icon', 'assets/Intro/options.png');
        this.load.image('gear_icon', 'assets/ui/gear.png');
        this.load.image('volume_icon', 'assets/ui/volume.png');
        this.load.image('zoom_icon', 'assets/ui/zoom.png');
        this.load.image('brilho_icon', 'assets/ui/brilho.png');
        this.load.image('objetivos_icon', 'assets/ui/objetivos.png');
        this.load.image('escala_icon', 'assets/ui/escala.png');
        this.load.image('fonte_icon', 'assets/ui/fonte.png');
        this.load.image('player_face_1', 'assets/img_players/1.png');
        this.load.image('player_face_2', 'assets/img_players/2.png');
        this.load.image('player_face_3', 'assets/img_players/3.png');
        this.load.image('player_face_4', 'assets/img_players/4.png');
        this.load.image('player_face_5', 'assets/img_players/5.png');
    } 

    create() {
        // Identifica a missão atual pela URL
        const urlParams = new URLSearchParams(window.location.search);
        const missionId = urlParams.get('mission') || 'missao1';

        // Se autostart estiver presente, inicia o jogo imediatamente
        if (urlParams.get('autostart') === '1') {
            this.scene.start('GameScene');
            return;
        }

        const { width, height } = this.scale;

        // Inicializa SoundManager para controlar volume no Lobby
        this.soundManager = new SoundManager(this);
        
        // Inicializa LanguageManager
        this.languageManager = new LanguageManager(this);

        // Inicializa TeamLevelManager para acessar dinheiro e stats
        this.teamLevelManager = new TeamLevelManager(this);
        this.teamLevelManager.create();

        // Inicializa KeyboardManager para permitir configurar WASD antes do jogo
        this.keyboardManager = new KeyboardManager(this);
        this.keyboardManager.create();

        // Mock do MissionManager para o OptionsPanel funcionar
        this.missionManager = {
            objectiveDisplayMode: parseInt(localStorage.getItem('brics_objective_mode') || '1'),
            setObjectiveMode: (mode) => {
                this.missionManager.objectiveDisplayMode = mode;
                localStorage.setItem('brics_objective_mode', mode);
                if (this.optionsPanel) this.optionsPanel.updateObjectiveDisplay();
            }
        };

        // Toca a música de intro
        this.sound.stopAll();
        if (this.cache.audio.exists('intro')) {
            this.soundManager.play('intro', { loop: true, volume: 0.5 });
        }

        // Carrega nomes customizados e dados dos jogadores
        this.loadCustomNames();
        this.loadPlayerData();

        // Cria as views
        this.createIntroView();
        this.createBaseView();
        this.createClassSelectionView();

        // Adiciona a imagem de fundo centralizada
        this.bg = this.add.image(width / 2, height / 2, 'entrada');
        this.bg.setDisplaySize(width, height);

        // --- Quadrado de Ajuda ---
        this.helpContainer = this.createHelpPanel();

        // --- Botões e Texto de Versão ---
        this.createMainControls();

        // Inicializa variáveis de estado para o OptionsPanel
        this.targetZoom = parseFloat(localStorage.getItem('brics_zoom') || '1.0');
        this.showShadows = (localStorage.getItem('brics_shadows') === 'true');
        this.showFps = (localStorage.getItem('brics_show_fps') === 'true');
        
        const savedBrightness = localStorage.getItem('brics_brightness');
        this.targetBrightness = savedBrightness !== null ? parseFloat(savedBrightness) : 1.0;

        // Overlay de Brilho
        this.brightnessOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(100000);
            
        this.setBrightness(this.targetBrightness);

        // Inicializa o Painel de Opções
        this.optionsPanel = new OptionsPanel(this);
        this.optionsPanel.create();

        // Adiciona elementos à introElements
        this.introElements.push(this.bg, this.helpContainer, this.startBtn, this.optionsBtn, this.versionText);

        // Verifica se deve ir direto para a base
        if (urlParams.get('view') === 'base') {
            this.showView('base');
        } else {
            this.showView('intro');
        }

        // Listener para redimensionamento da tela
        this.scale.on('resize', this.handleResize, this);
        
        // Listeners para salvar preferência de tela cheia
        this.onEnterFs = () => localStorage.setItem('brics_fullscreen', 'true');
        this.onLeaveFs = () => localStorage.setItem('brics_fullscreen', 'false');
        this.scale.on('enterfullscreen', this.onEnterFs);
        this.scale.on('leavefullscreen', this.onLeaveFs);

        this.events.on('shutdown', () => {
            this.scale.off('resize', this.handleResize, this);
            this.scale.off('enterfullscreen', this.onEnterFs);
            this.scale.off('leavefullscreen', this.onLeaveFs);
        });

        this.events.on('languageChanged', () => {
            this.scene.restart();
        });

        // Remove listener antigo se existir (limpeza de segurança)
        if (this._keypressListener) window.removeEventListener('keypress', this._keypressListener);

        // --- Listener Unificado para Input (Melhor resposta) ---
        this.input.keyboard.on('keydown', (event) => {
            if (this.currentView === 'class_selection' && this.isEditingSquadName) {
                if (event.key === 'Backspace') {
                    if (this.squadName.length > 0) {
                        this.squadName = this.squadName.slice(0, -1);
                        this.updateSquadNameDisplay();
                    }
                } else if (event.key === 'Enter' || event.keyCode === 13 || event.key === 'Escape') {
                    this.stopEditingSquadName();
                } else if (event.key.length === 1 && this.squadName.length < 15) {
                    // Aceita qualquer caractere único (letras, números, acentos)
                    if (event.key.length === 1) {
                        this.squadName += event.key.toUpperCase();
                        this.updateSquadNameDisplay();
                    }
                }
            }
        });

        // Listener global para parar edição ao clicar fora
        this.input.on('pointerdown', (pointer, currentlyOver) => {
            if (this.isEditingSquadName && this.squadInputUI && this.squadInputUI.bg) {
                // Se o objeto clicado NÃO for o fundo do input, para a edição
                if (!currentlyOver.includes(this.squadInputUI.bg)) {
                    this.stopEditingSquadName();
                }
            }
        });
    }

    update() {
        if (this.isEditingSquadName) {
            this.updateSquadNameDisplay();
        }
    }

    loadCustomNames() {
        try {
            const customNames = JSON.parse(localStorage.getItem('brics_custom_names') || '{}');
            if (window.gameConfig && window.gameConfig.ALL_PLAYERS) {
                window.gameConfig.ALL_PLAYERS.forEach((player, index) => {
                    if (customNames[index]) {
                        player.name = customNames[index];
                    }
                });
            }
        } catch (e) {
            console.warn("Erro ao carregar nomes customizados", e);
        }
    }

    loadPlayerData() {
        this.playersData = [];
        const allPlayersConfig = window.gameConfig.ALL_PLAYERS || [];
        
        let savedSelection = [];
        try {
            const saved = localStorage.getItem('brics_selected_squad');
            if (saved) savedSelection = JSON.parse(saved);
        } catch(e) {}
        
        if (!savedSelection || savedSelection.length === 0) savedSelection = [0, 1, 2];

        allPlayersConfig.forEach((spawnData, index) => {
            const key = `brics_player_${spawnData.name}`;
            const saved = localStorage.getItem(key);
            let playerData = {
                index: index,
                name: spawnData.name,
                type: spawnData.type,
                xp: 0,
                level: 1,
                insanity: 0,
                isSelected: savedSelection.includes(index),
                assignedClass: localStorage.getItem(`brics_player_class_${spawnData.name}`) || 'combat',
                rowBg: null,
                classText: null
            };
            
            let data = null;
            try {
                data = saved ? JSON.parse(saved) : null;
            } catch (e) {
                console.warn(`[Lobby] Save corrompido para ${spawnData.name}, ignorando.`, e);
            }
            if (data) {
                playerData.xp = data.xp || 0;
                playerData.level = window.gameConfig.getXpDetails(playerData.xp).level;
                playerData.insanity = data.insanity || 0;
            }
            
            this.playersData.push(playerData);
        });
    }

    createIntroView() {
        // View inicial vazia - elementos são gerenciados separadamente
    }

    createHelpPanel() {
        const { width, height } = this.scale;
        const helpX = width * 0.135;
        const helpY = height / 2; 
        
        const container = this.add.container(helpX, helpY).setDepth(100);
        
        const helpBg = this.add.rectangle(0, 0, 280, 350, 0x000000, 0.85)
            .setStrokeStyle(2, 0x00ff00)
            .setDepth(100);
        
        const helpTitle = this.add.text(0, -155, 
            this.languageManager.get('instructions_title'), 
            { fontSize: '14px', color: '#00ff00', fontStyle: 'bold', align: 'center' }
        ).setOrigin(0.5);
        
        const helpText = this.add.text(0, -130, 
            this.languageManager.get('instructions_content'), 
            { fontSize: '9px', color: '#ffffff', align: 'center', fontFamily: 'Arial', lineSpacing: 4 }
        ).setOrigin(0.5, 0);
        
        container.add([helpBg, helpTitle, helpText]);
        return container;
    }

    createMainControls() {
        const { width, height } = this.scale;
        
        // Botão Start
        this.startBtn = this.add.image(width * 0.40, height * 0.80, 'btn_start')
            .setOrigin(0.5)
            .setScale(1.0)
            .setInteractive({ useHandCursor: true })
            .setDepth(100);
            
        this.startBtn.on('pointerover', () => this.startBtn.setScale(1.2));
        this.startBtn.on('pointerout', () => this.startBtn.setScale(1.0));
        this.startBtn.on('pointerdown', () => {
            const savedFs = localStorage.getItem('brics_fullscreen');
            const shouldFs = savedFs !== null ? (savedFs === 'true') : window.gameConfig.DEFAULTS.FULLSCREEN;
            if (shouldFs && !this.scale.isFullscreen) {
                this.scale.startFullscreen();
            }
            this.resetGameProgress();
            this.showView('class_selection');
        });

        // Texto de Versão
        this.versionText = this.add.text(width - 10, height - 1, 
            'versão Prototype : 0.429 - 11/03/2026', 
            { fontSize: '12px', fontFamily: 'Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 4 }
        ).setOrigin(1, 1).setDepth(100);

        // Botão Opções
        this.optionsBtn = this.add.image(width * 0.65, height * 0.80, 'opcoes_icon')
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setScale(1.0)
            .setDepth(100);
            
        this.optionsBtn.on('pointerover', () => this.optionsBtn.setScale(1.2));
        this.optionsBtn.on('pointerout', () => this.optionsBtn.setScale(1.0));
        this.optionsBtn.on('pointerdown', () => this.handleButtonClick('opcoes'));
    }

    createBaseView() {
        const { width, height } = this.scale;
        
        const panel = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a)
            .setVisible(false);
        this.baseElements.push(panel);

        const navButtons = [
            { key: 'lobby_nav_clinic', view: 'clinic' },
            { key: 'lobby_nav_arsenal', view: 'arsenal' },
            { key: 'lobby_nav_stash', view: 'stash' },
            { key: 'lobby_nav_command', view: 'comando' },
            { key: 'lobby_nav_hangar', view: 'hangar' },
            { key: 'lobby_nav_start_mission', view: 'mission' }
        ];

        const navX = 120;
        let navY = 150;
        
        navButtons.forEach(data => {
            const btn = this.add.text(navX, navY, 
                this.languageManager.get(data.key), 
                { fontSize: '18px', color: '#00ff00', fontStyle: 'bold' }
            ).setOrigin(0.5)
             .setInteractive({ useHandCursor: true })
             .setVisible(false);
             
            btn.on('pointerdown', () => {
                if (data.view === 'mission') {
                    if (this.teamLevelManager.needsRecovery) {
                        this.showFloatingMessage(this.languageManager.get('lobby_clinic_checkup_needed'), '#ff0000');
                        this.switchView('clinic');
                        return;
                    }
                    this.sound.stopAll();
                    this.scene.start('GameScene');
                } else {
                    this.switchView(data.view);
                }
            });
            
            btn.on('pointerover', () => btn.setColor('#ffff00'));
            btn.on('pointerout', () => btn.setColor('#00ff00'));
            
            this.baseElements.push(btn);
            navY += 50;
        });
    }

    createClassSelectionView() {
        this.classSelectionElements = [];
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;

        // Fundo
        const panel = this.add.rectangle(cx, cy, width, height, 0x0a0a0a);
        this.classSelectionElements.push(panel);

        const selectedCount = this.playersData.filter(p => p.isSelected).length;
        const title = this.add.text(cx, 50, 
            this.languageManager.get('lobby_squad_title', { count: selectedCount }), 
            { fontSize: '32px', color: '#00ff00', fontStyle: 'bold' }
        ).setOrigin(0.5);
        this.classSelectionElements.push(title);

        // Lista de Personagens
        const listX = width * 0.3;
        const startY = 120; // Mais para cima
        const rowHeight = 65;

        this.playersData.forEach((player, index) => {
            const y = startY + index * rowHeight;
            
            // Fundo da linha
            const rowBg = this.add.rectangle(listX, y, 360, 55, 0x111111)
                .setStrokeStyle(1, 0x444444)
                .setInteractive({ useHandCursor: true });
            
            player.rowBg = rowBg;

            // Checkbox
            const checkX = listX - 150;
            const checkbox = this.add.rectangle(checkX, y, 20, 20, 
                player.isSelected ? 0x00ff00 : 0x000000)
                .setStrokeStyle(2, player.isSelected ? 0x00ff00 : 0x666666)
                .setInteractive({ useHandCursor: true });
            
            if (player.isSelected) {
                const checkMark = this.add.text(checkX, y, '✔', 
                    { fontSize: '16px', color: '#000000', fontStyle: 'bold' }
                ).setOrigin(0.5);
                this.classSelectionElements.push(checkMark);
            }
            
            checkbox.on('pointerdown', () => this.togglePlayerSelection(index));

            // Face do jogador
            const face = this.add.image(listX - 110, y, `player_face_${index + 1}`)
                .setDisplaySize(45, 45);
            
            // Nome
            const nameColor = player.isSelected ? '#ffffff' : '#666666';
            const name = this.add.text(listX - 70, y - 12, player.name, 
                { fontSize: '18px', color: nameColor, fontStyle: 'bold' }
            ).setOrigin(0, 0.5)
             .setInteractive({ useHandCursor: true });

            // Ícone de Edição
            const editIcon = this.add.text(name.x + name.width + 10, y - 12, '✎', 
                { fontSize: '14px', color: '#aaaaaa' }
            ).setOrigin(0, 0.5)
             .setInteractive({ useHandCursor: true });

            const startRename = () => {
                const newName = prompt(this.languageManager.get('lobby_rename_prompt'), player.name);
                if (newName && newName.trim().length > 0 && newName !== player.name) {
                    this.updatePlayerName(index, newName.trim());
                }
            };

            name.on('pointerdown', startRename);
            editIcon.on('pointerdown', startRename);

            const onHover = () => { 
                if(player.isSelected) name.setColor('#ffff00'); 
                editIcon.setColor('#ffffff'); 
            };
            
            const onOut = () => { 
                name.setColor(player.isSelected ? '#ffffff' : '#666666'); 
                editIcon.setColor('#aaaaaa'); 
            };

            name.on('pointerover', onHover);
            name.on('pointerout', onOut);
            editIcon.on('pointerover', onHover);
            editIcon.on('pointerout', onOut);
            
            // Texto da classe
            const classText = this.add.text(listX - 70, y + 12, 
                this.languageManager.get(`lobby_class_${player.assignedClass}`).toUpperCase(), 
                { fontSize: '12px', color: player.isSelected ? '#ffff00' : '#666600' }
            ).setOrigin(0, 0.5);
            player.classText = classText;

            rowBg.on('pointerdown', () => this.selectPlayerForClass(index));
            
            this.classSelectionElements.push(rowBg, checkbox, face, name, editIcon, classText);
        });

        // Container de opções de classe
        // Posicionado no mesmo nível da lista (verticalmente centralizado relativo a lista)
        this.classOptionsContainer = this.add.container(width * 0.7, startY + 150);
        this.classSelectionElements.push(this.classOptionsContainer);

        // --- NOME DO ESQUADRÃO (Movido para baixo) ---
        const squadNameY = height - 120;
        
        const squadLabel = this.add.text(cx, squadNameY - 25, 
            this.languageManager.get('lobby_squad_name_label'), 
            { fontSize: '14px', color: '#aaaaaa', fontStyle: 'bold' }
        ).setOrigin(0.5);

        const squadBg = this.add.rectangle(cx, squadNameY + 5, 300, 40, 0x111111)
            .setStrokeStyle(1, 0x00ff00)
            .setInteractive({ useHandCursor: true });

        // Texto inicial (será atualizado pela função updateSquadNameDisplay)
        const squadText = this.add.text(cx, squadNameY + 5, '', { 
            fontSize: '20px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial' 
        }).setOrigin(0.5);

        squadBg.on('pointerdown', (pointer, localX, localY, event) => {
            if (event && event.stopPropagation) event.stopPropagation();

            // Em dispositivos móveis, usamos o prompt nativo para abrir o teclado virtual do sistema
            if (window.gameConfig && window.gameConfig.IS_MOBILE) {
                const promptMsg = this.languageManager.get('lobby_squad_name_prompt');
                const newName = prompt(promptMsg, this.squadName);
                if (newName !== null) {
                    this.squadName = newName.trim().toUpperCase().slice(0, 15);
                    if (this.squadName === '') this.squadName = 'TASK FORCE';
                    localStorage.setItem('brics_squad_name', this.squadName);
                    this.updateSquadNameDisplay();
                }
            } else {
                this.isEditingSquadName = true;
                squadBg.setStrokeStyle(2, 0xffff00); // Amarelo indica foco
                this.updateSquadNameDisplay();
            }
        });

        squadBg.on('pointerover', () => squadBg.setStrokeStyle(2, 0xffff00));
        squadBg.on('pointerout', () => {
            if (!this.isEditingSquadName) squadBg.setStrokeStyle(1, 0x00ff00);
        });

        this.classSelectionElements.push(squadLabel, squadBg, squadText);
        this.squadInputUI = { label: squadLabel, bg: squadBg, text: squadText };
        this.updateSquadNameDisplay(); // Define o estado inicial do texto

        // Botão Confirmar
        const btnMargin = window.gameConfig.IS_MOBILE ? 150 : 50;
        const confirmBtn = this.add.text(width - btnMargin, height - btnMargin, 
            this.languageManager.get('lobby_confirm'), 
            { fontSize: '24px', color: '#00ff00', fontStyle: 'bold', backgroundColor: '#003300', padding: { x: 20, y: 10 } }
        ).setOrigin(1, 1)
         .setInteractive({ useHandCursor: true })
         .setDepth(10001); // Garante que fique acima de outros elementos
        
        confirmBtn.on('pointerdown', () => {
            // Garante que a edição seja finalizada e o nome salvo antes de prosseguir
            if (this.isEditingSquadName) this.stopEditingSquadName();
            
            if (!this.squadName || this.squadName.trim() === '') {
                this.showFloatingMessage(this.languageManager.get('lobby_squad_name_required'), '#ff0000');
                this.cameras.main.shake(100, 0.005);

                // Efeito de piscar em vermelho no quadrado do nome
                if (this.squadInputUI && this.squadInputUI.bg) {
                    const bg = this.squadInputUI.bg;
                    this.tweens.killTweensOf(bg);
                    
                    this.tweens.addCounter({
                        from: 0,
                        to: 1,
                        duration: 100,
                        yoyo: true,
                        repeat: 5,
                        onUpdate: (tween) => {
                            const val = tween.getValue();
                            bg.setStrokeStyle(val > 0.5 ? 2 : 1, val > 0.5 ? 0xff0000 : 0x00ff00);
                        },
                        onComplete: () => bg.setStrokeStyle(1, 0x00ff00)
                    });
                }
                return;
            }
            this.updateGameConfigPlayers();
            this.showView('base');
        });
        confirmBtn.on('pointerover', () => confirmBtn.setBackgroundColor('#005500'));
        confirmBtn.on('pointerout', () => confirmBtn.setBackgroundColor('#003300'));
        this.classSelectionElements.push(confirmBtn);

        // Botão Voltar
        const backBtn = this.add.text(btnMargin, height - btnMargin, 
            this.languageManager.get('lobby_back'), 
            { fontSize: '18px', color: '#ff0000', fontStyle: 'bold' }
        ).setOrigin(0, 1)
         .setInteractive({ useHandCursor: true })
         .setDepth(10001);
        backBtn.on('pointerdown', () => this.showView('intro'));
        this.classSelectionElements.push(backBtn);

        if (this.playersData.length > 0) {
            this.selectPlayerForClass(0);
        }

        this.classSelectionElements.forEach(el => el.setVisible(false));
    }

    resetGameProgress() {
        console.log("Lobby: Reiniciando progresso do jogo.");

        localStorage.removeItem('brics_team_stats');

        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('brics_player_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        localStorage.removeItem('brics_selected_squad');

        this.loadPlayerData(); 
        this.teamLevelManager.loadStats();
        this.refreshClassSelectionView();
    }

    togglePlayerSelection(index) {
        const player = this.playersData[index];
        const selectedCount = this.playersData.filter(p => p.isSelected).length;

        if (!player.isSelected && selectedCount >= 3) {
            this.cameras.main.shake(100, 0.005);
            return;
        }
        
        if (player.isSelected && selectedCount <= 1) {
             this.cameras.main.shake(100, 0.005);
             return;
        }

        player.isSelected = !player.isSelected;
        this.refreshClassSelectionView();
    }

    updateGameConfigPlayers() {
        const selectedIndices = this.playersData.filter(p => p.isSelected).map(p => p.index);
        localStorage.setItem('brics_selected_squad', JSON.stringify(selectedIndices));
        window.gameConfig.PLAYERS = selectedIndices.map(i => window.gameConfig.ALL_PLAYERS[i]);
    }

    updatePlayerName(index, newName) {
        if (window.gameConfig.ALL_PLAYERS[index]) {
            window.gameConfig.ALL_PLAYERS[index].name = newName;
        }
        
        try {
            const customNames = JSON.parse(localStorage.getItem('brics_custom_names') || '{}');
            customNames[index] = newName;
            localStorage.setItem('brics_custom_names', JSON.stringify(customNames));
        } catch (e) {
            console.warn("Erro ao salvar nome customizado", e);
        }

        this.loadPlayerData();
        this.refreshClassSelectionView();
    }

    refreshClassSelectionView() {
        if (this.classSelectionElements) {
            this.classSelectionElements.forEach(el => el.destroy());
        }
        this.createClassSelectionView();
        this.showView('class_selection');
    }

    selectPlayerForClass(index) {
        this.selectedPlayerIndex = index;
        const player = this.playersData[index];

        this.playersData.forEach((p, i) => {
            if (p.rowBg) p.rowBg.setStrokeStyle(
                i === index ? 2 : 1, 
                i === index ? 0x00ff00 : 0x444444
            );
        });

        this.classOptionsContainer.removeAll(true);

        const classes = [
            { key: 'combat', color: 0xff4444 },
            { key: 'infiltration', color: 0x44ff44 },
            { key: 'recon', color: 0x44ffff }
        ];

        const title = this.add.text(0, -180, 
            this.languageManager.get('lobby_class_of', { name: player.name.toUpperCase() }), 
            { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }
        ).setOrigin(0.5);
        this.classOptionsContainer.add(title);

        classes.forEach((cls, i) => {
            const y = -100 + i * 110;
            const isSelected = player.assignedClass === cls.key;
            
            const bg = this.add.rectangle(0, y, 400, 90, isSelected ? 0x222222 : 0x000000)
                .setStrokeStyle(isSelected ? 3 : 1, cls.color)
                .setInteractive({ useHandCursor: true });

            const name = this.add.text(0, y - 20, 
                this.languageManager.get(`lobby_class_${cls.key}`).toUpperCase(), 
                { fontSize: '20px', color: '#' + cls.color.toString(16).padStart(6, '0'), fontStyle: 'bold' }
            ).setOrigin(0.5);
            
            const desc = this.add.text(0, y + 15, 
                this.languageManager.get(`lobby_class_${cls.key}_desc`), 
                { fontSize: '12px', color: '#cccccc', align: 'center' }
            ).setOrigin(0.5);

            bg.on('pointerdown', () => {
                player.assignedClass = cls.key;
                localStorage.setItem(`brics_player_class_${player.name}`, cls.key);
                
                if (player.classText) {
                    player.classText.setText(
                        this.languageManager.get(`lobby_class_${cls.key}`).toUpperCase()
                    );
                }
                
                this.selectPlayerForClass(index);
            });

            this.classOptionsContainer.add([bg, name, desc]);
        });
    }

    showView(viewName) {
        this.currentView = viewName;

        this.introElements.forEach(el => el.setVisible(false));
        this.baseElements.forEach(el => el.setVisible(false));
        
        if (this.classSelectionElements) {
            this.classSelectionElements.forEach(el => el.setVisible(false));
        }

        this.baseContentElements.forEach(el => el.destroy());
        this.baseContentElements = [];

        if (viewName === 'intro') {
            this.introElements.forEach(el => el.setVisible(true));
        } else if (viewName === 'class_selection') {
            if (this.classSelectionElements) {
                this.classSelectionElements.forEach(el => el.setVisible(true));
            }
        } else if (viewName === 'base') {
            this.baseElements.forEach(el => el.setVisible(true));
            this.switchView('clinic');
        }
    }

    switchView(subViewName) {
        this.currentSubView = subViewName;
        
        this.baseContentElements.forEach(el => el.destroy());
        this.baseContentElements = [];
        this.selectedPlayerIndex = -1;

        if (subViewName === 'clinic') {
            this.renderClinicView();
        } else if (subViewName === 'stash') {
            this.renderStashView();
        } else if (subViewName === 'arsenal') {
            this.renderPlaceholderView(
                this.languageManager.get('lobby_nav_arsenal'), 
                'lobby_placeholder_arsenal_desc'
            );
        } else if (subViewName === 'comando') {
            this.renderPlaceholderView(
                this.languageManager.get('lobby_nav_command'), 
                'lobby_placeholder_command_desc'
            );
        } else if (subViewName === 'hangar') {
            this.renderPlaceholderView(
                this.languageManager.get('lobby_nav_hangar'), 
                'lobby_placeholder_hangar_desc'
            );
        }
    }

    renderPlaceholderView(title, subtitleKey) {
        const { width, height } = this.scale;
        const contentX = width / 2 + 100;
        
        const titleText = this.add.text(contentX, height / 2 - 20, title, 
            { fontSize: '32px', color: '#ccc' }
        ).setOrigin(0.5);
        
        const subtitleText = this.add.text(contentX, height / 2 + 20, 
            `${this.languageManager.get(subtitleKey)}\n(${this.languageManager.get('lobby_placeholder_soon')})`, 
            { fontSize: '18px', color: '#888', align: 'center' }
        ).setOrigin(0.5);
        
        this.baseContentElements.push(titleText, subtitleText);
    }

    renderClinicView() {
        const { width, height } = this.scale;
        const listX = width / 2 - 150;
        const startY = 150;
        const rowHeight = 55;

        this.playersData.forEach((player, index) => {
            const y = startY + index * rowHeight;
            
            const rowBg = this.add.rectangle(listX, y, 300, 48, 0x111111)
                .setStrokeStyle(1, 0x444444)
                .setInteractive({ useHandCursor: true });
                
            rowBg.on('pointerdown', () => this.renderClinicDetails(index));
            rowBg.on('pointerover', () => rowBg.setFillStyle(0x222222));
            rowBg.on('pointerout', () => rowBg.setFillStyle(0x111111));

            const face = this.add.image(listX - 120, y, `player_face_${index + 1}`)
                .setDisplaySize(40, 40);
                
            const name = this.add.text(listX - 90, y - 8, 
                `${player.name} (Lv ${player.level})`, 
                { fontSize: '14px', color: '#fff' }
            ).setOrigin(0, 0.5);
            
            const insanity = this.add.text(listX - 90, y + 12, 
                this.languageManager.get('lobby_clinic_insanity', { value: player.insanity.toFixed(0) }), 
                { fontSize: '12px', color: '#ff00ff' }
            ).setOrigin(0, 0.5);

            this.baseContentElements.push(rowBg, face, name, insanity);
        });

        if (this.teamLevelManager.needsRecovery) {
            const checkupBtn = this.add.text(width / 2, height - 80, 
                this.languageManager.get('lobby_clinic_checkup_button'), 
                { fontSize: '20px', color: '#000000', fontStyle: 'bold', backgroundColor: '#ffff00', padding: { x: 20, y: 10 } }
            ).setOrigin(0.5)
             .setInteractive({ useHandCursor: true });
            
            this.tweens.add({
                targets: checkupBtn,
                scale: 1.05,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
            
            checkupBtn.on('pointerdown', () => {
                this.teamLevelManager.recoverAgents();
                this.showFloatingMessage(this.languageManager.get('lobby_clinic_agents_recovered'), '#00ff00');
                this.switchView('clinic');
            });
            
            this.baseContentElements.push(checkupBtn);
        }

        this.renderClinicDetails(-1);
    }

    renderStashView() {
        const { width, height } = this.scale;
        const cx = width / 2;
        // const cy = height / 2; // Não usado diretamente, mas mantido para referência

        // Título
        const title = this.add.text(cx, 80, 
            this.languageManager.get('stash_title'), 
            { fontSize: '32px', color: '#00ff00', fontStyle: 'bold' }
        ).setOrigin(0.5);
        this.baseContentElements.push(title);

        const instruction = this.add.text(cx, 120, 
            this.languageManager.get('stash_instruction'), 
            { fontSize: '16px', color: '#aaaaaa' }
        ).setOrigin(0.5);
        this.baseContentElements.push(instruction);

        // Colunas
        const col1X = cx - 200;
        const col2X = cx + 200;
        const startY = 180;

        // Cabeçalhos
        const invLabel = this.add.text(col1X, startY - 30, 
            this.languageManager.get('stash_inventory_label'), 
            { fontSize: '18px', color: '#ffff00', fontStyle: 'bold' }
        ).setOrigin(0.5);
        
        const stashLabel = this.add.text(col2X, startY - 30, 
            this.languageManager.get('stash_storage_label'), 
            { fontSize: '18px', color: '#00ffff', fontStyle: 'bold' }
        ).setOrigin(0.5);

        this.baseContentElements.push(invLabel, stashLabel);

        // Renderiza Listas
        this.renderItemList(col1X, startY, this.teamLevelManager.inventory, 'inventory');
        this.renderItemList(col2X, startY, this.teamLevelManager.stash, 'stash');
    }

    renderItemList(x, y, items, source) {
        items.forEach((itemKey, index) => {
            const itemY = y + index * 30;
            
            // Obtém nome do item
            let itemName = itemKey;
            if (window.gameConfig.WEAPONS[itemKey]) itemName = window.gameConfig.WEAPONS[itemKey].name;
            else if (window.gameConfig.ARMORS[itemKey]) itemName = window.gameConfig.ARMORS[itemKey].name;
            else if (this.languageManager.get(`item_name_${itemKey}`) !== `item_name_${itemKey}`) itemName = this.languageManager.get(`item_name_${itemKey}`);

            const text = this.add.text(x, itemY, itemName.toUpperCase(), { fontSize: '16px', color: '#ffffff', backgroundColor: '#111111', padding: { x: 5, y: 2 } })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            text.on('pointerover', () => text.setColor('#00ff00'));
            text.on('pointerout', () => text.setColor('#ffffff'));
            
            text.on('pointerdown', () => {
                if (source === 'inventory') {
                    this.teamLevelManager.moveToStash(index);
                } else {
                    if (!this.teamLevelManager.moveFromStash(index)) {
                        this.showFloatingMessage(this.languageManager.get('inventory_full_stash'), '#ff0000');
                        return;
                    }
                }
                // Atualiza a vista
                this.baseContentElements.forEach(el => el.destroy());
                this.baseContentElements = [];
                this.renderStashView();
            });

            this.baseContentElements.push(text);
        });
    }

    renderClinicDetails(playerIndex) {
        this.selectedPlayerIndex = playerIndex;
        
        if (this.detailsContainer) this.detailsContainer.destroy();

        const { width, height } = this.scale;
        const detailX = width / 2 + 250;
        
        this.detailsContainer = this.add.container(detailX, height / 2);
        this.baseContentElements.push(this.detailsContainer);

        if (playerIndex === -1) {
            const text = this.add.text(0, 0, 
                this.languageManager.get('lobby_clinic_select_agent'), 
                { fontSize: '16px', color: '#888', align: 'center' }
            ).setOrigin(0.5);
            this.detailsContainer.add(text);
            return;
        }

        const player = this.playersData[playerIndex];
        const insanity = player.insanity || 0;
        const costPerPoint = 10;
        const totalCost = Math.floor(insanity) * costPerPoint;
        const teamMoney = this.teamLevelManager.money;

        const face = this.add.image(0, -100, `player_face_${player.index + 1}`)
            .setDisplaySize(90, 90);
            
        const name = this.add.text(0, -40, player.name, 
            { fontSize: '20px', color: '#fff' }
        ).setOrigin(0.5);
        
        const insanityText = this.add.text(0, 0, 
            this.languageManager.get('lobby_clinic_insanity', { value: insanity.toFixed(0) }), 
            { fontSize: '16px', color: '#ff00ff' }
        ).setOrigin(0.5);
        
        const costText = this.add.text(0, 30, 
            this.languageManager.get('lobby_clinic_total_cost', { value: totalCost }), 
            { fontSize: '16px', color: '#ffff00' }
        ).setOrigin(0.5);
        
        const moneyText = this.add.text(0, 60, 
            this.languageManager.get('lobby_clinic_funds', { value: teamMoney }), 
            { fontSize: '14px', color: '#ccc' }
        ).setOrigin(0.5);

        const canAfford = teamMoney >= totalCost && insanity > 0;
        
        const repairBtn = this.add.text(0, 120, 
            this.languageManager.get('lobby_clinic_repair_insanity'), 
            { fontSize: '16px', color: canAfford ? '#00ff00' : '#555', backgroundColor: '#222', padding: { x: 10, y: 5 } }
        ).setOrigin(0.5);

        if (canAfford) {
            repairBtn.setInteractive({ useHandCursor: true });
            repairBtn.on('pointerdown', () => this.repairInsanity(playerIndex, totalCost));
            repairBtn.on('pointerover', () => repairBtn.setBackgroundColor('#444'));
            repairBtn.on('pointerout', () => repairBtn.setBackgroundColor('#222'));
        }

        this.detailsContainer.add([face, name, insanityText, costText, moneyText, repairBtn]);
    }

    repairInsanity(playerIndex, cost) {
        const player = this.playersData[playerIndex];
        this.teamLevelManager.gainMoney(-cost);
        player.insanity = 0;

        const key = `brics_player_${player.name}`;
        const saved = localStorage.getItem(key);
        let data = {};
        try {
            data = saved ? JSON.parse(saved) || {} : {};
        } catch (e) {
            data = {};
        }
        data.insanity = 0;
        localStorage.setItem(key, JSON.stringify(data));

        this.switchView('clinic');
        this.time.delayedCall(10, () => this.renderClinicDetails(playerIndex));
    }

    showFloatingMessage(text, color) {
        const { width, height } = this.scale;
        
        const msg = this.add.text(width / 2, height / 2, text, 
            { fontSize: '32px', color: color, stroke: '#000000', strokeThickness: 4, fontStyle: 'bold' }
        ).setOrigin(0.5)
         .setDepth(20000);
        
        this.tweens.add({
            targets: msg,
            y: height / 2 - 100,
            alpha: 0,
            duration: 2000,
            onComplete: () => msg.destroy()
        });
    }

    handleButtonClick(key) {
        if (key === 'opcoes') {
            this.optionsPanel.toggle();
        }
    }

    handleResize(gameSize) {
        const { width, height } = gameSize;

        // 1. Fundo
        if (this.bg) {
            this.bg.setPosition(width / 2, height / 2);
            this.bg.setDisplaySize(width, height);
        }

        // 2. Painel de ajuda
        if (this.helpContainer) {
            const helpX = width * 0.135;
            const helpY = height / 2;
            this.helpContainer.setPosition(helpX, helpY);
        }

        // 3. Botão Start
        if (this.startBtn) {
            this.startBtn.setPosition(width * 0.40, height * 0.80);
        }

        // 4. Botão Options
        if (this.optionsBtn) {
            this.optionsBtn.setPosition(width * 0.65, height * 0.80);
        }

        // 5. Texto de versão
        if (this.versionText) {
            this.versionText.setPosition(width - 10, height - 1);
        }

        // 6. Overlay de brilho
        if (this.brightnessOverlay) {
            this.brightnessOverlay.setSize(width, height);
        }

        // 7. OptionsPanel
        if (this.optionsPanel && typeof this.optionsPanel.handleResize === 'function') {
            this.optionsPanel.handleResize(width, height);
        } else if (this.optionsPanel && this.optionsPanel.destroyAndRecreate) {
            this.optionsPanel.destroyAndRecreate();
        }

        // 8. Atualiza a view atual
        this.refreshCurrentView(width, height);
    }

    refreshCurrentView(width, height) {
        switch (this.currentView) {
            case 'class_selection':
                if (this.classSelectionElements && this.classSelectionElements.length > 0) {
                    // Atualiza título
                    const title = this.classSelectionElements[1];
                    if (title && title.type === 'Text') {
                        const selectedCount = this.playersData.filter(p => p.isSelected).length;
                        title.setText(this.languageManager.get('lobby_squad_title', { count: selectedCount }));
                        title.setPosition(width / 2, 50);
                    }
                    
                    // Atualiza posição da lista de personagens
                    const listX = width * 0.3;
                    const startY = 120;
                    const rowHeight = 65;
                    
                    let playerIndex = 0;
                    this.classSelectionElements.forEach((el, idx) => {
                        if (el.type === 'Rectangle' && el.width === 360) {
                            // É um rowBg
                            const y = startY + playerIndex * rowHeight;
                            el.setPosition(listX, y);
                            
                            // Os próximos 5 elementos pertencem a este jogador
                            // checkbox, face, name, editIcon, classText
                            const elements = this.classSelectionElements.slice(idx + 1, idx + 6);
                            
                            elements.forEach((subEl, subIdx) => {
                                if (subIdx === 0) { // checkbox
                                    subEl.setPosition(listX - 150, y);
                                } else if (subIdx === 1) { // face
                                    subEl.setPosition(listX - 110, y);
                                } else if (subIdx === 2) { // name
                                    subEl.setPosition(listX - 70, y - 12);
                                } else if (subIdx === 3) { // editIcon
                                    const nameEl = elements[2];
                                    if (nameEl) {
                                        subEl.setPosition(nameEl.x + nameEl.width + 10, y - 12);
                                    }
                                } else if (subIdx === 4) { // classText
                                    subEl.setPosition(listX - 70, y + 12);
                                }
                            });
                            
                            playerIndex++;
                        }
                    });
                    
                    // Atualiza container de classes
                    if (this.classOptionsContainer) {
                        this.classOptionsContainer.setPosition(width * 0.7, startY + 150);
                    }

                    // Atualiza Nome do Esquadrão
                    if (this.squadInputUI) {
                        const squadNameY = height - 120;
                        this.squadInputUI.label.setPosition(width / 2, squadNameY - 25);
                        this.squadInputUI.bg.setPosition(width / 2, squadNameY + 5);
                        this.squadInputUI.text.setPosition(width / 2, squadNameY + 5);
                    }
                    
                    // Atualiza botões
                    const btnMarginResize = window.gameConfig.IS_MOBILE ? 150 : 50;
                    this.classSelectionElements.forEach(el => {
                        if (el.type === 'Text') {
                            if (el.text === this.languageManager.get('lobby_confirm')) {
                                el.setPosition(width - btnMarginResize, height - btnMarginResize);
                            } else if (el.text === this.languageManager.get('lobby_back')) {
                                el.setPosition(btnMarginResize, height - btnMarginResize);
                            }
                        }
                    });
                }
                break;
                
            case 'base':
                if (this.baseElements && this.baseElements.length > 0) {
                    // Atualiza fundo
                    const bg = this.baseElements[0];
                    if (bg) bg.setSize(width, height);
                    
                    // Atualiza botões de navegação
                    const navX = 120;
                    let navY = 150;
                    
                    for (let i = 1; i < this.baseElements.length; i++) {
                        const btn = this.baseElements[i];
                        if (btn && btn.type === 'Text') {
                            btn.setPosition(navX, navY);
                            navY += 50;
                        }
                    }
                }
                
                // Recria o conteúdo da subview atual
                if (this.currentSubView) {
                    this.switchView(this.currentSubView);
                }
                break;
        }
    }

    toggleShadows() {
        this.showShadows = !this.showShadows;
        localStorage.setItem('brics_shadows', this.showShadows);
        if (this.optionsPanel) this.optionsPanel.updateShadowsDisplay();
    }

    toggleFps() {
        this.showFps = !this.showFps;
        localStorage.setItem('brics_show_fps', this.showFps);
        if (this.optionsPanel) this.optionsPanel.updateFpsDisplay();
    }

    setZoom(value) {
        this.targetZoom = Phaser.Math.Clamp(value, 0.9, 2.7);
        localStorage.setItem('brics_zoom', this.targetZoom);
        if (this.optionsPanel) this.optionsPanel.updateZoomDisplay();
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

    // --- Métodos de Edição de Nome do Esquadrão ---

    stopEditingSquadName() {
        this.isEditingSquadName = false;
        if (this.squadInputUI && this.squadInputUI.bg) {
            this.squadInputUI.bg.setStrokeStyle(1, 0x00ff00); // Volta para verde
        }
        localStorage.setItem('brics_squad_name', this.squadName);
        this.updateSquadNameDisplay();
    }

    updateSquadNameDisplay() {
        if (!this.squadInputUI || !this.squadInputUI.text) return;
        
        let display = this.squadName;
        let color = '#ffffff';

        if (this.isEditingSquadName) {
            // Cursor piscante baseado no tempo da cena
            const isBlink = Math.floor(this.time.now / 500) % 2 === 0;
            display += isBlink ? '|' : ' ';
            
            color = '#ffff00'; // Amarelo enquanto edita
        } else if (!display || display.length === 0) {
            display = this.languageManager.get('lobby_squad_name_placeholder');
            color = '#666666';
        }

        this.squadInputUI.text.setText(display);
        this.squadInputUI.text.setColor(color);
    }
}