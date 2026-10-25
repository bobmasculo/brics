(function () {
    'use strict';

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
 
    const range = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

    // Animações padrão para agentes (Andar, Idle, Tiro, Morte)
     const AGENT_ANIMS = {
        down: [8, 9, 10, 11],
        left: [4, 5, 6, 7],
        right: [0, 1, 2, 3],
        up: [12, 13, 14, 15],
        shoot_down: [8, 19, 8, 19],
        shoot_left: [18, 4, 18, 4],
        shoot_right: [17, 1, 17, 1],
        shoot_up: [12, 12, 12, 12],
        shoot_up_left: [12, 12, 12, 12],
        shoot_up_right: [12, 12, 12, 12],
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

    // Inicializa o objeto global de missões se ainda não existir
    window.MISSIONS = window.MISSIONS || {};

    // Define a Missão 1
    window.MISSIONS['missao1'] = {
            playerCount: 3,
            mapImage: 'assets/cenario/mapa.png', 
            mapWidth: 3200, 
            mapHeight: 1800, 

            OBJECTIVES: {
                missionName: 'm1_name',
                timeLimit: 600000,
                dangerFactor: 100, 
                briefing: {
                    text: "m1_briefing",
                    
                },
                punishments: {
                    1: [
                        {
                            texture: 'npc_agente_8',
                            path: 'assets/npc/agente.png',
                            width: 128, height: 128, scale: 0.6,
                            isRanged: true,
                            level: 10, speed: 40,
                            visionRadius: 6000000, attackRadius: 20, isRanged: true,
                            projectileSpeed: 800,
                            animationFrames: AGENT_ANIMS,
                            ...PROJECTILE_OPTS,
                            ...BODY_OPTS
                        }
                    ],
                    2: [
                        {
                            texture: 'npc_agente_8',
                            path: 'assets/npc/agente.png',
                            width: 128, height: 128, scale: 0.6,
                            level: 10, speed: 70,
                            visionRadius: 6000000, attackRadius: 200, isRanged: true,
                            projectileSpeed: 800,
                            shootType: 'game_feel',
                            projectileTexture: 'plasma_bullet',
                            projectileScale: 0.18,
                            projectileRotation: -1.57,
                            muzzleFlash: {
                                texture: 'flash_texture',
                                scale: 0.15,
                                rotation: -1.57
                            },
                            animationFrames: AGENT_ANIMS,
                            ...BODY_OPTS
                        },
                        {
                            texture: 'npc_agente_8',
                            path: 'assets/npc/agente.png',
                            width: 128, height: 128, scale: 0.6,
                            level: 12, speed: 70,
                            visionRadius: 60000, attackRadius: 200, isRanged: true,
                            shootType: 'game_feel',
                            projectileTexture: 'plasma_bullet',
                            projectileScale: 0.18,
                            projectileRotation: -1.57,
                            muzzleFlash: {
                                texture: 'flash_texture',
                                scale: 0.15,
                                rotation: -1.57
                            },
                            animationFrames: AGENT_ANIMS,
                            ...BODY_OPTS
                        }
                    ],
                    'default': [
                        {
                            texture: 'npc_agente_8',
                            path: 'assets/npc/agente.png',
                            width: 128, height: 128, scale: 0.6,
                            level: 15, speed: 70,
                            visionRadius: 20000, attackRadius: 200, isRanged: true,
                            shootType: 'game_feel',
                            projectileTexture: 'plasma_bullet',
                            projectileScale: 0.18,
                            projectileRotation: -1.57,
                            muzzleFlash: {
                                texture: 'flash_texture',
                                scale: 0.15,
                                rotation: -1.57
                            },
                            animationFrames: AGENT_ANIMS,
                            ...BODY_OPTS
                        },
                        {
                            texture: 'npc_agente_8',
                            path: 'assets/npc/agente.png',
                            width: 128, height: 128, scale: 0.6,
                            level: 15, speed: 70,
                            visionRadius: 7000, attackRadius: 200, isRanged: true,
                            shootType: 'game_feel',
                            projectileTexture: 'plasma_bullet',
                            projectileScale: 0.18,
                            projectileRotation: -1.57,
                            muzzleFlash: {
                                texture: 'flash_texture',
                                scale: 0.15,
                                rotation: -1.57
                            },
                            animationFrames: AGENT_ANIMS,
                            ...BODY_OPTS
                        },
                        {
                            texture: 'npc_agente_8',
                            path: 'assets/npc/agente.png',
                            width: 128, height: 128, scale: 0.6,
                            level: 15, speed: 70,
                            visionRadius: 7000, attackRadius: 200, isRanged: true,
                            shootType: 'game_feel',
                            projectileTexture: 'plasma_bullet',
                            projectileScale: 0.18,
                            projectileRotation: -1.57,
                            muzzleFlash: {
                                texture: 'flash_texture',
                                scale: 0.15,
                                rotation: -1.57
                            },
                            animationFrames: AGENT_ANIMS,
                            ...BODY_OPTS
                        }
                    ]
                },
                steps: [

                    {
                        instruction: "m1_step1",
                        sound: 'mission1_quest1',
                        talkToNpc: 'informante'
                    },
                    {
                        instruction: "m1_step2",
                        sound: 'mission1_quest2',
                        targetKills: 3,
                        spawnNpcs: [
                            {
                                id: 'guarda_d_pimp_1',
                                groupId: 'guarda_a_pimp',
                                x: 45, y: 703,
                                isRanged: true,
                                texture: 'npc_agente_cyber_3_cima', // MUDADO: Agora tem sua própria textura
                                path: 'assets/npc/cyberguarda.png',
                                frameWidth: 128,
                                frameHeight: 128,
                                level: 7,
                                scale: 0.6,
                                animationFrames: AGENT_ANIMS,
                                ...BODY_OPTS

                            },
                            {
                                id: 'guarda_d_pimp_2',
                                groupId: 'guarda_a_pimp',
                                x: 135, y: 703,
                                isRanged: true,
                                texture: 'npc_agente_cyber_3_cima', // MUDADO: Agora tem sua própria textura
                                path: 'assets/npc/cyberguarda.png',
                                frameWidth: 128,
                                frameHeight: 128,
                                level: 7,
                                scale: 0.6,
                                animationFrames: AGENT_ANIMS,
                                ...BODY_OPTS

                            },
                            {
                                id: 'guarda_d_pimp_3',
                                groupId: 'guarda_a_pimp',
                                x: 210, y: 703,
                                isRanged: true,
                                texture: 'npc_agente_cyber_3_cima', // MUDADO: Agora tem sua própria textura
                                path: 'assets/npc/cyberguarda.png',
                                frameWidth: 128,
                                frameHeight: 128,
                                level: 7,
                                scale: 0.6,
                                animationFrames: AGENT_ANIMS,
                                ...BODY_OPTS

                            },
                        ]
                    },
                    
                    {
                        instruction: "m1_step3",
                        sound: 'mission1_quest3',
                        targetKills: 5
                        
                    },
                    
                    {
                        instruction: "m1_step4",
                         sound: 'mission1_quest4',
                        targetId: ['Papilium', 'Hawk'],
                        targetKills: 0
                    },
                    {
                        instruction: "m1_step5",
                        sound: 'mission1_quest5',
                        targetId: ['Mario', 'Luigui', 'Roberto'],
                        spawnNpcs: [
                            {
                                id: 'Mario',
                                x: 120,
                                y: 585,
                                texture: 'Mario_texto', path: 'assets/npc/Traidores/traidor.png',
                                isTarget: true,
                                isRanged: true,
                                scale: 0.7,
                                shootType: 'game_feel',
                                projectileTexture: 'plasma_bullet',
                                projectileScale: 0.28,
                                projectileRotation: -1.57,
                                muzzleFlash: {
                                    texture: 'flash_texture',
                                    scale: 0.15,
                                    rotation: -1.57
                                },
                                width: 128, height: 128, level: 45, speed: 40,
                                visionRadius: 1500000, attackRadius: 150,
                                animationFrames: {
                                    down: range(14,17),
                                    left: range(7,13),
                                    right: range(0,6), 
                                    up: range(18,21),
                                    shoot_down: range(14,17),
                                    shoot_left: range(33,42),
                                    shoot_right: range(23,32), 
                                    shoot_up: range(18,21),
                                    morto: [22]
                                },
                                waypoints: [{ x: 135, y: 570 }, { x: 105, y: 405 }, { x: 455, y: 185 }, { x: 520, y: 150 }, { x: 875, y: 535 }, { x: 670, y: 695 }, { x: 460, y: 805 }, { x: 225, y: 675 }]
                            },
                            {
                                id: 'Luigui',
                                x: 1770,
                                y: 295,
                                isTarget: true,
                                isRanged: true,
                                shootType: 'game_feel',
                                projectileTexture: 'plasma_bullet',
                                projectileScale: 0.18,
                                projectileRotation: -1.57,
                                muzzleFlash: {
                                    texture: 'flash_texture',
                                    scale: 0.15,
                                    rotation: -1.57
                                },
                                texture: 'Pedro_texto', path: 'assets/npc/Traidores/traidor2.png',
                                width: 128, height: 128, level: 48, speed: 40,
                                scale:0.7,
                                visionRadius: 15000, attackRadius: 150,
                                animationFrames: {
                                    down: range(14,17),
                                    left: range(7,13),
                                    right: range(0,6), 
                                    up: range(18,21),
                                    shoot_down: range(14,17),
                                    shoot_left: range(33,42),
                                    shoot_right: range(23,32), 
                                    shoot_up: range(18,21),
                                    morto: [22]
                                },
                                waypoints: [{ x: 1770, y: 295 }, { x: 1580, y: 465 }, { x: 1355, y: 610 }, { x: 1075, y: 735 }, { x: 820, y: 855 }, { x: 735, y: 925 }, { x: 1265, y: 665 }, { x: 1475, y: 565 }, { x: 1640, y: 455 }, { x: 1760, y: 380 }]
                            },
                            {
                                id: 'Roberto',
                                x: 1625,
                                y: 800,
                                isRanged: true,
                                isTarget: true,
                                shootType: 'game_feel',
                                projectileTexture: 'plasma_bullet',
                                projectileScale: 0.28,
                                projectileRotation: -1.57,
                                muzzleFlash: {
                                    texture: 'flash_texture',
                                    scale: 0.15,
                                    rotation: -1.57
                                },
                                texture: 'Luisa_texto', path: 'assets/npc/Traidores/traidor3.png',
                                width: 128, height: 128, level: 50, speed: 40, scale: 0.7,
                                visionRadius: 15000, attackRadius: 100,
                                 animationFrames: {
                                    down: range(14,17),
                                    left: range(7,13),
                                    right: range(0,6), 
                                    up: range(18,21),
                                    shoot_down: range(14,17),
                                    shoot_left: range(33,42),
                                    shoot_right: range(23,32), 
                                    shoot_up: range(18,21),
                                    morto: [22]
                                },
                                waypoints: [{ x: 1625, y: 800 }, { x: 1530, y: 680 }, { x: 1470, y: 605 }, { x: 1405, y: 520 }, { x: 1350, y: 460 }, { x: 1285, y: 380 }, { x: 1195, y: 280 }, { x: 1100, y: 165 }, { x: 1060, y: 110 }, { x: 1230, y: 335 }, { x: 1315, y: 425 }, { x: 1430, y: 570 }, { x: 1500, y: 660 }, { x: 1560, y: 735 }, { x: 1575, y: 765 }]
                            },

                        ],
                    },


                    {
                        instruction: "m1_step6",
                        talkToNpc: 'JEM'
                    }
                ]
            },
            MAP_OBJECTS: [
                { 
                    id: 'BLOCK', 
                    tipo: 'obstaculo', 
                    x: 700, 
                    y: 1065, 
                    width: 575, 
                    height: 235, 
                    angle: 0,
                    
                },
                {
                    id: 'BLOCK', 
                    tipo: 'obstaculo',
                    type: 'fromVertices',
                    x: 1150,
                    y: 1150,
                    vertsScale: 1.5,
                    verts: [{"x":-27,"y":-27},{"x":-102,"y":-67},{"x":-132,"y":-32}],
                    smoke: {
                        enabled: true,
                        offset: { x: 0, y: 0 }, // Ajuste para sair de cima do prédio
                        color: 0x222222, // Cor da fumaça (Ex: Cinza Escuro)
                        frequency: 150, // Intervalo de emissão (menor = mais fumaça)
                        scale: { start: 1.3, end: 1.5 }, // Fumaça cresce bastante
                        light: {
                            enabled: true,
                            color: 0xff4400, // Laranja fogo
                            radius: 45,
                            intensity: 0.2
                        }
                    }
                },
                { 
                    id: 'BLOCK',
                    tipo: 'obstaculo', 
                    x: 670, 
                    y: 900, 
                    width: 245, 
                    height: 105, 
                    angle: 0,
                    smoke: {
                        enabled: true,
                        offset: { x: 0, y: 0 }, // Ajuste para sair de cima do prédio
                        frequency: 150, // Intervalo de emissão (menor = mais fumaça)
                        scale: { start: 1.0, end: 1.0 } // Fumaça cresce bastante
                    } 
                     
                   
                },
                { 
                    id: 'BLOCK',
                    tipo: 'obstaculo', 
                    x: 850, 
                    y: 1170, 
                    width: 400, 
                    height: 105, 
                    angle: 0,
                     smoke: {
                        enabled: true,
                        offset: { x: 150, y: -50 }, // Ajuste para sair de cima do prédio
                        frequency: 100, // Intervalo de emissão (menor = mais fumaça)
                        scale: { start: 1.0, end: 2.0 } // Fumaça cresce bastante
                    } 
                },
                { 
                    id: 'BLOCK', 
                    tipo: 'obstaculo', 
                    x: 2245, 
                    y: 560, 
                    width: 100, 
                    height: 50, 
                    angle: 0,
                     smoke: {
                        enabled: true,
                        offset: { x: 150, y: -50 }, // Ajuste para sair de cima do prédio
                        frequency: 100, // Intervalo de emissão (menor = mais fumaça)
                        scale: { start: 1.0, end: 2.0 } // Fumaça cresce bastante
                    }  
                },
                { 
                    id: 'BLOCK', 
                    tipo: 'obstaculo', 
                    x: 2290, 
                    y: 610, 
                    width: 100, 
                    height: 50, 
                    angle: 0,
                    smoke: {
                        enabled: true,
                        offset: { x: 0, y: 0 }, // Ajuste para sair de cima do prédio
                        color: 0x222222, // Cor da fumaça (Ex: Cinza Escuro)
                        frequency: 150, // Intervalo de emissão (menor = mais fumaça)
                        scale: { start: 1.3, end: 1.5 }, // Fumaça cresce bastante
                        light: {
                            enabled: true,
                            color: 0xff4400, // Laranja fogo
                            radius: 45,
                            intensity: 0.2
                        }
                    } 
                },
                { 
                    id: 'BLOCK', 
                    tipo: 'obstaculo', 
                    x: 2420, 
                    y: 690, 
                    width: 100, 
                    height: 50, 
                    angle: 0,
                    smoke: {
                        enabled: true,
                        offset: { x: 0, y: 0 }, // Ajuste para sair de cima do prédio
                        color: 0x222222, // Cor da fumaça (Ex: Cinza Escuro)
                        frequency: 150, // Intervalo de emissão (menor = mais fumaça)
                        scale: { start: 1.3, end: 1.5 }, // Fumaça cresce bastante
                        light: {
                            enabled: true,
                            color: 0xff4400, // Laranja fogo
                            radius: 45,
                            intensity: 0.2
                        }
                    }  
                },
                
                
                

            ],
            INTERIORS: [

            ],
            INFO_NPCS: [
                {
                    id: 'JEM',
                    x: 411,
                    y: 1310,
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
                    message: "m1_npc_jem_msg",
                    triggerMissionUpdate: null,
                    completionMessage: "m1_npc_jem_end",
                    
                },
                {
                    id: 'Vendor',
                    x: 590,
                    y: 1500,
                    texture: 'npc_vendor', 
                    path: 'assets/npc/VENDOR.png',
                    width: 256,
                    height: 256,
                    level: 1,
                    speed: 0, 
                    scale: 1.0,
                    
                    animationFrames: {
                        down: [0,1,2,3,4],
                        left: [0,1,2,3,4],
                        right: [0,1,2,3,4],
                        up: [0,1,2,3,4],
                        idle_down: [0,1,2,3,4],
                        idle_left: [0,1,2,3,4],
                        idle_right: [0,1,2,3,4],
                        idle_up: [0,1,2,3,4]
                    },
                    vendor: {
                        items: [
                            { key: 'medkit', price: 10 },
                            { key: 'reviver', price: 10 }
                        ]
                    }
                },
                {
                    id: 'informante', // Novo NPC da missão
                    x: 100, 
                    y: 420, 
                    texture: 'pimp_nfo',
                    path: 'assets/npc/INFORMANTE.png',
                    width: 128,
                    giveItem: 'documento', // <--- O informante agora dá o documento
                    height: 128,
                    scale: 0.6,
                    level: 1,
                    speed: 0,
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
                    message: "m1_npc_info_msg",
                    completionMessage: "m1_npc_info_end",
                    triggerMissionUpdate: 1,
                    

                }
            ],
            NPCS: window.mission1NPCs || []
    };
    
})();
