export default class LoadingManager {
    constructor(scene) {
        this.scene = scene;
    }

    create() {
        const { width, height } = this.scene.scale;

        // Fundo preto total para cobrir a tela anterior
        const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000).setDepth(20000);

        // Dimensões da barra
        const barWidth = 320;
        const barHeight = 50;
        const barX = (width - barWidth) / 2;
        const barY = (height - barHeight) / 2;

        // Caixa de fundo da barra (Cinza escuro)
        const progressBox = this.scene.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(barX, barY, barWidth, barHeight);
        progressBox.setDepth(20001);

        // Barra de progresso (Verde)
        const progressBar = this.scene.add.graphics();
        progressBar.setDepth(20002);

        // Texto de Título
        const loadingText = this.scene.add.text(width / 2, barY - 40, 'INICIANDO SISTEMAS...', {
            font: '20px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(20003);

        // Texto de Porcentagem
        const percentText = this.scene.add.text(width / 2, height / 2, '0%', {
            font: '18px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(20003);

        // Texto do Asset atual
        const assetText = this.scene.add.text(width / 2, barY + barHeight + 30, '', {
            font: '14px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setDepth(20003);

        // --- Eventos do Loader ---
        
        // Progresso (0 a 1)
        this.scene.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1); // Verde Neon
            // Margem interna de 10px
            progressBar.fillRect(barX + 10, barY + 10, (barWidth - 20) * value, barHeight - 20);
        });

        // Progresso por arquivo
        this.scene.load.on('fileprogress', (file) => {
            assetText.setText('Carregando: ' + file.key);
        });

        // Conclusão
        this.scene.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
            bg.destroy();
        });
    }
}