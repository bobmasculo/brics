<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SpriteSheet Editor - Phaser Compatível</title>
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
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .header p {
            opacity: 0.9;
        }

        .main-content {
            display: flex;
            min-height: 600px;
        }

        .left-panel {
            flex: 1;
            padding: 20px;
            border-right: 2px solid #f0f0f0;
            background: #f8f9fa;
        }

        .right-panel {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }

        .upload-area {
            border: 3px dashed #667eea;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            margin-bottom: 30px;
            transition: all 0.3s;
            cursor: pointer;
            background: white;
        }

        .upload-area:hover {
            background: #f0f4ff;
            transform: translateY(-2px);
        }

        .upload-area i {
            font-size: 48px;
            color: #667eea;
            margin-bottom: 15px;
        }

        .input-group {
            margin-bottom: 25px;
        }

        .input-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }

        .input-group input,
        .input-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }

        .input-group input:focus {
            border-color: #667eea;
            outline: none;
        }

        .canvas-container {
            border: 3px solid #e0e0e0;
            border-radius: 10px;
            overflow: auto;
            margin-top: 20px;
            background: #fff;
            position: relative;
        }

        #spriteCanvas {
            display: block;
            max-width: 100%;
        }

        .frames-container {
            margin-top: 30px;
        }

        .frame-item {
            display: flex;
            align-items: center;
            background: white;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .frame-preview {
            width: 60px;
            height: 60px;
            border: 2px solid #ddd;
            margin-right: 15px;
            background-size: cover;
            border-radius: 4px;
        }

        .frame-info {
            flex: 1;
        }

        .frame-info input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 5px;
        }

        .frame-actions button {
            background: #ff4757;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
        }

        .frame-actions button:hover {
            background: #ff3742;
        }

        .action-buttons {
            display: flex;
            gap: 15px;
            margin-top: 30px;
        }

        .btn {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-success {
            background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
            color: white;
        }

        .btn-success:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(46, 204, 113, 0.4);
        }

        .btn-info {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
        }

        .btn-info:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
        }

        .btn-warning {
            background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
            color: white;
        }

        .btn-warning:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(241, 196, 15, 0.4);
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .modal-header h2 {
            color: #333;
        }

        .close-modal {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }

        pre {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
        }

        .grid-overlay {
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
        }

        .frame-rect {
            position: absolute;
            border: 2px solid rgba(255, 255, 255, 0.8);
            background: rgba(102, 126, 234, 0.2);
            transition: all 0.3s;
            cursor: pointer;
        }

        .frame-rect:hover {
            background: rgba(102, 126, 234, 0.4);
            border-color: #667eea;
        }

        .frame-rect.selected {
            border-color: #ff4757;
            background: rgba(255, 71, 87, 0.3);
        }

        .frame-rect .frame-label {
            position: absolute;
            bottom: -25px;
            left: 0;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 2px 8px;
            font-size: 12px;
            border-radius: 3px;
            white-space: nowrap;
        }

        .controls {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }

        .controls button {
            padding: 10px 15px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        .controls button:hover {
            background: #5a6fd8;
        }
    </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-gamepad"></i> Phaser SpriteSheet Editor</h1>
            <p>Carregue sua spritesheet, defina as dimensões dos tiles e nomeie cada frame</p>
        </div>
        
        <div class="main-content">
            <!-- Painel Esquerdo -->
            <div class="left-panel">
                <div class="upload-area" id="uploadArea">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <h3>Clique ou arraste sua SpriteSheet ativa aqui</h3>
                    <p>Formatos suportados: JPG, PNG, GIF</p>
                </div>
                <div class="input-group">
                    <label for="activeSheetSelect"><i class="fas fa-image"></i> Folha ativa para edição</label>
                    <select id="activeSheetSelect">
                        <option value="0">SpriteSheet 1</option>
                        <option value="1">SpriteSheet 2</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="overlaySheetSelect"><i class="fas fa-layer-group"></i> Folha para mesclar</label>
                    <select id="overlaySheetSelect">
                        <option value="1">SpriteSheet 2</option>
                        <option value="0">SpriteSheet 1</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="mergeMode"><i class="fas fa-compress-arrows-alt"></i> Modo de Mesclagem</label>
                    <select id="mergeMode">
                        <option value="index">Mesclar por índice de frame</option>
                        <option value="name">Mesclar por nome de frame</option>
                    </select>
                </div>
                <input type="file" id="fileInputA" accept="image/*" style="display: none;">
                <input type="file" id="fileInputB" accept="image/*" style="display: none;">
                
                <div class="input-group">
                    <label for="tileWidthA"><i class="fas fa-arrows-alt-h"></i> Largura do Tile - SpriteSheet 1</label>
                    <input type="number" id="tileWidthA" placeholder="32" min="1" value="32">
                </div>
                
                <div class="input-group">
                    <label for="tileHeightA"><i class="fas fa-arrows-alt-v"></i> Altura do Tile - SpriteSheet 1</label>
                    <input type="number" id="tileHeightA" placeholder="32" min="1" value="32">
                </div>
                
                <div class="input-group">
                    <label for="tileWidthB"><i class="fas fa-arrows-alt-h"></i> Largura do Tile - SpriteSheet 2</label>
                    <input type="number" id="tileWidthB" placeholder="32" min="1" value="32">
                </div>
                
                <div class="input-group">
                    <label for="tileHeightB"><i class="fas fa-arrows-alt-v"></i> Altura do Tile - SpriteSheet 2</label>
                    <input type="number" id="tileHeightB" placeholder="32" min="1" value="32">
                </div>
                
                <div class="input-group">
                    <label for="frameName"><i class="fas fa-tag"></i> Nome do Frame</label>
                    <input type="text" id="frameName" placeholder="ex: player_walk_1">
                </div>

                <div class="input-group">
                    <label for="exportSize"><i class="fas fa-expand"></i> Tamanho de Exportação (ZIP)</label>
                    <select id="exportSize">
                        <option value="trimmed">Apenas Sprite (Corte Seco)</option>
                        <option value="original">Original (Tile Inteiro)</option>
                        <option value="64">64x64 (Redimensionar)</option>
                        <option value="128">128x128 (Redimensionar)</option>
                        <option value="256">256x256 (Redimensionar)</option>
                    </select>
                </div>
                
                <div class="controls">
                    <button id="autoGrid"><i class="fas fa-th"></i> Gerar Grade Automática</button>
                    <button id="clearFrames"><i class="fas fa-trash"></i> Limpar Frames</button>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="autoTrim" checked style="width: auto; margin-bottom: 0;">
                        <label for="autoTrim" style="margin-bottom: 0; font-weight: normal; cursor: pointer;">Auto-Trim</label>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="useSharpen" style="width: auto; margin-bottom: 0;">
                        <label for="useSharpen" style="margin-bottom: 0; font-weight: normal; cursor: pointer;">Sharpen</label>
                        <div id="sharpenIntensityContainer" style="display: flex; align-items: center; gap: 5px; margin-left: 10px; border-left: 1px solid #ccc; padding-left: 10px;">
                            <span style="font-size: 11px; color: #666;">Intensidade:</span>
                            <input type="range" id="sharpenIntensity" min="0" max="3" step="0.1" value="1" style="width: 60px; cursor: pointer;">
                            <span id="sharpenValue" style="font-size: 11px; font-weight: bold; min-width: 20px;">1.0</span>
                        </div>
                    </div>
                </div>
                
                <div class="canvas-container">
                    <canvas id="spriteCanvas"></canvas>
                    <canvas id="gridCanvas" class="grid-overlay"></canvas>
                </div>

                <div class="sheet-preview-panel" style="margin-top: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="sheet-preview-card" style="border: 2px solid #ddd; border-radius: 12px; padding: 15px; background: #fff;">
                        <h4 style="margin-bottom: 10px;">SpriteSheet 1</h4>
                        <div style="min-height: 120px; display: flex; align-items: center; justify-content: center; background: #f5f7fb; border-radius: 10px; overflow: hidden;">
                            <img id="sheetPreviewA" src="" alt="Preview Sheet 1" style="max-width: 100%; max-height: 110px; display: none;">
                            <span id="sheetPreviewALabel" style="color:#666;">Carregue a folha 1</span>
                        </div>
                        <div style="margin-top: 10px; font-size: 13px; color: #555;" id="sheetInfoA">Tamanho: -</div>
                    </div>
                    <div class="sheet-preview-card" style="border: 2px solid #ddd; border-radius: 12px; padding: 15px; background: #fff;">
                        <h4 style="margin-bottom: 10px;">SpriteSheet 2</h4>
                        <div style="min-height: 120px; display: flex; align-items: center; justify-content: center; background: #f5f7fb; border-radius: 10px; overflow: hidden;">
                            <img id="sheetPreviewB" src="" alt="Preview Sheet 2" style="max-width: 100%; max-height: 110px; display: none;">
                            <span id="sheetPreviewBLabel" style="color:#666;">Carregue a folha 2</span>
                        </div>
                        <div style="margin-top: 10px; font-size: 13px; color: #555;" id="sheetInfoB">Tamanho: -</div>
                    </div>
                </div>
            </div>
            
            <!-- Painel Direito -->
            <div class="right-panel">
                <h2><i class="fas fa-list"></i> Frames Definidos</h2>
                <div id="framesList" class="frames-container">
                    <!-- Frames serão adicionados aqui dinamicamente -->
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" id="addFrame">
                        <i class="fas fa-plus"></i> Adicionar Frame
                    </button>
                    <button class="btn btn-success" id="generateJson">
                        <i class="fas fa-file-code"></i> Gerar JSON Phaser
                    </button>
                    <button class="btn btn-info" id="generateCenteredImage">
                        <i class="fas fa-magic"></i> Gerar Imagem Centralizada
                    </button>
                    <button class="btn btn-warning" id="mergeSheets">
                        <i class="fas fa-compress"></i> Mesclar Spritesheets
                    </button>
                    <button class="btn btn-warning" id="downloadZip">
                        <i class="fas fa-file-archive"></i> Baixar ZIP
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal para exibir o JSON -->
    <div class="modal" id="jsonModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-cogs"></i> Resultado Gerado</h2>
                <button class="close-modal" id="closeModal">&times;</button>
            </div>

            <div id="imagePreviewContainer" style="text-align: center; margin-bottom: 20px; border: 2px solid #ddd; padding: 10px; border-radius: 8px; background: #f8f9fa;">
                <h4 style="color: #333; margin-bottom: 10px;">Preview da Nova Imagem</h4>
                <img id="newImagePreview" src="" alt="Preview da nova spritesheet" style="max-width: 100%; max-height: 200px; margin-top: 10px; background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;">
            </div>

            <h4 style="color: #333; margin-bottom: 10px;"><i class="fas fa-file-code"></i> JSON Gerado</h4>
            <pre id="jsonOutput" style="max-height: 250px;"></pre>
            <div class="action-buttons" style="margin-top: 20px;">
                 <a href="#" download="spritesheet_centered.png" id="downloadImageBtn" class="btn btn-info" style="text-decoration: none; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <i class="fas fa-download"></i> Baixar Imagem
                </a>
                <button class="btn btn-primary" id="copyJson">
                    <i class="fas fa-copy"></i> Copiar JSON
                </button>
            </div>
        </div>
    </div>

    <script>
        class SpriteSheetEditor {
            constructor() {
                this.canvas = document.getElementById('spriteCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.gridCanvas = document.getElementById('gridCanvas');
                this.gridCtx = this.gridCanvas.getContext('2d');
                this.sheets = [
                    { image: null, frames: [], name: 'SpriteSheet 1', tileWidth: 32, tileHeight: 32 },
                    { image: null, frames: [], name: 'SpriteSheet 2', tileWidth: 32, tileHeight: 32 }
                ];
                this.activeSheetIndex = 0;
                this.overlaySheetIndex = 1;
                this.selectedFrame = null;
                this.scale = 1;
                this.image = null;
                
                this.initializeEventListeners();
                this.renderSheetPreviews();
            }

            get currentSheet() {
                return this.sheets[this.activeSheetIndex];
            }

            get overlaySheet() {
                return this.sheets[this.overlaySheetIndex];
            }

            get frames() {
                return this.currentSheet.frames;
            }

            set frames(value) {
                this.currentSheet.frames = value;
            }

            initializeEventListeners() {
                // Upload de imagem
                document.getElementById('uploadArea').addEventListener('click', () => {
                    const inputId = this.activeSheetIndex === 0 ? 'fileInputA' : 'fileInputB';
                    document.getElementById(inputId).click();
                });

                document.getElementById('fileInputA').addEventListener('change', (e) => {
                    this.loadImage(e.target.files[0], 0);
                });

                document.getElementById('fileInputB').addEventListener('change', (e) => {
                    this.loadImage(e.target.files[0], 1);
                });

                document.getElementById('activeSheetSelect').addEventListener('change', (e) => {
                    const index = parseInt(e.target.value, 10);
                    this.setActiveSheet(index);
                });

                document.getElementById('overlaySheetSelect').addEventListener('change', (e) => {
                    const index = parseInt(e.target.value, 10);
                    if (index === this.activeSheetIndex) {
                        alert('Escolha uma folha diferente para mesclar.');
                        e.target.value = this.overlaySheetIndex;
                        return;
                    }
                    this.overlaySheetIndex = index;
                });

                document.getElementById('mergeSheets').addEventListener('click', () => {
                    this.mergeSheets();
                });
                
                // Arrastar e soltar
                const uploadArea = document.getElementById('uploadArea');
                uploadArea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadArea.style.background = '#e8f0fe';
                });
                
                uploadArea.addEventListener('dragleave', () => {
                    uploadArea.style.background = '';
                });
                
                uploadArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadArea.style.background = '';
                    if (e.dataTransfer.files[0]) {
                        this.loadImage(e.dataTransfer.files[0], this.activeSheetIndex);
                    }
                });
                
                // Inputs de dimensões da folha 1
                document.getElementById('tileWidthA').addEventListener('input', (e) => {
                    this.sheets[0].tileWidth = parseInt(e.target.value, 10) || 1;
                    if (this.activeSheetIndex === 0) {
                        this.updateGrid();
                        this.drawFrames();
                    }
                    this.renderSheetPreviews();
                });

                document.getElementById('tileHeightA').addEventListener('input', (e) => {
                    this.sheets[0].tileHeight = parseInt(e.target.value, 10) || 1;
                    if (this.activeSheetIndex === 0) {
                        this.updateGrid();
                        this.drawFrames();
                    }
                    this.renderSheetPreviews();
                });

                // Inputs de dimensões da folha 2
                document.getElementById('tileWidthB').addEventListener('input', (e) => {
                    this.sheets[1].tileWidth = parseInt(e.target.value, 10) || 1;
                    if (this.activeSheetIndex === 1) {
                        this.updateGrid();
                        this.drawFrames();
                    }
                    this.renderSheetPreviews();
                });

                document.getElementById('tileHeightB').addEventListener('input', (e) => {
                    this.sheets[1].tileHeight = parseInt(e.target.value, 10) || 1;
                    if (this.activeSheetIndex === 1) {
                        this.updateGrid();
                        this.drawFrames();
                    }
                    this.renderSheetPreviews();
                });

                // Botões de ação
                document.getElementById('addFrame').addEventListener('click', () => {
                    this.addFrame();
                });
                
                document.getElementById('autoGrid').addEventListener('click', () => {
                    this.generateAutoGrid();
                });
                
                document.getElementById('clearFrames').addEventListener('click', () => {
                    this.clearFrames();
                });
                
                document.getElementById('generateJson').addEventListener('click', () => {
                    this.generateJson();
                });
                
                document.getElementById('generateCenteredImage').addEventListener('click', () => {
                    this.generateCenteredImage();
                });
                
                document.getElementById('downloadZip').addEventListener('click', () => {
                    this.downloadZip();
                });
                
                document.getElementById('useSharpen').addEventListener('change', () => {
                    this.drawImage();
                });
                
                document.getElementById('sharpenIntensity').addEventListener('input', (e) => {
                    document.getElementById('sharpenValue').textContent = parseFloat(e.target.value).toFixed(1);
                    this.drawImage();
                });
                
                document.getElementById('copyJson').addEventListener('click', () => {
                    this.copyJson();
                });
                
                document.getElementById('closeModal').addEventListener('click', () => {
                    document.getElementById('jsonModal').style.display = 'none';
                });
                
                // Clique na canvas para selecionar frame
                this.canvas.addEventListener('click', (e) => {
                    this.handleCanvasClick(e);
                });
            }

            getTrimmedBounds(imageData) {
                const { width, height, data } = imageData;
                let top = height, bottom = -1, left = width, right = -1;
                let found = false;

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        // O canal alfa é o 4º valor para cada pixel
                        const alpha = data[(y * width + x) * 4 + 3];
                        if (alpha > 10) { // Limiar para ignorar pixels quase transparentes
                            found = true;
                            if (y < top) top = y;
                            if (y > bottom) bottom = y;
                            if (x < left) left = x;
                            if (x > right) right = x;
                        }
                    }
                }

                if (!found) {
                    return null; // Totalmente transparente
                }

                return {
                    x: left,
                    y: top,
                    width: right - left + 1,
                    height: bottom - top + 1
                };
            }

            getTrimmedFrame(tileRect) {
                if (!this.image) return null;

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = tileRect.width;
                tempCanvas.height = tileRect.height;
                const tempCtx = tempCanvas.getContext('2d');

                tempCtx.drawImage(
                    this.image,
                    tileRect.x, tileRect.y, tileRect.width, tileRect.height,
                    0, 0, tileRect.width, tileRect.height
                );

                const imageData = tempCtx.getImageData(0, 0, tileRect.width, tileRect.height);
                const bounds = this.getTrimmedBounds(imageData);

                if (!bounds) {
                    return null; // Frame vazio
                }

                return {
                    trimmed: true,
                    frame: { x: tileRect.x + bounds.x, y: tileRect.y + bounds.y, w: bounds.width, h: bounds.height },
                    spriteSourceSize: { x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height },
                    sourceSize: { w: tileRect.width, h: tileRect.height }
                };
            }
            
            loadImage(file, sheetIndex = 0) {
                if (!file || !file.type.match('image.*')) {
                    alert('Por favor, selecione um arquivo de imagem válido.');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const image = new Image();
                    image.onload = () => {
                        this.sheets[sheetIndex].image = image;
                        if (sheetIndex === this.activeSheetIndex) {
                            this.image = image;
                            this.scaleCanvas();
                            this.drawImage();
                            this.updateGrid();
                            this.renderFramesList();
                        }
                        this.renderSheetPreviews();
                    };
                    image.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }

            setActiveSheet(index) {
                this.activeSheetIndex = index;
                if (this.overlaySheetIndex === index) {
                    this.overlaySheetIndex = index === 0 ? 1 : 0;
                    document.getElementById('overlaySheetSelect').value = this.overlaySheetIndex;
                }
                document.getElementById('activeSheetSelect').value = index;
                this.image = this.currentSheet.image;
                this.updateActiveSheetInputs();
                if (this.image) {
                    this.scaleCanvas();
                    this.drawImage();
                    this.updateGrid();
                } else {
                    this.clearCanvas();
                }
                this.renderFramesList();
                this.renderSheetPreviews();
            }

            updateActiveSheetInputs() {
                const sheet = this.currentSheet;
                document.getElementById('tileWidthA').value = this.sheets[0].tileWidth;
                document.getElementById('tileHeightA').value = this.sheets[0].tileHeight;
                document.getElementById('tileWidthB').value = this.sheets[1].tileWidth;
                document.getElementById('tileHeightB').value = this.sheets[1].tileHeight;
            }

            getCurrentTileSize() {
                return {
                    width: Math.max(1, this.currentSheet.tileWidth || 1),
                    height: Math.max(1, this.currentSheet.tileHeight || 1)
                };
            }

            getSheetPreviewInfo(index) {
                const sheet = this.sheets[index];
                if (!sheet.image) {
                    return { text: 'Nenhuma imagem carregada', size: '-' };
                }
                return {
                    text: `${sheet.name} carregada (${sheet.image.width}x${sheet.image.height})`,
                    size: `${sheet.tileWidth}x${sheet.tileHeight}`
                };
            }

            renderSheetPreviews() {
                const updatePreview = (index, imgId, labelId, infoId) => {
                    const sheet = this.sheets[index];
                    const imgEl = document.getElementById(imgId);
                    const labelEl = document.getElementById(labelId);
                    const infoEl = document.getElementById(infoId);

                    if (sheet.image) {
                        imgEl.src = sheet.image.src;
                        imgEl.style.display = 'block';
                        labelEl.style.display = 'none';
                        infoEl.textContent = `Imagem ${sheet.name}: ${sheet.image.width}x${sheet.image.height} — Tile: ${sheet.tileWidth}x${sheet.tileHeight}`;
                    } else {
                        imgEl.style.display = 'none';
                        labelEl.style.display = 'block';
                        labelEl.textContent = `Carregue a folha ${index + 1}`;
                        infoEl.textContent = `Tamanho: ${sheet.tileWidth}x${sheet.tileHeight}`;
                    }
                };

                updatePreview(0, 'sheetPreviewA', 'sheetPreviewALabel', 'sheetInfoA');
                updatePreview(1, 'sheetPreviewB', 'sheetPreviewBLabel', 'sheetInfoB');
            }

            clearCanvas() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.gridCtx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
            }

            mergeSheets() {
                if (!this.sheets[0].image || !this.sheets[1].image) {
                    alert('Carregue as duas folhas antes de mesclar.');
                    return;
                }

                const baseTileSize = this.getCurrentTileSize();
                const tileWidth = baseTileSize.width;
                const tileHeight = baseTileSize.height;
                if (tileWidth <= 0 || tileHeight <= 0) {
                    alert('Defina as dimensões do tile antes de mesclar.');
                    return;
                }

                const baseSheet = this.currentSheet;
                const overlaySheet = this.overlaySheet;
                if (baseSheet.frames.length === 0 || overlaySheet.frames.length === 0) {
                    alert('Gere frames para as duas folhas antes de mesclar.');
                    return;
                }

                const mergeMode = document.getElementById('mergeMode').value;
                const pairs = [];
                if (mergeMode === 'name') {
                    const overlayMap = overlaySheet.frames.reduce((map, frame) => {
                        map[frame.key] = frame;
                        return map;
                    }, {});
                    baseSheet.frames.forEach((frame) => {
                        const overlayFrame = overlayMap[frame.key];
                        if (overlayFrame) {
                            pairs.push({ base: frame, overlay: overlayFrame });
                        }
                    });

                    if (pairs.length === 0) {
                        alert('Não foram encontrados frames correspondentes por nome.');
                        return;
                    }
                } else {
                    const count = Math.min(baseSheet.frames.length, overlaySheet.frames.length);
                    for (let i = 0; i < count; i++) {
                        pairs.push({ base: baseSheet.frames[i], overlay: overlaySheet.frames[i] });
                    }
                }

                const cols = Math.max(1, Math.floor(this.currentSheet.image.width / tileWidth));
                const rows = Math.ceil(pairs.length / cols);
                const mergedCanvas = document.createElement('canvas');
                mergedCanvas.width = cols * tileWidth;
                mergedCanvas.height = rows * tileHeight;
                const mergedCtx = mergedCanvas.getContext('2d');
                mergedCtx.clearRect(0, 0, mergedCanvas.width, mergedCanvas.height);
                mergedCtx.imageSmoothingEnabled = false;

                const mergedJson = {
                    frames: {},
                    animations: {},
                    meta: {
                        image: 'merged_spritesheet.png',
                        format: 'RGBA8888',
                        size: { w: mergedCanvas.width, h: mergedCanvas.height },
                        scale: 1
                    }
                };

                pairs.forEach((pair, index) => {
                    const col = index % cols;
                    const row = Math.floor(index / cols);
                    const destX = col * tileWidth;
                    const destY = row * tileHeight;

                    const baseFrame = pair.base;
                    mergedCtx.drawImage(
                        this.currentSheet.image,
                        baseFrame.frame.x, baseFrame.frame.y, baseFrame.frame.w, baseFrame.frame.h,
                        destX + baseFrame.spriteSourceSize.x, destY + baseFrame.spriteSourceSize.y,
                        baseFrame.frame.w, baseFrame.frame.h
                    );

                    const overlayFrame = pair.overlay;
                    mergedCtx.drawImage(
                        this.overlaySheet.image,
                        overlayFrame.frame.x, overlayFrame.frame.y, overlayFrame.frame.w, overlayFrame.frame.h,
                        destX + overlayFrame.spriteSourceSize.x, destY + overlayFrame.spriteSourceSize.y,
                        overlayFrame.frame.w, overlayFrame.frame.h
                    );

                    const key = baseFrame.key;
                    mergedJson.frames[key] = {
                        frame: { x: destX, y: destY, w: tileWidth, h: tileHeight },
                        rotated: false,
                        trimmed: false,
                        spriteSourceSize: { x: 0, y: 0, w: tileWidth, h: tileHeight },
                        sourceSize: { w: tileWidth, h: tileHeight }
                    };

                    const match = baseFrame.name.match(/^([a-zA-Z_]+)_/);
                    if (match) {
                        const animName = match[1];
                        mergedJson.animations[animName] = mergedJson.animations[animName] || [];
                        mergedJson.animations[animName].push(key);
                    }
                });

                Object.keys(mergedJson.animations).forEach((animName) => {
                    mergedJson.animations[animName].sort((a, b) => {
                        const numA = parseInt(a.match(/\d+$/)) || 0;
                        const numB = parseInt(b.match(/\d+$/)) || 0;
                        return numA - numB;
                    });
                });

                const mergedDataUrl = mergedCanvas.toDataURL('image/png');
                document.getElementById('imagePreviewContainer').style.display = 'block';
                document.getElementById('downloadImageBtn').style.display = 'flex';
                document.getElementById('newImagePreview').src = mergedDataUrl;
                document.getElementById('downloadImageBtn').href = mergedDataUrl;
                document.getElementById('downloadImageBtn').download = 'merged_spritesheet.png';
                document.getElementById('jsonOutput').textContent = JSON.stringify(mergedJson, null, 2);
                document.getElementById('jsonModal').style.display = 'flex';
            }
            
            scaleCanvas() {
                const maxWidth = 600;
                const maxHeight = 400;
                
                let width = this.image.width;
                let height = this.image.height;
                
                if (width > maxWidth || height > maxHeight) {
                    this.scale = Math.min(maxWidth / width, maxHeight / height);
                    width *= this.scale;
                    height *= this.scale;
                } else {
                    this.scale = 1;
                }
                
                this.canvas.width = width;
                this.canvas.height = height;
                this.gridCanvas.width = width;
                this.gridCanvas.height = height;
            }
            
            drawImage() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.imageSmoothingEnabled = false; // Mantém o preview nítido para pixel art
                this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
                
                if (document.getElementById('useSharpen').checked) {
                    this.applySharpen(this.ctx, this.canvas.width, this.canvas.height);
                }
                
                this.drawFrames();
            }
            
            updateGrid() {
                this.gridCtx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
                
                const image = this.currentSheet.image;
                const tileSize = this.getCurrentTileSize();
                const tileWidth = tileSize.width;
                const tileHeight = tileSize.height;
                
                if (tileWidth <= 0 || tileHeight <= 0 || !image) return;
                
                // Desenhar grade
                this.gridCtx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
                this.gridCtx.lineWidth = 1;
                
                const scaledTileWidth = tileWidth * this.scale;
                const scaledTileHeight = tileHeight * this.scale;
                
                // Linhas verticais
                for (let x = 0; x <= this.canvas.width; x += scaledTileWidth) {
                    this.gridCtx.beginPath();
                    this.gridCtx.moveTo(x, 0);
                    this.gridCtx.lineTo(x, this.canvas.height);
                    this.gridCtx.stroke();
                }
                
                // Linhas horizontais
                for (let y = 0; y <= this.canvas.height; y += scaledTileHeight) {
                    this.gridCtx.beginPath();
                    this.gridCtx.moveTo(0, y);
                    this.gridCtx.lineTo(this.canvas.width, y);
                    this.gridCtx.stroke();
                }
                
                // Numerar os tiles
                this.gridCtx.fillStyle = 'rgba(102, 126, 234, 0.8)';
                this.gridCtx.font = '12px Arial';
                this.gridCtx.textAlign = 'center';
                this.gridCtx.textBaseline = 'middle';
                
                let index = 0;
                for (let y = 0; y < this.image.height; y += tileHeight) {
                    for (let x = 0; x < this.image.width; x += tileWidth) {
                        const centerX = (x * this.scale) + (scaledTileWidth / 2);
                        const centerY = (y * this.scale) + (scaledTileHeight / 2);
                        this.gridCtx.fillText(index.toString(), centerX, centerY);
                        index++;
                    }
                }
            }
            
            handleCanvasClick(e) {
                if (!this.image) return;
                
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const tileSize = this.getCurrentTileSize();
                const tileWidth = tileSize.width;
                const tileHeight = tileSize.height;
                
                if (tileWidth <= 0 || tileHeight <= 0) return;
                
                // Converter coordenadas para a imagem original
                const originalX = Math.floor(x / this.scale);
                const originalY = Math.floor(y / this.scale);
                
                // Determinar qual tile foi clicado
                const tileX = Math.floor(originalX / tileWidth) * tileWidth;
                const tileY = Math.floor(originalY / tileHeight) * tileHeight;
                
                this.selectTile(tileX, tileY, tileWidth, tileHeight);
            }
            
            selectTile(x, y, width, height) {
                this.selectedFrame = { x, y, width, height };
                this.drawFrames();
                this.drawSelection(x, y, width, height);
            }
            
            drawSelection(x, y, width, height) {
                // Limpar seleção anterior
                this.gridCtx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
                this.updateGrid();
                
                // Desenhar seleção atual
                const scaledX = x * this.scale;
                const scaledY = y * this.scale;
                const scaledWidth = width * this.scale;
                const scaledHeight = height * this.scale;
                
                this.gridCtx.strokeStyle = 'rgba(255, 71, 87, 0.8)';
                this.gridCtx.lineWidth = 3;
                this.gridCtx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
                
                this.gridCtx.fillStyle = 'rgba(255, 71, 87, 0.2)';
                this.gridCtx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
            }
            
            addFrame() {
                if (!this.selectedFrame) {
                    alert('Por favor, selecione um tile na imagem primeiro.');
                    return;
                }
                
                const frameName = document.getElementById('frameName').value || `frame_${this.frames.length}`;
                
                const tileRect = this.selectedFrame;

                const frameData = {
                    name: frameName,
                    key: frameName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    trimmed: false,
                    frame: { x: tileRect.x, y: tileRect.y, w: tileRect.width, h: tileRect.height },
                    spriteSourceSize: { x: 0, y: 0, w: tileRect.width, h: tileRect.height },
                    sourceSize: { w: tileRect.width, h: tileRect.height }
                };

                const autoTrim = document.getElementById('autoTrim').checked;
                if (autoTrim) {
                    const trimmedData = this.getTrimmedFrame(tileRect);
                    if (trimmedData) {
                        frameData.trimmed = trimmedData.trimmed;
                        frameData.frame = trimmedData.frame;
                        frameData.spriteSourceSize = trimmedData.spriteSourceSize;
                    }
                }

                this.frames.push(frameData);
                this.renderFramesList();
                this.drawFrames();
            }
            
            drawFrames() {
                // Limpar frames desenhados
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
                
                // Desenhar todos os frames
                this.frames.forEach(frame => {
                    const rect = frame.frame;
                    const scaledX = rect.x * this.scale;
                    const scaledY = rect.y * this.scale;
                    const scaledWidth = rect.w * this.scale;
                    const scaledHeight = rect.h * this.scale;
                    
                    this.ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
                    
                    this.ctx.fillStyle = 'rgba(46, 204, 113, 0.2)';
                    this.ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
                    
                    // Adicionar label
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.font = '10px Arial';
                    this.ctx.fillText(frame.name, scaledX + 5, scaledY + scaledHeight + 12);
                });
            }
            
            renderFramesList() {
                const container = document.getElementById('framesList');
                container.innerHTML = '';
                
                this.frames.forEach((frame, index) => {
                    const finalRect = frame.frame;
                    const sourceSize = frame.sourceSize;

                    const frameElement = document.createElement('div');
                    frameElement.className = 'frame-item';
                    
                    // Criar preview do frame
                    const previewCanvas = document.createElement('canvas');
                    previewCanvas.width = Math.min(60, finalRect.w);
                    previewCanvas.height = Math.min(60, finalRect.h);
                    const previewCtx = previewCanvas.getContext('2d');
                    
                    // Desenhar o frame no preview
                    previewCtx.drawImage(
                        this.image,
                        finalRect.x, finalRect.y, finalRect.w, finalRect.h,
                        0, 0, previewCanvas.width, previewCanvas.height
                    );
                    
                    frameElement.innerHTML = `
                        <div class="frame-preview">
                            <canvas width="${previewCanvas.width}" height="${previewCanvas.height}" 
                                    style="width: 60px; height: 60px; object-fit: contain;"></canvas>
                        </div>
                        <div class="frame-info">
                            <input type="text" value="${frame.name}" 
                                   placeholder="Nome do frame" 
                                   data-index="${index}" 
                                   class="frame-name-input">
                            <div style="font-size: 12px; color: #666;">
                                Tile: ${sourceSize.w}x${sourceSize.h} &rarr; Frame: ${finalRect.w}x${finalRect.h}
                            </div>
                        </div>
                        <div class="frame-actions">
                            <button class="delete-frame" data-index="${index}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    
                    // Atualizar canvas do preview
                    setTimeout(() => {
                        const canvas = frameElement.querySelector('.frame-preview canvas');
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(
                            this.image,
                            finalRect.x, finalRect.y, finalRect.w, finalRect.h,
                            0, 0, canvas.width, canvas.height
                        );
                    }, 0);
                    
                    container.appendChild(frameElement);
                });
                
                // Adicionar event listeners
                document.querySelectorAll('.frame-name-input').forEach(input => {
                    input.addEventListener('change', (e) => {
                        const index = parseInt(e.target.dataset.index);
                        this.frames[index].name = e.target.value;
                        this.frames[index].key = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
                        this.drawFrames();
                    });
                });
                
                document.querySelectorAll('.delete-frame').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const index = parseInt(e.target.closest('button').dataset.index);
                        this.frames.splice(index, 1);
                        this.renderFramesList();
                        this.drawFrames();
                    });
                });
            }
            
            generateAutoGrid() {
                if (!this.image) return;
                
                const tileSize = this.getCurrentTileSize();
                const tileWidth = tileSize.width;
                const tileHeight = tileSize.height;
                
                if (tileWidth <= 0 || tileHeight <= 0) return;
                
                this.frames = [];
                let frameCount = 0;
                const autoTrim = document.getElementById('autoTrim').checked;
                
                for (let y = 0; y < this.image.height; y += tileHeight) {
                    for (let x = 0; x < this.image.width; x += tileWidth) {
                        if (x + tileWidth <= this.image.width && y + tileHeight <= this.image.height) {
                            const tileRect = { x, y, width: tileWidth, height: tileHeight };
                            const frameName = `frame_${frameCount}`;

                            const frameData = {
                                name: frameName,
                                key: frameName,
                                trimmed: false,
                                frame: { x: tileRect.x, y: tileRect.y, w: tileRect.width, h: tileRect.height },
                                spriteSourceSize: { x: 0, y: 0, w: tileRect.width, h: tileRect.height },
                                sourceSize: { w: tileRect.width, h: tileRect.height }
                            };

                            if (autoTrim) {
                                const trimmedData = this.getTrimmedFrame(tileRect);
                                if (trimmedData) {
                                    frameData.trimmed = trimmedData.trimmed;
                                    frameData.frame = trimmedData.frame;
                                    frameData.spriteSourceSize = trimmedData.spriteSourceSize;
                                }
                            }

                            this.frames.push(frameData);
                            frameCount++;
                        }
                    }
                }
                
                this.renderFramesList();
                this.drawFrames();
            }
            
            clearFrames() {
                this.frames = [];
                this.selectedFrame = null;
                this.renderFramesList();
                this.drawImage();
                this.updateGrid();
            }
            
            generateJson() {
                if (this.frames.length === 0) {
                    alert('Adicione pelo menos um frame antes de gerar o JSON.');
                    return;
                }
                
                const phaserAtlas = this.generatePhaserAtlas(this.frames);
                
                const jsonOutput = document.getElementById('jsonOutput');
                jsonOutput.textContent = JSON.stringify(phaserAtlas, null, 2);
                
                // Esconder a parte da imagem, pois este é apenas o JSON da imagem original
                document.getElementById('imagePreviewContainer').style.display = 'none';
                document.getElementById('downloadImageBtn').style.display = 'none';

                document.getElementById('jsonModal').style.display = 'flex';
            }
            
            copyJson() {
                const jsonText = document.getElementById('jsonOutput').textContent;
                navigator.clipboard.writeText(jsonText).then(() => {
                    alert('JSON copiado para a área de transferência!');
                });
            }

            createUntrimmedFrame(x, y, width, height) {
                return {
                    frame: { x, y, w: width, h: height },
                    rotated: false,
                    trimmed: false,
                    spriteSourceSize: { x: 0, y: 0, w: width, h: height },
                    sourceSize: { w: width, h: height }
                };
            }

            generateCenteredImage() {
                if (!this.image || this.frames.length === 0) {
                    alert('Por favor, carregue uma imagem e gere os frames primeiro (use a Grade Automática).');
                    return;
                }

                // Usar as dimensões do primeiro frame como base para o tamanho do tile
                const tileWidth = this.frames[0].sourceSize.w;
                const tileHeight = this.frames[0].sourceSize.h;

                if (!tileWidth || !tileHeight) {
                    alert('Não foi possível determinar as dimensões do tile. Gere a grade novamente.');
                    return;
                }

                // Calcular o layout da nova spritesheet
                const tilesPerRow = Math.floor(this.image.width / tileWidth);
                const numRows = Math.ceil(this.frames.length / tilesPerRow);

                // Criar um novo canvas com as dimensões necessárias
                const newCanvas = document.createElement('canvas');
                newCanvas.width = tilesPerRow * tileWidth;
                newCanvas.height = numRows * tileHeight;
                const newCtx = newCanvas.getContext('2d');

                // Iterar sobre cada frame e desenhá-lo centralizado no seu novo tile
                this.frames.forEach((frameData, index) => {
                    // Informações do conteúdo cortado (trimmed)
                    const trimmedSourceX = frameData.frame.x;
                    const trimmedSourceY = frameData.frame.y;
                    const trimmedWidth = frameData.frame.w;
                    const trimmedHeight = frameData.frame.h;

                    // Posição do tile na nova imagem
                    const col = index % tilesPerRow;
                    const row = Math.floor(index / tilesPerRow);
                    const newTileX = col * tileWidth;
                    const newTileY = row * tileHeight;

                    // Calcular a posição de destino para centralizar o conteúdo
                    const destX = newTileX + (tileWidth - trimmedWidth) / 2;
                    const destY = newTileY + (tileHeight - trimmedHeight) / 2;

                    // Desenhar o conteúdo cortado da imagem original no novo canvas
                    newCtx.drawImage(
                        this.image,
                        trimmedSourceX, trimmedSourceY, trimmedWidth, trimmedHeight,
                        destX, destY, trimmedWidth, trimmedHeight
                    );
                });

                // --- Geração do JSON para a NOVA imagem ---
                const newJson = this.generatePhaserAtlas(this.frames);

                // Sobrescrever os metadados e os frames para a nova imagem centralizada
                newJson.meta.image = 'spritesheet_centered.png';
                newJson.meta.size = { w: newCanvas.width, h: newCanvas.height };

                // Limpa animações antigas e frames antigos
                newJson.animations = {};
                newJson.frames = {};

                // Cria novos frames (não trimados) e recria as animações
                const animations = {};
                this.frames.forEach((originalFrame, index) => {
                    const key = originalFrame.key;
                    const col = index % tilesPerRow;
                    const row = Math.floor(index / tilesPerRow);
                    newJson.frames[key] = this.createUntrimmedFrame(col * tileWidth, row * tileHeight, tileWidth, tileHeight);

                    // Recria a lógica de animação
                    const match = key.match(/^([a-zA-Z_]+)_/);
                    if (match) {
                        const animName = match[1];
                        if (!animations[animName]) {
                            animations[animName] = [];
                        }
                        animations[animName].push(key);
                    }
                });
                
                Object.keys(animations).forEach(animName => {
                    animations[animName].sort((a, b) => {
                        const numA = parseInt(a.match(/\d+$/)) || 0;
                        const numB = parseInt(b.match(/\d+$/)) || 0;
                        return numA - numB;
                    });
                });
                newJson.animations = animations;

                // --- ATUALIZAR O MODAL ---
                const newImageDataUrl = newCanvas.toDataURL('image/png');

                // Mostrar a parte da imagem
                document.getElementById('imagePreviewContainer').style.display = 'block';
                document.getElementById('downloadImageBtn').style.display = 'flex';

                // Atualiza o preview da imagem no modal
                document.getElementById('newImagePreview').src = newImageDataUrl;

                // Atualiza o botão de download
                document.getElementById('downloadImageBtn').href = newImageDataUrl;
                
                // Exibir o novo JSON no modal
                const jsonOutput = document.getElementById('jsonOutput');
                jsonOutput.textContent = JSON.stringify(newJson, null, 2);
                document.getElementById('jsonModal').style.display = 'flex';
            }

            generatePhaserAtlas(frames) {
                const phaserAtlas = {
                    frames: {},
                    animations: {},
                    meta: {
                        image: 'spritesheet.png', // Será sobrescrito se necessário
                        format: 'RGBA8888',
                        size: { w: this.image ? this.image.width : 0, h: this.image ? this.image.height : 0 }, // Será sobrescrito se necessário
                        scale: 1
                    }
                };

                phaserAtlas.frames = {}; // Limpa os frames para preencher novamente
                frames.forEach(frame => {
                    phaserAtlas.frames[frame.key] = {
                        frame: frame.frame, rotated: false, trimmed: frame.trimmed,
                        spriteSourceSize: frame.spriteSourceSize, sourceSize: frame.sourceSize
                    };
                });

                // Recalcula animações
                const animations = {};
                frames.forEach(frame => {
                    const match = frame.name.match(/^([a-zA-Z_]+)_/);
                    if (match) {
                        const animName = match[1];
                        if (!animations[animName]) {
                            animations[animName] = [];
                        }
                        animations[animName].push(frame.key);
                    }
                });
                
                Object.keys(animations).forEach(animName => {
                    animations[animName].sort((a, b) => {
                        const numA = parseInt(a.match(/\d+$/)) || 0;
                        const numB = parseInt(b.match(/\d+$/)) || 0;
                        return numA - numB;
                    });
                });
                phaserAtlas.animations = animations;
                return phaserAtlas;
            }

            async downloadZip() {
                if (!this.image || this.frames.length === 0) {
                    alert('Adicione pelo menos um frame antes de baixar o ZIP.');
                    return;
                }

                const btn = document.getElementById('downloadZip');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando ZIP...';
                btn.disabled = true;

                try {
                    const exportSizeVal = document.getElementById('exportSize').value;
                    const zip = new JSZip();
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');

                    for (const frameData of this.frames) {
                        let srcX, srcY, srcW, srcH;
                        let outW, outH;
                        let destX = 0, destY = 0;
                        let drawW, drawH;

                        if (exportSizeVal === 'trimmed') {
                            // Exporta apenas o conteúdo (pixels visíveis), sem o resto do tile
                            srcX = frameData.frame.x;
                            srcY = frameData.frame.y;
                            srcW = frameData.frame.w;
                            srcH = frameData.frame.h;
                            outW = srcW;
                            outH = srcH;
                            drawW = srcW;
                            drawH = srcH;
                        } else if (exportSizeVal === 'original') {
                            // Exporta o tile completo conforme definido na grade
                            srcX = frameData.frame.x - frameData.spriteSourceSize.x;
                            srcY = frameData.frame.y - frameData.spriteSourceSize.y;
                            srcW = frameData.sourceSize.w;
                            srcH = frameData.sourceSize.h;
                            outW = srcW;
                            outH = srcH;
                            drawW = srcW;
                            drawH = srcH;
                        } else {
                            // Exporta redimensionando para o tamanho do combo (64, 128, etc)
                            const targetSize = parseInt(exportSizeVal);
                            outW = targetSize;
                            outH = targetSize;
                            
                            srcX = frameData.frame.x - frameData.spriteSourceSize.x;
                            srcY = frameData.frame.y - frameData.spriteSourceSize.y;
                            srcW = frameData.sourceSize.w;
                            srcH = frameData.sourceSize.h;

                            const scale = Math.min(targetSize / srcW, targetSize / srcH);
                            drawW = srcW * scale;
                            drawH = srcH * scale;
                            destX = (targetSize - drawW) / 2;
                            destY = (targetSize - drawH) / 2;
                        }

                        tempCanvas.width = outW;
                        tempCanvas.height = outH;
                        tempCtx.clearRect(0, 0, outW, outH);
                        tempCtx.imageSmoothingEnabled = false; // Garante pixels nítidos no redimensionamento
                        
                        tempCtx.drawImage(
                            this.image,
                            srcX, srcY, srcW, srcH,
                            destX, destY, drawW, drawH
                        );

                        if (document.getElementById('useSharpen').checked) {
                            this.applySharpen(tempCtx, outW, outH);
                        }

                        const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/png'));
                        zip.file(`${frameData.key}.png`, blob);
                    }

                    const content = await zip.generateAsync({ type: 'blob' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(content);
                    link.download = 'spritesheet_frames.zip';
                    link.click();
                } catch (error) {
                    console.error(error);
                    alert('Erro ao gerar o ZIP.');
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }

            applySharpen(ctx, w, h) {
                // k é a intensidade. 0 = sem efeito, 1 = normal, acima disso = extra nítido
                const k = parseFloat(document.getElementById('sharpenIntensity').value);
                // Kernel de nitidez: a soma dos pesos deve ser 1 para manter o brilho
                const weights = [0, -k, 0, -k, 1 + (4 * k), -k, 0, -k, 0];
                const side = Math.round(Math.sqrt(weights.length));
                const halfSide = Math.floor(side / 2);
                const src = ctx.getImageData(0, 0, w, h);
                const sw = src.width;
                const sh = src.height;
                const s = src.data;
                const output = ctx.createImageData(w, h);
                const dst = output.data;

                for (let y = 0; y < sh; y++) {
                    for (let x = 0; x < sw; x++) {
                        const dstOff = (y * sw + x) * 4;
                        let r = 0, g = 0, b = 0;
                        for (let cy = 0; cy < side; cy++) {
                            for (let cx = 0; cx < side; cx++) {
                                const scy = Math.min(sh - 1, Math.max(0, y + cy - halfSide));
                                const scx = Math.min(sw - 1, Math.max(0, x + cx - halfSide));
                                const srcOff = (scy * sw + scx) * 4;
                                const wt = weights[cy * side + cx];
                                r += s[srcOff] * wt;
                                g += s[srcOff + 1] * wt;
                                b += s[srcOff + 2] * wt;
                            }
                        }
                        dst[dstOff] = Math.min(255, Math.max(0, r));
                        dst[dstOff + 1] = Math.min(255, Math.max(0, g));
                        dst[dstOff + 2] = Math.min(255, Math.max(0, b));
                        dst[dstOff + 3] = s[dstOff + 3]; // Mantém o canal alfa original
                    }
                }
                ctx.putImageData(output, 0, 0);
            }
        }
        
        // Inicializar a aplicação quando a página carregar
        window.addEventListener('DOMContentLoaded', () => {
            new SpriteSheetEditor();
        });
    </script>
</body>
</html>