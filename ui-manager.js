(function() {
    'use strict';

    window.UIManager = {
        createUI: function(scene) {
            const { UI_BAR_HEIGHT, BUTTON_HEIGHT, BUTTON_PADDING, BUTTON_WIDTH, COLORS } = window.gameConfig;

            scene.uiBar = scene.add.rectangle(
                0,
                scene.scale.height - UI_BAR_HEIGHT,
                scene.scale.width,
                UI_BAR_HEIGHT, 
                0x000000
            )
            .setOrigin(0, 0)
            .setDepth(9999)
            .setScrollFactor(0);

            scene.spPanel = scene.add.text(
                0,
                scene.scale.height - 65,
                '',
                { fontSize: '14px', color: '#ffffff' }
            )
            .setScrollFactor(0)
            .setDepth(10001);

            scene.buttons = {};
            scene.spTexts = []; 

            this.createButtons(scene);
            this.createItemSlots(scene);
            this.updateSPPanel(scene);
            this.updateItemSlots(scene);
        },

        createButtons: function(scene) {
            const { BUTTON_HEIGHT, BUTTON_PADDING, BUTTON_WIDTH, COLORS } = window.gameConfig;
            const leftX = 10;
            const topY = scene.uiBar.y + 5;

            const buttonData = [
                { key: 'andar', icon: '🚶', label: '🚶 ANDA', width: BUTTON_WIDTH, x: leftX, y: topY },
                { key: 'atirar', icon: '🔫', label: 'ATIRAR', width: BUTTON_WIDTH, x: leftX + BUTTON_WIDTH + BUTTON_PADDING, y: topY },
                { key: 'range', icon: '🎯', label: 'RANGE', width: BUTTON_WIDTH, x: leftX + (BUTTON_WIDTH + BUTTON_PADDING) * 2, y: topY },
                { key: 'inventario', icon: '🎒', label: 'INV', width: BUTTON_WIDTH, x: leftX + (BUTTON_WIDTH + BUTTON_PADDING) * 3, y: topY }
            ];

            buttonData.forEach(data => {
                const rect = scene.add.rectangle(
                    data.x,
                    data.y,
                    data.width,
                    BUTTON_HEIGHT,
                    COLORS.BUTTON_INACTIVE
                )
                .setOrigin(0, 0)
                .setInteractive()
                .setScrollFactor(0)
                .setDepth(10000);

                const iconText = scene.add.text(
                    data.x + data.width/2,
                    data.y + BUTTON_HEIGHT/2,
                    data.label,
                    { fontSize: '10px', color: COLORS.BUTTON_TEXT_INACTIVE, fontFamily: "'Font Awesome 6 Free', Arial" }
                )
                .setOrigin(0.5)
                .setDepth(10001)
                .setScrollFactor(0);

                if (data.key === 'andar' || data.key === 'atirar') {
                    rect.on('pointerdown', () => {
                        this.handleButtonClick(scene, data.key);
                    });
                } else {
                    rect.on('pointerdown', () => {
                        scene.handleButtonClick(data.key);
                    });
                }

                scene.buttons[data.key] = { rect, iconText, labelText, key: data.key };
            });
        },

        createItemSlots: function(scene) {
            scene.itemSlots = [];
            scene.itemImages = [];

            const { BUTTON_WIDTH, BUTTON_PADDING } = window.gameConfig;
            const slotSize = 40;
            const padding = 5;
            const topY = scene.uiBar.y + 5;
            const rightButtonsStart = scene.scale.width - 10;
            const slotTotalWidth = 4 * slotSize + 3 * padding;
            const startX = rightButtonsStart - slotTotalWidth;

            for (let i = 0; i < 4; i++) {
                const x = startX + i * (slotSize + padding);
                const rect = scene.add.rectangle(x, topY, slotSize, window.gameConfig.BUTTON_HEIGHT, 0x333333)
                    .setOrigin(0, 0)
                    .setStrokeStyle(1, 0xffffff)
                    .setScrollFactor(0)
                    .setDepth(10000);

                scene.itemSlots.push(rect);
            }
        },

        handleButtonClick: function(scene, key) {
            switch (key) {
                case 'andar':
                    this.handleMoveButton(scene);
                    break;
                case 'atirar':
                    this.handleShootButton(scene);
                    break;
            }
        },

        handleMoveButton: function(scene) {
            if (scene.selectedPlayer) {
                scene.actionMode = 'move';
                this.updateMoveButton(scene);
                this.updateShootButton(scene);
                this.updateStatus(scene, 'Modo: Mover - Clique para mover');
            }
        },

        handleShootButton: function(scene) {
            if (scene.selectedPlayer) {
                scene.actionMode = 'shoot';
                this.updateMoveButton(scene);
                this.updateShootButton(scene);
                this.updateStatus(scene, `Modo: Atirar - Distância: ${window.gameConfig.SHOOT_DISTANCE}px - Clique para atirar`);
            }
        },



        updateSPPanel: function(scene) {
            scene.spTexts.forEach(text => text.destroy());
            scene.spTexts = [];

            const { BUTTON_WIDTH, BUTTON_PADDING } = window.gameConfig;
            const allPlayers = scene.players.getChildren();
            if (!allPlayers.length) return;

            const totalButtonsWidth = BUTTON_WIDTH * 2 + BUTTON_PADDING;
            const leftButtonsEnd = 10 + totalButtonsWidth + 10;
            const rightButtonsStart = scene.scale.width - 10;
            const availableWidth = rightButtonsStart - leftButtonsEnd;

            const panelWidth = availableWidth;
            const panelY = scene.uiBar.y + 10;
            const spacingX = Math.min(150, panelWidth / allPlayers.length);
            let offsetX = leftButtonsEnd + 10;

            allPlayers.forEach((p, i) => {
                const sel = p === scene.selectedPlayer ? ' <' : '';
                const text = `P${i + 1}: HP ${p.health}${sel}`;
                const textObj = scene.add.text(
                    offsetX,
                    panelY,
                    text,
                    { fontSize: '14px', color: '#ffffff' }
                )
                .setScrollFactor(0)
                .setDepth(10001);

                scene.spTexts.push(textObj);
                offsetX += spacingX;
            });
        },

        updateItemSlots: function(scene) {
            // Limpa imagens anteriores
            scene.itemImages.forEach(img => img.destroy());
            scene.itemImages = [];

            const selectedPlayer = scene.selectedPlayer;
            if (!selectedPlayer) return;

            const inventory = selectedPlayer.inventory || [];
            const items = inventory.slice(0, 4); // Limita a 4
            const weaponConfig = window.gameConfig.WEAPONS || {};

            scene.itemSlots.forEach((slot, idx) => {
                if (idx < items.length) {
                    const itemKey = items[idx];
                    const weapon = weaponConfig[itemKey];
                    if (weapon && weapon.image) {
                        const img = scene.add.image(slot.x + slot.width / 2, slot.y + slot.height / 2, itemKey)
                            .setScale(0.5)
                            .setScrollFactor(0)
                            .setDepth(10001);
                        scene.itemImages.push(img);
                    }
                }
            });
        },

        updateMoveButton: function(scene) {
            const { COLORS } = window.gameConfig;
            const button = scene.buttons['andar'];
            if (!button) return;

            if (scene.actionMode === 'move') {
                button.rect.setFillStyle(COLORS.BUTTON_ACTIVE);
                button.iconText.setColor(COLORS.BUTTON_TEXT_ACTIVE);
                button.labelText.setColor(COLORS.BUTTON_TEXT_ACTIVE);
            } else {
                button.rect.setFillStyle(COLORS.BUTTON_INACTIVE);
                button.iconText.setColor(COLORS.BUTTON_TEXT_INACTIVE);
                button.labelText.setColor(COLORS.BUTTON_TEXT_INACTIVE);
            }
        },

        updateShootButton: function(scene) {
            const { COLORS } = window.gameConfig;
            const button = scene.buttons['atirar'];
            if (!button) return;

            if (scene.actionMode === 'shoot') {
                button.rect.setFillStyle(COLORS.BUTTON_ACTIVE);
                button.iconText.setColor(COLORS.BUTTON_TEXT_ACTIVE);
                button.labelText.setColor(COLORS.BUTTON_TEXT_ACTIVE);
            } else {
                button.rect.setFillStyle(COLORS.BUTTON_INACTIVE);
                button.iconText.setColor(COLORS.BUTTON_TEXT_INACTIVE);
                button.labelText.setColor(COLORS.BUTTON_TEXT_INACTIVE);
            }
        },

        enableButton: function(scene, key, enabled) {
            const button = scene.buttons[key];
            if (!button) return;

            button.rect.setInteractive(enabled);
            const alpha = enabled ? 1 : 0.5;
            button.rect.setAlpha(alpha);
            button.iconText.setAlpha(alpha);
            button.labelText.setAlpha(alpha);
        },

        toggleButtonState: function(scene, key, isActive) {
            const { COLORS } = window.gameConfig;
            const button = scene.buttons[key];
            if (!button) return;

            button.rect.setFillStyle(isActive ? COLORS.BUTTON_ACTIVE : COLORS.BUTTON_INACTIVE);
            button.iconText.setColor(isActive ? COLORS.BUTTON_TEXT_ACTIVE : COLORS.BUTTON_TEXT_INACTIVE);
            button.labelText.setColor(isActive ? COLORS.BUTTON_TEXT_ACTIVE : COLORS.BUTTON_TEXT_INACTIVE);
        },

        updateButtonsState: function(scene, actionMode) {
            const { COLORS } = window.gameConfig;

            // Reset all
            Object.values(scene.buttons).forEach(btn => {
                btn.rect.setFillStyle(COLORS.BUTTON_INACTIVE);
                btn.iconText.setColor(COLORS.BUTTON_TEXT_INACTIVE);
                btn.labelText.setColor(COLORS.BUTTON_TEXT_INACTIVE);
            });

            // Activate the selected
            if (actionMode && scene.buttons[actionMode]) {
                scene.buttons[actionMode].rect.setFillStyle(COLORS.BUTTON_ACTIVE);
                scene.buttons[actionMode].iconText.setColor(COLORS.BUTTON_TEXT_ACTIVE);
                scene.buttons[actionMode].labelText.setColor(COLORS.BUTTON_TEXT_ACTIVE);
            }
        },

        updateStatus: function(scene, text) {
            this.showNotification(scene, text);
        },

        showNotification: function(scene, text) {
            const notification = scene.add.text(scene.scale.width / 2, 50, text, {
                fontSize: '20px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2,
                fontStyle: 'bold',
                align: 'center'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(10010);

            scene.tweens.add({
                targets: notification,
                alpha: 0,
                duration: 1000,
                onComplete: () => notification.destroy()
            });
        }
    };

})();