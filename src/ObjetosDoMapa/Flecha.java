/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package ObjetosDoMapa;

import ElementosGraficos.Animacao;
import ElementosGraficos.Bloco;
import ElementosGraficos.MapaDeBlocos;
import Principal.JogoPanel;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

/**
 *
 * @author Gabriel
 */
public class Flecha extends ObjetoMapa {

    
    private boolean hit, remove;
    
    private BufferedImage[] flechasprites;
    private BufferedImage[] hitsprites;
    
    public Flecha(MapaDeBlocos mb, boolean direita) {
        super(mb);
        
        olhandoDireita = direita;
        
        velMovimento = 6;
        
        if(direita) dx = velMovimento;
        else dx = -velMovimento;
        
        dy = 0.25;
        
        largura = altura = 30;
        clargura = caltura = 7;
        
        try{
            BufferedImage sprites = ImageIO.read(getClass().getResourceAsStream("/Imagens/flechasprite.gif"));
            
            flechasprites = new BufferedImage[1];
            flechasprites[0] = sprites.getSubimage(0, 0, largura, altura);
            
            hitsprites = new BufferedImage[3];
            for(int i=0;i<hitsprites.length;i++){
                hitsprites[i] = sprites.getSubimage(largura*i, altura, largura, altura);
            }
            animacao = new Animacao();
            animacao.mudarFramesPara(flechasprites);
            animacao.mudarIntervaloPara(-1);
        }
        catch(Exception e){
            e.printStackTrace();
        }
    }
    
    public void calculaLimites(double x, double y){
        
        /*Pega o número da linha e da coluna dos blocos ao redor, de acordo com a matriz mapa que indica
        os blocos do mapa*/
        int blocoEsquerda = (int)(x - clargura / 2) / tamanhoBloco;
        int blocoDireita = (int)(x+clargura/2-1)/tamanhoBloco;
        int blocoCima = (int)(y-caltura/2)/tamanhoBloco;
        int blocoBaixo = (int)(y+caltura/2-1)/tamanhoBloco;
        
        //Caso a posição do objeto seja maior que a matriz do mapa, todos os blocos serão normais
        if(blocoEsquerda<0 || blocoDireita>=mb.qualNumDeCols() || blocoCima<0 || blocoBaixo>=mb.qualNumDeLinhas()){
            superiorDireito = superiorEsquerdo = inferiorDireito = inferiorEsquerdo = false;
            remove = true;
        }
        //Caso contrário, checar o tipo de blocos ao redor para ver se é possível prosseguir ou não
        else{
            int sd = mb.qualTipo(blocoCima, blocoDireita);
            int se = mb.qualTipo(blocoCima, blocoEsquerda);
            int id = mb.qualTipo(blocoBaixo, blocoDireita);
            int ie = mb.qualTipo(blocoBaixo, blocoEsquerda);

            superiorDireito = sd == Bloco.BLOQUEADO;
            superiorEsquerdo = se == Bloco.BLOQUEADO;
            inferiorDireito = id == Bloco.BLOQUEADO;
            inferiorEsquerdo = ie == Bloco.BLOQUEADO;
        }
    }
        
    public boolean deveRemover(){ return remove;}
    
    public void hitou(){
        if(hit) return;
        hit = true;
        animacao.mudarFramesPara(hitsprites);
        animacao.mudarIntervaloPara(60);
        dx = dy = 0;
    }
    
    public boolean hit(){ return hit;}
    
    public void atualiza(){
        checaColisaoComMapa();
        mudarPosicaoPara(xtemp, ytemp);
        
        if((dx==0 || dy==0) && !hit){
            hitou();
        }
        animacao.atualiza();
        
        if(hit && animacao.checaFoiExecutado()){
            remove=true;
        }
    }
    
    public void desenha(Graphics2D g){
        this.atualizarPosicaoMapa();
        super.desenha(g);
    }
}
