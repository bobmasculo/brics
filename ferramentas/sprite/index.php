<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Criador de Folha de Animação</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }

        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .app {
            display: grid;
            grid-template-columns: 350px 1fr;
            gap: 30px;
            padding: 30px;
        }

        .controls {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }

        .control-group {
            margin-bottom: 25px;
        }

        h2 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.3em;
            border-bottom: 2px solid #667eea;
            padding-bottom: 8px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }

        input[type="number"],
        input[type="file"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border 0.3s;
        }

        input[type="number"]:focus,
        input[type="file"]:focus {
            outline: none;
            border-color: #667eea;
        }

        .file-input {
            background: white;
            border: 2px dashed #667eea;
            text-align: center;
            padding: 25px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .file-input:hover {
            background: #f0f2ff;
            border-color: #764ba2;
        }

        button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.3s, box-shadow 0.3s;
            margin-top: 10px;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }

        button:active {
            transform: translateY(0);
        }

        .preview-container {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            min-height: 400px;
        }

        #gridPreview {
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            min-height: 300px;
            position: relative;
            overflow: hidden;
        }

        .image-preview {
            max-height: 400px;
            overflow-y: auto;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            padding: 15px;
            background: white;
        }

        .thumbnails {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
        }

        .thumbnail {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border: 2px solid #ddd;
            border-radius: 8px;
            transition: all 0.3s;
            cursor: pointer;
        }

        .thumbnail:hover {
            transform: scale(1.05);
            border-color: #667eea;
        }

        .grid-cell {
            position: absolute;
            border: 1px solid rgba(102, 126, 234, 0.3);
            background: rgba(102, 126, 234, 0.1);
            pointer-events: none;
        }

        .grid-number {
            position: absolute;
            top: 2px;
            left: 2px;
            font-size: 10px;
            color: #667eea;
            font-weight: bold;
            background: rgba(255, 255, 255, 0.7);
            padding: 1px 3px;
            border-radius: 3px;
        }

        .grid-filename {
            position: absolute;
            bottom: 2px;
            left: 2px;
            width: calc(100% - 4px);
            font-size: 10px;
            color: #333;
            background: rgba(255, 255, 255, 0.9);
            padding: 1px 3px;
            border-radius: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
            z-index: 2;
            pointer-events: auto;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 20px;
        }

        .stat-box {
            background: white;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }

        .stat-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #667eea;
        }

        .stat-label {
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
        }

        .canvas-container {
            margin-top: 20px;
            background: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }

        #spriteCanvas {
            max-width: 100%;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            background: white;
        }

        .download-btn {
            background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
            margin-top: 15px;
        }

        .message {
            padding: 15px;
            margin-top: 15px;
            border-radius: 10px;
            text-align: center;
            font-weight: 500;
            display: none;
        }

        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .options {
            background: white;
            padding: 15px;
            border-radius: 10px;
            margin-top: 15px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
        }

        .checkbox-group input[type="checkbox"] {
            width: 18px;
            height: 18px;
        }

        @media (max-width: 1024px) {
            .app {
                grid-template-columns: 1fr;
            }
            
            .controls {
                order: 2;
            }
            
            .preview-container {
                order: 1;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🖼️ Criador de Folha de Animação</h1>
            <p class="subtitle">Crie sprite sheets profissionais sem linhas de grade</p>
        </header>

        <div class="app">
            <div class="controls">
                <div class="control-group">
                    <h2>📐 Configurações do Frame</h2>
                    <label for="frameWidth">Largura do Frame (px):</label>
                    <input type="number" id="frameWidth" value="64" min="1">
                    
                    <label for="frameHeight">Altura do Frame (px):</label>
                    <input type="number" id="frameHeight" value="64" min="1">
                    
                    <label for="columns">Colunas na Grid:</label>
                    <input type="number" id="columns" value="4" min="1">
                    
                    <label for="rows">Linhas na Grid:</label>
                    <input type="number" id="rows" value="4" min="1">
                </div>

                <div class="control-group">
                    <h2>🎯 Opções de Saída</h2>
                    <div class="options">
                        <div class="checkbox-group">
                            <input type="checkbox" id="showGridPreview" checked>
                            <label for="showGridPreview">Mostrar grade na pré-visualização</label>
                        </div>
                        <div class="checkbox-group">
                            <input type="checkbox" id="transparentBg" checked>
                            <label for="transparentBg">Fundo transparente</label>
                        </div>
                        <div class="checkbox-group">
                            <input type="checkbox" id="centerImages" checked>
                            <label for="centerImages">Centralizar imagens nos frames</label>
                        </div>
                        <div class="checkbox-group">
                            <input type="checkbox" id="scaleToFit" checked>
                            <label for="scaleToFit">Redimensionar para caber no frame</label>
                        </div>
                    </div>
                </div>

                <div class="control-group">
                    <h2>🖼️ Importar Imagens</h2>
                    <div class="file-input" id="fileInput">
                        📁 Arraste e solte imagens aqui<br>ou clique para selecionar
                    </div>
                    <input type="file" id="imageUpload" accept="image/*" multiple style="display: none;">
                    <div id="fileOrderList" style="margin-top: 15px; padding: 10px; background: #f0f2ff; border-radius: 8px; font-size: 0.9em; max-height: 150px; overflow-y: auto; display: none;">
                        <strong>Ordem dos arquivos:</strong>
                        <ol style="margin-left: 20px; margin-top: 5px;"></ol>
                    </div>
                    <div class="thumbnails" id="thumbnails"></div>
                </div>

                <button id="generateGrid">🔲 Gerar Grid Preview</button>
                <button id="generateSpriteSheet">✨ Criar Folha de Animação</button>
                <button id="downloadSheet" class="download-btn" disabled>💾 Baixar Sprite Sheet</button>
                
                <div class="stats">
                    <div class="stat-box">
                        <div class="stat-value" id="frameCount">0</div>
                        <div class="stat-label">Frames</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value" id="imageCount">0</div>
                        <div class="stat-label">Imagens</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value" id="sheetSize">0x0</div>
                        <div class="stat-label">Tamanho Total</div>
                    </div>
                </div>
                
                <div id="message" class="message"></div>
            </div>

            <div class="preview-container">
                <h2>👁️ Visualização da Grid</h2>
                <div id="gridPreview"></div>
                
                <div class="canvas-container">
                    <h2>🎨 Sprite Sheet Resultante</h2>
                    <canvas id="spriteCanvas"></canvas>
                </div>
            </div>
        </div>
    </div>

    <script>
        class SpriteSheetCreator {
            constructor() {
                this.images = [];
                this.gridCells = [];
                this.canvas = document.getElementById('spriteCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.generateGrid();
            }

            setupEventListeners() {
                document.getElementById('imageUpload').addEventListener('change', (e) => this.handleImageUpload(e));
                document.getElementById('fileInput').addEventListener('click', () => document.getElementById('imageUpload').click());
                document.getElementById('generateGrid').addEventListener('click', () => this.generateGrid());
                document.getElementById('generateSpriteSheet').addEventListener('click', () => this.generateSpriteSheet());
                document.getElementById('downloadSheet').addEventListener('click', () => this.downloadSpriteSheet());

                // Drag and drop
                const fileInput = document.getElementById('fileInput');
                fileInput.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    fileInput.style.background = '#e8f0fe';
                });

                fileInput.addEventListener('dragleave', () => {
                    fileInput.style.background = '';
                });

                fileInput.addEventListener('drop', (e) => {
                    e.preventDefault();
                    fileInput.style.background = '';
                    this.handleFileDrop(e.dataTransfer.files);
                });

                // Update stats on input change
                ['frameWidth', 'frameHeight', 'columns', 'rows'].forEach(id => {
                    document.getElementById(id).addEventListener('input', () => this.updateStats());
                });
            }

            handleImageUpload(event) {
                const files = Array.from(event.target.files);
                this.loadImages(files);
            }

            handleFileDrop(files) {
                this.loadImages(Array.from(files));
            }

            loadImages(files) {
                const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
                
                if (validFiles.length === 0) {
                    this.showMessage('Por favor, selecione apenas arquivos de imagem!', 'error');
                    return;
                }

                this.showMessage(`Carregando ${validFiles.length} imagem(s)...`, 'success');

                const imagePromises = validFiles.map(file => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const img = new Image();
                            img.onload = () => {
                                img.filename = file.name;
                                resolve(img);
                            };
                            img.onerror = reject;
                            img.src = e.target.result;
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                });

                Promise.all(imagePromises).then(loadedImages => {
                    this.images = this.images.concat(loadedImages);
                    
                    // Ordenar todas as imagens pelo nome do arquivo (ordem natural: 1.jpg, 2.jpg, 10.jpg)
                    this.images.sort((a, b) => {
                        const nameA = a.filename || '';
                        const nameB = b.filename || '';
                        return nameA.localeCompare(nameB, undefined, {numeric: true, sensitivity: 'base'});
                    });

                    this.updateThumbnails();
                    this.updateFileList();
                    this.updateStats();
                    this.generateGrid();
                    this.showMessage(`${this.images.length} imagem(s) carregadas e ordenadas!`, 'success');
                }).catch(error => {
                    console.error(error);
                    this.showMessage('Erro ao carregar imagens.', 'error');
                });
            }

            updateThumbnails() {
                const container = document.getElementById('thumbnails');
                container.innerHTML = '';
                
                this.images.forEach((img, index) => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 80;
                    canvas.height = 80;
                    
                    // Draw image centered and scaled to fit
                    const scale = Math.min(80 / img.width, 80 / img.height);
                    const width = img.width * scale;
                    const height = img.height * scale;
                    const x = (80 - width) / 2;
                    const y = (80 - height) / 2;
                    
                    ctx.drawImage(img, x, y, width, height);
                    
                    const thumbnail = document.createElement('img');
                    thumbnail.className = 'thumbnail';
                    thumbnail.src = canvas.toDataURL();
                    thumbnail.title = `${index + 1}. ${img.filename || 'Imagem'}\n${img.width}x${img.height}px`;
                    
                    container.appendChild(thumbnail);
                });
            }

            updateFileList() {
                const listContainer = document.getElementById('fileOrderList');
                if (!listContainer) return;
                const list = listContainer.querySelector('ol');
                
                if (this.images.length > 0) {
                    listContainer.style.display = 'block';
                    list.innerHTML = '';
                    this.images.forEach(img => {
                        const li = document.createElement('li');
                        li.textContent = img.filename || 'Sem nome';
                        list.appendChild(li);
                    });
                } else {
                    listContainer.style.display = 'none';
                }
            }

            generateGrid() {
                const gridPreview = document.getElementById('gridPreview');
                const frameWidth = parseInt(document.getElementById('frameWidth').value);
                const frameHeight = parseInt(document.getElementById('frameHeight').value);
                const columns = parseInt(document.getElementById('columns').value);
                const rows = parseInt(document.getElementById('rows').value);
                const showGrid = document.getElementById('showGridPreview').checked;

                gridPreview.innerHTML = '';
                gridPreview.style.width = `${columns * frameWidth}px`;
                gridPreview.style.height = `${rows * frameHeight}px`;

                this.gridCells = [];
                let cellCount = 0;

                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < columns; col++) {
                        const cell = document.createElement('div');
                        cell.className = 'grid-cell';
                        cell.style.width = `${frameWidth}px`;
                        cell.style.height = `${frameHeight}px`;
                        cell.style.left = `${col * frameWidth}px`;
                        cell.style.top = `${row * frameHeight}px`;
                        
                        // Aplicar ou remover bordas conforme a opção
                        if (!showGrid) {
                            cell.style.border = 'none';
                            cell.style.background = 'none';
                        }
                        
                        const number = document.createElement('div');
                        number.className = 'grid-number';
                        number.textContent = cellCount + 1;
                        
                        // Mostrar número apenas se a grade estiver visível
                        if (showGrid) {
                            cell.appendChild(number);
                        }

                        if (this.images[cellCount]) {
                            const filenameDiv = document.createElement('div');
                            filenameDiv.className = 'grid-filename';
                            filenameDiv.textContent = this.images[cellCount].filename;
                            filenameDiv.title = this.images[cellCount].filename;
                            cell.appendChild(filenameDiv);
                        }
                        
                        gridPreview.appendChild(cell);
                        this.gridCells.push(cell);
                        cellCount++;
                    }
                }

                this.updateStats();
                this.showMessage(`Grid gerada com ${cellCount} células`, 'success');
            }

            generateSpriteSheet() {
                if (this.images.length === 0) {
                    this.showMessage('Por favor, importe algumas imagens primeiro!', 'error');
                    return;
                }

                const frameWidth = parseInt(document.getElementById('frameWidth').value);
                const frameHeight = parseInt(document.getElementById('frameHeight').value);
                const columns = parseInt(document.getElementById('columns').value);
                const rows = parseInt(document.getElementById('rows').value);
                const transparentBg = document.getElementById('transparentBg').checked;
                const centerImages = document.getElementById('centerImages').checked;
                const scaleToFit = document.getElementById('scaleToFit').checked;

                const totalFrames = columns * rows;
                const framesToProcess = Math.min(this.images.length, totalFrames);

                // Set canvas size
                this.canvas.width = columns * frameWidth;
                this.canvas.height = rows * frameHeight;
                
                // Clear canvas
                if (transparentBg) {
                    // Fundo transparente
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                } else {
                    // Fundo branco
                    this.ctx.fillStyle = 'white';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                }

                // Draw frames
                for (let i = 0; i < framesToProcess; i++) {
                    const img = this.images[i];
                    const col = i % columns;
                    const row = Math.floor(i / columns);
                    const x = col * frameWidth;
                    const y = row * frameHeight;

                    if (centerImages && scaleToFit) {
                        // Calcular escala para caber no frame
                        const scale = Math.min(frameWidth / img.width, frameHeight / img.height);
                        const scaledWidth = img.width * scale;
                        const scaledHeight = img.height * scale;
                        const offsetX = (frameWidth - scaledWidth) / 2;
                        const offsetY = (frameHeight - scaledHeight) / 2;

                        // Desenhar imagem centralizada e redimensionada
                        this.ctx.drawImage(img, x + offsetX, y + offsetY, scaledWidth, scaledHeight);
                    } else if (centerImages) {
                        // Apenas centralizar sem redimensionar
                        const offsetX = (frameWidth - img.width) / 2;
                        const offsetY = (frameHeight - img.height) / 2;
                        this.ctx.drawImage(img, x + offsetX, y + offsetY);
                    } else if (scaleToFit) {
                        // Apenas redimensionar sem centralizar
                        const scale = Math.min(frameWidth / img.width, frameHeight / img.height);
                        const scaledWidth = img.width * scale;
                        const scaledHeight = img.height * scale;
                        this.ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                    } else {
                        // Desenhar do canto superior esquerdo
                        this.ctx.drawImage(img, x, y, frameWidth, frameHeight);
                    }
                }

                // NÃO desenhar bordas da grade no sprite sheet final
                // A folha de animação ficará limpa, sem linhas

                // Enable download button
                document.getElementById('downloadSheet').disabled = false;
                this.updateStats();
                this.showMessage(`Sprite sheet criada com ${framesToProcess} frames!`, 'success');
            }

            downloadSpriteSheet() {
                const link = document.createElement('a');
                link.download = `sprite-sheet-${Date.now()}.png`;
                link.href = this.canvas.toDataURL('image/png');
                link.click();
                this.showMessage('Sprite sheet baixada com sucesso!', 'success');
            }

            updateStats() {
                const columns = parseInt(document.getElementById('columns').value);
                const rows = parseInt(document.getElementById('rows').value);
                const frameWidth = parseInt(document.getElementById('frameWidth').value);
                const frameHeight = parseInt(document.getElementById('frameHeight').value);

                document.getElementById('frameCount').textContent = columns * rows;
                document.getElementById('imageCount').textContent = this.images.length;
                document.getElementById('sheetSize').textContent = 
                    `${columns * frameWidth}×${rows * frameHeight}`;
            }

            showMessage(text, type) {
                const messageDiv = document.getElementById('message');
                messageDiv.textContent = text;
                messageDiv.className = `message ${type}`;
                messageDiv.style.display = 'block';

                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 3000);
            }
        }

        // Initialize the app
        document.addEventListener('DOMContentLoaded', () => {
            new SpriteSheetCreator();
        });
    </script>
</body>
</html>
