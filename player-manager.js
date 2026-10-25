(function() {
    'use strict';

    window.PlayerManager = {
        spawnPlayers: function(scene) {
            const { MAX_HEALTH, PLAYERS } = scene.gameConstants;

            PLAYERS.forEach(playerData => {
                this.createPlayer(scene, playerData.x, playerData.y, playerData.texture, MAX_HEALTH);
            });
        },

        createPlayer: function(scene, x, y, texture, maxHealth) {
            const p = scene.physics.add.sprite(x, y, texture)
                .setOrigin(0.5, 1)
                .setScale(0.12)
                .setCollideWorldBounds(true);

            p.health = maxHealth;
            p.target = null;

            p.setDepth(p.y);

            p.healthText = scene.add.text(
                p.x,
                p.y - p.displayHeight - 10, 
                p.health.toString(),
                { fontSize: '10px', fill: scene.gameConstants.COLORS.HEALTH_TEXT, stroke: scene.gameConstants.COLORS.HEALTH_STROKE, strokeThickness: 3 }
            )
            .setOrigin(0.5)
            .setDepth(p.y + 1)
            .setScrollFactor(1);

            p.body.setDrag(0);

            p.setInteractive({ useHandCursor: true });

            p.on('pointerdown', () => {
                if (scene.actionMode === 'shoot') return;

                scene.selectedPlayer = p;
                scene.actionMode = null;
                window.UIManager.updateItemSlots(scene);

                if (!scene.highlightBox) {
                    scene.highlightBox = scene.add.rectangle(
                        p.x,
                        p.y - p.displayHeight/2,
                        p.displayWidth + 10,
                        p.displayHeight + 10
                    )
                    .setStrokeStyle(3, scene.gameConstants.COLORS.HIGHLIGHT)
                    .setDepth(1000);
                } else {
                    scene.highlightBox.setPosition(p.x, p.y - p.displayHeight/2);
                    scene.highlightBox.setSize(p.displayWidth + 10, p.displayHeight + 10);
                }
            });

            scene.players.add(p);

            return p;
        }
    };

})();