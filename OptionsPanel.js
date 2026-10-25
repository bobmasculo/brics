export default class OptionsPanel {
    constructor(scene) {
        this.scene = scene;
        this.elements = []; // Elementos comuns (Fundo, Título, Botão Fechar, Abas)
        this.tabElements = { geral: [], som: [], acessibilidade: [] }; // Elementos específicos de cada aba
        this.currentTab = 'geral'; // Aba inicial
        this.musicControl = null;
        this.sfxControl = null;
        this.voiceControl = null;
        this.zoomControl = null;
        this.objectiveValueText = null;
        this.uiScaleText = null;
        this.shadowsText = null;
        this.fpsText = null;
        this.fontText = null;
        this.colorBlindText = null;
        this.fontScaleControl = null;
        this.visualModeText = null;
        this.languageText = null;
        this.brightnessControl = null;
        this.accessibilityText = null;
        this.isVisible = false;
        this.tooltip = null;
        this.blocker = null;
    }
 
    create() { 
        const width = 605; 
        const height = 480; // Aumentado para caber a nova opção de escala de fonte
        const panelX = this.scene.scale.width / 2;
        const panelY = this.scene.scale.height / 2;
        const { width: screenWidth, height: screenHeight } = this.scene.scale;

        // Blocker (Full screen interactive background)
        this.blocker = this.scene.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x000000, 0.01)
            .setScrollFactor(0)
            .setDepth(19999) // Just below panel (20000)
            .setInteractive();

        this.blocker.on('pointerdown', () => {
            if (this.isVisible) this.scene.handleButtonClick('opcoes');
        });
        
        this.elements.push(this.blocker);

        // Fundo
        const bg = this.scene.add.rectangle(panelX, panelY, width, height, 0x000000, 0.9)
            .setStrokeStyle(2, 0xffffff)
            .setScrollFactor(0)
            .setDepth(20000)
            .setInteractive();
             
        bg.on('pointerdown', (pointer, localX, localY, event) => {
            
            if (event && event.stopPropagation) event.stopPropagation();
        });
        
        // Título
        const title = this.scene.add.text(panelX, panelY - height/2 + 25, this.scene.languageManager.get('options_title'), {
            fontSize: '18px', color: '#fcfcfc', fontStyle: 'bold', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);

        this.elements.push(bg, title);

        // --- SISTEMA DE ABAS ---
        const tabY = panelY - height/2 + 60;
        const tabWidth = 120;
        const tabHeight = 30; 
        const tabsData = [
            { key: 'geral', label: this.scene.languageManager.get('options_tab_general') },
            { key: 'som', label: this.scene.languageManager.get('options_tab_sound') },
            { key: 'acessibilidade', label: this.scene.languageManager.get('options_tab_accessibility') }
        ];
        const tabXOffsets = [-140, 0, 140]; // Posições X das abas

        this.tabButtons = {};

        tabsData.forEach((tab, index) => {
            const x = panelX + tabXOffsets[index];
            const btn = this.scene.add.rectangle(x, tabY, tabWidth, tabHeight, 0x333333)
                .setStrokeStyle(1, 0xffffff)
                .setScrollFactor(0).setDepth(20001).setInteractive({ useHandCursor: true });
            
            const txt = this.scene.add.text(x, tabY, tab.label, {
                fontSize: '11px', color: '#ffffff', fontStyle: 'bold', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(20002);

            btn.on('pointerdown', () => this.switchTab(tab.key));
            
            this.elements.push(btn, txt);
            this.tabButtons[tab.key] = { btn, txt };
        });

        // --- CONTEÚDO DAS ABAS ---
        const contentStartY = tabY + 60;
        const gap = 45;

        // === ABA 1: GERAL ===
        const geral = this.tabElements.geral;

        this.addSingleLineControl(this.scene.languageManager.get('options_fps'), panelX, contentStartY, () => this.scene.toggleFps(), 'fpsText', 'gear_icon', geral, 'Mostra/Oculta contador de FPS');
        this.updateFpsDisplay();

        this.addSingleLineControl(this.scene.languageManager.get('options_shadows'), panelX, contentStartY + gap, () => this.scene.toggleShadows(), 'shadowsText', 'gear_icon', geral, 'Ativa/Desativa sombras');
        this.updateShadowsDisplay();

        this.addSingleLineControl(this.scene.languageManager.get('options_visual_mode'), panelX, contentStartY + gap * 2, () => this.cycleVisualMode(), 'visualModeText', 'gear_icon', geral, 'Alterna estilo visual das unidades');
        this.updateVisualModeDisplay();

        // Botão Tela Cheia (Customizado para Geral)
        const fsY = contentStartY + gap * 3;
        const fsBg = this.scene.add.rectangle(panelX + 42, fsY, 84, 21, 0x333333)
            .setStrokeStyle(1, 0xffffff).setScrollFactor(0).setDepth(20001).setInteractive({ useHandCursor: true });
        const fsLabel = this.scene.add.text(panelX - 84, fsY, this.scene.languageManager.get('options_fullscreen'), {
            fontSize: '10px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(20001);
        const fsText = this.scene.add.text(fsBg.x, fsBg.y, this.scene.languageManager.get('options_toggle'), {
            fontSize: '9px', color: '#ffffff', fontStyle: 'bold', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20002);
        
        this.addIcon(panelX, fsY, 'gear_icon', geral);

        fsBg.on('pointerdown', () => {
            if (this.scene.scale.isFullscreen) this.scene.scale.stopFullscreen();
            else this.scene.scale.startFullscreen();
        });
        
        fsBg.on('pointerover', () => this.showTooltip(fsBg.x, fsBg.y, 'Alterna tela cheia'));
        fsBg.on('pointerout', () => this.hideTooltip());
        geral.push(fsBg, fsLabel, fsText);
        
        


        // === ABA 2: SOM ===
        const som = this.tabElements.som;
        
        this.addVolumeControl(this.scene.languageManager.get('options_music'), panelX, contentStartY, 'music', 'volume_icon', som, 'Volume da música');
        this.addVolumeControl(this.scene.languageManager.get('options_sfx'), panelX, contentStartY + gap, 'sfx', 'volume_icon', som, 'Volume dos efeitos');
        this.addVolumeControl(this.scene.languageManager.get('options_voices'), panelX, contentStartY + gap * 2, 'voice', 'volume_icon', som, 'Volume das vozes');


        // === ABA 3: ACESSIBILIDADE ===
        const acess = this.tabElements.acessibilidade;
        const leftCol = panelX - 150;
        const rightCol = panelX + 150;

        // Coluna Esquerda
        // Modo de Controle (Customizado)
        const modeY = contentStartY;
        this.addIcon(leftCol, modeY, 'gear_icon', acess); 
        const modeLabel = this.scene.add.text(leftCol - 84, modeY, this.scene.languageManager.get('options_controls'), {
            fontSize: '10px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(20001);
        
        const btnW = 35;
        this.classicBtn = this.scene.add.rectangle(leftCol + 20, modeY, btnW, 20, 0x333333).setStrokeStyle(1, 0xffffff).setScrollFactor(0).setDepth(20001).setInteractive({useHandCursor:true});
        this.classicText = this.scene.add.text(this.classicBtn.x, this.classicBtn.y, this.scene.languageManager.get('options_controls_mouse'), { fontSize: '8px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5).setScrollFactor(0).setDepth(20002);
        
        this.modernBtn = this.scene.add.rectangle(leftCol + 60, modeY, btnW, 20, 0x333333).setStrokeStyle(1, 0xffffff).setScrollFactor(0).setDepth(20001).setInteractive({useHandCursor:true});
        this.modernText = this.scene.add.text(this.modernBtn.x, this.modernBtn.y, this.scene.languageManager.get('options_controls_wasd'), { fontSize: '8px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5).setScrollFactor(0).setDepth(20002);
        
        this.classicBtn.on('pointerdown', () => this.setControlMode(false));
        this.modernBtn.on('pointerdown', () => this.setControlMode(true));
        
        this.classicBtn.on('pointerover', () => this.showTooltip(this.classicBtn.x, this.classicBtn.y, 'Mover com clique'));
        this.classicBtn.on('pointerout', () => this.hideTooltip());
        this.modernBtn.on('pointerover', () => this.showTooltip(this.modernBtn.x, this.modernBtn.y, 'Mover com WASD'));
        this.modernBtn.on('pointerout', () => this.hideTooltip());
        
        acess.push(modeLabel, this.classicBtn, this.classicText, this.modernBtn, this.modernText);

        this.addObjectiveControl(this.scene.languageManager.get('options_objectives'), leftCol, contentStartY + gap, 'objetivos_icon', acess, 'Estilo da lista de objetivos');
        this.addSingleLineControl(this.scene.languageManager.get('options_ui_scale'), leftCol, contentStartY + gap * 2, () => this.cycleUiScale(), 'uiScaleText', 'escala_icon', acess, 'Tamanho da interface');
        this.updateUiScaleDisplay();
        this.addSingleLineControl(this.scene.languageManager.get('options_font'), leftCol, contentStartY + gap * 3, () => this.cycleFont(), 'fontText', 'fonte_icon', acess, 'Tipo de fonte do jogo');
        this.updateFontDisplay();
        this.addSingleLineControl(this.scene.languageManager.get('options_colorblind'), leftCol, contentStartY + gap * 4, () => this.cycleColorBlindMode(), 'colorBlindText', 'gear_icon', acess, 'Modo de cores acessíveis');
        this.updateColorBlindDisplay();

        if (this.scene.accessibilityManager) {
            this.addSingleLineControl(this.scene.languageManager.get('options_captions'), leftCol, contentStartY + gap * 5, () => this.toggleAccessibilityCaptions(), 'accessibilityText', 'help_icon', acess, 'Legendas de ação (N)');
            this.updateAccessibilityDisplay();
        }

        // Coluna Direita
        this.addZoomControl(this.scene.languageManager.get('options_zoom'), rightCol, contentStartY, 'zoom_icon', acess, 'Nível de zoom da câmera');
        this.addBrightnessControl(this.scene.languageManager.get('options_brightness'), rightCol, contentStartY + gap, 'brilho_icon', acess, 'Brilho da tela');
        this.addFontScaleControl(this.scene.languageManager.get('options_font_scale'), rightCol, contentStartY + gap * 2, 'fonte_icon', acess, 'Tamanho do texto');
        this.addSingleLineControl(this.scene.languageManager.get('options_language'), rightCol, contentStartY + gap * 3, () => this.cycleLanguage(), 'languageText', 'gear_icon', acess, 'Muda o idioma do jogo');
        this.updateLanguageDisplay();

        // === BOTÃO FECHAR (Comum) ===
        const bottomY = panelY + height/2 - 40;
        const closeBg = this.scene.add.rectangle(panelX, bottomY, 140, 30, 0x330000)
            .setStrokeStyle(1, 0xff0000)
            .setScrollFactor(0)
            .setDepth(20001)
            .setInteractive({ useHandCursor: true });

        const closeText = this.scene.add.text(closeBg.x, closeBg.y, this.scene.languageManager.get('options_close'), {
            fontSize: '12px', color: '#ff0000', fontStyle: 'bold', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20002);

        closeBg.on('pointerdown', (pointer, localX, localY, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.scene.handleButtonClick('opcoes');
        });

        this.elements.push(closeBg, closeText);

        // Esconde todos os elementos ao criar
        this.elements.forEach(el => el.setVisible(false));
        Object.values(this.tabElements).forEach(arr => arr.forEach(el => el.setVisible(false)));

        // Aplica a escala de fonte salva aos elementos da cena ao iniciar
        this.applyFontToScene(this.scene);
        this.createTooltip();
    }

    cycleVisualMode() {
        const current = this.scene.healthDisplayMode;
        let next = 'dynamic';
        
        // Alterna entre Padrão (dynamic) e Syndicate (squad_number)
        if (current === 'dynamic') next = 'squad_number';
        else next = 'dynamic'; // Qualquer outro modo volta para o padrão no ciclo simples

        this.scene.healthDisplayMode = next;
        localStorage.setItem('brics_health_mode', next);
        
        this.updateVisualModeDisplay();
        if (this.scene.unitController && this.scene.unitController.refreshHealthDisplay) {
            this.scene.unitController.refreshHealthDisplay();
        }
    }

    updateVisualModeDisplay() {
        if (this.visualModeText) {
            const mode = this.scene.healthDisplayMode;
            const textKey = (mode === 'squad_number') ? 'visual_mode_syndicate' : 'visual_mode_default';
            this.visualModeText.setText(this.scene.languageManager.get(textKey));
        }
    }

    addIcon(x, y, iconKey, targetArray) {
        if (iconKey && this.scene.textures.exists(iconKey)) {
            const icon = this.scene.add.image(x - 100, y, iconKey)
                .setDisplaySize(14, 14)
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(20001);
            (targetArray || this.elements).push(icon);
        } else {
            console.warn(`OptionsPanel: Ícone '${iconKey}' não encontrado ou não carregado.`);
        }
    }

    addVolumeControl(label, x, y, type, iconKey, targetArray, description) {
        this.addIcon(x, y, iconKey, targetArray);

        const labelText = this.scene.add.text(x - 84, y, label, {
            fontSize: '10px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(20001);

        // --- Slider Visual ---
        const sliderWidth = 84;
        const sliderHeight = 7;
        const sliderX = x + 10;
        
        // Trilho (Fundo)
        const track = this.scene.add.rectangle(sliderX + sliderWidth/2, y, sliderWidth, sliderHeight, 0x333333)
            .setScrollFactor(0).setDepth(20001).setInteractive({ useHandCursor: true });
            
        // Preenchimento (Progresso)
        const fill = this.scene.add.rectangle(sliderX, y, 0, sliderHeight, 0x00ff00)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(20002);
            
        // Manopla (Handle)
        const handle = this.scene.add.circle(sliderX, y, 6, 0xffffff)
            .setScrollFactor(0).setDepth(20003).setInteractive({ draggable: true, useHandCursor: true });

        // Texto de Valor
        const valueText = this.scene.add.text(sliderX + sliderWidth + 18, y, '100%', {
            fontSize: '11px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);

        const control = { track, fill, handle, valueText, sliderX, sliderWidth };
        if (type === 'music') this.musicControl = control;
        else if (type === 'sfx') this.sfxControl = control;
        else this.voiceControl = control;

        // Atualiza valor inicial
        this.updateVolumeDisplay(type);

        // Lógica de Interação
        const updateValue = (pointer) => {
            const screenX = pointer.position.x;
            let pct = (screenX - sliderX) / sliderWidth;
            pct = Phaser.Math.Clamp(pct, 0, 1);
            this.setVolume(type, pct);
        };

        track.on('pointerdown', updateValue);
        this.scene.input.setDraggable(handle);
        handle.on('drag', (pointer) => updateValue(pointer));
        
        if (description) {
            track.on('pointerover', () => this.showTooltip(sliderX + sliderWidth/2, y, description));
            track.on('pointerout', () => this.hideTooltip());
            handle.on('pointerover', () => this.showTooltip(sliderX + sliderWidth/2, y, description));
            handle.on('pointerout', () => this.hideTooltip());
        }

        (targetArray || this.elements).push(labelText, track, fill, handle, valueText);
    }

    addObjectiveControl(label, x, y, iconKey, targetArray, description) {
        this.addIcon(x, y, iconKey, targetArray);

        const labelText = this.scene.add.text(x - 84, y, label, {
            fontSize: '10px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(20001);

        // Botão de Ciclo
        const btnWidth = 84;
        const btnHeight = 21;
        const btnX = x + 42; // Alinhado com os controles de volume

        const btnBg = this.scene.add.rectangle(btnX, y, btnWidth, btnHeight, 0x333333)
            .setStrokeStyle(1, 0xffffff)
            .setScrollFactor(0).setDepth(20001).setInteractive({ useHandCursor: true });

        const btnText = this.scene.add.text(btnX, y, '', {
            fontSize: '9px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20002);

        this.objectiveValueText = btnText;

        btnBg.on('pointerdown', (pointer, localX, localY, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.cycleObjectiveMode();
        });
        
        // Efeitos de Hover
        btnBg.on('pointerover', () => btnBg.setFillStyle(0x555555));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0x333333));
        
        if (description) {
            btnBg.on('pointerover', () => this.showTooltip(btnX, y, description));
            btnBg.on('pointerout', () => this.hideTooltip());
        }

        (targetArray || this.elements).push(labelText, btnBg, btnText);
    }

    addZoomControl(label, x, y, iconKey, targetArray, description) {
        this.addIcon(x, y, iconKey, targetArray);

        const labelText = this.scene.add.text(x - 84, y, label, {
            fontSize: '10px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(20001);

        // --- Slider Visual ---
        const sliderWidth = 84;
        const sliderHeight = 7;
        const sliderX = x + 10;
        
        // Trilho (Fundo)
        const track = this.scene.add.rectangle(sliderX + sliderWidth/2, y, sliderWidth, sliderHeight, 0x333333)
            .setScrollFactor(0).setDepth(20001).setInteractive({ useHandCursor: true });
            
        // Preenchimento (Progresso)
        const fill = this.scene.add.rectangle(sliderX, y, 0, sliderHeight, 0x00ff00)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(20002);
            
        // Manopla (Handle)
        const handle = this.scene.add.circle(sliderX, y, 6, 0xffffff)
            .setScrollFactor(0).setDepth(20003).setInteractive({ draggable: true, useHandCursor: true });

        // Texto de Valor
        const valueText = this.scene.add.text(sliderX + sliderWidth + 18, y, '1.0x', {
            fontSize: '11px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);

        this.zoomControl = { track, fill, handle, valueText, sliderX, sliderWidth };
        this.updateZoomDisplay();

        // Lógica de Interação
        const updateValue = (pointer) => {
            const screenX = pointer.position.x;
            let pct = (screenX - sliderX) / sliderWidth;
            pct = Phaser.Math.Clamp(pct, 0, 1);
            const zoom = 0.9 + pct * (2.7 - 0.9); // Range 0.9 a 2.7
            this.scene.setZoom(zoom);
            this.updateZoomDisplay();
        };

        track.on('pointerdown', updateValue);
        this.scene.input.setDraggable(handle);
        handle.on('drag', (pointer) => updateValue(pointer));
        
        if (description) {
            track.on('pointerover', () => this.showTooltip(sliderX + sliderWidth/2, y, description));
            track.on('pointerout', () => this.hideTooltip());
            handle.on('pointerover', () => this.showTooltip(sliderX + sliderWidth/2, y, description));
            handle.on('pointerout', () => this.hideTooltip());
        }

        (targetArray || this.elements).push(labelText, track, fill, handle, valueText);
    }

    addBrightnessControl(label, x, y, iconKey, targetArray, description) {
        this.addIcon(x, y, iconKey, targetArray);

        const labelText = this.scene.add.text(x - 84, y, label, {
            fontSize: '10px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(20001);

        const sliderWidth = 84;
        const sliderHeight = 7;
        const sliderX = x + 10;
        
        const track = this.scene.add.rectangle(sliderX + sliderWidth/2, y, sliderWidth, sliderHeight, 0x333333)
            .setScrollFactor(0).setDepth(20001).setInteractive({ useHandCursor: true });
            
        const fill = this.scene.add.rectangle(sliderX, y, 0, sliderHeight, 0x00ff00)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(20002);
            
        const handle = this.scene.add.circle(sliderX, y, 6, 0xffffff)
            .setScrollFactor(0).setDepth(20003).setInteractive({ draggable: true, useHandCursor: true });

        const valueText = this.scene.add.text(sliderX + sliderWidth + 18, y, '100%', {
            fontSize: '11px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);

        this.brightnessControl = { track, fill, handle, valueText, sliderX, sliderWidth };
        this.updateBrightnessDisplay();

        const updateValue = (pointer) => {
            const screenX = pointer.position.x;
            let pct = (screenX - sliderX) / sliderWidth;
            pct = Phaser.Math.Clamp(pct, 0, 1);
            const brightness = 0.5 + pct * (1.5 - 0.5); // Range 0.5 a 1.5
            if (this.scene.setBrightness) this.scene.setBrightness(brightness);
            this.updateBrightnessDisplay();
        };

        track.on('pointerdown', updateValue);
        this.scene.input.setDraggable(handle);
        handle.on('drag', (pointer) => updateValue(pointer));
        
        if (description) {
            track.on('pointerover', () => this.showTooltip(sliderX + sliderWidth/2, y, description));
            track.on('pointerout', () => this.hideTooltip());
            handle.on('pointerover', () => this.showTooltip(sliderX + sliderWidth/2, y, description));
            handle.on('pointerout', () => this.hideTooltip());
        }

        (targetArray || this.elements).push(labelText, track, fill, handle, valueText);
    }

    addFontScaleControl(label, x, y, iconKey, targetArray, description) {
        this.addIcon(x, y, iconKey, targetArray);
        const labelText = this.scene.add.text(x - 84, y, label, {
            fontSize: '10px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(20001);

        const sliderWidth = 84;
        const sliderHeight = 7;
        const sliderX = x + 10;
        
        const track = this.scene.add.rectangle(sliderX + sliderWidth/2, y, sliderWidth, sliderHeight, 0x333333)
            .setScrollFactor(0).setDepth(20001).setInteractive({ useHandCursor: true });
            
        const fill = this.scene.add.rectangle(sliderX, y, 0, sliderHeight, 0x00ff00)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(20002);
            
        const handle = this.scene.add.circle(sliderX, y, 6, 0xffffff)
            .setScrollFactor(0).setDepth(20003).setInteractive({ draggable: true, useHandCursor: true });

        const valueText = this.scene.add.text(sliderX + sliderWidth + 18, y, '1.0x', {
            fontSize: '11px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);

        this.fontScaleControl = { track, fill, handle, valueText, sliderX, sliderWidth };
        this.updateFontScaleDisplay();

        const updateValue = (pointer) => {
            const screenX = pointer.position.x;
            let pct = (screenX - sliderX) / sliderWidth;
            pct = Phaser.Math.Clamp(pct, 0, 1);
            // Escala de 0.8x a 1.2x
            let scale = 0.8 + pct * (1.2 - 0.8); 
            scale = Math.round(scale * 100) / 100; // Arredonda para 2 casas decimais
            window.gameConfig.FONT_SCALE = scale;
            localStorage.setItem('brics_font_scale', scale);
            this.updateFontScaleDisplay();
            this.applyFontToScene(this.scene);
        };

        track.on('pointerdown', updateValue);
        this.scene.input.setDraggable(handle);
        handle.on('drag', (pointer) => updateValue(pointer));
        
        if (description) {
            track.on('pointerover', () => this.showTooltip(sliderX + sliderWidth/2, y, description));
            track.on('pointerout', () => this.hideTooltip());
            handle.on('pointerover', () => this.showTooltip(sliderX + sliderWidth/2, y, description));
            handle.on('pointerout', () => this.hideTooltip());
        }

        (targetArray || this.elements).push(labelText, track, fill, handle, valueText);
    }

    addIsoSkewControl(label, x, y, iconKey, targetArray, description) {
        this.addIcon(x, y, iconKey, targetArray);

        const labelText = this.scene.add.text(x - 84, y, label, {
            fontSize: '10px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(20001);

        const sliderWidth = 84;
        const sliderHeight = 7;
        const sliderX = x + 10;
        
        const track = this.scene.add.rectangle(sliderX + sliderWidth/2, y, sliderWidth, sliderHeight, 0x333333)
            .setScrollFactor(0).setDepth(20001).setInteractive({ useHandCursor: true });
            
        const fill = this.scene.add.rectangle(sliderX, y, 0, sliderHeight, 0x00ff00)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(20002);
            
        const handle = this.scene.add.circle(sliderX, y, 6, 0xffffff)
            .setScrollFactor(0).setDepth(20003).setInteractive({ draggable: true, useHandCursor: true });

        const valueText = this.scene.add.text(sliderX + sliderWidth + 18, y, '', {
            fontSize: '11px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20001);

        const currentVal = (typeof this.scene.isometricZoomX === 'number') ? this.scene.isometricZoomX : 0.7;
        const minVal = 0.1;
        const maxVal = 1.5;
        const initialPct = Phaser.Math.Clamp((currentVal - minVal) / (maxVal - minVal), 0, 1);
        
        fill.width = sliderWidth * initialPct;
        handle.x = sliderX + sliderWidth * initialPct;
        valueText.setText(currentVal.toFixed(2));

        const updateValue = (pointer) => {
            const screenX = pointer.position.x;
            let pct = (screenX - sliderX) / sliderWidth;
            pct = Phaser.Math.Clamp(pct, 0, 1);
            
            const newVal = minVal + pct * (maxVal - minVal);
            
            fill.width = sliderWidth * pct;
            handle.x = sliderX + sliderWidth * pct;
            valueText.setText(newVal.toFixed(2));
            
            if (this.scene.setIsometricZoomX) {
                this.scene.setIsometricZoomX(newVal);
            }
        };

        track.on('pointerdown', updateValue);
        this.scene.input.setDraggable(handle);
        handle.on('drag', (pointer) => updateValue(pointer));
        
        if (description) {
            track.on('pointerover', () => this.showTooltip(sliderX + sliderWidth/2, y, description));
            track.on('pointerout', () => this.hideTooltip());
            handle.on('pointerover', () => this.showTooltip(sliderX + sliderWidth/2, y, description));
            handle.on('pointerout', () => this.hideTooltip());
        }

        (targetArray || this.elements).push(labelText, track, fill, handle, valueText);
    }

    addSingleLineControl(label, x, y, onClick, textPropName, iconKey, targetArray, description) {
        this.addIcon(x, y, iconKey, targetArray);
        const labelText = this.scene.add.text(x - 84, y, label, {
            fontSize: '10px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(20001);

        const btnWidth = 84;
        const btnHeight = 21;
        const btnX = x + 42;

        const btnBg = this.scene.add.rectangle(btnX, y, btnWidth, btnHeight, 0x333333)
            .setStrokeStyle(1, 0xffffff)
            .setScrollFactor(0).setDepth(20001).setInteractive({ useHandCursor: true });

        const btnText = this.scene.add.text(btnX, y, '', {
            fontSize: '9px', color: '#ffffff', fontFamily: window.gameConfig.FONT_FAMILY || 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20002);

        if (textPropName) this[textPropName] = btnText;
        btnBg.on('pointerdown', onClick);
        
        if (description) {
            btnBg.on('pointerover', () => this.showTooltip(btnX, y, description));
            btnBg.on('pointerout', () => this.hideTooltip());
        }
        (targetArray || this.elements).push(labelText, btnBg, btnText);
    }

    cycleLanguage() {
        if (this.scene.languageManager) {
            this.scene.languageManager.cycleLanguage();
            // O evento 'languageChanged' vai cuidar de recarregar a UI.
            // Apenas atualizamos o texto deste botão.
            this.updateLanguageDisplay();
        }
    }

    updateLanguageDisplay() {
        if (this.languageText && this.scene.languageManager) {
            const langKey = this.scene.languageManager.currentLanguage;
            this.languageText.setText(this.scene.languageManager.get(`lang_${langKey}`));
        }
    }

    setVolume(type, pct) {
        if (this.scene.soundManager) {
            let currentVol = this.scene.soundManager.sfxVolume;
            if (type === 'music') currentVol = this.scene.soundManager.musicVolume;
            else if (type === 'voice') currentVol = this.scene.soundManager.voiceVolume;

            const delta = pct - currentVol;
            
            if (type === 'music') {
                this.scene.soundManager.adjustMusicVolume(delta);
            } else if (type === 'sfx') {
                this.scene.soundManager.adjustSfxVolume(delta);
            } else if (type === 'voice') {
                this.scene.soundManager.adjustVoiceVolume(delta);
            }
            this.updateVolumeDisplay(type);
        }
    }

    updateVolumeDisplay(type) {
        if (this.scene.soundManager) {
            let vol = this.scene.soundManager.sfxVolume;
            if (type === 'music') vol = this.scene.soundManager.musicVolume;
            else if (type === 'voice') vol = this.scene.soundManager.voiceVolume;

            vol = Phaser.Math.Clamp(vol, 0, 1);
            
            const control = type === 'music' ? this.musicControl : (type === 'voice' ? this.voiceControl : this.sfxControl);
            if (control) {
                control.valueText.setText(`${Math.round(vol * 100)}%`);
                control.fill.width = control.sliderWidth * vol;
                control.handle.x = control.sliderX + control.sliderWidth * vol;
            }
        }
    }

    updateZoomDisplay() {
        if (this.zoomControl && this.scene) {
            const zoom = this.scene.targetZoom;
            const pct = (zoom - 0.9) / (2.7 - 0.9);
            
            this.zoomControl.valueText.setText(`${zoom.toFixed(1)}x`);
            this.zoomControl.fill.width = this.zoomControl.sliderWidth * pct;
            this.zoomControl.handle.x = this.zoomControl.sliderX + this.zoomControl.sliderWidth * pct;
        }
    }

    updateBrightnessDisplay() {
        if (this.brightnessControl && this.scene) {
            const brightness = this.scene.targetBrightness !== undefined ? this.scene.targetBrightness : 1.0;
            const pct = (brightness - 0.5) / (1.5 - 0.5);
            
            this.brightnessControl.valueText.setText(`${Math.round(brightness * 100)}%`);
            this.brightnessControl.fill.width = this.brightnessControl.sliderWidth * pct;
            this.brightnessControl.handle.x = this.brightnessControl.sliderX + this.brightnessControl.sliderWidth * pct;
        }
    }

    updateFontScaleDisplay() {
        if (this.fontScaleControl) {
            const scale = window.gameConfig.FONT_SCALE || 1.0;
            const pct = Phaser.Math.Clamp((scale - 0.8) / (1.2 - 0.8), 0, 1);
            
            this.fontScaleControl.valueText.setText(`${scale.toFixed(2)}x`);
            this.fontScaleControl.fill.width = this.fontScaleControl.sliderWidth * pct;
            this.fontScaleControl.handle.x = this.fontScaleControl.sliderX + this.fontScaleControl.sliderWidth * pct;
        }
    }

    cycleUiScale() {
        const modes = ['auto', 'high', 'low'];
        const current = localStorage.getItem('brics_ui_scale_mode') || 'auto';
        const nextIndex = (modes.indexOf(current) + 1) % modes.length;
        const next = modes[nextIndex];
        
        localStorage.setItem('brics_ui_scale_mode', next);
        this.updateUiScaleDisplay();
        
        if (this.scene.uiManager) {
            this.scene.uiManager.destroyAndRecreate();
        }
    }

    updateUiScaleDisplay() {
        const current = localStorage.getItem('brics_ui_scale_mode') || 'auto';
        let text = "AUTO"; // TODO: Translate
        if (current === 'high') text = "HIGH (100%)";
        if (current === 'low') text = "LOW (90%)";
        if (this.uiScaleText) this.uiScaleText.setText(text);
    }

    updateShadowsDisplay() {
        if (this.shadowsText) {
            const isOn = this.scene.showShadows;
            this.shadowsText.setText(isOn ? "LIGADO" : "DESLIGADO");
        }
    }

    updateFpsDisplay() {
        if (this.fpsText) {
            const isOn = this.scene.showFps; 
            const text = isOn ? this.scene.languageManager.get('options_on') : this.scene.languageManager.get('options_off');
            this.fpsText.setText(text);
        }
    }

    cycleFont() {
        const fonts = ['Arial', 'Google Sans', 'SN Pro'];
        const current = window.gameConfig.FONT_FAMILY || 'Arial';
        let nextIndex = fonts.indexOf(current) + 1;
        if (nextIndex >= fonts.length || nextIndex < 0) nextIndex = 0;
        const next = fonts[nextIndex];

        window.gameConfig.FONT_FAMILY = next;
        localStorage.setItem('brics_font', next);
        this.updateFontDisplay();
        
        // Aplica a fonte a todos os textos da cena atual
        this.applyFontToScene(this.scene);
    }

    updateFontDisplay() {
        if (this.fontText) {
            const font = window.gameConfig.FONT_FAMILY || 'Arial';
            this.fontText.setText(font);
            this.fontText.setFontFamily(font);
        }
    }

    applyFontToScene(scene) {
        const font = window.gameConfig.FONT_FAMILY;
        const scale = window.gameConfig.FONT_SCALE || 1.0;
        if (scene && scene.children && scene.children.list) {
            scene.children.list.forEach(child => {
                this.updateObjectFont(child, font, scale);
            });
        }
    }

    setControlMode(isModern) {
        if (this.scene.keyboardManager) {
            // Se o estado desejado for diferente do atual, alterna
            if (this.scene.keyboardManager.isActive !== isModern) {
                this.scene.keyboardManager.toggleMode();
            }
            this.updateModeDisplay();
        }
    }

    updateModeDisplay() {
        if (this.scene.keyboardManager) {
            const isModern = this.scene.keyboardManager.isActive;
            
            // Atualiza visual do botão Clássico
            this.classicBtn.setFillStyle(isModern ? 0x333333 : 0x00ff00); // Verde se ativo (Clássico é !isModern)
            this.classicText.setColor(isModern ? '#ffffff' : '#000000');

            // Atualiza visual do botão Moderno
            this.modernBtn.setFillStyle(isModern ? 0x00ff00 : 0x333333); // Verde se ativo
            this.modernText.setColor(isModern ? '#000000' : '#ffffff');
        }
    }

    cycleObjectiveMode() {
        if (this.scene.missionManager) {
            let mode = this.scene.missionManager.objectiveDisplayMode;
            mode++;
            if (mode > 3) mode = 0;
            this.scene.missionManager.setObjectiveMode(mode);
            this.updateObjectiveDisplay();
        }
    }

    updateObjectiveDisplay() {
        if (this.scene.missionManager && this.objectiveValueText) {
            const mode = this.scene.missionManager.objectiveDisplayMode; // TODO: Translate
            let text = "DESLIGADO";
            if (mode === 1) text = "WITH BOX";
            else if (mode === 2) text = "NO BOX";
            else if (mode === 3) text = "BLACK BG";
            this.objectiveValueText.setText(text);
        }
    }

    cycleColorBlindMode() {
        // O Lobby não implementa cycleColorBlindMode (só a GameScene)
        if (this.scene.cycleColorBlindMode) this.scene.cycleColorBlindMode();
    }

    updateColorBlindDisplay() {
        if (this.colorBlindText) {
            const mode = this.scene.colorBlindMode || 'NONE'; // TODO: Translate
            // Mapeamento simples para exibição
            const textMap = { 'NONE': 'NENHUM', 'PROTANOPIA': 'PROTANOPIA', 'DEUTERANOPIA': 'DEUTERANOPIA', 'TRITANOPIA': 'TRITANOPIA' };
            this.colorBlindText.setText(textMap[mode] || 'NENHUM');
            
            // Muda a cor do texto para dar feedback visual da paleta
            if (mode === 'PROTANOPIA' || mode === 'DEUTERANOPIA') this.colorBlindText.setColor('#0077ff');
            else if (mode === 'TRITANOPIA') this.colorBlindText.setColor('#00ffff');
            else this.colorBlindText.setColor('#ffffff');
        }
    }

    toggleAccessibilityCaptions() {
        if (this.scene.accessibilityManager) {
            this.scene.accessibilityManager.toggle();
            this.updateAccessibilityDisplay();
        }
    }

    updateAccessibilityDisplay() {
        if (this.accessibilityText && this.scene.accessibilityManager) {
            const isOn = this.scene.accessibilityManager.isActive;
            const text = isOn ? this.scene.languageManager.get('options_on') : this.scene.languageManager.get('options_off');
            this.accessibilityText.setText(text);
        }
    }

    updateObjectFont(obj, font, scale) {
        if (obj.type === 'Text') {
            obj.setFontFamily(font);
            
            // Armazena a escala original se ainda não tiver, para aplicar o multiplicador corretamente
            if (obj.getData('originalScaleX') === undefined) {
                obj.setData('originalScaleX', obj.scaleX);
                obj.setData('originalScaleY', obj.scaleY);
            }
            const osX = obj.getData('originalScaleX');
            const osY = obj.getData('originalScaleY');
            obj.setScale(osX * scale, osY * scale);
        } else if (obj.type === 'Container' && obj.list) {
            obj.list.forEach(child => this.updateObjectFont(child, font, scale));
        }
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Atualiza Botões das Abas
        Object.keys(this.tabButtons).forEach(key => {
            const { btn, txt } = this.tabButtons[key];
            const isActive = (key === tabName);
            btn.setFillStyle(isActive ? 0x00ff00 : 0x333333);
            txt.setColor(isActive ? '#000000' : '#ffffff');
        });

        // Atualiza Visibilidade do Conteúdo
        Object.keys(this.tabElements).forEach(key => {
            const visible = (key === tabName);
            this.tabElements[key].forEach(el => el.setVisible(visible));
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;

        // Elementos comuns
        this.elements.forEach(el => el.setVisible(this.isVisible));

        if (this.isVisible) {
            this.updateVolumeDisplay('music');
            this.updateVolumeDisplay('sfx');
            this.updateVolumeDisplay('voice');
            this.updateZoomDisplay();
            this.updateBrightnessDisplay();
            this.updateObjectiveDisplay();
            this.updateModeDisplay();
            this.updateUiScaleDisplay();
            this.updateShadowsDisplay();
            this.updateFpsDisplay();
            this.updateFontDisplay();
            this.updateColorBlindDisplay();
            this.updateFontScaleDisplay();
            this.updateLanguageDisplay();
            this.updateAccessibilityDisplay();
            this.updateVisualModeDisplay();
            
            this.switchTab(this.currentTab);
            this.hideTooltip();
        } else {
            Object.values(this.tabElements).forEach(arr => arr.forEach(el => el.setVisible(false)));
        }

        if (this.scene.uiManager) {
            this.scene.uiManager.toggleButtonState('opcoes', this.isVisible);
        }

        return this.isVisible;
    }

    createTooltip() {
        this.tooltip = this.scene.add.container(0, 0).setDepth(20010).setVisible(false).setScrollFactor(0);
        const bg = this.scene.add.rectangle(0, 0, 100, 30, 0x000000, 0.9).setStrokeStyle(1, 0xffff00);
        const text = this.scene.add.text(0, 0, '', { fontSize: '10px', color: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5);
        this.tooltip.add([bg, text]);
        this.tooltip.bg = bg;
        this.tooltip.text = text;
    }

    showTooltip(x, y, text) {
        if (this.tooltip) {
            this.tooltip.text.setText(text);
            this.tooltip.bg.setSize(this.tooltip.text.width + 10, this.tooltip.text.height + 10);
            this.tooltip.setPosition(x, y - 25);
            this.tooltip.setVisible(true);
        }
    }

    hideTooltip() {
        if (this.tooltip) this.tooltip.setVisible(false);
    }

    destroy() {
        this.elements.forEach(el => {
            if (el && typeof el.destroy === 'function') {
                el.destroy();
            }
        });
        Object.values(this.tabElements).forEach(arr => arr.forEach(el => {
            if (el && typeof el.destroy === 'function') el.destroy();
        }));
        this.elements = [];
        this.tabElements = { geral: [], som: [], acessibilidade: [] };
        this.musicControl = null;
        this.sfxControl = null;
        this.voiceControl = null;
        this.zoomControl = null;
        this.brightnessControl = null;
        this.objectiveValueText = null;
        this.uiScaleText = null;
        this.shadowsText = null;
        this.fpsText = null;
        this.fontText = null;
        this.fontScaleControl = null;
        if (this.tooltip) this.tooltip.destroy();
    }

    destroyAndRecreate() {
        const wasVisible = this.isVisible;
        this.destroy();
        this.create();
        if (wasVisible) {
            this.isVisible = false; // Força o toggle a mudar para true
            this.toggle();
        }
    }
}
