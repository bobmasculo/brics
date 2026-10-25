export default class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.musicVolume = window.gameConfig.DEFAULTS.VOLUME.MUSIC; // Volume global de música
        this.sfxVolume = window.gameConfig.DEFAULTS.VOLUME.SFX;   // Volume global de efeitos
        this.voiceVolume = window.gameConfig.DEFAULTS.VOLUME.VOICE; // Volume global de vozes
        this.currentMusic = null;
        this.currentQuestSound = null;
        this.loadVolume(); // Carrega as configurações salvas ao iniciar
    }

    preload() {
        if (window.gameConfig && window.gameConfig.SOUNDS) {
            Object.entries(window.gameConfig.SOUNDS).forEach(([key, path]) => {
                // Carrega o áudio apenas se o caminho estiver definido
                if (path) {
                    this.scene.load.audio(key, path);
                }
            });
        }
    }

    create() {
        // Configurações iniciais de áudio se necessário
    }

    play(key, config = {}) {
        // Verifica se o som existe no cache antes de tentar tocar
        if (!this.scene.cache.audio.exists(key)) return;

        const isMusic = (key === 'intro' || key.startsWith('missao_')) || config.type === 'music';
        const isQuestSound = config.type === 'quest';
        
        const baseVolume = config.volume !== undefined ? config.volume : 1.0;
        // Sons de quest usam o volume de música para controle do usuário
        let globalVolume = this.sfxVolume;
        if (isMusic) globalVolume = this.musicVolume;
        else if (isQuestSound) globalVolume = this.voiceVolume;

        const finalVolume = baseVolume * globalVolume;

        const soundConfig = { ...config, volume: finalVolume };

        if (isMusic) {
            // Limpa música anterior
            if (this.currentMusic) {
                this.currentMusic.stop();
                this.currentMusic.destroy();
            }
            // Limpa som de quest anterior
            if (this.currentQuestSound) {
                this.currentQuestSound.stop();
                this.currentQuestSound.destroy();
                this.currentQuestSound = null;
            }
            // Toca a nova música
            this.currentMusic = this.scene.sound.add(key, soundConfig);
            this.currentMusic.baseVolume = baseVolume;
            this.currentMusic.play();
        } else if (isQuestSound) {
            // Se o volume de voz for 0, nem toca e nem abaixa a música
            if (this.voiceVolume <= 0) return;

            // Limpa som de quest anterior
            if (this.currentQuestSound) {
                this.currentQuestSound.stop();
                this.currentQuestSound.destroy();
                this.currentQuestSound = null;
            }

            // Abaixa o volume da música (Ducking)
            if (this.currentMusic && this.currentMusic.isPlaying) {
                this.scene.tweens.killTweensOf(this.currentMusic); // Para tweens anteriores
                this.scene.tweens.add({
                    targets: this.currentMusic,
                    volume: 0.2 * this.musicVolume, // Reduz para 20%
                    duration: 500
                });
            }

            // Toca o novo som de quest
            this.currentQuestSound = this.scene.sound.add(key, soundConfig);
            this.currentQuestSound.play();

            // Restaura o volume da música quando a voz terminar
            this.currentQuestSound.once('complete', () => {
                if (this.currentMusic && this.currentMusic.isPlaying) {
                    this.scene.tweens.killTweensOf(this.currentMusic); // Garante que não haja conflito
                    const targetVol = (this.currentMusic.baseVolume || 1.0) * this.musicVolume;
                    this.scene.tweens.add({
                        targets: this.currentMusic,
                        volume: targetVol,
                        duration: 1000
                    });
                }
            });
        } else {
            // Efeitos sonoros normais
            this.scene.sound.play(key, soundConfig);
        }
    }

    // Métodos específicos para facilitar o uso
    playShoot() { 
        // Adiciona variação de pitch (detune) aleatória para evitar repetição
        this.play('shoot', { 
            volume: 0.5, 
            detune: Phaser.Math.Between(-200, 200) 
        }); 
    }
    
    playNpcHit() { this.play('npc_hit', { volume: 0.6 }); }
    
    playNpcDeath() { this.play('npc_death', { volume: 0.8 }); }
    
    playPlayerHit() { this.play('player_hit', { volume: 0.7 }); }
    
    playPlayerDeath() { this.play('player_death', { volume: 1.0 }); }

    playExtractionRadio() { this.play('extraction_radio', { volume: 0.8 }); }

    playAlert() { this.play('alert', { volume: 1.0 }); }

    playExplosion() { this.play('explosion', { volume: 1.0 }); }

    adjustMusicVolume(delta) {
        this.musicVolume = Phaser.Math.Clamp(this.musicVolume + delta, 0, 1);
        if (this.currentMusic && this.currentMusic.isPlaying) {
            const base = this.currentMusic.baseVolume || 1.0;
            this.currentMusic.setVolume(base * this.musicVolume);
        }
        this.saveVolume(); // Salva a alteração
    }

    adjustSfxVolume(delta) {
        this.sfxVolume = Phaser.Math.Clamp(this.sfxVolume + delta, 0, 1);
        this.saveVolume(); // Salva a alteração
    }

    adjustVoiceVolume(delta) {
        this.voiceVolume = Phaser.Math.Clamp(this.voiceVolume + delta, 0, 1);
        this.saveVolume(); // Salva a alteração
    }

    loadVolume() {
        try {
            const savedSettings = localStorage.getItem('brics_sound_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                if (typeof settings.music === 'number') {
                    this.musicVolume = Phaser.Math.Clamp(settings.music, 0, 1);
                }
                if (typeof settings.sfx === 'number') {
                    this.sfxVolume = Phaser.Math.Clamp(settings.sfx, 0, 1);
                }
                if (typeof settings.voice === 'number') {
                    this.voiceVolume = Phaser.Math.Clamp(settings.voice, 0, 1);
                }
            }
        } catch (e) {
            console.warn("Falha ao carregar configurações de som.", e);
        }
    }

    saveVolume() {
        try {
            const settings = { music: this.musicVolume, sfx: this.sfxVolume, voice: this.voiceVolume };
            localStorage.setItem('brics_sound_settings', JSON.stringify(settings));
        } catch (e) {
            console.warn("Falha ao salvar configurações de som.", e);
        }
    }
}