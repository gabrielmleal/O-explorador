/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package GerenciadorDeEstados;

import ElementosGraficos.ImagemDeFundo;
import ElementosGraficos.MapaDeBlocos;
import Principal.JogoPanel;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.event.KeyEvent;

/**
 *
 * @author Gabriel
 */
public class EstadoMenu extends Estado {//Estado de menu
    
    //declara uma imagem de fundo
    private ImagemDeFundo fundo;
    
    //declara um vetor de strings que apresenta as opções do menu
    private String[] opcoes;
    private int[] levelNumbers; // Maps menu options to level numbers
    //declara o valor da escolha atual
    private int escolhaAtual;
    //declara as fontes que serão escritas os dados do menu
    private Font fonteTitulo, fonteOpcoes;
    //declara as cores dos elementos
    private Color corTitulo, corOpcao, corSelecionado;
    
    //construtor, que é construído a partir de um gerenciador de estados
    public EstadoMenu(GerenciadorEstado ge){
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
        }
        catch(Exception e){
            e.printStackTrace();
        }   
    }
    
    //método herdado, que não precisa ser implementado
    public void inicializa(){
        // Update the menu options based on available levels
        atualizarOpcoes();
    }
    
    /**
     * Updates menu options based on available levels
     */
    private void atualizarOpcoes() {
        java.util.ArrayList<String> opcoesList = new java.util.ArrayList<>();
        java.util.ArrayList<Integer> levelsList = new java.util.ArrayList<>();
        
        // Add level options based on available levels
        int totalLevels = LevelSaver.getTotalLevelCount();
        for (int i = 1; i <= totalLevels; i++) {
            if (i == 1) {
                opcoesList.add("Jogar"); // Level 1 is still called "Jogar"
            } else {
                opcoesList.add("Level " + i);
            }
            levelsList.add(i);
        }
        
        // Add non-level options
        opcoesList.add("Level Constructor");
        levelsList.add(-1); // Special value for Level Constructor
        opcoesList.add("Ajuda");
        levelsList.add(-2); // Special value for Help
        opcoesList.add("Sair");
        levelsList.add(-3); // Special value for Exit
        
        // Convert to arrays
        opcoes = opcoesList.toArray(new String[0]);
        levelNumbers = new int[levelsList.size()];
        for (int i = 0; i < levelsList.size(); i++) {
            levelNumbers[i] = levelsList.get(i);
        }
        
        // Reset selection if it's out of bounds
        if (escolhaAtual >= opcoes.length) {
            escolhaAtual = 0;
        }
    }
    
    //método que atualiza a tela do menu
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
        g.drawString("O explorador", 120, 100);
        
        //muda a fonte para fonte de opções
        g.setFont(fonteOpcoes);
        //enquanto i for menor que o número da array da string de opções
        for(int i=0;i<opcoes.length;i++){
            if(escolhaAtual==i){/*se a string for a opção atual, então desenhar ela com uma cor diferenciada
                e desenhar um triângulo que aponte para a opção
                */
                g.setColor(corSelecionado);
                int[] x = {135,135,140};
                int[] y = {130+15*i-10,130+15*i,130+15*i-5};
                g.fillPolygon(x,y,3);
            }
            else{
                //caso contrário, simplemente dar a cor padrão de opções
                g.setColor(corOpcao);
            }
            //desenha a string da opção
            g.drawString(opcoes[i], 150, 130+15*i);
        }
    }
    
    
    //método auxiliar que seleciona a opção
    public void seleciona(){
        int levelNumber = levelNumbers[escolhaAtual];
        
        if (levelNumber > 0) {
            // This is a level option
            if (levelNumber == 1) {
                ge.mudarEstado(GerenciadorEstado.ESTADO_LEVEL_1);
            } else {
                ge.carregarLevel(levelNumber);
            }
        } else if (levelNumber == -1) {
            // Level Constructor
            ge.mudarEstado(GerenciadorEstado.ESTADO_LEVEL_CONSTRUCTOR);
        } else if (levelNumber == -2) {
            // Help
            ge.mudarEstado(GerenciadorEstado.ESTADO_AJUDA);
        } else if (levelNumber == -3) {
            // Exit
            System.exit(0);
        }
    }
    
    
    //sistema de key listener
    public void keyPressed(int k){
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
    }
    
    public void keyReleased(int k){
        
    }
}
