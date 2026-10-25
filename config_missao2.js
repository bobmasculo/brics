(function () {
    'use strict';

    // Constantes necessárias para a Missão 2
    const torre_beam_x = 0;
    const torre_beam_y = -60;
    
    const pedestres = {
        down: [8, 9, 10, 11],
        left: [4, 5, 6, 7],
        right: [0, 1, 2, 3],
        up: [12, 13, 14, 15],
        idle_down: [8],
        idle_left: [4],
        idle_right: [0],
        idle_up: [12],
        morto: [16]
    };

    const BODY_OPTS_CIVIL = {
        bodyWidth: 72,
        bodyHeight: 132,
        bodyOffset: { x: 28, y: 10 }
    };

    const AGENT_ANIMS = {
        down: [8, 9, 10, 11],
        left: [4, 5, 6, 7],
        right: [0, 1, 2, 3],
        up: [12, 13, 14, 15],
        shoot_down: [8, 19, 8, 19],
        shoot_left: [18, 4, 18, 4],
        shoot_right: [17, 1, 17, 1],
        shoot_up: [12, 12, 12, 12],
        morto: [16]
    };

    const BODY_OPTS = {
        bodyWidth: 32,
        bodyHeight: 72,
        bodyOffset: { x: 48, y: 40 }
    };

    const PROJECTILE_OPTS = {
        shootType: 'game_feel',
        projectileTexture: 'plasma_bullet',
        projectileScale: 0.18,
        projectileRotation: -1.57,
        muzzleFlash: {
            texture: 'flash_texture',
            scale: 0.15,
            rotation: -1.57
        }
    };

    // Inicializa o objeto global se não existir
    window.MISSIONS = window.MISSIONS || {};

    // Define a Missão 2
    window.MISSIONS['missao2'] = {
        playerCount: 3,
        mapImage: 'assets/tmp/mapa.png',
        OBJECTIVES: {
            missionName: 'm2_name',
            punishments: {
                1: [
                    {
                        texture: 'npc_agente_torre',
                        path: 'assets/npc/agente.png',
                        width: 128, height: 128, scale: 0.6,
                        isRanged: true,
                        level: 15, speed: 40,
                        visionRadius: 6000000, attackRadius: 20, isRanged: true,
                        projectileSpeed: 800,
                        animationFrames: AGENT_ANIMS,
                        ...PROJECTILE_OPTS,
                        ...BODY_OPTS
                    }
                ],
                2: [
                    {
                        texture: 'npc_agente_torre_2',
                        path: 'assets/npc/agente.png',
                        width: 128, height: 128, scale: 0.6,
                        level: 15, speed: 40,
                        visionRadius: 20000, attackRadius: 200, isRanged: true,
                        projectileSpeed: 800,
                        animationFrames: AGENT_ANIMS,
                        ...PROJECTILE_OPTS,
                        ...BODY_OPTS
                    },
                    {
                        texture: 'npc_agente_torre_3',
                        path: 'assets/npc/agente.png',
                        width: 128, height: 128, scale: 0.6,
                        level: 15, speed: 40,
                        visionRadius: 20000, attackRadius: 200, isRanged: true,
                        projectileSpeed: 800,
                        animationFrames: AGENT_ANIMS,
                        ...PROJECTILE_OPTS,
                        ...BODY_OPTS
                    }
                ],
                'default': [
                    {
                        texture: 'npc_agente_torre_2',
                        path: 'assets/npc/agente.png',
                        width: 128, height: 128, scale: 0.6,
                        level: 25, speed: 40,
                        visionRadius: 20000, attackRadius: 200, isRanged: true,
                        projectileSpeed: 800,
                        animationFrames: AGENT_ANIMS,
                        ...PROJECTILE_OPTS,
                        ...BODY_OPTS
                    },
                    {
                        texture: 'npc_agente_torre_3',
                        path: 'assets/npc/agente.png',
                        width: 128, height: 128, scale: 0.6,
                        level: 25, speed: 40,
                        visionRadius: 20000, attackRadius: 200, isRanged: true,
                        projectileSpeed: 800,
                        animationFrames: AGENT_ANIMS,
                        ...PROJECTILE_OPTS,
                        ...BODY_OPTS
                    },
                    {
                        texture: 'npc_agente_torre_3',
                        path: 'assets/npc/agente.png',
                        width: 128, height: 128, scale: 0.6,
                        level: 55, speed: 40,
                        visionRadius: 20000, attackRadius: 200, isRanged: true,
                        projectileSpeed: 800,
                        animationFrames: AGENT_ANIMS,
                        ...PROJECTILE_OPTS,
                        ...BODY_OPTS
                    }
                ]
            },
            steps: [
                {
                    instruction: "m2_step_shield",
                    targetId: ['soldado_torre_1'],
                    targetKills: 0
                },
                {
                    instruction: "m2_step_destroy",
                    targetId: ['torre_1'],
                    targetKills: 0
                },
                {
                    instruction: "m2_step_shield",
                    targetId: ['Mario'],
                    spawnNpcs: [
                        {
                            id: 'Mario',
                            x: 885, 
                            y: 375, 
                            texture: 'Mario_texto', path: 'assets/npc/pedestres/PED1_15.png',
                            isTarget: true,
                            isRanged: true,
                            ...PROJECTILE_OPTS,
                            scale: 0.7,
                            width: 128, height: 128, level: 20, speed: 40,
                            visionRadius: 150, attackRadius: 150,
                            animationFrames: pedestres,
                                ...BODY_OPTS_CIVIL
                        }
                    ]
                },
                {
                    instruction: "m2_step_destroy",
                    targetId: ['torre_2'],
                    targetKills: 0
                },
                {
                    instruction: "m2_step_shield",
                    targetId: ['PEDRO'],
                    spawnNpcs: [
                        {
                            id: 'PEDRO',
                            x: 1210, 
                            y: 115, 
                            texture: 'Mario_texto', path: 'assets/npc/pedestres/PED1_2.png',
                            isTarget: true,
                            isRanged: true,
                            ...PROJECTILE_OPTS,
                            scale:0.7,
                            width: 128, height:128, level: 25, speed: 40,
                            visionRadius: 150, attackRadius: 150,
                                animationFrames: pedestres,
                                ...BODY_OPTS_CIVIL
                        }
                    ]
                },
                {
                    instruction: "m2_step_destroy",
                    targetId: ['torre_3'],
                    targetKills: 0
                },
                {
                    instruction: "m2_step_shield",
                    targetId: ['Luiz'],
                    spawnNpcs: [
                        {
                            id: 'Luiz',
                            x: 2105, 
                            y: 410, 
                            isTarget: true,
                            isRanged: true,
                            ...PROJECTILE_OPTS,
                            scale:0.7,
                            width: 128, height: 128, level: 30, speed: 40,
                            visionRadius: 150, attackRadius: 150,
                            texture: 'Luiz_texto', path: 'assets/npc/pedestres/PED1_2.png',
                                animationFrames: pedestres,
                                ...BODY_OPTS_CIVIL
                        }
                    ]
                },
                {
                    instruction: "m2_step_destroy",
                    targetId: ['torre_4'],
                    targetKills: 0
                },
                {
                    instruction: "m2_step_extract",
                    extractionPoint: { x: 965, y: 610, radius: 50 }
                },
                {
                    visualTimer: 180000,
                    timerLabel: "",
                    showObjective: false
                },
                {
                    instruction: "m2_ambush",
                    survivalTime: 45000,
                    hideTimer: true,
                    keepNpcsAliveAfterSurvival: true,
                    respawnInterval: 1000,
                    spawnNpcs: []
                },
                {
                    instruction: "m2_ambush",
                    survivalTime: 45000,
                    hideTimer: true,
                    keepNpcsAliveAfterSurvival: true,
                    respawnInterval: 1000,
                    spawnNpcs: []
                },
                {
                    instruction: "m2_ambush", 
                    survivalTime: 45000,
                    hideTimer: true,
                    respawnInterval: 1000,
                    spawnNpcs: []
                },
                {
                    instruction: "m2_ambush",
                    survivalTime: 45000,
                    hideTimer: true,
                    respawnInterval: 1000,
                    spawnNpcs: []
                },
            ]
        },
        MAP_OBJECTS: [
            {
                id: 'portal',
                tipo: 'cenario',
                x: 1600,
                y: 680,
                width: 220,
                height: 220
            }
        ],
        INTERIORS: [
            {
                id: 'portal',
                tipo: 'cenario',
                x: 1600,
                y: 680,
                width: 120,  
                height: 120,
                inside: {
                    spawnX: 4000,
                    spawnY: 4000,
                    width: 500,
                    height: 500,
                    exitX: 4000,
                    exitY: 4200,
                    floor: 'chao_interior',
                }
            }
        ],
        INFO_NPCS: [
                {
                id: 'JEM',
                x: 380,
                y: 930,
                texture: 'npc_jem', 
                path: 'assets/npc/JEN.png',
                width: 128,
                height: 128,
                level: 1,
                speed: 0, 
                scale: 0.6,
                animationFrames: {
                    down: [0,1,2],
                    left: [0,1,2],
                    right: [0,1,2],
                    up: [0,1,2],
                    idle_down: [0,1,2],
                    idle_left: [0,1,2],
                    idle_right: [0,1,2],
                    idle_up: [0,1,2]
                },
                message: "",
                triggerMissionUpdate: null,
                completionMessage: "Excelente! Você conseguiu as informações e garantiu a extração.\nVamos sair daqui!",
            },
        ],
        NPCS: [
            // (Omitindo detalhes repetitivos das torres para brevidade do diff, mas eles estarão aqui como no original)
            { id: 'torre_1', x: 1043, y: 550, isTarget: true, isImmovable: true, isInvulnerable: true, isRanged: true, triggersPunishment: true, shootType: 'beam', beamOffsetX: torre_beam_x, beamOffsetY: torre_beam_y, projectileSpeed: 1350, level: 5, texture: 'torre', path: 'assets/torres/torre.png', width: 128, height: 128, scale: 1.4, speed: 0, attackRadius: 600, animationFrames: { down: [0], left: [0], right: [0], up: [0], idle: [0], idle_down: [0], idle_left: [0], idle_right: [0], idle_up: [0], morto: [0,1,2,3,4] }, waypoints: [] },
            { id: 'torre_2', x: 1401, y: 195, isTarget: true, isImmovable: true, isInvulnerable: true, isRanged: true, triggersPunishment: true, shootType: 'beam', beamOffsetX: torre_beam_x, beamOffsetY: torre_beam_y, projectileSpeed: 1350, level: 5, texture: 'torre_2', path: 'assets/torres/torre.png', width: 128, height: 128, scale: 1.4, speed: 0, attackRadius: 400, animationFrames: { down: [0], left: [0], right: [0], up: [0], idle: [0], idle_down: [0], idle_left: [0], idle_right: [0], idle_up: [0], morto: [0,1,2,3,4] }, waypoints: [] },
            { id: 'torre_3', x: 1854, y: 195, isTarget: true, isImmovable: true, isInvulnerable: true, isRanged: true, triggersPunishment: true, shootType: 'beam', beamOffsetX: torre_beam_x, beamOffsetY: torre_beam_y, projectileSpeed: 1350, level: 5, texture: 'torre_3', path: 'assets/torres/torre.png', width: 128, height: 128, scale: 1.4, speed: 0, attackRadius: 400, animationFrames: { down: [0], left: [0], right: [0], up: [0], idle: [0], idle_down: [0], idle_left: [0], idle_right: [0], idle_up: [0], morto: [0,1,2,3,4] }, waypoints: [] },
            { id: 'torre_4', x: 2190, y: 540, isTarget: true, isImmovable: true, isInvulnerable: true, isRanged: true, triggersPunishment: true, shootType: 'beam', beamOffsetX: torre_beam_x, beamOffsetY: torre_beam_y, projectileSpeed: 350, level: 25, texture: 'torre_4', path: 'assets/torres/torre.png', width: 128, height: 128, scale: 1.4, speed: 0, attackRadius: 600, animationFrames: { down: [0], left: [0], right: [0], up: [0], idle: [0], idle_down: [0], idle_left: [0], idle_right: [0], idle_up: [0], morto: [0,1,2,3,4] }, waypoints: [] },
            { id: 'soldado_torre_1', x: 4100, y: 4100, isTarget: true, unlocks: 'torre_1', isRanged: true, ...PROJECTILE_OPTS, level: 5, texture: 'soldado_torre_1', width: 128, height: 128, scale: 0.7, speed: 0, attackRadius: 250, visionRadius: 150, texture: 'Luiz_texto', path: 'assets/npc/pedestres/PED1_2.png', animationFrames: pedestres, ...BODY_OPTS_CIVIL, waypoints: [{ x: 1770, y: 65 }, { x: 1790, y: 250 }, { x: 1645, y: 240 }, { x: 1580, y: 120 }, { x: 1510, y: 145 }, { x: 1300, y: 55 }, { x: 1315, y: 245 }, { x: 1500, y: 490 }, { x: 1525, y: 580 }, { x: 1740, y: 585 }, { x: 1805, y: 425 }, { x: 1830, y: 285 }] }
        ]
    };
})();