<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editor de Mapas com NPCs e Waypoints</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background-color: #1a1a2e;
            color: #e6e6e6;
            height: 100vh;
            overflow: hidden;
            padding: 0;
        }
        
        .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            width: 100vw;
            margin: 0;
            gap: 0;
        }
        
        .main-content {
            display: flex;
            flex: 1;
            gap: 20px;
            padding: 20px;
            height: calc(100vh - 40px);
        }
        
        .controls-panel {
            flex: 0 0 320px;
            background-color: #16213e;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            overflow-y: auto;
        }
        
        .map-container {
            flex: 1;
            background-color: #0f3460;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        
        .map-wrapper {
            width: 100%;
            height: 100%;
            overflow: auto;
            position: relative;
        }
        
        .map-area {
            position: relative;
            transform-origin: 0 0;
            transition: transform 0.1s ease;
        }
        
        .grid {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            background-image: 
                linear-gradient(rgba(100, 100, 100, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(100, 100, 100, 0.3) 1px, transparent 1px);
        }
        
        .control-group {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #0f3460;
        }
        
        .control-group h3 {
            color: #4cc9f0;
            margin-bottom: 10px;
            font-size: 1.1rem;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            color: #b8c1ec;
            font-size: 0.9rem;
        }
        
        input, select, button {
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 5px;
            border: 1px solid #0f3460;
            background-color: #1a1a2e;
            color: #e6e6e6;
            font-size: 0.9rem;
        }
        
        button {
            background-color: #4361ee;
            color: white;
            border: none;
            cursor: pointer;
            transition: background-color 0.3s;
            font-weight: 500;
        }
        
        button:hover {
            background-color: #3a56d4;
        }
        
        button.delete {
            background-color: #f72585;
        }
        
        button.delete:hover {
            background-color: #e01e74;
        }
        
        button.export {
            background-color: #4cc9f0;
            color: #1a1a2e;
        }
        
        button.export:hover {
            background-color: #3ab8df;
        }
        
        .object-list {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #0f3460;
            border-radius: 5px;
            padding: 10px;
            background-color: #1a1a2e;
            margin-bottom: 15px;
        }
        
        .object-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #0f3460;
            cursor: pointer;
            transition: background-color 0.2s;
            font-size: 0.85rem;
        }
        
        .object-item:hover {
            background-color: #0f3460;
        }
        
        .object-item.selected {
            background-color: #4361ee;
        }
        
        .object-item.multi-selected {
            background-color: #4cc9f0;
            border-left: 4px solid #4cc9f0;
        }
        
        .object-item.selected.multi-selected {
            background-color: linear-gradient(90deg, #4361ee 50%, #4cc9f0 50%);
        }
        
        .object-item:last-child {
            border-bottom: none;
        }
        
        .object-item .info {
            flex: 1;
        }
        
        .object-item .info span {
            display: block;
            color: #b8c1ec;
            font-size: 0.8rem;
        }
        
        .map-object {
            position: absolute;
            border: 2px solid;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            cursor: move;
            user-select: none;
            box-sizing: border-box;
            transform-origin: center;
        }
        
        .map-object.obstaculo {
            background-color: rgba(247, 37, 133, 0.7);
            border-color: #f72585;
        }
        
        .map-object.decoracao {
            background-color: rgba(76, 201, 240, 0.7);
            border-color: #4cc9f0;
        }
        
        .map-object.npc {
            background-color: rgba(76, 175, 80, 0.7);
            border-color: #4CAF50;
            border-radius: 50%;
        }
        
        .map-object.polygon {
            background-color: rgba(156, 39, 176, 0.5);
            border-color: #9C27B0;
        }
        
        .map-object.npc::after {
            content: '→';
            position: absolute;
            font-size: 20px;
            color: white;
            transform: translate(-50%, -50%);
            top: 50%;
            left: 50%;
        }
        
        .object-label {
            background-color: rgba(0, 0, 0, 0.7);
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 0.7rem;
            pointer-events: none;
            text-align: center;
            max-width: 100%;
            overflow: hidden;
        }
        
        .resize-handle {
            position: absolute;
            width: 12px;
            height: 12px;
            background-color: #ffd700;
            border: 2px solid #1a1a2e;
            border-radius: 2px;
            cursor: pointer;
            z-index: 10;
            opacity: 0.9;
            display: none;
        }
        
        .resize-handle:hover {
            background-color: #ffed4e;
            transform: scale(1.1);
        }
        
        .resize-handle.nw { 
            top: -6px; 
            left: -6px; 
            cursor: nw-resize; 
        }
        .resize-handle.ne { 
            top: -6px; 
            right: -6px; 
            cursor: ne-resize; 
        }
        .resize-handle.se { 
            bottom: -6px; 
            right: -6px; 
            cursor: se-resize; 
        }
        .resize-handle.sw { 
            bottom: -6px; 
            left: -6px; 
            cursor: sw-resize; 
        }
        
        .rotate-handle {
            position: absolute;
            width: 16px;
            height: 16px;
            background-color: #4cc9f0;
            border: 2px solid #1a1a2e;
            border-radius: 50%;
            cursor: pointer;
            z-index: 10;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0.9;
            display: none;
        }
        
        .rotate-handle:hover {
            background-color: #6fd9ff;
            transform: translateX(-50%) scale(1.1);
        }
        
        .rotation-indicator {
            position: absolute;
            top: -18px;
            left: 50%;
            width: 3px;
            height: 15px;
            background-color: #ffffff;
            transform-origin: bottom center;
            pointer-events: none;
            margin-left: -1.5px;
        }
        
        .selected {
            box-shadow: 0 0 0 3px #ffd700;
            z-index: 100;
        }
        
        .multi-selected {
            box-shadow: 0 0 0 3px #4cc9f0;
            z-index: 99;
            border-color: #4cc9f0 !important;
        }
        
        .multi-selected .object-label {
            background-color: rgba(76, 201, 240, 0.8);
        }
        
        .coordinates-display {
            position: absolute;
            top: 10px;
            left: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 0.8rem;
            z-index: 100;
            pointer-events: none;
        }
        
        .status-bar {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 0.8rem;
            z-index: 100;
            pointer-events: none;
        }
        
        .zoom-controls {
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 5px;
            z-index: 100;
        }
        
        .zoom-controls button {
            width: 30px;
            height: 30px;
            padding: 0;
            background-color: rgba(0, 0, 0, 0.7);
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin: 0;
        }
        
        .action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        .action-buttons button {
            flex: 1;
            padding: 8px;
            font-size: 0.85rem;
        }
        
        .object-actions button {
            padding: 4px 8px;
            font-size: 0.75rem;
            width: auto;
            margin: 0;
        }
        
        .storage-buttons {
            display: flex;
            gap: 5px;
            margin-top: 10px;
        }
        
        .storage-buttons button {
            flex: 1;
            padding: 8px;
            font-size: 0.8rem;
        }
        
        .json-buttons {
            display: flex;
            gap: 5px;
            margin-top: 10px;
        }
        
        .json-buttons button {
            flex: 1;
            padding: 8px;
            font-size: 0.8rem;
        }
        
        .save-button {
            background-color: #2ecc71;
        }
        
        .save-button:hover {
            background-color: #27ae60;
        }
        
        .load-button {
            background-color: #9b59b6;
        }
        
        .load-button:hover {
            background-color: #8e44ad;
        }
        
        .json-export-button {
            background-color: #e67e22;
        }
        
        .json-export-button:hover {
            background-color: #d35400;
        }
        
        .json-import-button {
            background-color: #3498db;
        }
        
        .json-import-button:hover {
            background-color: #2980b9;
        }
        
        /* Estilos para waypoints */
        .waypoint {
            position: absolute;
            width: 16px;
            height: 16px;
            background-color: rgba(255, 193, 7, 0.8);
            border: 2px solid #FFC107;
            border-radius: 50%;
            cursor: pointer;
            z-index: 200;
        }
        
        .waypoint:hover {
            background-color: rgba(255, 235, 59, 0.9);
            transform: scale(1.2);
        }
        
        .waypoint-line {
            position: absolute;
            pointer-events: none;
            z-index: 40;
            height: 3px;
            background-color: rgba(76, 175, 80, 0.5);
            transform-origin: 0 0;
        }
        
        .waypoint.selected {
            background-color: rgba(255, 87, 34, 0.9);
            border-color: #FF5722;
            transform: scale(1.3);
        }
        
        .waypoint.start {
            background-color: rgba(33, 150, 243, 0.9);
            border-color: #2196F3;
        }
        
        .path-mode .map-object:not(.npc) {
            opacity: 0.3;
        }
        
        .path-mode .waypoint {
            opacity: 1;
        }
        
        .edit-path-btn {
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            padding: 2px 8px !important;
            font-size: 10px !important;
            background-color: #4CAF50 !important;
            display: none;
            z-index: 101;
            width: auto !important;
        }
        
        .edit-path-btn:hover {
            background-color: #45a049 !important;
        }
        
        .npc-settings {
            margin-top: 15px;
            padding: 10px;
            background-color: rgba(26, 26, 46, 0.5);
            border-radius: 5px;
            border-left: 3px solid #4CAF50;
        }
        
        .file-input-wrapper {
            position: relative;
            margin-bottom: 15px;
        }
        
        .file-input-wrapper input[type="file"] {
            position: absolute;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
        }
        
        .file-input-label {
            display: block;
            padding: 10px;
            background-color: #1a1a2e;
            border: 2px dashed #4361ee;
            border-radius: 5px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .file-input-label:hover {
            background-color: #0f3460;
            border-color: #4cc9f0;
        }
        
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: #1a1a2e;
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: #4cc9f0;
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: #3ab8df;
        }
        
        .hidden-file-input {
            display: none;
        }
        
        .checkbox-wrapper {
            display: flex;
            align-items: center;
            margin-top: 10px;
            background-color: rgba(0, 0, 0, 0.2);
            padding: 5px;
            border-radius: 3px;
        }
        
        .checkbox-wrapper input[type="checkbox"] {
            width: auto;
            margin-bottom: 0;
            margin-right: 10px;
        }
        
        .checkbox-wrapper label {
            margin-bottom: 0;
            cursor: pointer;
            font-size: 0.85rem;
            color: #b8c1ec;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="main-content">
            <div class="controls-panel">
                <div class="control-group">
                    <h3>Configurações do Mapa</h3>
                    
                    <label for="map-width">Largura (px):</label>
                    <input type="number" id="map-width" value="4000" min="500" max="20000">
                    
                    <label for="map-height">Altura (px):</label>
                    <input type="number" id="map-height" value="4000" min="500" max="20000">
                    
                    <label for="grid-size">Tamanho da Grid (px):</label>
                    <input type="number" id="grid-size" value="50" min="10" max="200">
                    
                    <label for="snap-to-grid">Snap Grid:</label>
                    <select id="snap-to-grid">
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                    </select>
                    
                    <label for="snap-angle">Snap Ângulo:</label>
                    <select id="snap-angle">
                        <option value="0">Não</option>
                        <option value="15">15°</option>
                        <option value="45">45°</option>
                        <option value="90">90°</option>
                    </select>
                    
                    <label>Imagem de Fundo (Referência):</label>
                    <div class="file-input-wrapper" style="margin-bottom: 5px;">
                        <input type="file" id="map-bg-input" accept="image/*" class="hidden-file-input">
                        <label for="map-bg-input" class="file-input-label" style="padding: 8px; font-size: 0.85rem;">
                            🖼️ Definir Fundo do Mapa
                        </label>
                    </div>
                    <button id="clear-map-bg" class="delete" style="display: none; margin-bottom: 15px; padding: 5px; font-size: 0.8rem;">Remover Fundo</button>
                    
                    <button id="apply-settings">Aplicar Configurações</button>
                    
                    <div class="action-buttons">
                        <button id="btn-center-map" class="center-button">Centralizar Mapa</button>
                        <button id="btn-show-all" class="center-button">Ver Tudo</button>
                        <button id="btn-show-all-waypoints">Ver Todos Waypoints</button>
                    </div>
                </div>
                
                <div class="control-group">
                    <h3>Adicionar Objeto</h3>
                    <label for="object-id">ID do Objeto:</label>
                    <input type="text" id="object-id" placeholder="Ex: árvore, rocha, npc_1">
                    
                    <label for="object-type">Tipo:</label>
                    <select id="object-type">
                        <option value="obstaculo">Obstáculo</option>
                        <option value="decoracao">Decoração</option>
                        <option value="npc">NPC</option>
                        <option value="grupo_npc">Grupo de NPCs (Dado)</option>
                        <option value="vertices">Vértices (Polígono)</option>
                    </select>
                    
                    <label for="object-width">Largura (px):</label>
                    <input type="number" id="object-width" value="64" min="10">
                    
                    <label for="object-height">Altura (px):</label>
                    <input type="number" id="object-height" value="64" min="10">
                    
                    <label for="object-angle">Ângulo (graus):</label>
                    <input type="number" id="object-angle" value="0" min="0" max="360">
                    
                    <div id="grupo-npc-settings" class="npc-settings" style="display: none;">
                        <label for="grupo-npc-qtd">Quantidade (1-6):</label>
                        <input type="number" id="grupo-npc-qtd" value="4" min="1" max="6">
                        <label for="grupo-npc-spacing">Espaçamento (Fator):</label>
                        <input type="number" id="grupo-npc-spacing" value="1.5" step="0.1" min="0.1">
                        <div class="checkbox-wrapper">
                            <input type="checkbox" id="grupo-npc-individual-routes">
                            <label for="grupo-npc-individual-routes">Rotas Individuais (Sem Recálculo)</label>
                        </div>
                    </div>

                    <div id="npc-settings" class="npc-settings" style="display: none;">
                        <label for="npc-texture">Texture:</label>
                        <input type="text" id="npc-texture" placeholder="Ex: npc_alien" value="npc_alien">
                        
                        <label for="npc-speed">Speed:</label>
                        <input type="number" id="npc-speed" value="60" min="1" max="500">
                        
                        <label for="npc-scale">Scale:</label>
                        <input type="number" id="npc-scale" value="1.0" step="0.1" min="0.1" max="5">
                        
                        <label for="npc-path">Path Image:</label>
                        <input type="text" id="npc-path" placeholder="Ex: assets/alien.png" value="assets/alien.png">
                        
                        <div id="npc-group-settings" style="display: none; margin-bottom: 15px;">
                            <div class="checkbox-wrapper">
                                <input type="checkbox" id="edit-npc-individual-routes">
                                <label for="edit-npc-individual-routes">Rotas Individuais (Grupo)</label>
                            </div>
                        </div>
                        
                        <button id="edit-waypoints" type="button">Editar Waypoints</button>
                    </div>
                    
                    <div id="vertices-settings" class="npc-settings" style="display: none;">
                        <label for="vertices-json">Vértices (JSON):</label>
                        <textarea id="vertices-json" rows="5" placeholder="[{x:-10, y:-10}, {x:10, y:-10}, {x:0, y:10}]" style="width: 100%; background: #16213e; color: #b8c1ec; border: 1px solid #0f3460; border-radius: 5px; padding: 5px; font-family: monospace; font-size: 0.8rem; margin-bottom: 10px;"></textarea>
                        <label for="vertices-scale">Escala Vértices:</label>
                        <input type="number" id="vertices-scale" value="4.0" step="0.1">
                    </div>
                    
                    <div id="vertices-edit-controls" class="npc-settings" style="display: none;">
                        <button id="edit-vertices-btn" type="button">Editar Vértices no Mapa</button>
                        <button id="reset-vertices-btn" type="button" class="delete" style="margin-top: 5px;">Resetar Vértices (Limpar)</button>
                    </div>
                    
                    <button id="add-object">Criar Objeto</button>
                    <p style="font-size: 0.8rem; color: #b8c1ec; margin-top: 10px;">Clique no mapa para posicionar</p>
                </div>
                
                <div class="control-group">
                    <h3>Objetos <span id="objects-count">(0)</span></h3>
                    <div class="object-list" id="objects-list">
                        <p style="text-align: center; color: #b8c1ec; font-size: 0.9rem;">Nenhum objeto no mapa</p>
                    </div>
                    <div class="action-buttons">
                        <button id="center-selected">Centralizar</button>
                        <button id="copy-selected">Copiar Objeto</button>
                        <button id="paste-objects">Colar Objetos</button>
                        <button id="delete-selected" class="delete">Apagar Objeto</button>
                    </div>
                    <div class="action-buttons">
                        <button id="multi-select-mode" style="background-color: #666;">🔄 Modo Seleção Múltipla</button>
                        <button id="move-mode" style="background-color: #666;">🏃 Mover Seleção</button>
                        <button id="clear-selected" class="delete">Limpar Seleção</button>
                    </div>
                    <div class="action-buttons">
                        <button id="clear-all" class="delete">Limpar Tudo</button>
                    </div>
                </div>
                
                <div class="control-group">
                    <h3>Armazenamento Local</h3>
                    <div class="storage-buttons">
                        <button id="save-map" class="save-button">Salvar Mapa</button>
                        <button id="load-map" class="load-button">Carregar Mapa</button>
                    </div>
                    <button id="export-array" class="export">Exportar Array</button>
                    <button id="clean-base64" class="delete" style="background-color: #ff9800;">🗑️ Limpar Dados Base64</button>
                </div>
                
                <div class="control-group">
                    <h3>Importar/Exportar JSON</h3>
                    <div class="json-buttons">
                        <button id="export-json" class="json-export-button">Exportar para JSON</button>
                        <button id="import-json" class="json-import-button">Importar JSON</button>
                    </div>
                    
                    <div class="file-input-wrapper">
                        <input type="file" id="json-file-input" accept=".json" class="hidden-file-input">
                        <label for="json-file-input" class="file-input-label">
                            📁 Clique para selecionar arquivo JSON
                        </label>
                    </div>
                    
                    <p style="font-size: 0.8rem; color: #b8c1ec; margin-top: 10px;">
                        Exporta um arquivo .json completo com todos os dados do mapa
                    </p>
                </div>
                
                <div class="control-group">
                    <h3>Importar Imagens e Tilesets</h3>
                    
                    <div class="file-input-wrapper">
                        <input type="file" id="image-file-input" accept="image/*" class="hidden-file-input">
                        <label for="image-file-input" class="file-input-label">
                            🖼️ Importar Imagem
                        </label>
                    </div>
                    
                    <div class="file-input-wrapper">
                        <input type="file" id="tileset-file-input" accept="image/*" class="hidden-file-input">
                        <label for="tileset-file-input" class="file-input-label">
                            🏗️ Importar Tileset
                        </label>
                    </div>
                    
                    <div id="texture-preview" style="margin-top: 15px; padding: 10px; background-color: rgba(26, 26, 46, 0.5); border-radius: 5px; min-height: 100px; display: none;">
                        <h4 style="color: #4cc9f0; margin-bottom: 10px;">Texturas Disponíveis:</h4>
                        <div id="texture-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 10px; max-height: 200px; overflow-y: auto;"></div>
                    </div>
                    
                    <div id="texture-instructions" style="background-color: rgba(76, 201, 240, 0.1); padding: 10px; border-radius: 5px; margin-top: 10px; border-left: 3px solid #4cc9f0;">
                        <h4 style="color: #4cc9f0; margin-bottom: 5px;">Como usar texturas:</h4>
                        <ol style="color: #b8c1ec; font-size: 0.8rem; margin-left: 15px;">
                            <li>Importe uma imagem usando os botões acima</li>
                            <li>Selecione um ou mais objetos no mapa (Ctrl+click para múltiplos)</li>
                            <li>Clique na textura desejada para aplicar</li>
                        </ol>
                    </div>
                    
                    <p style="font-size: 0.8rem; color: #b8c1ec; margin-top: 10px;">
                        Importe imagens para usar como texturas nos objetos
                    </p>
                </div>
            </div>
            
            <div class="map-container">
                <div class="zoom-controls">
                    <input type="number" id="iso-scale-x" value="1.0" step="0.1" style="width: 60px; height: 30px; font-size: 0.7rem; background-color: rgba(0, 0, 0, 0.7); color: white; border: 1px solid #444; margin-right: 5px; display: none;" placeholder="Scale X" title="Escala Horizontal ISO">
                    <button id="btn-iso-toggle" style="width: 40px; font-size: 0.7rem; background-color: rgba(0, 0, 0, 0.7);">2D</button>
                    <button id="zoom-in">+</button>
                    <button id="zoom-out">-</button>
                    <button id="zoom-reset">100%</button>
                </div>
                <div class="coordinates-display" id="coordinates-display">X: 0, Y: 0</div>
                <div class="map-wrapper" id="map-wrapper">
                    <div class="map-area" id="map-area">
                        <div class="grid" id="grid"></div>
                    </div>
                </div>
                <div class="status-bar" id="status-bar">Mapa: 4000x4000 | Zoom: 100% | Objetos: 0</div>
            </div>
        </div>
    </div>

    <script>
        // ============================================
        // VARIÁVEIS GLOBAIS
        // ============================================
        let mapaArray = [];
        let selectedObject = null;
        let selectedObjects = []; // Array para múltiplos objetos selecionados
        let isDragging = false;
        let isResizing = false;
        let isRotating = false;
        let dragOffset = { x: 0, y: 0 };
        let currentObjectToAdd = null;
        let zoomLevel = 1;
        let mapWidth = 4000;
        let mapHeight = 4000;
        let baseGridSize = 50;
        let resizeDirection = '';
        let initialMousePos = { x: 0, y: 0 };
        let initialObjectState = {};
        let isMultiSelecting = false;
        let isIsometricView = false;
        let isoScaleX = 1.0;
        
        let hasMoved = false; // Variável para diferenciar clique de arrasto
        // Variáveis para NPCs e Waypoints
        let modoPath = false;
        let npcEditando = null;
        let waypoints = [];
        let waypointSelecionado = null;
        
        // Variáveis para importação de imagens/tilesets
        let availableTextures = [];
        let currentTextureSource = null;
        
        // Variável para modo de seleção múltipla
        let multiSelectMode = false;
        
        // Variável para modo de movimento
        let moveMode = false;
        let isMovingSelection = false;
        let moveStartPos = { x: 0, y: 0 };
        
        let isProgrammaticChange = false; // Flag para evitar que o evento 'change' seja disparado ao selecionar um objeto
        let isShowingAllWaypoints = false;
        // Variáveis para edição de Vértices
        let modoVertices = false;
        let objetoEditandoVertices = null;
        let verticesEdicao = [];
        let verticeSelecionado = null;
        
        // Objetos copiados para colar
        let copiedObjects = [];
        
        // Modo de colagem ativo
        let pasteMode = false;

        // ============================================
        // INICIALIZAÇÃO
        // ============================================
        document.addEventListener('DOMContentLoaded', function() {
            initMap();
        });

        function initMap() {
            // Configurar elementos do mapa
            updateMapSize();
            
            // Tentar carregar mapa salvo do localStorage
            loadMapFromStorage();
            
            // Carregar texturas disponíveis
            loadAvailableTextures();
            
            // Configurar eventos
            setupEventListeners();
            
            // Atualizar botões de ação
            updateActionButtons();
        }
        
        function setupEventListeners() {
            // Configurar eventos do tipo de objeto
            const objectTypeSelect = document.getElementById('object-type');
            objectTypeSelect.addEventListener('change', function() {
                if (isProgrammaticChange) return; // Ignora o evento se a mudança for via código

                const npcSettings = document.getElementById('npc-settings');
                const grupoNpcSettings = document.getElementById('grupo-npc-settings');
                const verticesSettings = document.getElementById('vertices-settings');
                const verticesEditControls = document.getElementById('vertices-edit-controls');

                // Hide all
                npcSettings.style.display = 'none';
                grupoNpcSettings.style.display = 'none';
                verticesSettings.style.display = 'none';
                verticesEditControls.style.display = 'none';

                if (this.value === 'npc' || this.value === 'grupo_npc') {
                    npcSettings.style.display = 'block';
                    document.getElementById('object-width').value = 64;
                    document.getElementById('object-height').value = 64;
                }
                if (this.value === 'grupo_npc') {
                    grupoNpcSettings.style.display = 'block';
                } else if (this.value === 'vertices') {
                    verticesSettings.style.display = 'block';
                }
            });

            // Configurações do mapa
            document.getElementById('apply-settings').addEventListener('click', function() {
                updateMapSize();
                updateGrid();
                saveMapToStorage();
            });
            
            // Adicionar objeto
            document.getElementById('add-object').addEventListener('click', addObjectToMap);
            
            // Navegação
            document.getElementById('btn-center-map').addEventListener('click', centerMap);
            document.getElementById('btn-show-all').addEventListener('click', showAllObjects);
            document.getElementById('btn-show-all-waypoints').addEventListener('click', toggleShowAllWaypoints);
            
            // Gerenciamento de objetos
            document.getElementById('center-selected').addEventListener('click', centerSelectedObject);
            document.getElementById('copy-selected').addEventListener('click', copySelectedObjects);
            document.getElementById('paste-objects').addEventListener('click', pasteObjects);
            document.getElementById('delete-selected').addEventListener('click', deleteSelectedObjects);
            document.getElementById('multi-select-mode').addEventListener('click', toggleMultiSelectMode);
            document.getElementById('move-mode').addEventListener('click', toggleMoveMode);
            document.getElementById('clear-selected').addEventListener('click', clearAllSelections);
            document.getElementById('clear-all').addEventListener('click', clearAllObjects);
            
            // Armazenamento
            document.getElementById('save-map').addEventListener('click', saveMapToStorage);
            document.getElementById('load-map').addEventListener('click', loadMapFromStorage);
            document.getElementById('export-array').addEventListener('click', exportArray);
            document.getElementById('clean-base64').addEventListener('click', cleanBase64Data);
            
            // JSON
            document.getElementById('export-json').addEventListener('click', exportToJSON);
            document.getElementById('import-json').addEventListener('click', () => {
                document.getElementById('json-file-input').click();
            });
            
            document.getElementById('json-file-input').addEventListener('change', handleJSONFileSelect);
            
            // Importação de imagens e tilesets
            document.getElementById('image-file-input').addEventListener('change', handleImageFileSelect);
            document.getElementById('tileset-file-input').addEventListener('change', handleTilesetFileSelect);
            
            // Imagem de fundo do mapa
            document.getElementById('map-bg-input').addEventListener('change', handleMapBackgroundSelect);
            document.getElementById('clear-map-bg').addEventListener('click', clearMapBackground);
            
            // Zoom
            document.getElementById('zoom-in').addEventListener('click', zoomIn);
            document.getElementById('zoom-out').addEventListener('click', zoomOut);
            document.getElementById('zoom-reset').addEventListener('click', resetZoom);
            
            // Isometric Toggle
            document.getElementById('btn-iso-toggle').addEventListener('click', toggleIsometricView);
            
            // Isometric Scale X
            document.getElementById('iso-scale-x').addEventListener('input', function() {
                isoScaleX = parseFloat(this.value) || 1.0;
                applyZoomToMap();
            });

            // NPC específico
            document.getElementById('edit-waypoints').addEventListener('click', entrarModoPath);
            
            // Vértices específico
            document.getElementById('edit-vertices-btn').addEventListener('click', () => entrarModoVertices());
            document.getElementById('reset-vertices-btn').addEventListener('click', () => {
                if (confirm('Limpar todos os vértices deste objeto?')) {
                    verticesEdicao = [];
                    desenharVertices();
                    // Atualizar objeto imediatamente
                    if (objetoEditandoVertices !== null) {
                        mapaArray[objetoEditandoVertices].verts = [];
                        saveMapToStorage();
                        // Atualizar visual
                        const oldElement = document.querySelector(`.map-object[data-index="${objetoEditandoVertices}"]`);
                        if (oldElement) oldElement.remove();
                        createMapObjectElement(mapaArray[objetoEditandoVertices], objetoEditandoVertices);
                        const newEl = document.querySelector(`.map-object[data-index="${objetoEditandoVertices}"]`);
                        if (newEl) selectObjectFromElement(newEl);
                    }
                }
            });
            
            // Eventos do mapa
            document.getElementById('map-area').addEventListener('mousemove', showMouseCoordinates);
            document.getElementById('map-area').addEventListener('click', handleMapClick);
            
            // Eventos de alteração de propriedades (Edição em tempo real)
            const propertyInputs = [
                'object-id', 'object-width', 'object-height', 'object-angle',
                'npc-texture', 'npc-speed', 'npc-scale', 'npc-path'
            ];
            
            propertyInputs.forEach(inputId => {
                const input = document.getElementById(inputId);
                if (input) {
                    input.addEventListener('change', function() {
                        if (selectedObject) {
                            updateSelectedObjectFromInput(inputId, this.value);
                        }
                    });
                }
            });
            
            // Validação de input para espaçamento (não permite negativo)
            const spacingInput = document.getElementById('grupo-npc-spacing');
            if (spacingInput) {
                spacingInput.addEventListener('change', function() {
                    if (parseFloat(this.value) < 0.1) this.value = 0.1;
                });
            }
            
            // Evento para checkbox de rotas individuais em edição
            const editIndividualRoutes = document.getElementById('edit-npc-individual-routes');
            if (editIndividualRoutes) {
                editIndividualRoutes.addEventListener('change', function() {
                    if (selectedObject) {
                        const index = parseInt(selectedObject.dataset.index);
                        const obj = mapaArray[index];
                        const newValue = this.checked;
                        
                        // Atualizar objeto atual
                        obj.ignoreGroupPath = newValue;
                        
                        // Se tiver grupo, atualizar todos do grupo para manter consistência
                        if (obj.groupId) {
                            mapaArray.forEach(item => {
                                if (item.groupId === obj.groupId) {
                                    item.ignoreGroupPath = newValue;
                                }
                            });
                        }
                        
                        saveMapToStorage();
                    }
                });
            }

            // Atalhos de teclado
            document.addEventListener('keydown', function(e) {
                // Escape para sair do modo path, colagem ou limpar seleção
                if (e.key === 'Escape') {
                    if (modoPath) {
                        sairModoPath();
                    } else if (modoVertices) {
                        sairModoVertices();
                    } else if (pasteMode) {
                        pasteMode = false;
                        updateStatusBar();
                        alert('Modo de colagem cancelado!');
                    } else {
                        clearAllSelections();
                    }
                }
                
                // Delete para remover objetos selecionados
                if (e.key === 'Delete' && !modoPath && !modoVertices) {
                    if (selectedObjects.length > 0) {
                        deleteSelectedObjects();
                    }
                }
                
                // Ctrl+A para selecionar todos os objetos
                if (e.ctrlKey && e.key === 'a' && !modoPath && !modoVertices) {
                    e.preventDefault();
                    selectAllObjects();
                }
                
                // Ctrl+C para copiar objetos
                if (e.ctrlKey && e.key === 'c' && !modoPath && !modoVertices) {
                    e.preventDefault();
                    if (selectedObjects.length > 0) {
                        copySelectedObjects();
                    }
                }
                
                // Ctrl+M para alternar modo seleção múltipla
                if (e.ctrlKey && e.key === 'm' && !modoPath && !modoVertices) {
                    e.preventDefault();
                    toggleMultiSelectMode();
                }
                
                // Ctrl+Z para desfazer último waypoint no modo path
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && modoPath) {
                    e.preventDefault();
                    if (waypoints.length > 0) {
                        waypoints.pop(); // Remove o último elemento do array
                        desenharWaypoints();
                        // Se o waypoint selecionado deixou de existir, limpa a seleção
                        if (waypointSelecionado !== null && waypointSelecionado >= waypoints.length) {
                            waypointSelecionado = null;
                        }
                    }
                }
                
                // Tecla Delete para remover waypoint selecionado no modo path
                if (e.key === 'Delete' && modoPath && waypointSelecionado !== null) {
                    waypoints.splice(waypointSelecionado, 1);
                    desenharWaypoints();
                    waypointSelecionado = null;
                }
                
                // Ctrl+Z para desfazer último vértice no modo vértices
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && modoVertices) {
                    e.preventDefault();
                    if (verticesEdicao.length > 0) {
                        verticesEdicao.pop();
                        desenharVertices();
                    }
                }
                
                // Tecla Delete para remover vértice selecionado
                if (e.key === 'Delete' && modoVertices && verticeSelecionado !== null) {
                    verticesEdicao.splice(verticeSelecionado, 1);
                    desenharVertices();
                    verticeSelecionado = null;
                }
            });
            
            // Redimensionamento da janela
            window.addEventListener('resize', handleWindowResize);
        }
        
        function handleWindowResize() {
            updateStatusBar();
        }
        
        // ============================================
        // FUNÇÕES DO MAPA
        // ============================================
        function updateMapSize() {
            mapWidth = parseInt(document.getElementById('map-width').value);
            mapHeight = parseInt(document.getElementById('map-height').value);
            
            const mapArea = document.getElementById('map-area');
            mapArea.style.width = `${mapWidth}px`;
            mapArea.style.height = `${mapHeight}px`;
            
            applyZoomToMap();
            updateStatusBar();
        }
        
        function updateGrid() {
            baseGridSize = parseInt(document.getElementById('grid-size').value);
            updateGridWithZoom();
        }
        
        function updateGridWithZoom() {
            const grid = document.getElementById('grid');
            const scaledGridSize = baseGridSize * zoomLevel;
            grid.style.backgroundSize = `${scaledGridSize}px ${scaledGridSize}px`;
        }
        
        function applyZoomToMap() {
            const mapArea = document.getElementById('map-area');
            
            if (isIsometricView) {
                // Fake Isometric: Apenas inclina a câmera (RotateX) sem girar o mapa
                mapArea.style.transformOrigin = '0 0';
                mapArea.style.transform = `scale(${zoomLevel}) scaleX(${isoScaleX}) rotateX(60deg)`;
            } else {
                mapArea.style.transformOrigin = '0 0';
                mapArea.style.transform = `scale(${zoomLevel})`;
            }
            
            updateGridWithZoom();
            updateStatusBar();
        }
        
        function updateStatusBar() {
            const statusBar = document.getElementById('status-bar');
            const viewMode = isIsometricView ? 'ISO' : '2D';
            let statusText = `Mapa: ${mapWidth}x${mapHeight} | Zoom: ${Math.round(zoomLevel * 100)}% | Vista: ${viewMode} | Objetos: ${mapaArray.length}`;
            
            if (modoPath) {
                statusText = `📝 MODO PATH | NPC: ${npcEditando !== null && mapaArray[npcEditando] ? mapaArray[npcEditando].id : 'Nenhum'} | Waypoints: ${waypoints.length} | ESC para sair`;
            } else if (modoVertices) {
                statusText = `📐 MODO VÉRTICES | Objeto: ${objetoEditandoVertices !== null && mapaArray[objetoEditandoVertices] ? mapaArray[objetoEditandoVertices].id : 'Nenhum'} | Vértices: ${verticesEdicao.length} | ESC para sair`;
            } else if (pasteMode) {
                statusText = `📋 MODO COLAGEM ATIVO | Objetos para colar: ${copiedObjects.length} | Clique no mapa para colar | ESC para cancelar`;
            } else if (moveMode) {
                statusText = `🏃 MODO MOVIMENTO ATIVO | Objetos selecionados: ${selectedObjects.length} | Clique e arraste para mover`;
            } else if (multiSelectMode) {
                statusText = `🔄 MODO SELEÇÃO MÚLTIPLA ATIVO | Objetos selecionados: ${selectedObjects.length} | Clique nos objetos para selecionar`;
            }
            
            if (statusBar) statusBar.textContent = statusText;
            
            const objectsCount = document.getElementById('objects-count');
            if (objectsCount) objectsCount.textContent = `(${mapaArray.length})`;
        }

        function showMouseCoordinates(e) {
            const rect = document.getElementById('map-area').getBoundingClientRect();
            const scale = zoomLevel;
            const x = Math.max(0, Math.min(Math.round((e.clientX - rect.left) / scale), mapWidth));
            const y = Math.max(0, Math.min(Math.round((e.clientY - rect.top) / scale), mapHeight));
            const coordsDisplay = document.getElementById('coordinates-display');
            if (coordsDisplay) coordsDisplay.textContent = `X: ${x}, Y: ${y}`;
        }

        // ============================================
        // FUNÇÕES DE OBJETOS
        // ============================================
        function addObjectToMap() {
            const objectId = document.getElementById('object-id').value.trim();
            const objectType = document.getElementById('object-type').value;
            const objectWidth = parseInt(document.getElementById('object-width').value);
            const objectHeight = parseInt(document.getElementById('object-height').value);
            const objectAngle = parseInt(document.getElementById('object-angle').value) || 0;
            
            console.log('=== DEBUG ADD OBJECT TO MAP ===');
            console.log('objectId:', objectId);
            console.log('objectType:', objectType);
            console.log('currentObjectToAdd ANTES:', currentObjectToAdd);
            
            if (!objectId) {
                alert('Por favor, insira um ID para o objeto');
                return;
            }
            
            currentObjectToAdd = {
                id: objectId,
                tipo: objectType,
                width: objectWidth,
                height: objectHeight,
                angle: objectAngle
            };
            
            // Se for NPC, adicionar propriedades específicas
            if (objectType === 'npc') {
                currentObjectToAdd.texture = document.getElementById('npc-texture').value || 'npc_default';
                currentObjectToAdd.speed = parseInt(document.getElementById('npc-speed').value) || 60;
                currentObjectToAdd.scale = parseFloat(document.getElementById('npc-scale').value) || 1.0;
                currentObjectToAdd.path = document.getElementById('npc-path').value || '';
                currentObjectToAdd.waypoints = [];
            }

            // Se for Grupo de NPCs
            if (objectType === 'grupo_npc') {
                currentObjectToAdd.qtd = parseInt(document.getElementById('grupo-npc-qtd').value) || 4;
                
                let spacingVal = parseFloat(document.getElementById('grupo-npc-spacing').value) || 1.5;
                if (spacingVal < 0.1) spacingVal = 0.1;
                currentObjectToAdd.spacing = spacingVal;
                currentObjectToAdd.ignoreGroupPath = document.getElementById('grupo-npc-individual-routes').checked;

                currentObjectToAdd.texture = document.getElementById('npc-texture').value || 'npc_alien';
                currentObjectToAdd.speed = parseInt(document.getElementById('npc-speed').value) || 60;
                currentObjectToAdd.scale = parseFloat(document.getElementById('npc-scale').value) || 1.0;
                currentObjectToAdd.path = document.getElementById('npc-path').value || '';
            }
            
            // Se for Vértices, validar JSON
            if (objectType === 'vertices') {
                // FIX: Começar sempre vazio para novos objetos (sem histórico)
                currentObjectToAdd.verts = [];
                currentObjectToAdd.vertsScale = parseFloat(document.getElementById('vertices-scale').value) || 1.0;
            }
            
            console.log('currentObjectToAdd DEPOIS:', currentObjectToAdd);
            console.log('=== FIM DEBUG ADD OBJECT TO MAP ===');
            
            alert(`Clique no mapa para posicionar o ${objectType === 'npc' ? 'NPC' : 'objeto'} "${objectId}"`);
        }
        
        function handleMapClick(e) {
            console.log('=== HANDLE MAP CLICK INICIADO ===');
            
            // Se estiver no modo path, adicionar waypoint
            if (modoPath && npcEditando !== null) {
                console.log('Modo path ativo, adicionando waypoint');
                adicionarWaypoint(e);
                return;
            }
            
            // Se estiver no modo vértices, adicionar vértice
            if (modoVertices && objetoEditandoVertices !== null) {
                console.log('Modo vértices ativo, adicionando vértice');
                adicionarVerticePoligono(e);
                return;
            }
            
            // VERIFICAR PRIMEIRO: Se há objeto para criar
            if (currentObjectToAdd) {
                console.log('🎯 CRIAÇÃO DE OBJETO - objeto para criar encontrado');
                console.log('currentObjectToAdd:', currentObjectToAdd);
                
                // Código para adicionar novos objetos
                const snapToGrid = document.getElementById('snap-to-grid').value === 'true';
                const gridSize = parseInt(document.getElementById('grid-size').value);
                const rect = document.getElementById('map-area').getBoundingClientRect();
                const scale = zoomLevel;
                
                // Posição do clique (canto superior esquerdo do objeto)
                let x = (e.clientX - rect.left) / scale;
                let y = (e.clientY - rect.top) / scale;
                
                if (snapToGrid && gridSize > 0) {
                    x = Math.round(x / gridSize) * gridSize;
                    y = Math.round(y / gridSize) * gridSize;
                }
                
                console.log('Posição do clique:', x, y);
                
                // Lógica para Grupo de NPCs
                if (currentObjectToAdd.tipo === 'grupo_npc') {
                    const qtd = currentObjectToAdd.qtd;
                    const spacing = currentObjectToAdd.spacing;
                    const coords = gerarCoordenadasDado(qtd, x, y, currentObjectToAdd.width, currentObjectToAdd.height, spacing);
                    const groupId = 'group_' + Date.now();
                    const ignoreGroupPath = currentObjectToAdd.ignoreGroupPath;
                    
                    coords.forEach((coord, idx) => {
                        const newObject = {
                            id: `${currentObjectToAdd.id}_${idx + 1}`,
                            tipo: 'npc', // Converte para NPC individual
                            x: Math.round(coord.x),
                            y: Math.round(coord.y),
                            width: currentObjectToAdd.width,
                            height: currentObjectToAdd.height,
                            angle: currentObjectToAdd.angle,
                            texture: currentObjectToAdd.texture,
                            speed: currentObjectToAdd.speed,
                            scale: currentObjectToAdd.scale,
                            path: currentObjectToAdd.path,
                            waypoints: [{x: Math.round(coord.x), y: Math.round(coord.y)}],
                            groupId: groupId,
                            ignoreGroupPath: ignoreGroupPath
                        };
                        
                        mapaArray.push(newObject);
                        createMapObjectElement(newObject, mapaArray.length - 1);
                    });
                    
                    renderObjectsList();
                    saveMapToStorage();
                    currentObjectToAdd = null;
                    console.log('✅ Grupo de NPCs criado!');
                    return;
                }

                const newObject = {
                    id: currentObjectToAdd.id,
                    tipo: currentObjectToAdd.tipo,
                    x: Math.round(x),
                    y: Math.round(y),
                    width: currentObjectToAdd.width,
                    height: currentObjectToAdd.height,
                    angle: currentObjectToAdd.angle
                };
                
                // Adicionar propriedades específicas de NPC
                if (currentObjectToAdd.tipo === 'npc') {
                    newObject.texture = currentObjectToAdd.texture;
                    newObject.speed = currentObjectToAdd.speed;
                    newObject.scale = currentObjectToAdd.scale;
                    newObject.path = currentObjectToAdd.path;
                    newObject.waypoints = [{x: Math.round(x), y: Math.round(y)}]; // Waypoint inicial
                }
                
                // Adicionar propriedades específicas de Vértices
                if (currentObjectToAdd.tipo === 'vertices') {
                    newObject.tipo = 'obstaculo'; // Engine usa 'obstaculo'
                    newObject.type = 'fromVertices';
                    newObject.verts = []; // Garante que começa vazio
                    newObject.vertsScale = currentObjectToAdd.vertsScale;
                }
                
                console.log('Objeto a ser criado:', newObject);
                
                // ADICIONAR AO ARRAY PRIMEIRO
                mapaArray.push(newObject);
                const elementIndex = mapaArray.length - 1;
                console.log('Objeto adicionado ao mapaArray. Índice:', elementIndex);
                
                // Criar elemento DOM
                createMapObjectElement(newObject, elementIndex);
                
                // Renderizar lista de objetos
                renderObjectsList();
                
                // Salvar no localStorage
                saveMapToStorage();
                
                // Limpar variável para evitar criação múltipla
                currentObjectToAdd = null;
                
                console.log('✅ Objeto criado com sucesso!');
                console.log('=== FIM CRIAÇÃO DE OBJETO ===');
                
                // Auto-entrar no modo de edição de vértices se for polígono
                if (newObject.type === 'fromVertices') {
                    const newEl = document.querySelector(`.map-object[data-index="${elementIndex}"]`);
                    if (newEl) selectObjectFromElement(newEl);
                    entrarModoVertices(elementIndex);
                    updateStatusBar();
                }
                
                return; // Importante: sair após criar objeto
            }
            
            console.log('❌ Nenhum objeto para criar, processando seleção...');
            
            // SEGUNDO: Processar seleção de objetos (apenas se não há objeto para criar)
            const isCtrlClick = e.ctrlKey || e.metaKey;
            
            // Melhorar detecção de objeto clicado
            let clickedObject = null;
            
            // Tentar diferentes formas de encontrar o objeto
            if (e.target.classList.contains('map-object')) {
                clickedObject = e.target;
            } else if (e.target.closest('.map-object')) {
                clickedObject = e.target.closest('.map-object');
            } else if (e.target.parentElement && e.target.parentElement.classList.contains('map-object')) {
                clickedObject = e.target.parentElement;
            }
                
                // Verificar se houve movimento (arrasto)
                // Se houve, cancelamos qualquer lógica de clique (toggle/seleção)
                if (hasMoved) {
                    hasMoved = false;
                    return;
                }
            
            console.log('=== DEBUG HANDLE MAP CLICK ===');
            console.log('Multi-select mode:', multiSelectMode);
            console.log('Move mode:', moveMode);
            console.log('Ctrl click:', isCtrlClick);
            console.log('Event target:', e.target);
            console.log('Event target className:', e.target.className);
            console.log('Clicked object:', clickedObject);
            console.log('Current object to add:', currentObjectToAdd);
            console.log('mapaArray.length:', mapaArray.length);
            
            if (clickedObject) {
                console.log('Objeto detectado! Processando seleção...');
                
                if (moveMode && selectedObjects.length > 0) {
                    // Modo movimento: iniciar arrasto de seleção múltipla
                    console.log('MODO MOVIMENTO - iniciando arrasto de seleção');
                    startMoveSelection(e, clickedObject);
                    return;
                } else if (multiSelectMode) {
                    // Modo seleção múltipla: clique direto seleciona
                    console.log('ENTRANDO NO MODO MÚLTIPLO - chamando handleMultiSelectClick');
                        
                        // O mousedown já selecionou o objeto via selectObjectFromElement.
                        // Se já estava selecionado antes do clique (wasSelected), então o usuário quer deselecionar.
                        const wasSelected = clickedObject.dataset.wasSelected === 'true';
                        if (wasSelected) {
                            handleMultiSelectClick(clickedObject);
                        }
                    return; // Importante: sair após processar no modo múltiplo
                } else if (isCtrlClick) {
                    // Seleção múltipla com Ctrl+click (método tradicional)
                    console.log('ENTRANDO NO CTRL+CLICK - chamando toggleObjectSelection');
                        
                        // Mesma lógica: só deseleciona se JÁ estava selecionado antes do clique começar
                        const wasSelected = clickedObject.dataset.wasSelected === 'true';
                        if (wasSelected) {
                            toggleObjectSelection(clickedObject);
                        }
                    return; // Importante: sair após processar no Ctrl+click
                } else {
                    // Seleção simples (quando não está em modo múltiplo)
                    console.log('Seleção simples - chamando selectObjectFromElement');
                    
                    if (multiSelectMode) {
                        // Em modo múltiplo, sempre usar seleção múltipla
                        toggleObjectSelection(clickedObject);
                    } else {
                        // Modo normal, seleção simples
                        
                        // Se houve movimento (arrasto), não alterar a seleção (que já foi feita no mousedown)
                        if (hasMoved) {
                            hasMoved = false;
                            return;
                        }

                        // Verificar estado visual ANTERIOR (salvo no mousedown) para decisão de toggle
                        const wasSelected = clickedObject.dataset.wasSelected === 'true';
                        clearAllSelections();
                        
                        if (!wasSelected) {
                            selectObjectFromElement(clickedObject);
                        }
                    }
                    return; // Importante: sair após processar clique em objeto
                }
            } else {
                console.log('Nenhum objeto detectado no clique');
                console.log('DEBUG - copiedObjects.length:', copiedObjects.length);
                console.log('DEBUG - multiSelectMode:', multiSelectMode);
                console.log('DEBUG - moveMode:', moveMode);
                console.log('DEBUG - currentObjectToAdd:', currentObjectToAdd);
                
                // Se está no modo de colagem, colar objetos
                if (pasteMode && copiedObjects.length > 0) {
                    console.log('MODO COLAGEM ATIVO! Colando objetos...');
                    pasteObjectsAtPosition(e);
                    pasteMode = false; // Desativar modo após colar
                    updateStatusBar();
                    return;
                }
                // Se há objetos copiados e não está criando novo objeto, também colar
                else if (copiedObjects.length > 0 && !currentObjectToAdd) {
                    console.log('Colando objetos automaticamente...');
                    pasteObjectsAtPosition(e);
                    return;
                }
                
                if (!multiSelectMode && !moveMode && !currentObjectToAdd) {
                    // Limpar seleção apenas se não estiver em modo especial
                    console.log('Limpando seleção...');
                    clearAllSelections();
                }
            }
        }
        
        function createMapObjectElement(obj, index) {
            console.log('=== DEBUG CREATE MAP OBJECT ===');
            console.log('Criando objeto:', obj);
            console.log('Index:', index);
            console.log('mapaArray antes da criação:', mapaArray.length, 'objetos');
            
            if (obj.tipo === 'npc') {
                return criarNPCElement(obj, index);
            }
            
            const objectElement = document.createElement('div');
            objectElement.className = `map-object ${obj.tipo}`;
            objectElement.dataset.index = index;
            
            objectElement.style.left = `${obj.x}px`;
            objectElement.style.top = `${obj.y}px`;
            objectElement.style.width = `${obj.width}px`;
            objectElement.style.height = `${obj.height}px`;
            objectElement.style.transform = `rotate(${obj.angle}deg)`;
            objectElement.style.transformOrigin = 'center';
            
            console.log('Elemento criado com dataset-index:', objectElement.dataset.index);
            
            const label = document.createElement('div');
            label.className = 'object-label';
            label.textContent = `${obj.id} (${obj.width}x${obj.height})`;
            objectElement.appendChild(label);
            
            // Handles de redimensionamento
            ['nw', 'ne', 'se', 'sw'].forEach(position => {
                const handle = document.createElement('div');
                handle.className = `resize-handle ${position}`;
                handle.style.display = 'none';
                handle.addEventListener('mousedown', function(e) {
                    e.stopPropagation();
                    startResize(e, objectElement, position);
                });
                objectElement.appendChild(handle);
            });
            
            // Handle de rotação
            const rotateHandle = document.createElement('div');
            rotateHandle.className = 'rotate-handle';
            rotateHandle.style.display = 'none';
            rotateHandle.style.transform = 'translate(-50%, -50%)';
            
            const rotationIndicator = document.createElement('div');
            rotationIndicator.className = 'rotation-indicator';
            rotationIndicator.style.transform = `rotate(${obj.angle}deg)`;
            rotateHandle.appendChild(rotationIndicator);
            
            rotateHandle.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                startRotate(e, objectElement);
            });
            
            objectElement.appendChild(rotateHandle);
            
            // Eventos
            objectElement.addEventListener('mousedown', startDragObject);
            
            // Renderização especial para Polígonos (fromVertices)
            if (obj.type === 'fromVertices' && obj.verts) {
                if (obj.verts.length === 0) {
                    objectElement.style.border = '2px dashed #9C27B0';
                    objectElement.style.backgroundColor = 'rgba(156, 39, 176, 0.2)';
                } else {
                objectElement.classList.add('polygon');
                objectElement.style.border = 'none'; // Remove borda padrão
                objectElement.style.backgroundColor = 'transparent'; // Fundo transparente
                
                // Criar SVG para visualizar o polígono
                const svgNS = "http://www.w3.org/2000/svg";
                const svg = document.createElementNS(svgNS, "svg");
                svg.style.position = 'absolute';
                svg.style.left = '0';
                svg.style.top = '0';
                svg.style.width = '100%';
                svg.style.height = '100%';
                svg.style.overflow = 'visible';
                
                const polygon = document.createElementNS(svgNS, "polygon");
                
                // Converter vértices para pontos do SVG
                // Os vértices são relativos ao centro (0,0), precisamos centralizá-los no div
                const centerX = obj.width / 2;
                const centerY = obj.height / 2;
                const scale = obj.vertsScale || 1.0;
                
                const pointsStr = obj.verts.map(v => {
                    const px = centerX + (v.x * scale);
                    const py = centerY + (v.y * scale);
                    return `${px},${py}`;
                }).join(' ');
                
                polygon.setAttribute("points", pointsStr);
                polygon.setAttribute("fill", "rgba(156, 39, 176, 0.5)");
                polygon.setAttribute("stroke", "#9C27B0");
                polygon.setAttribute("stroke-width", "2");
                
                svg.appendChild(polygon);
                objectElement.insertBefore(svg, label); // Inserir antes do label
                }
            }
            
            const mapArea = document.getElementById('map-area');
            mapArea.appendChild(objectElement);
            
            console.log('Elemento adicionado ao DOM');
            console.log('mapaArray depois da criação:', mapaArray.length, 'objetos');
            
            return objectElement;
        }
        
        function criarNPCElement(obj, index) {
            const objectElement = document.createElement('div');
            objectElement.className = `map-object npc`;
            objectElement.dataset.index = index;
            
            // Configurações específicas para NPC
            objectElement.setAttribute('data-texture', obj.texture || 'npc_default');
            objectElement.setAttribute('data-speed', obj.speed || 60);
            objectElement.setAttribute('data-scale', obj.scale || 1.0);
            objectElement.setAttribute('data-path', obj.path || '');
            
            objectElement.style.left = `${obj.x}px`;
            objectElement.style.top = `${obj.y}px`;
            objectElement.style.width = `${obj.width}px`;
            objectElement.style.height = `${obj.height}px`;
            objectElement.style.transform = `rotate(${obj.angle}deg)`;
            objectElement.style.transformOrigin = 'center';
            
            const label = document.createElement('div');
            label.className = 'object-label';
            label.textContent = `${obj.id} (NPC)`;
            objectElement.appendChild(label);
            
            // Botão especial para editar waypoints
            const editPathBtn = document.createElement('button');
            editPathBtn.className = 'edit-path-btn';
            editPathBtn.textContent = 'Editar Caminho';
            editPathBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                entrarModoPath(index);
            });
            objectElement.appendChild(editPathBtn);
            
            // Handles de redimensionamento (NPCs também podem ser redimensionados)
            ['nw', 'ne', 'se', 'sw'].forEach(position => {
                const handle = document.createElement('div');
                handle.className = `resize-handle ${position}`;
                handle.style.display = 'none';
                handle.addEventListener('mousedown', function(e) {
                    e.stopPropagation();
                    startResize(e, objectElement, position);
                });
                objectElement.appendChild(handle);
            });
            
            // Handle de rotação
            const rotateHandle = document.createElement('div');
            rotateHandle.className = 'rotate-handle';
            rotateHandle.style.display = 'none';
            rotateHandle.style.transform = 'translate(-50%, -50%)';
            
            const rotationIndicator = document.createElement('div');
            rotationIndicator.className = 'rotation-indicator';
            rotationIndicator.style.transform = `rotate(${obj.angle}deg)`;
            rotateHandle.appendChild(rotationIndicator);
            
            rotateHandle.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                startRotate(e, objectElement);
            });
            
            objectElement.appendChild(rotateHandle);
            
            // Eventos
            objectElement.addEventListener('mousedown', startDragObject);
            
            document.getElementById('map-area').appendChild(objectElement);
            return objectElement;
        }
        
        function startDragObject(e) {
            if (e.target.classList.contains('resize-handle') || 
                e.target.classList.contains('rotate-handle') ||
                e.target.classList.contains('edit-path-btn')) {
                return;
            }
            
            e.stopPropagation();
            
            const objectElement = e.currentTarget;
            const index = parseInt(objectElement.dataset.index);
            
            // Salvar estado anterior para lógica de toggle no click
            const isSelected = objectElement.classList.contains('selected');
            objectElement.dataset.wasSelected = isSelected;
            hasMoved = false;
            
            isDragging = true;
            selectedObject = objectElement;
            
            const rect = objectElement.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            document.addEventListener('mousemove', dragObject);
            document.addEventListener('mouseup', stopDragObject);
            
            // Se não for Ctrl/Meta e não for modo múltiplo,
            // e o objeto clicado NÃO estiver selecionado, limpar outras seleções.
            // Isso garante que arrastar um novo objeto limpe a seleção anterior imediatamente.
            const isCtrl = e.ctrlKey || e.metaKey;
            if (!isCtrl && !multiSelectMode && !selectedObjects.includes(index)) {
                clearAllSelections();
            }
            
            selectObjectFromElement(objectElement);
        }
        
        function dragObject(e) {
            if (!isDragging || !selectedObject) return;
            
            e.preventDefault();
            hasMoved = true;
            
            const snapToGrid = document.getElementById('snap-to-grid').value === 'true';
            const gridSize = parseInt(document.getElementById('grid-size').value);
            const rect = document.getElementById('map-area').getBoundingClientRect();
            const scale = zoomLevel;
            
            let x = (e.clientX - rect.left) / scale - dragOffset.x / scale;
            let y = (e.clientY - rect.top) / scale - dragOffset.y / scale;
            
            if (snapToGrid && gridSize > 0) {
                x = Math.round(x / gridSize) * gridSize;
                y = Math.round(y / gridSize) * gridSize;
            }
            
            const objWidth = parseInt(selectedObject.style.width);
            const objHeight = parseInt(selectedObject.style.height);
            
            // Limites: não pode sair do mapa
            const minX = 0;
            const maxX = mapWidth - objWidth;
            const minY = 0;
            const maxY = mapHeight - objHeight;
            
            x = Math.max(minX, Math.min(x, maxX));
            y = Math.max(minY, Math.min(y, maxY));
            
            selectedObject.style.left = `${x}px`;
            selectedObject.style.top = `${y}px`;
            
            const index = parseInt(selectedObject.dataset.index);
            mapaArray[index].x = Math.round(x);
            mapaArray[index].y = Math.round(y);
            
            // Atualizar primeiro waypoint se for NPC
            if (mapaArray[index].tipo === 'npc' && mapaArray[index].waypoints && mapaArray[index].waypoints.length > 0) {
                mapaArray[index].waypoints[0] = {x: Math.round(x), y: Math.round(y)};
            }
            
            renderObjectsList();
        }
        
        function stopDragObject() {
            if (!isDragging) return;
            
            isDragging = false;
            document.removeEventListener('mousemove', dragObject);
            document.removeEventListener('mouseup', stopDragObject);
            
            saveMapToStorage();
        }
        
        // ============================================
        // FUNÇÕES DE REDIMENSIONAMENTO
        // ============================================
        function startResize(e, objectElement, direction) {
            e.stopPropagation();
            
            const index = parseInt(objectElement.dataset.index);
            const obj = mapaArray[index];
            
            isResizing = true;
            resizeDirection = direction;
            selectedObject = objectElement;
            
            // Salva estado inicial
            initialMousePos = { x: e.clientX, y: e.clientY };
            initialObjectState = {
                x: obj.x,
                y: obj.y,
                width: obj.width,
                height: obj.height,
                left: parseInt(objectElement.style.left),
                top: parseInt(objectElement.style.top),
                angle: obj.angle
            };
            
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
        }
        
        function handleResize(e) {
            if (!isResizing || !selectedObject) return;
            
            e.preventDefault();
            
            const snapToGrid = document.getElementById('snap-to-grid').value === 'true';
            const gridSize = parseInt(document.getElementById('grid-size').value);
            const rect = document.getElementById('map-area').getBoundingClientRect();
            const scale = zoomLevel;
            
            const deltaX = (e.clientX - initialMousePos.x) / scale;
            const deltaY = (e.clientY - initialMousePos.y) / scale;
            
            const index = parseInt(selectedObject.dataset.index);
            const obj = mapaArray[index];
            
            let newX = initialObjectState.x;
            let newY = initialObjectState.y;
            let newWidth = initialObjectState.width;
            let newHeight = initialObjectState.height;
            
            // Calcula nova posição e tamanho baseado na direção do resize
            switch(resizeDirection) {
                case 'nw': // Canto superior esquerdo
                    newWidth = Math.max(10, initialObjectState.width - deltaX);
                    newHeight = Math.max(10, initialObjectState.height - deltaY);
                    newX = initialObjectState.x + (initialObjectState.width - newWidth);
                    newY = initialObjectState.y + (initialObjectState.height - newHeight);
                    break;
                case 'ne': // Canto superior direito
                    newWidth = Math.max(10, initialObjectState.width + deltaX);
                    newHeight = Math.max(10, initialObjectState.height - deltaY);
                    newY = initialObjectState.y + (initialObjectState.height - newHeight);
                    break;
                case 'se': // Canto inferior direito
                    newWidth = Math.max(10, initialObjectState.width + deltaX);
                    newHeight = Math.max(10, initialObjectState.height + deltaY);
                    break;
                case 'sw': // Canto inferior esquerdo
                    newWidth = Math.max(10, initialObjectState.width - deltaX);
                    newHeight = Math.max(10, initialObjectState.height + deltaY);
                    newX = initialObjectState.x + (initialObjectState.width - newWidth);
                    break;
            }
            
            // Snap to grid
            if (snapToGrid && gridSize > 0) {
                newWidth = Math.round(newWidth / gridSize) * gridSize;
                newHeight = Math.round(newHeight / gridSize) * gridSize;
                newX = Math.round(newX / gridSize) * gridSize;
                newY = Math.round(newY / gridSize) * gridSize;
            }
            
            // Limites do mapa
            newX = Math.max(0, Math.min(newX, mapWidth - newWidth));
            newY = Math.max(0, Math.min(newY, mapHeight - newHeight));
            
            // Atualiza elemento visual
            selectedObject.style.left = `${newX}px`;
            selectedObject.style.top = `${newY}px`;
            selectedObject.style.width = `${newWidth}px`;
            selectedObject.style.height = `${newHeight}px`;
            
            // Atualiza label
            const label = selectedObject.querySelector('.object-label');
            if (label) {
                const tipo = mapaArray[index].tipo === 'npc' ? 'NPC' : '';
                label.textContent = `${mapaArray[index].id} ${tipo} (${Math.round(newWidth)}x${Math.round(newHeight)})`;
            }
            
            // Atualiza array de dados
            obj.x = Math.round(newX);
            obj.y = Math.round(newY);
            obj.width = Math.round(newWidth);
            obj.height = Math.round(newHeight);
            
            // Atualizar primeiro waypoint se for NPC
            if (obj.tipo === 'npc' && obj.waypoints && obj.waypoints.length > 0) {
                obj.waypoints[0] = {x: Math.round(newX), y: Math.round(newY)};
            }
            
            // Atualiza lista lateral
            renderObjectsList();
        }
        
        function stopResize() {
            if (!isResizing) return;
            
            isResizing = false;
            resizeDirection = '';
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
            
            saveMapToStorage();
        }
        
        // ============================================
        // FUNÇÕES DE ROTAÇÃO
        // ============================================
        function startRotate(e, objectElement) {
            e.stopPropagation();
            
            const index = parseInt(objectElement.dataset.index);
            const obj = mapaArray[index];
            
            isRotating = true;
            selectedObject = objectElement;
            
            // Salva estado inicial
            initialMousePos = { x: e.clientX, y: e.clientY };
            initialObjectState = {
                angle: obj.angle,
                centerX: obj.x + obj.width / 2,
                centerY: obj.y + obj.height / 2
            };
            
            document.addEventListener('mousemove', handleRotate);
            document.addEventListener('mouseup', stopRotate);
        }
        
        function handleRotate(e) {
            if (!isRotating || !selectedObject) return;
            
            e.preventDefault();
            
            const snapAngle = parseInt(document.getElementById('snap-angle').value);
            const rect = document.getElementById('map-area').getBoundingClientRect();
            const scale = zoomLevel;
            
            const index = parseInt(selectedObject.dataset.index);
            const obj = mapaArray[index];
            
            // Calcula ângulo baseado na posição do mouse
            const centerX = (initialObjectState.centerX * scale) + rect.left;
            const centerY = (initialObjectState.centerY * scale) + rect.top;
            
            const deltaX = e.clientX - centerX;
            const deltaY = e.clientY - centerY;
            
            // Calcula ângulo em radianos
            let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
            angle = (angle + 360) % 360; // Normaliza para 0-360
            
            // Snap angle
            if (snapAngle > 0) {
                angle = Math.round(angle / snapAngle) * snapAngle;
            }
            
            // Atualiza elemento visual
            selectedObject.style.transform = `rotate(${angle}deg)`;
            
            // Atualiza indicador de rotação
            const rotationIndicator = selectedObject.querySelector('.rotation-indicator');
            if (rotationIndicator) {
                rotationIndicator.style.transform = `rotate(${angle}deg)`;
            }
            
            // Atualiza array de dados
            obj.angle = Math.round(angle);
            
            // Atualiza lista lateral
            renderObjectsList();
        }
        
        function stopRotate() {
            if (!isRotating) return;
            
            isRotating = false;
            document.removeEventListener('mousemove', handleRotate);
            document.removeEventListener('mouseup', stopRotate);
            
            saveMapToStorage();
        }
        
        function selectObjectFromElement(objectElement) {
            const index = parseInt(objectElement.dataset.index);
            
            console.log('=== SELECT OBJECT DEBUG ===');
            console.log('Objeto clicado:', index);
            console.log('selectedObject atual:', selectedObject ? selectedObject.dataset.index : 'null');
            console.log('selectedObjects:', selectedObjects);
            
            // LIMPAR LÓGICA DE DESCLIQUE - apenas selecionar
            console.log('✓ SELEÇÃO: Selecionando objeto:', index);
            
            // Limpar seleção anterior se não for multi-seleção
            if (selectedObjects.length === 0) {
                if (selectedObject) {
                    selectedObject.classList.remove('selected');
                    const handles = selectedObject.querySelectorAll('.resize-handle, .rotate-handle, .edit-path-btn');
                    handles.forEach(handle => handle.style.display = 'none');
                    
                    const prevIndex = parseInt(selectedObject.dataset.index);
                    const prevListItem = document.querySelector(`.object-item[data-index="${prevIndex}"]`);
                    if (prevListItem) prevListItem.classList.remove('selected');
                }
            }
            
            // Aplicar nova seleção
            selectedObject = objectElement;
            objectElement.classList.add('selected');
            
            const handles = selectedObject.querySelectorAll('.resize-handle, .rotate-handle');
            handles.forEach(handle => handle.style.display = 'block');
            
            // Mostrar botão de editar path apenas para NPCs
            const editPathBtn = selectedObject.querySelector('.edit-path-btn');
            if (editPathBtn) {
                editPathBtn.style.display = 'block';
            }
            
            const listItem = document.querySelector(`.object-item[data-index="${index}"]`);
            if (listItem) listItem.classList.add('selected');
            
            // Preencher formulário com dados do objeto
            const obj = mapaArray[index];

            // Ativa a flag para que o evento 'change' do select não seja disparado,
            // evitando que a UI de criação seja reconfigurada incorretamente.
            isProgrammaticChange = true;
            document.getElementById('object-id').value = obj.id;
            document.getElementById('object-type').value = (obj.type === 'fromVertices') ? 'vertices' : obj.tipo;
            document.getElementById('object-width').value = obj.width;
            document.getElementById('object-height').value = obj.height;
            document.getElementById('object-angle').value = obj.angle;
            isProgrammaticChange = false; // Desativa a flag
            
            // Preencher campos específicos de NPC
            if (obj.tipo === 'npc') {
                document.getElementById('npc-texture').value = obj.texture || 'npc_default';
                document.getElementById('npc-speed').value = obj.speed || 60;
                document.getElementById('npc-scale').value = obj.scale || 1.0;
                document.getElementById('npc-path').value = obj.path || '';
                
                // Configurar checkbox de grupo
                const groupSettings = document.getElementById('npc-group-settings');
                const individualRoutesCheckbox = document.getElementById('edit-npc-individual-routes');
                
                if (obj.groupId) {
                    groupSettings.style.display = 'block';
                    individualRoutesCheckbox.checked = !!obj.ignoreGroupPath;
                } else {
                    groupSettings.style.display = 'none';
                }
                
                document.getElementById('npc-settings').style.display = 'block';
            } else {
                document.getElementById('npc-settings').style.display = 'none';
            }
            
            // Preencher campos específicos de Vértices
            if (obj.type === 'fromVertices') {
                document.getElementById('vertices-json').value = JSON.stringify(obj.verts || []);
                document.getElementById('vertices-scale').value = obj.vertsScale || 1.0;
                document.getElementById('vertices-settings').style.display = 'block';
                document.getElementById('vertices-edit-controls').style.display = 'block';
            } else {
                document.getElementById('vertices-settings').style.display = 'none';
                document.getElementById('vertices-edit-controls').style.display = 'none';
            }

            // Garante que os painéis de criação corretos estão visíveis/ocultos,
            // já que o evento 'change' foi bloqueado.
            const currentType = document.getElementById('object-type').value;
            document.getElementById('npc-settings').style.display = (currentType === 'npc' || currentType === 'grupo_npc') ? 'block' : 'none';
            document.getElementById('grupo-npc-settings').style.display = 'none'; // Sempre ocultar o de criação ao selecionar
            document.getElementById('vertices-settings').style.display = (currentType === 'vertices') ? 'block' : 'none';
            
            // Atualizar seleção múltipla se não estiver já lá
            if (!selectedObjects.includes(index)) {
                selectedObjects.push(index);
            }
            
            updateSelectionStatus();
        }
        
        function toggleObjectSelection(objectElement) {
            const index = parseInt(objectElement.dataset.index);
            const listItem = document.querySelector(`.object-item[data-index="${index}"]`);
            
            // Verificar se já está selecionado
            const isSelected = selectedObjects.includes(index);
            
            if (isSelected) {
                // Remover da seleção múltipla
                objectElement.classList.remove('multi-selected');
                objectElement.classList.remove('selected'); // Remover também a seleção dourada
                selectedObjects = selectedObjects.filter(i => i !== index);
                if (listItem) listItem.classList.remove('multi-selected');
                
                // Se era o único selecionado, limpar seleção simples também
                if (selectedObjects.length === 0) {
                    selectedObject = null;
                }
            } else {
                // Adicionar à seleção múltipla
                objectElement.classList.add('multi-selected');
                objectElement.classList.add('selected'); // Adicionar também a seleção dourada
                selectedObjects.push(index);
                if (listItem) listItem.classList.add('multi-selected');
                
                // Definir como selectedObject principal APENAS se for o primeiro
                if (selectedObjects.length === 1) {
                    selectedObject = objectElement;
                } else {
                    // Para múltiplos objetos, manter o primeiro como selectedObject principal
                    const firstIndex = selectedObjects[0];
                    const firstObject = document.querySelector(`.map-object[data-index="${firstIndex}"]`);
                    if (firstObject) {
                        selectedObject = firstObject;
                    }
                }
            }
            
            // Forçar atualização da interface
            updateSelectionStatus();
            updateActionButtons();
        }
        
        function handleMultiSelectClick(objectElement) {
            console.log('=== DEBUG HANDLE MULTI SELECT CLICK ===');
            console.log('ObjectElement:', objectElement);
            
            // Função específica para cliques no modo múltiplo
            const index = parseInt(objectElement.dataset.index);
            const listItem = document.querySelector(`.object-item[data-index="${index}"]`);
            
            console.log('Index do objeto:', index);
            console.log('Já selecionado?', selectedObjects.includes(index));
            
            // Verificar se já está selecionado
            const isSelected = selectedObjects.includes(index);
            
            if (isSelected) {
                // Remover da seleção múltipla
                console.log('Removendo da seleção múltipla');
                objectElement.classList.remove('multi-selected');
                objectElement.classList.remove('selected'); // Remover também a seleção dourada
                selectedObjects = selectedObjects.filter(i => i !== index);
                if (listItem) listItem.classList.remove('multi-selected');
                
                // Atualizar selectedObject se necessário
                if (selectedObjects.length === 0) {
                    selectedObject = null;
                } else {
                    // Manter o primeiro objeto selecionado como principal
                    const firstIndex = selectedObjects[0];
                    const firstObject = document.querySelector(`.map-object[data-index="${firstIndex}"]`);
                    if (firstObject) {
                        selectedObject = firstObject;
                    }
                }
            } else {
                // Adicionar à seleção múltipla
                console.log('Adicionando à seleção múltipla');
                objectElement.classList.add('multi-selected');
                objectElement.classList.add('selected'); // Adicionar também a seleção dourada
                selectedObjects.push(index);
                if (listItem) listItem.classList.add('multi-selected');
                
                // Definir selectedObject se for o primeiro ou manter o primeiro
                if (selectedObjects.length === 1) {
                    selectedObject = objectElement;
                } else {
                    // Manter o primeiro como selectedObject principal
                    const firstIndex = selectedObjects[0];
                    const firstObject = document.querySelector(`.map-object[data-index="${firstIndex}"]`);
                    if (firstObject) {
                        selectedObject = firstObject;
                    }
                }
            }
            
            console.log('selectedObjects após operação:', selectedObjects);
            updateSelectionStatus();
            updateActionButtons();
        }
        
        function clearAllSelections() {
            // Robustez: limpar visualmente todos os objetos que possam ter ficado marcados
            // Isso corrige bugs onde a seleção visual persiste mesmo com variáveis limpas
            document.querySelectorAll('.map-object.selected').forEach(el => {
                el.classList.remove('selected');
                const handles = el.querySelectorAll('.resize-handle, .rotate-handle, .edit-path-btn');
                handles.forEach(handle => handle.style.display = 'none');
            });
            
            document.querySelectorAll('.map-object.multi-selected').forEach(el => {
                el.classList.remove('multi-selected');
            });
            
            document.querySelectorAll('.object-item.selected').forEach(el => el.classList.remove('selected'));
            document.querySelectorAll('.object-item.multi-selected').forEach(el => el.classList.remove('multi-selected'));
            
            // Limpar variáveis de estado
            selectedObjects = [];
            selectedObject = null;
            
            updateSelectionStatus();
        }
        
        function updateSelectionStatus() {
            const statusText = selectedObjects.length > 1 
                ? `Seleção múltipla: ${selectedObjects.length} objetos`
                : selectedObjects.length === 1 
                    ? `Objeto selecionado` 
                    : 'Nenhum objeto selecionado';
            
            // Atualizar título da página ou status bar se necessário
            document.title = `Editor de Mapas - ${statusText}`;
            
            // Atualizar botões de ação baseados na seleção
            updateActionButtons();
        }
        
        function getSelectedObjectIndices() {
            return [...selectedObjects];
        }
        
        function updateActionButtons() {
            const copyBtn = document.getElementById('copy-selected');
            const deleteBtn = document.getElementById('delete-selected');
            const clearBtn = document.getElementById('clear-selected');
            
            // Verificar se há seleção múltipla OU seleção simples
            const hasSelection = selectedObjects.length > 0 || (selectedObject !== null);
            
            if (copyBtn) {
                copyBtn.disabled = !hasSelection;
                copyBtn.textContent = selectedObjects.length > 1 ? 'Copiar Objetos' : 'Copiar Objeto';
            }
            
            if (deleteBtn) {
                deleteBtn.disabled = !hasSelection;
                deleteBtn.textContent = selectedObjects.length > 1 ? 'Apagar Objetos' : 'Apagar Objeto';
            }
        }
        
        // ============================================
        // FUNÇÕES DE NPC E WAYPOINTS
        // ============================================
        function entrarModoPath(index = null) {
            if (index === null && selectedObject) {
                index = parseInt(selectedObject.dataset.index);
            }
            
            if (index === null || mapaArray[index].tipo !== 'npc') {
                alert('Selecione um NPC para editar seu caminho');
                return;
            }
            
            if (isShowingAllWaypoints) {
                // Desativa o modo de ver todos para focar na edição individual
                toggleShowAllWaypoints();
            }
            
            modoPath = true;
            npcEditando = index;
            
            // Carregar waypoints existentes ou criar com posição inicial
            if (mapaArray[index].waypoints && mapaArray[index].waypoints.length > 0) {
                waypoints = JSON.parse(JSON.stringify(mapaArray[index].waypoints));
                // Proteção extra ao entrar no modo de edição
                waypoints = waypoints.map(wp => ({
                    x: Number.isFinite(wp.x) ? wp.x : 0,
                    y: Number.isFinite(wp.y) ? wp.y : 0
                }));
            } else {
                waypoints = [{x: mapaArray[index].x, y: mapaArray[index].y}];
            }
            
            // Ativar modo visual
            document.getElementById('map-area').classList.add('path-mode');
            
            // Desenhar waypoints
            desenharWaypoints();
            
            // Ocultar controles normais
            document.querySelector('.controls-panel').style.opacity = '0.5';
            document.querySelector('.controls-panel').style.pointerEvents = 'none';
            
            updateStatusBar();
        }
        
        function sairModoPath() {
            if (!modoPath) return;
            
            modoPath = false;
            
            // Salvar waypoints no NPC
            if (npcEditando !== null && waypoints.length > 0) {
                const leader = mapaArray[npcEditando];
                
                // Guardar posição original para cálculo de offset se o waypoint 0 mudou
                const originalLeaderX = leader.x;
                const originalLeaderY = leader.y;
                
                // Atualizar waypoints do líder
                leader.waypoints = JSON.parse(JSON.stringify(waypoints));
                
                // Sincronizar x,y do líder com waypoint 0 (caso tenha sido movido no modo path)
                if (leader.waypoints.length > 0) {
                    leader.x = leader.waypoints[0].x;
                    leader.y = leader.waypoints[0].y;
                    
                    // Atualizar visualmente o elemento DOM do líder
                    const leaderEl = document.querySelector(`.map-object[data-index="${npcEditando}"]`);
                    if (leaderEl) {
                        leaderEl.style.left = `${leader.x}px`;
                        leaderEl.style.top = `${leader.y}px`;
                    }
                }

                // Lógica de Grupo: Replicar caminho para membros
                if (leader.groupId && !leader.ignoreGroupPath) {
                    if (confirm('Este NPC faz parte de um grupo. Deseja aplicar este caminho a TODOS os membros do grupo (mantendo a formação)?')) {
                        mapaArray.forEach((member, index) => {
                            if (member.groupId === leader.groupId && member !== leader) {
                                const offsetX = member.x - originalLeaderX;
                                const offsetY = member.y - originalLeaderY;
                                
                                member.waypoints = waypoints.map(wp => ({
                                    x: wp.x + offsetX,
                                    y: wp.y + offsetY
                                }));
                                
                                if (member.waypoints.length > 0) {
                                    member.x = member.waypoints[0].x;
                                    member.y = member.waypoints[0].y;
                                    
                                    const memberEl = document.querySelector(`.map-object[data-index="${index}"]`);
                                    if (memberEl) {
                                        memberEl.style.left = `${member.x}px`;
                                        memberEl.style.top = `${member.y}px`;
                                    }
                                }
                            }
                        });
                    }
                }

                saveMapToStorage();
            }
            
            // Limpar waypoints visuais
            document.querySelectorAll('.waypoint, .waypoint-line').forEach(el => el.remove());
            
            // Restaurar interface
            document.getElementById('map-area').classList.remove('path-mode');
            document.querySelector('.controls-panel').style.opacity = '1';
            document.querySelector('.controls-panel').style.pointerEvents = 'auto';
            
            npcEditando = null;
            waypoints = [];
            waypointSelecionado = null;
            
            updateStatusBar();
        }
        
        function adicionarWaypoint(e) {
            const snapToGrid = document.getElementById('snap-to-grid').value === 'true';
            const gridSize = parseInt(document.getElementById('grid-size').value);
            const rect = document.getElementById('map-area').getBoundingClientRect();
            const scale = zoomLevel;
            
            let x = (e.clientX - rect.left) / scale;
            let y = (e.clientY - rect.top) / scale;
            
            if (snapToGrid && gridSize > 0) {
                x = Math.round(x / gridSize) * gridSize;
                y = Math.round(y / gridSize) * gridSize;
            }
            
            // Prevenir criação fora do mapa
            x = Math.max(0, Math.min(x, mapWidth));
            y = Math.max(0, Math.min(y, mapHeight));
            
            const waypoint = {
                x: Math.round(x),
                y: Math.round(y),
                index: waypoints.length
            };
            
            waypoints.push(waypoint);
            desenharWaypoints();
        }
        
        function desenharWaypoints() {
            limparTodosWaypointsVisuais();
            
            // Desenhar linhas conectando os waypoints
            for (let i = 0; i < waypoints.length - 1; i++) {
                const wp1 = waypoints[i];
                const wp2 = waypoints[i + 1];
                
                const line = document.createElement('div');
                line.className = 'waypoint-line';
                
                const dx = wp2.x - wp1.x;
                const dy = wp2.y - wp1.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                
                line.style.width = `${length}px`;
                line.style.left = `${wp1.x}px`;
                line.style.top = `${wp1.y}px`;
                line.style.transform = `rotate(${angle}deg)`;
                
                document.getElementById('map-area').appendChild(line);
            }
            
            // Desenhar pontos
            waypoints.forEach((wp, index) => {
                const point = document.createElement('div');
                point.className = 'waypoint';
                if (index === 0) point.classList.add('start');
                if (index === waypointSelecionado) point.classList.add('selected');
                
                point.style.left = `${wp.x - 8}px`;
                point.style.top = `${wp.y - 8}px`;
                point.dataset.index = index;
                
                // Número no waypoint
                const label = document.createElement('div');
                label.textContent = index + 1;
                label.style.position = 'absolute';
                label.style.top = '50%';
                label.style.left = '50%';
                label.style.transform = 'translate(-50%, -50%)';
                label.style.color = 'white';
                label.style.fontSize = '10px';
                label.style.fontWeight = 'bold';
                point.appendChild(label);
                
                // Eventos do waypoint
                point.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    // Selecionar waypoint
                    document.querySelectorAll('.waypoint').forEach(wp => wp.classList.remove('selected'));
                    this.classList.add('selected');
                    waypointSelecionado = index;
                });
                
                // Arrastar waypoint
                point.addEventListener('mousedown', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const wpIndex = parseInt(this.dataset.index);
                    
                    const snapToGrid = document.getElementById('snap-to-grid').value === 'true';
                    const gridSize = parseInt(document.getElementById('grid-size').value);
                    
                    const dragHandler = function(e) {
                        e.preventDefault();
                        
                        const rect = document.getElementById('map-area').getBoundingClientRect();
                        const scale = zoomLevel;
                        
                        let x = (e.clientX - rect.left) / scale;
                        let y = (e.clientY - rect.top) / scale;
                        
                        // Proteção contra NaN durante o arrasto
                        if (!Number.isFinite(x)) x = 0;
                        if (!Number.isFinite(y)) y = 0;
                        
                        if (snapToGrid && gridSize > 0) {
                            x = Math.round(x / gridSize) * gridSize;
                            y = Math.round(y / gridSize) * gridSize;
                        }
                        
                        // Prevenir arrastar para fora do mapa
                        x = Math.max(0, Math.min(x, mapWidth));
                        y = Math.max(0, Math.min(y, mapHeight));
                        
                        waypoints[wpIndex].x = Math.round(x);
                        waypoints[wpIndex].y = Math.round(y);
                        
                        desenharWaypoints();
                    };
                    
                    const stopDragHandler = function() {
                        document.removeEventListener('mousemove', dragHandler);
                        document.removeEventListener('mouseup', stopDragHandler);
                    };

                    document.addEventListener('mousemove', dragHandler);
                    document.addEventListener('mouseup', stopDragHandler);
                });
                
                document.getElementById('map-area').appendChild(point);
            });
        }
        
        function toggleShowAllWaypoints() {
            isShowingAllWaypoints = !isShowingAllWaypoints;
            const button = document.getElementById('btn-show-all-waypoints');

            if (isShowingAllWaypoints) {
                if (modoPath) sairModoPath(); // Sair do modo de edição individual
                desenharTodosWaypoints();
                button.style.backgroundColor = '#4CAF50';
                button.textContent = 'Ocultar Waypoints';
            } else {
                limparTodosWaypointsVisuais();
                button.style.backgroundColor = '';
                button.textContent = 'Ver Todos Waypoints';
            }
        }

        function limparTodosWaypointsVisuais() {
            document.querySelectorAll('.waypoint, .waypoint-line').forEach(el => el.remove());
        }

        function desenharTodosWaypoints() {
            limparTodosWaypointsVisuais();

            const npcColors = [
                'rgba(76, 175, 80, 0.7)',   // Green
                'rgba(33, 150, 243, 0.7)',  // Blue
                'rgba(255, 193, 7, 0.7)',   // Amber
                'rgba(244, 67, 54, 0.7)',   // Red
                'rgba(156, 39, 176, 0.7)',  // Purple
                'rgba(0, 150, 136, 0.7)',   // Teal
                'rgba(255, 87, 34, 0.7)'    // Deep Orange
            ];

            let colorIndex = 0;
            mapaArray.forEach((obj, objIndex) => {
                if (obj.tipo === 'npc' && obj.waypoints && obj.waypoints.length > 0) {
                    const pathColor = npcColors[colorIndex % npcColors.length];
                    colorIndex++;

                    // Desenhar linhas
                    for (let i = 0; i < obj.waypoints.length - 1; i++) {
                        const wp1 = obj.waypoints[i];
                        const wp2 = obj.waypoints[i + 1];
                        
                        const line = document.createElement('div');
                        line.className = 'waypoint-line';
                        
                        const dx = wp2.x - wp1.x;
                        const dy = wp2.y - wp1.y;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                        
                        line.style.width = `${length}px`;
                        line.style.left = `${wp1.x}px`;
                        line.style.top = `${wp1.y}px`;
                        line.style.transform = `rotate(${angle}deg)`;
                        line.style.backgroundColor = pathColor;
                        line.style.height = '2px'; // Linhas mais finas para visão geral
                        
                        document.getElementById('map-area').appendChild(line);
                    }

                    // Desenhar pontos
                    obj.waypoints.forEach((wp, index) => {
                        const point = document.createElement('div');
                        point.className = 'waypoint';
                        
                        point.style.left = `${wp.x - 6}px`; // Menor
                        point.style.top = `${wp.y - 6}px`;
                        point.style.width = '12px';
                        point.style.height = '12px';
                        point.style.backgroundColor = pathColor;
                        point.style.borderColor = pathColor.replace('0.7', '1');

                        if (index === 0) {
                            point.classList.add('start'); // Destacar o início
                            point.style.borderColor = '#FFF';
                        }
                        
                        // Adicionar número ao waypoint
                        const label = document.createElement('div');
                        label.textContent = index + 1;
                        label.style.position = 'absolute';
                        label.style.top = '50%';
                        label.style.left = '50%';
                        label.style.transform = 'translate(-50%, -50%)';
                        label.style.color = 'white';
                        label.style.fontSize = '8px'; // Fonte menor para pontos menores
                        label.style.fontWeight = 'bold';
                        label.style.textShadow = '0 0 2px black'; // Sombra para legibilidade
                        point.appendChild(label);
                        
                        // Evento de clique para editar o waypoint diretamente
                        point.title = `Editar ${obj.id}`;
                        point.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const el = document.querySelector(`.map-object[data-index="${objIndex}"]`);
                            if (el) selectObjectFromElement(el);
                            
                            entrarModoPath(objIndex);
                            waypointSelecionado = index;
                            desenharWaypoints();
                        });
                        
                        document.getElementById('map-area').appendChild(point);
                    });
                }
            });
        }

        // ============================================
        // FUNÇÕES DE EDIÇÃO DE VÉRTICES (POLÍGONOS)
        // ============================================
        function entrarModoVertices(index = null) {
            if (index === null && selectedObject) {
                index = parseInt(selectedObject.dataset.index);
            }
            
            if (index === null || mapaArray[index].type !== 'fromVertices') {
                alert('Selecione um objeto do tipo Vértices (Polígono) para editar');
                return;
            }
            
            modoVertices = true;
            objetoEditandoVertices = index;
            
            // Carregar vértices existentes
            if (mapaArray[index].verts && mapaArray[index].verts.length > 0) {
                verticesEdicao = JSON.parse(JSON.stringify(mapaArray[index].verts));
            } else {
                verticesEdicao = [];
            }
            
            // Ativar modo visual
            document.getElementById('map-area').classList.add('path-mode'); // Reutiliza estilo de path mode
            
            // Desenhar vértices
            desenharVertices();
            
            // Ocultar controles normais
            document.querySelector('.controls-panel').style.opacity = '0.5';
            document.querySelector('.controls-panel').style.pointerEvents = 'none';
            
            updateStatusBar();
        }
        
        function sairModoVertices() {
            if (!modoVertices) return;
            
            modoVertices = false;
            
            // Salvar vértices no objeto
            if (objetoEditandoVertices !== null) {
                mapaArray[objetoEditandoVertices].verts = JSON.parse(JSON.stringify(verticesEdicao));
                
                // Atualizar o textarea se o objeto estiver selecionado
                if (selectedObject && parseInt(selectedObject.dataset.index) === objetoEditandoVertices) {
                    document.getElementById('vertices-json').value = JSON.stringify(verticesEdicao);
                }
                
                // Recriar o elemento visual do objeto para atualizar o SVG
                const oldElement = document.querySelector(`.map-object[data-index="${objetoEditandoVertices}"]`);
                if (oldElement) oldElement.remove();
                createMapObjectElement(mapaArray[objetoEditandoVertices], objetoEditandoVertices);
                
                saveMapToStorage();
            }
            
            // Limpar vértices visuais
            document.querySelectorAll('.waypoint, .waypoint-line').forEach(el => el.remove());
            
            // Restaurar interface
            document.getElementById('map-area').classList.remove('path-mode');
            document.querySelector('.controls-panel').style.opacity = '1';
            document.querySelector('.controls-panel').style.pointerEvents = 'auto';
            
            objetoEditandoVertices = null;
            verticesEdicao = [];
            verticeSelecionado = null;
            
            // Reselecionar o objeto para mostrar handles
            if (selectedObject) {
                const idx = parseInt(selectedObject.dataset.index);
                const newEl = document.querySelector(`.map-object[data-index="${idx}"]`);
                if (newEl) selectObjectFromElement(newEl);
            }
            
            updateStatusBar();
        }
        
        function adicionarVerticePoligono(e) {
            const obj = mapaArray[objetoEditandoVertices];
            const rect = document.getElementById('map-area').getBoundingClientRect();
            const scale = zoomLevel;
            
            // Posição do clique no mundo
            let clickX = (e.clientX - rect.left) / scale;
            let clickY = (e.clientY - rect.top) / scale;
            
            const snapToGrid = document.getElementById('snap-to-grid').value === 'true';
            const gridSize = parseInt(document.getElementById('grid-size').value);
            
            if (snapToGrid && gridSize > 0) {
                clickX = Math.round(clickX / gridSize) * gridSize;
                clickY = Math.round(clickY / gridSize) * gridSize;
            }
            
            // Converter para coordenadas locais do objeto
            // Centro do objeto
            const centerX = obj.x + obj.width / 2;
            const centerY = obj.y + obj.height / 2;
            
            // Ajustar rotação se houver (inversa)
            const angleRad = (obj.angle || 0) * (Math.PI / 180);
            const dx = clickX - centerX;
            const dy = clickY - centerY;
            
            // Rotacionar ponto de volta (inverso)
            const localX = dx * Math.cos(-angleRad) - dy * Math.sin(-angleRad);
            const localY = dx * Math.sin(-angleRad) + dy * Math.cos(-angleRad);
            
            // Ajustar escala
            const vertsScale = obj.vertsScale || 1.0;
            const finalX = localX / vertsScale;
            const finalY = localY / vertsScale;
            
            verticesEdicao.push({ x: Math.round(finalX), y: Math.round(finalY) });
            desenharVertices();
        }
        
        function desenharVertices() {
            // Remover elementos anteriores
            document.querySelectorAll('.waypoint, .waypoint-line').forEach(el => el.remove());
            
            const obj = mapaArray[objetoEditandoVertices];
            const centerX = obj.x + obj.width / 2;
            const centerY = obj.y + obj.height / 2;
            const angleRad = (obj.angle || 0) * (Math.PI / 180);
            const vertsScale = obj.vertsScale || 1.0;
            
            // Função auxiliar para converter local -> mundo
            const toWorld = (v) => {
                const scaledX = v.x * vertsScale;
                const scaledY = v.y * vertsScale;
                
                // Rotacionar
                const rotX = scaledX * Math.cos(angleRad) - scaledY * Math.sin(angleRad);
                const rotY = scaledX * Math.sin(angleRad) + scaledY * Math.cos(angleRad);
                
                return {
                    x: centerX + rotX,
                    y: centerY + rotY
                };
            };
            
            // Desenhar linhas (polígono fechado)
            if (verticesEdicao.length > 1) {
                for (let i = 0; i < verticesEdicao.length; i++) {
                    const v1 = verticesEdicao[i];
                    const v2 = verticesEdicao[(i + 1) % verticesEdicao.length]; // Fecha o loop
                    
                    const p1 = toWorld(v1);
                    const p2 = toWorld(v2);
                    
                    const line = document.createElement('div');
                    line.className = 'waypoint-line';
                    line.style.backgroundColor = 'rgba(156, 39, 176, 0.8)'; // Cor roxa para polígonos
                    
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    
                    line.style.width = `${length}px`;
                    line.style.left = `${p1.x}px`;
                    line.style.top = `${p1.y}px`;
                    line.style.transform = `rotate(${angle}deg)`;
                    
                    document.getElementById('map-area').appendChild(line);
                }
            }
            
            // Desenhar pontos
            verticesEdicao.forEach((v, index) => {
                const p = toWorld(v);
                
                const point = document.createElement('div');
                point.className = 'waypoint';
                point.style.backgroundColor = 'rgba(156, 39, 176, 0.9)';
                point.style.borderColor = '#E1BEE7';
                
                if (index === verticeSelecionado) point.classList.add('selected');
                
                point.style.left = `${p.x - 8}px`;
                point.style.top = `${p.y - 8}px`;
                point.dataset.index = index;
                
                // Eventos
                point.addEventListener('click', function(e) {
                    e.stopPropagation();
                    document.querySelectorAll('.waypoint').forEach(wp => wp.classList.remove('selected'));
                    this.classList.add('selected');
                    verticeSelecionado = index;
                });
                
                // Arrastar vértice
                point.addEventListener('mousedown', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const vIndex = parseInt(this.dataset.index);
                    const snapToGrid = document.getElementById('snap-to-grid').value === 'true';
                    const gridSize = parseInt(document.getElementById('grid-size').value);
                    
                    const dragHandler = function(e) {
                        e.preventDefault();
                        const rect = document.getElementById('map-area').getBoundingClientRect();
                        const scale = zoomLevel;
                        
                        let mouseX = (e.clientX - rect.left) / scale;
                        let mouseY = (e.clientY - rect.top) / scale;
                        
                        if (snapToGrid && gridSize > 0) {
                            mouseX = Math.round(mouseX / gridSize) * gridSize;
                            mouseY = Math.round(mouseY / gridSize) * gridSize;
                        }
                        
                        // Converter mundo -> local
                        const dx = mouseX - centerX;
                        const dy = mouseY - centerY;
                        
                        // Rotacionar inverso
                        const localX = dx * Math.cos(-angleRad) - dy * Math.sin(-angleRad);
                        const localY = dx * Math.sin(-angleRad) + dy * Math.cos(-angleRad);
                        
                        // Escala inversa
                        verticesEdicao[vIndex].x = Math.round(localX / vertsScale);
                        verticesEdicao[vIndex].y = Math.round(localY / vertsScale);
                        
                        desenharVertices();
                    };
                    
                    const stopDragHandler = function() {
                        document.removeEventListener('mousemove', dragHandler);
                        document.removeEventListener('mouseup', stopDragHandler);
                    };

                    document.addEventListener('mousemove', dragHandler);
                    document.addEventListener('mouseup', stopDragHandler);
                });
                
                document.getElementById('map-area').appendChild(point);
            });
        }
        
        function renderObjectsList() {
            console.log('=== DEBUG RENDER OBJECTS LIST ===');
            console.log('mapaArray.length:', mapaArray.length);
            console.log('mapaArray:', mapaArray);
            
            const objectsList = document.getElementById('objects-list');
            objectsList.innerHTML = '';
            
            if (mapaArray.length === 0) {
                console.log('Nenhum objeto para renderizar');
                objectsList.innerHTML = '<p style="text-align: center; color: #b8c1ec; font-size: 0.9rem;">Nenhum objeto no mapa</p>';
                updateStatusBar();
                return;
            }
            
            console.log('Renderizando', mapaArray.length, 'objetos na lista');
            
            // Ordena pela posição Y para lista mais organizada
            const sortedArray = [...mapaArray]
                .map((obj, idx) => ({...obj, originalIndex: idx}))
                .sort((a, b) => a.y - b.y || a.x - b.x);
            
            sortedArray.forEach((obj, displayIndex) => {
                const originalIndex = obj.originalIndex;
                console.log('Renderizando objeto:', obj.id, 'index:', originalIndex);
                
                const objectItem = document.createElement('div');
                objectItem.className = 'object-item';
                objectItem.dataset.index = originalIndex;
                
                let infoHTML = '';
                if (obj.tipo === 'npc') {
                    const wpCount = obj.waypoints ? obj.waypoints.length : 0;
                    const groupInfo = obj.groupId ? ` | 🎲 Grupo` : '';
                    infoHTML = `
                        <div class="info">
                            <strong>👤 ${obj.id}</strong>
                            <span>NPC | Texture: ${obj.texture} | Speed: ${obj.speed}${groupInfo}</span>
                            <span>Pos: ${obj.x}, ${obj.y} | Waypoints: ${wpCount}</span>
                        </div>`;
                } else if (obj.type === 'fromVertices') {
                    infoHTML = `
                        <div class="info">
                            <strong>🔷 ${obj.id}</strong>
                            <span>Polígono | Scale: ${obj.vertsScale || 1} | Vértices: ${obj.verts ? obj.verts.length : 0}</span>
                            <span>Pos: ${obj.x}, ${obj.y}</span>
                        </div>`;
                } else {
                    infoHTML = `
                        <div class="info">
                            <strong>${obj.tipo === 'obstaculo' ? '⛔' : '🎨'} ${obj.id}</strong>
                            <span>${obj.tipo} | ${obj.width}x${obj.height} | ${obj.angle}°</span>
                            <span>Pos: ${obj.x}, ${obj.y}</span>
                        </div>`;
                }
                
                objectItem.innerHTML = infoHTML + `
                    <div class="object-actions">
                        <button class="go-to-object" data-index="${originalIndex}">Ir</button>
                        ${obj.tipo === 'npc' ? '<button class="edit-path" data-index="' + originalIndex + '">Path</button>' : ''}
                        ${obj.type === 'fromVertices' ? '<button class="edit-vertices-list" data-index="' + originalIndex + '">Vértices</button>' : ''}
                        <button class="delete" data-index="${originalIndex}">X</button>
                    </div>`;
                
                if (selectedObject && parseInt(selectedObject.dataset.index) === originalIndex) {
                    objectItem.classList.add('selected');
                }
                
                objectItem.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('go-to-object') && 
                        !e.target.classList.contains('edit-path') &&
                        !e.target.classList.contains('edit-vertices-list') &&
                        !e.target.classList.contains('delete')) {
                        selectObjectByIndex(originalIndex);
                    }
                });
                
                const goToBtn = objectItem.querySelector('.go-to-object');
                goToBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectObjectByIndex(originalIndex);
                });
                
                const deleteBtn = objectItem.querySelector('.delete');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeObject(originalIndex);
                });
                
                // Adicionar evento para botão de path
                if (obj.tipo === 'npc') {
                    const editPathBtn = objectItem.querySelector('.edit-path');
                    editPathBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        entrarModoPath(originalIndex);
                    });
                }
                
                // Adicionar evento para botão de vértices
                if (obj.type === 'fromVertices') {
                    const editVertsBtn = objectItem.querySelector('.edit-vertices-list');
                    editVertsBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        entrarModoVertices(originalIndex);
                    });
                }
                
                objectsList.appendChild(objectItem);
            });
            
            updateStatusBar();
        }
        
        function selectObjectByIndex(index) {
            const objectElement = document.querySelector(`.map-object[data-index="${index}"]`);
            if (objectElement) {
                selectObjectFromElement(objectElement);
            }
        }
        
        function removeObject(index) {
            if (confirm(`Remover objeto "${mapaArray[index].id}"?`)) {
                // Remove do array
                mapaArray.splice(index, 1);
                
                // Remove do DOM
                const objectElement = document.querySelector(`.map-object[data-index="${index}"]`);
                if (objectElement) objectElement.remove();
                
                // Reindexa os objetos restantes
                const allObjects = document.querySelectorAll('.map-object');
                allObjects.forEach((el, i) => {
                    const oldIndex = parseInt(el.dataset.index);
                    if (oldIndex > index) {
                        el.dataset.index = oldIndex - 1;
                    }
                });
                
                renderObjectsList();
                
                if (selectedObject && parseInt(selectedObject.dataset.index) === index) {
                    selectedObject = null;
                }
                
                saveMapToStorage();
            }
        }
        
        function removeSelectedObject() {
            if (!selectedObject) {
                alert('Selecione um objeto primeiro');
                return;
            }
            
            const index = parseInt(selectedObject.dataset.index);
            removeObject(index);
        }
        
        function clearAllObjects() {
            if (mapaArray.length === 0 && availableTextures.length === 0) return;
            
            if (confirm('Deseja limpar TUDO? Isso removerá todos os objetos do mapa e as texturas importadas.')) {
                mapaArray = [];
                document.querySelectorAll('.map-object').forEach(el => el.remove());
                renderObjectsList();
                selectedObject = null;
                
                // Limpar texturas
                availableTextures = [];
                updateTexturePreview();
                localStorage.removeItem('availableTextures');
                
                saveMapToStorage();
            }
        }
        
        function centerSelectedObject() {
            if (!selectedObject) {
                alert('Selecione um objeto primeiro');
                return;
            }
            
            const index = parseInt(selectedObject.dataset.index);
            const obj = mapaArray[index];
            
            const mapWrapper = document.getElementById('map-wrapper');
            const centerX = (obj.x + obj.width / 2) * zoomLevel;
            const centerY = (obj.y + obj.height / 2) * zoomLevel;
            
            mapWrapper.scrollTo({
                left: centerX - mapWrapper.clientWidth / 2,
                top: centerY - mapWrapper.clientHeight / 2,
                behavior: 'smooth'
            });
        }
        
        // ============================================
        // FUNÇÕES DE ZOOM
        // ============================================
        function zoomIn() {
            if (zoomLevel < 3) {
                zoomLevel += 0.1;
                applyZoomToMap();
            }
        }
        
        function zoomOut() {
            if (zoomLevel > 0.1) {
                zoomLevel -= 0.1;
                applyZoomToMap();
            }
        }
        
        function resetZoom() {
            zoomLevel = 1;
            applyZoomToMap();
        }
        
        function centerMap() {
            const mapWrapper = document.getElementById('map-wrapper');
            mapWrapper.scrollTo({
                left: (mapWidth * zoomLevel - mapWrapper.clientWidth) / 2,
                top: (mapHeight * zoomLevel - mapWrapper.clientHeight) / 2,
                behavior: 'smooth'
            });
        }
        
        function showAllObjects() {
            const mapWrapper = document.getElementById('map-wrapper');
            const widthRatio = mapWrapper.clientWidth / (mapWidth * 1.1);
            const heightRatio = mapWrapper.clientHeight / (mapHeight * 1.1);
            zoomLevel = Math.min(widthRatio, heightRatio, 1);
            
            applyZoomToMap();
            centerMap();
        }
        
        // ============================================
        // ARMAZENAMENTO LOCAL
        // ============================================
        function saveMapToStorage() {
            // Limpar dados base64 do mapaArray antes de salvar
            const cleanMapaArray = mapaArray.map(obj => {
                const cleanObj = { ...obj };
                // Remover propriedades de base64 que aumentam o tamanho
                delete cleanObj.textureSrc;
                delete cleanObj.textureType;
                return cleanObj;
            });
            
            const mapData = {
                mapaArray: cleanMapaArray,
                mapWidth: mapWidth,
                mapHeight: mapHeight,
                gridSize: baseGridSize,
                snapToGrid: document.getElementById('snap-to-grid').value,
                snapAngle: document.getElementById('snap-angle').value,
                savedAt: new Date().toISOString(),
                version: '3.0-npc-multi'
            };
            
            localStorage.setItem('mapaEditorData', JSON.stringify(mapData));
            
            // Salvar texturas também (sem base64 para economizar espaço)
            saveAvailableTextures();
            
            const saveButton = document.getElementById('save-map');
            const originalText = saveButton.textContent;
            saveButton.textContent = '✓ Salvo!';
            saveButton.style.backgroundColor = '#27ae60';
            
            setTimeout(() => {
                saveButton.textContent = originalText;
                saveButton.style.backgroundColor = '';
            }, 1000);
        }
        
        function loadMapFromStorage() {
            const savedData = localStorage.getItem('mapaEditorData');
            
            if (!savedData) {
                console.log('Nenhum mapa salvo encontrado');
                return;
            }
            
            if (!confirm('Carregar mapa salvo? Isso substituirá o mapa atual.')) {
                return;
            }
            
            try {
                const mapData = JSON.parse(savedData);
                
                // Limpar completamente antes de carregar
                mapaArray = [];
                document.querySelectorAll('.map-object').forEach(el => el.remove());
                selectedObject = null;
                
                // Carregar configurações
                if (mapData.mapWidth) {
                    document.getElementById('map-width').value = mapData.mapWidth;
                    mapWidth = mapData.mapWidth;
                }
                
                if (mapData.mapHeight) {
                    document.getElementById('map-height').value = mapData.mapHeight;
                    mapHeight = mapData.mapHeight;
                }
                
                if (mapData.gridSize) {
                    document.getElementById('grid-size').value = mapData.gridSize;
                    baseGridSize = mapData.gridSize;
                }
                
                if (mapData.snapToGrid) {
                    document.getElementById('snap-to-grid').value = mapData.snapToGrid;
                }
                
                if (mapData.snapAngle) {
                    document.getElementById('snap-angle').value = mapData.snapAngle;
                }
                
                // Carregar objetos
                if (mapData.mapaArray && Array.isArray(mapData.mapaArray)) {
                    const validObjects = mapData.mapaArray.filter(obj => 
                        obj && typeof obj === 'object' && 
                        obj.x !== undefined && obj.y !== undefined
                    ).map(obj => {
                        // Sanitização: Garante que números sejam números válidos (evita NaN/null)
                        obj.x = Number.isFinite(obj.x) ? obj.x : 0;
                        obj.y = Number.isFinite(obj.y) ? obj.y : 0;
                        obj.width = Number.isFinite(obj.width) ? obj.width : 32;
                        obj.height = Number.isFinite(obj.height) ? obj.height : 32;
                        
                        // Sanitiza waypoints se for NPC
                        if (obj.tipo === 'npc' && Array.isArray(obj.waypoints)) {
                            obj.waypoints = obj.waypoints.map(wp => ({
                                x: Number.isFinite(wp.x) ? wp.x : obj.x,
                                y: Number.isFinite(wp.y) ? wp.y : obj.y
                            }));
                        }
                        return obj;
                    });
                    
                    mapaArray = validObjects;
                    
                    // Criar elementos DOM
                    mapaArray.forEach((obj, index) => {
                        if (obj.tipo === 'npc') {
                            criarNPCElement(obj, index);
                        } else {
                            createMapObjectElement(obj, index);
                        }
                    });
                    
                    renderObjectsList();
                    updateMapSize();
                    updateGrid();
                    
                    alert(`✅ Mapa carregado com sucesso! ${mapaArray.length} objetos recuperados.`);
                }
                
            } catch (error) {
                console.error('❌ Erro ao carregar mapa:', error);
                alert('Erro ao carregar mapa salvo. Os dados podem estar corrompidos.');
            }
        }
        
        // ============================================
        // FUNÇÕES DE EXPORTAÇÃO/IMPORTAÇÃO JSON
        // ============================================
        function exportToJSON() {
            if (!mapaArray || mapaArray.length === 0) {
                alert('Nenhum objeto no mapa para exportar');
                return;
            }
            
            // Limpar dados base64 do mapaArray antes de exportar
            const cleanMapaArray = mapaArray.map(obj => {
                const cleanObj = { ...obj };
                // Remover propriedades de base64 que aumentam o tamanho
                delete cleanObj.textureSrc;
                delete cleanObj.textureType;
                return cleanObj;
            });
            
            const mapData = {
                metadata: {
                    name: "Mapa Exportado",
                    version: "1.0",
                    exportDate: new Date().toISOString(),
                    author: "Editor de Mapas",
                    description: "Mapa exportado do Editor de Mapas com NPCs (sem dados base64)"
                },
                settings: {
                    mapWidth: mapWidth,
                    mapHeight: mapHeight,
                    gridSize: baseGridSize,
                    snapToGrid: document.getElementById('snap-to-grid').value,
                    snapAngle: document.getElementById('snap-angle').value
                },
                objects: cleanMapaArray,
                npcs: cleanMapaArray.filter(obj => obj.tipo === 'npc'),
                obstacles: cleanMapaArray.filter(obj => obj.tipo === 'obstaculo'),
                decorations: cleanMapaArray.filter(obj => obj.tipo === 'decoracao')
            };
            
            // Gerar nome do arquivo com data e hora
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
            const filename = `mapa_${dateStr}_${timeStr}.json`;
            
            // Criar blob e link para download
            const jsonStr = JSON.stringify(mapData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Criar link para download
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            
            // Limpar
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                alert(`✅ Mapa exportado como ${filename}`);
            }, 100);
        }
        
        function handleJSONFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    importFromJSON(jsonData, file.name);
                } catch (error) {
                    alert('❌ Erro ao ler arquivo JSON. Verifique se o arquivo é válido.');
                    console.error('Erro ao parsear JSON:', error);
                }
            };
            
            reader.onerror = function() {
                alert('❌ Erro ao ler arquivo.');
            };
            
            reader.readAsText(file);
            
            // Resetar input
            event.target.value = '';
        }
        
        function importFromJSON(jsonData, filename = 'arquivo.json') {
            if (!confirm(`Importar mapa do arquivo "${filename}"? Isso substituirá o mapa atual.`)) {
                return;
            }
            
            try {
                // Validar estrutura básica do JSON
                if (!jsonData.objects || !Array.isArray(jsonData.objects)) {
                    alert('❌ Formato inválido: o arquivo não contém objetos do mapa.');
                    return;
                }
                
                // Limpar mapa atual
                mapaArray = [];
                document.querySelectorAll('.map-object').forEach(el => el.remove());
                selectedObject = null;
                
                // Carregar configurações se existirem
                if (jsonData.settings) {
                    if (jsonData.settings.mapWidth) {
                        document.getElementById('map-width').value = jsonData.settings.mapWidth;
                        mapWidth = jsonData.settings.mapWidth;
                    }
                    
                    if (jsonData.settings.mapHeight) {
                        document.getElementById('map-height').value = jsonData.settings.mapHeight;
                        mapHeight = jsonData.settings.mapHeight;
                    }
                    
                    if (jsonData.settings.gridSize) {
                        document.getElementById('grid-size').value = jsonData.settings.gridSize;
                        baseGridSize = jsonData.settings.gridSize;
                    }
                    
                    if (jsonData.settings.snapToGrid) {
                        document.getElementById('snap-to-grid').value = jsonData.settings.snapToGrid;
                    }
                    
                    if (jsonData.settings.snapAngle) {
                        document.getElementById('snap-angle').value = jsonData.settings.snapAngle;
                    }
                }
                
                // Filtrar objetos válidos
                const validObjects = jsonData.objects.filter(obj => 
                    obj && typeof obj === 'object' && 
                    obj.x !== undefined && obj.y !== undefined
                );
                
                mapaArray = validObjects;
                
                // Criar elementos DOM
                mapaArray.forEach((obj, index) => {
                    if (obj.tipo === 'npc') {
                        criarNPCElement(obj, index);
                    } else {
                        createMapObjectElement(obj, index);
                    }
                });
                
                renderObjectsList();
                updateMapSize();
                updateGrid();
                
                // Salvar no localStorage também
                saveMapToStorage();
                
                alert(`✅ Mapa importado com sucesso! ${mapaArray.length} objetos carregados.`);
                
            } catch (error) {
                console.error('❌ Erro ao importar JSON:', error);
                alert('Erro ao importar mapa. Verifique se o arquivo está no formato correto.');
            }
        }
        
        // ============================================
        // EXPORTAÇÃO ARRAY (mantida para compatibilidade)
        // ============================================
        function exportArray() {
            if (!mapaArray || mapaArray.length === 0) {
                alert('Nenhum objeto no mapa para exportar');
                return;
            }
            
            // Separar NPCs dos outros objetos
            const npcs = mapaArray.filter(obj => obj.tipo === 'npc');
            const outrosObjetos = mapaArray.filter(obj => obj.tipo !== 'npc');
            
            let formattedArray = '';
            
            // Exportar NPCs no formato específico
            if (npcs.length > 0) {
                formattedArray += `// NPCs para Phaser.js\n`;
                formattedArray += `const npcs = [\n`;
                formattedArray += npcs.map(npc => {
                    const waypointsStr = npc.waypoints && npc.waypoints.length > 0 
                        ? `[${npc.waypoints.map(wp => `{x: ${wp.x}, y: ${wp.y}}`).join(', ')}]`
                        : `[{x: ${npc.x}, y: ${npc.y}}]`;
                    
                    const groupIdStr = npc.groupId ? `,\n        groupId: '${npc.groupId}'` : '';

                    return `    { 
        id: '${npc.id}', 
        x: ${npc.x}, 
        y: ${npc.y}, 
        texture: '${npc.texture || 'npc_default'}', 
        path: '${npc.path || ''}', 
        width: ${npc.width}, 
        height: ${npc.height}, 
        scale: ${npc.scale || 1.0}, 
        speed: ${npc.speed || 60}, 
        waypoints: ${waypointsStr}${groupIdStr}
    }`;
                }).join(',\n');
                formattedArray += `\n];\n\n`;
            }
            
            // Exportar outros objetos
            if (outrosObjetos.length > 0) {
                formattedArray += `// Outros objetos do mapa\n`;
                formattedArray += `const mapaObjetos = [\n`;
                formattedArray += outrosObjetos.map(obj => {
                    if (obj.type === 'fromVertices') {
                        const vertsStr = JSON.stringify(obj.verts);
                        return `    {
        id: '${obj.id}',
        tipo: '${obj.tipo}',
        type: 'fromVertices',
        x: ${obj.x},
        y: ${obj.y},
        vertsScale: ${obj.vertsScale || 1.0},
        verts: ${vertsStr}
    }`;
                    }
                    
                    return `    { 
        id: '${obj.id}', 
        tipo: '${obj.tipo}', 
        x: ${obj.x}, 
        y: ${obj.y}, 
        width: ${obj.width}, 
        height: ${obj.height}, 
        angle: ${obj.angle || 0} 
    }`;
                }).join(',\n');
                formattedArray += `\n];`;
            }
            
            // Se não houver conteúdo
            if (!formattedArray.trim()) {
                formattedArray = '// Nenhum objeto para exportar';
            }
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(formattedArray)
                    .then(() => {
                        alert(`✅ Array exportado! ${npcs.length} NPC(s) e ${outrosObjetos.length} outro(s) objeto(s)`);
                    })
                    .catch(err => {
                        console.error('Erro clipboard:', err);
                        copyWithFallback(formattedArray);
                    });
            } else {
                copyWithFallback(formattedArray);
            }
        }
        
        function copyWithFallback(text) {
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (successful) {
                    alert('✅ Array copiado para a área de transferência!');
                } else {
                    throw new Error('Falha ao copiar');
                }
            } catch (err) {
                console.error('Erro fallback:', err);
                showArrayModal(text);
            }
        }
        
        function showArrayModal(arrayText) {
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
            modal.style.zIndex = '10000';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            
            const modalContent = document.createElement('div');
            modalContent.style.backgroundColor = '#16213e';
            modalContent.style.padding = '20px';
            modalContent.style.borderRadius = '10px';
            modalContent.style.maxWidth = '80%';
            modalContent.style.maxHeight = '80%';
            modalContent.style.overflow = 'auto';
            
            const title = document.createElement('h3');
            title.textContent = 'Array do Mapa';
            title.style.color = '#4cc9f0';
            title.style.marginBottom = '15px';
            
            const code = document.createElement('pre');
            code.textContent = arrayText;
            code.style.backgroundColor = '#1a1a2e';
            code.style.padding = '15px';
            code.style.borderRadius = '5px';
            code.style.overflow = 'auto';
            code.style.maxHeight = '400px';
            code.style.color = '#b8c1ec';
            
            const instructions = document.createElement('p');
            instructions.textContent = 'Copie o texto acima (Ctrl+C) e pressione OK';
            instructions.style.color = '#b8c1ec';
            instructions.style.marginTop = '15px';
            instructions.style.fontSize = '0.9rem';
            
            const closeButton = document.createElement('button');
            closeButton.textContent = 'OK';
            closeButton.style.marginTop = '20px';
            closeButton.style.padding = '10px 20px';
            closeButton.style.backgroundColor = '#4361ee';
            closeButton.style.color = 'white';
            closeButton.style.border = 'none';
            closeButton.style.borderRadius = '5px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.width = '100%';
            
            closeButton.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modalContent.appendChild(title);
            modalContent.appendChild(code);
            modalContent.appendChild(instructions);
            modalContent.appendChild(closeButton);
            modal.appendChild(modalContent);
            
            document.body.appendChild(modal);
            
            code.focus();
            code.select();
        }
        
        // Salvar automaticamente antes de sair
        window.addEventListener('beforeunload', function() {
            if (mapaArray.length > 0) {
                saveMapToStorage();
            }
        });
        
        // ============================================
        // FUNÇÕES DE COPIAR/APAGAR SELECIONADOS
        // ============================================

        
        function deleteSelectedObjects() {
            // Priorizar seleção múltipla, mas usar seleção simples como fallback
            let objectsToDelete = [];
            
            // Se há seleção múltipla, usar ela
            if (selectedObjects.length > 0) {
                objectsToDelete = [...selectedObjects];
            }
            // Se não há seleção múltipla mas há seleção simples, usar ela
            else if (selectedObject) {
                const index = parseInt(selectedObject.dataset.index);
                if (index >= 0 && index < mapaArray.length) {
                    objectsToDelete = [index];
                }
            }
            
            if (objectsToDelete.length === 0) {
                alert('Selecione um ou mais objetos para apagar');
                return;
            }
            
            // Filtrar apenas objetos válidos
            const validObjects = objectsToDelete.filter(index => 
                index >= 0 && index < mapaArray.length && mapaArray[index]
            );
            
            if (validObjects.length === 0) {
                alert('Nenhum objeto válido selecionado');
                return;
            }
            
            const objectNames = validObjects.map(index => mapaArray[index].id);
            
            const confirmMessage = objectNames.length === 1 
                ? `Apagar o objeto "${objectNames[0]}"?`
                : `Apagar ${objectNames.length} objetos: ${objectNames.join(', ')}?`;
            
            if (confirm(confirmMessage)) {
                console.log('DEBUG: Removendo objetos com índices:', validObjects);
                removeMultipleObjects(validObjects);
                alert(`${validObjects.length} objeto(s) apagado(s)`);
            }
        }
        
        function removeMultipleObjects(indices) {
            console.log('DEBUG: removeMultipleObjects chamada com índices:', indices);
            console.log('DEBUG: mapaArray antes da remoção:', mapaArray.length, 'objetos');
            
            // Remover objetos em ordem decrescente para não afetar índices
            const indicesToRemove = [...indices].sort((a, b) => b - a);
            console.log('DEBUG: Índices ordenados para remoção:', indicesToRemove);
            
            // Fazer uma cópia do array para preservar os objetos
            const objectsToRemove = [];
            indicesToRemove.forEach(index => {
                if (index >= 0 && index < mapaArray.length) {
                    objectsToRemove.push(mapaArray[index]);
                }
            });
            
            console.log('DEBUG: Objetos a serem removidos:', objectsToRemove.length);
            
            // Filtrar o array removendo os objetos selecionados
            mapaArray = mapaArray.filter(obj => !objectsToRemove.includes(obj));
            
            console.log('DEBUG: mapaArray depois da remoção:', mapaArray.length, 'objetos');
            
            // Remove todos os elementos do DOM de uma vez
            const allObjectElements = document.querySelectorAll('.map-object');
            allObjectElements.forEach(element => element.remove());
            
            // Recriar elementos DOM para os objetos restantes
            mapaArray.forEach((obj, index) => {
                if (obj.tipo === 'npc') {
                    criarNPCElement(obj, index);
                } else {
                    createMapObjectElement(obj, index);
                }
            });
            
            renderObjectsList();
            clearAllSelections();
            saveMapToStorage();
            
            console.log('DEBUG: Remoção concluída');
        }
        
        function reindexAllObjects() {
            // Atualizar índices de todos os objetos restantes
            const allObjects = document.querySelectorAll('.map-object');
            allObjects.forEach((el, i) => {
                el.dataset.index = i;
            });
        }
        
        // ============================================
        // FUNÇÕES DE IMPORTAÇÃO DE IMAGENS/TILESETS
        // ============================================
        function handleImageFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione um arquivo de imagem válido');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Adicionar à lista de texturas disponíveis
                    const textureData = {
                        id: file.name.replace(/\.[^/.]+$/, ""), // Remove extensão
                        name: file.name,
                        src: e.target.result,
                        width: img.width,
                        height: img.height,
                        type: 'image'
                    };
                    
                    availableTextures.push(textureData);
                    updateTexturePreview();
                    
                    alert(`Imagem "${file.name}" importada com sucesso!`);
                };
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
            event.target.value = ''; // Reset input
        }
        
        function handleTilesetFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione um arquivo de imagem válido para tileset');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Adicionar como tileset
                    const tilesetData = {
                        id: file.name.replace(/\.[^/.]+$/, ""), // Remove extensão
                        name: file.name,
                        src: e.target.result,
                        width: img.width,
                        height: img.height,
                        type: 'tileset',
                        tileSize: 32 // Tamanho padrão do tile
                    };
                    
                    availableTextures.push(tilesetData);
                    updateTexturePreview();
                    
                    alert(`Tileset "${file.name}" importado com sucesso!`);
                };
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
            event.target.value = ''; // Reset input
        }
        
        function handleMapBackgroundSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione um arquivo de imagem válido');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const mapArea = document.getElementById('map-area');
                mapArea.style.backgroundImage = `url(${e.target.result})`;
                mapArea.style.backgroundSize = '100% 100%'; // Estica para cobrir todo o tamanho configurado do mapa
                mapArea.style.backgroundRepeat = 'no-repeat';
                
                document.getElementById('clear-map-bg').style.display = 'block';
            };
            
            reader.readAsDataURL(file);
            event.target.value = ''; // Reset input
        }

        function clearMapBackground() {
            const mapArea = document.getElementById('map-area');
            mapArea.style.backgroundImage = 'none';
            document.getElementById('clear-map-bg').style.display = 'none';
        }
        
        function updateTexturePreview() {
            const previewContainer = document.getElementById('texture-preview');
            const textureGrid = document.getElementById('texture-grid');
            
            if (availableTextures.length === 0) {
                previewContainer.style.display = 'none';
                return;
            }
            
            previewContainer.style.display = 'block';
            textureGrid.innerHTML = '';
            
            availableTextures.forEach((texture, index) => {
                const textureItem = document.createElement('div');
                textureItem.style.cssText = `
                    border: 2px solid #0f3460;
                    border-radius: 5px;
                    padding: 5px;
                    cursor: pointer;
                    transition: all 0.3s;
                    text-align: center;
                `;
                
                const img = document.createElement('img');
                img.src = texture.src;
                img.style.cssText = `
                    max-width: 50px;
                    max-height: 50px;
                    display: block;
                    margin: 0 auto 5px;
                `;
                
                const label = document.createElement('div');
                label.textContent = texture.id;
                label.style.cssText = `
                    font-size: 0.7rem;
                    color: #b8c1ec;
                    word-wrap: break-word;
                `;
                
                textureItem.appendChild(img);
                textureItem.appendChild(label);
                
                // Adicionar tooltip com informações
                textureItem.title = `${texture.name}\nTipo: ${texture.type}\nDimensões: ${texture.width}x${texture.height}`;
                
                // Evento de clique para usar a textura
                textureItem.addEventListener('click', () => {
                    applyTextureToSelectedObjects(texture);
                });
                
                // Evento de hover
                textureItem.addEventListener('mouseenter', () => {
                    textureItem.style.borderColor = '#4cc9f0';
                    textureItem.style.transform = 'scale(1.05)';
                });
                
                textureItem.addEventListener('mouseleave', () => {
                    textureItem.style.borderColor = '#0f3460';
                    textureItem.style.transform = 'scale(1)';
                });
                
                textureGrid.appendChild(textureItem);
            });
        }
        
        function applyTextureToSelectedObjects(texture) {
            if (selectedObjects.length === 0) {
                alert('Selecione um ou mais objetos para aplicar a textura');
                return;
            }
            
            // Aplicar textura aos objetos selecionados
            selectedObjects.forEach(index => {
                const obj = mapaArray[index];
                
                // Atualizar o ID do objeto para usar o nome do arquivo sem extensão
                obj.id = texture.id;
                
                // Adicionar propriedade de textura ao objeto (SEM salvar base64)
                obj.texture = texture.id;
                // REMOVIDO: obj.textureSrc = texture.src; // Não salvar base64
                // REMOVIDO: obj.textureType = texture.type; // Não salvar tipo
                
                // Atualizar elemento visual se existir
                const objectElement = document.querySelector(`.map-object[data-index="${index}"]`);
                if (objectElement) {
                    // Se o objeto tem uma imagem como background, atualizar
                    objectElement.style.backgroundImage = `url(${texture.src})`;
                    objectElement.style.backgroundSize = 'cover';
                    objectElement.style.backgroundPosition = 'center';
                    
                    // Remover cor de fundo se tiver
                    objectElement.style.backgroundColor = 'transparent';
                    
                    // Atualizar label para mostrar o novo ID e que tem textura
                    const label = objectElement.querySelector('.object-label');
                    if (label) {
                        const tipo = obj.tipo === 'npc' ? ' (NPC)' : '';
                        label.textContent = `${obj.id}${tipo} [${texture.id}]`;
                    }
                }
            });
            
            // Atualizar lista lateral
            renderObjectsList();
            
            // Salvar no localStorage
            saveMapToStorage();
            
            alert(`Textura "${texture.id}" aplicada a ${selectedObjects.length} objeto(s). ID do(s) objeto(s) atualizado(s) para "${texture.id}"`);
        }
        
        function loadAvailableTextures() {
            // Carregar texturas salvas do localStorage
            const savedTextures = localStorage.getItem('availableTextures');
            if (savedTextures) {
                try {
                    availableTextures = JSON.parse(savedTextures);
                    updateTexturePreview();
                } catch (error) {
                    console.error('Erro ao carregar texturas salvas:', error);
                }
            }
        }
        
        function saveAvailableTextures() {
            // Salvar texturas no localStorage SEM dados base64 para economizar espaço
            if (availableTextures.length > 0) {
                const cleanTextures = availableTextures.map(texture => {
                    const cleanTexture = {
                        id: texture.id,
                        name: texture.name,
                        width: texture.width,
                        height: texture.height,
                        type: texture.type,
                        tileSize: texture.tileSize
                        // REMOVIDO: src (base64) - não salvar dados de imagem
                    };
                    return cleanTexture;
                });
                localStorage.setItem('availableTextures', JSON.stringify(cleanTextures));
            }
        }
        
        function selectAllObjects() {
            if (mapaArray.length === 0) {
                alert('Nenhum objeto no mapa para selecionar');
                return;
            }
            
            clearAllSelections();
            
            // Selecionar todos os objetos
            for (let i = 0; i < mapaArray.length; i++) {
                const objectElement = document.querySelector(`.map-object[data-index="${i}"]`);
                if (objectElement) {
                    objectElement.classList.add('multi-selected');
                    selectedObjects.push(i);
                    
                    const listItem = document.querySelector(`.object-item[data-index="${i}"]`);
                    if (listItem) listItem.classList.add('multi-selected');
                }
            }
            
            // Selecionar o primeiro como principal
            if (selectedObjects.length > 0) {
                selectedObject = document.querySelector(`.map-object[data-index="${selectedObjects[0]}"]`);
                selectObjectFromElement(selectedObject);
            }
            
            updateSelectionStatus();
            alert(`${selectedObjects.length} objeto(s) selecionado(s)`);
        }
        
        function toggleMultiSelectMode() {
            console.log('=== DEBUG TOGGLE MULTI SELECT MODE ===');
            console.log('Antes - multiSelectMode:', multiSelectMode);
            
            multiSelectMode = !multiSelectMode;
            const button = document.getElementById('multi-select-mode');
            
            console.log('Depois - multiSelectMode:', multiSelectMode);
            
            if (multiSelectMode) {
                button.style.backgroundColor = '#4CAF50';
                button.textContent = '✅ Modo Seleção Múltipla ATIVO';
                button.title = 'Clique para desativar o modo de seleção múltipla';
                
                // Converter seleção simples para múltipla
                console.log('Convertendo seleção simples para múltipla...');
                if (selectedObject) {
                    const index = parseInt(selectedObject.dataset.index);
                    if (index >= 0 && index < mapaArray.length) {
                        // Adicionar à seleção múltipla
                        if (!selectedObjects.includes(index)) {
                            selectedObjects.push(index);
                        }
                        
                        // Atualizar classes visuais
                        selectedObject.classList.add('multi-selected');
                        selectedObject.classList.add('selected');
                        
                        const listItem = document.querySelector(`.object-item[data-index="${index}"]`);
                        if (listItem) {
                            listItem.classList.add('multi-selected');
                        }
                        
                        console.log('Objeto convertido para seleção múltipla:', index);
                    }
                }
                
                console.log('Modo Seleção Múltipla ATIVADO!');
                alert('Modo Seleção Múltipla ATIVADO!\n\nObjetos selecionados foram convertidos para seleção múltipla.\nClique em mais objetos para adicionar à seleção.\nClique novamente no botão para desativar.');
            } else {
                button.style.backgroundColor = '#666';
                button.textContent = '🔄 Modo Seleção Múltipla';
                button.title = 'Clique para ativar o modo de seleção múltipla';
                
                // Converter seleção múltipla para simples (manter apenas o primeiro)
                console.log('Convertendo seleção múltipla para simples...');
                if (selectedObjects.length > 1) {
                    // Manter apenas o primeiro objeto selecionado
                    const firstIndex = selectedObjects[0];
                    const firstObject = document.querySelector(`.map-object[data-index="${firstIndex}"]`);
                    
                    // Limpar todos os selecionados múltiplos
                    selectedObjects.forEach(index => {
                        const objectElement = document.querySelector(`.map-object[data-index="${index}"]`);
                        const listItem = document.querySelector(`.object-item[data-index="${index}"]`);
                        
                        if (objectElement) {
                            objectElement.classList.remove('multi-selected');
                            if (index !== firstIndex) {
                                objectElement.classList.remove('selected');
                            }
                        }
                        if (listItem) {
                            listItem.classList.remove('multi-selected');
                        }
                    });
                    
                    // Manter apenas o primeiro na seleção
                    selectedObjects = [firstIndex];
                    
                    if (firstObject) {
                        selectedObject = firstObject;
                    }
                    
                    console.log('Seleção múltipla convertida para simples. Mantido objeto:', firstIndex);
                }
                
                console.log('Modo Seleção Múltipla DESATIVADO!');
                alert('Modo Seleção Múltipla DESATIVADO!');
            }
            
            updateStatusBar();
            updateSelectionStatus();
            updateActionButtons();
            
            console.log('Estado final - multiSelectMode:', multiSelectMode);
            console.log('selectedObjects:', selectedObjects);
        }
        
        // ============================================
        // FUNÇÕES DE DEBUG (disponíveis no console)
        // ============================================
        function debugModoPath() {
            console.log('=== DEBUG MODO PATH ===');
            console.log('modoPath:', modoPath);
            console.log('npcEditando:', npcEditando);
            console.log('selectedObject:', selectedObject);
            console.log('mapaArray:', mapaArray);
            
            if (selectedObject) {
                const index = parseInt(selectedObject.dataset.index);
                console.log('Objeto selecionado index:', index);
                console.log('Objeto selecionado dados:', mapaArray[index]);
                console.log('É NPC?', mapaArray[index].tipo === 'npc');
            }
            
            console.log('waypoints:', waypoints);
            console.log('waypointSelecionado:', waypointSelecionado);
        }
        
        function forcarModoPath(index = 0) {
            if (mapaArray.length === 0) {
                console.error('Nenhum objeto no mapa');
                return;
            }
            
            // Encontrar primeiro NPC se nenhum índice for especificado
            if (index === null || index === undefined) {
                const npcIndex = mapaArray.findIndex(obj => obj.tipo === 'npc');
                if (npcIndex === -1) {
                    console.error('Nenhum NPC no mapa');
                    return;
                }
                index = npcIndex;
            }
            
            if (index >= mapaArray.length) {
                console.error('Índice inválido');
                return;
            }
            
            if (mapaArray[index].tipo !== 'npc') {
                console.error('Objeto no índice', index, 'não é um NPC. Tipo:', mapaArray[index].tipo);
                return;
            }
            
            // Selecionar o NPC
            const objectElement = document.querySelector(`.map-object[data-index="${index}"]`);
            if (objectElement) {
                selectObjectFromElement(objectElement);
                entrarModoPath(index);
                console.log('Modo path forçado para NPC:', mapaArray[index].id);
            } else {
                console.error('Elemento DOM não encontrado para índice', index);
            }
        }
        
        function resetModoPath() {
            modoPath = false;
            npcEditando = null;
            waypoints = [];
            waypointSelecionado = null;
            
            document.getElementById('map-area').classList.remove('path-mode');
            document.querySelector('.controls-panel').style.opacity = '1';
            document.querySelector('.controls-panel').style.pointerEvents = 'auto';
            
            document.querySelectorAll('.waypoint, .waypoint-line').forEach(el => el.remove());
            
            console.log('Modo path resetado');
            updateStatusBar();
        }
        
        // ============================================
        // FUNÇÕES DE COLAGEM DE OBJETOS
        // ============================================
        function pasteObjects() {
            console.log('=== DEBUG PASTE OBJECTS ===');
            console.log('copiedObjects.length:', copiedObjects.length);
            
            if (copiedObjects.length === 0) {
                alert('Nenhum objeto copiado para colar. Use o botão "Copiar Objeto" primeiro.');
                return;
            }
            
            // Ativar modo de colagem
            pasteMode = true;
            
            console.log('Modo de colagem ativado!');
            alert(`Modo de colagem ATIVADO!\n\nClique no mapa para colar ${copiedObjects.length} objeto(s) copiado(s).\n\nPressione ESC para cancelar.`);
            
            updateStatusBar();
        }
        
        function pasteObjectsAtPosition(e) {
            if (copiedObjects.length === 0) return;
            
            const rect = document.getElementById('map-area').getBoundingClientRect();
            const scale = zoomLevel;
            
            let clickX = (e.clientX - rect.left) / scale;
            let clickY = (e.clientY - rect.top) / scale;
            
            // Snap to grid se estiver ativo
            const snapToGrid = document.getElementById('snap-to-grid').value === 'true';
            const gridSize = parseInt(document.getElementById('grid-size').value);
            
            if (snapToGrid && gridSize > 0) {
                clickX = Math.round(clickX / gridSize) * gridSize;
                clickY = Math.round(clickY / gridSize) * gridSize;
            }
            
            // Calcular offset para manter a posição relativa
            let minX = Math.min(...copiedObjects.map(obj => obj.x));
            let minY = Math.min(...copiedObjects.map(obj => obj.y));
            
            const offsetX = clickX - minX;
            const offsetY = clickY - minY;
            
            // Criar novos objetos copiados
            const newObjects = [];
            copiedObjects.forEach(obj => {
                const newObj = {
                    ...obj,
                    x: obj.x + offsetX,
                    y: obj.y + offsetY
                };
                
                // Adicionar novo ID para evitar conflitos
                newObj.id = `${obj.id}_copia_${Date.now()}`;
                
                newObjects.push(newObj);
                mapaArray.push(newObj);
            });
            
            // Recriar elementos DOM
            const startIndex = mapaArray.length - newObjects.length;
            newObjects.forEach((obj, index) => {
                const arrayIndex = startIndex + index;
                if (obj.tipo === 'npc') {
                    criarNPCElement(obj, arrayIndex);
                } else {
                    createMapObjectElement(obj, arrayIndex);
                }
            });
            
            renderObjectsList();
            saveMapToStorage();
            
            alert(`${newObjects.length} objeto(s) colado(s) com sucesso!`);
        }
        
        // ============================================
        // FUNÇÕES DE MOVIMENTO DE SELEÇÃO
        // ============================================
        function toggleMoveMode() {
            moveMode = !moveMode;
            const button = document.getElementById('move-mode');
            
            if (moveMode) {
                if (selectedObjects.length === 0) {
                    alert('Selecione um ou mais objetos primeiro para ativar o modo de movimento.');
                    moveMode = false;
                    return;
                }
                
                button.style.backgroundColor = '#FF9800';
                button.textContent = '✅ Modo Movimento ATIVO';
                button.title = 'Clique para desativar o modo de movimento';
                
                alert(`Modo Movimento ATIVADO!\n\n${selectedObjects.length} objeto(s) selecionado(s) serão movidos juntos.\nClique e arraste para mover todos.\nClique novamente no botão para desativar.`);
            } else {
                button.style.backgroundColor = '#666';
                button.textContent = '🏃 Mover Seleção';
                button.title = 'Clique para ativar o modo de movimento';
                
                alert('Modo Movimento DESATIVADO!');
            }
            
            updateStatusBar();
        }
        
        function startMoveSelection(e, clickedObject) {
            isMovingSelection = true;
            moveStartPos = {
                x: e.clientX,
                y: e.clientY
            };
            
            // Salvar posições iniciais dos objetos selecionados
            const selectedObjectsData = selectedObjects.map(index => ({
                index: index,
                x: mapaArray[index].x,
                y: mapaArray[index].y
            }));
            
            // Adicionar event listeners para movimento
            document.addEventListener('mousemove', function moveHandler(e) {
                if (!isMovingSelection) return;
                
                const deltaX = (e.clientX - moveStartPos.x) / zoomLevel;
                const deltaY = (e.clientY - moveStartPos.y) / zoomLevel;
                
                // Mover todos os objetos selecionados
                selectedObjectsData.forEach(objData => {
                    const newX = objData.x + deltaX;
                    const newY = objData.y + deltaY;
                    
                    // Atualizar no array
                    mapaArray[objData.index].x = Math.round(newX);
                    mapaArray[objData.index].y = Math.round(newY);
                    
                    // Atualizar no DOM
                    const objectElement = document.querySelector(`.map-object[data-index="${objData.index}"]`);
                    if (objectElement) {
                        objectElement.style.left = `${Math.round(newX)}px`;
                        objectElement.style.top = `${Math.round(newY)}px`;
                    }
                });
            });
            
            document.addEventListener('mouseup', function upHandler() {
                isMovingSelection = false;
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
                
                renderObjectsList();
                saveMapToStorage();
            });
        }
        
        // ============================================
        // FUNÇÕES DE COPIAR (ATUALIZADAS)
        // ============================================
        function copySelectedObjects() {
            console.log('=== DEBUG COPY SELECTED OBJECTS ===');
            console.log('selectedObjects:', selectedObjects);
            console.log('selectedObjects.length:', selectedObjects.length);
            
            if (selectedObjects.length === 0) {
                alert('Selecione um ou mais objetos para copiar');
                return;
            }
            
            // Copiar dados dos objetos selecionados
            copiedObjects = selectedObjects.map(index => {
                const obj = mapaArray[index];
                console.log('Copiando objeto:', index, obj);
                return JSON.parse(JSON.stringify(obj));
            });
            
            console.log('=== RESULTADO DA CÓPIA ===');
            console.log('copiedObjects:', copiedObjects);
            console.log('copiedObjects.length:', copiedObjects.length);
            
            alert(`${copiedObjects.length} objeto(s) copiado(s)!\n\nAgora clique no mapa onde deseja colar os objetos.`);
        }
        
        // ============================================
        // FUNÇÃO TOGGLE ISOMETRIC
        // ============================================
        function toggleIsometricView() {
            isIsometricView = !isIsometricView;
            const btn = document.getElementById('btn-iso-toggle');
            const input = document.getElementById('iso-scale-x');
            
            btn.textContent = isIsometricView ? 'ISO' : '2D';
            btn.style.backgroundColor = isIsometricView ? '#4CAF50' : 'rgba(0, 0, 0, 0.7)';
            input.style.display = isIsometricView ? 'block' : 'none';
            applyZoomToMap();
        }

        // ============================================
        // FUNÇÃO PARA LIMPAR DADOS BASE64
        // ============================================
        function cleanBase64Data() {
            if (!confirm('Deseja limpar todos os dados base64 (imagens em formato texto) do localStorage, do mapa atual e das texturas disponíveis?\n\nIsso irá:\n• Remover dados base64 do localStorage COMPLETAMENTE\n• Limpar propriedades textureSrc e textureType dos objetos\n• Limpar dados src das texturas (manter apenas nomes)\n• Reduzir significativamente o tamanho dos arquivos salvos\n• Melhorar o desempenho do editor')) {
                return;
            }
            
            console.log('🗑️ === INICIANDO LIMPEZA DE DADOS BASE64 ===');
            
            let cleanedObjects = 0;
            let cleanedTextures = 0;
            
            // 1. VERIFICAR DADOS ANTES DA LIMPEZA
            console.log('📋 Verificando dados ANTES da limpeza:');
            console.log('- mapaArray.length:', mapaArray.length);
            console.log('- availableTextures.length:', availableTextures.length);
            console.log('- localStorage mapaEditorData existe:', !!localStorage.getItem('mapaEditorData'));
            console.log('- localStorage availableTextures existe:', !!localStorage.getItem('availableTextures'));
            
            // 2. LIMPAR MAPAARRAY ATUAL
            console.log('🧹 Limpando mapaArray atual...');
            mapaArray.forEach(obj => {
                if (obj.textureSrc || obj.textureType) {
                    delete obj.textureSrc;
                    delete obj.textureType;
                    cleanedObjects++;
                    console.log('   ✅ Removido base64 do objeto:', obj.id);
                }
            });
            
            // 3. LIMPAR AVAILABLETEXTURES DA MEMÓRIA
            console.log('🧹 Limpando availableTextures da memória...');
            availableTextures.forEach(texture => {
                if (texture.src) {
                    delete texture.src;
                    cleanedTextures++;
                    console.log('   ✅ Removido src da textura:', texture.id);
                }
            });
            
            // 4. LIMPAR LOCALSTORAGE COMPLETAMENTE
            console.log('🧹 Limpando localStorage...');
            
            // Limpar mapaEditorData
            const mapData = localStorage.getItem('mapaEditorData');
            if (mapData) {
                try {
                    const parsed = JSON.parse(mapData);
                    console.log('   📋 Dados mapaEditorData encontrados:', parsed.mapaArray ? parsed.mapaArray.length : 0, 'objetos');
                    
                    if (parsed.mapaArray) {
                        let localCleanedObjects = 0;
                        parsed.mapaArray.forEach(obj => {
                            if (obj.textureSrc || obj.textureType) {
                                delete obj.textureSrc;
                                delete obj.textureType;
                                localCleanedObjects++;
                                console.log('   ✅ Removido base64 do objeto localStorage:', obj.id);
                            }
                        });
                        
                        // Salvar dados limpos
                        localStorage.setItem('mapaEditorData', JSON.stringify(parsed));
                        console.log('   ✅ mapaEditorData limpo e salvo no localStorage');
                    }
                } catch (error) {
                    console.error('❌ Erro ao limpar mapaEditorData:', error);
                }
            } else {
                console.log('   ℹ️ Nenhum dado mapaEditorData encontrado no localStorage');
            }
            
            // Limpar availableTextures - manter apenas nomes
            const texturesData = localStorage.getItem('availableTextures');
            if (texturesData) {
                try {
                    const parsed = JSON.parse(texturesData);
                    console.log('   📋 Dados availableTextures encontrados:', Array.isArray(parsed) ? parsed.length : 0, 'texturas');
                    
                    if (Array.isArray(parsed)) {
                        const cleanTextures = parsed.map(texture => {
                            const cleanTexture = {
                                id: texture.id,
                                name: texture.name,
                                width: texture.width,
                                height: texture.height,
                                type: texture.type,
                                tileSize: texture.tileSize
                                // REMOVIDO: src (dados base64 da imagem)
                            };
                            return cleanTexture;
                        });
                        
                        // Salvar texturas limpas
                        localStorage.setItem('availableTextures', JSON.stringify(cleanTextures));
                        console.log('   ✅ availableTextures limpo e salvo no localStorage');
                    }
                } catch (error) {
                    console.error('❌ Erro ao limpar availableTextures:', error);
                }
            } else {
                console.log('   ℹ️ Nenhum dado availableTextures encontrado no localStorage');
            }
            
            // 5. VERIFICAR DADOS APÓS A LIMPEZA
            console.log('📋 Verificando dados APÓS a limpeza:');
            console.log('- localStorage mapaEditorData tamanho:', localStorage.getItem('mapaEditorData') ? new Blob([localStorage.getItem('mapaEditorData')]).size : 0, 'bytes');
            console.log('- localStorage availableTextures tamanho:', localStorage.getItem('availableTextures') ? new Blob([localStorage.getItem('availableTextures')]).size : 0, 'bytes');
            
            // 6. FORÇAR RECARREGAMENTO DAS TEXTURAS LIMPAS
            console.log('🔄 Recarregando texturas limpas...');
            loadAvailableTextures(); // Recarregar texturas do localStorage limpo
            
            // 7. ATUALIZAR INTERFACE
            renderObjectsList();
            updateTexturePreview();
            
            // 8. SALVAR MAPA LIMPO
            saveMapToStorage();
            
            console.log('✅ === LIMPEZA CONCLUÍDA ===');
            
            const resultMessage = `✅ Limpeza concluída!\n\n📊 Relatório:\n• ${cleanedObjects} objeto(s) limpo(s) no mapa atual\n• ${cleanedTextures} textura(s) limpa(s) da memória\n• localStorage completamente limpo\n\n💾 Verificação:\n• Recarregue a página para confirmar\n• Os dados base64 foram removidos definitivamente!\n\n🔍 Abra o console (F12) para ver detalhes da limpeza.`;
            
            alert(resultMessage);
            
            // Opcional: Forçar reload após 2 segundos
            setTimeout(() => {
                if (confirm('Deseja recarregar a página agora para aplicar as mudanças?')) {
                    location.reload();
                }
            }, 2000);
        }
        
        // ============================================
        // FUNÇÕES DE DEBUG E VERIFICAÇÃO
        // ============================================
        function debugLocalStorage() {
            console.log('🔍 === DEBUG LOCALSTORAGE ===');
            
            const mapData = localStorage.getItem('mapaEditorData');
            const texturesData = localStorage.getItem('availableTextures');
            
            console.log('📋 mapaEditorData:');
            if (mapData) {
                try {
                    const parsed = JSON.parse(mapData);
                    console.log('   - Tamanho:', new Blob([mapData]).size, 'bytes');
                    console.log('   - Objetos:', parsed.mapaArray ? parsed.mapaArray.length : 0);
                    
                    if (parsed.mapaArray) {
                        parsed.mapaArray.forEach((obj, i) => {
                            const hasBase64 = obj.textureSrc || obj.textureType;
                            console.log(`   - Objeto ${i}: ${obj.id} - Base64: ${hasBase64 ? 'SIM ❌' : 'NÃO ✅'}`);
                        });
                    }
                } catch (error) {
                    console.log('   - Erro ao parsear:', error);
                }
            } else {
                console.log('   - Nenhum dado encontrado');
            }
            
            console.log('📋 availableTextures:');
            if (texturesData) {
                try {
                    const parsed = JSON.parse(texturesData);
                    console.log('   - Tamanho:', new Blob([texturesData]).size, 'bytes');
                    console.log('   - Texturas:', Array.isArray(parsed) ? parsed.length : 0);
                    
                    if (Array.isArray(parsed)) {
                        parsed.forEach((texture, i) => {
                            const hasSrc = texture.src && texture.src.startsWith('data:image');
                            console.log(`   - Textura ${i}: ${texture.id} - Base64: ${hasSrc ? 'SIM ❌' : 'NÃO ✅'}`);
                        });
                    }
                } catch (error) {
                    console.log('   - Erro ao parsear:', error);
                }
            } else {
                console.log('   - Nenhum dado encontrado');
            }
        }
        
        function forceCleanBase64() {
            console.log('💪 === FORÇANDO LIMPEZA COMPLETA DE BASE64 ===');
            
            // 1. LIMPAR localStorage DIRETAMENTE
            console.log('1. Limpando localStorage diretamente...');
            
            const mapData = localStorage.getItem('mapaEditorData');
            if (mapData) {
                try {
                    const parsed = JSON.parse(mapData);
                    if (parsed.mapaArray) {
                        // Remover todas as propriedades problemáticas
                        parsed.mapaArray.forEach(obj => {
                            delete obj.textureSrc;
                            delete obj.textureType;
                            delete obj.texture;
                            delete obj.backgroundImage;
                        });
                        
                        // Salvar de volta
                        localStorage.setItem('mapaEditorData', JSON.stringify(parsed));
                        console.log('   ✅ mapaEditorData forçadamente limpo');
                    }
                } catch (error) {
                    console.error('   ❌ Erro ao forçar limpeza mapaEditorData:', error);
                }
            }
            
            const texturesData = localStorage.getItem('availableTextures');
            if (texturesData) {
                try {
                    const parsed = JSON.parse(texturesData);
                    if (Array.isArray(parsed)) {
                        // Limpar todas as texturas
                        const cleanTextures = parsed.map(texture => ({
                            id: texture.id,
                            name: texture.name,
                            width: texture.width,
                            height: texture.height,
                            type: texture.type,
                            tileSize: texture.tileSize
                        }));
                        
                        localStorage.setItem('availableTextures', JSON.stringify(cleanTextures));
                        console.log('   ✅ availableTextures forçadamente limpo');
                    }
                } catch (error) {
                    console.error('   ❌ Erro ao forçar limpeza availableTextures:', error);
                }
            }
            
            // 2. LIMPAR MEMÓRIA
            console.log('2. Limpando memória...');
            mapaArray.forEach(obj => {
                delete obj.textureSrc;
                delete obj.textureType;
                delete obj.texture;
            });
            
            availableTextures.forEach(texture => {
                delete texture.src;
            });
            
            // 3. VERIFICAR RESULTADO
            console.log('3. Verificando resultado...');
            setTimeout(() => {
                debugLocalStorage();
            }, 100);
            
            alert('💪 Limpeza forçada concluída! Verifique o console para detalhes.');
        }

        // ============================================
        // FUNÇÕES AUXILIARES
        // ============================================
        function gerarCoordenadasDado(qtd, xIni, yIni, tamanhoObjX, tamanhoObjY, spacing = 1.5) {
            // 1. Calcular o salto (tamanho * fator de espaçamento)
            const saltoX = tamanhoObjX * spacing;
            const saltoY = tamanhoObjY * spacing;

            // 2. Mapeamento das posições para cada face do dado (1 a 6)
            // As posições são: [coluna, linha] onde 0 é início, 1 é meio e 2 é fim.
            const mapas = {
                1: [[1, 1]], // Centro
                2: [[0, 0], [2, 2]], // Diagonal
                3: [[0, 0], [1, 1], [2, 2]], // Diagonal + Centro
                4: [[0, 0], [2, 0], [0, 2], [2, 2]], // 4 Cantos
                5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], // 4 Cantos + Centro
                6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]] // Duas colunas
            };

            // 3. Pegar o mapa correto baseado na quantidade (1-6)
            const pontos = mapas[qtd] || [];

            // 4. Transformar o mapa em coordenadas reais na tela
            // Centraliza o grupo no ponto do clique (xIni, yIni)
            return pontos.map(ponto => {
                return {
                    x: xIni + ((ponto[0] - 1) * saltoX),
                    y: yIni + ((ponto[1] - 1) * saltoY)
                };
            });
        }

        function updateSelectedObjectFromInput(inputId, value) {
            if (!selectedObject) return;
            
            const index = parseInt(selectedObject.dataset.index);
            const obj = mapaArray[index];
            
            switch(inputId) {
                case 'object-id':
                    obj.id = value;
                    break;
                case 'object-width':
                    obj.width = parseInt(value);
                    selectedObject.style.width = `${obj.width}px`;
                    break;
                case 'object-height':
                    obj.height = parseInt(value);
                    selectedObject.style.height = `${obj.height}px`;
                    break;
                case 'object-angle':
                    obj.angle = parseInt(value);
                    selectedObject.style.transform = `rotate(${obj.angle}deg)`;
                    const indicator = selectedObject.querySelector('.rotation-indicator');
                    if (indicator) indicator.style.transform = `rotate(${obj.angle}deg)`;
                    break;
                case 'npc-texture':
                    obj.texture = value;
                    selectedObject.setAttribute('data-texture', value);
                    break;
                case 'npc-speed':
                    obj.speed = parseInt(value);
                    selectedObject.setAttribute('data-speed', value);
                    break;
                case 'npc-scale':
                    obj.scale = parseFloat(value);
                    selectedObject.setAttribute('data-scale', value);
                    break;
                case 'npc-path':
                    obj.path = value;
                    selectedObject.setAttribute('data-path', value);
                    break;
            }
            
            // Atualizar label
            const label = selectedObject.querySelector('.object-label');
            if (label) {
                label.textContent = `${obj.id} (${obj.tipo})`;
            }
            
            saveMapToStorage();
            renderObjectsList();
        }
        
        // Adicione estas funções ao escopo global para acessar pelo console
        window.debugModoPath = debugModoPath;
        window.forcarModoPath = forcarModoPath;
        window.resetModoPath = resetModoPath;
        window.importFromJSON = importFromJSON;
        window.debugLocalStorage = debugLocalStorage;
        window.forceCleanBase64 = forceCleanBase64;
    </script>
</body>
</html>