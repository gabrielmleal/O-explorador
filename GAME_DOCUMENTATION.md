# O Explorador - Game Documentation

## Overview
**O Explorador** (The Explorer) is a 2D platformer game developed in Java using Swing GUI. The player controls an explorer character navigating through a dangerous world filled with wolf enemies, using both melee and ranged combat to survive and progress through levels.

## Table of Contents
- [Core Features](#core-features)
- [Game Architecture](#game-architecture)
- [Gameplay Mechanics](#gameplay-mechanics)
- [Character System](#character-system)
- [Enemy System](#enemy-system)
- [Level System](#level-system)
- [Controls](#controls)
- [Technical Details](#technical-details)
- [Setup and Installation](#setup-and-installation)

## Core Features

### 1. **Player Character System**
- **Movement**: Walking, running, jumping with smooth physics
- **Combat**: Dual combat system with melee (sword) and ranged (arrows) attacks
- **Health System**: 5 health points with visual life counter
- **Invincibility Frames**: Temporary immunity after taking damage
- **Animations**: 7 different animation states (idle, walking, jumping, falling, attacking, shooting, running)

### 2. **Enemy AI System**
- **Gray Wolf (LoboCinza)**: Basic enemy with 3 health, slower movement (0.8 speed)
- **Red Wolf (LoboVermelho)**: Advanced enemy with 6 health, faster movement (1.3 speed)
- **Intelligent Pathfinding**: Enemies detect platform edges and change direction
- **Combat Feedback**: Visual hit indicators and knockback effects

### 3. **Level Design System**
- **Tile-Based Mapping**: 30x30 pixel tile system for level construction
- **Scrolling Backgrounds**: Parallax scrolling with sky and terrain layers
- **Portal System**: Level completion mechanism with animated portals
- **Collision Detection**: Precise tile-based collision system

### 4. **Graphics Engine**
- **Sprite Animation**: Frame-based animation system with customizable intervals
- **Background Scrolling**: Multi-layer parallax backgrounds for depth
- **Particle Effects**: Explosion effects when enemies are defeated
- **Scaling Support**: 2x scaling for pixel-perfect rendering

## Game Architecture

### Package Structure
```
src/
├── Principal/           # Main game engine
│   ├── Jogo.java       # Game window initialization
│   └── JogoPanel.java  # Main game loop and rendering
├── GerenciadorDeEstados/ # State management
│   ├── GerenciadorEstado.java # State manager
│   ├── Estado.java      # Base state class
│   ├── EstadoMenu.java  # Main menu state
│   └── Estado_Level1.java # Level 1 gameplay state
├── ElementosGraficos/   # Graphics components
│   ├── Animacao.java    # Animation system
│   ├── ImagemDeFundo.java # Background images
│   ├── MapaDeBlocos.java # Tile mapping system
│   └── Bloco.java       # Individual tile blocks
├── ObjetosDoMapa/       # Game objects
│   ├── ObjetoMapa.java  # Base object class
│   ├── Jogador.java     # Player character
│   ├── Inimigo.java     # Base enemy class
│   ├── LoboCinza.java   # Gray wolf enemy
│   ├── LoboVermelho.java # Red wolf enemy
│   ├── Flecha.java      # Arrow projectile
│   ├── Explosao.java    # Explosion effects
│   └── Portal.java      # Level exit portal
├── Imagens/            # Game sprites and graphics
└── Mapas/              # Level map files
```

## Gameplay Mechanics

### Movement System
- **Walking Speed**: 1.2 pixels per frame (normal)
- **Running Speed**: 2.28 pixels per frame (1.9x multiplier)
- **Jump Height**: 4.8 pixels initial velocity
- **Gravity**: 0.15 pixels acceleration, max fall speed 4.0
- **Platform Physics**: Edge detection and collision response

### Combat System
#### Melee Combat (Sword)
- **Range**: 35 pixels
- **Animation**: 6-frame attack sequence (frames 3-5 deal damage)
- **Effect**: Knockback enemies and deals damage
- **Restriction**: Cannot move while attacking

#### Ranged Combat (Arrows)
- **Projectile Speed**: Variable based on direction
- **Animation**: 6-frame shooting sequence
- **Effect**: Piercing damage to enemies
- **Limitation**: Cannot shoot while attacking with sword

### Health System
- **Player Health**: 5 hit points maximum
- **Damage**: 1 point per enemy collision
- **Fall Damage**: Falling off screen respawns player and removes 1 health
- **Invincibility**: 1500ms immunity after taking damage
- **Death**: Returns to main menu when health reaches 0

## Character System

### Player Character (Jogador)
- **Size**: 30x30 pixels (60x30 when attacking/shooting)
- **Collision Box**: 20x23 pixels for precise collision detection
- **Animation States**:
  - `PARADO` (0): Idle stance
  - `ANDANDO` (1): Walking animation (4 frames)
  - `PULANDO` (2): Jumping pose (2 frames)
  - `CAINDO` (3): Falling pose (2 frames)
  - `ATACANDO` (4): Sword attack (6 frames)
  - `ATIRANDO` (5): Bow shooting (6 frames)
  - `CORRENDO` (6): Running animation (9 frames)

### Special Abilities
- **Sprint**: C key doubles movement speed
- **Combat Lock**: Cannot move during attack/shoot animations
- **Directional Attacks**: Attacks face the direction character is looking
- **Respawn**: Falls reset position to (100, 170) with health penalty

## Enemy System

### Gray Wolf (LoboCinza)
- **Health**: 3 hit points
- **Movement Speed**: 0.8 pixels per frame
- **Damage**: 1 point per collision
- **Behavior**: Patrols platforms, changes direction at edges
- **Animation**: 4-frame walking cycle (110ms intervals)

### Red Wolf (LoboVermelho)
- **Health**: 6 hit points
- **Movement Speed**: 1.3 pixels per frame
- **Damage**: 1 point per collision
- **Behavior**: More aggressive patrolling, faster reaction time
- **Animation**: 4-frame walking cycle (70ms intervals)

### Enemy Placement (Level 1)
The level contains 20 strategically placed enemies:
- 18 Gray Wolves at various positions and elevations
- 2 Red Wolves as boss-level challenges near the end

## Level System

### Level 1 Design
- **Map Size**: 163 tiles wide × 8 tiles high
- **Tile Size**: 30×30 pixels each
- **Total Width**: 4,890 pixels
- **Scrolling Camera**: Follows player with smooth movement
- **Background Layers**:
  - Sky layer with automatic scrolling (-0.2 speed)
  - Terrain layer that follows camera position

### Portal System
- **Location**: End of level at position (4875, 165)
- **Activation**: Player collision triggers portal animation
- **Completion**: Returns to main menu when portal animation finishes
- **Visual Effect**: Animated sprite sequence

## Controls

### Keyboard Mapping
- **Arrow Keys**: Movement (Left/Right/Up/Down)
- **Z Key**: Melee attack (sword)
- **X Key**: Ranged attack (arrows)
- **C Key**: Sprint/Run (hold)
- **B Key**: Debug teleport to end of level
- **Enter**: Menu selection
- **Up/Down Arrows**: Menu navigation

### Menu Controls
- **Navigate**: Up/Down arrow keys
- **Select**: Enter key
- **Options**: 
  - "Jogar" (Play): Start Level 1
  - "Ajuda" (Help): Not implemented
  - "Sair" (Exit): Close game

## Technical Details

### Performance
- **Frame Rate**: 60 FPS (1000/60 = 16.67ms per frame)
- **Resolution**: 320×240 base resolution, scaled 2x to 640×480
- **Threading**: Single game thread handling updates and rendering
- **Memory**: Efficient sprite loading and management

### File Formats
- **Images**: GIF format for sprites and backgrounds
- **Maps**: Custom .mapa format with tile indices
- **Build System**: Apache Ant (build.xml)
- **IDE**: NetBeans project structure

### Graphics System
- **Rendering**: Java2D Graphics2D for all drawing operations
- **Double Buffering**: Off-screen rendering to prevent flickering
- **Color Depth**: RGB color mode
- **Sprite Sheets**: Efficient sub-image extraction

## Setup and Installation

### Requirements
- Java Development Kit (JDK) 8 or higher
- Apache Ant for building (optional - can use IDE)

### Building
```bash
# Using Ant
ant compile
ant jar

# Or open in NetBeans IDE and build project
```

### Running
```bash
java -jar dist/O-explorador.jar

# Or run main class directly
java Principal.Jogo
```

### Game Assets
All required assets are included in the `src/Imagens/` directory:
- Character sprites: `personagemsprite.gif`
- Enemy sprites: `LoboCinza.gif`, `LoboVermelho.gif`
- Environment: `blocos.gif`, `Ceu.gif`, `Terra.gif`
- Effects: `Explosao.gif`, `portal.gif`
- UI: `menubg.gif`, `flechasprite.gif`

---

*This documentation covers all core features and systems of O Explorador. The game demonstrates solid 2D platformer mechanics with combat, enemy AI, and level progression systems implemented in pure Java.*