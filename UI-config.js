export default class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.buttons = {};
    this.spTexts = [];
    this.uiElements = []; // Array para todos os elementos da UI, para facilitar a destruição/recriação
    this.itemSlots = [];
    this.itemImages = [];
    this.playerSlots = []; // Array para armazenar os slots dos jogadores
    this.isMultiSelectView = false; // Flag para controlar a UI de multi-seleção
  }
 
  calculateLayout() {
    const { scale } = this.scene;
    const screenWidth = scale.width;
    const isSmallScreen = screenWidth < 1400;
    const isMobile = window.gameConfig.IS_MOBILE;

    // --- Scale Logic for Low Resolution ---
    const scaleMode = localStorage.getItem('brics_ui_scale_mode') || 'auto';
    let uiScale = 1.0;

    if (scaleMode === 'high') {
        uiScale = 1.0;
    } else if (scaleMode === 'low') {
        uiScale = 0.7;
    }  
     
    else {
        if (isMobile) uiScale = 1.3; // Aumenta botões para mobile
        else uiScale = isSmallScreen ? 0.9 : 1.0; 
    }

    // Calculate scaled sizes
    const slotSize = 32 * uiScale;
    const padding = 8 * uiScale;
    const itemPadding = 4 * uiScale;
    
    // Store sizes for create methods to use
    this.sizes = {
        slotSize,
        padding,
        itemPadding,
        moneyWidth: 240 * uiScale,
        levelUpsWidth: 34 // Fixed (Barra de lv igual em todas as resoluções)
    };

    // --- Define widths of each UI block ---
    const playerSlotsWidth = 10 + 6 * (slotSize + padding); // Includes startX padding and ALL button
    const itemSlotsWidth = 4 * slotSize + 3 * itemPadding;
    const actionSlotsWidth = 4 * slotSize + 3 * padding;
    const mainButtonsWidth = 3 * slotSize + 2 * padding;
    
    const { moneyWidth, levelUpsWidth } = this.sizes;
    const teamInfoMinWidth = 150;
    const teamInfoMaxWidth = 300;

    // --- Define spacing between blocks ---
    const space_player_item = 20 * uiScale;
    const space_item_action = (isSmallScreen ? 20 : 40) * uiScale;
    const space_mainbuttons = 20 * uiScale;

    // --- Calculate Boundaries ---
    const leftBlockEnd = playerSlotsWidth + space_player_item + itemSlotsWidth + space_item_action + actionSlotsWidth;
    const rightBlockStart = screenWidth - space_mainbuttons - mainButtonsWidth;
    
    const centerAvailableSpace = rightBlockStart - leftBlockEnd;

    // --- Distribute Center Space ---
    const moneyBlockWidth = moneyWidth + levelUpsWidth; // space_money_levelup is 0
    let teamInfoBarWidth = teamInfoMaxWidth;
    let gapSize = 0;
    const minGap = 20;

    // Check if we can fit everything with max width and min gaps
    // We need 3 gaps: Left->Team, Team->Money, Money->Right
    const totalMinContentWidth = teamInfoMaxWidth + moneyBlockWidth + (3 * minGap);

    if (centerAvailableSpace >= totalMinContentWidth) {
        // We have extra space, distribute it evenly
        const excessSpace = centerAvailableSpace - (teamInfoMaxWidth + moneyBlockWidth);
        gapSize = excessSpace / 3;
    } else {
        // Not enough space for max width + min gaps.
        // Fix gaps to min, shrink TeamInfo
        gapSize = minGap;
        const remainingForTeam = centerAvailableSpace - moneyBlockWidth - (3 * minGap);
        teamInfoBarWidth = Math.max(teamInfoMinWidth, remainingForTeam);
        
        // If even min width doesn't fit, shrink gaps (extreme case)
        if (remainingForTeam < teamInfoMinWidth) {
             const deficit = teamInfoMinWidth - remainingForTeam;
             // Reduce gaps to compensate
             gapSize = Math.max(5, minGap - (deficit / 3));
             teamInfoBarWidth = teamInfoMinWidth;
        }
    }

    // --- Final Positions ---
    const itemSlotsStart = playerSlotsWidth + space_player_item;
    const actionSlotsStart = itemSlotsStart + itemSlotsWidth + space_item_action;
    
    const teamInfoStart = leftBlockEnd + gapSize;
    const moneyStart = teamInfoStart + teamInfoBarWidth + gapSize;
    const levelUpsStart = moneyStart + moneyWidth; // 0 spacing
    const mainButtonsStart = rightBlockStart;
    
    this.layout = {
        itemSlots: { start: itemSlotsStart },
        actionSlots: { start: actionSlotsStart },
        teamInfo: { start: teamInfoStart, width: teamInfoBarWidth },
        moneyDisplay: { start: moneyStart, width: moneyWidth },
        levelUps: { start: levelUpsStart, width: levelUpsWidth },
        mainButtons: { start: mainButtonsStart },
    };
  }

  create() {
    const { 
      UI_BAR_HEIGHT,
      BUTTON_HEIGHT,
      BUTTON_PADDING,
      BUTTON_WIDTH,
      COLORS,
    } = window.gameConfig;

    // Fundo preto sólido para garantir opacidade (caso a imagem seja transparente)
        const solidBg = this.scene.add.rectangle(
            0,
            this.scene.scale.height - UI_BAR_HEIGHT,
            this.scene.scale.width,
            UI_BAR_HEIGHT-10
        )
        .setFillStyle(0x000000, 0.5)
        .setOrigin(0, -0.1)
        .setDepth(9998)
        .setScrollFactor(0);

        this.uiElements.push(solidBg);

    // Barra de fundo (Imagem)
    if (this.scene.textures.exists('ui_bg')) {
        this.uiBar = this.scene.add.image(
            0,
            this.scene.scale.height - UI_BAR_HEIGHT,
            'ui_bg'
        )
        .setOrigin(0, 0)
        .setDisplaySize(this.scene.scale.width, UI_BAR_HEIGHT)
        .setDepth(9999)
        .setScrollFactor(0);
        this.uiElements.push(this.uiBar);
    } else {
        this.uiBar = solidBg;
        this.uiBar.setDepth(9999);
    }

    this.calculateLayout();

    this.createButtons();
    this.createPlayerSlots(); // Cria os slots dos personagens
    this.createItemSlots();
    this.createActionSlots(); // Cria os slots de ação (Instance/Stealth)
    this.createTeamInfo(); // Cria a info do time
    this.createMoneyDisplay(); // Cria o display de dinheiro
  }

  createButtons() {
    const { UI_BAR_HEIGHT } = window.gameConfig;
    // tamanho dos botões normais / geral 
    const slotSize = this.sizes.slotSize;
    const padding = this.sizes.padding;
    
    const startX = this.layout.mainButtons.start;
    const topY = this.uiBar.y + (UI_BAR_HEIGHT - slotSize) / 2 + 5;

    const buttonData = [
      {
        key: "mapa",
        topLabel: this.scene.languageManager.get('ui_btn_map'),
        icon: "map_icon",
        defaultText: "M",
        x: startX, 
        y: topY,
      },
      { 
        key: "instrucoes",
        topLabel: this.scene.languageManager.get('ui_btn_help'),
        icon: "help_icon",
        defaultText: "?",
        x: startX + (slotSize + padding),
        y: topY,
      },
      { 
        key: "opcoes",
        topLabel: this.scene.languageManager.get('ui_btn_options'),
        icon: "opcoes_icon",
        defaultText: "O",
        x: startX + (slotSize + padding) * 2,
        y: topY,
      },
    ];

    buttonData.forEach((data) => {
      const rect = this.scene.add
        .rectangle(
          data.x,
          data.y,
          slotSize,
          slotSize,
          0x333333
        )
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0xffffff)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0)
        .setDepth(10000);

      // Texto do Rótulo (Em cima)
      const topLabel = this.scene.add
        .text(
          data.x + slotSize / 2,
          data.y - 14,
          data.topLabel,
          { fontSize: "9px", fontFamily: 'Arial', color: '#ffff00', stroke: '#000000', strokeThickness: 2 }
        )
        .setOrigin(0.5, 0)
        .setDepth(10002)
        .setScrollFactor(0);

      let content;

      if (data.isInstanceBtn) {
          // Botão Instância: Texto N ou A
          content = this.scene.add.text(
              data.x + slotSize / 2,
              data.y + slotSize / 2,
              "N",
              { fontSize: "20px", fontFamily: 'Arial', color: '#00ff00', fontStyle: 'bold' }
          ).setOrigin(0.5).setDepth(10001).setScrollFactor(0);
      } else {
          // Outros botões: Imagem ou Texto Padrão
          if (this.scene.textures.exists(data.icon)) {
              content = this.scene.add.image(data.x + slotSize / 2, data.y + slotSize / 2, data.icon)
                  .setDisplaySize(slotSize - 8, slotSize - 8)
                  .setDepth(10001)
                  .setScrollFactor(0);
          } else {
              content = this.scene.add.text(
                  data.x + slotSize / 2,
                  data.y + slotSize / 2,
                  data.defaultText,
                  { fontSize: "16px", fontFamily: 'Arial', color: '#ffffff' }
              ).setOrigin(0.5).setDepth(10001).setScrollFactor(0);
          }
      }

      rect.on("pointerdown", () => this.scene.handleButtonClick(data.key));
      
      // Efeitos de Hover
      rect.on('pointerover', () => rect.setFillStyle(0x555555));
      rect.on('pointerout', () => rect.setFillStyle(0x333333));

      this.uiElements.push(rect, topLabel, content);
      this.buttons[data.key] = { rect, content, isInstance: data.isInstanceBtn };
    });
  }

  createPlayerSlots() {
    // Não limpa aqui, pois o destroy() já faz isso.
    // this.playerSlots = [];
    const { UI_BAR_HEIGHT } = window.gameConfig; 
    const slotSize = this.sizes.slotSize;
    const padding = this.sizes.padding;
    
   // const topY = this.uiBar.y + (UI_BAR_HEIGHT - slotSize) / 2 + 5; 
    const topY = this.uiBar.y + (UI_BAR_HEIGHT - slotSize) / 2 + 5; 
    const startX = 10;

    // Calcula a posição do botão TODOS para usar como âncora
    const allBtnX = startX + 5 * (slotSize + padding);

    for (let i = 0; i < 5; i++) {
        // Posiciona da direita para a esquerda (P1 ao lado do botão TODOS)
        const x = allBtnX - (i + 1) * (slotSize + padding);
        
        const bg = this.scene.add.rectangle(x, topY, slotSize, slotSize, 0x000000)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0xffffff)
            .setScrollFactor(0)
            .setDepth(10000)
            .setInteractive({ useHandCursor: true });

        this.uiElements.push(bg);

        bg.on('pointerdown', () => this.handlePlayerSlotClick(i));

        const faceKey = `player_face_${i + 1}`;
        let face = null;
        if (this.scene.textures.exists(faceKey)) {
             face = this.scene.add.image(x + slotSize/2, topY + slotSize/2, faceKey)
                .setDisplaySize(slotSize - 2, slotSize - 2)
                .setScrollFactor(0)
                .setDepth(10001);
            this.uiElements.push(face);
        }

        // --- Bolinhas de Insanidade (Topo - Acima da Vida) ---
        const insanityDots = [];
        const dotRadius = 2;
        const dotY = topY - 13;
        const step = slotSize / 5;

        for (let d = 0; d < 5; d++) {
            const dotX = x + (step * d) + (step / 2);
            const dot = this.scene.add.circle(dotX, dotY, dotRadius, 0x111111)
                .setScrollFactor(0).setDepth(10002).setStrokeStyle(1, 0x444444);
            insanityDots.push(dot);
            this.uiElements.push(dot);
        }

        // --- Barra de Vida (Topo) ---
        const hbBg = this.scene.add.rectangle(x, topY - 8, slotSize, 5, 0x330000, 0.9)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(10000);

        const hbFg = this.scene.add.rectangle(x, topY - 8, slotSize, 5, 0x0088ff, 0.9) // Azul
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(10001);

        // --- Barra de XP (Abaixo da foto) ---
        const xpBg = this.scene.add.rectangle(x, topY + slotSize, slotSize, 3, 0x000033)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(10000);
        
        const xpFg = this.scene.add.rectangle(x, topY + slotSize, 0, 3, 0x00ffff)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(10001);

        const lvlText = this.scene.add.text(x + slotSize / 2, topY + slotSize + 4, 'Lvl 1', {
            fontSize: '10px', fontFamily: 'Arial', color: '#ffff00', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10002);

        this.uiElements.push(hbBg, hbFg, lvlText, xpBg, xpFg);

        this.playerSlots.push({ bg, face, hbBg, hbFg, lvlText, xpBg, xpFg, insanityDots, index: i });
    }

    // --- Botão TODOS (ALL) ---
    const allBtnSize = slotSize * 1.1; 
    const allBtnOffset = (allBtnSize - slotSize) / 2;

    const allBtn = this.scene.add.rectangle(allBtnX - allBtnOffset, topY - allBtnOffset, allBtnSize, allBtnSize, 0x333333)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0xffffff)
        .setScrollFactor(0)
        .setDepth(10000)
        .setInteractive({ useHandCursor: true });

    this.uiElements.push(allBtn);

    // Texto "ALL" em cima, como o "Lvl"
    /*
    const allLabel = this.scene.add.text(allBtnX + slotSize / 2, topY - 14, 'ALL', {
        fontSize: '10px', fontFamily: 'Arial', color: '#ffff00', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10002);
    this.uiElements.push(allLabel);
    */

    // Imagem no centro do botão
    if (this.scene.textures.exists('all_icon')) {
        const allIcon = this.scene.add.image(allBtnX + slotSize / 2, topY + slotSize / 2, 'all_icon')
            .setDisplaySize(allBtnSize - 8, allBtnSize - 8) // Um pouco menor para dar margem
            .setScrollFactor(0)
            .setDepth(10001);
        this.uiElements.push(allIcon);
    }

    allBtn.on('pointerdown', () => this.scene.handleButtonClick('todos'));
    allBtn.on('pointerover', () => allBtn.setFillStyle(0x555555));
    allBtn.on('pointerout', () => allBtn.setFillStyle(0x333333));
  }
  
  handlePlayerSlotClick(index) {
      const players = this.scene.players || [];
      if (index < players.length) {
          const player = players[index];
          // Só seleciona se estiver vivo
          if (player.health > 0 && this.scene.unitController) {
              // Seleção exclusiva ao clicar no retrato (comportamento padrão de RTS)
              this.scene.unitController.deselectAll();
              this.scene.unitController.selectUnit(player);

              // Centraliza a câmera no personagem selecionado
              if (player.sprite && player.sprite.active) {
                  this.scene.cameras.main.centerOn(player.x, player.y);
              }
          }
      }
  }

  updatePlayerSlots() {
      const players = this.scene.players || [];
      const selectedUnits = this.scene.unitController ? this.scene.unitController.selectedUnits : [];
      
      // Determina a cor do fundo com base no modo (Normal = Azul, Agressivo = Vermelho)
      const isAggressive = this.scene.informationManager ? this.scene.informationManager.isInstanceMode : false;
      const baseSlotBgColor = isAggressive ? 0x660000 : 0x002244;

      this.playerSlots.forEach((slot, i) => {
          if (i < players.length) {
              const player = players[i];
              
              // Determina a face correta baseada na textura do player
              let faceKey = 'player_face_1';
              if (player.typeConfig && player.typeConfig.textureKey) {
                  const match = player.typeConfig.textureKey.match(/player_(\d+)/);
                  if (match) {
                      faceKey = `player_face_${match[1]}`;
                  }
              }

              // Lógica de Cor de Fundo por Insanidade
              let slotBgColor = baseSlotBgColor;
              const insanity = player.insanity || 0;
              
              if (insanity >= 95) {
                  slotBgColor = 0x002200; // Bem verde escuro (Quase preto/Insano)
              } else if (insanity >= 75) {
                  slotBgColor = 0x004400; // Verde escuro
              } else if (insanity >= 50) {
                  slotBgColor = 0x226622; // Esverdeado
              }

              // Garante que os elementos base do slot estejam visíveis (caso estivessem ocultos)
              slot.bg.setVisible(true);
              slot.bg.setFillStyle(slotBgColor);
              if (slot.face) slot.face.setVisible(true);
              slot.hbBg.setVisible(true);
              slot.hbFg.setVisible(true);

              // Atualiza Barra de Vida
              const maxHealth = window.gameConfig.MAX_HEALTH || 100;
              const hpPercent = Phaser.Math.Clamp(player.health / maxHealth, 0, 1);
              slot.hbFg.width = slot.bg.width * hpPercent;
              
              // Cor da vida AZUL (Solicitado)
              slot.hbFg.fillColor = 0x0088ff;

              // --- Atualiza Bolinhas de Insanidade ---
              if (slot.insanityDots) {
                  const insanity = player.insanity || 0;
                  slot.insanityDots.forEach((dot, index) => {
                      dot.setVisible(true);
                      const threshold = (index + 1) * 20;
                      if (insanity >= threshold) {
                          let color = 0x00ff00; // 20% (Verde)
                          if (index === 1) color = 0xffff00; // 40% (Amarelo)
                          if (index === 2) color = 0xff8800; // 60% (Laranja)
                          if (index === 3) color = 0xff0000; // 80% (Vermelho)
                          if (index === 4) color = 0xff00ff; // 100% (Roxo)
                          dot.setFillStyle(color, 1);
                          dot.setStrokeStyle(1, 0xffffff);
                      } else {
                          dot.setFillStyle(0x111111, 0.5);
                          dot.setStrokeStyle(1, 0x444444);
                      }
                  });
              }

              // --- Atualiza Nível e XP ---
              if (slot.lvlText) {
                  slot.lvlText.setText(`Lvl ${player.level || 1}`);
                  slot.lvlText.setVisible(true);
              }

              if (slot.xpFg && slot.xpBg) {
                  const details = window.gameConfig.getXpDetails(player.xp || 0);
                  const xpPercent = Phaser.Math.Clamp(details.currentLevelXp / details.xpForNextLevel, 0, 1);
                  slot.xpFg.width = slot.bg.width * xpPercent;
                  slot.xpBg.setVisible(true);
                  slot.xpFg.setVisible(true);
              }

              // Destaque de Seleção (Borda Azul)
              if (selectedUnits.includes(player)) {
                  slot.bg.setStrokeStyle(2, 0x3399FF);
              } else {
                  slot.bg.setStrokeStyle(1, 0xffffff);
              }
              
              // Efeito visual se estiver morto
              if (player.health <= 0) {
                  if (slot.face) {
                      // Muda para a face de morto se ainda não estiver
                      if (slot.face.texture.key !== 'player_face_morta') {
                          slot.face.setTexture('player_face_morta');
                          slot.face.setDisplaySize(slot.bg.width - 2, slot.bg.height - 2);
                      }
                      slot.face.clearTint(); // Garante que a caveira não fique escura
                      slot.face.setAlpha(1); // Mantém visível (caveira)
                  }
                  slot.bg.setAlpha(0.5);
                  
                  if (slot.insanityTween) {
                      slot.insanityTween.stop();
                      slot.insanityTween = null;
                  }
              } else {
                  if (slot.face) {
                      // Restaura a face original se o personagem reviver (ou resetar)
                      if (slot.face.texture.key !== faceKey) {
                          slot.face.setTexture(faceKey);
                          slot.face.setDisplaySize(slot.bg.width - 2, slot.bg.height - 2);
                      }
                      
                      // Lógica de escurecer face se não estiver selecionado
                      if (selectedUnits.includes(player)) {
                          slot.face.clearTint(); // Normal (Brilhante)
                      } else {
                          slot.face.setTint(0x555555); // Escuro (Cinza)
                      }
                      
                      slot.face.setAlpha(1);
                  }
                  
                  // Pulsação para insanidade crítica (>= 95%)
                  if (insanity >= 95) {
                      if (!slot.insanityTween) {
                          slot.insanityTween = this.scene.tweens.add({
                              targets: slot.bg,
                              alpha: 0.4,
                              duration: 500,
                              yoyo: true,
                              repeat: -1
                          });
                      }
                  } else {
                      if (slot.insanityTween) {
                          slot.insanityTween.stop();
                          slot.insanityTween = null;
                      }
                      slot.bg.setAlpha(1);
                  }
              }
          } else {
              // Esconde slots vazios (se tiver menos de 5 players)
              slot.bg.setVisible(false);
              if (slot.insanityTween) { slot.insanityTween.stop(); slot.insanityTween = null; }
              if (slot.face) slot.face.setVisible(false);
              slot.hbBg.setVisible(false);
              slot.hbFg.setVisible(false);
              
              // Esconde novos elementos
              if (slot.lvlText) slot.lvlText.setVisible(false);
              if (slot.xpBg) slot.xpBg.setVisible(false);
              if (slot.xpFg) slot.xpFg.setVisible(false);
              if (slot.insanityDots) slot.insanityDots.forEach(d => d.setVisible(false));
          }
      });
  }

  createItemSlots() {
    // Não limpa aqui, pois o destroy() já faz isso.
    // this.itemSlots = []; this.itemImages = [];

    const { BUTTON_WIDTH, BUTTON_PADDING, UI_BAR_HEIGHT } = window.gameConfig;
    const slotSize = this.sizes.slotSize;
    const padding = this.sizes.itemPadding;
    // Posiciona os slots à direita da tela, dentro da barra
    const topY = this.uiBar.y + (UI_BAR_HEIGHT - slotSize) / 2 + 5;
    const startX = this.layout.itemSlots.start;
    
    for (let i = 0; i < 4; i++) {
        const x = startX + i * (slotSize + padding);
        const rect = this.scene.add.rectangle(x, topY, slotSize, slotSize, 0x333333)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0xffffff)
            .setScrollFactor(0)
            .setDepth(10000)
            .setInteractive({ useHandCursor: true });

        // Adiciona o número do atalho (1, 2, 3, 4) acima do slot
        const shortcutText = this.scene.add.text(x + slotSize / 2, topY - 16, (i + 1).toString(), {
            fontSize: '12px', fontFamily: 'Arial', color: '#ffff00', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10002);

        rect.on('pointerdown', () => this.handleItemSlotClick(i));

        // Efeito de Glow (Hover)
        rect.on('pointerover', () => rect.setStrokeStyle(2, 0x00ffff));
        rect.on('pointerout', () => {
            // Restaura o estado original (Verde se selecionado, Branco se não)
            let isSelected = false;
            if (this.currentDisplayItems && this.currentDisplayItems[i]) {
                const itemKey = this.currentDisplayItems[i];
                const selectedUnits = this.scene.unitController ? this.scene.unitController.selectedUnits : [];
                if (selectedUnits.length === 1 && selectedUnits[0].selectedWeapon === itemKey) {
                    isSelected = true;
                }
            }
            // Se selecionado: espessura 2, cor verde. Se não: espessura 1, cor branca.
            rect.setStrokeStyle(isSelected ? 2 : 1, isSelected ? 0x00ff00 : 0xffffff);
        });

        this.uiElements.push(rect, shortcutText);
        this.itemSlots.push(rect);
    }
  } 

  createActionSlots() {
    const { UI_BAR_HEIGHT } = window.gameConfig;
    const slotSize = this.sizes.slotSize;
    const padding = this.sizes.padding;
    const topY = this.uiBar.y + (UI_BAR_HEIGHT - slotSize) / 2 + 5;
    const startX = this.layout.actionSlots.start;

    const actionData = [
      { 
        key: "instance",
        topLabel: "I",
        isInstanceBtn: true,
        x: startX,
        y: topY,
      },
      { 
        key: "warp",
        topLabel: "B",
        defaultText: "B",
        icon: "blink_icon",
        x: startX + (slotSize + padding),
        y: topY,
      },
      { 
        key: "stealth",
        topLabel: "F",
        defaultText: "F",
        icon: "steath_icon",
        x: startX + (slotSize + padding) * 2,
        y: topY,
      },
      { 
        key: "inventory",
        topLabel: "G",
        defaultText: "G",
        icon: "gear_icon",
        x: startX + (slotSize + padding) * 3,
        y: topY,
      }
    ];

    actionData.forEach((data) => {
      const rect = this.scene.add.rectangle(data.x, data.y, slotSize, slotSize, 0x333333)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0xffffff)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0)
        .setDepth(10000);

      // Texto do Rótulo (Em cima)
      const topLabel = this.scene.add.text(data.x + slotSize / 2, data.y - 14, data.topLabel, { 
          fontSize: "12px", fontFamily: 'Arial', color: '#ffff00', stroke: '#000000', strokeThickness: 2 
      }).setOrigin(0.5, 0).setDepth(10002).setScrollFactor(0);

      let content;

      if (data.isInstanceBtn) {
          // Botão Instância: Texto N ou A
          // Verifica o estado atual para definir a cor e texto corretos ao criar/recriar
          const isAggressive = this.scene.informationManager && this.scene.informationManager.isInstanceMode;
          const label = isAggressive ? "A" : "N";
          const color = isAggressive ? '#ff0000' : '#00ff00';

          content = this.scene.add.text(data.x + slotSize / 2, data.y + slotSize / 2, label, { 
              fontSize: "20px", fontFamily: 'Arial', color: color, fontStyle: 'bold' 
          }).setOrigin(0.5).setDepth(10001).setScrollFactor(0);
      } else if (data.icon && this.scene.textures.exists(data.icon)) {
          content = this.scene.add.image(data.x + slotSize / 2, data.y + slotSize / 2, data.icon)
              .setDisplaySize(slotSize - 8, slotSize - 8)
              .setDepth(10001)
              .setScrollFactor(0);
      } else {
          // Botão Stealth: Texto S
          content = this.scene.add.text(data.x + slotSize / 2, data.y + slotSize / 2, data.defaultText, { 
              fontSize: "16px", fontFamily: 'Arial', color: '#ffffff' 
          }).setOrigin(0.5).setDepth(10001).setScrollFactor(0);
      }

      rect.on("pointerdown", () => this.scene.handleButtonClick(data.key));
      
      // Efeitos de Hover
      rect.on('pointerover', () => rect.setFillStyle(0x555555));
      rect.on('pointerout', () => rect.setFillStyle(0x333333));

      this.uiElements.push(rect, topLabel, content);
      // Adiciona ao dicionário de botões para que o GameScene possa atualizá-los
      this.buttons[data.key] = { rect, content, isInstance: data.isInstanceBtn };
    });
  }

  handleItemSlotClick(index) {
    if (!this.currentDisplayItems) return;
    
    const itemKey = this.currentDisplayItems[index];
    if (itemKey) {
        const selectedUnits = this.scene.unitController ? this.scene.unitController.selectedUnits : [];
        
        // --- LÓGICA PARA MÚLTIPLAS UNIDADES ---
        if (this.isMultiSelectView && selectedUnits.length > 1) {
            if (itemKey === 'medkit') {
                const maxHealth = window.gameConfig.MAX_HEALTH || 100;
                
                // 1. Identificar todos os medkits disponíveis no grupo selecionado
                let medkitProviders = [];
                selectedUnits.forEach(unit => {
                    if (unit.health > 0) {
                        unit.inventory.forEach(item => {
                            if (item === 'medkit') medkitProviders.push(unit);
                        });
                    }
                });

                if (medkitProviders.length === 0) {
                    this.updateStatus("Nenhum Medkit disponível no grupo.");
                    return;
                }

                // 2. Identificar unidades feridas no grupo
                let injuredUnits = selectedUnits.filter(u => u.health > 0 && u.health < maxHealth);
                
                if (injuredUnits.length === 0) {
                    this.updateStatus("Nenhuma unidade precisa de cura.");
                    return;
                }

                // 3. Distribuir cura (Pool de Medkits)
                let usedCount = 0;
                let healedNames = new Set();

                // Enquanto houver medkits e feridos
                while (medkitProviders.length > 0 && injuredUnits.length > 0) {
                    // Reordena para sempre pegar o mais ferido atualizado
                    injuredUnits.sort((a, b) => a.health - b.health);
                    
                    const target = injuredUnits[0];
                    const provider = medkitProviders.pop(); // Consome um medkit do pool

                    // Aplica cura
                    if (target.heal) target.heal(20);
                    
                    // Remove do inventário de quem forneceu
                    provider.removeItem('medkit');
                    
                    usedCount++;
                    healedNames.add(target.name);

                    // Se ficou full, remove da lista de feridos
                    if (target.health >= maxHealth) {
                        injuredUnits.shift();
                    }
                }

                if (usedCount > 0) {
                    const names = Array.from(healedNames).join(', ');
                    this.showNotification(`Curados: ${names}`, '#00ff00');
                    this.updateItemSlots(selectedUnits);
                    this.updatePlayerSlots();
                }
            }

            if (itemKey === 'smoke_grenade') {
                // Procura alguém no grupo que tenha a granada
                const provider = selectedUnits.find(u => u.inventory.includes('smoke_grenade') && u.health > 0);
                
                if (provider) {
                    if (provider.useSmokeGrenade) provider.useSmokeGrenade();
                    this.updateStatus(`${provider.name} usou Granada de Fumaça!`);
                    this.updateItemSlots(selectedUnits);
                    this.updatePlayerSlots();
                } else {
                    this.updateStatus("Ninguém tem Granada de Fumaça.");
                }
            }

            if (itemKey === 'reviver') {
                // Procura alguém no grupo que tenha o reviver
                const provider = selectedUnits.find(u => u.inventory.includes('reviver') && u.health > 0);
                
                if (provider) {
                    // Encontra o jogador morto mais próximo
                    let closestDead = null;
                    let minDst = Infinity;
                    this.scene.players.forEach(p => {
                        if (p.health <= 0) {
                            const d = Phaser.Math.Distance.Between(provider.x, provider.y, p.x, p.y);
                            if (d < minDst) {
                                minDst = d;
                                closestDead = p;
                            }
                        }
                    });

                    if (closestDead && minDst < 200) { // Alcance de 200px
                        closestDead.revive();
                        provider.removeItem('reviver');
                        this.updateStatus(`${provider.name} reviveu ${closestDead.name}!`);
                        this.updateItemSlots(selectedUnits);
                        this.updatePlayerSlots();
                    } else {
                        this.updateStatus("Nenhum aliado morto por perto.");
                    }
                } else {
                    this.updateStatus("Ninguém tem Desfibrilador.");
                }
            }
        } 
        // --- LÓGICA PARA UMA UNIDADE ---
        else if (selectedUnits.length === 1) {
            const unit = selectedUnits[0];

            // Lógica para usar Medkit (Consumível)
            if (itemKey === 'medkit') {
                const maxHealth = window.gameConfig.MAX_HEALTH || 100;
                
                if (unit.health > 0) {
                    if (unit.health < maxHealth) {
                        // Cura a si mesmo se estiver ferido
                        if (unit.heal) unit.heal(20);
                        unit.removeItem('medkit');
                        this.updateStatus('Usou Medkit (+20 HP)');
                    } else {
                        // Vida cheia: Tenta curar outro aliado ferido
                        const teammates = this.scene.players.filter(p => p !== unit && p.health > 0 && p.health < maxHealth);
                        
                        if (teammates.length > 0) {
                            // Prioriza o mais ferido
                            teammates.sort((a, b) => a.health - b.health);
                            const target = teammates[0];
                            
                            if (target.heal) target.heal(20);
                            unit.removeItem('medkit');
                            
                            this.showNotification(`${unit.name} curou ${target.name}`, '#00ff00');
                        } else {
                            this.updateStatus("Vida cheia e ninguém para curar!");
                            return;
                        }
                    }
                    
                    // Atualiza a UI
                    this.updateItemSlots(selectedUnits);
                    this.updatePlayerSlots();
                }
                return; // Não equipa como arma
            }

            // Lógica para usar Reviver
            if (itemKey === 'reviver') {
                // Encontra o jogador morto mais próximo
                let closestDead = null;
                let minDst = Infinity;
                this.scene.players.forEach(p => {
                    if (p.health <= 0) {
                        const d = Phaser.Math.Distance.Between(unit.x, unit.y, p.x, p.y);
                        if (d < minDst) {
                            minDst = d;
                            closestDead = p;
                        }
                    }
                });

                if (closestDead && minDst < 200) {
                    closestDead.revive();
                    unit.removeItem('reviver');
                    this.updateStatus(`${unit.name} reviveu ${closestDead.name}!`);
                    this.updateItemSlots(selectedUnits);
                    this.updatePlayerSlots();
                } else {
                    this.updateStatus("Nenhum aliado morto por perto.");
                }
                return;
            }

            // Lógica para Plantar a Bomba (Missão)
            if (itemKey === 'bomba') {
                if (this.scene.missionManager) {
                    const planted = this.scene.missionManager.tryPlantBomb(unit);
                    if (planted) {
                        this.updateStatus(`${unit.name || 'Soldado'} plantou a bomba!`);
                        this.updateItemSlots(selectedUnits); // Atualiza slots para remover a bomba
                        this.updatePlayerSlots();
                    } else {
                        this.updateStatus("Aproxime-se do alvo para plantar a bomba.");
                    }
                }
                return; // Não equipa como arma
            }
            
            // Granada é consumível: usa em vez de equipar
            if (itemKey === 'smoke_grenade') {
                if (unit.health > 0 && unit.useSmokeGrenade) unit.useSmokeGrenade();
                this.updateItemSlots(selectedUnits);
                return;
            }

            // Troca a arma (a equipada fica fora do inventário: troca de lugar com a antiga para não duplicar/perder)
            if (itemKey !== unit.selectedWeapon) {
                const invIndex = unit.inventory.indexOf(itemKey);
                if (invIndex !== -1 && this.scene.inventoryPanel) {
                    this.scene.inventoryPanel.equipWeapon(unit, invIndex, itemKey);
                } else {
                    unit.selectedWeapon = itemKey;
                }
            }
            
            // Atualiza a UI imediatamente para mostrar o destaque
            this.updateItemSlots(selectedUnits);
            
            // Opcional: Feedback no console ou na tela
            // console.log(`Arma equipada: ${itemKey}`);
        }
    }
  }

  createTeamInfo() {
    const { UI_BAR_HEIGHT } = window.gameConfig;
    const barWidth = this.layout.teamInfo.width;
    const startX = this.layout.teamInfo.start;
    const centerX = startX + barWidth / 2;
    const topY = this.uiBar.y + 8; // Subi um pouco para centralizar verticalmente com o tamanho maior

    // Adiciona a imagem de fundo para a área de Team Info
    if (this.scene.textures.exists('ui_border')) {
        // --- CONFIGURAÇÃO DE POSIÇÃO DA IMAGEM ---
        const offsetX = 0; 
        const offsetY = 0; 

        const teamInfoBg = this.scene.add.image(startX + offsetX, this.uiBar.y + offsetY, 'ui_border')
            .setOrigin(0.12, -0.17)
            .setDisplaySize(barWidth+95, UI_BAR_HEIGHT-20)
            .setScrollFactor(0)
            .setDepth(10000); // Profundidade base para esta seção
        this.uiElements.push(teamInfoBg);
    }

    // Texto "Esquadrão BRICS lv 1"
    const squadName = this.scene.squadName || 'BRICS';
    const level = this.scene.teamLevelManager ? this.scene.teamLevelManager.level : 1;
    this.teamLevelText = this.scene.add.text(centerX, topY, `${squadName} Lv ${level}`, {
        fontSize: '17px', fontFamily: 'Arial', color: '#ffff00', stroke: '#000000', strokeThickness: 1, fontStyle: 'bold'
    }).setOrigin(0.5, -0.4).setScrollFactor(0).setDepth(10003);
    this.uiElements.push(this.teamLevelText);

    // Barra de XP do Time
    const barHeight = 10; // Aumentei a altura
    const barY = topY + 34; // Ajustei a posição Y da barra

    // Fundo da barra
    this.teamXpBg = this.scene.add.rectangle(centerX, barY, barWidth, barHeight, 0x000033)
        .setOrigin(0.5, 0).setScrollFactor(0).setDepth(10001).setStrokeStyle(1, 0xffffff);
    this.uiElements.push(this.teamXpBg);
    
    // Frente da barra (XP) - Inicia na borda esquerda do fundo
    const barStartX = centerX - barWidth / 2;
    this.teamXpFg = this.scene.add.rectangle(barStartX, barY, 0, barHeight, 0x00ffff)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(10002);
    this.uiElements.push(this.teamXpFg);
  }

  updateTeamInfo() {
      if (this.scene.teamLevelManager) {
          const mgr = this.scene.teamLevelManager;
          const level = mgr.level;
          const xp = mgr.xp;
          const squadName = this.scene.squadName || 'BRICS';
          
          this.teamLevelText.setText(`${squadName} Lv ${level}`);
          
          const details = window.gameConfig.getXpDetails(xp);
          const xpPercent = Phaser.Math.Clamp(details.currentLevelXp / details.xpForNextLevel, 0, 1);
          this.teamXpFg.width = this.teamXpBg.width * xpPercent; // Usa a largura do background dinamicamente
      }
  }

  createMoneyDisplay() {
      const { UI_BAR_HEIGHT } = window.gameConfig;
      const width = this.sizes.moneyWidth;
      const startX = this.layout.moneyDisplay.start;
      const centerX = startX + width / 2;
      const y = this.uiBar.y + UI_BAR_HEIGHT / 2;


      // Fundo estilo digital futurista
      const bg = this.scene.add.rectangle(centerX, y, width, 34, 0x000000, 0.8)
          .setOrigin(0.5, 0.5) // Centralizado
          .setScrollFactor(0)
          .setDepth(10000);
      this.uiElements.push(bg);

      // Texto alinhado à direita (como estava no canto)
      this.moneyText = this.scene.add.text(centerX + width/2 - 10, y, '', {
          fontSize: '18px',
          fontFamily: 'Segoe UI Emoji, Arial', // Fonte compatível com emojis
          color: '#00ff00', // Verde Matrix
          align: 'right',
          shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 4, stroke: true, fill: true } // Glow neon
      }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(10001);
      
      this.uiElements.push(this.moneyText);
      
      this.updateMoneyDisplay();
      this.createLevelUpsDisplay(y);
  }

  createLevelUpsDisplay(y) {
      // Posiciona o quadrado no início de sua zona de layout
      const startX = this.layout.levelUps.start;
      const size = this.sizes.levelUpsWidth;
      const x = startX + size / 2;

      // Mesma altura da barra de dinheiro
      const bg = this.scene.add.rectangle(x, y, size, size, 0x000000, 0.8)
          .setOrigin(0.5, 0.5)
          .setScrollFactor(0)
          .setDepth(10000);
      this.uiElements.push(bg);
      this.levelUpsBg = bg; // Guarda referência para o efeito de piscar

      this.levelUpsText = this.scene.add.text(x, y, '📈 0', {
          fontSize: '14px',
          fontFamily: 'Segoe UI Emoji, Arial',
          color: '#00ff00',
          align: 'center',
          shadow: { offsetX: 0, offsetY: 0, color: '#00ff00', blur: 4, stroke: true, fill: true }
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(10001);
      
      this.uiElements.push(this.levelUpsText);
      this.updateLevelUpsDisplay();
  }

  updateMoneyDisplay() {
      if (this.scene.teamLevelManager) {
          const money = this.scene.teamLevelManager.money || 0;
          
          // Mapeamento de números para emojis
          const map = {
              '0': '0️⃣', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣',
              '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣'
          };
          
          const absMoney = Math.abs(money);
          const str = absMoney.toLocaleString('pt-BR');
          const emojiStr = str.split('').map(c => map[c] || c).join('');
          
          if (money < 0) {
              this.moneyText.setText(`💰 -${emojiStr}`);
              this.moneyText.setColor('#ff0000');
          } else {
              this.moneyText.setText(`💰 ${emojiStr}`);
              this.moneyText.setColor('#00ff00');
          }
      }
  }

  flashLevelUpsDisplay() {
      if (this.levelUpsBg) {
          this.scene.tweens.add({
              targets: this.levelUpsBg,
              alpha: 0.2,
              duration: 200,
              yoyo: true,
              repeat: 5,
              onComplete: () => {
                  this.levelUpsBg.setAlpha(0.8);
              }
          });
      }
  }

  updateLevelUpsDisplay() {
      if (this.scene.teamLevelManager && this.levelUpsText) {
          const count = this.scene.teamLevelManager.totalLevelUps || 0;
          this.levelUpsText.setText(`📈 ${count}`);
      }
  }

  updateItemSlots(selectedUnits) {
    // Limpa imagens anteriores
    this.itemImages.forEach(img => img.destroy());
    this.itemImages = [];

    if (!selectedUnits || selectedUnits.length === 0) {
        // Limpa a UI se nada estiver selecionado
        this.itemSlots.forEach(slot => slot.setStrokeStyle(1, 0xffffff));
        this.currentDisplayItems = [];
        return;
    }

    if (selectedUnits.length > 1) {
        // --- MODO MULTI-SELEÇÃO ---
        this.isMultiSelectView = true;

        // 1. Contar todos os itens de todos os jogadores selecionados
        const totalItemCounts = {};
        selectedUnits.forEach(unit => {
            if (unit.inventory) {
                unit.inventory.forEach(item => {
                    totalItemCounts[item] = (totalItemCounts[item] || 0) + 1;
                });
            }
        });

        // 2. Filtrar para mostrar apenas itens "úteis" na visão multi-seleção
        const usableItems = ['medkit', 'smoke_grenade', 'reviver'];
        const uniqueUsableItems = [];
        usableItems.forEach(item => {
            if (totalItemCounts[item] > 0) {
                uniqueUsableItems.push(item);
            }
        });

        // 3. Preencher os 4 slots com os itens encontrados
        const displayItems = [null, null, null, null];
        this.currentDisplayItems = displayItems;

        uniqueUsableItems.slice(0, 4).forEach((itemKey, index) => {
            const slot = this.itemSlots[index];
            displayItems[index] = itemKey;

            const count = totalItemCounts[itemKey];

            const img = this.scene.add.image(slot.x + slot.width / 2, slot.y + slot.height / 2, itemKey);
            const maxSize = slot.width * 0.9; // Usa 90% do slot
            const scale = Math.min(maxSize / img.width, maxSize / img.height);
            img.setScale(scale).setScrollFactor(0).setDepth(10001);
            this.itemImages.push(img);

            const text = this.scene.add.text(slot.x + slot.width - 2, slot.y + slot.height - 2, count.toString(), {
                fontSize: '14px', fontFamily: 'Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
            }).setOrigin(1, 1).setScrollFactor(0).setDepth(10002);
            this.itemImages.push(text);
        });

        this.itemSlots.forEach(slot => slot.setStrokeStyle(1, 0xffffff));

    } else {
        // --- MODO SELEÇÃO ÚNICA (LÓGICA ORIGINAL) ---
        this.isMultiSelectView = false;
        const unit = selectedUnits[0];
        const inventory = unit.inventory || [];

        // 1. Contar todos os itens no inventário do jogador
        const itemCounts = {};
        inventory.forEach(item => {
            itemCounts[item] = (itemCounts[item] || 0) + 1;
        });
        
        // 2. Obter os itens únicos na ordem em que aparecem pela primeira vez
        const uniqueItems = [];
        inventory.forEach(item => {
            if (!uniqueItems.includes(item)) {
                uniqueItems.push(item);
            }
        });

        // 3. Pegar os primeiros 4 itens únicos para exibir na barra de acesso rápido
        const displayItems = uniqueItems.slice(0, 4);
        this.currentDisplayItems = displayItems; // Salva para a lógica de clique

        // 4. Renderizar os slots
        this.itemSlots.forEach((slot, idx) => {
            if (idx < displayItems.length) {
                const itemKey = displayItems[idx];
                const count = itemCounts[itemKey];

                // Destaque para a arma selecionada
                if (itemKey && unit.selectedWeapon === itemKey) {
                    slot.setStrokeStyle(2, 0x00ff00);
                } else {
                    slot.setStrokeStyle(1, 0xffffff);
                }

                // Desenha a imagem do item
                const img = this.scene.add.image(slot.x + slot.width / 2, slot.y + slot.height / 2, itemKey);
                const maxSize = slot.width * 0.9;
                const scale = Math.min(maxSize / img.width, maxSize / img.height);
                img.setScale(scale).setScrollFactor(0).setDepth(10001);
                this.itemImages.push(img);

                // Desenha o contador se for maior que 1
                if (count > 1) {
                    const text = this.scene.add.text(slot.x + slot.width - 2, slot.y + slot.height - 2, count.toString(), {
                        fontSize: '14px', fontFamily: 'Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
                    }).setOrigin(1, 1).setScrollFactor(0).setDepth(10002);
                    this.itemImages.push(text);
                }
            } else {
                // Slot vazio
                slot.setStrokeStyle(1, 0xffffff);
            }
        });
    }
  }

  updateButtonsState(actionMode) {
    const { COLORS } = window.gameConfig;

    // Resetar todos
    Object.values(this.buttons).forEach((btn) => {
      btn.rect.setFillStyle(COLORS.BUTTON_INACTIVE);
      btn.text.setColor(COLORS.BUTTON_TEXT_INACTIVE);
    });

    // Ativar o selecionado
    if (actionMode && this.buttons[actionMode]) {
      this.buttons[actionMode].rect.setFillStyle(COLORS.BUTTON_ACTIVE);
      this.buttons[actionMode].text.setColor(COLORS.BUTTON_TEXT_ACTIVE);
    }
  }

  updateStatus(text) {
    this.showNotification(text);
  }

  showNotification(text, color = '#ffffff') {
    const notification = this.scene.add.text(
      this.scene.scale.width / 2,
      50,
      text,
      {
        fontSize: '20px',
        color: color,
        stroke: '#000000',
        strokeThickness: 2,
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(10010);

    this.scene.tweens.add({
      targets: notification,
      y: notification.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => notification.destroy()
    });
  }

  toggleButtonState(key, isActive) {
    const btn = this.buttons[key];
    if (btn && btn.rect) {
        this.scene.tweens.killTweensOf(btn.rect); // Para qualquer animação (ex: flash)
        btn.rect.setAlpha(1); // Garante opacidade total
        
        if (isActive) {
            btn.rect.setStrokeStyle(2, 0x00ff00); // Borda verde se ativo
        } else {
            btn.rect.setStrokeStyle(1, 0xffffff); // Borda branca se inativo
        }
    }
  }

  flashButton(key, color = 0x00ffff) {
      const btn = this.buttons[key];
      if (btn && btn.rect) {
          this.scene.tweens.add({
              targets: btn.rect,
              alpha: 0.2,
              duration: 200,
              yoyo: true,
              repeat: 5,
              onComplete: () => {
                  btn.rect.setAlpha(1);
                  btn.rect.setStrokeStyle(2, color); // Borda Ciano para indicar pronto
              }
          });
      }
  }

  updateButtonLabel(key, label) {
    const btn = this.buttons[key];
    if (btn && btn.isInstance && btn.content) {
        if (label === "AGRESSIVA") {
            btn.content.setText("A");
            btn.content.setColor("#ff0000"); // Vermelho
        } else {
            btn.content.setText("N");
            btn.content.setColor("#00ff00"); // Verde
        }
    }
  }

  enableButton(key, enabled) {
    const btn = this.buttons[key];
    if (btn) {
      if (enabled) {
          btn.rect.setInteractive({ useHandCursor: true });
          // Restaura a cor original (Branco para texto, sem tint para imagem)
          if (btn.content) {
              if (btn.content.type === 'Text' && !btn.isInstance) btn.content.setColor('#ffffff');
              else if (btn.content.type === 'Image') btn.content.clearTint();
          }
      } else {
          btn.rect.disableInteractive();
          // Aplica cor cinza
          if (btn.content) {
              if (btn.content.type === 'Text') btn.content.setColor('#888888');
              else if (btn.content.type === 'Image') btn.content.setTint(0x888888);
          }
      }
      // Optionally change appearance for disabled
      const alpha = enabled ? 1 : 0.5;
      btn.rect.setAlpha(alpha);
      if (btn.content) {
          btn.content.setAlpha(alpha);
      }
    }
  }

  destroy() {
    this.uiElements.forEach(el => {
        if (el && el.active) {
            el.destroy();
        }
    });
    this.uiElements = [];
    this.buttons = {};
    this.itemSlots = [];
    this.playerSlots = [];
    // Imagens de itens são dinâmicas e já são destruídas no updateItemSlots
    this.itemImages.forEach(img => img.destroy());
    this.itemImages = [];
  }

  destroyAndRecreate() {
      this.destroy();
      this.create();
  }
}
