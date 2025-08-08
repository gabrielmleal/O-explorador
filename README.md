# O Explorador (The Explorer)

**O Explorador** is a 2D platformer game developed in Java using Swing GUI, featuring a player character with dual combat system (melee sword + ranged arrows), enemy AI with wolf types, level progression, and physics-based movement.

## How to Run the Game

### Prerequisites
- Java JDK 8 or higher
- Apache Ant (for building from source)

### Option 1: Run from JAR file
```bash
# If JAR file exists
java -jar dist/O-explorador.jar
```

### Option 2: Build and run from source
```bash
# 1. Compile the project
ant compile

# 2. Build JAR file
ant jar

# 3. Run the game
java -jar dist/O-explorador.jar
```

### Option 3: Run directly with Java
```bash
# Run the main class directly
java Principal.Jogo
```

### Controls
- **Arrow Keys**: Movement (Left/Right/Up for jump)
- **Z**: Melee attack (sword)  
- **X**: Ranged attack (arrows)
- **C**: Sprint/Run (hold)
- **Enter**: Menu selection
