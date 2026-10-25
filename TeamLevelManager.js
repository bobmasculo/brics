export default class TeamLevelManager {
    constructor(scene) {
        this.scene = scene;
        this.xp = 0;
        this.level = 1;
        this.money = 0;
        this.inventory = [];
        this.stash = []; // Baú para guardar itens
        this.totalLevelUps = 0; // Contador persistente de subidas de nível
        this.talents = []; // Talentos desbloqueados
        this.maxInventorySlots = 10;
    }

    create() {
        this.loadStats();
    }

    loadStats() {
        try {
            const saved = localStorage.getItem('brics_team_stats');
            if (saved) {
                const data = JSON.parse(saved);
                this.xp = data.xp || 0;
                this.money = data.money || 0;
                this.inventory = data.inventory || [];
                this.stash = data.stash || [];
                this.totalLevelUps = data.totalLevelUps || 0;
                this.talents = data.talents || [];
                const details = window.gameConfig.getXpDetails(this.xp);
                this.level = details.level;
            } else {
                // Se não há dados salvos, reseta para os valores padrão.
                this.xp = 0;
                this.level = 1;
                this.money = 0;
                this.inventory = [];
                this.stash = [];
                this.totalLevelUps = 0;
                this.talents = [];
            }

            // Se for um "Tentar de Novo" com reset de níveis
            const urlParams = new URLSearchParams(window.location.search);
            const resetLevels = urlParams.get('reset_levels') === '1';
            if (resetLevels) {
                this.xp = 0;
                this.level = 1;
                // Mantém money, inventory e totalLevelUps
                this.saveStats();
            }

            if (this.scene.uiManager && this.scene.uiManager.updateMoneyDisplay) {
                this.scene.uiManager.updateMoneyDisplay();
                if (this.scene.uiManager.updateLevelUpsDisplay) this.scene.uiManager.updateLevelUpsDisplay();
            }
        } catch (e) {
            console.warn("Falha ao carregar stats do time", e);
        }
    }

    saveStats() {
        try {
            const data = { 
                xp: this.xp, 
                money: this.money, 
                inventory: this.inventory, 
                stash: this.stash, 
                totalLevelUps: this.totalLevelUps, 
                talents: this.talents 
            };
            localStorage.setItem('brics_team_stats', JSON.stringify(data));
        } catch (e) {
            console.warn("Falha ao salvar stats do time", e);
        }
    }

    gainXp(amount) {
        const oldLevel = this.level;
        this.xp += amount;
        const details = window.gameConfig.getXpDetails(this.xp);
        this.level = details.level;
        this.saveStats();

        if (this.level > oldLevel) {
            this.totalLevelUps += (this.level - oldLevel);
            if (this.scene.uiManager && this.scene.uiManager.updateLevelUpsDisplay) {
                this.scene.uiManager.updateLevelUpsDisplay();
                if (this.scene.uiManager.flashLevelUpsDisplay) {
                    this.scene.uiManager.flashLevelUpsDisplay();
                }
            }
            if (this.scene.spawnNewTeamMember) {
                this.scene.spawnNewTeamMember();
            }
        }
        
        // Retorna true se subiu de nível
        return this.level > oldLevel;
    }

    gainMoney(amount) {
        this.money += amount;
        this.saveStats();
        if (this.scene.uiManager && this.scene.uiManager.updateMoneyDisplay) {
            this.scene.uiManager.updateMoneyDisplay();
        }
    }

    canAddItem(itemKey) {
        const uniqueItems = new Set(this.inventory.filter(i => i));
        const isNewItem = !uniqueItems.has(itemKey);
        return !isNewItem || uniqueItems.size < this.maxInventorySlots;
    }

    addItem(itemKey) {
        if (this.canAddItem(itemKey)) {
            this.inventory.push(itemKey);
            this.saveStats();
            return true;
        }
        return false;
    }

    moveToStash(index) {
        if (index >= 0 && index < this.inventory.length) {
            const item = this.inventory.splice(index, 1)[0];
            this.stash.push(item);
            this.saveStats();
            return true;
        }
        return false;
    }

    moveFromStash(index) {
        if (this.inventory.length >= this.maxInventorySlots) return false;
        if (index >= 0 && index < this.stash.length) {
            const item = this.stash.splice(index, 1)[0];
            this.inventory.push(item);
            this.saveStats();
            return true;
        }
        return false;
    }
}
