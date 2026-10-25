export default class ItemsManager {
    constructor(scene) {
        this.scene = scene;
        this.itemsGroup = null;
    }

    create() {
        this.itemsGroup = this.scene.physics.add.group();
    }

    tryDrop(x, y) {
        if (window.gameConfig && window.gameConfig.DROPS) {
            window.gameConfig.DROPS.forEach(drop => {
                if (Math.random() <= drop.chance) {
                    this.spawnItem(x, y, drop.key, drop.scale);
                }
            });
        }
    }

    spawnItem(x, y, key, scale = 0.5) {
        // Adiciona um pequeno offset aleatório para os itens não caírem exatamente no mesmo pixel
        const offsetX = Phaser.Math.Between(-20, 20);
        const offsetY = Phaser.Math.Between(-20, 20);
        
        const item = this.itemsGroup.create(x + offsetX, y + offsetY, key);
        item.setScale(scale); // Itens no chão ficam menores
        item.itemKey = key;
        
        // Garante que o item fique visível acima do corpo do NPC (que tem depth = y)
        item.setDepth(y + 10);

        // Ajusta o corpo de física para corresponder ao tamanho visual reduzido
        if (item.body) {
            item.body.setSize(item.displayWidth, item.displayHeight);
            item.body.setOffset(
                (item.width - item.displayWidth) / 2,
                (item.height - item.displayHeight) / 2
            );
        }
        
        // Animação de flutuar (Bounce)
        this.scene.tweens.add({
            targets: item,
            y: item.y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // Torna o item clicável para interação
        item.setInteractive({ cursor: 'pointer' });
        item.on('pointerdown', (pointer) => {
            this.handleItemClick(item);
        });
    }

    update() {
        // Restaura a coleta automática (overlap) para armas, mas mantém Medkit apenas por clique
        const playerSprites = this.scene.players.map(p => p.sprite).filter(s => s && s.active);
        
        this.scene.physics.overlap(playerSprites, this.itemsGroup, (playerSprite, item) => {
            const player = this.scene.players.find(p => p.sprite === playerSprite);
            if (player) {
                this.collectItem(player, item);
            }
        });
    }

    handleItemClick(item) {
        const controller = this.scene.unitController;
        if (!controller || controller.selectedUnits.length === 0) {
            if (this.scene.uiManager) this.scene.uiManager.updateStatus("Selecione um soldado para pegar o item.");
            return;
        }

        // Encontra a unidade selecionada mais próxima
        let closestUnit = null;
        let minDst = Infinity;

        controller.selectedUnits.forEach(unit => {
            if (unit.health > 0) {
                const d = Phaser.Math.Distance.Between(unit.x, unit.y, item.x, item.y);
                if (d < minDst) {
                    minDst = d;
                    closestUnit = unit;
                }
            }
        });

        // Distância de interação (ex: 100 pixels)
        if (closestUnit && minDst <= 100) {
            this.collectItem(closestUnit, item);
        } else {
            const now = this.scene.time.now;
            if (!item.lastDistanceWarningTime || now > item.lastDistanceWarningTime + 2000) {
                if (this.scene.uiManager) this.scene.uiManager.updateStatus("Aproxime-se para pegar o item.");
                item.lastDistanceWarningTime = now;
            }
        }
    }

    collectItem(player, item) {
        if (!item.active) return;

        // --- Lógica de XP do Time (Consumível Imediato) ---
        if (item.itemKey === 'xp_team_money') {
            const xpValue = window.gameConfig.TEAM_XP_DROP_VALUE || 150;
            const moneyValue = window.gameConfig.TEAM_MONEY_DROP_VALUE || 150;
            
            if (this.scene.teamLevelManager) {
                this.scene.teamLevelManager.gainXp(xpValue);
                this.scene.teamLevelManager.gainMoney(moneyValue);
                this.showPickupNotification(`TIME: +${xpValue} XP | +${moneyValue} B$`, '#ffaa00');
            }
            item.destroy();
            return;
        }

        const wConfig = window.gameConfig.WEAPONS[item.itemKey];
        const isWeapon = wConfig && (wConfig.minDamage !== undefined || wConfig.damage !== undefined);

        // Regra: Player só pode ter uma de cada arma (Verifica equipada)
        if (isWeapon && player.selectedWeapon === item.itemKey) {
            const now = this.scene.time.now;
            if (!item.lastNotificationTime || now > item.lastNotificationTime + 3000) {
                if (this.scene.uiManager) this.scene.uiManager.updateStatus("Você já tem esta arma equipada!");
                item.lastNotificationTime = now;
            }
            return;
        }

        // Só pega se o jogador ainda não tiver esse item no inventário OU se for medkit (acumulável)
        if (item.itemKey === 'medkit' || !player.inventory.includes(item.itemKey)) {
            // Regra: Armas não podem ir para o acesso rápido (slots 0-3)
            if (isWeapon) {
                while (player.inventory.length < 4) player.inventory.push(null);
            }

            player.inventory.push(item.itemKey);

            // --- Lógica de Equipar e Notificar ---

            // 1. Auto-equipar se for uma arma com dano
            let actionVerb = "pegou";
            if (wConfig && wConfig.minDamage) {
                player.selectedWeapon = item.itemKey;
                actionVerb = "equipou";
            }

            // 2. Preparar a mensagem de notificação
            let rank = "Agente";
            if (player.name === "Rambo") rank = "Tenente";
            if (player.name === "Alien") rank = "Coronel";

            let playerName = `${rank} ${player.name || "Soldado"}`;

            let itemName = (wConfig && wConfig.name) ? wConfig.name : item.itemKey.toUpperCase();
            if (item.itemKey === 'medkit') itemName = 'Medkit';

            this.showPickupNotification(`${playerName} ${actionVerb} ${itemName}`);

            // 3. Destruir o item do chão
            item.destroy();

            // Atualiza a UI se este jogador estiver selecionado
            if (this.scene.unitController && this.scene.unitController.selectedUnits.includes(player)) {
                 this.scene.uiManager.updateItemSlots(this.scene.unitController.selectedUnits);
            }
        }
    }

    showPickupNotification(text, color = '#354585') {
        const { width, height } = this.scene.scale;
        
        const notification = this.scene.add.text(width / 2, height / 2 - 50, text, {
            fontSize: '26px',
            fontFamily: 'Arial',
            color: color, 
            stroke: '#000000',
            strokeThickness: 1,
            fontStyle: 'bold',
            align: 'center',
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, stroke: true, fill: true }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100000);

        // Animação de entrada (Pop)
        this.scene.tweens.add({
            targets: notification,
            scale: { from: 0, to: 1.2 },
            duration: 300,
            ease: 'Linear',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: notification,
                    scale: 1,
                    duration: 100,
                    onComplete: () => {
                        this.scene.tweens.add({
                            targets: notification,
                            y: notification.y - 100,
                            alpha: 0,
                            duration: 1000,
                            delay: 2000,
                            onComplete: () => notification.destroy()
                        });
                    }
                });
            }
        });
    }
}