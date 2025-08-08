/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package GerenciadorDeEstados;

import ElementosGraficos.ImagemDeFundo;
import Principal.JogoPanel;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.event.KeyEvent;

/**
 *
 * @author Gabriel
 */
public class EstadoAjuda extends Estado {//Estado de ajuda
    
    //declara uma imagem de fundo
    private ImagemDeFundo fundo;
    
    //declara as fontes que serão escritas os dados da ajuda
    private Font fonteTitulo, fonteTexto, fonteControles;
    //declara as cores dos elementos
    private Color corTitulo, corTexto, corControles;
    
    //construtor, que é construído a partir de um gerenciador de estados
    public EstadoAjuda(GerenciadorEstado ge){
        this.ge=ge;
        try{
            //carrega a imagem de fundo (mesmo fundo do menu)
            fundo = new ImagemDeFundo("/Imagens/menubg.gif",1);
            //coloca um movimento automático de 0.1 pixel a cada execução do thread
            fundo.mudarMovimentoAutomatico(-0.1, 0);
            
            //define as fontes
            fonteTitulo = new Font("Arial",Font.PLAIN,16);
            fonteTexto = new Font("Arial",Font.PLAIN,10);
            fonteControles = new Font("Arial",Font.PLAIN,9);

            //define as cores (seguindo o padrão do menu)
            corTitulo = Color.RED.darker();
            corTexto = Color.BLACK;
            corControles = Color.BLUE.darker();
        }
        catch(Exception e){
            e.printStackTrace();
        }   
    }
    
    //método herdado, que não precisa ser implementado
    public void inicializa(){
        
    }
    
    //método que atualiza a tela da ajuda
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
        g.drawString("AJUDA - O Explorador", 80, 60);
        
        //define a cor e fonte do texto explicativo
        g.setColor(corTexto);
        g.setFont(fonteTexto);
        
        //Objetivo do jogo
        g.drawString("OBJETIVO:", 20, 85);
        g.drawString("Explore o mundo, derrote inimigos lobos e chegue", 20, 100);
        g.drawString("ao portal para avancar de nivel!", 20, 115);
        
        //Controles
        g.setColor(corControles);
        g.drawString("CONTROLES:", 20, 140);
        g.setColor(corTexto);
        g.drawString("Setas <- -> : Mover para esquerda/direita", 20, 155);
        g.drawString("Seta cima  : Pular", 20, 170);
        g.drawString("Z          : Ataque corpo-a-corpo (espada)", 20, 185);
        g.drawString("X          : Ataque a distancia (flechas)", 20, 200);
        g.drawString("C (segurar): Correr mais rapido", 20, 215);
        
        //Informação de retorno ao menu
        g.setColor(corControles);
        g.drawString("Pressione ENTER para voltar ao menu", 60, 240);
    }
    
    //sistema de key listener
    public void keyPressed(int k){
        if(k==KeyEvent.VK_ENTER){
            //volta para o menu principal
            ge.mudarEstado(GerenciadorEstado.ESTADO_MENU);
        }
    }
    
    public void keyReleased(int k){
        
    }
}