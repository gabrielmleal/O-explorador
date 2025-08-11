/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package GerenciadorDeEstados;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Auto-generator for platform levels with intelligent level design
 * @author Gabriel
 */
public class LevelAutoGenerator {
    
    // Tile constants based on existing game tile system
    private static final int TILE_EMPTY = 0;
    private static final int TILE_PLATFORM_LEFT = 2;
    private static final int TILE_PLATFORM_MIDDLE = 10;
    private static final int TILE_PLATFORM_RIGHT = 1;
    private static final int TILE_GROUND_LEFT = 4;
    private static final int TILE_GROUND_MIDDLE = 11;
    private static final int TILE_GROUND_RIGHT = 3;
    private static final int TILE_GROUND_TOP_LEFT = 5;
    private static final int TILE_GROUND_TOP_MIDDLE = 6;
    private static final int TILE_GROUND_TOP_RIGHT = 7;
    private static final int TILE_UNDERGROUND_LEFT = 13;
    private static final int TILE_UNDERGROUND_MIDDLE = 12;
    private static final int TILE_UNDERGROUND_RIGHT = 14;
    private static final int TILE_PORTAL = 16; // Portal tile
    private static final int TILE_PORTAL_SUPPORT = 15; // Support under portal
    
    // Level generation parameters
    private Random random;
    private int width;
    private int height;
    private int[][] levelGrid;
    private List<MonsterPosition> monsterPositions;
    
    // Platform game design constants
    private static final int MIN_PLATFORM_LENGTH = 3;
    private static final int MAX_PLATFORM_LENGTH = 8;
    private static final int MIN_GAP_SIZE = 3;
    private static final int MAX_GAP_SIZE = 6;
    private static final int MIN_PLATFORM_HEIGHT = 2;
    private static final int MAX_PLATFORM_HEIGHT = 5;
    private static final int GROUND_THICKNESS = 3;
    
    public LevelAutoGenerator() {
        this.random = new Random();
        this.monsterPositions = new ArrayList<>();
    }
    
    /**
     * Generates a complete level based on the given parameters
     * @param width Level width in tiles
     * @param numGrayWolves Number of gray wolves to place
     * @param numRedWolves Number of red wolves to place
     * @return Generated level data structure
     */
    public LevelData generateLevel(int width, int numGrayWolves, int numRedWolves) {
        this.width = width;
        this.height = 8; // Standard height for platform levels
        this.levelGrid = new int[height][width];
        this.monsterPositions.clear();
        
        // Step 1: Generate base ground structure
        generateGroundStructure();
        
        // Step 2: Generate floating platforms
        generateFloatingPlatforms();
        
        // Step 3: Place portal at the end
        placePortal();
        
        // Step 4: Place monsters strategically
        placeMonsters(numGrayWolves, numRedWolves);
        
        // Step 5: Create final level data
        return createLevelData();
    }
    
    /**
     * Generates the base ground structure with varied terrain
     */
    private void generateGroundStructure() {
        int groundLevel = height - GROUND_THICKNESS;
        
        // Create main ground sections with some gaps for platforms
        int currentX = 0;
        while (currentX < width - 10) { // Leave space for portal area
            // Create a ground section
            int sectionLength = MIN_PLATFORM_LENGTH + random.nextInt(MAX_PLATFORM_LENGTH - MIN_PLATFORM_LENGTH);
            sectionLength = Math.min(sectionLength, width - currentX - 10);
            
            // Build ground section
            for (int x = currentX; x < currentX + sectionLength; x++) {
                // Ground surface
                levelGrid[groundLevel][x] = (x == currentX) ? TILE_GROUND_TOP_LEFT :
                                           (x == currentX + sectionLength - 1) ? TILE_GROUND_TOP_RIGHT :
                                           TILE_GROUND_TOP_MIDDLE;
                
                // Underground layers
                for (int y = groundLevel + 1; y < height; y++) {
                    levelGrid[y][x] = (x == currentX) ? TILE_GROUND_LEFT :
                                     (x == currentX + sectionLength - 1) ? TILE_GROUND_RIGHT :
                                     TILE_GROUND_MIDDLE;
                }
            }
            
            currentX += sectionLength;
            
            // Add gap between ground sections (if not at the end)
            if (currentX < width - 15) {
                int gapSize = MIN_GAP_SIZE + random.nextInt(MAX_GAP_SIZE - MIN_GAP_SIZE);
                currentX += Math.min(gapSize, width - currentX - 10);
            }
        }
        
        // Ensure there's solid ground near the end for portal placement
        int endGroundStart = width - 8;
        for (int x = endGroundStart; x < width; x++) {
            levelGrid[groundLevel][x] = (x == endGroundStart) ? TILE_GROUND_TOP_LEFT :
                                       (x == width - 1) ? TILE_GROUND_TOP_RIGHT :
                                       TILE_GROUND_TOP_MIDDLE;
            
            for (int y = groundLevel + 1; y < height; y++) {
                levelGrid[y][x] = (x == endGroundStart) ? TILE_GROUND_LEFT :
                                 (x == width - 1) ? TILE_GROUND_RIGHT :
                                 TILE_GROUND_MIDDLE;
            }
        }
    }
    
    /**
     * Generates floating platforms at strategic positions
     */
    private void generateFloatingPlatforms() {
        int numPlatforms = width / 12; // Roughly one platform per 12 tiles
        
        for (int i = 0; i < numPlatforms; i++) {
            // Find a good position for the platform
            int platformX = 10 + random.nextInt(Math.max(1, width - 20)); // Avoid start and end areas
            int platformY = 2 + random.nextInt(3); // Heights 2, 3, or 4 from top
            int platformLength = MIN_PLATFORM_LENGTH + random.nextInt(MAX_PLATFORM_LENGTH - MIN_PLATFORM_LENGTH);
            
            // Make sure platform doesn't extend beyond level bounds
            platformLength = Math.min(platformLength, width - platformX);
            
            // Check if area is clear and suitable for platform
            if (isPlatformAreaSuitable(platformX, platformY, platformLength)) {
                // Build the platform
                for (int x = 0; x < platformLength; x++) {
                    int tileX = platformX + x;
                    if (tileX < width) {
                        levelGrid[platformY][tileX] = (x == 0) ? TILE_PLATFORM_LEFT :
                                                     (x == platformLength - 1) ? TILE_PLATFORM_RIGHT :
                                                     TILE_PLATFORM_MIDDLE;
                    }
                }
            }
        }
    }
    
    /**
     * Checks if an area is suitable for platform placement
     */
    private boolean isPlatformAreaSuitable(int startX, int y, int length) {
        // Check if the area is clear
        for (int x = startX; x < startX + length && x < width; x++) {
            if (levelGrid[y][x] != TILE_EMPTY) {
                return false;
            }
            
            // Check for proper spacing from ground below
            boolean hasGroundBelow = false;
            for (int checkY = y + 1; checkY < height; checkY++) {
                if (levelGrid[checkY][x] != TILE_EMPTY) {
                    hasGroundBelow = true;
                    break;
                }
            }
            
            if (!hasGroundBelow && y > height - 3) { // Don't place platforms too high without ground support
                return false;
            }
        }
        
        // Check spacing from other platforms
        for (int checkY = Math.max(0, y - 2); checkY < Math.min(height, y + 3); checkY++) {
            for (int checkX = Math.max(0, startX - 2); checkX < Math.min(width, startX + length + 2); checkX++) {
                if (checkY != y && levelGrid[checkY][checkX] != TILE_EMPTY) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Places portal at the end of the level
     */
    private void placePortal() {
        int portalX = width - 3;
        int portalY = height - GROUND_THICKNESS - 1; // On top of ground
        
        // Place portal and support
        levelGrid[portalY][portalX] = TILE_PORTAL;
        if (portalY + 1 < height) {
            levelGrid[portalY + 1][portalX] = TILE_PORTAL_SUPPORT;
        }
    }
    
    /**
     * Places monsters strategically on platforms and ground
     */
    private void placeMonsters(int numGrayWolves, int numRedWolves) {
        List<MonsterSpawnPoint> spawnPoints = findValidSpawnPoints();
        
        // Shuffle spawn points for random placement
        for (int i = spawnPoints.size() - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            MonsterSpawnPoint temp = spawnPoints.get(i);
            spawnPoints.set(i, spawnPoints.get(j));
            spawnPoints.set(j, temp);
        }
        
        // Place gray wolves
        int placed = 0;
        for (MonsterSpawnPoint point : spawnPoints) {
            if (placed >= numGrayWolves) break;
            monsterPositions.add(new MonsterPosition(point.x, point.y, MonsterPosition.TYPE_GRAY_WOLF));
            placed++;
        }
        
        // Place red wolves
        placed = 0;
        for (int i = numGrayWolves; i < spawnPoints.size() && placed < numRedWolves; i++) {
            MonsterSpawnPoint point = spawnPoints.get(i);
            monsterPositions.add(new MonsterPosition(point.x, point.y, MonsterPosition.TYPE_RED_WOLF));
            placed++;
        }
    }
    
    /**
     * Finds valid spawn points for monsters on platforms and ground
     */
    private List<MonsterSpawnPoint> findValidSpawnPoints() {
        List<MonsterSpawnPoint> spawnPoints = new ArrayList<>();
        
        for (int y = 0; y < height - 1; y++) {
            for (int x = 1; x < width - 5; x++) { // Avoid very start and end
                // Check if position is empty and has solid ground below
                if (levelGrid[y][x] == TILE_EMPTY && y + 1 < height && levelGrid[y + 1][x] != TILE_EMPTY) {
                    // Make sure there's some space around the spawn point
                    boolean validSpawn = true;
                    for (int checkX = x - 1; checkX <= x + 1; checkX++) {
                        if (checkX >= 0 && checkX < width && levelGrid[y][checkX] != TILE_EMPTY) {
                            validSpawn = false;
                            break;
                        }
                    }
                    
                    if (validSpawn) {
                        spawnPoints.add(new MonsterSpawnPoint(x, y));
                    }
                }
            }
        }
        
        return spawnPoints;
    }
    
    /**
     * Creates the final level data structure
     */
    private LevelData createLevelData() {
        return new LevelData(width, height, levelGrid, monsterPositions);
    }
    
    /**
     * Helper class for monster spawn points
     */
    private static class MonsterSpawnPoint {
        int x, y;
        
        MonsterSpawnPoint(int x, int y) {
            this.x = x;
            this.y = y;
        }
    }
    
    /**
     * Data class for monster positions
     */
    public static class MonsterPosition {
        public static final int TYPE_GRAY_WOLF = 1;
        public static final int TYPE_RED_WOLF = 2;
        
        public final int x, y, type;
        
        public MonsterPosition(int x, int y, int type) {
            this.x = x;
            this.y = y;
            this.type = type;
        }
    }
    
    /**
     * Complete level data structure
     */
    public static class LevelData {
        public final int width, height;
        public final int[][] tiles;
        public final List<MonsterPosition> monsters;
        
        public LevelData(int width, int height, int[][] tiles, List<MonsterPosition> monsters) {
            this.width = width;
            this.height = height;
            this.tiles = tiles;
            this.monsters = new ArrayList<>(monsters);
        }
        
        /**
         * Converts level data to .mapa file format
         */
        public String toMapaFormat() {
            StringBuilder sb = new StringBuilder();
            
            // First line: width
            sb.append(width).append("\n");
            
            // Second line: height
            sb.append(height).append("\n");
            
            // Map data: space-separated tile IDs
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    sb.append(tiles[y][x]);
                    if (x < width - 1) {
                        sb.append(" ");
                    }
                }
                sb.append("\n");
            }
            
            return sb.toString();
        }
    }
}