<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editor de Vértices - Phaser.js</title>
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
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }

        header {
            background: #2c3e50;
            color: white;
            padding: 25px;
            text-align: center;
        }

        header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .main-content {
            display: flex;
            min-height: 600px;
        }

        .editor-section {
            flex: 3;
            padding: 20px;
            border-right: 2px solid #eee;
        }

        .controls-section {
            flex: 2;
            padding: 20px;
            background: #f8f9fa;
        }

        .grid-container {
            width: 100%;
            height: 500px;
            background: #fff;
            border: 3px solid #34495e;
            border-radius: 10px;
            position: relative;
            overflow: hidden;
            cursor: crosshair;
            touch-action: none;
        }

        .grid {
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: 
                linear-gradient(rgba(52, 152, 219, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(52, 152, 219, 0.1) 1px, transparent 1px);
            background-size: 20px 20px;
        }

        .origin {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 10px;
            height: 10px;
            background: #e74c3c;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 0 2px #e74c3c;
            z-index: 10;
        }

        .grid-line {
            position: absolute;
            background: rgba(52, 152, 219, 0.3);
        }

        .grid-line.x {
            width: 100%;
            height: 1px;
            left: 0;
        }

        .grid-line.y {
            width: 1px;
            height: 100%;
            top: 0;
        }

        .vertex {
            position: absolute;
            width: 16px;
            height: 16px;
            background: #27ae60;
            border: 3px solid white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            cursor: pointer;
            z-index: 20;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: all 0.2s;
        }

        .vertex:hover {
            transform: translate(-50%, -50%) scale(1.3);
            background: #2ecc71;
        }

        .vertex.active {
            background: #e74c3c;
            box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.3);
        }

        .vertex-index {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            min-width: 20px;
            text-align: center;
        }

        .shape-line {
            position: absolute;
            background: #3498db;
            height: 3px;
            transform-origin: 0 0;
            z-index: 5;
        }

        .shape-polygon {
            position: absolute;
            background: rgba(52, 152, 219, 0.2);
            border: 2px solid rgba(52, 152, 219, 0.5);
            z-index: 4;
        }

        .control-group {
            margin-bottom: 25px;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        }

        .control-group h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ecf0f1;
        }

        .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 5px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s;
            text-align: center;
            min-width: 150px;
        }

        .btn:hover {
            background: #2980b9;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .btn-danger {
            background: #e74c3c;
        }

        .btn-danger:hover {
            background: #c0392b;
        }

        .btn-success {
            background: #27ae60;
        }

        .btn-success:hover {
            background: #219653;
        }

        .btn-group {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
        }

        .slider-container {
            margin: 15px 0;
        }

        label {
            display: block;
            margin-bottom: 5px;
            color: #2c3e50;
            font-weight: 600;
        }

        input[type="range"] {
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: #ecf0f1;
            outline: none;
            -webkit-appearance: none;
        }

        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #3498db;
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .output {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 200px;
            overflow-y: auto;
            margin-top: 20px;
        }

        .coordinate-display {
            display: flex;
            gap: 15px;
            margin-top: 10px;
        }

        .coordinate-box {
            flex: 1;
            padding: 10px;
            background: #ecf0f1;
            border-radius: 5px;
            text-align: center;
        }

        .coordinate-box span {
            font-size: 12px;
            color: #7f8c8d;
            display: block;
        }

        .coordinate-box strong {
            font-size: 18px;
            color: #2c3e50;
        }

        .vertex-list {
            max-height: 150px;
            overflow-y: auto;
            margin-top: 10px;
        }

        .vertex-item {
            display: flex;
            justify-content: space-between;
            padding: 8px;
            background: #ecf0f1;
            margin-bottom: 5px;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .vertex-item:hover {
            background: #d5dbdb;
        }

        .vertex-item.active {
            background: #3498db;
            color: white;
        }

        .close-btn {
            color: #e74c3c;
            cursor: pointer;
            font-weight: bold;
            padding: 0 5px;
        }

        .templates {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 10px;
        }

        .template-btn {
            padding: 10px;
            background: #ecf0f1;
            border: 2px solid #bdc3c7;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
            font-size: 12px;
        }

        .template-btn:hover {
            background: #3498db;
            color: white;
            border-color: #3498db;
        }

        footer {
            text-align: center;
            padding: 20px;
            color: #7f8c8d;
            font-size: 14px;
            border-top: 2px solid #ecf0f1;
        }

        @media (max-width: 768px) {
            .main-content {
                flex-direction: column;
            }
            
            .editor-section, .controls-section {
                width: 100%;
            }
            
            .grid-container {
                height: 400px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎮 Editor de Vértices para Phaser.js</h1>
            <p>Crie formas para colisões no Matter.js com Phaser - Clique na grade para adicionar vértices</p>
        </header>

        <div class="main-content">
            <div class="editor-section">
                <div class="grid-container" id="gridContainer">
                    <div class="grid"></div>
                    <div class="origin" id="origin"></div>
                </div>
                
                <div class="coordinate-display">
                    <div class="coordinate-box">
                        <span>X DO MOUSE</span>
                        <strong id="mouseX">0</strong>
                    </div>
                    <div class="coordinate-box">
                        <span>Y DO MOUSE</span>
                        <strong id="mouseY">0</strong>
                    </div>
                    <div class="coordinate-box">
                        <span>VÉRTICES</span>
                        <strong id="vertexCount">0</strong>
                    </div>
                </div>
            </div>

            <div class="controls-section">
                <div class="control-group">
                    <h3>🔧 Controles</h3>
                    <div class="btn-group">
                        <button class="btn" id="addVertexBtn">Adicionar Vértice</button>
                        <button class="btn btn-danger" id="clearBtn">Limpar Tudo</button>
                        <button class="btn btn-success" id="copyBtn">Copiar Código</button>
                    </div>
                    
                    <div class="slider-container">
                        <label for="scaleSlider">Escala (vertsScale): <span id="scaleValue">0.94</span></label>
                        <input type="range" id="scaleSlider" min="0.1" max="2" step="0.01" value="0.94">
                    </div>
                </div>

                <div class="control-group">
                    <h3>📍 Vértices</h3>
                    <div class="vertex-list" id="vertexList">
                        <!-- Vértices serão listados aqui -->
                    </div>
                </div>

                <div class="control-group">
                    <h3>📐 Templates Rápidos</h3>
                    <div class="templates">
                        <div class="template-btn" data-template="triangle">Triângulo</div>
                        <div class="template-btn" data-template="square">Quadrado</div>
                        <div class="template-btn" data-template="ramp">Rampa 45°</div>
                        <div class="template-btn" data-template="line">Linha Horizontal</div>
                        <div class="template-btn" data-template="hexagon">Hexágono</div>
                        <div class="template-btn" data-template="circle">Círculo (8 lados)</div>
                    </div>
                </div>

                <div class="control-group">
                    <h3>📋 Código Phaser</h3>
                    <div class="output" id="codeOutput">
                        // Seu código aparecerá aqui
                    </div>
                </div>
            </div>
        </div>

        <footer>
            <p>Feito para Phaser.js com Matter.js | Clique na grade para criar vértices | Arraste vértices para mover</p>
        </footer>
    </div>

    <script>
        class VertexEditor {
            constructor() {
                this.vertices = [];
                this.activeVertex = null;
                this.vertsScale = 0.94;
                this.isDragging = false;
                this.gridSize = 20;
                
                this.initElements();
                this.setupEventListeners();
                this.updateCode();
            }

            initElements() {
                this.gridContainer = document.getElementById('gridContainer');
                this.mouseX = document.getElementById('mouseX');
                this.mouseY = document.getElementById('mouseY');
                this.vertexCount = document.getElementById('vertexCount');
                this.vertexList = document.getElementById('vertexList');
                this.codeOutput = document.getElementById('codeOutput');
                this.scaleSlider = document.getElementById('scaleSlider');
                this.scaleValue = document.getElementById('scaleValue');
                this.addVertexBtn = document.getElementById('addVertexBtn');
                this.clearBtn = document.getElementById('clearBtn');
                this.copyBtn = document.getElementById('copyBtn');
            }

            setupEventListeners() {
                // Grid interaction
                this.gridContainer.addEventListener('mousedown', (e) => this.onGridMouseDown(e));
                this.gridContainer.addEventListener('mousemove', (e) => this.onGridMouseMove(e));
                this.gridContainer.addEventListener('mouseup', () => this.onGridMouseUp());
                
                // Touch support for mobile
                this.gridContainer.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    this.onGridMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
                });
                
                this.gridContainer.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    this.onGridMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
                });
                
                this.gridContainer.addEventListener('touchend', () => this.onGridMouseUp());
                
                // Scale slider
                this.scaleSlider.addEventListener('input', (e) => {
                    this.vertsScale = parseFloat(e.target.value);
                    this.scaleValue.textContent = this.vertsScale.toFixed(2);
                    this.updateCode();
                });
                
                // Buttons
                this.addVertexBtn.addEventListener('click', () => this.addVertexAtCenter());
                this.clearBtn.addEventListener('click', () => this.clearAll());
                this.copyBtn.addEventListener('click', () => this.copyCode());
                
                // Template buttons
                document.querySelectorAll('.template-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const template = e.target.dataset.template;
                        this.loadTemplate(template);
                    });
                });
            }

            getGridCoordinates(clientX, clientY) {
                const rect = this.gridContainer.getBoundingClientRect();
                const x = clientX - rect.left;
                const y = clientY - rect.top;
                
                // Convert to grid coordinates (origin at center)
                const gridX = Math.round((x - rect.width / 2) / this.gridSize);
                const gridY = Math.round((y - rect.height / 2) / this.gridSize);
                
                return { gridX, gridY, pixelX: x, pixelY: y };
            }

            onGridMouseDown(e) {
                const coords = this.getGridCoordinates(e.clientX, e.clientY);
                
                // Check if clicking on existing vertex
                const clickedVertex = this.findVertexAt(coords.gridX, coords.gridY);
                
                if (clickedVertex) {
                    this.activeVertex = clickedVertex;
                    this.isDragging = true;
                } else {
                    // Add new vertex
                    this.addVertex(coords.gridX, coords.gridY);
                }
                
                this.updateDisplay();
            }

            onGridMouseMove(e) {
                const coords = this.getGridCoordinates(e.clientX, e.clientY);
                this.mouseX.textContent = coords.gridX;
                this.mouseY.textContent = coords.gridY;
                
                if (this.isDragging && this.activeVertex) {
                    this.activeVertex.x = coords.gridX;
                    this.activeVertex.y = coords.gridY;
                    this.updateDisplay();
                }
            }

            onGridMouseUp() {
                this.isDragging = false;
                this.activeVertex = null;
            }

            findVertexAt(x, y) {
                return this.vertices.find(v => v.x === x && v.y === y);
            }

            addVertex(x, y) {
                const vertex = { x, y };
                this.vertices.push(vertex);
                this.updateDisplay();
            }

            addVertexAtCenter() {
                this.addVertex(0, 0);
            }

            removeVertex(index) {
                this.vertices.splice(index, 1);
                this.updateDisplay();
            }

            clearAll() {
                this.vertices = [];
                this.updateDisplay();
            }

            updateDisplay() {
                // Clear grid container (keep grid and origin)
                const grid = this.gridContainer.querySelector('.grid');
                const origin = this.gridContainer.querySelector('.origin');
                this.gridContainer.innerHTML = '';
                this.gridContainer.appendChild(grid);
                this.gridContainer.appendChild(origin);
                
                // Draw shape polygon if we have at least 3 vertices
                if (this.vertices.length >= 3) {
                    this.drawPolygon();
                }
                
                // Draw shape lines
                this.drawLines();
                
                // Draw vertices
                this.vertices.forEach((vertex, index) => {
                    this.drawVertex(vertex, index);
                });
                
                // Update vertex list
                this.updateVertexList();
                
                // Update code
                this.updateCode();
                
                // Update vertex count
                this.vertexCount.textContent = this.vertices.length;
            }

            drawPolygon() {
                if (this.vertices.length < 3) return;
                
                const polygon = document.createElement('div');
                polygon.className = 'shape-polygon';
                
                // Find bounding box
                const xs = this.vertices.map(v => v.x);
                const ys = this.vertices.map(v => v.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);
                
                // Convert to pixel coordinates
                const rect = this.gridContainer.getBoundingClientRect();
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Create SVG polygon for complex shapes
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                svg.style.position = 'absolute';
                svg.style.zIndex = '4';
                
                const polygonPath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                
                const points = this.vertices.map(vertex => {
                    const x = centerX + vertex.x * this.gridSize;
                    const y = centerY + vertex.y * this.gridSize;
                    return `${x},${y}`;
                }).join(' ');
                
                polygonPath.setAttribute('points', points);
                polygonPath.setAttribute('fill', 'rgba(52, 152, 219, 0.2)');
                polygonPath.setAttribute('stroke', 'rgba(52, 152, 219, 0.5)');
                polygonPath.setAttribute('stroke-width', '2');
                
                svg.appendChild(polygonPath);
                this.gridContainer.appendChild(svg);
            }

            drawLines() {
                if (this.vertices.length < 2) return;
                
                const rect = this.gridContainer.getBoundingClientRect();
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                for (let i = 0; i < this.vertices.length; i++) {
                    const vertex1 = this.vertices[i];
                    const vertex2 = this.vertices[(i + 1) % this.vertices.length];
                    
                    const x1 = centerX + vertex1.x * this.gridSize;
                    const y1 = centerY + vertex1.y * this.gridSize;
                    const x2 = centerX + vertex2.x * this.gridSize;
                    const y2 = centerY + vertex2.y * this.gridSize;
                    
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                    
                    const line = document.createElement('div');
                    line.className = 'shape-line';
                    line.style.width = `${length}px`;
                    line.style.left = `${x1}px`;
                    line.style.top = `${y1}px`;
                    line.style.transform = `rotate(${angle}deg)`;
                    
                    this.gridContainer.appendChild(line);
                }
            }

            drawVertex(vertex, index) {
                const rect = this.gridContainer.getBoundingClientRect();
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const vertexEl = document.createElement('div');
                vertexEl.className = `vertex ${this.activeVertex === vertex ? 'active' : ''}`;
                vertexEl.style.left = `${centerX + vertex.x * this.gridSize}px`;
                vertexEl.style.top = `${centerY + vertex.y * this.gridSize}px`;
                
                const indexEl = document.createElement('div');
                indexEl.className = 'vertex-index';
                indexEl.textContent = index;
                
                vertexEl.appendChild(indexEl);
                
                vertexEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.activeVertex = vertex;
                    this.updateDisplay();
                });
                
                vertexEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    const vertexIndex = this.vertices.indexOf(vertex);
                    if (vertexIndex > -1) {
                        this.removeVertex(vertexIndex);
                    }
                });
                
                this.gridContainer.appendChild(vertexEl);
            }

            updateVertexList() {
                this.vertexList.innerHTML = '';
                
                this.vertices.forEach((vertex, index) => {
                    const item = document.createElement('div');
                    item.className = `vertex-item ${this.activeVertex === vertex ? 'active' : ''}`;
                    item.innerHTML = `
                        <span>Vértice ${index}: (${vertex.x}, ${vertex.y})</span>
                        <span class="close-btn" data-index="${index}">×</span>
                    `;
                    
                    item.querySelector('.close-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.removeVertex(index);
                    });
                    
                    item.addEventListener('click', () => {
                        this.activeVertex = vertex;
                        this.updateDisplay();
                    });
                    
                    this.vertexList.appendChild(item);
                });
            }

            updateCode() {
                if (this.vertices.length === 0) {
                    this.codeOutput.textContent = '// Adicione vértices clicando na grade';
                    return;
                }
                
                const verticesStr = this.vertices.map(v => `    { x: ${v.x}, y: ${v.y} }`).join(',\n');
                
                const code = `const shapeConfig = {
    type: 'fromVertices',
    x: 400,  // Posição X no mundo
    y: 300,  // Posição Y no mundo
    vertsScale: ${this.vertsScale.toFixed(2)},
    verts: [
${verticesStr}
    ]
};

// Para usar no Phaser:
this.matter.add.fromVertices(
    400, 300,
    [${this.vertices.map(v => `{x: ${v.x}, y: ${v.y}}`).join(', ')}],
    {
        isStatic: true,
        render: {
            fillStyle: '#3498db',
            strokeStyle: '#2980b9',
            lineWidth: 2
        }
    }
);`;
                
                this.codeOutput.textContent = code;
            }

            copyCode() {
                const text = this.codeOutput.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    const originalText = this.copyBtn.textContent;
                    this.copyBtn.textContent = '✓ Copiado!';
                    setTimeout(() => {
                        this.copyBtn.textContent = originalText;
                    }, 2000);
                });
            }

            loadTemplate(templateName) {
                let vertices = [];
                
                switch(templateName) {
                    case 'triangle':
                        vertices = [
                            { x: 0, y: -30 },
                            { x: 30, y: 30 },
                            { x: -30, y: 30 }
                        ];
                        break;
                        
                    case 'square':
                        vertices = [
                            { x: -25, y: -25 },
                            { x: 25, y: -25 },
                            { x: 25, y: 25 },
                            { x: -25, y: 25 }
                        ];
                        break;
                        
                    case 'ramp':
                        vertices = [
                            { x: -40, y: 20 },
                            { x: 40, y: 20 },
                            { x: 40, y: -20 }
                        ];
                        break;
                        
                    case 'line':
                        vertices = [
                            { x: -40, y: 0 },
                            { x: 40, y: 0 }
                        ];
                        break;
                        
                    case 'hexagon':
                        const radius = 25;
                        for (let i = 0; i < 6; i++) {
                            const angle = (i * 60) * Math.PI / 180;
                            vertices.push({
                                x: Math.round(Math.cos(angle) * radius),
                                y: Math.round(Math.sin(angle) * radius)
                            });
                        }
                        break;
                        
                    case 'circle':
                        const circleRadius = 30;
                        const sides = 8;
                        for (let i = 0; i < sides; i++) {
                            const angle = (i * 360 / sides) * Math.PI / 180;
                            vertices.push({
                                x: Math.round(Math.cos(angle) * circleRadius),
                                y: Math.round(Math.sin(angle) * circleRadius)
                            });
                        }
                        break;
                }
                
                this.vertices = vertices;
                this.updateDisplay();
            }
        }

        // Initialize the editor when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new VertexEditor();
        });
    </script>
</body>
</html>
