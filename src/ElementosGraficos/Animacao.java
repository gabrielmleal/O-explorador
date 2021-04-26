/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package ElementosGraficos;

import java.awt.image.BufferedImage;
import java.util.ArrayList;

/**
 *
 * @author Gabriel
 */
public class Animacao {
    
    //Array de imagens da animação
    private BufferedImage[] frames;
    
    //Imagem atual da animação
    private int frameAtual;
    
    //Tempo do sistema de início
    private long tempoInicio;
    
    //Intervalo entre as imagens da animação
    private int intervalo;
    
    //Se toda a animação foi executada
    private boolean foiExecutado;
    
    public Animacao(){
        foiExecutado = false;
    }
    
    //Definir o array de imagens da animação
    public void mudarFramesPara(BufferedImage[] frames){
        this.frames = frames;
        frameAtual = 0;
        tempoInicio = System.nanoTime();
        foiExecutado = false;
    }
    
    //muda o intervalo entre as imagens da animação
    public void mudarIntervaloPara(int intervalo){this.intervalo = intervalo;}
    
    //caso precise acessar o frame que está executando
    public void mudarFrameAtualPara(int frame){ frameAtual = frame;}
    
    //atualiza a imagem, tornando-a animada
    public void atualiza(){
        //caso o intervalo for -1, então a imagem ficará parada
        if(intervalo==-1) return;
        
        /*pega o tempo atual do sistema e diminui pelo tempo de inicio, e diminui por 1000000, assim
        é obtido os segundos da imagem*/
        long tempoDecorrido = (System.nanoTime()-tempoInicio)/1000000;
        //checa se o tempo que já foi executado foi maior que o intervalo
        if(tempoDecorrido>intervalo){
            frameAtual++;//se sim, incrementa para a próxima imagem
            tempoInicio = System.nanoTime();//atualiza o tempo de início do frame
        }
        
        //se todos os frames foram executados então
        if(frameAtual==frames.length){
            frameAtual = 0;//volta o frameAtual para o primeiro frame
            foiExecutado = true;//torna verdadeiro que já foi executada toda a animação
        }
    }
    
    
    //retorna o frame atual
    public int qualFrameAtual() {return frameAtual;}
    //retorna as imagens da animação
    public BufferedImage[] quaisSaoOsFrames() {return frames;}
    //retorna a imagem atual da animação
    public BufferedImage imagemAtual(){return frames[frameAtual];}
    //retorna se a animação já foi executada uma vez por completo
    public boolean checaFoiExecutado() {return foiExecutado;}
}
