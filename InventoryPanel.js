export default class InventoryPanel {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
        this.maxTeamSlots = 10;
        
        this.staticElements = []; // Elementos fixos (Fundo, Título, etc)
        this.dynamicElements = []; // Elementos dinâmicos (Itens, Textos variáveis)
        
        this.playerDropZone = null;
        this.quickAccessDropZone = null;
        this.teamDropZone = null;
        this.tooltip = null;
        this.isDraggingItem = false;
        this.lastSelectedUnit = null; // Rastreia a unidade atual para atualização automática
        this.mode = 'inventory'; // 'inventory' ou 'character'
        this.blocker = null;
    }  

    get teamInventory() {
        return (this.scene.teamLevelManager && this.scene.teamLevelManager.inventory) ? this.scene.teamLevelManager.inventory : [];
    }

    create() {
        // Configurações de Layout
        const width = 420; // 600 * 0.7
        const height = 385; // 550 * 0.7
        const cx = this.scene.scale.width / 2;
        const cy = this.scene.scale.height / 2;
        const depth = 10020; // Profundidade base
        const { width: screenWidth, height: screenHeight } = this.scene.scale;

        // Blocker
        this.blocker = this.scene.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x000000, 0.01)
            .setScrollFactor(0)
            .setDepth(10019) // Just below panel (10020)
            .setInteractive();

        this.blocker.on('pointerdown', () => {
            if (this.isVisible) this.scene.handleButtonClick('inventory');
        });
        
        this.staticElements.push(this.blocker);

        // 1. Fundo (Adicionado diretamente à cena)
        const bg = this.scene.add.rectangle(cx, cy, width, height, 0x000000, 0.9)
            .setStrokeStyle(2, 0x00ff00)
            .setScrollFactor(0)
            .setDepth(depth)
            .setInteractive(); // Bloqueia cliques atrás
        
        bg.on('pointerdown', (p, x, y, event) => { if (event && event.stopPropagation) event.stopPropagation(); });
        this.staticElements.push(bg);

        // 2. Título
        const titleBg = this.scene.add.rectangle(cx, cy - height/2 + 18, width, 35, 0x002200, 0.9)
            .setScrollFactor(0).setDepth(depth + 1);
        const title = this.scene.add.text(cx, cy - height/2 + 18, this.scene.languageManager.get('inventory_management_title'), {
            fontSize: '14px', color: '#00ff00', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2);
        this.staticElements.push(titleBg, title);

        // --- Zonas de Drop Visuais (Feedback) ---
        // Zona da Mochila (Topo)
        this.playerDropZone = this.scene.add.rectangle(cx, cy - 105, 336, 84, 0x000000, 0)
            .setScrollFactor(0).setDepth(depth + 1).setVisible(false);
        // Zona de Acesso Rápido (Meio)
        this.quickAccessDropZone = this.scene.add.rectangle(cx, cy, 336, 70, 0x000000, 0)
            .setScrollFactor(0).setDepth(depth + 1).setVisible(false);
        // Zona do Time (Baixo)
        this.teamDropZone = this.scene.add.rectangle(cx, cy + 112, 336, 140, 0x000000, 0)
            .setScrollFactor(0).setDepth(depth + 1).setVisible(false);
        this.staticElements.push(this.playerDropZone, this.quickAccessDropZone, this.teamDropZone);

        // Texto de rodapé (Instrução)
        const footer = this.scene.add.text(cx, cy + height/2 - 38, this.scene.languageManager.get('inventory_footer_instruction'), {
            fontSize: '9px', color: '#666666', fontStyle: 'italic'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2);
        this.staticElements.push(footer);

        // Botão Fechar
        const closeBtn = this.scene.add.rectangle(cx + 50, cy + height/2 - 18, 70, 21, 0x330000)
            .setStrokeStyle(1, 0xff0000)
            .setScrollFactor(0)
            .setDepth(depth + 2)
            .setInteractive({ useHandCursor: true });

        const closeText = this.scene.add.text(cx + 50, cy + height/2 - 18, this.scene.languageManager.get('options_close'), {
            fontSize: '10px', color: '#ff0000', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3);

        closeBtn.on('pointerdown', () => this.scene.handleButtonClick('inventory'));
        closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x550000));
        closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x330000));

        this.staticElements.push(closeBtn, closeText);

        // --- Botão de Alternar Modo (STATUS / INVENTÁRIO) ---
        const toggleBtnX = cx - 50; 
        const toggleBtnY = cy + height/2 - 18;
        
        const toggleBtn = this.scene.add.rectangle(toggleBtnX, toggleBtnY, 80, 21, 0x333300)
            .setStrokeStyle(1, 0xffff00)
            .setScrollFactor(0).setDepth(depth + 2)
            .setInteractive({ useHandCursor: true });
            
        const toggleText = this.scene.add.text(toggleBtnX, toggleBtnY, this.scene.languageManager.get('inventory_toggle_status'), {
            fontSize: '10px', color: '#ffff00', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3);
        
        toggleBtn.on('pointerdown', () => {
            this.mode = (this.mode === 'inventory') ? 'character' : 'inventory';
            toggleText.setText(this.mode === 'inventory' ? this.scene.languageManager.get('inventory_toggle_status') : this.scene.languageManager.get('inventory_toggle_inventory'));
            this.updateContent();
        });
        
        this.staticElements.push(toggleBtn, toggleText);

        // Cria o Tooltip (inicialmente invisível)
        this.createTooltip(depth + 100);

        // Estado inicial
        this.setVisible(false);
    }

    setVisible(visible) {
        this.staticElements.forEach(el => el.setVisible(visible));
        this.dynamicElements.forEach(el => el.setVisible(visible));
        
        if (!visible) {
            if (this.tooltip) this.tooltip.setVisible(false);
            if (this.playerDropZone) this.playerDropZone.setVisible(false);
            if (this.quickAccessDropZone) this.quickAccessDropZone.setVisible(false);
            if (this.teamDropZone) this.teamDropZone.setVisible(false);
        }
    }

    toggle() {
        this.isVisible = !this.isVisible;
        
        if (this.isVisible) {
            this.updateContent();
            this.hideTooltip(); // Garante que comece escondido
        } else {
            if (this.scene.uiManager) {
                this.scene.uiManager.toggleButtonState('inventory', false);
            }
        }
        
        this.setVisible(this.isVisible);
        return this.isVisible;
    }

    updateContent() {
        // Limpa elementos dinâmicos anteriores
        this.dynamicElements.forEach(el => el.destroy());
        this.dynamicElements = [];

        const selectedUnits = (this.scene.unitController && this.scene.unitController.selectedUnits) 
            ? this.scene.unitController.selectedUnits 
            : [];
            
        const cx = this.scene.scale.width / 2;
        const cy = this.scene.scale.height / 2;
        const depth = 10020;

        if (selectedUnits.length !== 1) {
            this.renderTeamView(cx, cy, depth);
            this.lastSelectedUnit = null; // Reseta rastreamento
            return;
        }

        const unit = selectedUnits[0];
        this.lastSelectedUnit = unit; // Atualiza a unidade rastreada

        // Garante a regra: Acesso Rápido (0-3) só com itens de ação; o resto fica na Mochila
        if (unit && unit.inventory) window.gameConfig.normalizeInventory(unit.inventory);
        
        // --- 1. Imagem do Jogador (Esquerda) ---
        const leftX = cx - 140;
        const topY = cy - 105;
        
        // Botão GERAL (Voltar para visão de time)
        const generalBtn = this.scene.add.rectangle(leftX, topY - 65, 60, 18, 0x222222)
            .setStrokeStyle(1, 0x00ff00)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0).setDepth(depth + 3);
            
        const generalText = this.scene.add.text(leftX, topY - 65, this.scene.languageManager.get('inventory_general_button'), {
            fontSize: '9px', color: '#00ff00', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 4);

        generalBtn.on('pointerdown', () => this.scene.handleButtonClick('todos'));
        generalBtn.on('pointerover', () => generalBtn.setFillStyle(0x444444));
        generalBtn.on('pointerout', () => generalBtn.setFillStyle(0x222222));

        this.dynamicElements.push(generalBtn, generalText);

        // Tenta achar a face correta baseada no índice do jogador
        let faceKey = 'player_face_1';
        if (unit.typeConfig && unit.typeConfig.textureKey) {
            const match = unit.typeConfig.textureKey.match(/player_(\d+)/);
            if (match) {
                faceKey = `player_face_${match[1]}`;
            }
        }
        const texture = this.scene.textures.exists(faceKey) ? faceKey : unit.typeConfig.textureKey;

        const faceBg = this.scene.add.rectangle(leftX, topY, 98, 98, 0x222222)
            .setStrokeStyle(1, 0x666666).setScrollFactor(0).setDepth(depth + 3);
        const face = this.scene.add.image(leftX, topY, texture)
            .setScrollFactor(0).setDepth(depth + 4)
            .setInteractive({ useHandCursor: true });
        
        // Tooltip no retrato com a arma equipada
        face.on('pointerover', () => {
            if (unit.selectedWeapon) {
                this.showTooltip(leftX, topY, unit.selectedWeapon);
            } else {
                this.showTooltipText(leftX, topY, this.scene.languageManager.get('inventory_no_weapon'), this.scene.languageManager.get('inventory_no_weapon_desc'));
            }
        });
        face.on('pointerout', () => this.hideTooltip());

        // Ajusta escala da imagem
        const maxFaceSize = 91;
        const faceScale = Math.min(maxFaceSize / face.width, maxFaceSize / face.height);
        face.setScale(faceScale);

        const nameText = this.scene.add.text(leftX, topY + 56, unit.name || "Soldado", {
            fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 4);

        this.dynamicElements.push(faceBg, face, nameText);

        // --- 1.5. Arma Equipada (Visualização) ---
        if (unit.selectedWeapon) {
            const wKey = unit.selectedWeapon;
            if (this.scene.textures.exists(wKey)) {
                const wBg = this.scene.add.rectangle(leftX, topY + 91, 98, 35, 0x222222)
                    .setStrokeStyle(1, 0x00ff00).setScrollFactor(0).setDepth(depth + 3)
                    .setInteractive({ useHandCursor: true });
                
                const wLabel = this.scene.add.text(leftX, topY + 77, this.scene.languageManager.get('inventory_equipped'), {
                    fontSize: '8px', color: '#00ff00', fontStyle: 'bold'
                }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 4);

                const wImg = this.scene.add.image(leftX, topY + 94, wKey)
                    .setScrollFactor(0).setDepth(depth + 4)
                    .setInteractive({ useHandCursor: true });
                
                const scale = Math.min(91 / wImg.width, 28 / wImg.height);
                wImg.setScale(scale);

                // Lógica de Desequipar e Tooltip
                const unequipAction = () => this.unequipWeapon(unit);
                const showWeaponTooltip = () => this.showTooltip(leftX, topY + 94, wKey);

                wBg.on('pointerdown', unequipAction);
                wImg.on('pointerdown', unequipAction);

                wBg.on('pointerover', () => { 
                    wBg.setStrokeStyle(2, 0xff0000); // Vermelho para indicar remoção
                    showWeaponTooltip(); 
                });
                wBg.on('pointerout', () => { wBg.setStrokeStyle(1, 0x00ff00); this.hideTooltip(); });
                wImg.on('pointerover', showWeaponTooltip);
                wImg.on('pointerout', () => this.hideTooltip());

                this.dynamicElements.push(wBg, wLabel, wImg);
            }
        }

        // --- 2. Mochila do Jogador (Direita) ---
        const rightX = cx + 56;
        const backpackLabel = this.scene.add.text(rightX, topY - 46, this.scene.languageManager.get('inventory_backpack'), {
            fontSize: '10px', color: '#00ff00'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3);
        this.dynamicElements.push(backpackLabel);

        const slotSize = 35;
        const padding = 4;
        const cols = 4;
        
        // Separa itens: 0-3 são Acesso Rápido, 4+ são Mochila
        const allItems = unit.inventory || [];
        
        // --- LÓGICA CORRIGIDA: Baseada em Índices (0-3 = Quick, 4+ = Backpack) ---
        // Garante que o array tenha pelo menos 4 slots para a divisão correta
        const inventoryFull = [...allItems];
        while (inventoryFull.length < 4) inventoryFull.push(null);

        const backpackRaw = inventoryFull.slice(4);
        
        // Agrupa itens da mochila para exibição empilhada
        const backpackUniqueItems = [];
        const backpackItemCounts = {};
        const backpackItemIndices = {}; // Para rastrear o índice do primeiro item do grupo

        backpackRaw.forEach((item, index) => {
            if (item) { // Ignora itens nulos (placeholders)
                if (!backpackItemCounts[item]) {
                    backpackItemCounts[item] = 0;
                    backpackUniqueItems.push(item);
                    // Salva o índice absoluto (4 + index relativo)
                    backpackItemIndices[item] = 4 + index;
                }
                backpackItemCounts[item]++;
            }
        });

        // Garante pelo menos 8 slots visuais ou o tamanho do inventário
        const playerSlotsCount = Math.max(8, backpackUniqueItems.length + (4 - backpackUniqueItems.length % 4)); 

        for (let i = 0; i < playerSlotsCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const sx = rightX + (col - (cols-1)/2) * (slotSize + padding);
            const sy = topY - 18 + row * (slotSize + padding);

            const slotBg = this.scene.add.rectangle(sx, sy, slotSize, slotSize, 0x333333)
                .setStrokeStyle(1, 0x666666)
                .setInteractive({ useHandCursor: true })
                .setScrollFactor(0).setDepth(depth + 3);
            this.dynamicElements.push(slotBg);

            if (i < backpackUniqueItems.length) {
                const itemKey = backpackUniqueItems[i];
                const count = backpackItemCounts[itemKey];

                if (this.scene.textures.exists(itemKey)) {
                    const img = this.scene.add.image(sx, sy, itemKey)
                        .setScrollFactor(0).setDepth(depth + 4);
                    const scale = Math.min((slotSize - 3) / img.width, (slotSize - 3) / img.height);
                    img.setScale(scale);
                    this.dynamicElements.push(img);

                    // Encontra o índice real do primeiro item deste tipo na mochila
                    const originalIndex = backpackItemIndices[itemKey];

                    // Configura Drag and Drop
                    img.setInteractive({ cursor: 'pointer' });
                    this.scene.input.setDraggable(img);
                    img.setData({ source: 'player_backpack', index: originalIndex, originX: sx, originY: sy, originalScale: scale });
                    this.setupDragEvents(img, unit);

                    // Eventos de Tooltip
                    img.on('pointerover', () => this.showTooltip(sx, sy, itemKey));
                    img.on('pointerout', () => this.hideTooltip());

                    // Contador
                    if (count > 1) {
                        const countText = this.scene.add.text(sx + slotSize / 2 - 2, sy + slotSize / 2 - 2, count.toString(), {
                            fontSize: '10px', fontFamily: 'Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
                        }).setOrigin(1, 1).setScrollFactor(0).setDepth(depth + 5);
                        this.dynamicElements.push(countText);
                    }
                }
                
                // Efeito visual no slot (apenas hover)
                slotBg.on('pointerover', () => slotBg.setStrokeStyle(2, 0x00ffff));
                slotBg.on('pointerout', () => slotBg.setStrokeStyle(1, 0x666666));
            }
        }

        // --- SEPARAÇÃO DE MODOS ---
        if (this.mode === 'character') {
            this.renderCharacterMode(unit, cx, cy, depth);
            return; // Encerra aqui para não desenhar Quick Access e Team
        }

        // --- MODO INVENTÁRIO (Padrão) ---

        // --- CÁLCULO DE POSIÇÃO VERTICAL ---
        const lastBackpackRow = Math.floor((playerSlotsCount - 1) / cols);
        const lastBackpackSlotY = topY - 28 + lastBackpackRow * (slotSize + padding);
        const backpackSectionBottom = lastBackpackSlotY + slotSize / 2;

        // --- 2.5. Acesso Rápido (Meio) ---
        // NOVA LÓGICA: Agrupa itens também no acesso rápido para permitir stacks visuais
        const quickAccessStacks = [];
        if (inventoryFull.length > 0) {
            // Pega apenas os itens que estão na faixa de acesso rápido (índices 0-3 do array original, se existirem)
            // Mas como queremos visualizar stacks, vamos processar os primeiros itens do inventário real
            // A lógica aqui é: Os primeiros grupos de itens do inventário são o Acesso Rápido.
            
            // Vamos simplificar: Visualiza os primeiros 4 grupos de itens do inventário como Acesso Rápido
            // Isso alinha com a lógica de "Empilhar no início"
        }

        // Recalcula stacks para o inventário inteiro para renderizar Quick Access corretamente
        // (Reutilizando a lógica de backpackUniqueItems mas para o início)
        
        const quickSlotsY = backpackSectionBottom + 70;
        const quickLabelY = quickSlotsY - 33;
        const quickLabel = this.scene.add.text(rightX, quickLabelY, this.scene.languageManager.get('inventory_quick_access'), {
            fontSize: '10px', color: '#ffff00'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3);
        this.dynamicElements.push(quickLabel);

        // Processa o inventário para criar stacks visuais para os primeiros 4 slots
        const quickAccessDisplay = [];
        let currentInvIndex = 0;
        
        for (let i = 0; i < 4; i++) {
            if (currentInvIndex < unit.inventory.length) {
                const key = unit.inventory[currentInvIndex];
                if (key) {
                    // Conta quantos desse item tem consecutivamente (Stack)
                    let count = 0;
                    let tempIndex = currentInvIndex;
                    while (tempIndex < unit.inventory.length && unit.inventory[tempIndex] === key) {
                        count++;
                        tempIndex++;
                    }
                    quickAccessDisplay.push({ key, count, index: currentInvIndex });
                    currentInvIndex += count; // Pula os itens já contados
                } else {
                    // Se for null (espaço vazio), conta como 1 slot vazio
                    quickAccessDisplay.push({ key: null, count: 1, index: currentInvIndex });
                    currentInvIndex++;
                }
            } else {
                quickAccessDisplay.push(null);
            }
        }

        const quickStartX = rightX;
        
        for (let i = 0; i < 4; i++) {
            const sx = quickStartX + (i - 1.5) * (slotSize + padding);
            const sy = quickSlotsY;

            const slotBg = this.scene.add.rectangle(sx, sy, slotSize, slotSize, 0x444400)
                .setStrokeStyle(1, 0xffff00)
                .setInteractive({ useHandCursor: true })
                .setScrollFactor(0).setDepth(depth + 3);
            
            // Efeito visual no slot (apenas hover)
            slotBg.on('pointerover', () => slotBg.setStrokeStyle(2, 0x00ffff));
            slotBg.on('pointerout', () => slotBg.setStrokeStyle(1, 0xffff00));

            this.dynamicElements.push(slotBg);

            const stackData = quickAccessDisplay[i];
            
            if (stackData && stackData.key) {
                const itemKey = stackData.key;
                const count = stackData.count;

                if (this.scene.textures.exists(itemKey)) {
                    const img = this.scene.add.image(sx, sy, itemKey)
                        .setScrollFactor(0).setDepth(depth + 4);
                    const scale = Math.min((slotSize - 3) / img.width, (slotSize - 3) / img.height);
                    img.setScale(scale);
                    this.dynamicElements.push(img);

                    // Usa o índice real de início do stack
                    const originalIndex = stackData.index;

                    img.setInteractive({ cursor: 'pointer' });
                    this.scene.input.setDraggable(img);
                    img.setData({ source: 'player_quick', index: originalIndex, originX: sx, originY: sy, originalScale: scale });
                    this.setupDragEvents(img, unit);

                    img.on('pointerover', () => this.showTooltip(sx, sy, itemKey));
                    img.on('pointerout', () => this.hideTooltip());

                    // Adiciona contador se for stack > 1
                    if (count > 1) {
                        const countText = this.scene.add.text(sx + slotSize / 2 - 2, sy + slotSize / 2 - 2, count.toString(), {
                            fontSize: '10px', fontFamily: 'Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
                        }).setOrigin(1, 1).setScrollFactor(0).setDepth(depth + 5);
                        this.dynamicElements.push(countText);
                    }
                }
            }
        }

        // --- 3. Inventário do Time (Baixo) --- teamlabel muda baixo
        const quickSectionBottom = quickSlotsY + slotSize / 2;
        const teamLabelY = quickSectionBottom + 33;
        const teamSlotsStartY = teamLabelY + 33;
        const teamLabel = this.scene.add.text(rightX, teamLabelY, this.scene.languageManager.get('inventory_team_inventory'), {
            fontSize: '10px', color: '#00ffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3);
        this.dynamicElements.push(teamLabel);

        // Agrupa e conta os itens do time para exibição empilhada
        const teamUniqueItems = [];
        const teamItemCounts = {};
        this.teamInventory.forEach(item => {
            if (item && !teamItemCounts[item]) {
                teamItemCounts[item] = 0;
                teamUniqueItems.push(item);
            }
            teamItemCounts[item]++;
        });

        const teamCols = 5;
        const teamStartX = rightX;

        for (let i = 0; i < this.maxTeamSlots; i++) {
            const col = i % teamCols;
            const row = Math.floor(i / teamCols);
            const sx = teamStartX + (col - (teamCols - 1) / 2) * (slotSize + padding);
            const sy = teamSlotsStartY + row * (slotSize + padding);

            const slotBg = this.scene.add.rectangle(sx, sy, slotSize, slotSize, 0x002233)
                .setStrokeStyle(1, 0x0088aa)
                .setInteractive({ useHandCursor: true })
                .setScrollFactor(0).setDepth(depth + 3);
            this.dynamicElements.push(slotBg);

            if (i < teamUniqueItems.length) {
                const itemKey = teamUniqueItems[i];
                const count = teamItemCounts[itemKey];

                if (this.scene.textures.exists(itemKey)) {
                    const img = this.scene.add.image(sx, sy, itemKey)
                        .setScrollFactor(0).setDepth(depth + 4);
                    const scale = Math.min((slotSize - 3) / img.width, (slotSize - 3) / img.height);
                    img.setScale(scale);
                    this.dynamicElements.push(img);

                    // Pega o índice do primeiro item do tipo para o drag-and-drop
                    const originalIndex = this.teamInventory.indexOf(itemKey);

                    // Configura Drag and Drop
                    img.setInteractive({ cursor: 'pointer' });
                    this.scene.input.setDraggable(img);
                    img.setData({ source: 'team', index: originalIndex, originX: sx, originY: sy, originalScale: scale });
                    this.setupDragEvents(img, unit);

                    // Eventos de Tooltip
                    img.on('pointerover', () => this.showTooltip(sx, sy, itemKey));
                    img.on('pointerout', () => this.hideTooltip());

                    // Mostra a contagem se for maior que 1
                    if (count > 1) {
                        const countText = this.scene.add.text(sx + slotSize / 2 - 2, sy + slotSize / 2 - 2, count.toString(), {
                            fontSize: '10px', fontFamily: 'Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
                        }).setOrigin(1, 1).setScrollFactor(0).setDepth(depth + 5);
                        this.dynamicElements.push(countText);
                    }
                }

                slotBg.on('pointerover', () => slotBg.setStrokeStyle(2, 0x00ffff));
                slotBg.on('pointerout', () => slotBg.setStrokeStyle(1, 0x0088aa));
            }
        }
    }

    renderTeamView(cx, cy, depth) {
        // Esconde zonas de drop pois é apenas visualização de status
        if (this.playerDropZone) this.playerDropZone.setVisible(false);
        if (this.quickAccessDropZone) this.quickAccessDropZone.setVisible(false);
        if (this.teamDropZone) this.teamDropZone.setVisible(false);

        const players = this.scene.players || [];
        const startY = cy - 120;
        const rowHeight = 55;
        const leftX = cx - 180;

        // Título
        const header = this.scene.add.text(cx, startY - 35, this.scene.languageManager.get('inventory_squad_status'), {
            fontSize: '10px', color: '#00ffff', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3);
        this.dynamicElements.push(header);

        players.forEach((player, index) => {
            const y = startY + index * rowHeight;
            
            // Fundo da linha
            const rowBg = this.scene.add.rectangle(cx, y, 400, 48, 0x111111)
                .setStrokeStyle(1, 0x444444)
                .setScrollFactor(0).setDepth(depth + 3)
                .setInteractive({ useHandCursor: true });

            // Clique para selecionar a unidade e ver detalhes
            rowBg.on('pointerdown', () => {
                if (this.scene.unitController) {
                    this.scene.unitController.deselectAll();
                    this.scene.unitController.selectUnit(player);
                }
            });

            // Efeito de Hover
            rowBg.on('pointerover', () => rowBg.setFillStyle(0x222222));
            rowBg.on('pointerout', () => rowBg.setFillStyle(0x111111));

            this.dynamicElements.push(rowBg);

            // 1. Retrato
            let faceKey = 'player_face_1';
            if (player.typeConfig && player.typeConfig.textureKey) {
                const match = player.typeConfig.textureKey.match(/player_(\d+)/);
                if (match) {
                    faceKey = `player_face_${match[1]}`;
                }
            }
            const texture = this.scene.textures.exists(faceKey) ? faceKey : (player.typeConfig ? player.typeConfig.textureKey : 'player_1');
            
            let face = null;
            if (this.scene.textures.exists(texture)) {
                face = this.scene.add.image(leftX, y, texture)
                    .setScrollFactor(0).setDepth(depth + 4);
                const scale = Math.min(40 / face.width, 40 / face.height);
                face.setScale(scale);
                this.dynamicElements.push(face);
            }

            // 2. Nome e Nível
            const nameText = this.scene.add.text(leftX + 30, y - 12, `${player.name || 'Soldado'} (Lv ${player.level || 1})`, {
                fontSize: '12px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth + 4);
            this.dynamicElements.push(nameText);

            // --- Ícone de Classe (Baseado em Equipamento) ---
            let classIconKey = 'pistol'; // Padrão
            if (player.inventory && player.inventory.includes('medkit')) {
                classIconKey = 'medkit'; // Médico
            } else if (player.selectedWeapon) {
                classIconKey = player.selectedWeapon; // Baseado na arma
            }

            if (this.scene.textures.exists(classIconKey)) {
                const classIcon = this.scene.add.image(nameText.x + nameText.width + 8, y - 12, classIconKey)
                    .setOrigin(0, 0.5)
                    .setScrollFactor(0)
                    .setDepth(depth + 4);
                
                const iconSize = 14;
                const scale = Math.min(iconSize / classIcon.width, iconSize / classIcon.height);
                classIcon.setScale(scale);
                this.dynamicElements.push(classIcon);
            }

            // 3. Barra de Vida
            const maxHp = player.maxHp || 100;
            const hp = Math.max(0, player.health || 0);
            const hpPercent = Phaser.Math.Clamp(hp / maxHp, 0, 1);
            
            const barWidth = 120;
            const barHeight = 6;
            const barX = leftX + 30;
            const barY = y + 8;

            const hpBg = this.scene.add.rectangle(barX, barY, barWidth, barHeight, 0x000000).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth + 4);
            const hpFill = this.scene.add.rectangle(barX, barY, barWidth * hpPercent, barHeight, 0x00ff00).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth + 5);
            
            const hpText = this.scene.add.text(barX + barWidth + 8, barY, `${Math.floor(hp)}/${maxHp}`, {
                fontSize: '10px', color: '#00ff00', fontFamily: 'Arial'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth + 4);

            this.dynamicElements.push(hpBg, hpFill, hpText);

            // 4. Insanidade
            const insanity = player.insanity || 0; 
            const insText = this.scene.add.text(cx + 100, y, this.scene.languageManager.get('lobby_clinic_insanity', { value: insanity.toFixed(0) }), {
                fontSize: '10px', color: '#ff00ff', fontFamily: 'Arial'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth + 4);
            this.dynamicElements.push(insText);
            
            // Status visual se morto
            if (hp <= 0) {
                rowBg.setAlpha(0.3);
                if (face) face.setTint(0x555555);
                nameText.setColor('#ff0000'); 
                nameText.setText(`${player.name} (${this.scene.languageManager.get('inventory_player_dead')})`);
            }
        });

        // Resumo do Time no rodapé
        if (this.scene.teamLevelManager) {
            const money = this.scene.teamLevelManager.money || 0;
            const teamLevel = this.scene.teamLevelManager.level || 1;
            
            const footerY = startY + players.length * rowHeight + 25;
            const footerText = this.scene.add.text(cx, footerY, `${this.scene.languageManager.get('inventory_squad_level_label')}: ${teamLevel}   |   ${this.scene.languageManager.get('inventory_squad_funds')}: ${money} B$`, {
                fontSize: '14px', color: '#ffff00', fontStyle: 'bold', fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 4);
            this.dynamicElements.push(footerText);
        }
    }

    renderCharacterMode(unit, cx, cy, depth) {
        // Esconde zonas de drop que não são usadas neste modo
        if (this.quickAccessDropZone) this.quickAccessDropZone.setVisible(false);
        if (this.teamDropZone) this.teamDropZone.setVisible(false);
        // Mantém a zona da mochila ativa se quiser permitir drop nela (opcional)

        // --- STATUS (Lado Esquerdo, abaixo da foto) ---
        const leftX = cx - 140;
        const startStatsY = cy + 20; // Abaixo da arma equipada
        
        const statConfig = [
            { key: 'level', labelKey: 'char_stat_level', helpKey: 'char_stat_level_desc' },
            { key: 'class', labelKey: 'char_stat_class', helpKey: 'char_stat_class_desc' },
            { key: 'xp', labelKey: 'char_stat_xp', helpKey: 'char_stat_xp_desc' },
            { key: 'health', labelKey: 'char_stat_health', helpKey: 'char_stat_health_desc' },
            { key: 'insanity', labelKey: 'char_stat_insanity', helpKey: 'char_stat_insanity_desc' },
            { key: 'armor', labelKey: 'char_stat_armor', helpKey: 'char_stat_armor_desc' },
            { key: 'attack', labelKey: 'char_stat_attack', helpKey: 'char_stat_attack_desc' },
            { key: 'speed', labelKey: 'char_stat_speed', helpKey: 'char_stat_speed_desc' }
        ];

        let currentY = startStatsY;
        const lineHeight = 16;

        // Dados para exibição
        const level = unit.level || 1;
        const xp = unit.xp || 0;
        const details = window.gameConfig.getXpDetails(xp);
        const health = Math.floor(unit.health || 0);
        const maxHealth = unit.maxHp || 100;
        const armor = unit.armor || 0;
        const insanity = unit.insanity || 0;
        
        // Cálculo de Ataque
        let attackDisplay = unit.attackStrength || 0;
        if (unit.selectedWeapon && window.gameConfig.WEAPONS[unit.selectedWeapon]) {
            const wStats = window.gameConfig.WEAPONS[unit.selectedWeapon];
            const dmgFactor = 0.15;
            const multiplier = 1 + (unit.level || 1) * dmgFactor;
            if (wStats.minDamage) {
                const min = Math.floor(wStats.minDamage * multiplier);
                const max = Math.floor(wStats.maxDamage * multiplier);
                attackDisplay = `${min}-${max}`;
            } else {
                attackDisplay = Math.floor((wStats.damage || 10) * multiplier);
            }
        }

        const values = {
            level: level,
            class: unit.class || 'N/A',
            xp: `${details.currentLevelXp}/${details.xpForNextLevel}`,
            health: `${health}/${maxHealth}`,
            insanity: `${insanity.toFixed(0)}%`,
            armor: armor,
            attack: attackDisplay,
            speed: unit.speed || 0
        };

        statConfig.forEach(cfg => {
            const label = this.scene.languageManager.get(cfg.labelKey);
            const txt = this.scene.add.text(leftX - 49, currentY, `${label}: ${values[cfg.key]}`, {
                fontSize: '11px', color: '#ffffff', fontFamily: 'Arial'
            }).setOrigin(0, 0).setScrollFactor(0).setDepth(depth + 3);
            
            // Tooltip simples
            txt.setInteractive({ useHandCursor: true });
            txt.on('pointerover', () => this.showTooltipText(txt.x + 100, txt.y, label, this.scene.languageManager.get(cfg.helpKey)));
            txt.on('pointerout', () => this.hideTooltip());

            this.dynamicElements.push(txt);
            currentY += lineHeight;
        });

        // --- SLOTS DE ARMADURA (Centro/Baixo) ---
        const armorKeys = [
            { key: 'helmet', labelKey: 'char_armor_boots' },
            { key: 'chest', labelKey: 'char_armor_chest' },
            { key: 'leg', labelKey: 'char_armor_pants' }
        ];

        const armorStartX = cx + 50;
        const armorY = cy + 50;
        const slotSize = 35;
        const padding = 10;

        armorKeys.forEach((item, index) => {
            const x = armorStartX + (index - 1) * (slotSize + padding + 20);
            const y = armorY;

            const label = this.scene.add.text(x, y - 25, this.scene.languageManager.get(item.labelKey), {
                fontSize: '9px', color: '#aaaaaa', fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 3);

            const slot = this.scene.add.rectangle(x, y, slotSize, slotSize, 0x222222)
                .setStrokeStyle(1, 0x888888).setInteractive({ useHandCursor: true })
                .setScrollFactor(0).setDepth(depth + 3).setOrigin(0.5);

            // Lógica de Desequipar
            slot.on('pointerdown', () => {
                this.unequipItem(unit, item.key);
            });

            this.dynamicElements.push(label, slot);

            // Mostra item equipado
            const equippedKey = unit.equippedArmors ? unit.equippedArmors[item.key] : null;
            if (equippedKey && this.scene.textures.exists(equippedKey)) {
                const img = this.scene.add.image(x, y, equippedKey)
                    .setScrollFactor(0).setDepth(depth + 4);
                
                // Escala
                const scale = Math.min((slotSize - 4) / img.width, (slotSize - 4) / img.height);
                img.setScale(scale);
                
                this.dynamicElements.push(img);

                // Tooltip do item equipado
                img.setInteractive({ useHandCursor: true });
                img.on('pointerover', () => this.showTooltip(x, y, equippedKey));
                img.on('pointerout', () => this.hideTooltip());
                // Clique na imagem também desequipa
                img.on('pointerdown', () => this.unequipItem(unit, item.key));
            }
        });
    }

    unequipItem(unit, slotKey) {
        const item = unit.equippedArmors ? unit.equippedArmors[slotKey] : null;
        if (item) {
            // Remove do slot
            unit.equippedArmors[slotKey] = null;
            // Devolve para o inventário (tenta empilhar ou novo slot)
            if (!unit.inventory) unit.inventory = [];
            
            // Garante padding dos slots 0-3
            while (unit.inventory.length < 4) {
                unit.inventory.push(null);
            }

            // Tenta encontrar um slot vazio na mochila (índice >= 4)
            let placed = false;
            for (let i = 4; i < unit.inventory.length; i++) {
                if (unit.inventory[i] === null) {
                    unit.inventory[i] = item;
                    placed = true;
                    break;
                }
            }

            // Se não achou slot vazio, adiciona ao final
            if (!placed) {
                unit.inventory.push(item);
            }
            
            // Recalcula atributos
            if (unit.recalculateArmor) unit.recalculateArmor();
            
            this.updateContent();
            if (this.scene.uiManager) this.scene.uiManager.updateItemSlots([unit]);
        }
    }

    setupDragEvents(img, unit) {
        // Feedback de clique (Pressionar)
        img.on('pointerdown', () => {
            img.setTint(0x999999); // Escurece ao clicar
        });

        img.on('pointerup', () => {
            // Limpa o tint se for apenas um clique rápido sem arrastar
            if (!this.isDraggingItem) {
                img.clearTint();
                // Lógica de Clique para Equipar
                const index = img.getData('index');
                const source = img.getData('source');
                // Só processa clique se for item do jogador
                if (source === 'player_backpack' || source === 'player_quick') {
                    this.handleItemClick(unit, index);
                }
            }
        });

        img.on('dragstart', (pointer, dragX, dragY) => {
            img.setDepth(10050); // Traz para frente de tudo
            this.isDraggingItem = true;
            this.hideTooltip(); // Esconde tooltip ao começar a arrastar
            
            // Feedback visual de "Pegar"
            const originalScale = img.getData('originalScale');
            if (originalScale) img.setScale(originalScale * 1.2); // Aumenta um pouco
            img.setTint(0xffff00); // Amarelo enquanto arrasta

        });

        img.on('drag', (pointer, dragX, dragY) => {
            img.x = dragX;
            img.y = dragY;
            
            // Verifica sobreposição usando coordenadas do mundo (Pointer vs Bounds do objeto com ScrollFactor 0)
        });

        img.on('dragend', (pointer) => {
            this.isDraggingItem = false;
            
            // Restaura visual
            const originalScale = img.getData('originalScale');
            if (originalScale) img.setScale(originalScale);
            img.clearTint();

            const source = img.getData('source');
            const index = img.getData('index');
            const moveOne = pointer.event.shiftKey; // Detecta se SHIFT está pressionado

            // Verifica se está no modo Character (onde algumas zonas estão ocultas)
            const isCharMode = (this.mode === 'character');

            if (source.startsWith('player') && !isCharMode && Phaser.Geom.Rectangle.ContainsPoint(this.teamDropZone.getBounds(), pointer)) {
                this.transferToTeam(unit, index, moveOne);
            } else if (source === 'team') { 
                if (!isCharMode && this.quickAccessDropZone && Phaser.Geom.Rectangle.ContainsPoint(this.quickAccessDropZone.getBounds(), pointer)) {
                    this.transferToPlayer(unit, index, true, moveOne); // True = Quick Access
                } else if (Phaser.Geom.Rectangle.ContainsPoint(this.playerDropZone.getBounds(), pointer)) {
                    this.transferToPlayer(unit, index, false, moveOne); // False = Backpack
                }
            } else if (source === 'player_backpack' && !isCharMode && this.quickAccessDropZone && Phaser.Geom.Rectangle.ContainsPoint(this.quickAccessDropZone.getBounds(), pointer)) {
                this.moveWithinPlayer(unit, index, true, moveOne); // Move to Quick
            } else if (source === 'player_quick' && Phaser.Geom.Rectangle.ContainsPoint(this.playerDropZone.getBounds(), pointer)) {
                this.moveWithinPlayer(unit, index, false, moveOne); // Move to Backpack
            } else {
                // Se soltou fora, volta para o lugar original
                img.x = img.getData('originX');
                img.y = img.getData('originY');
            }
        });
    }

    handleItemClick(unit, index) {
        const itemKey = unit.inventory[index];
        if (!itemKey) return;

        const armorConfig = window.gameConfig.ARMORS || {};
        const weaponConfig = window.gameConfig.WEAPONS || {};
        
        if (armorConfig[itemKey]) {
            // Equipa Armadura
            this.equipArmor(unit, index, itemKey, armorConfig[itemKey]);
        } else if (weaponConfig[itemKey]) {
            // Equipa Arma (apenas se tiver dano, ignora medkits/granadas aqui se quiser)
            if (weaponConfig[itemKey].minDamage || weaponConfig[itemKey].damage) {
                this.equipWeapon(unit, index, itemKey);
            }
        }
    }

    equipArmor(unit, index, itemKey, info) {
        const slotKey = info.type; // 'helmet', 'chest', 'leg'
        const oldArmor = unit.equippedArmors ? unit.equippedArmors[slotKey] : null;
        
        // Equipa o novo
        if (!unit.equippedArmors) unit.equippedArmors = {};
        unit.equippedArmors[slotKey] = itemKey;
        
        // Troca no inventário: Coloca a armadura velha no lugar da nova
        if (oldArmor) {
            unit.inventory[index] = oldArmor;
        } else {
            // Se não tinha nada equipado, remove o item do inventário
            if (index < 4) {
                unit.inventory[index] = null; // Mantém slot vazio se for acesso rápido
            } else {
                unit.inventory.splice(index, 1); // Remove se for mochila
            }
        }
        
        if (unit.recalculateArmor) unit.recalculateArmor();
        
        this.updateContent();
        if (this.scene.uiManager) this.scene.uiManager.updateItemSlots([unit]);
    }

    unequipWeapon(unit) {
        const weapon = unit.selectedWeapon;
        if (weapon) {
            unit.selectedWeapon = null;
            
            // Devolve para o inventário
            if (!unit.inventory) unit.inventory = [];
            
            // Garante padding dos slots 0-3
            while (unit.inventory.length < 4) {
                unit.inventory.push(null);
            }

            // Tenta encontrar um slot vazio na mochila (índice >= 4)
            let placed = false;
            for (let i = 4; i < unit.inventory.length; i++) {
                if (unit.inventory[i] === null) {
                    unit.inventory[i] = weapon;
                    placed = true;
                    break;
                }
            }

            // Se não achou slot vazio, adiciona ao final
            if (!placed) {
                unit.inventory.push(weapon);
            }
            
            this.updateContent();
            if (this.scene.uiManager) this.scene.uiManager.updateItemSlots([unit]);
        }
    }

    equipWeapon(unit, index, itemKey) {
        const oldWeapon = unit.selectedWeapon;
        
        // Equipa a nova arma
        unit.selectedWeapon = itemKey;
        
        // Troca no inventário
        if (oldWeapon) {
            unit.inventory[index] = oldWeapon;
        } else {
            if (index < 4) {
                unit.inventory[index] = null;
            } else {
                unit.inventory.splice(index, 1);
            }
        }
        
        this.updateContent();
        if (this.scene.uiManager) this.scene.uiManager.updateItemSlots([unit]);
    }

    transferToTeam(unit, itemIndex, moveOne = false) {
        const itemKey = unit.inventory[itemIndex];
        
        // Verifica capacidade baseada em pilhas (itens únicos)
        const uniqueItems = new Set(this.teamInventory.filter(i => i));
        if (!uniqueItems.has(itemKey) && uniqueItems.size >= this.maxTeamSlots) {
            if (this.scene.uiManager) this.scene.uiManager.updateStatus(this.scene.languageManager.get('inventory_team_full'));
            return;
        }
        
        if (moveOne) {
            // Move apenas 1 item
            unit.inventory.splice(itemIndex, 1);
            this.teamInventory.push(itemKey);
        } else {
            // Move a pilha toda (comportamento original)
            for (let i = unit.inventory.length - 1; i >= 0; i--) {
                if (unit.inventory[i] === itemKey) {
                    unit.inventory.splice(i, 1);
                    this.teamInventory.push(itemKey);
                }
            }
        }

        // Se removeu a arma equipada, reseta para pistola se tiver, ou null
        if (unit.selectedWeapon === itemKey && !unit.inventory.includes(itemKey)) {
            // Procura a próxima arma válida no inventário (ignora itens como medkit/capacete)
            const nextWeapon = unit.inventory.find(i => window.gameConfig.WEAPONS && window.gameConfig.WEAPONS[i]);
            unit.selectedWeapon = nextWeapon || null;
        }

        if (this.scene.teamLevelManager) this.scene.teamLevelManager.saveStats();

        this.updateContent();
        if (this.scene.uiManager) this.scene.uiManager.updateItemSlots([unit]); // Atualiza barra inferior
    }

    transferToPlayer(unit, itemIndex, toQuickAccess, moveOne = false) {
        const itemKey = this.teamInventory[itemIndex];

        // Regra: só itens de ação podem ir para o Acesso Rápido
        if (toQuickAccess && !window.gameConfig.isActionItem(itemKey)) {
            if (this.scene.uiManager) this.scene.uiManager.updateStatus(this.scene.languageManager.get('inventory_only_action_items'));
            this.updateContent(); // Devolve a imagem arrastada ao lugar
            return;
        }
        const isWeapon = window.gameConfig.WEAPONS[itemKey] && (window.gameConfig.WEAPONS[itemKey].minDamage !== undefined || window.gameConfig.WEAPONS[itemKey].damage !== undefined);
        
        if (isWeapon) {
            // Regra 1: Armas não podem ir para o Acesso Rápido
            if (toQuickAccess) {
                if (this.scene.uiManager) this.scene.uiManager.updateStatus(this.scene.languageManager.get('inventory_weapons_to_backpack'));
                return;
            }

            // Regra 2: Unicidade (Não pode ter se já estiver equipada ou na mochila)
            if (unit.selectedWeapon === itemKey || unit.inventory.includes(itemKey)) {
                if (this.scene.uiManager) this.scene.uiManager.updateStatus(this.scene.languageManager.get('inventory_unit_has_weapon'));
                return;
            }

            // Move APENAS 1 unidade da arma
            const realIndex = this.teamInventory.indexOf(itemKey);
            if (realIndex !== -1) {
                this.teamInventory.splice(realIndex, 1);
                
                // Garante que vá para a mochila (Slot 4+) preenchendo com null se necessário
                while (unit.inventory.length < 4) {
                    unit.inventory.push(null);
                }
                unit.inventory.push(itemKey);
            }
        } else if (moveOne) {
            // Move apenas 1 item (Consumível)
            this.teamInventory.splice(itemIndex, 1);
            if (toQuickAccess) {
                unit.inventory.unshift(itemKey);
            } else {
                // Garante padding para cair na mochila
                while (unit.inventory.length < 4) unit.inventory.push(null);
                unit.inventory.push(itemKey);
            }
        } else {
            // Itens normais (Move a pilha toda)
            let count = 0;
            for (let i = this.teamInventory.length - 1; i >= 0; i--) {
                if (this.teamInventory[i] === itemKey) {
                    this.teamInventory.splice(i, 1);
                    count++;
                }
            }
            
            if (toQuickAccess && count > 0) {
                // Coloca TODOS no início (Acesso Rápido com Stack)
                for (let k = 0; k < count; k++) unit.inventory.unshift(itemKey);
            } else {
                // Tudo para a Mochila
                for (let k = 0; k < count; k++) unit.inventory.push(itemKey);
            }
        }

        if (this.scene.teamLevelManager) this.scene.teamLevelManager.saveStats();

        this.updateContent();
        if (this.scene.uiManager) this.scene.uiManager.updateItemSlots([unit]); // Atualiza barra inferior
    }

    moveWithinPlayer(unit, index, toQuickAccess, moveOne = false) {
        const itemKey = unit.inventory[index];
        
        // Regra: só itens de ação podem ir para o Acesso Rápido (armas, armaduras etc. ficam na Mochila)
        if (toQuickAccess && !window.gameConfig.isActionItem(itemKey)) {
            if (this.scene.uiManager) this.scene.uiManager.updateStatus(this.scene.languageManager.get('inventory_only_action_items'));
            this.updateContent(); // Devolve a imagem arrastada ao lugar
            return;
        }

        if (toQuickAccess) {
            // Mochila -> Acesso Rápido: Move a pilha toda para o início
            if (moveOne) {
                unit.inventory.splice(index, 1);
                unit.inventory.unshift(itemKey);
            } else {
                // 1. Conta quantos tem
                const count = unit.inventory.filter(i => i === itemKey).length;
                
                // 2. Remove todos
                for (let i = unit.inventory.length - 1; i >= 0; i--) {
                    if (unit.inventory[i] === itemKey) unit.inventory.splice(i, 1);
                }
                
                // 3. Adiciona TODOS no início (Permite Stack no Acesso Rápido)
                for(let i=0; i<count; i++) unit.inventory.unshift(itemKey);
            }
        } else {
            // Acesso Rápido -> Mochila: Move a pilha toda para o final
            if (moveOne) {
                unit.inventory.splice(index, 1);
                while (unit.inventory.length < 4) unit.inventory.push(null);
                unit.inventory.push(itemKey);
            } else {
                // 1. Conta e remove todos
                const count = unit.inventory.filter(i => i === itemKey).length;
                for (let i = unit.inventory.length - 1; i >= 0; i--) {
                    if (unit.inventory[i] === itemKey) unit.inventory.splice(i, 1);
                }
                
                // 2. Garante padding para cair na mochila (Slot 4+)
                while (unit.inventory.length < 4) unit.inventory.push(null);
                
                // 3. Adiciona no final
                for(let i=0; i<count; i++) unit.inventory.push(itemKey);
            }
        }
        this.updateContent();
        if (this.scene.uiManager) this.scene.uiManager.updateItemSlots([unit]);
    }

    createTooltip(depth) {
        this.tooltip = this.scene.add.container(0, 0)
            .setVisible(false).setDepth(depth).setScrollFactor(0);

        const bg = this.scene.add.rectangle(0, 0, 220, 80, 0x000000, 0.95)
            .setStrokeStyle(1, 0xffff00)
            .setOrigin(0, 0);

        const title = this.scene.add.text(110, 10, '', {
            fontSize: '12px', fontStyle: 'bold', color: '#ffff00', fontFamily: 'Arial' 
        }).setOrigin(0.5, 0);

        const desc = this.scene.add.text(110, 30, '', {
            fontSize: '10px', color: '#cccccc', fontFamily: 'Arial', align: 'center', wordWrap: { width: 200 }
        }).setOrigin(0.5, 0);
        
        this.tooltip.add([bg, title, desc]);
        this.tooltip.bg = bg;
        this.tooltip.title = title;
        this.tooltip.desc = desc;
        
        // Tooltip não é adicionado a nenhum container pai, fica direto na cena
    }

    getItemInfo(key) {
        // 1. Verifica se é uma ARMA no config global
        if (window.gameConfig && window.gameConfig.WEAPONS && window.gameConfig.WEAPONS[key]) {
            const w = window.gameConfig.WEAPONS[key];
            let stats = [];
            
            const lang = this.scene.languageManager;

            if (w.minDamage !== undefined && w.maxDamage !== undefined) {
                stats.push(`${lang.get('char_stat_attack')}: ${w.minDamage}-${w.maxDamage}`);
            } else if (w.damage !== undefined) {
                stats.push(`${lang.get('char_stat_attack')}: ${w.damage}`);
            }
            
            if (w.range) {
                stats.push(`${lang.get('tooltip_range')}: ${w.range}`);
            }
            
            if (w.critChance) {
                stats.push(`${lang.get('tooltip_crit')}: ${(w.critChance * 100).toFixed(0)}%`);
            }

            let desc = stats.join('\n');
            const flavorKey = `weapon_desc_${key}`;
            const flavorText = lang.get(flavorKey);
            if (flavorText !== flavorKey) { // Check if translation exists
                desc += `\n\n${flavorText}`;
            }

            return { name: w.name || key.toUpperCase(), desc: desc };
        }

        // 2. Verifica se é ARMADURA no config global
        if (window.gameConfig && window.gameConfig.ARMORS && window.gameConfig.ARMORS[key]) { 
            const a = window.gameConfig.ARMORS[key];
            let desc = `${this.scene.languageManager.get('char_stat_armor')}: +${a.armor || 0}`;
            
            const flavorKey = `armor_desc_${key}`;
            const flavorText = this.scene.languageManager.get(flavorKey);
            if (flavorText !== flavorKey) {
                desc += `\n\n${flavorText}`;
            }
            
            return { name: a.name || key.toUpperCase(), desc: desc };
        }

        // 3. Itens diversos (Consumíveis, Missão)
        const name = this.scene.languageManager.get(`item_name_${key}`);
        const desc = this.scene.languageManager.get(`item_desc_${key}`);
        return { name: name !== `item_name_${key}` ? name : key.toUpperCase(), desc: desc !== `item_desc_${key}` ? desc : this.scene.languageManager.get('item_unknown_desc') };
    }

    showTooltipText(x, y, titleText, descText) {
        if (this.isDraggingItem) return;
        this.tooltip.title.setText(titleText);
        this.tooltip.desc.setText(descText);
        
        const h = 30 + this.tooltip.desc.height + 10;
        this.tooltip.bg.setSize(220, h);
        this.tooltip.setPosition(x - 110, y + 40);
        this.tooltip.setVisible(true);
    }

    showTooltip(x, y, key) {
        if (this.isDraggingItem) return;
        
        const info = this.getItemInfo(key);
        this.tooltip.title.setText(info.name);
        this.tooltip.desc.setText(info.desc);
        
        // Ajusta altura do fundo baseado no texto
        const h = 30 + this.tooltip.desc.height + 10;
        this.tooltip.bg.setSize(220, h);
        
        // Posiciona acima do item
        this.tooltip.setPosition(x - 110, y + 40);
        this.tooltip.setVisible(true);
        // this.container.bringToTop(this.tooltip); // Não necessário pois depth é alto
    }

    hideTooltip() {
        if (this.tooltip) this.tooltip.setVisible(false);
    }

    destroy() {
        this.staticElements.forEach(el => el.destroy());
        this.dynamicElements.forEach(el => el.destroy());
        if (this.tooltip) this.tooltip.destroy();
    }
    
    destroyAndRecreate() {
        const wasVisible = this.isVisible;
        this.destroy();
        this.create();
        if (wasVisible) {
            this.isVisible = false;
            this.toggle();
        }
    }
    
    update() {
        // Verifica se o painel está visível e se a seleção mudou
        if (this.isVisible) {
            const selectedUnits = (this.scene.unitController && this.scene.unitController.selectedUnits) 
                ? this.scene.unitController.selectedUnits 
                : [];
            
            const currentUnit = (selectedUnits.length === 1) ? selectedUnits[0] : null;
            
            // Se a unidade selecionada mudou desde a última atualização, recarrega o conteúdo
            if (this.lastSelectedUnit !== currentUnit) {
                this.updateContent();
            }

            // Atualiza visibilidade das zonas de drop baseado no modo
            if (this.mode === 'inventory') {
                if (this.playerDropZone) this.playerDropZone.setVisible(true);
                if (this.quickAccessDropZone) this.quickAccessDropZone.setVisible(true);
                if (this.teamDropZone) this.teamDropZone.setVisible(true);
            }
        }
    }
}
