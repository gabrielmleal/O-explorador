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
    private boolean showInterfaces = false;
    
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
        }
        catch(Exception e){
            e.printStackTrace();
        }   
    }
    
    //método herdado, que não precisa ser implementado
    public void inicializa(){
        escolhaAtual = 0; // Reseta a seleção quando entra no estado
        showInterfaces = false; // Hide interfaces when returning to main menu
    }
    
    //método que atualiza a tela do level constructor
    public void atualiza(){
        //somente as coordenadas do fundo devem ser atualizadas pelo thread
        fundo.atualiza();
    }
    
    //método que desenha o estado
    public void desenha(Graphics2D g){
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
        if(!showInterfaces) {
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
                    // Manual Constructor - Will be implemented in next task
                    // TODO: Start manual level editor with selected tiles/monsters
                }
                else if(escolhaAtual == 1) {
                    // Auto-generator - Will be implemented in next task
                    // TODO: Start auto-generation with current settings
                }
            }
        }
    }
    
    public void keyReleased(int k){
        
    }
    
    // Mouse event handling for palette interactions
    public void mousePressed(MouseEvent e) {
        if(showInterfaces) {
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
}