/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package ObjetosDoMapa;

import ElementosGraficos.Animacao;
import ElementosGraficos.Bloco;
import ElementosGraficos.MapaDeBlocos;
import java.awt.Graphics2D;
import java.awt.Rectangle;

/**
 *
 * @author Gabriel
 */
public abstract class ObjetoMapa {
    
    
    //Atributos relacionando o objeto ao mapa de blocos
    protected MapaDeBlocos mb;
    protected int tamanhoBloco;
    protected double xmapa, ymapa;
    
    //Coordenadas e vetores de movimento do objeto
    protected double x, y, dx, dy;
    
    //Dimensões do objeto, e de sua caixa de colisão
    protected int largura, altura, clargura, caltura;
    
    //Atributos de colisão
    protected int linhaAtual, colunaAtual;
    protected double xdest, ydest, xtemp, ytemp;
    protected boolean superiorDireito, superiorEsquerdo, inferiorDireito, inferiorEsquerdo;
    
    //Atributos de animação
    protected Animacao animacao;
    protected int acaoAtual, acaoAnterior;
    protected boolean olhandoDireita;
    
    //Ações do objeto
    protected boolean cima, baixo, direita, esquerda, caindo, pulando;
    
    //Atributos que define as caracteristicas do objeto
    protected double velMovimento, velMaxMovimento, velParar, velQueda, velMaxQueda, comecoPulo, velPararPulo;
    
    //Construtor do objeto de mapa
    public ObjetoMapa(MapaDeBlocos mb){
        this.mb = mb;
        tamanhoBloco = mb.qualTamanhoDoBloco();
    }
    
    /*Cria um retângulo delimitador, de acordo com as dimensões caltura e clargura, que foram feitas
    para checar se colide com algo */
    public Rectangle extraiRetanguloDelimitador(){
        return new Rectangle((int)x-clargura, (int)y-caltura, clargura, caltura);
    }
    
    //Usa o método do retângulo para ver se intercepta com outro, se sim, então colidiu
    public boolean checaColisao(ObjetoMapa o){
        Rectangle r1 = extraiRetanguloDelimitador();
        Rectangle r2 = o.extraiRetanguloDelimitador();
        return r1.intersects(r2);
    }
    
    /*Calcula se o personagem pode prosseguir para a próxima coordenada ou não, a partir das coordenadas
    atuais*/
    public void calculaLimites(double x, double y){
        
        /*Pega o número da linha e da coluna dos blocos ao redor, de acordo com a matriz mapa que indica
        os blocos do mapa*/
        int blocoEsquerda = (int)(x - clargura / 2) / tamanhoBloco;
        int blocoDireita = (int)(x+clargura/2-1)/ tamanhoBloco;
        int blocoCima = (int)(y-caltura/2)/ tamanhoBloco;
        int blocoBaixo = (int)(y+caltura/2-1)/ tamanhoBloco;
        
        //Caso a posição do objeto seja maior que a matriz do mapa, todos os blocos serão normais
        if(blocoEsquerda<0 || blocoDireita>=mb.qualNumDeCols() || blocoCima<0 || blocoBaixo>=mb.qualNumDeLinhas()){
            superiorDireito = superiorEsquerdo = inferiorDireito = inferiorEsquerdo = false;
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
    
    public void checaColisaoComMapa(){
        
        colunaAtual = (int)x/tamanhoBloco;
        linhaAtual = (int)y/tamanhoBloco;
        
        xdest = x+dx;
        ydest = y+dy;
        
        xtemp = x;
        ytemp = y;
        
        calculaLimites(x, ydest);
        if(dy<0){
            if(superiorEsquerdo || superiorDireito){
                dy=0;
                ytemp = linhaAtual * tamanhoBloco + caltura/2;
            }
            else ytemp+=dy;
        }
        if(dy>0){
            if(inferiorEsquerdo || inferiorDireito){
                dy=0;
                caindo=false;
                ytemp = (linhaAtual+1)*tamanhoBloco - caltura/2;
            }
            else ytemp+=dy;
        }
        
        calculaLimites(xdest, y);
        if(dx<0){
            if(superiorEsquerdo || inferiorEsquerdo){
                dx=0;
                xtemp = colunaAtual * tamanhoBloco + clargura/2;
            }
            else{
                xtemp+=dx;
            }
        }
        if(dx>0){
            if(superiorDireito || inferiorDireito){
                dx=0;
                xtemp = (colunaAtual+1) * tamanhoBloco - clargura/2;
            }
            else xtemp +=dx;
        }
        
        if(!caindo){
            calculaLimites(x, ydest+1);
            if(!inferiorEsquerdo && !inferiorDireito){
                caindo = true;
            }
        }
    }
    
    public int posX(){return (int)x;}
    public int posY(){return (int)y;}
    public int Largura(){return largura;}
    public int Altura(){return altura;}
    public int CLargura(){return clargura;}
    public int CAltura(){return caltura;}
    
    public void mudarPosicaoPara(double x, double y){
        this.x = x;
        this.y = y;
    }
    
    public void atualizarPosicaoMapa(){
        xmapa = mb.posX();
        ymapa = mb.posY();
    }
    
    public void Esquerda(boolean b) { esquerda = b; }
    public void Direita(boolean b) { direita = b; }
    public void Cima(boolean b) { cima = b; }
    public void Baixo(boolean b) { baixo = b; }
    public void Pulando(boolean b) { pulando = b; }
    
    public void desenha(Graphics2D g){
        atualizarPosicaoMapa();
        if(olhandoDireita)
            g.drawImage(animacao.imagemAtual(), (int)(x + xmapa - largura/2), (int)(y + ymapa - altura/2), null);
        else
            g.drawImage(animacao.imagemAtual(), (int)(x + xmapa - largura/2 + largura), (int)(y+ymapa-altura/2), -largura, altura, null);
    }
}