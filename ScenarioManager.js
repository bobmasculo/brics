export default class ScenarioManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = null;
        this.debugGraphics = null;
        this.isDebugVisible = false;
    }

    preload() {
        if (window.gameConfig.SCENARIO_ASSETS) {
            Object.entries(window.gameConfig.SCENARIO_ASSETS).forEach(([key, path]) => {
                this.scene.load.image(key, path);
            });
        }
    } 

    create() {
        // Grupo estático para obstáculos (prédios, pedras, etc)
        this.obstacles = this.scene.physics.add.staticGroup();

        if (window.gameConfig.MAP_OBJECTS) {
            window.gameConfig.MAP_OBJECTS.forEach(obj => {
                if (this.scene.textures.exists(obj.id)) {
                    let sceneObject;

                    if (obj.tipo === 'obstaculo') {
                        // Suporte a obstáculo definido por vértices (obj.type === 'fromVertices')
                        if (obj.type === 'fromVertices' && obj.verts && Array.isArray(obj.verts) && obj.verts.length > 0) {
                            // Escala recomendada: aplica `vertsScale` (ou `scale`) aos vértices
                            const vertsScale = (typeof obj.vertsScale !== 'undefined') ? Number(obj.vertsScale) : ((typeof obj.scale !== 'undefined') ? Number(obj.scale) : 1);
                            // Converte verts (assumidos relativos ao centro) em pontos do Phaser Polygon
                            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                            const pts = [];
                            for (let i = 0; i < obj.verts.length; i++) {
                                const v = obj.verts[i];
                                let vx = Number(v.x) || 0;
                                let vy = Number(v.y) || 0;
                                // Aplica escala aos vértices (recomendado pelo usuário)
                                vx = vx * vertsScale;
                                vy = vy * vertsScale;
                                pts.push(vx, vy);
                                if (vx < minX) minX = vx;
                                if (vy < minY) minY = vy;
                                if (vx > maxX) maxX = vx;
                                if (vy > maxY) maxY = vy;
                            }

                            const width = Math.max(1, Math.round(maxX - minX));
                            const height = Math.max(1, Math.round(maxY - minY));

                            // Desenha o polígono visual centralizado em obj.x,obj.y
                            // Alterado: Invisível por padrão, pois serve apenas para colisão
                            const polyVis = this.scene.add.polygon(obj.x, obj.y, pts, 0x999999, 0);
                            polyVis.setVisible(false);
                            polyVis.setOrigin(0.5, 0.5);
                            if (typeof obj.angle !== 'undefined') {
                                try { polyVis.setAngle(Number(obj.angle)); } catch (e) { }
                            }
                            polyVis.setDepth(obj.y + 1);

                            // Por padrão, NÃO criamos um AABB central que cubra todo o polígono,
                            // pois isso gerava colisões quadradas. Em vez disso, criamos apenas
                            // colliders de aproximação nos vértices/meios das arestas. Se o
                            // comportamento antigo for necessário, defina `keepAABB: true` no objeto.
                            const keepAABB = !!obj.keepAABB;

                            // Aproximação com múltiplos corpos: cria colliders pequenos em vértices e meios de arestas
                            try {
                                const approx = (typeof obj.colliderApprox !== 'undefined') ? obj.colliderApprox : 'both';
                                const vertsLen = pts.length / 2;
                                const collidersCreated = [];
                                const baseRadius = (typeof obj.colliderRadius !== 'undefined') ? Number(obj.colliderRadius) : Math.max(4, Math.round(6 * (vertsScale || 1)));

                                for (let vi = 0; vi < vertsLen; vi++) {
                                    const vx = pts[vi * 2];
                                    const vy = pts[vi * 2 + 1];
                                    const worldX = obj.x + vx;
                                    const worldY = obj.y + vy;

                                    if (approx === 'vertices' || approx === 'both') {
                                        const c = this.scene.add.circle(worldX, worldY, baseRadius, 0x000000, 0);
                                        this.scene.physics.add.existing(c, true);
                                        try { this.obstacles.add(c); } catch (e) { }
                                        c._isApprox = true;
                                        collidersCreated.push(c);
                                    }

                                    if (approx === 'edges' || approx === 'both') {
                                        const ni = (vi + 1) % vertsLen;
                                        const nx = pts[ni * 2];
                                        const ny = pts[ni * 2 + 1];
                                        const mx = obj.x + ((vx + nx) / 2);
                                        const my = obj.y + ((vy + ny) / 2);
                                        const c2 = this.scene.add.circle(mx, my, baseRadius, 0x000000, 0);
                                        this.scene.physics.add.existing(c2, true);
                                        try { this.obstacles.add(c2); } catch (e) { }
                                        c2._isApprox = true;
                                        collidersCreated.push(c2);
                                    }
                                }

                                // Se o usuário solicitou manter o AABB central, cria-o e guarda as aproximações
                                if (keepAABB) {
                                    const rect = this.scene.add.rectangle(obj.x, obj.y, width, height, 0x000000, 0);
                                    this.scene.physics.add.existing(rect, true);
                                    try {
                                        const rb = rect.body;
                                        if (rb && typeof rb.setSize === 'function') rb.setSize(width, height);
                                        else if (rb) { rb.width = width; rb.height = height; }
                                    } catch (e) { }
                                    try { this.obstacles.add(rect); } catch (e) { }
                                    rect._visual = polyVis;
                                    rect._approxColliders = collidersCreated;
                                    sceneObject = rect;
                                } else {
                                    // Sem AABB central: use o primeiro collider criado como referência
                                    if (collidersCreated.length > 0) {
                                        sceneObject = collidersCreated[0];
                                        // marque referência visual para facilitar debug
                                        sceneObject._visual = polyVis;
                                        sceneObject._approxColliders = collidersCreated;
                                    } else {
                                        // fallback: cria um corpo mínimo no centro para representar o objeto
                                        const fallback = this.scene.add.circle(obj.x, obj.y, Math.max(2, baseRadius), 0x000000, 0);
                                        this.scene.physics.add.existing(fallback, true);
                                        try { this.obstacles.add(fallback); } catch (e) { }
                                        fallback._visual = polyVis;
                                        sceneObject = fallback;
                                    }
                                }
                            } catch (e) { }

                        // Suporte a obstáculo poligonal via config: se fornecer `sides` e `radius`
                        } else if (typeof obj.sides === 'number' && typeof obj.radius === 'number') {
                            // Cria visual do polígono (GameObjects.Polygon)
                            const sides = Math.max(3, Math.floor(obj.sides));
                            const radius = Math.max(1, Number(obj.radius));
                            const pts = [];
                            for (let i = 0; i < sides; i++) {
                                const a = (Math.PI * 2 * i) / sides;
                                pts.push(Math.cos(a) * radius, Math.sin(a) * radius);
                            }
                            const polyVis = this.scene.add.polygon(obj.x, obj.y, pts, 0x999999, 1);
                            polyVis.setOrigin(0.5, 0.5);
                            // Aplica rotação visual se especificada
                            if (typeof obj.angle !== 'undefined') {
                                try { polyVis.setAngle(Number(obj.angle)); } catch (e) { }
                            }
                            // Cria um corpo físico aproximado por um círculo estático (para Arcade Physics)
                            const circle = this.scene.add.circle(obj.x, obj.y, radius, 0x000000, 0);
                            this.scene.physics.add.existing(circle, true);
                            // Ajusta corpo para ser circular, se disponível
                            try {
                                const cb = circle.body;
                                if (cb && typeof cb.setCircle === 'function') {
                                    cb.setCircle(radius);
                                    // centraliza offset
                                    if (typeof cb.setOffset === 'function') cb.setOffset(-radius, -radius);
                                } else if (cb) {
                                    cb.width = radius * 2;
                                    cb.height = radius * 2;
                                }
                            } catch (e) { }
                            // Adiciona o collider ao grupo de obstáculos para colidir com jogadores/tiros
                            try { this.obstacles.add(circle); } catch (e) { }
                            // Guarda referências
                            circle._visual = polyVis;
                            sceneObject = circle;
                        } else {
                            // Adiciona ao grupo de física para ter colisão (sprite baseado em textura)
                            sceneObject = this.obstacles.create(obj.x, obj.y, obj.id);
                        }
                    } else if (obj.tipo === 'cenario') {
                        // Adiciona como uma imagem normal, sem física e sem colisão
                        sceneObject = this.scene.add.image(obj.x, obj.y, obj.id);
                        // Segurança: força a ausência de corpo físico caso algum código tenha adicionado
                        try {
                            if (sceneObject.body) {
                                if (this.scene.physics && this.scene.physics.world && typeof this.scene.physics.world.disable === 'function') {
                                    this.scene.physics.world.disable(sceneObject);
                                } else {
                                    try { delete sceneObject.body; } catch (e) { sceneObject.body = null; }
                                }
                            }
                        } catch (e) { }
                    } else {
                        console.warn(`ScenarioManager: Tipo de objeto '${obj.tipo}' não reconhecido. Criando como cenário por padrão.`);
                        sceneObject = this.scene.add.image(obj.x, obj.y, obj.id);
                    }

                    // Aplica propriedades comuns
                    if (obj.width && obj.height) {
                        sceneObject.setDisplaySize(obj.width, obj.height);
                        // Apenas objetos de física precisam ter o corpo atualizado
                        if (sceneObject.body) {
                            // Determina tamanho exibido do objeto
                            const displayW = sceneObject.displayWidth || sceneObject.width || 0;
                            const displayH = sceneObject.displayHeight || sceneObject.height || 0;

                            // Se o config especificar bodyWidth/bodyHeight, usa; senão aplica redução padrão de 2% (mantém 98% do tamanho)
                            // Ou seja, por padrão o corpo ocupará 98% do display para ficar próximo ao visual.
                            let bw = (typeof obj.bodyWidth !== 'undefined') ? obj.bodyWidth : Math.max(1, Math.round(displayW * 0.98));
                            let bh = (typeof obj.bodyHeight !== 'undefined') ? obj.bodyHeight : Math.max(1, Math.round(displayH * 0.98));

                            // Offset: se fornecido, usa; caso contrário centraliza o corpo dentro do sprite
                            let ox = (typeof obj.bodyOffsetX !== 'undefined') ? obj.bodyOffsetX : Math.round((displayW - bw) / 2);
                            let oy = (typeof obj.bodyOffsetY !== 'undefined') ? obj.bodyOffsetY : Math.round((displayH - bh) / 2)
                            // Nota: não aplicamos ajustes baseados em ângulo aqui —
                            // manteremos o corpo axis-aligned padrão (sem rotacionar fisicamente).

                            // Aplicar tamanho/offset no body de forma robusta (StaticBody pode não expor setSize/setOffset)
                            const b = sceneObject.body;
                            try {
                                if (b.setSize && typeof b.setSize === 'function') {
                                    b.setSize(bw, bh);
                                } else {
                                    // Fallback: modifica propriedades diretamente
                                    if (typeof b.width !== 'undefined') b.width = bw;
                                    if (typeof b.height !== 'undefined') b.height = bh;
                                }

                                if (b.setOffset && typeof b.setOffset === 'function') {
                                    b.setOffset(ox, oy);
                                } else if (b.offset) {
                                    if (typeof b.offset.x !== 'undefined') b.offset.x = ox;
                                    if (typeof b.offset.y !== 'undefined') b.offset.y = oy;
                                } else if (typeof b.x !== 'undefined' && typeof b.y !== 'undefined') {
                                    // Some bodies use x/y directly (best-effort)
                                    b.x = sceneObject.x - sceneObject.displayOriginX * sceneObject.displayWidth + ox;
                                    b.y = sceneObject.y - sceneObject.displayOriginY * sceneObject.displayHeight + oy;
                                }
                            } catch (e) {
                                // Ignore problemas e continue — não queremos quebrar a criação do cenário
                            }

                            // Atualiza o corpo estático com os novos valores
                            if (sceneObject.refreshBody) sceneObject.refreshBody();
                        }
                    }
                    // Define a depth 2.5D do objeto antes de criar a imagem visual
                    try { sceneObject.setDepth(obj.y); } catch (e) { }

                    // Se houver ângulo configurado, aplicamos a rotação apenas visualmente.
                    // Para `obstaculo` criamos uma imagem visual rotacionada acima do corpo físico
                    // (mantendo o corpo axis-aligned do Arcade Physics). Para `cenario` aplicamos
                    // a rotação diretamente na imagem (não há corpo físico).
                    if (obj.angle) {
                        try {
                            // Aplica somente a rotação visual no objeto (não altera o corpo físico)
                            try { sceneObject.setAngle(Number(obj.angle)); } catch (e) { }
                            try { sceneObject.setVisible(true); } catch (e) { }
                        } catch (e) { }
                    }
                    // depth já aplicado acima

                    // --- EFEITO DE FUMAÇA (Configurável) ---
                    if (obj.smoke && obj.smoke.enabled) {
                        this.createSmokeEffect(sceneObject, obj.smoke);
                    }
                } else {
                    console.warn(`ScenarioManager: Textura '${obj.id}' não encontrada. Verifique SCENARIO_ASSETS no config.js.`);
                }
            });
        }
    }

    createSmokeEffect(target, config) {
        // Gera textura de fumaça branca se não existir (para permitir tint)
        if (!this.scene.textures.exists('env_smoke_white')) {
             const g = this.scene.make.graphics({x:0, y:0, add:false});
             g.fillStyle(0xffffff, 1); // Branca, opaca
             g.fillCircle(16,16,16);
             g.generateTexture('env_smoke_white', 32, 32);
             g.destroy();
        }

        const offX = (config.offset && config.offset.x) || 0;
        const offY = (config.offset && config.offset.y) || 0;
        
        // Cor configurável (Padrão: 0x555555 cinza)
        const smokeColor = (config.color !== undefined) ? config.color : 0x555555;
        
        const emitter = this.scene.add.particles(0, 0, 'env_smoke_white', {
            x: target.x + offX,
            y: target.y + offY,
            lifespan: config.lifespan || 4000,
            speedX: { min: -20, max: 20 },
            speedY: { min: -30, max: -80 }, // Sobe devagar
            scale: config.scale || { start: 0.5, end: 2.5 },
            alpha: { start: 0.3, end: 0 }, // Ajustado para 0.3 pois a textura agora é opaca
            frequency: config.frequency || 200, // Menor = mais fumaça
            quantity: config.quantity || 1,
            blendMode: 'NORMAL',
            tint: smokeColor // Aplica a cor configurada
        });
        
        // Define profundidade para ficar acima do objeto (efeito chaminé/incêndio)
        emitter.setDepth(target.depth + 100);

        // --- EFEITO DE LUZ (FOGO) ---
        if (config.light && config.light.enabled) {
            const lx = target.x + offX + (config.light.x || 0);
            const ly = target.y + offY + (config.light.y || 0);
            const color = config.light.color || 0xff6600;
            const radius = config.light.radius || 100;
            const intensity = config.light.intensity || 0.5;

            const light = this.scene.add.pointlight(lx, ly, color, radius, intensity);
            light.setDepth(target.depth + 99); // Um pouco abaixo da fumaça para iluminá-la por trás

            // Efeito de tremulação (Flicker) para simular fogo
            this.scene.tweens.add({
                targets: light,
                intensity: { from: intensity * 0.8, to: intensity * 1.2 },
                radius: { from: radius * 0.95, to: radius * 1.05 },
                duration: 80 + Math.random() * 50, // Rápido e irregular
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    toggleDebug() {
        this.isDebugVisible = !this.isDebugVisible;
        
        if (this.isDebugVisible) {
            this.drawDebugBodies();
        } else {
            if (this.debugGraphics) {
                this.debugGraphics.clear();
                this.debugGraphics.destroy();
                this.debugGraphics = null;
            }
        }
        
        if (window.gameConfig) window.gameConfig.DEBUG_DRAW_BODIES = this.isDebugVisible;
        return this.isDebugVisible;
    }

    drawDebugBodies() {
        if (!this.obstacles || !this.obstacles.getChildren) return;
        
        if (this.debugGraphics) {
            this.debugGraphics.clear();
        } else {
            this.debugGraphics = this.scene.add.graphics();
            this.debugGraphics.setDepth(99999);
        }
        
        const g = this.debugGraphics;
        g.lineStyle(2, 0xff0000, 0.9);

        const children = this.obstacles.getChildren();
        for (let i = 0; i < children.length; i++) {
            const c = children[i];
            if (!c) continue;

            // Tenta usar getBounds se disponível
            let rect = null;
            if (c.body) {
                const b = c.body;
                // Pega a posição global do corpo (Arcade Physics)
                rect = new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
            } else if (c.getBounds) {
                rect = c.getBounds();
            }
            
            if (rect) g.strokeRectShape(rect);
        }
    }

    getObstacles() {
        return this.obstacles;
    }
}