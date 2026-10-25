import GameScene from './GameScene.js';
import Lobby from './Lobby.js';

async function initGame() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedMissionId = urlParams.get('mission') || 'missao1';
    
    // Garante que window.MISSIONS exista
    window.MISSIONS = window.MISSIONS || {};

    // Função para carregar scripts de missão dinamicamente se necessário
    const loadMissionScript = (missionId) => {
        return new Promise((resolve) => {
            // Tenta carregar o arquivo com nome padrão config_nomeDaMissao.js
            const filename = `config_${missionId}.js`;
            
            const script = document.createElement('script');
            script.src = filename;
            script.onload = () => {
                console.log(`[Main] Script ${filename} carregado dinamicamente.`);
                resolve(true);
            };
            script.onerror = () => {
                console.warn(`[Main] Erro ao carregar ${filename}. Tentando fallback...`);
                resolve(false);
            };
            document.head.appendChild(script);
        });
    };

    // Verifica se a missão selecionada já está no registro global. Se não, tenta carregar.
    if (!window.MISSIONS[selectedMissionId]) {
        console.log(`[Main] Missão '${selectedMissionId}' não encontrada na memória. Tentando carregar arquivo...`);
        await loadMissionScript(selectedMissionId);
    }

    // Tenta pegar a missão novamente
    let currentMission = window.MISSIONS[selectedMissionId];

    // Fallback para Missão 1 se a solicitada falhar
    if (!currentMission) {
        console.warn(`[Main] Falha ao carregar '${selectedMissionId}'. Tentando fallback para 'missao1'.`);
        if (!window.MISSIONS['missao1']) {
             // Tenta carregar config_missoes.js (nome legado para missão 1)
             await new Promise(r => {
                 const s = document.createElement('script');
                 s.src = 'config_missoes.js';
                 s.onload = r; s.onerror = r;
                 document.head.appendChild(s);
             });
        }
        currentMission = window.MISSIONS['missao1'];
    }

    if (currentMission) {
        window.missionConfig = {
            mapImage: currentMission.mapImage,
            MAP_OBJECTS: currentMission.MAP_OBJECTS || [],
            OBJECTIVES: currentMission.OBJECTIVES || {},
            INTERIORS: currentMission.INTERIORS || [],
            NPCS: currentMission.NPCS || [],
            INFO_NPCS: currentMission.INFO_NPCS || [],
            playerCount: currentMission.playerCount,
            mapWidth: currentMission.mapWidth,
            mapHeight: currentMission.mapHeight
        };
        console.log(`[Main] Missão ativa: ${selectedMissionId}`);
    } else {
        console.error(`[Main] CRÍTICO: Nenhuma missão pôde ser carregada.`);
    }

    // ATUALIZAÇÃO DO GAMECONFIG COM DADOS DA MISSÃO
    if (window.gameConfig && window.missionConfig) {
        window.gameConfig.MAP_OBJECTS = window.missionConfig.MAP_OBJECTS;
        window.gameConfig.INTERIORS = window.missionConfig.INTERIORS;
        window.gameConfig.NPCS = window.missionConfig.NPCS;
        
        // Detecção de Mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        window.gameConfig.IS_MOBILE = isMobile;

        // Atualiza dimensões visuais do mapa se definidas na missão
        window.gameConfig.VISUAL_MAP_WIDTH = window.missionConfig.mapWidth;
        window.gameConfig.VISUAL_MAP_HEIGHT = window.missionConfig.mapHeight;

        if (window.missionConfig.playerCount && window.gameConfig.ALL_PLAYERS) {
             const count = window.missionConfig.playerCount;
             window.gameConfig.PLAYERS = window.gameConfig.ALL_PLAYERS.slice(0, Math.max(1, Math.min(5, count)));
        }
    }

    startGame();
}

function startGame() {
    // Garante que o config.js carregou antes de iniciar
    if (!window.gameConfig) {
        console.error('CRÍTICO: config.js não foi carregado!');
    }

    // Configuração do Container e CSS para garantir tela cheia sem barras
    const gameContainerId = 'game';
    if (!document.getElementById(gameContainerId)) {
        const div = document.createElement('div');
        div.id = gameContainerId;
        document.body.appendChild(div);
    } 

    const style = document.createElement('style');
    style.textContent = `
        body { margin: 0; padding: 0; overflow: hidden; background-color: #000; }
        #${gameContainerId} { width: 100vw; height: 100vh; overflow: hidden; }
    `;
    document.head.appendChild(style);

    const config = {
        type: Phaser.AUTO,
        backgroundColor: '#050505',
        scale: {
            mode: Phaser.Scale.FIT,
            parent: gameContainerId,
            width: 1920,   // Resolução lógica de desenvolvimento
            height: 1080,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        resolution: window.devicePixelRatio || 1,
        render: {
        antialias: true,
        pixelArt: false 
    },
        scene: [Lobby, GameScene], 
        physics: {
            default: 'arcade',
            arcade: {
                debug: false, 
                gravity: { y: 0 }
            }
        }
    };

    new Phaser.Game(config);

    // Comando global para o console: forceJoystick()
    window.forceJoystick = () => {
        window.forceJoystickEnabled = true; // Define uma flag global
        
        if (window.gameScene && typeof window.gameScene.setupJoystick === 'function') {
            window.gameScene.setupJoystick();
            return "Joystick habilitado agora. Toque no lado esquerdo da tela para ativar.";
        }
        return "O joystick foi agendado! Entre em uma missão (clique em START) e ele aparecerá automaticamente.";
    };
}

// Inicia o processo
initGame();
