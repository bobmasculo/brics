export default class InteriorsManager {
    constructor(scene) {
        this.scene = scene;
        this.entrances = null;
        this.exits = null;
        this.interiorObstacles = null;
        this.teleportingThisFrame = false; // Evita teleporte múltiplo no mesmo frame
    }

    create() {
        // Usar staticGroup para zonas que não se movem e evitar conflitos de física
        this.entrances = this.scene.physics.add.staticGroup();
        this.exits = this.scene.physics.add.staticGroup();
        this.interiorObstacles = this.scene.physics.add.staticGroup();

        if (window.gameConfig.INTERIORS) {
            window.gameConfig.INTERIORS.forEach(interior => {
                // --- LADO DE FORA (Entrada) ---
                // Cria uma zona transparente sobre a entrada
                const entrance = this.scene.add.rectangle(interior.x, interior.y, interior.width, interior.height, 0x00ff00, 0.0);
                this.scene.physics.add.existing(entrance, true); // Adiciona corpo físico estático para detecção de overlap
                entrance.interiorData = interior;
                this.entrances.add(entrance);

                // --- LADO DE DENTRO (Interior) ---
                
                // 0. Criar fundo preto para isolar o interior do mapa principal
                // Fica entre o mapa (-100) e o chão do interior (-10)
                this.scene.add.rectangle(
                    interior.inside.spawnX, 
                    interior.inside.spawnY, 
                    2000, // Tamanho grande o suficiente para cobrir a câmera
                    2000, 
                    0x000000
                ).setDepth(-50);

                // 1. Criar o chão do interior
                if (interior.inside.floor && this.scene.textures.exists(interior.inside.floor)) {
                    const floor = this.scene.add.image(interior.inside.spawnX, interior.inside.spawnY, interior.inside.floor);
                    floor.setDepth(-10);
                    
                    // Redimensiona o chão para ocupar todo o tamanho definido
                    if (interior.inside.width && interior.inside.height) {
                        floor.setDisplaySize(interior.inside.width, interior.inside.height);
                    }
                }

                // 2. Criar limites (paredes invisíveis) para não sair do interior
                if (interior.inside.width && interior.inside.height) {
                    const w = interior.inside.width;
                    const h = interior.inside.height;
                    const x = interior.inside.spawnX;
                    const y = interior.inside.spawnY;
                    const thickness = 50; // Espessura da parede

                    // Cria 4 retângulos ao redor da área
                    const walls = [
                        this.scene.add.rectangle(x, y - h/2 - thickness/2, w + thickness*2, thickness, 0x000000, 0), // Topo
                        this.scene.add.rectangle(x, y + h/2 + thickness/2, w + thickness*2, thickness, 0x000000, 0), // Baixo
                        this.scene.add.rectangle(x - w/2 - thickness/2, y, thickness, h, 0x000000, 0), // Esquerda
                        this.scene.add.rectangle(x + w/2 + thickness/2, y, thickness, h, 0x000000, 0)  // Direita
                    ];

                    walls.forEach(wall => {
                        this.scene.physics.add.existing(wall, true); // Cria corpo estático
                        this.interiorObstacles.add(wall); // Adiciona ao grupo de colisão
                    });
                }

                // Cria o texto "SAIR" no chão do interior
                this.scene.add.text(interior.inside.exitX, interior.inside.exitY, 'SAIR', { 
                    fontSize: '20px', 
                    fontFamily: 'Arial',
                    fill: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 10, y: 5 }
                }).setOrigin(0.5).setDepth(10);

                // Cria a zona de saída (trigger) perto do texto SAIR
                const exit = this.scene.add.rectangle(interior.inside.exitX, interior.inside.exitY, 150, 150, 0xff0000, 0.0);
                this.scene.physics.add.existing(exit, true); // Adiciona corpo físico estático para detecção de overlap
                exit.interiorData = interior;
                this.exits.add(exit);

                // 3. Criar objetos do interior (Móveis, paredes, etc)
                if (interior.inside.objects) {
                    interior.inside.objects.forEach(obj => {
                        if (this.scene.textures.exists(obj.id)) {
                            let sceneObject;
                            if (obj.tipo === 'obstaculo') {
                                sceneObject = this.interiorObstacles.create(obj.x, obj.y, obj.id);
                            } else {
                                sceneObject = this.scene.add.image(obj.x, obj.y, obj.id);
                            }

                            // Propriedades comuns
                            if (obj.width && obj.height) {
                                sceneObject.setDisplaySize(obj.width, obj.height);
                                if (sceneObject.body) sceneObject.refreshBody();
                            }
                            if (obj.angle) {
                                sceneObject.setAngle(obj.angle);
                            }
                            // Depth sort simples para objetos internos
                            sceneObject.setDepth(obj.y);
                        } else {
                            console.warn(`InteriorsManager: Objeto interno '${obj.id}' não encontrado.`);
                        }
                    });
                }
            });
        }
    }

    update() {
        if (!this.entrances || !this.exits) return;

        // Reseta a flag no início de cada frame
        this.teleportingThisFrame = false;

        // Verifica colisão/sobreposição para todos os players ativos
        this.scene.players.forEach(player => {
            if (player.sprite && player.sprite.active) {
                // Verificar entrada
                this.scene.physics.overlap(player.sprite, this.entrances, (sprite, entrance) => {
                    if (!this.teleportingThisFrame) {
                        this.teleportingThisFrame = true;
                        this.enterInterior(player, entrance.interiorData);
                    }
                });

                // Verificar saída
                this.scene.physics.overlap(player.sprite, this.exits, (sprite, exit) => {
                    if (!this.teleportingThisFrame) {
                        this.teleportingThisFrame = true;
                        this.exitInterior(player, exit.interiorData);
                    }
                });
            }
        });
    }

    enterInterior(player, data) {
        const livingPlayers = this.scene.players.filter(p => p.health > 0 && p.sprite && p.sprite.active);
        let firstPlayerTeleported = null;

        livingPlayers.forEach((p, index) => {
            // Offset para não empilhar (formação simples)
            const offsetX = (index % 3) * 40 - 40; // -40, 0, 40
            const offsetY = Math.floor(index / 3) * 40 - 40;

            const targetX = data.inside.spawnX + offsetX;
            const targetY = data.inside.spawnY + offsetY;

            p.sprite.setPosition(targetX, targetY);
            p.sprite.body.reset(targetX, targetY);
            this.stopPlayerMovement(p);

            if (!firstPlayerTeleported) firstPlayerTeleported = p;
        });

        if (firstPlayerTeleported) {
            this.scene.cameras.main.removeBounds(); // Libera a câmera para ver o interior
            this.scene.cameras.main.centerOn(data.inside.spawnX, data.inside.spawnY);
            this.scene.uiManager.updateStatus(`Entrou em: ${data.id}`);
        }
    }

    exitInterior(player, data) {
        const livingPlayers = this.scene.players.filter(p => p.health > 0 && p.sprite && p.sprite.active);
        let firstPlayerTeleported = null;

        livingPlayers.forEach((p, index) => {
            const offsetX = (index % 3) * 40 - 40;
            const offsetY = Math.floor(index / 3) * 40 - 40;

            const targetX = data.x + offsetX;
            const targetY = data.y + 250 + offsetY;

            p.sprite.setPosition(targetX, targetY);
            p.sprite.body.reset(targetX, targetY);
            this.stopPlayerMovement(p);

            if (!firstPlayerTeleported) firstPlayerTeleported = p;
        });

        if (firstPlayerTeleported) {
            // Restaura limites da câmera para o tamanho visual do mapa (3200x1800)
            const vw = window.gameConfig.VISUAL_MAP_WIDTH || 3200;
            const vh = window.gameConfig.VISUAL_MAP_HEIGHT || 1800;
            this.scene.cameras.main.setBounds(0, 0, vw, vh);
            this.scene.cameras.main.centerOn(firstPlayerTeleported.sprite.x, firstPlayerTeleported.sprite.y);
            this.scene.uiManager.updateStatus(`Saiu de: ${data.id}`);
        }
    }

    stopPlayerMovement(player) {
        player.isMoving = false;
        player.moveTarget = null;
        if (player.moveMarker) {
            player.moveMarker.destroy();
            player.moveMarker = null;
        }
    }

    getObstacles() {
        return this.interiorObstacles;
    }
}