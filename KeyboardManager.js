export default class KeyboardManager {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.keys = null;
    }

    create() {
        // Configura as teclas WASD e K (Toggle)
        this.keys = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            toggle: Phaser.Input.Keyboard.KeyCodes.K,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });

        // Listener para o Toggle (K)
        this.keys.toggle.on('down', () => {
            this.toggleMode();
        });

        // Carrega a preferência salva ao iniciar
        this.loadPreference();
    }

    loadPreference() {
        try {
            const saved = localStorage.getItem('brics_control_mode');
            if (saved) {
                this.isActive = (saved === 'modern');
            }
        } catch (e) {
            console.warn('Erro ao carregar preferência de controle:', e);
        }
    }

    savePreference() {
        try {
            localStorage.setItem('brics_control_mode', this.isActive ? 'modern' : 'classic');
        } catch (e) {
            console.warn('Erro ao salvar preferência de controle:', e);
        }
    }

    toggleMode() {
        this.isActive = !this.isActive;
        this.savePreference();
        
        if (this.scene.uiManager && this.scene.languageManager) {
            const statusKey = this.isActive ? 'status_keyboard_mode_on' : 'status_keyboard_mode_off';
            this.scene.uiManager.updateStatus(this.scene.languageManager.get(statusKey));
        }

        // Ao desativar, para todos os movimentos residuais
        if (!this.isActive) {
            this.scene.players.forEach(p => {
                if (p.stopMovement) p.stopMovement();
                if (p.sprite && p.sprite.body) p.sprite.body.setVelocity(0);
            });
        }
    }

    update(time, delta) {
        if (!this.isActive) return;

        // Verifica se há unidades selecionadas
        const selectedUnits = this.scene.unitController ? this.scene.unitController.selectedUnits : [];
        
        // Para unidades não selecionadas para evitar que deslizem (drifting)
        this.scene.players.forEach(p => {
            if (!selectedUnits.includes(p) && p.health > 0) {
                if (!p.isMoving && p.sprite && p.sprite.body && (p.sprite.body.velocity.x !== 0 || p.sprite.body.velocity.y !== 0)) {
                    p.sprite.body.setVelocity(0);
                    if (p.playIdle) p.playIdle();
                }
            }
        });

        // Se não houver ninguém selecionado, não faz nada
        if (selectedUnits.length === 0) return;

        // Se Shift estiver pressionado, para o movimento (Hold Position)
        if (this.keys.shift.isDown) {
            selectedUnits.forEach(u => {
                if (u.sprite && u.sprite.body) u.sprite.body.setVelocity(0);
                if (u.stopMovement) u.stopMovement();
                if (u.playIdle) u.playIdle();
            });
            return;
        }

        // O líder é o primeiro da seleção (ou o único)
        const leader = selectedUnits[0];

        // Se o líder estiver morto, não move
        if (!leader || leader.health <= 0) return;

        // --- CÂMERA SEGUE O LÍDER ---
        if (this.scene.cameras.main && leader.sprite) {
            if (this.scene.cameras.main._follow !== leader.sprite) {
                this.scene.cameras.main.startFollow(leader.sprite, true, 0.1, 0.1);
            }
        }

        // --- MOVIMENTO DO LÍDER (WASD) ---
        this.handleLeaderMovement(leader);

        // --- MOVIMENTO DOS SEGUIDORES ---
        this.handleFollowers(leader, selectedUnits);
    }

    handleLeaderMovement(leader) {
        if (leader.isDashing) return;
        const speed = leader.speed || 100;
        let velocityX = 0;
        let velocityY = 0;

        if (this.keys.up.isDown) velocityY = -speed;
        if (this.keys.down.isDown) velocityY = speed;
        if (this.keys.left.isDown) velocityX = -speed;
        if (this.keys.right.isDown) velocityX = speed;

        // Normaliza velocidade diagonal
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }

        // Aplica velocidade
        if (leader.sprite && leader.sprite.body) {
            leader.sprite.body.setVelocity(velocityX, velocityY);

            // Cancela qualquer movimento de clique anterior para evitar conflito
            if (leader.isMoving) {
                leader.isMoving = false;
                leader.moveTarget = null;
            }

            // Animação
            if (velocityX !== 0 || velocityY !== 0) {
                let anim = 'down';
                if (Math.abs(velocityX) > Math.abs(velocityY)) {
                    anim = velocityX > 0 ? 'right' : 'left';
                } else {
                    anim = velocityY > 0 ? 'down' : 'up';
                }
                
                if (leader.lastDirection !== anim) {
                    leader.lastDirection = anim;
                }
                
                if (leader.playAnimation) leader.playAnimation(anim);

                // Log de Acessibilidade (Movimento WASD)
                if (this.scene.accessibilityManager && this.scene.accessibilityManager.isActive) {
                    const now = this.scene.time.now;
                    if (!this.lastLogTime || now > this.lastLogTime + 2000 || this.lastLogDirection !== anim) {
                        this.scene.accessibilityManager.log(`Líder andando para: ${anim.toUpperCase()}`, '#ffff00');
                        this.lastLogTime = now;
                        this.lastLogDirection = anim;
                    }
                }
            } else {
                if (leader.playIdle) leader.playIdle();
            }
        }
    }

    handleFollowers(leader, selectedUnits) {
        // Configuração da formação
        const formationRadius = 30; // Distância entre o líder e os seguidores
        const stopThreshold = 10;   // Distância para parar de andar

        // Obtém apenas os seguidores (exclui líder e mortos)
        const followers = selectedUnits.filter(p => p !== leader && p.health > 0);

        followers.forEach((player, index) => {
            if (player.isDashing) return;

            // Calcula a posição ideal na formação (Círculo ao redor do líder)
            // O ângulo é distribuído uniformemente baseado no número de seguidores
            const angle = (index / followers.length) * Math.PI * 2;
            
            const targetX = leader.x + Math.cos(angle) * formationRadius;
            const targetY = leader.y + Math.sin(angle) * formationRadius;

            const dist = Phaser.Math.Distance.Between(player.x, player.y, targetX, targetY);

            if (dist > stopThreshold) {
                // Move para a posição da formação
                this.scene.physics.moveTo(player.sprite, targetX, targetY, player.speed || 100);

                // Cancela movimento de clique (se houver)
                if (player.isMoving) {
                    player.isMoving = false;
                    player.moveTarget = null;
                }

                // Atualiza animação baseada na velocidade
                if (player.sprite.body) {
                    const v = player.sprite.body.velocity;
                    if (Math.abs(v.x) > 10 || Math.abs(v.y) > 10) {
                        let anim = 'down';
                        if (Math.abs(v.x) > Math.abs(v.y)) {
                            anim = v.x > 0 ? 'right' : 'left';
                        } else {
                            anim = v.y > 0 ? 'down' : 'up';
                        }
                        
                        // Atualiza direção apenas se mudou
                        if (player.lastDirection !== anim) {
                            player.lastDirection = anim;
                        }
                        if (player.playAnimation) player.playAnimation(anim);
                    }
                }
            } else {
                // Chegou na posição: Para
                if (player.sprite.body) player.sprite.body.setVelocity(0);
                if (player.playIdle) player.playIdle();
            }
        });
    }
}
