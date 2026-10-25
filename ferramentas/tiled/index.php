<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Tiled Mini PHP - Editor de Mapas para Phaser</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #2a2a2a;
            color: white;
            margin: 0;
            padding: 20px;
            display: flex;
            height: 100vh;
            box-sizing: border-box;
        }
        
        #container {
            display: flex;
            gap: 20px;
            width: 100%;
            height: 100%;
        }
        
        #painel {
            background: #3a3a3a;
            padding: 20px;
            border-radius: 8px;
            width: 320px;
            overflow-y: auto;
            flex-shrink: 0;
        }
        
        #mapa-container {
            flex-grow: 1;
            background: #1a1a1a;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }
        
        #mapa-wrapper {
            flex-grow: 1;
            overflow: auto;
            position: relative;
            background: #0a0a0a;
            background-image: 
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
            background-size: 20px 20px;
        }
        
        #mapa-grid {
            display: grid;
            gap: 1px;
            position: relative;
            transform-origin: top left;
        }
        
        .celula {
            width: var(--tile-width, 32px);
            height: var(--tile-height, 32px);
            background-size: cover;
            background-position: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: filter 0.1s;
            box-sizing: border-box;
        }
        
        .celula:hover {
            filter: brightness(1.2);
            border-color: yellow;
            z-index: 10;
        }
        
        .selecionado {
            border: 2px solid yellow !important;
            box-shadow: 0 0 5px yellow;
            z-index: 100;
        }
        
        #tileset {
            display: grid;
            grid-template-columns: repeat(4, 64px);
            gap: 10px;
            margin: 20px 0;
            max-height: 300px;
            overflow-y: auto;
            padding: 5px;
        }
        
        .tile {
            width: 64px;
            height: 64px;
            background-size: cover;
            border: 2px solid #555;
            cursor: pointer;
            transition: all 0.1s;
        }
        
        .tile:hover {
            border-color: #fff;
            transform: scale(1.05);
        }
        
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin: 5px 0;
            width: 100%;
        }
        
        button:hover {
            background: #45a049;
        }
        
        button.undo-btn {
            background: #ff9800;
        }
        
        button.undo-btn:hover {
            background: #f57c00;
        }
        
        input, select {
            width: 100%;
            padding: 8px;
            margin: 5px 0;
            border-radius: 4px;
            border: 1px solid #555;
            background: #2a2a2a;
            color: white;
        }
        
        .config-group {
            background: #444;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
        }
        
        .config-group label {
            display: block;
            margin: 10px 0 5px;
            color: #ddd;
        }
        
        .config-group small {
            color: #aaa;
            font-size: 11px;
            display: block;
            margin-top: 2px;
        }
        
        #output {
            background: #1a1a1a;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
            max-height: 150px;
            overflow-y: auto;
            font-size: 11px;
        }
        
        .status-bar {
            background: #444;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 13px;
        }
        
        .shortcut-info {
            color: #ff9800;
            font-size: 11px;
            margin-top: 5px;
        }
        
        .coordenadas {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 13px;
            z-index: 1000;
            border: 1px solid #4CAF50;
        }
        
        .zoom-controls {
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 5px;
            z-index: 1000;
            background: rgba(0,0,0,0.7);
            padding: 5px;
            border-radius: 8px;
        }
        
        .zoom-btn {
            width: 35px;
            height: 35px;
            background: #4CAF50;
            border: none;
            border-radius: 4px;
            color: white;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .zoom-btn:hover {
            background: #45a049;
        }
        
        #info-mapa {
            background: #2a2a2a;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
            border-left: 4px solid #4CAF50;
        }
        
        #info-mapa div {
            margin: 5px 0;
        }
        
        .highlight {
            color: #4CAF50;
            font-weight: bold;
        }
        
        .tamanho-real {
            background: #333;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
            font-size: 18px;
            margin: 10px 0;
        }
        
        .aviso {
            color: #ff9800;
            font-size: 12px;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="painel">
            <h2>🎨 Tiled Mini PHP</h2>
            
            <div class="status-bar">
                <strong>📊 Status:</strong> <span id="undo-status">0 ações para desfazer</span>
                <div class="shortcut-info">⌨️ Ctrl+Z = Undo</div>
            </div>
            
            <div class="config-group">
                <h3>📏 Tamanho do Mapa (PIXELS)</h3>
                
                <label>Largura (pixels):</label>
                <input type="number" id="map-width-px" min="32" max="5000" value="1920" step="32">
                <small>Largura total do mapa em pixels</small>
                
                <label>Altura (pixels):</label>
                <input type="number" id="map-height-px" min="32" max="5000" value="1080" step="32">
                <small>Altura total do mapa em pixels</small>
                
                <label>🎲 Tamanho do Tile (px):</label>
                <input type="number" id="tile-size" min="8" max="128" value="32" step="8">
                <small>Tamanho de cada tile em pixels</small>
                
                <button onclick="calcularEAtualizar()">🔄 Calcular e Atualizar</button>
            </div>
            
            <div id="info-mapa">
                <div><strong>📐 Dimensões em Tiles:</strong></div>
                <div>Largura: <span id="tiles-largura" class="highlight">60</span> tiles</div>
                <div>Altura: <span id="tiles-altura" class="highlight">33</span> tiles</div>
                <div>Total: <span id="tiles-total" class="highlight">1980</span> tiles</div>
                
                <div class="tamanho-real">
                    <strong>📏 Tamanho Real:</strong><br>
                    <span id="tamanho-real-mostrar">1920 x 1080 px</span>
                </div>
            </div>
            
            <div class="config-group">
                <h3>🎨 Tiles Disponíveis</h3>
                <div id="tileset"></div>
            </div>
            
            <button onclick="criarNovoMapa()">✨ Criar Novo Mapa</button>
            <button onclick="limparMapa()">🧹 Limpar Mapa</button>
            <button class="undo-btn" onclick="desfazer()" id="undo-btn" disabled>↩️ Desfazer (Ctrl+Z)</button>
            <button onclick="exportarJSON()">💾 Exportar JSON para Phaser</button>
            
            <h3>📋 Prévia do JSON:</h3>
            <div id="output"></div>
        </div>
        
        <div id="mapa-container">
            <div class="zoom-controls">
                <button class="zoom-btn" onclick="zoom(0.8)">−</button>
                <span style="color: white; padding: 5px 10px; min-width: 60px; text-align: center;" id="zoom-level">100%</span>
                <button class="zoom-btn" onclick="zoom(1.2)">+</button>
                <button class="zoom-btn" onclick="zoom(1)">↺</button>
            </div>
            
            <div id="mapa-wrapper">
                <div id="mapa-grid"></div>
            </div>
            
            <div class="coordenadas" id="coordenadas">
                🖱️ Tile: --, -- | Pixel: --, --
            </div>
        </div>
    </div>

    <script>
        // Configuração inicial
        let mapaAtual = [];
        let tileSelecionado = 0;
        let larguraMapaPixels = 1920;
        let alturaMapaPixels = 1080;
        let tileSize = 32;
        let larguraMapaTiles = 60;  // 1920/32
        let alturaMapaTiles = 33;    // 1080/32 (arredondado)
        
        // Zoom
        let zoomLevel = 1;
        
        // Sistema de Undo
        let historicoUndo = [];
        let maxHistorico = 50;
        
        // Seus tiles (substitua pelos caminhos das suas imagens)
        const tiles = [
            { id: 0, nome: 'Vazio', cor: '#333' },
            { id: 1, nome: 'Grama', arquivo: 'grama.png' },
            { id: 2, nome: 'Terra', arquivo: 'terra.png' },
            { id: 3, nome: 'Pedra', arquivo: 'pedra.png' },
            { id: 4, nome: 'Água', arquivo: 'agua.png' },
            { id: 5, nome: 'Areia', arquivo: 'areia.png' },
            { id: 6, nome: 'Madeira', arquivo: 'madeira.png' },
            { id: 7, nome: 'Gelo', arquivo: 'gelo.png' }
        ];
        
        // Inicialização
        window.onload = function() {
            criarTileset();
            calcularTiles();
            criarNovoMapa();
            
            // Event listener para Ctrl+Z
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'z') {
                    e.preventDefault();
                    desfazer();
                }
            });
            
            // Mostrar coordenadas ao mover o mouse
            document.getElementById('mapa-wrapper').addEventListener('mousemove', function(e) {
                const grid = document.getElementById('mapa-grid');
                const rect = grid.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                if (mouseX >= 0 && mouseY >= 0) {
                    const tileX = Math.floor(mouseX / (tileSize * zoomLevel));
                    const tileY = Math.floor(mouseY / (tileSize * zoomLevel));
                    
                    if (tileX >= 0 && tileX < larguraMapaTiles && tileY >= 0 && tileY < alturaMapaTiles) {
                        document.getElementById('coordenadas').innerHTML = 
                            `🖱️ Tile: ${tileX}, ${tileY} | Pixel: ${Math.floor(mouseX / zoomLevel)}, ${Math.floor(mouseY / zoomLevel)}`;
                    }
                }
            });
        };
        
        function criarTileset() {
            const tilesetDiv = document.getElementById('tileset');
            tilesetDiv.innerHTML = '';
            
            tiles.forEach(tile => {
                const tileDiv = document.createElement('div');
                tileDiv.className = 'tile';
                tileDiv.dataset.id = tile.id;
                tileDiv.style.backgroundColor = tile.cor;
                if (tile.arquivo) {
                    tileDiv.style.backgroundImage = `url('${tile.arquivo}')`;
                }
                tileDiv.title = tile.nome;
                tileDiv.onclick = () => selecionarTile(tile.id);
                tilesetDiv.appendChild(tileDiv);
            });
            
            selecionarTile(0);
        }
        
        function selecionarTile(id) {
            tileSelecionado = id;
            
            document.querySelectorAll('.tile').forEach(tile => {
                tile.classList.remove('selecionado');
                if (parseInt(tile.dataset.id) === id) {
                    tile.classList.add('selecionado');
                }
            });
        }
        
        function calcularTiles() {
            larguraMapaPixels = parseInt(document.getElementById('map-width-px').value);
            alturaMapaPixels = parseInt(document.getElementById('map-height-px').value);
            tileSize = parseInt(document.getElementById('tile-size').value);
            
            // Calcular número de tiles (arredondar para cima para cobrir toda a área)
            larguraMapaTiles = Math.ceil(larguraMapaPixels / tileSize);
            alturaMapaTiles = Math.ceil(alturaMapaPixels / tileSize);
            
            // Ajustar pixels para o tamanho exato (múltiplo do tile)
            larguraMapaPixels = larguraMapaTiles * tileSize;
            alturaMapaPixels = alturaMapaTiles * tileSize;
            
            // Atualizar inputs com valores ajustados
            document.getElementById('map-width-px').value = larguraMapaPixels;
            document.getElementById('map-height-px').value = alturaMapaPixels;
            
            // Atualizar informações
            document.getElementById('tiles-largura').textContent = larguraMapaTiles;
            document.getElementById('tiles-altura').textContent = alturaMapaTiles;
            document.getElementById('tiles-total').textContent = larguraMapaTiles * alturaMapaTiles;
            document.getElementById('tamanho-real-mostrar').innerHTML = 
                `${larguraMapaPixels} x ${alturaMapaPixels} px`;
            
            // Atualizar CSS variables
            document.documentElement.style.setProperty('--tile-width', (tileSize * zoomLevel) + 'px');
            document.documentElement.style.setProperty('--tile-height', (tileSize * zoomLevel) + 'px');
        }
        
        function calcularEAtualizar() {
            calcularTiles();
            criarNovoMapa();
        }
        
        function criarNovoMapa() {
            // Criar matriz com as dimensões calculadas
            mapaAtual = [];
            for (let y = 0; y < alturaMapaTiles; y++) {
                mapaAtual[y] = [];
                for (let x = 0; x < larguraMapaTiles; x++) {
                    mapaAtual[y][x] = 0;
                }
            }
            
            historicoUndo = [];
            atualizarStatusUndo();
            renderizarMapa();
        }
        
        function limparMapa() {
            salvarEstadoHistorico();
            
            for (let y = 0; y < alturaMapaTiles; y++) {
                for (let x = 0; x < larguraMapaTiles; x++) {
                    mapaAtual[y][x] = 0;
                }
            }
            renderizarMapa();
        }
        
        function salvarEstadoHistorico() {
            const estadoAtual = JSON.parse(JSON.stringify(mapaAtual));
            historicoUndo.push(estadoAtual);
            
            if (historicoUndo.length > maxHistorico) {
                historicoUndo.shift();
            }
            
            atualizarStatusUndo();
        }
        
        function desfazer() {
            if (historicoUndo.length > 0) {
                const ultimoEstado = historicoUndo.pop();
                mapaAtual = JSON.parse(JSON.stringify(ultimoEstado));
                renderizarMapa();
                atualizarStatusUndo();
            }
        }
        
        function atualizarStatusUndo() {
            const undoBtn = document.getElementById('undo-btn');
            const undoStatus = document.getElementById('undo-status');
            
            if (historicoUndo.length > 0) {
                undoBtn.disabled = false;
                undoStatus.innerHTML = `${historicoUndo.length} ação(ões) para desfazer`;
            } else {
                undoBtn.disabled = true;
                undoStatus.innerHTML = '0 ações para desfazer';
            }
        }
        
        function zoom(fator) {
            if (fator === 1) {
                zoomLevel = 1;
            } else {
                zoomLevel *= fator;
            }
            zoomLevel = Math.max(0.1, Math.min(3, zoomLevel));
            
            document.documentElement.style.setProperty('--tile-width', (tileSize * zoomLevel) + 'px');
            document.documentElement.style.setProperty('--tile-height', (tileSize * zoomLevel) + 'px');
            
            document.getElementById('zoom-level').textContent = Math.round(zoomLevel * 100) + '%';
            
            renderizarMapa();
        }
        
        function renderizarMapa() {
            const grid = document.getElementById('mapa-grid');
            
            // Calcular tamanho total do mapa em pixels (considerando zoom)
            const larguraTotal = larguraMapaTiles * tileSize * zoomLevel;
            const alturaTotal = alturaMapaTiles * tileSize * zoomLevel;
            
            grid.style.width = larguraTotal + 'px';
            grid.style.height = alturaTotal + 'px';
            grid.style.gridTemplateColumns = `repeat(${larguraMapaTiles}, ${tileSize * zoomLevel}px)`;
            grid.innerHTML = '';
            
            for (let y = 0; y < alturaMapaTiles; y++) {
                for (let x = 0; x < larguraMapaTiles; x++) {
                    const celula = document.createElement('div');
                    celula.className = 'celula';
                    celula.dataset.x = x;
                    celula.dataset.y = y;
                    
                    const tileId = mapaAtual[y][x];
                    if (tileId > 0 && tiles[tileId]) {
                        const tile = tiles[tileId];
                        if (tile.arquivo) {
                            celula.style.backgroundImage = `url('${tile.arquivo}')`;
                        } else {
                            celula.style.backgroundColor = tile.cor;
                        }
                    } else {
                        celula.style.backgroundColor = '#333';
                    }
                    
                    celula.onclick = () => pintarCelula(x, y);
                    celula.onmouseover = (e) => {
                        if (e.buttons === 1) {
                            pintarCelula(x, y);
                        }
                    };
                    
                    grid.appendChild(celula);
                }
            }
        }
        
        function pintarCelula(x, y) {
            if (mapaAtual[y][x] !== tileSelecionado) {
                salvarEstadoHistorico();
                mapaAtual[y][x] = tileSelecionado;
                renderizarMapa();
            }
        }
        
        function exportarJSON() {
            // Formato compatível com Phaser
            const mapaJSON = {
                width: larguraMapaTiles,
                height: alturaMapaTiles,
                tilewidth: tileSize,
                tileheight: tileSize,
                pixelWidth: larguraMapaPixels,
                pixelHeight: alturaMapaPixels,
                layers: [{
                    name: "camada1",
                    type: "tilelayer",
                    width: larguraMapaTiles,
                    height: alturaMapaTiles,
                    data: []
                }],
                tilesets: [{
                    name: "meus_tiles",
                    tilewidth: tileSize,
                    tileheight: tileSize,
                    tiles: []
                }]
            };
            
            // Converter matriz 2D para array 1D
            for (let y = 0; y < alturaMapaTiles; y++) {
                for (let x = 0; x < larguraMapaTiles; x++) {
                    mapaJSON.layers[0].data.push(mapaAtual[y][x]);
                }
            }
            
            // Adicionar informações dos tiles
            tiles.forEach(tile => {
                if (tile.id > 0) {
                    mapaJSON.tilesets[0].tiles.push({
                        id: tile.id,
                        image: tile.arquivo,
                        name: tile.nome
                    });
                }
            });
            
            // Mostrar JSON
            document.getElementById('output').textContent = 
                JSON.stringify(mapaJSON, null, 2);
            
            // Download do arquivo
            const blob = new Blob([JSON.stringify(mapaJSON)], 
                { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mapa_${larguraMapaPixels}x${alturaMapaPixels}.json`;
            a.click();
        }
    </script>
</body>
</html>
