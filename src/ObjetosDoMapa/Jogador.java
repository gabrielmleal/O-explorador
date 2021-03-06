/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package ObjetosDoMapa;

/**
 *
 * @author Gabriel
 */
import ElementosGraficos.Animacao;
import ElementosGraficos.MapaDeBlocos;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.util.ArrayList;
import javax.imageio.ImageIO;


public class Jogador extends ObjetoMapa {
    
    //atributos do jogador
    private int vida, maxVida; 
    private boolean morto, imune;
    private long temporizadorImune;
    
    //Atributos de ataques e ações do jogador
    private boolean atirando, atirou, atacando, correndo, terminando;
    private double atacaAlcance;
    private ArrayList<Flecha> flechas;
    
    //Atributos de animação
    private ArrayList<BufferedImage[]> sprites;
    private int[] numFrames =  {1, 4, 2, 2, 6, 6, 9};
    
    
    //ações de animação
    private static final int PARADO = 0;
    private static final int ANDANDO = 1;
    private static final int PULANDO = 2;
    private static final int CAINDO = 3;
    private static final int ATACANDO = 4;
    private static final int ATIRANDO = 5;
    private static final int CORRENDO = 6;
    
    public Jogador(MapaDeBlocos mb){
        super(mb);
        
        largura = altura = 30;
        clargura = 20;
        caltura = 23;
        
        velMovimento = 0.15;
        velMaxMovimento = 1.2;
        velParar = 0.3;
        velQueda = 0.15;
        velMaxQueda = 4.0;
        comecoPulo = -4.8;
        velPararPulo = 0.3;
        
        vida = maxVida = 5;
        flechas = new ArrayList<>();
        atirou = false;
        
        atacaAlcance = 35;
        
        try{
            
            BufferedImage personagemsprite = ImageIO.read(getClass().getResourceAsStream("/Imagens/personagemsprite.gif"));
                    
            sprites = new ArrayList<>();
            for(int i=0;i<numFrames.length;i++){
                BufferedImage[] bi = new BufferedImage[numFrames[i]];
                for(int j=0;j<numFrames[i];j++){
                    if(i!=ATACANDO && i!=ATIRANDO){
                        bi[j] = personagemsprite.getSubimage(largura*j, altura*i, largura, altura);
                    }
                    else{
                        bi[j] = personagemsprite.getSubimage(largura*j*2, altura*i, largura*2, altura);
                    }
                }
                sprites.add(bi);
            }
            animacao = new Animacao();
            acaoAtual = PARADO;
            animacao.mudarFramesPara(sprites.get(PARADO));
            animacao.mudarIntervaloPara(-1);
        }
        catch(Exception e){
            e.printStackTrace();
        }
    }
    
    public int vidaAtual(){ return vida;}
    public int vidaMaxima(){ return maxVida;}
    public boolean estaAtacando(){ return atacando;}
    public boolean estaAtirando(){ return atirando;}
    
    public void ataca(){
        if(!atirando) atacando = true;
    }
    public void atira(){
        if(!atacando) atirando = true;
    }
    public void corre(boolean b){ correndo = b;}
    
    public void calculaVelocidade(){
        
        double velMaxMovimento = this.velMaxMovimento;
        
        if(correndo) velMaxMovimento *= 1.90;
        
        if(esquerda){
            dx-=velMovimento;
            if(dx<-velMaxMovimento){
                dx=-velMaxMovimento;
            }
        }
        else if(direita){
            dx+=velMovimento;
            if(dx>velMaxMovimento){
                dx=velMaxMovimento;
            }
        }
        else{
            if(dx>0){
                dx-=velParar;
                if(dx<0) dx = 0;
            }
            else if(dx<0){
                dx+=velParar;
                if(dx>0) dx=0;
            }
        }
        
        if((acaoAtual==ATACANDO || acaoAtual==ATIRANDO) && !(pulando || caindo)) dx=0;
        
        if(pulando && !caindo){
            dy = comecoPulo;
            caindo = true;
        }
        
        if(caindo){
            dy+=velQueda;
            
            if(dy>0) pulando = false;
            if(dy<0 && !pulando) dy +=velPararPulo;
            if(dy>velMaxQueda) dy = velMaxQueda;
        }
    }
    
    public void checaColisoes(ArrayList<Inimigo> inimigos){
        for(int i=0;i<inimigos.size();i++){
            Inimigo in = inimigos.get(i);
            
            if(atacando && animacao.qualFrameAtual()>=3 && animacao.qualFrameAtual()<=5){
                if(olhandoDireita){
                    if(in.posX()>x && in.posX()<x+atacaAlcance && in.posY() > y-altura/2 && in.posY()<y+altura/2){
                        in.hitEspada(false);
                        in.Direita(olhandoDireita);
                        in.Esquerda(!olhandoDireita);
                    }
                }
                else{
                    if(in.posX()<x && in.posX()>x-atacaAlcance && in.posY() > y-altura/2 && in.posY()<y+altura/2){
                        in.hitEspada(false);
                        in.Direita(olhandoDireita);
                        in.Esquerda(!olhandoDireita);
                    }
                }
            }
            
            for(int j=0;j<flechas.size();j++){
                if(flechas.get(j).checaColisao(in) && !flechas.get(j).hit()) {
                    flechas.get(j).hitou();
                    in.hitFlecha();
                }
            }
            if(this.checaColisao(in)){
                hit(in.Dano());
            }
        }
    }
    public void termina(){
        direita = esquerda = cima = baixo = correndo = atacando = atirando = false;
        dx=dy=0;
        y=0;
        terminando = true;
    }
    
    public boolean terminou(){
        return terminando;
    }
    
    public void hit(int dano){
        if(imune) return;
        vida-=dano;
        if(vida<0) vida=0;
        imune = true;
        temporizadorImune = System.nanoTime();
        if(olhandoDireita) dx = -3;
        else if(!olhandoDireita) dx = 3;
        dy = -2;
    }
    public void atualiza(){
        if(terminando) return;
        calculaVelocidade();
        checaColisaoComMapa();
        mudarPosicaoPara(xtemp, ytemp);
        
        if(imune){
            long diferencaTempo = (System.nanoTime()-temporizadorImune)/1000000;
            if(diferencaTempo>1500){
                imune = false;
            }
        }
        if(y>mb.qualNumDeLinhas()*mb.qualTamanhoDoBloco()+250) {
            mudarPosicaoPara(100, 170);
            vida--;
            if(vida<0) vida = 0;
            imune = true;
            temporizadorImune = System.nanoTime();
        }
        
        if(atirando && acaoAtual == ATIRANDO && animacao.qualFrameAtual()==4 && atirou==false ){
            Flecha f = new Flecha(mb, olhandoDireita);
            f.mudarPosicaoPara(x, y);
            flechas.add(f);
            atirou = true;
        }
        if(atirou==true && animacao.qualFrameAtual()!=4){
            atirou=false;
        }
        
        for(int i=0;i<flechas.size();i++){
            flechas.get(i).atualiza();
            if(flechas.get(i).deveRemover()){
                flechas.remove(i);
                i--;
            }
        }
        
        if(acaoAtual == ATACANDO){
            if(animacao.checaFoiExecutado()) atacando=false;
        }
        
        if(acaoAtual == ATIRANDO){
            if(animacao.checaFoiExecutado()) atirando=false;
        }
        
        //animações
        
        if(atacando){
            if(acaoAtual!=ATACANDO){
                acaoAtual=ATACANDO;
                animacao.mudarFramesPara(sprites.get(ATACANDO));
                animacao.mudarIntervaloPara(65);
                largura=60;
            }
        }
        else if(atirando){
            if(acaoAtual!=ATIRANDO){
                acaoAtual=ATIRANDO;
                animacao.mudarFramesPara(sprites.get(ATIRANDO));
                animacao.mudarIntervaloPara(80);
                largura=60;
            }
        }
        else if(dy>0){
            if(acaoAtual != CAINDO) {
		acaoAtual = CAINDO;
                animacao.mudarFramesPara(sprites.get(CAINDO));
		animacao.mudarIntervaloPara(100);
		largura = 30;
            }
        }
        else if(dy<0){
            if(acaoAtual!=PULANDO){
                acaoAtual=PULANDO;
                animacao.mudarFramesPara(sprites.get(PULANDO));
                animacao.mudarIntervaloPara(100);
                largura=30;
            }
        }
        else if(esquerda || direita){
            if(correndo){
                if(acaoAtual!=CORRENDO){
                    acaoAtual=CORRENDO;
                    animacao.mudarFramesPara(sprites.get(CORRENDO));
                    animacao.mudarIntervaloPara(60);
                    largura=30;
                }
            }
            else if(acaoAtual!=ANDANDO){
                acaoAtual=ANDANDO;
                animacao.mudarFramesPara(sprites.get(ANDANDO));
                animacao.mudarIntervaloPara(140);
                largura=30;
            }
        }
        else{
            if(acaoAtual!=PARADO){
                acaoAtual=PARADO;
                animacao.mudarFramesPara(sprites.get(PARADO));
                animacao.mudarIntervaloPara(400);
                largura=30;
            }
        }
        
        animacao.atualiza();
        
        if(acaoAtual!=ATACANDO && acaoAtual!=ATIRANDO){
            if(direita) olhandoDireita = true;
            if(esquerda) olhandoDireita = false;
        }
        if(vida==0) morto = true;
    }
    
    public boolean estaMorto(){return morto;}
    
    public void desenha(Graphics2D g){
        for(int i=0;i<flechas.size();i++){
            flechas.get(i).desenha(g);
        }
        g.setColor(Color.black);
        g.setFont(new Font("Arial",Font.PLAIN,14));
        g.drawString("Vidas : "+vida, 10, 20);
        
        if(terminando) return;
        if(imune){
            long diferencaTempo = (System.nanoTime()-temporizadorImune)/1000000;
            if(diferencaTempo/70%2==0) return;
        }
        super.desenha(g);
    }
}
