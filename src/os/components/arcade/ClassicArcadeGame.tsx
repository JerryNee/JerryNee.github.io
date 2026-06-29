import React, { useCallback, useEffect, useRef, useState } from 'react';

export type ArcadeKind = 'platform' | 'maze' | 'barrel';

interface ClassicArcadeGameProps {
    kind: ArcadeKind;
    title: string;
    width: number;
    height: number;
}

type GameStatus = 'playing' | 'won' | 'lost';

interface GameDisplay {
    score: number;
    lives: number;
    status: GameStatus;
    message: string;
}

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 420;

const CONTROL_TEXT =
    'Arrows/WASD move. Space jumps or restarts. Original mini-game, classic arcade inspired.';

const defaultDisplay: GameDisplay = {
    score: 0,
    lives: 3,
    status: 'playing',
    message: 'Ready',
};

type KeyState = Record<string, boolean>;

type PlatformState = ReturnType<typeof createPlatformState>;
type MazeState = ReturnType<typeof createMazeState>;
type BarrelState = ReturnType<typeof createBarrelState>;
type ArcadeState = PlatformState | MazeState | BarrelState;

const isLeft = (keys: KeyState) => keys.ArrowLeft || keys.KeyA;
const isRight = (keys: KeyState) => keys.ArrowRight || keys.KeyD;
const isUp = (keys: KeyState) => keys.ArrowUp || keys.KeyW;
const isDown = (keys: KeyState) => keys.ArrowDown || keys.KeyS;
const isJump = (keys: KeyState) => keys.Space || keys.KeyK || keys.KeyX;

function createPlatformState() {
    return {
        kind: 'platform' as const,
        score: 0,
        lives: 3,
        status: 'playing' as GameStatus,
        message: 'Collect chips and reach the flag.',
        player: { x: 44, y: 320, vx: 0, vy: 0, onGround: false },
        coins: [
            { x: 150, y: 284, got: false },
            { x: 260, y: 230, got: false },
            { x: 382, y: 180, got: false },
            { x: 502, y: 126, got: false },
        ],
        enemies: [
            { x: 315, y: 312, vx: 1.25, min: 245, max: 390 },
            { x: 460, y: 206, vx: -1.15, min: 392, max: 530 },
        ],
    };
}

function createMazeState() {
    const pellets = new Set<string>();
    mazeRows.forEach((row, r) => {
        row.split('').forEach((cell, c) => {
            if (cell === '.') pellets.add(`${r},${c}`);
        });
    });
    return {
        kind: 'maze' as const,
        score: 0,
        lives: 3,
        status: 'playing' as GameStatus,
        message: 'Clear the maze before the ghosts catch you.',
        player: { r: 7, c: 1 },
        ghosts: [
            { r: 1, c: 17, color: '#ff5b78' },
            { r: 13, c: 17, color: '#48e0ff' },
            { r: 1, c: 1, color: '#ff9b33' },
        ],
        pellets,
        tick: 0,
        accumulator: 0,
    };
}

function createBarrelState() {
    return {
        kind: 'barrel' as const,
        score: 0,
        lives: 3,
        status: 'playing' as GameStatus,
        message: 'Climb ladders, dodge barrels, reach the console.',
        player: { x: 78, y: 340, vx: 0, vy: 0, onGround: false },
        barrels: [] as Array<{ x: number; y: number; vx: number; level: number }>,
        spawnTimer: 0,
    };
}

function createState(kind: ArcadeKind): ArcadeState {
    if (kind === 'platform') return createPlatformState();
    if (kind === 'maze') return createMazeState();
    return createBarrelState();
}

function displayFromState(state: ArcadeState): GameDisplay {
    return {
        score: state.score,
        lives: state.lives,
        status: state.status,
        message: state.message,
    };
}

const platformRects = [
    { x: 0, y: 382, w: 640, h: 38 },
    { x: 104, y: 326, w: 132, h: 16 },
    { x: 236, y: 272, w: 132, h: 16 },
    { x: 390, y: 220, w: 150, h: 16 },
    { x: 150, y: 170, w: 120, h: 16 },
    { x: 450, y: 142, w: 120, h: 16 },
];

const mazeRows = [
    '###################',
    '#........#........#',
    '#.###.##.#.##.###.#',
    '#.#.............#.#',
    '#.#.##.#####.##.#.#',
    '#.....#...#...#...#',
    '#####.#.#.#.#.#.###',
    '#.................#',
    '###.#.#.#.#.#.#####',
    '#...#...#...#.....#',
    '#.#.##.#####.##.#.#',
    '#.#.............#.#',
    '#.###.##.#.##.###.#',
    '#........#........#',
    '###################',
];

const barrelPlatforms = [
    { x: 54, y: 366, w: 530 },
    { x: 88, y: 304, w: 500 },
    { x: 54, y: 242, w: 510 },
    { x: 96, y: 180, w: 492 },
    { x: 54, y: 118, w: 510 },
];

const ladders = [
    { x: 142, top: 304, bottom: 366 },
    { x: 500, top: 242, bottom: 304 },
    { x: 178, top: 180, bottom: 242 },
    { x: 462, top: 118, bottom: 180 },
];

function updatePlatform(state: PlatformState, keys: KeyState) {
    if (state.status !== 'playing') return;

    const player = state.player;
    const previousY = player.y;
    player.vx = (isRight(keys) ? 2.4 : 0) - (isLeft(keys) ? 2.4 : 0);
    if (isJump(keys) && player.onGround) {
        player.vy = -9;
        player.onGround = false;
    }

    player.vy += 0.45;
    player.x += player.vx;
    player.y += player.vy;
    player.onGround = false;

    platformRects.forEach((platform) => {
        const wasAbove = previousY + 24 <= platform.y;
        const nowHits = player.y + 24 >= platform.y && player.y <= platform.y;
        const overlaps = player.x + 18 > platform.x && player.x < platform.x + platform.w;
        if (wasAbove && nowHits && overlaps && player.vy >= 0) {
            player.y = platform.y - 24;
            player.vy = 0;
            player.onGround = true;
        }
    });

    player.x = Math.max(8, Math.min(CANVAS_WIDTH - 26, player.x));
    if (player.y > CANVAS_HEIGHT + 20) loseLife(state, () => {
        player.x = 44;
        player.y = 320;
        player.vx = 0;
        player.vy = 0;
    });

    state.enemies.forEach((enemy) => {
        enemy.x += enemy.vx;
        if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
        if (Math.abs(player.x - enemy.x) < 22 && Math.abs(player.y - enemy.y) < 24) {
            loseLife(state, () => {
                player.x = 44;
                player.y = 320;
                player.vy = 0;
            });
        }
    });

    state.coins.forEach((coin) => {
        if (!coin.got && Math.abs(player.x - coin.x) < 20 && Math.abs(player.y - coin.y) < 24) {
            coin.got = true;
            state.score += 100;
        }
    });

    if (player.x > 548 && player.y < 154) {
        state.status = 'won';
        state.message = 'Flag reached. Space to replay.';
        state.score += state.coins.filter((coin) => coin.got).length * 25;
    }
}

function updateMaze(state: MazeState, keys: KeyState, dt: number) {
    if (state.status !== 'playing') return;
    state.accumulator += dt;
    if (state.accumulator < 115) return;
    state.accumulator = 0;
    state.tick += 1;

    const playerMove = getGridMove(keys);
    if (playerMove) moveGridActor(state.player, playerMove.dr, playerMove.dc);

    const pelletKey = `${state.player.r},${state.player.c}`;
    if (state.pellets.delete(pelletKey)) state.score += 10;

    if (state.tick % 3 === 0) {
        state.ghosts.forEach((ghost) => {
            const choices = [
                { dr: -1, dc: 0 },
                { dr: 1, dc: 0 },
                { dr: 0, dc: -1 },
                { dr: 0, dc: 1 },
            ].filter((choice) => canMove(ghost.r + choice.dr, ghost.c + choice.dc));
            choices.sort((a, b) => {
                const da =
                    Math.abs(ghost.r + a.dr - state.player.r) +
                    Math.abs(ghost.c + a.dc - state.player.c);
                const db =
                    Math.abs(ghost.r + b.dr - state.player.r) +
                    Math.abs(ghost.c + b.dc - state.player.c);
                return da - db;
            });
            const move = choices[Math.floor(Math.random() * Math.min(2, choices.length))] || choices[0];
            if (move) moveGridActor(ghost, move.dr, move.dc);
        });
    }

    if (state.ghosts.some((ghost) => ghost.r === state.player.r && ghost.c === state.player.c)) {
        loseLife(state, () => {
            state.player.r = 7;
            state.player.c = 1;
            state.ghosts[0].r = 1;
            state.ghosts[0].c = 17;
            state.ghosts[1].r = 13;
            state.ghosts[1].c = 17;
            state.ghosts[2].r = 1;
            state.ghosts[2].c = 1;
        });
    }

    if (state.pellets.size === 0) {
        state.status = 'won';
        state.message = 'Maze cleared. Space to replay.';
        state.score += 500;
    }
}

function updateBarrel(state: BarrelState, keys: KeyState) {
    if (state.status !== 'playing') return;
    const player = state.player;
    const previousY = player.y;
    const nearLadder = ladders.find(
        (ladder) =>
            Math.abs(player.x - ladder.x) < 22 &&
            player.y + 24 >= ladder.top &&
            player.y <= ladder.bottom
    );

    player.vx = (isRight(keys) ? 2.2 : 0) - (isLeft(keys) ? 2.2 : 0);
    player.x += player.vx;

    if (nearLadder && isUp(keys)) {
        player.y -= 2.4;
        player.vy = 0;
        player.onGround = false;
    } else if (nearLadder && isDown(keys)) {
        player.y += 2.4;
        player.vy = 0;
        player.onGround = false;
    } else {
        if (isJump(keys) && player.onGround) {
            player.vy = -7.5;
            player.onGround = false;
        }
        player.vy += 0.38;
        player.y += player.vy;
    }

    player.onGround = false;
    barrelPlatforms.forEach((platform) => {
        const wasAbove = previousY + 24 <= platform.y;
        const nowHits = player.y + 24 >= platform.y && player.y <= platform.y + 8;
        const overlaps = player.x + 18 > platform.x && player.x < platform.x + platform.w;
        if (wasAbove && nowHits && overlaps && player.vy >= 0) {
            player.y = platform.y - 24;
            player.vy = 0;
            player.onGround = true;
        }
    });

    player.x = Math.max(36, Math.min(CANVAS_WIDTH - 36, player.x));
    if (player.y > CANVAS_HEIGHT + 20) loseLife(state, () => resetBarrelPlayer(state));

    state.spawnTimer += 1;
    if (state.spawnTimer > 95) {
        state.spawnTimer = 0;
        state.barrels.push({ x: 536, y: 92, vx: -2.2, level: 4 });
    }

    state.barrels.forEach((barrel) => {
        barrel.x += barrel.vx;
        const platform = barrelPlatforms[barrel.level];
        if (barrel.x < platform.x || barrel.x > platform.x + platform.w - 16) {
            if (barrel.level > 0) {
                barrel.level -= 1;
                const nextPlatform = barrelPlatforms[barrel.level];
                barrel.y = nextPlatform.y - 20;
                barrel.vx *= -1;
                barrel.x = Math.max(nextPlatform.x, Math.min(nextPlatform.x + nextPlatform.w - 16, barrel.x));
            } else {
                barrel.x = -100;
            }
        }
        if (Math.abs(player.x - barrel.x) < 22 && Math.abs(player.y - barrel.y) < 24) {
            loseLife(state, () => resetBarrelPlayer(state));
        }
    });
    state.barrels = state.barrels.filter((barrel) => barrel.x > -40);

    if (player.x < 112 && player.y < 118) {
        state.status = 'won';
        state.message = 'Console reached. Space to replay.';
        state.score += 750;
    }
}

function loseLife<T extends { lives: number; status: GameStatus; message: string }>(
    state: T,
    reset: () => void
) {
    state.lives -= 1;
    if (state.lives <= 0) {
        state.status = 'lost';
        state.message = 'Game over. Space to replay.';
    } else {
        state.message = `${state.lives} lives left. Keep going.`;
        reset();
    }
}

function resetBarrelPlayer(state: BarrelState) {
    state.player.x = 78;
    state.player.y = 340;
    state.player.vx = 0;
    state.player.vy = 0;
}

function getGridMove(keys: KeyState) {
    if (isLeft(keys)) return { dr: 0, dc: -1 };
    if (isRight(keys)) return { dr: 0, dc: 1 };
    if (isUp(keys)) return { dr: -1, dc: 0 };
    if (isDown(keys)) return { dr: 1, dc: 0 };
    return null;
}

function moveGridActor(actor: { r: number; c: number }, dr: number, dc: number) {
    const nextR = actor.r + dr;
    const nextC = actor.c + dc;
    if (canMove(nextR, nextC)) {
        actor.r = nextR;
        actor.c = nextC;
    }
}

function canMove(r: number, c: number) {
    return mazeRows[r]?.[c] !== '#';
}

function drawPixelText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    size = 14,
    color = '#ffffff'
) {
    ctx.font = `${size}px Terminal, monospace`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

function drawPlatform(ctx: CanvasRenderingContext2D, state: PlatformState) {
    ctx.fillStyle = '#68a8ff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#7bd56f';
    platformRects.forEach((platform) => ctx.fillRect(platform.x, platform.y, platform.w, platform.h));
    ctx.fillStyle = '#8b5630';
    platformRects.forEach((platform) => ctx.fillRect(platform.x, platform.y + platform.h - 5, platform.w, 5));

    ctx.fillStyle = '#fded62';
    state.coins.forEach((coin) => {
        if (!coin.got) {
            ctx.fillRect(coin.x - 5, coin.y - 8, 10, 16);
            ctx.fillStyle = '#ffb000';
            ctx.fillRect(coin.x - 2, coin.y - 5, 4, 10);
            ctx.fillStyle = '#fded62';
        }
    });

    ctx.fillStyle = '#d02626';
    state.enemies.forEach((enemy) => {
        ctx.fillRect(enemy.x, enemy.y + 8, 24, 16);
        ctx.fillRect(enemy.x + 4, enemy.y, 16, 10);
        ctx.fillStyle = '#111111';
        ctx.fillRect(enemy.x + 6, enemy.y + 8, 4, 4);
        ctx.fillRect(enemy.x + 15, enemy.y + 8, 4, 4);
        ctx.fillStyle = '#d02626';
    });

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(560, 68, 5, 74);
    ctx.fillStyle = '#2c42ff';
    ctx.fillRect(565, 68, 42, 24);

    drawPlayer(ctx, state.player.x, state.player.y, '#2550d8', '#ed4040');
    drawEndOverlay(ctx, state);
}

function drawMaze(ctx: CanvasRenderingContext2D, state: MazeState) {
    ctx.fillStyle = '#05020f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const cell = 22;
    const ox = 111;
    const oy = 44;

    mazeRows.forEach((row, r) => {
        row.split('').forEach((tile, c) => {
            const x = ox + c * cell;
            const y = oy + r * cell;
            if (tile === '#') {
                ctx.fillStyle = '#182ee6';
                ctx.fillRect(x, y, cell, cell);
                ctx.fillStyle = '#75c7ff';
                ctx.fillRect(x + 2, y + 2, cell - 4, 3);
            } else if (state.pellets.has(`${r},${c}`)) {
                ctx.fillStyle = '#ffe8aa';
                ctx.fillRect(x + 9, y + 9, 4, 4);
            }
        });
    });

    ctx.fillStyle = '#ffd447';
    ctx.beginPath();
    ctx.arc(ox + state.player.c * cell + 11, oy + state.player.r * cell + 11, 10, 0.2, Math.PI * 1.8);
    ctx.lineTo(ox + state.player.c * cell + 11, oy + state.player.r * cell + 11);
    ctx.fill();

    state.ghosts.forEach((ghost) => {
        const x = ox + ghost.c * cell + 3;
        const y = oy + ghost.r * cell + 3;
        ctx.fillStyle = ghost.color;
        ctx.fillRect(x, y + 6, 16, 12);
        ctx.fillRect(x + 2, y, 12, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4, y + 6, 3, 3);
        ctx.fillRect(x + 11, y + 6, 3, 3);
    });

    drawEndOverlay(ctx, state);
}

function drawBarrel(ctx: CanvasRenderingContext2D, state: BarrelState) {
    ctx.fillStyle = '#160d1f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    barrelPlatforms.forEach((platform, i) => {
        ctx.fillStyle = i % 2 === 0 ? '#d23a3a' : '#e35d3f';
        ctx.fillRect(platform.x, platform.y, platform.w, 12);
        ctx.fillStyle = '#ffb57a';
        for (let x = platform.x; x < platform.x + platform.w; x += 28) {
            ctx.fillRect(x, platform.y + 3, 14, 3);
        }
    });

    ctx.fillStyle = '#58d6ff';
    ladders.forEach((ladder) => {
        ctx.fillRect(ladder.x, ladder.top, 6, ladder.bottom - ladder.top + 12);
        ctx.fillRect(ladder.x + 22, ladder.top, 6, ladder.bottom - ladder.top + 12);
        for (let y = ladder.top + 8; y < ladder.bottom + 8; y += 16) {
            ctx.fillRect(ladder.x, y, 28, 4);
        }
    });

    ctx.fillStyle = '#fafafa';
    ctx.fillRect(76, 78, 54, 28);
    drawPixelText(ctx, 'AI', 88, 99, 18, '#111111');

    state.barrels.forEach((barrel) => {
        ctx.fillStyle = '#b65a25';
        ctx.fillRect(barrel.x, barrel.y, 20, 20);
        ctx.fillStyle = '#f6a04d';
        ctx.fillRect(barrel.x + 3, barrel.y + 4, 14, 3);
        ctx.fillRect(barrel.x + 3, barrel.y + 13, 14, 3);
    });

    drawPlayer(ctx, state.player.x, state.player.y, '#f0c33c', '#2f65ff');
    drawEndOverlay(ctx, state);
}

function drawPlayer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    shirt: string,
    hat: string
) {
    ctx.fillStyle = hat;
    ctx.fillRect(x + 4, y, 16, 7);
    ctx.fillStyle = '#f0b985';
    ctx.fillRect(x + 5, y + 7, 14, 10);
    ctx.fillStyle = shirt;
    ctx.fillRect(x + 3, y + 17, 18, 17);
    ctx.fillStyle = '#202020';
    ctx.fillRect(x + 3, y + 33, 7, 6);
    ctx.fillRect(x + 14, y + 33, 7, 6);
}

function drawEndOverlay(ctx: CanvasRenderingContext2D, state: ArcadeState) {
    if (state.status === 'playing') return;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(120, 130, 400, 130);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(120, 130, 400, 130);
    drawPixelText(ctx, state.status === 'won' ? 'STAGE CLEAR' : 'GAME OVER', 244, 178, 24);
    drawPixelText(ctx, 'Press Space or Restart', 222, 220, 18);
}

const ClassicArcadeGame: React.FC<ClassicArcadeGameProps> = ({
    kind,
    title,
    width,
    height,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const keysRef = useRef<KeyState>({});
    const stateRef = useRef<ArcadeState>(createState(kind));
    const [display, setDisplay] = useState<GameDisplay>(defaultDisplay);
    const [restartKey, setRestartKey] = useState(0);

    const restart = useCallback(() => {
        stateRef.current = createState(kind);
        setDisplay(displayFromState(stateRef.current));
        setRestartKey((key) => key + 1);
    }, [kind]);

    useEffect(() => {
        restart();
    }, [kind, restart]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                [
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Space',
                    'KeyA',
                    'KeyD',
                    'KeyW',
                    'KeyS',
                    'KeyK',
                    'KeyX',
                ].includes(event.code)
            ) {
                event.preventDefault();
                if (event.code === 'Space' && stateRef.current.status !== 'playing') {
                    restart();
                    return;
                }
                keysRef.current[event.code] = true;
            }
        };
        const onKeyUp = (event: KeyboardEvent) => {
            keysRef.current[event.code] = false;
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [restart]);

    useEffect(() => {
        let frameId = 0;
        let lastTime = performance.now();
        const draw = (time: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;
            const dt = Math.min(40, time - lastTime);
            lastTime = time;
            ctx.imageSmoothingEnabled = false;

            const state = stateRef.current;
            if (state.kind === 'platform') updatePlatform(state, keysRef.current);
            if (state.kind === 'maze') updateMaze(state, keysRef.current, dt);
            if (state.kind === 'barrel') updateBarrel(state, keysRef.current);

            if (state.kind === 'platform') drawPlatform(ctx, state);
            if (state.kind === 'maze') drawMaze(ctx, state);
            if (state.kind === 'barrel') drawBarrel(ctx, state);

            const nextDisplay = displayFromState(state);
            setDisplay((previous) =>
                previous.score === nextDisplay.score &&
                previous.lives === nextDisplay.lives &&
                previous.status === nextDisplay.status &&
                previous.message === nextDisplay.message
                    ? previous
                    : nextDisplay
            );
            frameId = requestAnimationFrame(draw);
        };
        frameId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(frameId);
    }, [restartKey]);

    return (
        <div
            style={{
                ...styles.wrapper,
                width,
                height,
            }}
        >
            <div style={styles.topBar}>
                <div style={styles.titleBlock}>
                    <h3 style={styles.title}>{title}</h3>
                    <p style={styles.controls}>{CONTROL_TEXT}</p>
                </div>
                <div style={styles.scoreBoard}>
                    <p style={styles.scoreText}>SCORE {display.score}</p>
                    <p style={styles.scoreText}>LIVES {display.lives}</p>
                    <button className="site-button" onMouseDown={restart}>
                        Restart
                    </button>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                tabIndex={0}
                style={styles.canvas}
                onMouseDown={() => canvasRef.current?.focus()}
            />
            <div style={styles.statusBar}>
                <p style={styles.statusText}>{display.message}</p>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        position: 'absolute',
        inset: 0,
        backgroundColor: '#0b0b0f',
        color: 'white',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    topBar: {
        height: 74,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 10px',
        boxSizing: 'border-box',
        backgroundColor: '#111827',
        borderBottom: '2px solid #ffffff',
    },
    titleBlock: {
        flexDirection: 'column',
    },
    title: {
        color: '#ffffff',
        fontFamily: 'Terminal, monospace',
        fontSize: 22,
        letterSpacing: 0,
    },
    controls: {
        color: '#c8d5ff',
        fontFamily: 'Terminal, monospace',
        fontSize: 12,
        marginTop: 6,
    },
    scoreBoard: {
        alignItems: 'center',
        gap: 12,
    },
    scoreText: {
        color: '#ffffff',
        fontFamily: 'Terminal, monospace',
        fontSize: 14,
        whiteSpace: 'nowrap',
    },
    canvas: {
        flex: 1,
        width: '100%',
        minHeight: 0,
        imageRendering: 'pixelated',
        outline: 'none',
    },
    statusBar: {
        height: 28,
        flexShrink: 0,
        alignItems: 'center',
        padding: '0 10px',
        backgroundColor: '#c3c6ca',
        boxSizing: 'border-box',
        borderTop: '2px solid #ffffff',
    },
    statusText: {
        color: '#000000',
        fontFamily: 'MSSerif, serif',
        fontSize: 14,
    },
};

export default ClassicArcadeGame;
