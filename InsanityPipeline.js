// /var/www/html/brics/InsanityPipeline.js
export default class InsanityPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game: game,
            renderer: game.renderer,
            fragShader: `
                precision mediump float;
                uniform sampler2D uMainSampler;
                uniform float uTime;
                uniform float uFrequency;
                uniform float uAmplitude;
                varying vec2 outTexCoord;

                void main() {
                    vec2 uv = outTexCoord;
                    if (uAmplitude > 0.0) {
                        // Efeito de ondulação no eixo X baseado no tempo e na posição Y
                        float wobble = sin(uTime * uFrequency + uv.y * 25.0) * uAmplitude;
                        uv.x += wobble;
                    }
                    gl_FragColor = texture2D(uMainSampler, uv);
                }
            `
        });

        this._frequency = 10.0;
        this._amplitude = 0.0; // Começa sem efeito
    }

    onPreRender() {
        this.set1f('uTime', this.game.loop.time / 1000);
        this.set1f('uFrequency', this._frequency);
        this.set1f('uAmplitude', this._amplitude);
    }

    get frequency() {
        return this._frequency;
    }

    set frequency(value) {
        this._frequency = value;
    }

    get amplitude() {
        return this._amplitude;
    }

    set amplitude(value) {
        this._amplitude = value;
    }
}
