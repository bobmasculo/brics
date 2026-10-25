export default class InformationManager {
    constructor(scene) {
        this.scene = scene;
        this.dialogContainer = null;
        this.dialogText = null;
        this.isInstanceMode = false; // false = Normal (Pode falar), true = Instance (Não pode falar)
        this.infoNpcs = [];
        this.currentTalkingNpc = null; // Rastreia com quem estamos falando
        this.dialogBg = null; // Referência para o fundo da caixa
        this.blocker = null; // Referência para o bloqueador de clique
        
        this.shopElements = []; // Elementos estáticos da loja
        this.shopItems = []; // Itens dinâmicos da loja
        this.footerButtons = []; // Botões do rodapé
        this.lastWarningTime = 0; // Controle de cooldown para avisos
        this.lastSocialModeWarningTime = 0;
    } 

    preload() {
        // Carrega os assets definidos em INFO_NPCS
        if (window.missionConfig && window.missionConfig.INFO_NPCS) {
            window.missionConfig.INFO_NPCS.forEach(npcConfig => {
                if (npcConfig.path && npcConfig.texture) {
                    this.scene.load.spritesheet(npcConfig.texture, npcConfig.path, {
                        frameWidth: npcConfig.width,
                        frameHeight: npcConfig.height
                    });
                }
            });
        }
    }
 
    create() {
        this.createDialogUI();
        this.createShopUI(); // Cria a UI da loja
        this.createAnimations(); // Cria as animações
        this.spawnInfoNPCs();
        this.updateCursorForMode(); // Define o cursor inicial para o modo normal ('pointer')

        // --- DEBUG GRAPHICS ---
        // Usa o mesmo objeto graphics do NPCManager para desenhar o debug de ambos.
        if (this.scene.npcManager && this.scene.npcManager.debugGraphics) {
            this.debugGraphics = this.scene.npcManager.debugGraphics;
        } else {
            this.debugGraphics = this.scene.add.graphics().setDepth(99999);
        }
        this.isDebugVisible = false;

        // --- TEXTURA DE SETA (TALK) ---
        if (!this.scene.textures.exists('arrow_marker_friend')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffff00, 1); // Amarelo
            graphics.fillTriangle(0, 0, 24, 0, 12, 24); // Triângulo apontando para baixo
            graphics.generateTexture('arrow_marker_friend', 24, 24);
            graphics.destroy();
        }

        // Fecha o diálogo com a tecla ENTER
        this.scene.input.keyboard.on('keydown-ENTER', () => {
            if (this.isShopOpen()) {
                this.hideShop();
            } else if (this.isDialogOpen()) {
                this.hideDialog();
            }
        });

    }

    createDialogUI() {
        const { width, height } = this.scene.scale;
        
        // 1. Blocker (Fundo invisível que captura cliques) - FORA DO CONTAINER
        // Alpha 0.01 para garantir que o input detecte (algumas versões ignoram alpha 0)
        this.blocker = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.01)
            .setOrigin(0, 0) // Canto superior esquerdo da tela
            .setScrollFactor(0)
            .setDepth(99999) // Logo abaixo do diálogo (que é 100000)
            .setInteractive({ useHandCursor: true })
            .setVisible(false); // Começa invisível

        // Container do Diálogo (Centralizado)
        this.dialogContainer = this.scene.add.container(width / 2, height / 2)
            .setScrollFactor(0)
            .setDepth(100000) // Aumentado para garantir prioridade máxima sobre qualquer UI
            .setVisible(false);

        // Fundo da caixa (Estilo Terminal)
        this.dialogBg = this.scene.add.rectangle(0, 0, 500, 200, 0x000000, 0.95)
            .setStrokeStyle(4, 0x00ff00) // Borda Verde Neon
            .setInteractive();
        
        // Texto da mensagem (Centralizado)
        this.dialogText = this.scene.add.text(0, 0, '', {
            fontSize: '20px', 
            fontFamily: 'Arial', 
            color: '#ffffff', 
            align: 'center', 
            wordWrap: { width: 460 }
        }).setOrigin(0.5);
        

        // O blocker fecha a janela se clicar fora dela
        this.blocker.on('pointerdown', () => {
            // Loja não fecha mais clicando fora (apenas ESC ou botão Fechar)
            if (this.isDialogOpen()) {
                this.hideDialog();
            }
        });
        // O fundo do diálogo também fecha a janela ao ser clicado
        this.dialogBg.on('pointerdown', () => {
            this.hideDialog();
        });

        // Adiciona apenas os elementos visuais ao container
        this.dialogContainer.add([this.dialogBg, this.dialogText]);
    }

    createShopUI() {
        const { width, height } = this.scene.scale;
        const cx = width / 2;
        const cy = height / 2;
        const panelWidth = 420; // 600 * 0.7
        const panelHeight = 350; // 500 * 0.7
        const depth = 100001;
        
        this.shopElements = [];
        this.shopItems = [];
        this.footerButtons = [];
        this.tabButtons = [];

        // Fundo da loja
        const bg = this.scene.add.rectangle(cx, cy, panelWidth, panelHeight, 0x000000, 0.95)
            .setStrokeStyle(4, 0x00ffff) // Borda Ciano
            .setScrollFactor(0)
            .setDepth(depth)
            .setInteractive();
        
        // Impede que o clique no fundo da loja feche a janela
        bg.on('pointerdown', (p, x, y, event) => {
             if (event && event.stopPropagation) event.stopPropagation();
        });

        const title = this.scene.add.text(cx, cy - panelHeight/2 + 25, this.scene.languageManager.get('shop_title'), {
            fontSize: '20px', fontFamily: 'Arial', color: '#00ffff', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

        // Instruções movidas para baixo
        const instruction = this.scene.add.text(cx, cy + panelHeight/2 - 55, this.scene.languageManager.get('shop_buy_instruction'), {
            fontSize: '11px', fontFamily: 'Arial', color: '#aaaaaa', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

        this.shopElements.push(bg, title, instruction);

        // Cria Abas
        const tabs = [
            { key: 'all', label: this.scene.languageManager.get('shop_tab_all') },
            { key: 'weapons', label: this.scene.languageManager.get('shop_tab_weapons') },
            { key: 'armors', label: this.scene.languageManager.get('shop_tab_armors') },
            { key: 'consumables', label: this.scene.languageManager.get('shop_tab_consumables') }
        ];
        const tabWidth = 84;
        const tabHeight = 24;
        const startX = cx - (tabs.length * tabWidth + (tabs.length - 1) * 10) / 2 + tabWidth / 2;
        const tabY = cy - panelHeight/2 + 60;

        tabs.forEach((tab, index) => {
            const x = startX + index * (tabWidth + 10);
            
            const btn = this.scene.add.rectangle(x, tabY, tabWidth, tabHeight, 0x003333)
                .setStrokeStyle(1, 0x00ffff)
                .setScrollFactor(0)
                .setDepth(depth + 1)
                .setInteractive({ useHandCursor: true });
            
            const txt = this.scene.add.text(x, tabY, tab.label, {
                fontSize: '10px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2);

            const onTabClick = (pointer, localX, localY, event) => {
                if (event && event.stopPropagation) event.stopPropagation();
                this.switchTab(tab.key);
            };

            btn.on('pointerdown', onTabClick);
            txt.setInteractive({ useHandCursor: true }); // Torna o texto clicável
            txt.on('pointerdown', onTabClick); // Associa a mesma função

            this.shopElements.push(btn, txt);
            this.tabButtons.push({ key: tab.key, btn, txt });
        });

        // Esconde tudo inicialmente
        this.shopElements.forEach(el => el.setVisible(false));
    }

    spawnInfoNPCs() {
        // Lê a configuração de INFO_NPCS do arquivo de missões
        if (window.missionConfig && window.missionConfig.INFO_NPCS) {
            window.missionConfig.INFO_NPCS.forEach(data => {
                // Usa uma textura padrão se não especificada
                const texture = data.texture || 'player_1'; 
                const npc = this.scene.physics.add.sprite(data.x, data.y, texture);
                npc.id = data.id; // Salva o ID no sprite para referência futura
                
                if (data.scale) npc.setScale(data.scale);
                
                // Configurações de Física e Jogo
                npc.setCollideWorldBounds(true);
                npc.body.moves = true; // Permite movimento
                npc.setImmovable(true); // Não é empurrado facilmente
                npc.hp = (data.hp !== undefined) ? data.hp : 100;
                npc.speed = (data.speed !== undefined) ? data.speed : 40;
                npc.waypoints = data.waypoints || [];
                npc.currentWaypointIndex = 0;
                npc.waypointStartTime = 0;
                npc.waypointTimeout = 0;

                // --- PATRULHA ALEATÓRIA (Fallback) ---
                npc.startX = data.x;
                npc.startY = data.y;
                npc.patrolRadius = data.patrolRadius || 150;
                npc.nextPatrolTime = 0;
                npc.patrolTarget = null;

                // --- SOMBRA ---
                npc.shadow = this.scene.add.ellipse(0, 0, 40, 20, 0x000000, 0.2)
                    .setVisible(this.scene.showShadows || false);
                
                const talkCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" style="font-size: 24px;"><text y="24">💬</text></svg>'), auto`;

                npc.setInteractive(); // Deixa interativo, mas o cursor é gerenciado dinamicamente
                npc.input.priorityID = 1000; // Garante prioridade de clique sobre os jogadores (que têm 0)
                
                // Ícone "!" flutuando sobre a cabeça
                const icon = this.scene.add.text(data.x, data.y - 60, '!', {
                    fontSize: '32px', color: '#ffff00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
                }).setOrigin(0.5).setDepth(npc.depth + 100);

                npc.on('pointerover', () => {
                    // No modo normal, mostra o cursor de fala sobre o NPC
                    if (!this.isInstanceMode) {
                        this.scene.input.setDefaultCursor(talkCursor);
                    } else {
                        this.scene.input.setDefaultCursor('not-allowed');
                        // Se estiver em modo agressivo, avisa que precisa mudar
                        const now = this.scene.time.now;
                        if (this.scene.showModeWarning && now > this.lastSocialModeWarningTime + 3000) {
                            this.scene.showModeWarning(this.scene.languageManager.get('warning_talk_needs_social_mode'), "#cfc551", false);
                            this.lastSocialModeWarningTime = now;
                        }
                    }
                });

                npc.on('pointerout', () => {
                    this.updateCursorForMode(); // Restaura o cursor padrão do modo atual
                });

                // Clique no NPC
                npc.on('pointerdown', () => {
                    this.handleNpcInteraction(data, npc);
                });

                // Guarda referência para update (depth sort)
                npc.infoIcon = icon;
                this.infoNpcs.push(npc);
            });
        }
    }

    createAnimations() {
        if (window.missionConfig && window.missionConfig.INFO_NPCS) {
            window.missionConfig.INFO_NPCS.forEach(data => {
                const key = data.texture;
                if (data.animationFrames) {
                    const { down, left, right, up, idle, idle_down, idle_left, idle_right, idle_up } = data.animationFrames;
                    const frameRate = 1;
                    if (down && !this.scene.anims.exists(`${key}_down`)) this.scene.anims.create({ key: `${key}_down`, frames: this.scene.anims.generateFrameNumbers(key, { frames: down }), frameRate, repeat: -1 });
                    if (left && !this.scene.anims.exists(`${key}_left`)) this.scene.anims.create({ key: `${key}_left`, frames: this.scene.anims.generateFrameNumbers(key, { frames: left }), frameRate, repeat: -1 });
                    if (right && !this.scene.anims.exists(`${key}_right`)) this.scene.anims.create({ key: `${key}_right`, frames: this.scene.anims.generateFrameNumbers(key, { frames: right }), frameRate, repeat: -1 });
                    if (up && !this.scene.anims.exists(`${key}_up`)) this.scene.anims.create({ key: `${key}_up`, frames: this.scene.anims.generateFrameNumbers(key, { frames: up }), frameRate, repeat: -1 });
                    if (idle && !this.scene.anims.exists(`${key}_idle`)) this.scene.anims.create({ key: `${key}_idle`, frames: this.scene.anims.generateFrameNumbers(key, { frames: idle }), frameRate, repeat: -1 });
                    if (idle_down && !this.scene.anims.exists(`${key}_idle_down`)) this.scene.anims.create({ key: `${key}_idle_down`, frames: this.scene.anims.generateFrameNumbers(key, { frames: idle_down }), frameRate, repeat: -1 });
                    if (idle_left && !this.scene.anims.exists(`${key}_idle_left`)) this.scene.anims.create({ key: `${key}_idle_left`, frames: this.scene.anims.generateFrameNumbers(key, { frames: idle_left }), frameRate, repeat: -1 });
                    if (idle_right && !this.scene.anims.exists(`${key}_idle_right`)) this.scene.anims.create({ key: `${key}_idle_right`, frames: this.scene.anims.generateFrameNumbers(key, { frames: idle_right }), frameRate, repeat: -1 });
                    if (idle_up && !this.scene.anims.exists(`${key}_idle_up`)) this.scene.anims.create({ key: `${key}_idle_up`, frames: this.scene.anims.generateFrameNumbers(key, { frames: idle_up }), frameRate, repeat: -1 });
                }
            });
        }
    }

    handleNpcInteraction(data, npc) {
        // Regra: Não pode interagir em modo furtivo
        if (this.scene.isStealthMode) { 
            if (this.scene.uiManager) this.scene.uiManager.updateStatus(this.scene.languageManager.get('warning_no_interaction_in_stealth'));
            return;
        }

        // Regra: Só pode falar na "Instance Normal" (isInstanceMode = false)
        if (this.isInstanceMode) { 
            if (this.scene.uiManager) this.scene.uiManager.updateStatus(this.scene.languageManager.get('warning_interaction_blocked_instance_mode'));
            return;
        }

        // Encontra o jogador mais próximo para interagir (receiver)
        let receiver = null;
        let minDist = 150; // Distância máxima de interação

        this.scene.players.forEach(p => {
            if (p.health > 0) {
                const d = Phaser.Math.Distance.Between(p.x, p.y, npc.x, npc.y);
                if (d < minDist) {
                    minDist = d;
                    receiver = p;
                }
            }
        });

        if (receiver) {
            // Remove o ícone "!" ao falar com o NPC
            if (npc.infoIcon) {
                npc.infoIcon.destroy();
                npc.infoIcon = null;
            }
            
            // --- Lógica de Dar Item ---
            if (data.giveItem && !npc.hasGivenItem) {
                // Adiciona ao inventário se não tiver
                if (!receiver.inventory.includes(data.giveItem)) {
                    receiver.inventory.push(data.giveItem);
                    npc.hasGivenItem = true;
                    
                    if (this.scene.uiManager) {
                        this.scene.uiManager.updateStatus(`${receiver.name || 'Soldado'} recebeu ${data.giveItem.toUpperCase()}`);
                        // Atualiza a UI se este jogador estiver selecionado
                        if (this.scene.unitController && this.scene.unitController.selectedUnits.includes(receiver)) {
                            this.scene.uiManager.updateItemSlots(this.scene.unitController.selectedUnits);
                        }
                        // Atualiza a lista de objetivos (para marcar o item como ☑️)
                        if (this.scene.missionManager) {
                            this.scene.missionManager.updateUI();
                        }
                    }
                }
            }

            // --- Lógica de Vendedor ---
            if (data.vendor) {
                // Se for vendedor, abre a loja. Passamos 'data' completo e o 'npc' para poder voltar ao diálogo.
                this.showShop(data, receiver, npc); 
                return;
            }

            this.startDialogue(data, npc);
        } else {
            // Aviso de distância com cooldown (1 segundo)
            const now = this.scene.time.now;
            if (now > this.lastWarningTime + 1000) {
                this.lastWarningTime = now; 
                if (this.scene.showBigWarning) { 
                    this.scene.showBigWarning(this.scene.languageManager.get('warning_get_closer_to_talk'));
                } else if (this.scene.uiManager) { 
                    this.scene.uiManager.updateStatus(this.scene.languageManager.get('warning_get_closer_to_talk_status'));
                }
            }
        }
    }

    startDialogue(data, npc) {
        // Verifica se existe uma mensagem de conclusão e se os objetivos foram cumpridos
        let messageToShow = data.message;
        
        if (this.scene.missionManager && 
            this.scene.missionManager.arePrimaryObjectivesMet && 
            this.scene.missionManager.arePrimaryObjectivesMet() && 
            data.completionMessage) {
            messageToShow = data.completionMessage;
        }
        
        // Translate if available
        if (this.scene.languageManager && messageToShow) {
            messageToShow = this.scene.languageManager.get(messageToShow);
        }

        this.showDialog(messageToShow);
        
        // Notifica o MissionManager sobre a interação com este NPC
        if (this.scene.missionManager) {
            this.scene.missionManager.onNpcTalked(data.id);
        }
        
        // Para o NPC
        if (npc) {
            npc.isTalking = true;
            if (npc.body) npc.body.setVelocity(0);
            this.currentTalkingNpc = npc;
        }
    }

    showDialog(text) {
        this.dialogText.setText(text);

        // Atualiza dimensões e posição para garantir que cubra a tela (caso tenha redimensionado)
        const { width, height } = this.scene.scale;
        this.dialogContainer.setPosition(width / 2, height / 2);
        this.dialogContainer.setDepth(100000); // Garante profundidade ao abrir
        
        // Atualiza e mostra o Blocker
        if (this.blocker) {
            this.blocker.setSize(width, height);
            // Atualiza a área de clique (HitArea) para o novo tamanho
            if (this.blocker.input) {
                this.blocker.input.hitArea.setTo(0, 0, width, height);
            }
            this.blocker.setVisible(true);
        }
        
        // Ajusta a altura do fundo automaticamente com base no texto
        if (this.dialogBg) {
            const padding = 60; // Margem interna (cima + baixo)
            const minHeight = 200;
            const newHeight = Math.max(minHeight, this.dialogText.height + padding);
            this.dialogBg.setSize(500, newHeight);
        }
        
        this.dialogContainer.setVisible(true);

        // Pausa o jogo enquanto o diálogo estiver aberto
        this.scene.isPaused = true;
        this.scene.physics.world.pause();
        this.scene.anims.pauseAll();
    }

    showShop(npcData, buyer, npc) {
        this.currentVendorData = npcData.vendor;
        this.currentBuyer = buyer;
        this.currentNpcData = npcData; 
        this.currentNpc = npc;
        this.currentTab = 'TODOS';

        // Atualiza botões de rodapé (Fechar/Falar)
        this.updateFooter();

        // Mostra elementos estáticos
        this.shopElements.forEach(el => el.setVisible(true)); 

        // Renderiza itens da aba padrão
        this.switchTab('TODOS');

        // Mostra blocker e container
        if (this.blocker) this.blocker.setVisible(true);

        // Pausa o jogo
        this.scene.isPaused = true;
        this.scene.physics.world.pause();
        this.scene.anims.pauseAll();
    }

    updateFooter() {
        // Limpa botões anteriores
        this.footerButtons.forEach(btn => btn.destroy());
        this.footerButtons = [];

        const { width, height } = this.scene.scale;
        const cx = width / 2;
        const cy = height / 2;
        const panelHeight = 350;
        const y = cy + panelHeight / 2 - 28;
        const depth = 100002;
        
        // Botão FECHAR
        const closeBtn = this.scene.add.text(cx, y, this.scene.languageManager.get('options_close'), {
            fontSize: '13px', fontFamily: 'Arial', color: '#ff0000', fontStyle: 'bold', backgroundColor: '#330000', padding: { x: 10, y: 6 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerdown', () => this.hideShop());
        this.footerButtons.push(closeBtn);

        // Botão FALAR (se disponível)
        if (this.currentNpcData && (this.currentNpcData.message || this.currentNpcData.completionMessage)) {
            closeBtn.setX(cx + 42); // Move Fechar para a direita
            
            const talkBtn = this.scene.add.text(cx - 42, y, this.scene.languageManager.get('shop_talk'), {
                fontSize: '13px', fontFamily: 'Arial', color: '#ffff00', fontStyle: 'bold', backgroundColor: '#333300', padding: { x: 10, y: 6 }
            }).setOrigin(0.5).setScrollFactor(0).setDepth(depth).setInteractive({ useHandCursor: true });

            talkBtn.on('pointerdown', () => {
                this.hideShop();
                this.startDialogue(this.currentNpcData, this.currentNpc);
            });

            this.footerButtons.push(talkBtn);
        } else {
            closeBtn.setX(cx); // Centraliza se for só Fechar
        }
    }

    switchTab(tabKey) {
        this.currentTab = tabKey;
        
        // Atualiza visual das abas
        this.tabButtons.forEach(tab => { 
            if (tab.key === tabKey) {
                tab.btn.setFillStyle(0x00ffff);
                tab.txt.setColor('#000000');
            } else {
                tab.btn.setFillStyle(0x003333);
                tab.txt.setColor('#ffffff');
            }
        });

        this.renderShopItems();
    }

    renderShopItems() {
        // Limpa itens anteriores
        this.shopItems.forEach(item => item.destroy());
        this.shopItems = [];

        const items = this.currentVendorData.items.filter(item => {
            if (this.currentTab === 'all') return true;
            
            const config = window.gameConfig.WEAPONS[item.key] || window.gameConfig.ARMORS[item.key] || {};
            const isWeapon = config.minDamage !== undefined || config.damage !== undefined;
            const isArmor = config.type && (config.type === 'helmet' || config.type === 'chest' || config.type === 'leg');
            
            if (this.currentTab === 'weapons') return isWeapon;
            if (this.currentTab === 'armors') return isArmor;
            if (this.currentTab === 'consumables') return !isWeapon && !isArmor;
            
            return true;
        });

        // Grid Layout
        const itemSize = 77;
        const padding = 11;
        const cols = 4;
        const totalW = cols * itemSize + (cols - 1) * padding;
        const { width, height } = this.scene.scale;
        const startX = (width / 2) - totalW / 2 + itemSize / 2;
        const startY = (height / 2) - 55;

        items.forEach((item, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (itemSize + padding);
            const y = startY + row * (itemSize + padding);

            this.createShopItem(x, y, item, itemSize);
        });
    }

    createShopItem(x, y, itemData, size) {
        const depth = 100002;
        const bg = this.scene.add.rectangle(x, y, size, size, 0x222222)
            .setStrokeStyle(1, 0x00aaaa)
            .setScrollFactor(0)
            .setDepth(depth)
            .setInteractive();
        
        // Garante que o clique no fundo do item não propague
        bg.on('pointerdown', (p, x, y, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
        });
        
        const itemConfig = window.gameConfig.WEAPONS[itemData.key] || window.gameConfig.ARMORS[itemData.key] || { name: itemData.key };
        
        const name = this.scene.add.text(x, y - size/2 + 10, itemConfig.name, {
            fontSize: '8px', fontFamily: 'Arial', color: '#ffffff', align: 'center', wordWrap: { width: size - 10 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

        let icon;
        if (this.scene.textures.exists(itemData.key)) {
            icon = this.scene.add.image(x, y, itemData.key);
            // Reduz a escala e sobe a posição para não cobrir o preço
            const scale = Math.min((size - 49) / icon.width, (size - 49) / icon.height);
            icon.setScale(scale).setScrollFactor(0).setDepth(depth + 1);
            icon.y -= 7; 
        }

        const price = this.scene.add.text(x, y + 14, `${itemData.price} B$`, {
            fontSize: '9px', fontFamily: 'Arial', color: '#ffff00'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

        // Verifica se tem dinheiro suficiente
        const teamMoney = this.scene.teamLevelManager ? this.scene.teamLevelManager.money : 0;
        const canAfford = teamMoney >= itemData.price;

        const btnColor = canAfford ? 0x004400 : 0x333333;
        const txtColor = canAfford ? '#00ff00' : '#888888';

        const buyBtn = this.scene.add.rectangle(x, y + size/2 - 10, size - 7, 14, btnColor)
            .setInteractive({ useHandCursor: canAfford });
        buyBtn.setScrollFactor(0).setDepth(depth + 1);

        const buyText = this.scene.add.text(x, y + size/2 - 10, this.scene.languageManager.get('shop_buy'), {
            fontSize: '8px', fontFamily: 'Arial', color: txtColor
        }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 2);

        if (canAfford) {
            buyBtn.on('pointerdown', (pointer, localX, localY, event) => {
                if (event && event.stopPropagation) event.stopPropagation();
                
                let quantity = 1;
                if (pointer.event.shiftKey) quantity = 5;
                if (pointer.event.ctrlKey) quantity = 10;

                this.buyItem(itemData.key, itemData.price, this.currentBuyer, quantity);
            });
        }
        
        bg.on('pointerover', () => bg.setStrokeStyle(2, 0xffffff));
        bg.on('pointerout', () => bg.setStrokeStyle(1, 0x00aaaa));

        const elements = [bg, name, price, buyBtn, buyText];
        if (icon) elements.push(icon);
        
        this.shopItems.push(...elements);
    }

    buyItem(itemKey, price, buyer, quantity = 1) {
        const teamManager = this.scene.teamLevelManager;

        if (teamManager) {
            const maxAffordable = Math.floor(teamManager.money / price);
            const actualQuantity = Math.min(quantity, maxAffordable);

            if (actualQuantity > 0) {
                let bought = 0;
                for (let i = 0; i < actualQuantity; i++) {
                    if (teamManager.addItem(itemKey)) {
                        bought++;
                    } else {
                        break; // Inventário cheio
                    }
                }
                
                if (bought > 0) {
                    teamManager.gainMoney(-(price * bought));
                    if (this.scene.uiManager) { 
                        this.scene.uiManager.updateStatus(this.scene.languageManager.get('status_bought_item', { count: bought, item: itemKey.toUpperCase() }));
                    }
                    this.renderShopItems();
                } else {
                    if (this.scene.uiManager) this.scene.uiManager.updateStatus(this.scene.languageManager.get('inventory_team_full'));
                    this.scene.cameras.main.shake(100, 0.005);
                }
            } else {
                if (this.scene.uiManager) this.scene.uiManager.updateStatus(this.scene.languageManager.get('warning_insufficient_funds'));
                this.scene.cameras.main.shake(100, 0.005);
            }
        }
    }

    hideShop(resumeGame = true) {
        this.hideDialog(resumeGame); // Reutiliza a lógica de fechar (unpause, esconder blocker, etc)
        this.shopElements.forEach(el => el.setVisible(false));
        this.shopItems.forEach(el => el.setVisible(false));
        this.footerButtons.forEach(el => el.setVisible(false));
    }

    isShopOpen() {
        return this.shopElements.length > 0 && this.shopElements[0].visible;
    }

    updateNpcIcon(npcId, text, color) {
        const npc = this.infoNpcs.find(n => n.id === npcId);
        if (npc && npc.infoIcon) {
            npc.infoIcon.setText(text);
            npc.infoIcon.setColor(color);
        }
    }

    hideDialog(resumeGame = true) {
        // Pequeno delay (50ms) para garantir que o UnitController detecte o diálogo como "aberto"
        // durante o clique atual, impedindo que o clique "vaze" para o mapa.
        this.scene.time.delayedCall(50, () => {
            if (this.dialogContainer) this.dialogContainer.setVisible(false);
            if (this.blocker) this.blocker.setVisible(false); // Esconde o blocker
            
            // Libera o NPC para voltar a andar
            if (this.currentTalkingNpc) {
                this.currentTalkingNpc.isTalking = false;
                this.currentTalkingNpc = null;
            }

            // Mudar para modo agressivo automaticamente ao fechar o diálogo
            if (!this.isInstanceMode) {
                if (this.scene.handleButtonClick) {
                    this.scene.handleButtonClick('instance');
                }
            }

            // Selecionar todos os membros do time ao fechar o diálogo
            if (this.scene.unitController) {
                this.scene.unitController.deselectAll();
                this.scene.unitController.toggleSelectAll();
            }

            // Resume o jogo
            if (resumeGame) {
                this.scene.isPaused = false;
                this.scene.physics.world.resume();
                this.scene.anims.resumeAll();
            }
        });

        // Garante que o cursor seja restaurado para o modo correto ao fechar
        this.updateCursorForMode();
    }

    isDialogOpen() {
        return this.dialogContainer && this.dialogContainer.visible;
    }

    toggleInstanceMode() {
        this.isInstanceMode = !this.isInstanceMode;
        this.updateCursorForMode();
        return this.isInstanceMode;
    }

    toggleShadows(visible) {
        this.infoNpcs.forEach(npc => {
            if (npc.shadow) npc.shadow.setVisible(visible);
        });
    }

    /**
     * Atualiza o cursor padrão da cena com base no modo de jogo atual.
     * - Modo Normal: 'pointer' (mão) para movimento.
     * - Modo Instância/Agressivo: 'crosshair' (mira) para ataque.
     */
    updateCursorForMode() {
        if (!this.scene || !this.scene.input) return;
        const newCursor = this.isInstanceMode ? 'default' : 'pointer';
        this.scene.input.setDefaultCursor(newCursor);
    }

    toggleDebug(forceState = null) {
        if (forceState !== null) {
            this.isDebugVisible = forceState;
        } else {
            this.isDebugVisible = !this.isDebugVisible;
        }
        
        // A limpeza dos gráficos é centralizada no NPCManager.update() para evitar conflitos.
        return this.isDebugVisible;
    }

    drawDebug(npc) {
        const g = this.debugGraphics;
        
        if (npc.waypoints && npc.waypoints.length > 0) {
            // Caminho completo (Ciano)
            g.lineStyle(1, 0x00ffff, 0.5);
            for (let i = 0; i < npc.waypoints.length; i++) {
                const p1 = npc.waypoints[i];
                const p2 = npc.waypoints[(i + 1) % npc.waypoints.length];
                g.strokeCircle(p1.x, p1.y, 3);
                g.lineBetween(p1.x, p1.y, p2.x, p2.y);
            }

            // Alvo atual (Verde)
            const target = npc.waypoints[npc.currentWaypointIndex];
            if (target) {
                g.lineStyle(2, 0x00ff00, 0.8);
                g.lineBetween(npc.x, npc.y, target.x, target.y);
                g.fillCircle(target.x, target.y, 4);
            }
        } else if (npc.patrolTarget) {
            // Patrulha (Magenta)
            g.lineStyle(2, 0xff00ff, 0.8);
            g.lineBetween(npc.x, npc.y, npc.patrolTarget.x, npc.patrolTarget.y);
            g.strokeCircle(npc.patrolTarget.x, npc.patrolTarget.y, 4);
        }
    }

    update(time, delta) {
        // A limpeza dos gráficos de debug é feita no NPCManager para centralizar a ação,
        // já que ambos os managers usam o mesmo objeto graphics.

        this.infoNpcs.forEach(npc => {
            if (!npc.active) return;

            // Só processa movimento se NÃO estiver falando
            if (!npc.isTalking) {
                // --- Movimento por Waypoints ---
                if (npc.waypoints && npc.waypoints.length > 0 && npc.speed > 0) {
                    const target = npc.waypoints[npc.currentWaypointIndex];
                    
                    // Move para o waypoint
                    this.scene.physics.moveTo(npc, target.x, target.y, npc.speed);

                    if (!npc.waypointStartTime) {
                        npc.waypointStartTime = time;
                        // Calcula timeout dinâmico baseado na distância e velocidade
                        const totalDist = Phaser.Math.Distance.Between(npc.x, npc.y, target.x, target.y);
                        const minTime = (totalDist / npc.speed) * 1000;
                        npc.waypointTimeout = minTime * 2 + 5000;
                    }

                    const isBlocked = npc.body.blocked.left || npc.body.blocked.right || npc.body.blocked.up || npc.body.blocked.down;

                    // Verifica distância para trocar de waypoint
                    const dist = Phaser.Math.Distance.Between(npc.x, npc.y, target.x, target.y);
                    if (dist < 5 || isBlocked || (time - npc.waypointStartTime > npc.waypointTimeout)) {
                        npc.currentWaypointIndex++;
                        if (npc.currentWaypointIndex >= npc.waypoints.length) {
                            npc.currentWaypointIndex = 0; // Loop
                        }
                        npc.waypointStartTime = 0; // Reseta o timer
                        npc.waypointTimeout = 0;

                        if (isBlocked) {
                            npc.body.setVelocity(0);
                        }
                    }
                } else if (npc.speed > 0) {
                    // --- PATRULHA ALEATÓRIA (Se não tiver waypoints) ---
                    if (npc.patrolTarget) {
                        // Move para o ponto de patrulha (velocidade reduzida)
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
                                // Se foi bloqueado, tenta sair quase imediatamente
                                npc.nextPatrolTime = time + 100 + Math.random() * 400;
                            } else {
                                // Espera normal reduzida
                                npc.nextPatrolTime = time + 1000 + Math.random() * 2000;
                            }
                        }
                    } else {
                        npc.body.setVelocity(0);
                        if (time > npc.nextPatrolTime) {
                            // Escolhe novo ponto aleatório ao redor da posição inicial
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
                            npc.patrolStartTime = time;
                        }
                    }
                } else {
                    npc.body.setVelocity(0);
                }

                // --- Animação ---
                const v = npc.body.velocity;
                const key = npc.texture.key;
                
                if (Math.abs(v.x) > 0.1 || Math.abs(v.y) > 0.1) {
                    if (Math.abs(v.x) > Math.abs(v.y)) {
                        if (v.x > 0) npc.play(`${key}_right`, true);
                        else npc.play(`${key}_left`, true);
                    } else {
                        if (v.y > 0) npc.play(`${key}_down`, true);
                        else npc.play(`${key}_up`, true);
                    }
                } else {
                    if (this.scene.anims.exists(`${key}_idle_down`)) {
                        npc.play(`${key}_idle_down`, true);
                    } else if (this.scene.anims.exists(`${key}_idle`)) {
                        npc.play(`${key}_idle`, true);
                    } else {
                        npc.stop(); // Para animação se estiver parado (fallback)
                    }
                }
            } else {
                npc.body.setVelocity(0);
                npc.stop();
            }

            // --- DEBUG DRAWING ---
            if (this.isDebugVisible && npc.active) {
                this.drawDebug(npc);
            }

            // --- Depth Sort e Ícone ---
            npc.setDepth(npc.y);

            // Atualiza posição da sombra
            if (npc.shadow && npc.shadow.visible) {
                const footY = npc.y + (npc.displayHeight / 2) - 5;
                npc.shadow.setPosition(npc.x, footY);
                npc.shadow.setDepth(npc.y - 1);
            }

            if (npc.infoIcon) {
                // Ícone segue o NPC com um efeito flutuante (senoide)
                const floatOffset = Math.sin(time / 200) * 5;
                npc.infoIcon.setPosition(npc.x, npc.y - 60 + floatOffset);
                npc.infoIcon.setDepth(npc.y + 100);
            }

            // Atualiza posição da seta de objetivo
            if (npc.objectiveMarker && npc.objectiveMarker.visible) {
                const floatOffset = Math.sin(time / 150) * 5;
                npc.objectiveMarker.setPosition(npc.x, npc.y - 100 + floatOffset); // Um pouco mais alto que o ícone "!"
                npc.objectiveMarker.setDepth(9999);
            }
        });
    }

    setTargetIndicators(targetIds) {
        this.infoNpcs.forEach(npc => {
            if (targetIds.includes(npc.id)) {
                if (!npc.objectiveMarker) {
                    npc.objectiveMarker = this.scene.add.image(npc.x, npc.y - 100, 'arrow_marker_friend');
                    npc.objectiveMarker.setDepth(9999);
                }
                npc.objectiveMarker.setVisible(true);
                
                // Se tiver seta, esconde o ícone "!" padrão para não poluir
                if (npc.infoIcon) npc.infoIcon.setVisible(false);
            } else {
                if (npc.objectiveMarker) {
                    npc.objectiveMarker.setVisible(false);
                }
                // Restaura o ícone "!" se não for alvo da missão
                if (npc.infoIcon) npc.infoIcon.setVisible(true);
            }
        });
    }
}
