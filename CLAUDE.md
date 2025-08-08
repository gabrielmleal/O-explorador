# CLAUDE.md - Context for O Explorador Game

## Project Overview
**O Explorador** (The Explorer) is a 2D platformer game developed in Java using Swing GUI. This is a complete, standalone game featuring:
- Player character with dual combat system (melee sword + ranged arrows)
- Enemy AI with two wolf types (Gray Wolf and Red Wolf)
- Level progression system with scrolling backgrounds
- Physics-based movement and collision detection

## Project Structure
```
src/
├── Principal/              # Main game engine
│   ├── Jogo.java          # Game window initialization
│   └── JogoPanel.java     # Main game loop and rendering
├── GerenciadorDeEstados/   # State management system
│   ├── GerenciadorEstado.java  # State manager
│   ├── Estado.java        # Base state class
│   ├── EstadoMenu.java    # Main menu state
│   └── Estado_Level1.java # Level 1 gameplay state
├── ElementosGraficos/      # Graphics components
│   ├── Animacao.java      # Animation system
│   ├── ImagemDeFundo.java # Background images
│   ├── MapaDeBlocos.java  # Tile mapping system
│   └── Bloco.java         # Individual tile blocks
├── ObjetosDoMapa/         # Game objects
│   ├── ObjetoMapa.java    # Base object class
│   ├── Jogador.java       # Player character (main character)
│   ├── Inimigo.java       # Base enemy class
│   ├── LoboCinza.java     # Gray wolf enemy (3 HP, 0.8 speed)
│   ├── LoboVermelho.java  # Red wolf enemy (6 HP, 1.3 speed)
│   ├── Flecha.java        # Arrow projectile
│   ├── Explosao.java      # Explosion effects
│   └── Portal.java        # Level exit portal
├── Imagens/               # Game sprites and graphics
└── Mapas/                 # Level map files (.mapa format)
```

## Build System
- **Build Tool**: Apache Ant (build.xml)
- **IDE**: NetBeans project structure
- **Java Version**: JDK 8 or higher required
- **Main Class**: `Principal.Jogo`

### Build Commands
```bash
# Compile the project
ant compile

# Build JAR file
ant jar

# Run the game
java -jar dist/O-explorador.jar
# OR
java Principal.Jogo
```

## Key Game Systems

### 1. Player System (Jogador.java)
- **Health**: 5 HP maximum, dies when reaching 0
- **Movement**: Walking (1.2 px/frame), Running (2.28 px/frame), Jumping (4.8 initial velocity)
- **Combat**: Dual system - Sword (35px range, 6-frame animation) + Arrows (projectile)
- **Animation States**: PARADO, ANDANDO, PULANDO, CAINDO, ATACANDO, ATIRANDO, CORRENDO
- **Special Features**: Sprint mode (C key), invincibility frames (1500ms after damage)

### 2. Enemy System
- **LoboCinza**: 3 HP, 0.8 speed, basic AI
- **LoboVermelho**: 6 HP, 1.3 speed, aggressive AI
- **AI Features**: Platform edge detection, direction changes, collision damage

### 3. Level System
- **Tile-Based**: 30x30 pixel tiles, custom .mapa format
- **Scrolling**: Camera follows player, parallax backgrounds
- **Portal System**: Level completion mechanism

## Controls
- **Arrow Keys**: Movement (Left/Right/Up for jump)
- **Z**: Melee attack (sword)
- **X**: Ranged attack (arrows)
- **C**: Sprint/Run (hold)
- **B**: Debug teleport to end
- **Enter**: Menu selection

## Technical Details
- **Frame Rate**: 60 FPS (16.67ms per frame)
- **Resolution**: 320×240 base, scaled 2x to 640×480
- **Graphics**: Java2D Graphics2D with double buffering
- **File Formats**: GIF sprites, custom .mapa files

## Development Guidelines

### Code Style
- **Language**: Portuguese variable names and comments
- **Classes**: PascalCase (Jogador, LoboCinza)
- **Methods**: camelCase (atualizaVelocidade, desenha)
- **Constants**: UPPER_CASE (PARADO, ATACANDO)

### Architecture Patterns
- **State Pattern**: Used for game states (Menu, Level1)
- **Component Pattern**: GameObject base class with inheritance
- **Animation System**: Frame-based with configurable intervals

### Common Tasks
- **Adding Enemies**: Extend `Inimigo.java`, implement in level state
- **New Animations**: Use `Animacao.java` system with sprite sheets
- **Level Design**: Edit .mapa files or create new ones
- **Debug Features**: B key teleport, add more debug keys as needed

## Testing
- No formal test suite currently
- Manual testing through gameplay
- Debug features available (B key teleport)

## Dependencies
- Java Standard Library only (Swing, Java2D)
- No external dependencies required
- Self-contained project

## Common File Locations
- **Main Entry Point**: `src/Principal/Jogo.java`
- **Game Loop**: `src/Principal/JogoPanel.java`
- **Player Logic**: `src/ObjetosDoMapa/Jogador.java`
- **Level 1**: `src/GerenciadorDeEstados/Estado_Level1.java`
- **Sprites**: `src/Imagens/*.gif`
- **Maps**: `src/Mapas/*.mapa`

## Performance Considerations
- 60 FPS target with 16.67ms frame time
- Efficient sprite loading and caching
- Single-threaded game loop
- Java2D rendering optimized with double buffering

---

*This context file helps Claude understand the O Explorador codebase structure, key systems, and development patterns for future assistance.*