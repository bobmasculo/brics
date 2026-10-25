// ================== CLASSE DO JOGADOR ==================
class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    scene.add.existing(this);
    scene.physics.world.enable(this);

    this.speed = 120;
    this.lastDir = 0; // Iniciar olhando para baixo (padrão)
    this.isShooting = false;
    this.shootCooldown = 0; 
    this.weaponVisible = false;

    // Arma
    this.weapon = scene.add.sprite(10, 14, 'gun');
    this.weapon.setScale(0.4);
    this.weapon.setRotation(Math.PI / 2);
    this.weapon.setVisible(false);
    this.weapon.y = 19;
    this.add(this.weapon);

    // Sprite do personagem
    this.bodySprite = scene.add.sprite(0, 0, 'i_down');
    this.add(this.bodySprite);

    // Física
    this.body.setSize(32, 40);
    this.body.setOffset(-16, -20);

    // Criar todas as animações
    this.createAnimations(scene);
    
    // Iniciar com animação idle
    if (this.bodySprite.anims && scene.anims.exists('i_down')) {
      this.bodySprite.anims.play('i_down');
    }
  }

  createAnimations(scene) {
    // Verificar se as texturas existem antes de criar animações
    const textureExists = (key) => scene.textures.exists(key);
    const directions = ['down', 'down_left', 'left', 'up_left', 'up', 'up_right', 'right', 'down_right'];
    
    // ============= ANIMAÇÕES DE ANDAR =============
    const walkKeys = [
      'w_down',       // 0
      'w_down_left',  // 1
      'w_left',       // 2
      'w_up_left',    // 3
      'w_up',         // 4
      'w_up_right',   // 5
      'w_right',      // 6
      'w_down_right'  // 7
    ];

    walkKeys.forEach((key, index) => {
      const animKey = key; // Nome na interface agora é o padrão w_down
      
      // Remover animação antiga se existir
      if (scene.anims.exists(animKey)) {
        scene.anims.remove(animKey);
      }
      
      if (textureExists(key)) {
        // Verificar se a textura tem frames
        const texture = scene.textures.get(key);
        if (texture && texture.source) {
          const frameCount = 16; // Padronizado: 16 poses
          scene.anims.create({
            key: animKey,
            frames: scene.anims.generateFrameNames(key, {
              start: 0,
              end: frameCount - 1,
              zeroPad: 0
            }),
            frameRate: 10,
            repeat: -1
          });
          console.log(`Animação criada: ${animKey} com ${frameCount} frames`);
        }
      } else {
        this.createFallbackAnimation(scene, animKey, 16);
      }
    });
    
    // ============= ANIMAÇÕES DE IDLE =============
    const idleKeys = [
      'i_down',       // 0
      'i_down_left',  // 1
      'i_left',       // 2
      'i_up_left',    // 3
      'i_up',         // 4
      'i_up_right',   // 5
      'i_right',      // 6
      'i_down_right'  // 7
    ];
    idleKeys.forEach((key, index) => {
      const animKey = key;
      
      if (scene.anims.exists(animKey)) {
        scene.anims.remove(animKey);
      }
      
      if (textureExists(key)) {
        const texture = scene.textures.get(key);
        if (texture && texture.source) {
          const frameCount = 24; // Padronizado: 24 poses
          scene.anims.create({
            key: animKey,
            frames: scene.anims.generateFrameNames(key, {
              start: 0,
              end: frameCount - 1,
              zeroPad: 0
            }),
            frameRate: 10,
            repeat: -1
          });
          console.log(`Animação criada: ${animKey} com ${frameCount} frames`);
        }
      } else {
        this.createFallbackAnimation(scene, animKey, 24);
      }
    });
    
    // ============= ANIMAÇÕES DE TIRO =============
    const shootConfigs = [
      { key: 's_down',       animKey: 's_down',       frames: 16 },
      { key: 's_down_left',  animKey: 's_down_left',  frames: 16 },
      { key: 's_left',       animKey: 's_left',       frames: 16 },
      { key: 's_up_left',    animKey: 's_up_left',    frames: 16 },
      { key: 's_up',         animKey: 's_up',         frames: 16 },
      { key: 's_up_right',   animKey: 's_up_right',   frames: 16 },
      { key: 's_right',      animKey: 's_right',      frames: 16 },
      { key: 's_down_right', animKey: 's_down_right', frames: 16 }
    ];
    
    shootConfigs.forEach((config) => {
      if (scene.anims.exists(config.animKey)) {
        scene.anims.remove(config.animKey);
      }
      
      if (textureExists(config.key)) {
        const texture = scene.textures.get(config.key);
        if (texture && texture.source) {
          const frameCount = Math.min(config.frames + 1, texture.frameTotal || config.frames + 1);
          scene.anims.create({
            key: config.animKey,
            frames: scene.anims.generateFrameNames(config.key, {
              start: 0,
              end: frameCount - 1,
              zeroPad: 0
            }),
            frameRate: 15,
            repeat: 0
          });
          console.log(`Animação criada: ${config.animKey} com ${frameCount} frames`);
        }
      } else {
        this.createFallbackAnimation(scene, config.animKey, 16, true);
      }
    });
  }
  
  createFallbackAnimation(scene, key, frameCount, isShoot = false) {
    // Criar frames individuais para a animação
    const frames = [];
    
    for (let i = 0; i < frameCount; i++) {
      const textureKey = `${key}_frame_${i}`;
      
      // Só criar se a textura não existir
      if (!scene.textures.exists(textureKey)) {
        // Criar um canvas para cada frame
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Cores diferentes baseadas no frame
        const hue = (key.charCodeAt(0) + i * 30) % 360;
        
        // Fundo
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fillRect(0, 0, 256, 256);
        
        // Corpo
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.fillRect(80, 80, 96, 96);
        
        // Cabeça
        ctx.fillStyle = `hsl(${hue}, 90%, 55%)`;
        ctx.beginPath();
        ctx.arc(128, 100, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos (animados)
        const eyeOffset = Math.sin(i * 0.5) * 5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(110 + eyeOffset, 90, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(146 + eyeOffset, 90, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupilas
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(110 + eyeOffset, 90, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(146 + eyeOffset, 90, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Sorriso (animado)
        ctx.beginPath();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        const smileOffset = Math.sin(i * 0.3) * 10;
        ctx.arc(128, 125, 25, 0.1 + smileOffset * 0.01, Math.PI - 0.1 - smileOffset * 0.01);
        ctx.stroke();
        
        // Adicionar textura ao Phaser
        scene.textures.addCanvas(textureKey, canvas);
      }
      
      frames.push({ key: textureKey });
    }
    
    // Criar animação
    if (!scene.anims.exists(key)) {
      scene.anims.create({
        key: key,
        frames: frames,
        frameRate: 10,
        repeat: isShoot ? 0 : -1
      });
    }
  }

  update(cursors, mouse, spaceKey) {
    if (!this.body || !this.scene) return;
    
    this.body.setVelocity(0);
    let moving = false;
    let newDir = this.lastDir;
    
    const isMovingLeft = cursors.left?.isDown || false;
    const isMovingRight = cursors.right?.isDown || false;
    const isMovingUp = cursors.up?.isDown || false;
    const isMovingDown = cursors.down?.isDown || false;
    
    if (isMovingLeft || isMovingRight || isMovingUp || isMovingDown) {
      moving = true;
      
      let vx = 0;
      let vy = 0;
      
      if (isMovingLeft) vx = -1;
      if (isMovingRight) vx = 1;
      if (isMovingUp) vy = -1;
      if (isMovingDown) vy = 1;
      
      if (vx !== 0 && vy !== 0) {
        vx = vx * 0.707;
        vy = vy * 0.707;
      }
      
      this.body.setVelocity(vx * this.speed, vy * this.speed);
      
      // CONFIGURAÇÃO DE DIREÇÕES
      if (isMovingLeft && isMovingUp) {
        newDir = 3;
      } else if (isMovingRight && isMovingUp) {
        newDir = 5;
      } else if (isMovingLeft && isMovingDown) {
        newDir = 1;
      } else if (isMovingRight && isMovingDown) {
        newDir = 7;
      } else if (isMovingLeft) {
        newDir = 2;
      } else if (isMovingRight) {
        newDir = 6;
      } else if (isMovingUp) {
        newDir = 4;
      } else if (isMovingDown) {
        newDir = 0;
      }
      
      this.lastDir = newDir;
    }
    
    // Tiro
    if (spaceKey?.isDown && !this.isShooting && this.shootCooldown === 0) {
      this.isShooting = true;
      this.shoot();
    }
    
    // Atualizar animação
    if (this.bodySprite && this.bodySprite.anims) {
      const directions = ['down', 'down_left', 'left', 'up_left', 'up', 'up_right', 'right', 'down_right'];
      
      if (this.isShooting) {
        const shootAnim = `s_${directions[this.lastDir]}`;
        if (this.scene.anims.exists(shootAnim) && this.bodySprite.anims.currentAnim?.key !== shootAnim) {
          this.bodySprite.anims.play(shootAnim);
          this.shootCooldown = 20;
        }
      } else if (moving) {
        const walkAnim = `w_${directions[this.lastDir]}`;
        if (this.scene.anims.exists(walkAnim) && this.bodySprite.anims.currentAnim?.key !== walkAnim) {
          this.bodySprite.anims.play(walkAnim, true);
        }
      } else {
        const idleAnim = `i_${directions[this.lastDir]}`;
        if (this.scene.anims.exists(idleAnim) && this.bodySprite.anims.currentAnim?.key !== idleAnim) {
          this.bodySprite.anims.play(idleAnim);
        }
      }
    }
    
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
      if (this.shootCooldown === 0) {
        this.isShooting = false;
      }
    }
    
    if (this.weaponVisible && mouse) {
      const angle = Phaser.Math.Angle.Between(
        this.x, this.y,
        mouse.worldX, mouse.worldY
      );
      this.weapon.setRotation(angle);
    }
    
    this.x = this.body.position.x + 16;
    this.y = this.body.position.y + 20;
  }
  
  shoot() {
    if (!this.isShooting && this.shootCooldown === 0 && this.weaponVisible && this.scene) {
      this.isShooting = true;
      
      const scene = this.scene;
      const angle = Phaser.Math.Angle.Between(
        this.x, this.y,
        scene.input.mousePointer.worldX, scene.input.mousePointer.worldY
      );
      
      // Criar bullet
      let bulletTexture = 'bullet';
      if (!scene.textures.exists(bulletTexture)) {
        bulletTexture = 'player_placeholder';
      }
      
      const bullet = scene.physics.add.sprite(this.x, this.y, bulletTexture);
      bullet.setScale(0.3);
      
      const speed = 300;
      bullet.body.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
      
      scene.time.delayedCall(2000, () => {
        if (bullet) bullet.destroy();
      });
      
      if (scene.textures.exists('gun')) {
        scene.tweens.add({
          targets: this.weapon,
          scaleX: 0.5,
          scaleY: 0.5,
          duration: 50,
          yoyo: true,
          repeat: 0
        });
      }
      
      return true;
    }
    return false;
  }
  
  toggleWeapon() {
    this.weaponVisible = !this.weaponVisible;
    if (this.weapon) {
      this.weapon.setVisible(this.weaponVisible);
    }
  }
  
  // Método para recarregar texturas após upload
  reloadTextures(scene, textureKey, imagePath) {
    console.log(`Recarregando textura: ${textureKey} de ${imagePath}`);
    
    // Carregar a nova imagem
    this.scene.load.image(textureKey, imagePath);
    this.scene.load.once('complete', () => {
      console.log(`Textura ${textureKey} recarregada com sucesso!`);
      // Recriar todas as animações
      this.createAnimations(this.scene);
      // Restaurar animação atual
      this.bodySprite.anims.play(`idle-dir${this.lastDir}`);
    });
    this.scene.load.start();
  }
}

// ================== SCENE ==================
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    console.log('Preload iniciado...');
  }

  create() {
    console.log('Create iniciado...');
    
    // Criar textura placeholder do jogador
    this.createPlayerPlaceholder();
    
    // Criar textura da arma placeholder
    this.createGunPlaceholder();
    
    // Criar textura da bala placeholder
    this.createBulletPlaceholder();
    
    // Tentar carregar spritesheets reais se existirem
    this.loadRealSpritesheets();
    
    // Aguardar um pouco para as texturas carregarem
    this.time.delayedCall(100, () => {
      // Criar jogador
      this.player = new Player(this, 400, 300);
      
      // Configurar controles
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.mouse = this.input.mousePointer;
      
      // Texto de instruções
      this.add.text(10, 10,
        '🎮 CONTROLES:\n' +
        'Setas: mover personagem\n' +
        'E: equipar/desarmar arma\n' +
        'Espaço: atirar (com arma equipada)\n' +
        'Mouse: mirar\n\n' +
        '📁 Use o painel ao lado para fazer upload de novas animações!\n' +
        '🔄 Após upload, clique em "Recarregar Animações"',
        { 
          fontSize: '14px', 
          fill: '#ffffff', 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          padding: { x: 10, y: 8 },
          fontFamily: 'monospace'
        }
      );
      
      // Botão para recarregar animações
      const reloadBtn = this.add.text(10, 280, '🔄 RECARREGAR ANIMAÇÕES', {
        fontSize: '14px',
        fill: '#ffffff',
        backgroundColor: '#3498db',
        padding: { x: 12, y: 6 },
        fontFamily: 'monospace'
      }).setInteractive();
      
      reloadBtn.on('pointerdown', () => {
        this.reloadAnimations();
      });
      
      reloadBtn.on('pointerover', () => {
        reloadBtn.setStyle({ backgroundColor: '#2980b9' });
      });
      
      reloadBtn.on('pointerout', () => {
        reloadBtn.setStyle({ backgroundColor: '#3498db' });
      });
      
      // Botão para resetar projeto
      const resetBtn = this.add.text(10, 320, '🗑️ RESETAR PROJETO', {
        fontSize: '14px',
        fill: '#ffffff',
        backgroundColor: '#e74c3c',
        padding: { x: 12, y: 6 },
        fontFamily: 'monospace'
      }).setInteractive();

      resetBtn.on('pointerdown', () => {
        if (confirm('Atenção: Isso apagará permanentemente todas as animações enviadas. Deseja continuar?')) {
          this.resetProject();
        }
      });

      resetBtn.on('pointerover', () => resetBtn.setStyle({ backgroundColor: '#c0392b' }));
      resetBtn.on('pointerout', () => resetBtn.setStyle({ backgroundColor: '#e74c3c' }));
      
      // Debug text
      this.debugText = this.add.text(10, 350, '', { 
        fontSize: '12px', 
        fill: '#ffff00', 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        padding: { x: 5, y: 3 } 
      });
      
      // Adicionar um círculo de debug no mouse
      this.mouseCircle = this.add.circle(0, 0, 5, 0xff0000, 0.5);
      
      console.log('Jogo inicializado com sucesso!');
    });
  }
  
  createPlayerPlaceholder() {
    // Criar uma textura simples para o placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#3498db';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(32, 25, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(27, 22, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(37, 22, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(25, 40, 14, 8);
    
    this.textures.addCanvas('player_placeholder', canvas);
  }
  
  createGunPlaceholder() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(0, 0, 32, 16);
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(24, 4, 8, 8);
    
    this.textures.addCanvas('gun', canvas);
  }
  
  createBulletPlaceholder() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(8, 8, 3, 0, Math.PI * 2);
    ctx.fill();
    
    this.textures.addCanvas('bullet', canvas);
  }
  
  loadRealSpritesheets() {
    const basePath = 'dados/';
    
    // Lista de arquivos para tentar carregar
    const walkFiles = [
      { key: 'w_down',       file: 'w_down.png' },
      { key: 'w_down_left',  file: 'w_down_left.png' },
      { key: 'w_left',       file: 'w_left.png' },
      { key: 'w_up_left',    file: 'w_up_left.png' },
      { key: 'w_up',         file: 'w_up.png' },
      { key: 'w_up_right',   file: 'w_up_right.png' },
      { key: 'w_right',      file: 'w_right.png' },
      { key: 'w_down_right', file: 'w_down_right.png' }
    ];
    
    const idleFiles = [
      { key: 'i_down',       file: 'i_down.png' },
      { key: 'i_down_left',  file: 'i_down_left.png' },
      { key: 'i_left',       file: 'i_left.png' },
      { key: 'i_up_left',    file: 'i_up_left.png' },
      { key: 'i_up',         file: 'i_up.png' },
      { key: 'i_up_right',   file: 'i_up_right.png' },
      { key: 'i_right',      file: 'i_right.png' },
      { key: 'i_down_right', file: 'i_down_right.png' }
    ];
    
    const shootFiles = [
      { key: 's_down',       file: 's_down.png' },
      { key: 's_down_left',  file: 's_down_left.png' },
      { key: 's_left',       file: 's_left.png' },
      { key: 's_up_left',    file: 's_up_left.png' },
      { key: 's_up',         file: 's_up.png' },
      { key: 's_up_right',   file: 's_up_right.png' },
      { key: 's_right',      file: 's_right.png' },
      { key: 's_down_right', file: 's_down_right.png' }
    ];
    
    // Carregar todas as texturas
    const allFiles = [...walkFiles, ...idleFiles, ...shootFiles];
    
    allFiles.forEach((item) => {
      this.load.spritesheet(item.key, basePath + item.file, { 
        frameWidth: 256, 
        frameHeight: 256 
      });
    });
    
    // Quando tudo carregar, recriar animações
    this.load.once('complete', () => {
      console.log('Todas as texturas carregadas!');
      if (this.player) {
        this.player.createAnimations(this);
      }
    });
    
    this.load.start();
  }
  
  update() {
    if (this.player) {
      this.player.update(this.cursors, this.mouse, this.keySpace);
      
      // Atualizar círculo do mouse
      if (this.mouseCircle && this.mouse) {
        this.mouseCircle.setPosition(this.mouse.worldX, this.mouse.worldY);
      }
      
      // Atualizar texto de debug
      if (this.debugText && this.player.bodySprite && this.player.bodySprite.anims.currentAnim) {
        this.debugText.setText(
          `📊 STATUS:\n` +
          `Animação: ${this.player.bodySprite.anims.currentAnim.key}\n` +
          `Direção: ${this.player.lastDir}\n` +
          `Arma: ${this.player.weaponVisible ? '✅ Equipada' : '❌ Guardada'}\n` +
          `Atirando: ${this.player.isShooting ? '🔫 Sim' : '⭕ Não'}\n` +
          `Posição: (${Math.floor(this.player.x)}, ${Math.floor(this.player.y)})`
        );
      }
      
      if (this.keyE && Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.player.toggleWeapon();
      }
    }
  }
  
  reloadAnimations() {
    console.log('🔄 Recarregando animações...');
    
    // Mostrar mensagem de loading
    const loadingText = this.add.text(400, 300, 'RECARREGANDO ANIMAÇÕES...', {
      fontSize: '20px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    // Recarregar todas as texturas
    this.loadRealSpritesheets();
    
    // Quando terminar de carregar
    this.load.once('complete', () => {
      if (this.player) {
        this.player.createAnimations(this);
        this.player.bodySprite.anims.play(`idle-dir${this.player.lastDir}`);
        console.log('✅ Animações recarregadas com sucesso!');
        
        // Remover mensagem de loading
        loadingText.destroy();
        
        // Mostrar mensagem de sucesso
        const successText = this.add.text(400, 300, '✅ ANIMAÇÕES ATUALIZADAS!', {
          fontSize: '20px',
          fill: '#00ff00',
          backgroundColor: '#000000',
          padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        this.time.delayedCall(2000, () => {
          successText.destroy();
        });
      }
    });
    
    this.load.start();
  }

  resetProject() {
    fetch('upload.php?action=reset')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Recarregar a página para limpar o cache do Phaser e voltar aos placeholders
          window.location.reload();
        } else {
          alert('Erro ao resetar projeto: ' + (data.error || 'Erro desconhecido'));
        }
      })
      .catch(error => {
        console.error('Erro na requisição de reset:', error);
      });
  }
}

// Configuração do jogo
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#2c3e50',
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: { 
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: GameScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

// Inicializar o jogo quando a página carregar
let game = null;

window.addEventListener('load', () => {
  console.log('Inicializando o jogo...');
  game = new Phaser.Game(config);
});

// Função global para recarregar animações (acessível pelo console)
window.reloadGameAnimations = () => {
  if (game && game.scene && game.scene.getScene('GameScene')) {
    game.scene.getScene('GameScene').reloadAnimations();
    console.log('Animações recarregadas!');
  } else {
    console.log('Jogo não encontrado');
  }
};
