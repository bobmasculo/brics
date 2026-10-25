// /var/www/html/brics/GridManager.js
export default class GridManager {
    constructor(scene, tileWidth, tileHeight) {
        this.scene = scene;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.obstacles = [];
        this.easystar = null; // Instância do EasyStar
        this.grid = [];       // A grade para o pathfinding
    }

    create() {
        // Coleta todos os obstáculos de diferentes gerenciadores para futuras checagens
        const scenarioObs = this.scene.scenarioManager ? this.scene.scenarioManager.getObstacles() : null;
        const interiorObs = this.scene.interiorsManager ? this.scene.interiorsManager.getObstacles() : null;

        if (scenarioObs) this.obstacles.push(...scenarioObs.getChildren());
        if (interiorObs) this.obstacles.push(...interiorObs.getChildren());

        // --- A* Pathfinding Initialization ---
        if (window.EasyStar) {
            this.easystar = new EasyStar.js();

            // 1. Cria a grade baseada no tamanho do mundo
            const gridWidth = Math.floor(window.gameConfig.MAP_WIDTH / this.tileWidth);
            const gridHeight = Math.floor(window.gameConfig.MAP_HEIGHT / this.tileHeight);
            this.grid = Array(gridHeight).fill(0).map(() => Array(gridWidth).fill(0));

            // 2. Marca os obstáculos na grade
            this.obstacles.forEach(obstacle => {
                // Pega os limites do corpo físico do obstáculo
                const bounds = obstacle.body || obstacle.getBounds();
                const startCol = Math.floor(bounds.left / this.tileWidth);
                const endCol = Math.ceil(bounds.right / this.tileWidth);
                const startRow = Math.floor(bounds.top / this.tileHeight);
                const endRow = Math.ceil(bounds.bottom / this.tileHeight);

                for (let r = startRow; r < endRow; r++) {
                    for (let c = startCol; c < endCol; c++) {
                        if (this.grid[r] && this.grid[r][c] !== undefined) {
                            this.grid[r][c] = 1; // 1 = Obstáculo
                        }
                    }
                }
            });

            // 3. Configura o EasyStar
            this.easystar.setGrid(this.grid);
            this.easystar.setAcceptableTiles([0]); // 0 é caminhável
            this.easystar.enableDiagonals();
            this.easystar.setIterationsPerCalculation(1000); // Ajuste de performance
        } else {
            console.warn("Biblioteca EasyStar.js não encontrada. Pathfinding não funcionará.");
        }
    }

    // Converte coordenadas do mundo (como clique do mouse) para índices da grade
    worldToGrid(worldX, worldY) {
        const i = Math.floor(worldX / this.tileWidth);
        const j = Math.floor(worldY / this.tileHeight);
        return { i, j };
    }

    // Converte índices da grade para coordenadas do mundo (centro da célula)
    gridToWorld(i, j) {
        const worldX = i * this.tileWidth + this.tileWidth / 2;
        const worldY = j * this.tileHeight + this.tileHeight / 2;
        return { x: worldX, y: worldY };
    }

    // Ajusta coordenadas do mundo para o centro da célula da grade mais próxima
    snapToGrid(worldX, worldY) {
        const gridCoords = this.worldToGrid(worldX, worldY);
        // Verifica se a célula é caminhável antes de retornar (lógica futura para pathfinding)
        // Por agora, apenas retorna o centro.
        return this.gridToWorld(gridCoords.i, gridCoords.j);
    }

    // Novo método para encontrar um caminho usando A*
    findPath(startWorldX, startWorldY, endWorldX, endWorldY, callback) {
        if (!this.easystar) {
            callback(null); // Retorna nulo se o pathfinder não estiver disponível
            return;
        }

        // Obtém as dimensões da grade para validação (Scope check)
        const gridHeight = this.grid.length;
        const gridWidth = (this.grid.length > 0) ? this.grid[0].length : 0;

        if (gridWidth === 0 || gridHeight === 0) {
            callback(null);
            return;
        }

        // Converte coordenadas do mundo para grade e CLAMPA para evitar o erro "outside scope"
        let startI = Phaser.Math.Clamp(Math.floor(startWorldX / this.tileWidth), 0, gridWidth - 1);
        let startJ = Phaser.Math.Clamp(Math.floor(startWorldY / this.tileHeight), 0, gridHeight - 1);

        let endI = Phaser.Math.Clamp(Math.floor(endWorldX / this.tileWidth), 0, gridWidth - 1);
        let endJ = Phaser.Math.Clamp(Math.floor(endWorldY / this.tileHeight), 0, gridHeight - 1);

        this.easystar.findPath(startI, startJ, endI, endJ, (path) => {
            if (path === null) {
                callback(null);
            } else {
                // Converte o caminho da grade de volta para coordenadas do mundo
                const worldPath = path.map(p => this.gridToWorld(p.x, p.y));
                callback(worldPath);
            }
        });

        // Essencial: Inicia o cálculo do caminho
        this.easystar.calculate();
    }
}