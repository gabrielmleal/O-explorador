/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package GerenciadorDeEstados;

import ElementosGraficos.ImagemDeFundo;
import ElementosGraficos.MapaDeBlocos;
import ObjetosDoMapa.Explosao;
import ObjetosDoMapa.Inimigo;
import ObjetosDoMapa.Jogador;
import ObjetosDoMapa.LoboCinza;
import ObjetosDoMapa.LoboVermelho;
import ObjetosDoMapa.Portal;
import Principal.JogoPanel;
import java.awt.Graphics2D;
import java.awt.Rectangle;
import java.awt.event.KeyEvent;
import java.util.ArrayList;

/**
 *
 * @author Gabriel
 */
public class Estado_Level1 extends Estado {//classe do estado de level 1
    
    private MapaDeBlocos mb;//cria um novo mapa
    private ImagemDeFundo ceu, terra;//cria um novo fundo
    private Jogador jogador;//cria um novo jogador
    private ArrayList<Inimigo> inimigos;
    private ArrayList<Explosao> explosoes;
    private Portal portal;
    
    private int contadorFase;
    private ArrayList<Rectangle> tb;
    private boolean comecaFase;
    
    
    
    //construtor
    public Estado_Level1(GerenciadorEstado ge){
        this.ge = ge;
        inicializa();
    }
    
    public void inicializa(){
        //cria um novo mapa de blocos, onde cada bloco é 30x30 pixels
        mb = new MapaDeBlocos(30);
        //carrega a imagem de blocos e define o número de cada bloco
        mb.carregarBlocos("/Imagens/blocos.gif");
        //carrega o mapa e define o que será desenhado, e atualizado
        mb.carregarMapa("/Mapas/level1-1.mapa");
        //muda a velocidade em que a tela muda de posição
        mb.mudarVelocidadeDeTela(0.05);
        
        //define uma nova imagem de fundo
        ceu = new ImagemDeFundo("/Imagens/Ceu.gif", 0);
        ceu.mudarMovimentoAutomatico(-0.2, 0);
        terra = new ImagemDeFundo("/Imagens/Terra.gif",0.1);
        
        //define um novo jogador
        jogador = new Jogador(mb);
        //a posição inicial do jogador, será na posição 100,100
        jogador.mudarPosicaoPara(100, 160);
        inicializaMonstros();
        
        
        explosoes = new ArrayList<>();
        
        portal = new Portal(mb);
        portal.mudarPosicaoPara(4875, 165);
        
        contadorFase=0;
        tb = new ArrayList<>();
        
    }
    
    public void inicializaMonstros(){
        inimigos = new ArrayList<>();
        
        Inimigo lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(730, 140);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(1680, 80);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(2000, 80);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(1725, 170);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(2000, 170);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(2275, 170);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(2500, 80);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(2760, 110);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(2950, 140);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(3045, 140);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(3150, 80);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(3480, 200);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(3765, 170);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(3815, 170);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(3930, 170);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(3970, 170);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(4010, 170);
        inimigos.add(lobo);
        lobo = new LoboCinza(mb);
        lobo.mudarPosicaoPara(4050, 170);
        inimigos.add(lobo);
        lobo = new LoboVermelho(mb);
        lobo.mudarPosicaoPara(4590, 50);
        inimigos.add(lobo);
        lobo = new LoboVermelho(mb);
        lobo.mudarPosicaoPara(4660, 50);
        inimigos.add(lobo);
        
    }
    //atualiza o level 1
    public void atualiza(){ 
        
         portal.atualiza();
        if(jogador.terminou() && portal.executou()){
            ge.mudarEstado(0);
        }
        
        if(portal.checaColisao(jogador)){
            portal.trocaAnimacao();
            jogador.termina();
        }
        if(jogador.estaMorto()){
            ge.mudarEstado(GerenciadorEstado.ESTADO_MENU);
        }
        ceu.atualiza();
        jogador.atualiza();//atualiza o jogador
        jogador.checaColisoes(inimigos);
        terra.mudarPosicaoPara(mb.posX(), mb.posY());//muda o fundo de acordo com a posição do mapa
        mb.mudarPosicaoPara(JogoPanel.LARGURA/2 - jogador.posX() ,JogoPanel.ALTURA/2 - jogador.posY());//muda o map de acordo com a posição do jogador
        for(int i=0;i<inimigos.size();i++){
            Inimigo in = inimigos.get(i);
            in.atualiza();
            if(in.estaMorto()) {
                inimigos.remove(i);
                i--;
                explosoes.add(new Explosao(mb, in.posX(), in.posY()));
            }
        }
        
        for(int i=0;i<explosoes.size();i++){
            explosoes.get(i).atualiza();
            if(explosoes.get(i).deveRemover()){
                explosoes.remove(i);
                i--;
            }
        }   
    }
                
    //desenha a fase
    public void desenha(Graphics2D g){
        
        ceu.desenha(g);
        terra.desenha(g);
        portal.desenha(g);
        mb.desenha(g);
        jogador.desenha(g);
        for(int i=0;i<inimigos.size();i++){
            inimigos.get(i).desenha(g);
        }
        for(int i=0;i<explosoes.size();i++){
            explosoes.get(i).desenha(g);
        }
    }
    
    public void keyPressed(int k){
        if(jogador.terminou()) return;
        if(k==KeyEvent.VK_RIGHT) jogador.Direita(true);
        if(k==KeyEvent.VK_LEFT) jogador.Esquerda(true);
        if(k==KeyEvent.VK_UP) {
            jogador.Pulando(true);
            // tenta pulo duplo se já estiver no ar
            jogador.tentarPuloDuplo();
        }
        if(k==KeyEvent.VK_DOWN) jogador.Baixo(true);
        if(k==KeyEvent.VK_Z) jogador.ataca();
        if(k==KeyEvent.VK_X) jogador.atira();
        if(k==KeyEvent.VK_C) jogador.corre(true);
        if(k==KeyEvent.VK_B) jogador.mudarPosicaoPara(4800, 50);
    }
    
    public void keyReleased(int k){
        if(k==KeyEvent.VK_RIGHT) jogador.Direita(false);
        if(k==KeyEvent.VK_LEFT) jogador.Esquerda(false);
        if(k==KeyEvent.VK_UP) jogador.Pulando(false);
        if(k==KeyEvent.VK_DOWN) jogador.Baixo(false);
        if(k==KeyEvent.VK_C) jogador.corre(false);
    }
    
}
