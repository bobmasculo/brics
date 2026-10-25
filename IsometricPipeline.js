// /var/www/html/brics/IsometricPipeline.js
export default class IsometricPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game: game,
            renderer: game.renderer,
            fragShader: `
                precision mediump float; 
                uniform sampler2D uMainSampler;
                uniform float uShear;
                varying vec2 outTexCoord;

                void main() {
                    vec2 uv = outTexCoord;
                    
                    // Centraliza as coordenadas para inclinar a partir do meio da tela
                    vec2 centered_uv = uv - 0.5;
                    
                    // Aplica o cisalhamento (shear) horizontal baseado na posição vertical
                    centered_uv.x += centered_uv.y * uShear;
                    
                    // Desfaz a centralização
                    uv = centered_uv + 0.5;

                    // Descarta pixels que saem da tela para evitar artefatos nas bordas
                    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // Preto transparente
                    } else {
                        gl_FragColor = texture2D(uMainSampler, uv);
                    }
                }
            `
        });

        this._shear = 0.0;
    }

    onPreRender() {
        this.set1f('uShear', this._shear);
    }

    get shear() {
        return this._shear;
    }

    set shear(value) {
        this._shear = value;
    }
}
