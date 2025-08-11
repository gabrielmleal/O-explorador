/*
 * Level saving utility for the level constructor system
 * Handles saving both manual and auto-generated levels in .mapa format
 */

package GerenciadorDeEstados;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;

/**
 * Utility class for saving levels created in the level constructor
 * Generates .mapa files compatible with the existing MapaDeBlocos system
 * @author Gabriel
 */
public class LevelSaver {
    
    private static final String MAPS_DIRECTORY = "src/Mapas/";
    private static final String LEVEL_PREFIX = "level";
    private static final String MAP_EXTENSION = ".mapa";
    
    /**
     * Saves a level from the manual editor
     * @param levelEditor The level editor containing the level data
     * @return The filename of the saved level, or null if saving failed
     */
    public static String saveLevelFromEditor(LevelEditor levelEditor) {
        try {
            int[][] levelGrid = levelEditor.getLevelGrid();
            int width = levelEditor.getGridWidth();
            int height = levelEditor.getGridHeight();
            
            // Get next available level number
            int levelNumber = getNextLevelNumber();
            String filename = generateLevelFilename(levelNumber);
            String fullPath = MAPS_DIRECTORY + filename;
            
            // Create maps directory if it doesn't exist
            File mapsDir = new File(MAPS_DIRECTORY);
            if (!mapsDir.exists()) {
                mapsDir.mkdirs();
            }
            
            // Write the .mapa file
            BufferedWriter writer = new BufferedWriter(new FileWriter(fullPath));
            
            // Write header: width (columns) and height (rows)
            writer.write(String.valueOf(width));
            writer.newLine();
            writer.write(String.valueOf(height));
            writer.newLine();
            
            // Write tile data row by row
            for (int row = 0; row < height; row++) {
                StringBuilder lineBuilder = new StringBuilder();
                for (int col = 0; col < width; col++) {
                    if (col > 0) {
                        lineBuilder.append(" ");
                    }
                    lineBuilder.append(levelGrid[row][col]);
                }
                writer.write(lineBuilder.toString());
                writer.newLine();
            }
            
            writer.close();
            
            System.out.println("Level saved successfully: " + filename);
            return filename;
            
        } catch (IOException e) {
            e.printStackTrace();
            System.err.println("Failed to save level from editor: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Saves a level from the auto-generator
     * @param levelData The generated level data
     * @return The filename of the saved level, or null if saving failed
     */
    public static String saveLevelFromGenerator(LevelAutoGenerator.LevelData levelData) {
        try {
            // Get next available level number
            int levelNumber = getNextLevelNumber();
            String filename = generateLevelFilename(levelNumber);
            String fullPath = MAPS_DIRECTORY + filename;
            
            // Create maps directory if it doesn't exist
            File mapsDir = new File(MAPS_DIRECTORY);
            if (!mapsDir.exists()) {
                mapsDir.mkdirs();
            }
            
            // Write the .mapa file
            BufferedWriter writer = new BufferedWriter(new FileWriter(fullPath));
            
            // Write header: width (columns) and height (rows)
            writer.write(String.valueOf(levelData.width));
            writer.newLine();
            writer.write(String.valueOf(levelData.height));
            writer.newLine();
            
            // Write tile data row by row
            for (int row = 0; row < levelData.height; row++) {
                StringBuilder lineBuilder = new StringBuilder();
                for (int col = 0; col < levelData.width; col++) {
                    if (col > 0) {
                        lineBuilder.append(" ");
                    }
                    lineBuilder.append(levelData.tiles[row][col]);
                }
                writer.write(lineBuilder.toString());
                writer.newLine();
            }
            
            writer.close();
            
            System.out.println("Generated level saved successfully: " + filename);
            return filename;
            
        } catch (IOException e) {
            e.printStackTrace();
            System.err.println("Failed to save generated level: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Finds the next available level number by scanning existing files
     * @return The next sequential level number (2, 3, 4, etc.)
     */
    private static int getNextLevelNumber() {
        File mapsDir = new File(MAPS_DIRECTORY);
        if (!mapsDir.exists()) {
            return 2; // Start with level 2 (level 1 exists)
        }
        
        int maxLevel = 1; // We know level 1 exists
        
        File[] files = mapsDir.listFiles();
        if (files != null) {
            for (File file : files) {
                String filename = file.getName();
                if (filename.startsWith(LEVEL_PREFIX) && filename.endsWith(MAP_EXTENSION)) {
                    try {
                        // Extract level number from filename like "level2-1.mapa" or "level2.mapa"
                        String numberPart = filename.substring(LEVEL_PREFIX.length());
                        numberPart = numberPart.substring(0, numberPart.indexOf(MAP_EXTENSION));
                        
                        // Handle both "level2.mapa" and "level2-1.mapa" formats
                        if (numberPart.contains("-")) {
                            numberPart = numberPart.substring(0, numberPart.indexOf("-"));
                        }
                        
                        int levelNumber = Integer.parseInt(numberPart);
                        if (levelNumber > maxLevel) {
                            maxLevel = levelNumber;
                        }
                    } catch (NumberFormatException e) {
                        // Ignore files that don't match expected format
                    }
                }
            }
        }
        
        return maxLevel + 1;
    }
    
    /**
     * Generates a filename for the given level number
     * @param levelNumber The level number
     * @return The filename (e.g., "level2-1.mapa")
     */
    private static String generateLevelFilename(int levelNumber) {
        return LEVEL_PREFIX + levelNumber + "-1" + MAP_EXTENSION;
    }
    
    /**
     * Gets the total number of available levels (including newly created ones)
     * @return The total count of levels
     */
    public static int getTotalLevelCount() {
        File mapsDir = new File(MAPS_DIRECTORY);
        if (!mapsDir.exists()) {
            return 1; // Only level 1 exists
        }
        
        int maxLevel = 1;
        
        File[] files = mapsDir.listFiles();
        if (files != null) {
            for (File file : files) {
                String filename = file.getName();
                if (filename.startsWith(LEVEL_PREFIX) && filename.endsWith(MAP_EXTENSION)) {
                    try {
                        String numberPart = filename.substring(LEVEL_PREFIX.length());
                        numberPart = numberPart.substring(0, numberPart.indexOf(MAP_EXTENSION));
                        
                        if (numberPart.contains("-")) {
                            numberPart = numberPart.substring(0, numberPart.indexOf("-"));
                        }
                        
                        int levelNumber = Integer.parseInt(numberPart);
                        if (levelNumber > maxLevel) {
                            maxLevel = levelNumber;
                        }
                    } catch (NumberFormatException e) {
                        // Ignore files that don't match expected format
                    }
                }
            }
        }
        
        return maxLevel;
    }
    
    /**
     * Checks if a level file exists for the given level number
     * @param levelNumber The level number to check
     * @return true if the level file exists, false otherwise
     */
    public static boolean levelExists(int levelNumber) {
        String filename = generateLevelFilename(levelNumber);
        File levelFile = new File(MAPS_DIRECTORY + filename);
        return levelFile.exists();
    }
}