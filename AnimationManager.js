export default class AnimationManager {
    constructor(scene) {
        this.scene = scene;
    }

    // Carrega os spritesheets baseados na configuração
    preload() {
        if (!window.gameConfig || !window.gameConfig.PLAYER_TYPES) {
            console.error('ERRO CRÍTICO: window.gameConfig não encontrado. Verifique se o arquivo config.js está importado no index.html antes do main.js e se não há erros de sintaxe nele.');
            return;
        }
 
        Object.values(window.gameConfig.PLAYER_TYPES).forEach(player => {
            console.log(`Tentando carregar sprite: ${player.textureKey} caminho: ${player.path}`);
            this.scene.load.spritesheet(player.textureKey, player.path, {
                frameWidth: player.frameWidth,
                frameHeight: player.frameHeight
            });
        });
    }

    // Cria as animações no Phaser Animation Manager
    create() {
        if (!window.gameConfig || !window.gameConfig.PLAYER_TYPES) return;

        Object.values(window.gameConfig.PLAYER_TYPES).forEach(player => {
            Object.entries(player.animationFrames).forEach(([animName, frames]) => {
                const key = `${player.textureKey}_${animName}`; // Ex: player_1_down
                
                if (!this.scene.anims.exists(key)) {
                    this.scene.anims.create({
                        key: key,
                        frames: this.scene.anims.generateFrameNumbers(player.textureKey, { frames: frames }),
                        frameRate: player.frameRate,
                        repeat: (animName === 'morto' || animName.startsWith('shoot_')) ? 0 : -1 // Toca uma vez se for morte ou tiro
                    });
                }
            });
        });
    }
}