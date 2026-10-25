// /var/www/html/brics/DebugPanel.js
export default class DebugPanel {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.isVisible = false;
        this.blocker = null;
    }

    create() {
        const { width, height } = this.scene.scale;
        const panelWidth = 420;
        const panelHeight = 650;

        this.container = this.scene.add.container(width / 2, height / 2)
            .setDepth(100000) // Garante que fique acima de tudo
            .setScrollFactor(0)
            .setVisible(false);

        // Blocker (Full screen interactive background)
        this.blocker = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.01)
            .setInteractive();

        this.blocker.on('pointerdown', () => {
            if (this.isVisible) this.toggle();
        });

        this.container.add(this.blocker);

        // Fundo
        const bg = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.95)
            .setStrokeStyle(2, 0xff00ff) // Borda Magenta para destacar que é Debug
            .setInteractive(); // Bloqueia cliques no jogo atrás do painel
        
        // Impede propagação de clique
        bg.on('pointerdown', (pointer, localX, localY, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
        });

        this.container.add(bg);

        // Título
        const title = this.scene.add.text(0, -panelHeight / 2 + 30, this.scene.languageManager.get('debug_title'), {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ff00ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(title);

        let currentY = -panelHeight / 2 + 70;
        const gap = 45;
        const col1 = -100;
        const col2 = 100;
        const btnW = 190;

        // --- Botão God Mode ---
        this.godModeBtn = this.createButton(col1, currentY, this.scene.languageManager.get('debug_god_mode'), () => {
            this.scene.isGodMode = !this.scene.isGodMode;
            this.updateVisuals(); 
            if (this.scene.uiManager) {
                const statusKey = this.scene.isGodMode ? 'status_godmode_on' : 'status_godmode_off';
                this.scene.uiManager.updateStatus(this.scene.languageManager.get(statusKey));
            }
        }, btnW);
        this.container.add(this.godModeBtn.container);

        // --- Botão Visão Inimiga ---
        this.visionBtn = this.createButton(col2, currentY, this.scene.languageManager.get('debug_enemy_vision'), () => {
            this.scene.disableEnemyVision = !this.scene.disableEnemyVision;
            this.updateVisuals();
            // Atualiza a visão dos NPCs imediatamente
            if (this.scene.npcManager) {
                this.scene.npcManager.updateNpcVision(
                    this.scene.informationManager ? this.scene.informationManager.isInstanceMode : false,
                    this.scene.isStealthMode
                );
            }
        }, btnW);
        this.container.add(this.visionBtn.container);
        currentY += gap;

        // --- Botão Debug Waypoints (L) ---
        this.waypointsBtn = this.createButton(col1, currentY, "WAYPOINTS", () => {
            if (this.scene.npcManager) {
                this.scene.npcManager.toggleDebug();
                if (this.scene.informationManager) this.scene.informationManager.toggleDebug(this.scene.npcManager.isDebugVisible);
            }
            this.updateVisuals();
        }, btnW);
        this.container.add(this.waypointsBtn.container);

        // --- Botão Debug Obstacles (U) ---
        this.obstaclesBtn = this.createButton(col2, currentY, "OBSTACLES", () => {
            if (this.scene.scenarioManager) {
                this.scene.scenarioManager.toggleDebug();
            }
            this.updateVisuals();
        }, btnW);
        this.container.add(this.obstaclesBtn.container);
        currentY += gap;

        // --- Botão Vision Radius ---
        this.visionRadiusBtn = this.createButton(0, currentY, "VISION RADIUS", () => {
            if (this.scene.npcManager) {
                this.scene.npcManager.toggleVisionDebug();
            }
            this.updateVisuals();
        }, 390);
        this.container.add(this.visionRadiusBtn.container);
        currentY += gap;

        // --- Botão Target Lines ---
        this.targetLinesBtn = this.createButton(0, currentY, "TARGET LINES", () => {
            if (this.scene.npcManager && typeof this.scene.npcManager.toggleTargetDebug === 'function') {
                this.scene.npcManager.toggleTargetDebug();
            } else {
                console.warn('DebugPanel: toggleTargetDebug não encontrado em NPCManager. Tente limpar o cache (Ctrl+F5).');
            }
            this.updateVisuals();
        }, 390);
        this.container.add(this.targetLinesBtn.container);
        currentY += gap;

        // --- Botão Info Display (V) ---
        this.infoDisplayBtn = this.createButton(0, currentY, "INFO DISPLAY", () => {
             const modes = ['default', 'number', 'bar', 'both', 'groupId', 'id', 'dynamic', 'level', 'squad_number'];
             const current = this.scene.healthDisplayMode || 'dynamic';
             const nextIndex = (modes.indexOf(current) + 1) % modes.length;
             this.scene.healthDisplayMode = modes[nextIndex];
             if (this.scene.unitController) this.scene.unitController.refreshHealthDisplay();
             this.updateVisuals();
        }, 390);
        this.container.add(this.infoDisplayBtn.container);
        currentY += gap + 15;

        // --- Botão Force Joystick ---
        this.forceJoystickBtn = this.createButton(0, currentY, "FORCE JOYSTICK (RELOAD)", () => {
            const url = new URL(window.location.href);
            url.searchParams.set('joystick', '1');
            window.location.href = url.toString();
        }, 390);
        this.container.add(this.forceJoystickBtn.container);
        currentY += gap;

        // --- Seletor de Nível ---
        const levelTitle = this.scene.add.text(0, currentY, this.scene.languageManager.get('debug_select_mission'), {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(levelTitle);
        currentY += 45;

        // --- Botão Laboratório ---
        const labBtn = this.createButton(0, currentY, this.scene.languageManager.get('debug_goto_lab'), () => {
            const url = new URL(window.location.href);
            url.searchParams.delete('mission');
            url.searchParams.delete('autostart');
            url.searchParams.set('view', 'base');
            window.location.href = url.toString();
        }, 390);
        this.container.add(labBtn.container);
        currentY += gap;

        const levels = ['missao1', 'missao2', 'missao3', 'missao4', 'missao5'];
        levels.forEach((level, index) => {
            let x = 0;
            let y = currentY;
            let w = 390;

            if (index < 4) {
                const row = Math.floor(index / 2);
                const col = index % 2;
                y = currentY + row * gap;
                x = (col === 0) ? col1 : col2;
                w = btnW;
            } else {
                y = currentY + 2 * gap;
            }

            const btn = this.createButton(x, y, level.toUpperCase(), () => {
                // Recarrega a página com a nova missão
                const url = new URL(window.location.href);
                url.searchParams.set('mission', level);
                url.searchParams.set('autostart', '1');
                // Preserva o parâmetro do joystick se estiver presente na URL atual
                if (new URLSearchParams(window.location.search).has('joystick')) {
                    url.searchParams.set('joystick', '1');
                }
                window.location.href = url.toString();
            }, w);
            this.container.add(btn.container);
        });

        this.updateVisuals();
    }

    createButton(x, y, label, callback, w = 250, h = 40) {
        const container = this.scene.add.container(x, y);
        const bg = this.scene.add.rectangle(0, 0, w, h, 0x333333)
            .setStrokeStyle(1, 0xffffff)
            .setInteractive({ useHandCursor: true });
        
        const text = this.scene.add.text(0, 0, label, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        bg.on('pointerdown', (pointer, localX, localY, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            callback();
        });
        
        bg.on('pointerover', () => bg.setFillStyle(0x555555));
        bg.on('pointerout', () => bg.setFillStyle(0x333333));

        container.add([bg, text]);
        
        // Guarda referências para atualização
        container.bg = bg;
        container.text = text;

        return { container, bg, text };
    }

    updateVisuals() {
        if (this.godModeBtn) {
            const isGod = this.scene.isGodMode; 
            const status = isGod ? this.scene.languageManager.get('debug_status_on') : this.scene.languageManager.get('debug_status_off');
            this.godModeBtn.text.setText(`${this.scene.languageManager.get('debug_god_mode')}: ${status}`);
            this.godModeBtn.text.setColor(isGod ? '#00ff00' : '#ffffff');
            this.godModeBtn.bg.setStrokeStyle(1, isGod ? 0x00ff00 : 0xffffff);
        }

        if (this.visionBtn) {
            const isVisionDisabled = this.scene.disableEnemyVision; 
            const status = isVisionDisabled ? this.scene.languageManager.get('debug_status_off') : this.scene.languageManager.get('debug_status_on');
            this.visionBtn.text.setText(`${this.scene.languageManager.get('debug_enemy_vision')}: ${status}`);
            this.visionBtn.text.setColor(isVisionDisabled ? '#ff0000' : '#00ff00');
            this.visionBtn.bg.setStrokeStyle(1, isVisionDisabled ? 0xff0000 : 0x00ff00);
        }

        if (this.waypointsBtn) {
            const isOn = this.scene.npcManager && this.scene.npcManager.isDebugVisible;
            const status = isOn ? 'ON' : 'OFF';
            this.waypointsBtn.text.setText(`WAYPOINTS: ${status}`);
            this.waypointsBtn.text.setColor(isOn ? '#00ff00' : '#ffffff');
            this.waypointsBtn.bg.setStrokeStyle(1, isOn ? 0x00ff00 : 0xffffff);
        }

        if (this.obstaclesBtn) {
            const isOn = this.scene.scenarioManager && this.scene.scenarioManager.isDebugVisible;
            const status = isOn ? 'ON' : 'OFF';
            this.obstaclesBtn.text.setText(`OBSTACLES: ${status}`);
            this.obstaclesBtn.text.setColor(isOn ? '#00ff00' : '#ffffff');
            this.obstaclesBtn.bg.setStrokeStyle(1, isOn ? 0x00ff00 : 0xffffff);
        }

        if (this.visionRadiusBtn) {
            const isOn = this.scene.npcManager && this.scene.npcManager.isVisionDebugVisible;
            const status = isOn ? 'ON' : 'OFF';
            this.visionRadiusBtn.text.setText(`VISION RADIUS: ${status}`);
            this.visionRadiusBtn.text.setColor(isOn ? '#00ff00' : '#ffffff');
            this.visionRadiusBtn.bg.setStrokeStyle(1, isOn ? 0x00ff00 : 0xffffff);
        }

        if (this.targetLinesBtn) {
            const isOn = this.scene.npcManager && this.scene.npcManager.isTargetDebugVisible;
            const status = isOn ? 'ON' : 'OFF';
            this.targetLinesBtn.text.setText(`TARGET LINES: ${status}`);
            this.targetLinesBtn.text.setColor(isOn ? '#00ff00' : '#ffffff');
            this.targetLinesBtn.bg.setStrokeStyle(1, isOn ? 0x00ff00 : 0xffffff);
        }

        if (this.infoDisplayBtn) {
            const mode = this.scene.healthDisplayMode || 'default';
            this.infoDisplayBtn.text.setText(`INFO: ${mode.toUpperCase()}`);
        }

        if (this.forceJoystickBtn) {
            const isForced = new URLSearchParams(window.location.search).has('joystick');
            this.forceJoystickBtn.text.setText(`JOYSTICK FORCED: ${isForced ? 'YES' : 'NO'}`);
            this.forceJoystickBtn.bg.setStrokeStyle(1, isForced ? 0x00ff00 : 0xffffff);
        }
    }

    toggle() {
        this.isVisible = !this.isVisible;
        if (this.container) {
            this.container.setVisible(this.isVisible);
            if (this.isVisible) {
                this.updateVisuals();
                this.scene.children.bringToTop(this.container);
            }
        }
    }

    destroyAndRecreate() {
        if (this.container) {
            this.container.destroy();
        }
        this.create();
        if (this.isVisible) {
            this.container.setVisible(true);
        }
    }
}