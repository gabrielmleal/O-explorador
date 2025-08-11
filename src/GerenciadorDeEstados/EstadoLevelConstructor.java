/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package GerenciadorDeEstados;

import ElementosGraficos.ImagemDeFundo;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.event.KeyEvent;
import java.awt.event.MouseEvent;

/**
 *
 * @author Gabriel
 */
public class EstadoLevelConstructor extends Estado {
    
    //declara uma imagem de fundo
    private ImagemDeFundo fundo;
    
    //declara um vetor de strings que apresenta as opções do level constructor
    private String[] opcoes = {"Manual Constructor", "Auto-generator", "Voltar"};
    //declara o valor da escolha atual
    private int escolhaAtual;
    //declara as fontes que serão escritas os dados do menu
    private Font fonteTitulo, fonteOpcoes;
    //declara as cores dos elementos
    private Color corTitulo, corOpcao, corSelecionado;
    
    // Interface components
    private TilePalette tilePalette;
    private MonsterPalette monsterPalette;
    private LevelSettings levelSettings;
    private LevelEditor levelEditor;
    private LevelAutoGenerator autoGenerator;
    private boolean showInterfaces = false;
    private boolean inEditorMode = false;
    private boolean showGeneratedLevel = false;
    private LevelAutoGenerator.LevelData generatedLevel;
    
    //construtor, que é construído a partir de um gerenciador de estados
    public EstadoLevelConstructor(GerenciadorEstado ge){
        this.ge=ge;
        try{
            //carrega a imagem de fundo
            fundo = new ImagemDeFundo("/Imagens/menubg.gif",1);
            //coloca um movimento automático de 0.1 pixel a cada execução do thread
            fundo.mudarMovimentoAutomatico(-0.1, 0);
            
            //define as fontes
            fonteTitulo = new Font("Arial",Font.PLAIN,16);
            fonteOpcoes = new Font("Arial",Font.PLAIN,12);

            //define as cores
            corTitulo = Color.RED.darker();
            corOpcao = Color.BLACK;
            corSelecionado = Color.RED;
            
            // Initialize interface components
            tilePalette = new TilePalette(20, 150);
            monsterPalette = new MonsterPalette(20, 220);
            levelSettings = new LevelSettings(300, 150);
            levelEditor = new LevelEditor();
            autoGenerator = new LevelAutoGenerator();
        }
        catch(Exception e){
            e.printStackTrace();
        }   
    }
    
    //método herdado, que não precisa ser implementado
    public void inicializa(){
        escolhaAtual = 0; // Reseta a seleção quando entra no estado
        showInterfaces = false; // Hide interfaces when returning to main menu
        inEditorMode = false; // Exit editor mode when returning to main menu
        showGeneratedLevel = false; // Hide generated level preview
        generatedLevel = null; // Clear generated level data
    }
    
    //método que atualiza a tela do level constructor
    public void atualiza(){
        //somente as coordenadas do fundo devem ser atualizadas pelo thread
        fundo.atualiza();
    }
    
    //método que desenha o estado
    public void desenha(Graphics2D g){
        if(inEditorMode) {
            // Draw the level editor
            levelEditor.desenha(g);
        } else if(showGeneratedLevel) {
            // Draw generated level preview
            drawGeneratedLevel(g);
        } else {
            fundo.desenha(g);//desenha o fundo
            //define a cor e a fonte do título
            g.setColor(corTitulo);
            g.setFont(fonteTitulo);
            //escreve o título na tela
            g.drawString("Level Constructor", 90, 100);
            
            //muda a fonte para fonte de opções
            g.setFont(fonteOpcoes);
            //enquanto i for menor que o número da array da string de opções
            for(int i=0;i<opcoes.length;i++){
                if(escolhaAtual==i){/*se a string for a opção atual, então desenhar ela com uma cor diferenciada
                    e desenhar um triângulo que aponte para a opção
                    */
                    g.setColor(corSelecionado);
                    int[] x = {125,125,130};
                    int[] y = {130+20*i-10,130+20*i,130+20*i-5};
                    g.fillPolygon(x,y,3);
                }
                else{
                    //caso contrário, simplemente dar a cor padrão de opções
                    g.setColor(corOpcao);
                }
                //desenha a string da opção
                g.drawString(opcoes[i], 140, 130+20*i);
            }
            
            // Draw interface components when appropriate
            if(showInterfaces) {
                tilePalette.desenha(g);
                monsterPalette.desenha(g);
                
                // Show level settings only for auto-generator
                if(escolhaAtual == 1) {
                    levelSettings.desenha(g);
                }
                
                // Draw instructions
                g.setColor(Color.BLACK);
                g.setFont(fonteOpcoes);
                if(escolhaAtual == 0) {
                    g.drawString("Select tiles and monsters, then press SPACE to start manual editor", 20, 320);
                } else if(escolhaAtual == 1) {
                    g.drawString("Configure settings and press SPACE to auto-generate level", 20, 320);
                }
                g.drawString("Press ESC to return to menu", 20, 340);
            }
        }
    }
    
    
    //método auxiliar que seleciona a opção
    public void seleciona(){
        if(escolhaAtual==0){
            // Manual Constructor - Show interfaces for tile/monster selection
            showInterfaces = true;
        }
        else if(escolhaAtual==1){
            // Auto-generator - Show interfaces for settings
            showInterfaces = true;
        }
        else{
            // Voltar para o menu principal
            showInterfaces = false;
            ge.mudarEstado(GerenciadorEstado.ESTADO_MENU);
        }
    }
    
    
    //sistema de key listener
    public void keyPressed(int k){
        if(inEditorMode) {
            // Handle editor mode input
            if(k==KeyEvent.VK_ESCAPE){
                // ESC exits editor mode back to interface
                inEditorMode = false;
                showInterfaces = true;
            } else if(k==KeyEvent.VK_SPACE) {
                // SPACE saves level from manual editor
                String savedFile = LevelSaver.saveLevelFromEditor(levelEditor);
                if (savedFile != null) {
                    // Level saved successfully, return to menu
                    inEditorMode = false;
                    showInterfaces = false;
                    ge.mudarEstado(GerenciadorEstado.ESTADO_MENU);
                }
            } else {
                // Pass other keys to level editor
                levelEditor.handleKeyPressed(k);
            }
        }
        else if(showGeneratedLevel) {
            // Handle generated level preview input
            if(k==KeyEvent.VK_ESCAPE){
                // ESC returns to settings interface
                showGeneratedLevel = false;
                showInterfaces = true;
            } else if(k==KeyEvent.VK_SPACE) {
                // SPACE saves generated level
                String savedFile = LevelSaver.saveLevelFromGenerator(generatedLevel);
                if (savedFile != null) {
                    // Level saved successfully, return to menu
                    showGeneratedLevel = false;
                    showInterfaces = false;
                    ge.mudarEstado(GerenciadorEstado.ESTADO_MENU);
                }
            } else if(k==KeyEvent.VK_R) {
                // R key regenerates level with same settings
                generateLevel();
            }
        }
        else if(!showInterfaces) {
            // Navigation in main menu
            if(k==KeyEvent.VK_UP){
                //caso a tecla pressionada seja cima, então decrementar escolha atual
                escolhaAtual--;
                if(escolhaAtual<0){//caso fique menor que 0, então a opção atual será a última
                    escolhaAtual=opcoes.length-1;
                }
            }
            if(k==KeyEvent.VK_DOWN){
                //caso a tecla pressionada seja baixo, então incrementar escolha atual
                escolhaAtual++;
                if(escolhaAtual==opcoes.length){//caso fique maior que todas as opções, então escolha atual será a primeira
                    escolhaAtual=0;
                }
            }
            if(k==KeyEvent.VK_ENTER){
                //caso seja enter, usa o método auxiliar de selecionar
                seleciona();
            }
            if(k==KeyEvent.VK_ESCAPE){
                //ESC volta para o menu principal
                ge.mudarEstado(GerenciadorEstado.ESTADO_MENU);
            }
        }
        else {
            // Interface is showing
            if(k==KeyEvent.VK_ESCAPE){
                // ESC hides interfaces and returns to main menu
                showInterfaces = false;
            }
            if(k==KeyEvent.VK_SPACE){
                // SPACE key starts the actual construction/generation
                if(escolhaAtual == 0) {
                    // Manual Constructor - Start level editor
                    inEditorMode = true;
                    showInterfaces = false;
                    // Set selected tile/monster from palettes
                    levelEditor.setSelectedTile(tilePalette.getSelectedTile());
                    levelEditor.setSelectedMonster(monsterPalette.getSelectedMonster());
                }
                else if(escolhaAtual == 1) {
                    // Auto-generator - Generate level with current settings
                    generateLevel();
                }
            }
        }
    }
    
    public void keyReleased(int k){
        
    }
    
    // Mouse event handling for palette interactions and editor
    public void mousePressed(MouseEvent e) {
        if(inEditorMode) {
            // Handle level editor mouse clicks
            int mouseX = e.getX();
            int mouseY = e.getY();
            
            if(levelEditor.handleMouseClick(mouseX, mouseY)) {
                // Click was handled by editor (tile placed/erased)
                
                // Update editor's selected tools if needed
                if(!levelEditor.isEraseMode()) {
                    if(levelEditor.isPlacingMonster()) {
                        levelEditor.setSelectedMonster(monsterPalette.getSelectedMonster());
                    } else {
                        levelEditor.setSelectedTile(tilePalette.getSelectedTile());
                    }
                }
            }
        }
        else if(showInterfaces) {
            int mouseX = e.getX();
            int mouseY = e.getY();
            
            // Check tile palette clicks
            if(tilePalette.checkClick(mouseX, mouseY)) {
                // Tile selected - handled by TilePalette
            }
            
            // Check monster palette clicks
            if(monsterPalette.checkClick(mouseX, mouseY)) {
                // Monster selected - handled by MonsterPalette
            }
            
            // Check level settings clicks (only for auto-generator)
            if(escolhaAtual == 1 && levelSettings.checkClick(mouseX, mouseY)) {
                // Settings updated - handled by LevelSettings
            }
        }
    }
    
    // Getters for accessing selected values from other classes
    public TilePalette getTilePalette() {
        return tilePalette;
    }
    
    public MonsterPalette getMonsterPalette() {
        return monsterPalette;
    }
    
    public LevelSettings getLevelSettings() {
        return levelSettings;
    }
    
    /**
     * Generates a level using the auto-generator with current settings
     */
    private void generateLevel() {
        try {
            int width = levelSettings.getLarguraMapa();
            int numGrayWolves = levelSettings.getNumLobosCinza();
            int numRedWolves = levelSettings.getNumLobosVermelhos();
            
            // Generate level with specified parameters
            generatedLevel = autoGenerator.generateLevel(width, numGrayWolves, numRedWolves);
            
            // Switch to generated level preview mode
            showInterfaces = false;
            showGeneratedLevel = true;
            
        } catch (Exception e) {
            e.printStackTrace();
            // If generation fails, return to interfaces
            showInterfaces = true;
            showGeneratedLevel = false;
        }
    }
    
    /**
     * Draws the generated level preview with instructions
     */
    private void drawGeneratedLevel(Graphics2D g) {
        fundo.desenha(g); // Draw background
        
        if (generatedLevel != null) {
            // Draw title
            g.setColor(corTitulo);
            g.setFont(fonteTitulo);
            g.drawString("Generated Level Preview", 90, 30);
            
            // Calculate drawing parameters
            int tileSize = 12; // Smaller tiles for overview
            int startX = 20;
            int startY = 60;
            int viewWidth = Math.min(generatedLevel.width, 40); // Show up to 40 tiles width
            int viewHeight = Math.min(generatedLevel.height, 15); // Show up to 15 tiles height
            
            // Draw tiles
            for (int y = 0; y < viewHeight; y++) {
                for (int x = 0; x < viewWidth; x++) {
                    int tileType = generatedLevel.tiles[y][x];
                    int drawX = startX + x * tileSize;
                    int drawY = startY + y * tileSize;
                    
                    // Color code different tile types for preview
                    Color tileColor = getTilePreviewColor(tileType);
                    g.setColor(tileColor);
                    g.fillRect(drawX, drawY, tileSize, tileSize);
                    
                    // Draw border for non-empty tiles
                    if (tileType != 0) {
                        g.setColor(Color.BLACK);
                        g.drawRect(drawX, drawY, tileSize, tileSize);
                    }
                }
            }
            
            // Draw monsters as colored dots
            for (LevelAutoGenerator.MonsterPosition monster : generatedLevel.monsters) {
                if (monster.x < viewWidth && monster.y < viewHeight) {
                    int monsterX = startX + monster.x * tileSize + tileSize/2;
                    int monsterY = startY + monster.y * tileSize + tileSize/2;
                    
                    // Different colors for different monster types
                    if (monster.type == LevelAutoGenerator.MonsterPosition.TYPE_GRAY_WOLF) {
                        g.setColor(Color.GRAY);
                    } else if (monster.type == LevelAutoGenerator.MonsterPosition.TYPE_RED_WOLF) {
                        g.setColor(Color.RED);
                    }
                    
                    g.fillOval(monsterX - 3, monsterY - 3, 6, 6);
                    g.setColor(Color.BLACK);
                    g.drawOval(monsterX - 3, monsterY - 3, 6, 6);
                }
            }
            
            // Draw level information
            g.setColor(Color.BLACK);
            g.setFont(fonteOpcoes);
            int infoY = startY + viewHeight * tileSize + 30;
            g.drawString("Level Size: " + generatedLevel.width + " x " + generatedLevel.height, startX, infoY);
            g.drawString("Gray Wolves: " + levelSettings.getNumLobosCinza(), startX, infoY + 15);
            g.drawString("Red Wolves: " + levelSettings.getNumLobosVermelhos(), startX, infoY + 30);
            
            // Draw instructions
            g.setColor(Color.BLUE);
            g.drawString("SPACE: Save level (Task 5)   R: Regenerate   ESC: Back to settings", startX, infoY + 60);
            
            // Draw legend
            int legendX = startX + 300;
            g.setColor(Color.BLACK);
            g.drawString("Legend:", legendX, infoY);
            
            // Legend items
            String[] legendItems = {"Ground", "Platform", "Portal", "Gray Wolf", "Red Wolf"};
            Color[] legendColors = {new Color(139, 69, 19), Color.LIGHT_GRAY, Color.MAGENTA, Color.GRAY, Color.RED};
            
            for (int i = 0; i < legendItems.length; i++) {
                g.setColor(legendColors[i]);
                g.fillRect(legendX, infoY + 15 + i * 15 - 8, 10, 10);
                g.setColor(Color.BLACK);
                g.drawRect(legendX, infoY + 15 + i * 15 - 8, 10, 10);
                g.drawString(legendItems[i], legendX + 15, infoY + 15 + i * 15);
            }
        }
    }
    
    /**
     * Gets preview color for different tile types
     */
    private Color getTilePreviewColor(int tileType) {
        switch (tileType) {
            case 0: // Empty
                return Color.WHITE;
            case 1: case 2: case 10: // Platform tiles
                return Color.LIGHT_GRAY;
            case 3: case 4: case 5: case 6: case 7: case 11: case 12: case 13: // Ground tiles
                return new Color(139, 69, 19); // Brown for ground
            case 16: // Portal
                return Color.MAGENTA;
            case 15: // Portal support
                return Color.PINK;
            default:
                return Color.CYAN; // Other tiles
        }
    }
}