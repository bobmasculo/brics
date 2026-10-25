// /var/www/html/brics/TempoManager.js

export default class TempoManager {
    constructor(scene) {
        this.scene = scene;
        this.currentCycle = [];
        this.currentIndex = 0;
        this.timer = 0;
        this.active = false;
    }

    create() {
        // Configuração do ciclo solicitado:
        // 1. Leve (1 min)
        // 2. Média com poças (3 min)
        // 3. Grande (Forte) com poças (30 seg)
        // 4. Média com poças (3 min)
        const mission1Cycle = [
            { type: 'light_puddles', duration: 60000 },             // 1 minuto
            { type: 'standard_puddles', duration: 180000 }, // 3 minutos
            { type: 'heavy_puddles', duration: 30000 },     // 30 segundos
            { type: 'standard_puddles', duration: 180000 }  // 3 minutos
        ];

        const mission2Cycle = [

            
            { type: 'wind_medium', duration: 30000 },
            { type: 'fog_light', duration: 60000 }         
        ];

        const mission3Cycle = [
            { type: 'fog_light', duration: 60000 },         // 1 minuto
            { type: 'fog_heavy', duration: 180000 },        // 3 minutos
            { type: 'light_puddles', duration: 60000 },     // 1 minuto
            { type: 'fog_heavy', duration: 120000 }         // 2 minutos
        ];

        // Verifica qual missão está rodando para definir o ciclo
        const urlParams = new URLSearchParams(window.location.search);
        const missionId = urlParams.get('mission') || 'missao1';

        // Se houver configuração de clima no window.missionConfig, usa ela.
        // Senão, se for missão 1, usa o ciclo hardcoded.
        if (window.missionConfig && window.missionConfig.weatherCycle) {
            this.setCycle(window.missionConfig.weatherCycle);
        } else if (missionId === 'missao1') {
            this.setCycle(mission1Cycle);
        } else if (missionId === 'missao2') {
            this.setCycle(mission2Cycle);
        } else if (missionId === 'missao3') {
            this.setCycle(mission3Cycle);
        } else {
            // Padrão para outras missões (sem clima ou ciclo simples)
            this.setCycle([{ type: 'none', duration: 60000 }]);
        }
    }

    setCycle(cycle) {
        this.currentCycle = cycle;
        this.currentIndex = 0;
        this.timer = 0;
        this.active = true;
        
        // Aplica o primeiro clima imediatamente
        this.applyCurrentStep();
    }

    update(time, delta) {
        if (!this.active || this.currentCycle.length === 0) return;

        this.timer += delta;
        const currentStep = this.currentCycle[this.currentIndex];

        // Verifica se o tempo do passo atual acabou
        if (this.timer >= currentStep.duration) {
            this.timer = 0;
            // Avança para o próximo passo (loop)
            this.currentIndex = (this.currentIndex + 1) % this.currentCycle.length;
            this.applyCurrentStep();
        }
    }

    applyCurrentStep() {
        const step = this.currentCycle[this.currentIndex];
        
        // Usa a função existente na GameScene para aplicar o clima
        if (this.scene && this.scene.applyWeather) {
            this.scene.applyWeather(step.type);
            
            // Atualiza o texto da UI para refletir o clima automático
            let statusText = '';
            switch(step.type) {
                case 'none': statusText = 'Clima: Limpo'; break;
                case 'light': statusText = 'Clima: Chuva Leve'; break;
                case 'standard': statusText = 'Clima: Chuva'; break;
                case 'heavy': statusText = 'Clima: Tempestade'; break;
                case 'storm': statusText = 'Clima: Trovoada'; break;
                case 'fog_light': statusText = 'Clima: Neblina Dispersa'; break;
                case 'fog_heavy': statusText = 'Clima: Neblina Densa'; break;
                case 'light_puddles': statusText = 'Clima: Chuva Leve + Poças'; break;
                case 'standard_puddles': statusText = 'Clima: Chuva + Poças'; break;
                case 'heavy_puddles': statusText = 'Clima: Tempestade + Poças'; break;
                case 'storm_puddles': statusText = 'Clima: Trovoada + Poças'; break;
                case 'wind_light': statusText = 'Clima: Ventania Leve'; break;
                case 'wind_medium': statusText = 'Clima: Ventania Média'; break;
                case 'wind_strong': statusText = 'Clima: Ventania Forte'; break;
            }
            
            if (this.scene.uiManager) {
                this.scene.uiManager.updateStatus(statusText);
            }
        }
    }
}
