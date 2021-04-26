/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package Principal;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.awt.image.BufferedImage;
import static java.awt.image.BufferedImage.TYPE_INT_RGB;
import javax.swing.JPanel;
import javax.imageio.ImageIO;
import java.io.IOException;
import java.util.Random;
import javax.imageio.ImageIO;
import javax.swing.JPanel;

import GerenciadorDeEstados.*;
/**
 *
 * @author Gabriel
 */

//Declara a classe, e implementa as interfaces Runnable, que controla o thread, e KeyListener, para interação com o teclado
public class JogoPanel extends JPanel implements Runnable,KeyListener {
    
    public static final int LARGURA = 320;//Largura padrão do JPanel
    public static final int ALTURA = 240;//Altura padrão do JPanel
    public static final int ESCALA = 2;/*Escala de multiplicação (Exemplo : ESCALA = 2 então LARGURA e ALTURA serão desenhado
    com o dobro de tamanho*/
    
    //declara thread
    private Thread thread;
    
    //declara controladores do thread
    private boolean rodando;
    private int FPS = 1000/60; //60 frames por segundo
    
    //declara elementos gráficos
    private BufferedImage imagem;
    private Graphics2D g;
    
    //declara o gerenciador de estado
    private GerenciadorEstado ge;
    
    //Construtor padrão
    public JogoPanel(){
        setPreferredSize(new Dimension(LARGURA*ESCALA, ALTURA*ESCALA));//Ajusta o tamanho do JPanel de acordo com a escala
        setFocusable(true);
    }
    
    //Método padrão do JPanel que sempre é chamada ao inicializar
    public void addNotify(){
        super.addNotify(); //pega tudo que o método faz por padrão
        if(thread==null){ //se o thread for nulo, então um novo thread será criado e inicializado
            thread = new Thread(this);
            thread.start();
        }
        addKeyListener(this);
    }
    
    
    //Método que indica ao thread onde começar sua execução
    public void run(){
        imagem = new BufferedImage(LARGURA, ALTURA, TYPE_INT_RGB);//Define a dimensão e sistema de cores da imagem principal
        g = (Graphics2D) imagem.getGraphics();//Pega a imagem principal e seta para Graphics, que desenha na tela
        rodando = true;//Atribui que o thread está rodando
        ge = new GerenciadorEstado();
        while(rodando){//Enquanto o thread rodar, vai atualizar e desenhar os elementos gráficos do jogo
            atualiza();
            desenha(g);
            desenhaNaTela();
            try{
                Thread.sleep(FPS);//Com um intervalo de 60 frames por segundo
            }
            catch(Exception e){
                e.printStackTrace();//caso algo interrompa o thread, será alertado com exception
            }
        }
        
    }
    
    //Função que atualiza o que será desenhado
    public void atualiza(){
        ge.atualiza();
    }
    
    //Função que define o que será desenhado
    public void desenha(Graphics2D g){
        ge.desenha(g);
    }
    
    //Função que desenha no JogoPanel
    public void desenhaNaTela(){
        Graphics g2 = this.getGraphics();
        g2.drawImage(imagem, 0, 0, LARGURA*ESCALA, ALTURA*ESCALA, null);
        g2.dispose();
    }
    
    //Sistema de entrada através do teclado
    public void keyPressed(KeyEvent k){
        ge.keyPressed(k.getKeyCode());
        
    }
    public void keyReleased(KeyEvent k){
        ge.keyReleased(k.getKeyCode());
    }
    public void keyTyped(KeyEvent k){
        
    }
    
}
