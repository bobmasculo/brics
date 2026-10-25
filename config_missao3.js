
(function () {
    'use strict';

    // Inicializa o objeto global se não existir
    window.MISSIONS = window.MISSIONS || {};

    // Define a Missão 3
    window.MISSIONS['missao3'] = {
        playerCount: 5,
        mapImage: 'assets/mapa/chao.jpg',
        mapWidth: 15200, // Largura visual do mapa
            mapHeight: 12800, //
        OBJECTIVES: {
            missionName: "m3_name",
            timeLimit: 600000, // 10 minutos
            targetKills: 4, // Matar as 4 partes
            briefing: {
                text: "m3_briefing",
            },
        },
        MAP_OBJECTS: [],
        INTERIORS: [],
        NPCS: [
            {
                id: 'building_part_tl',
                texture: 'white_square',
                x: 1575, y: 875,
                width: 50, height: 50,
                bodyWidth: 50, bodyHeight: 50,
                isTarget: true,
                isImmovable: true,
                hp: 1000,
                level: 10,
                speed: 0,
                healthBasedTint: true,
                animationFrames: { morto: [] }
            },
            {
                id: 'building_part_tr',
                texture: 'white_square',
                x: 1625, y: 875,
                width: 50, height: 50,
                bodyWidth: 50, bodyHeight: 50,
                isTarget: true,
                isImmovable: true,
                hp: 1000,
                level: 10,
                speed: 0,
                healthBasedTint: true,
                animationFrames: { morto: [] }
            },
            {
                id: 'building_part_bl',
                texture: 'white_square',
                x: 1575, y: 925,
                width: 50, height: 50,
                bodyWidth: 50, bodyHeight: 50,
                isTarget: true,
                isImmovable: true,
                hp: 1000,
                level: 10,
                speed: 0,
                healthBasedTint: true,
                animationFrames: { morto: [] }
            },
            {
                id: 'building_part_br',
                texture: 'white_square',
                x: 1625, y: 925,
                width: 50, height: 50,
                bodyWidth: 50, bodyHeight: 50,
                isTarget: true,
                isImmovable: true,
                hp: 1000,
                level: 10,
                speed: 0,
                healthBasedTint: true,
                animationFrames: { morto: [] }
            }
        ]
    };
})();
