/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package ElementosGraficos;

import Principal.JogoPanel;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import javax.imageio.ImageIO;

/**
 *
 * @author Gabriel
 */
public class MapaDeBlocos {
    //define as coordenadas x e y do centro do mapa
    private double x, y;
    
    //limites das coordenadas de desenho da tela
    private double xmin, ymin, xmax, ymax;
    //velocidade em que a tela acompanha o jogador
    private double velocidadeTela;
    
    //matriz dos números que identificam os blocos
    private int[][] mapa;
    //tamanho do bloco em pixels
    private int tamanhoBloco;
    //número de linhas e número de colunas do mapa
    private int numLinhas, numCols;
    //largura e altura do mapa, que é o número de linhas e de colunas multiplicado pelo tamanho do bloco
    private int larguraMapa, alturaMapa;
    
    //imagem que possui o desenho de todos os blocos
    private BufferedImage imagemblocos;
    //quantidade de blocos em uma linha
    private int quantBlocos;
    //matriz de blocos que comporá o mapa
    private Bloco[][] blocos;
    
    //número de linhas e colunas até a posição atual do mapa
    private int linhas, colunas;
    //número de linhas e colunas que devem ser desenhada
    private int linhasDesenho, colunasDesenho;
    
    //construtor, que cria um inicializa um mapa de blocos a partir do tamanho de cada bloco
    public MapaDeBlocos(int tamanhoBloco){
        this.tamanhoBloco=tamanhoBloco;
        
        //define a quantidade de linhas que devem ser desenhadas
        linhasDesenho = JogoPanel.ALTURA / tamanhoBloco + 2;
        //define a quantidade de colunas qeu devem ser desenhadas
        colunasDesenho = JogoPanel.LARGURA / tamanhoBloco + 2;
        //determina a velocidade em que a tela vai seguir o player
        velocidadeTela = 0.07;
    }
    
    
    //método que carrega os blocos, a partir de um diretório
    public void carregarBlocos(String s){
        try{
            //carrega a imagem
            imagemblocos = ImageIO.read(getClass().getResourceAsStream(s));
            //calcula a quantidade de blocos em cada linha
            quantBlocos = imagemblocos.getWidth()/tamanhoBloco;
            //cria uma matriz composta por 2 linhas de blocos, e quantidade de colunas através de quantBlocos
            blocos = new Bloco[2][quantBlocos];
            
            //Cria uma variável auxiliar pra poder definir as imagens de bloco
            BufferedImage subimagem;
            for(int coluna=0;coluna<quantBlocos;coluna++){
                //Carrega todos os blocos da primeira linha e registra-os como blocos normais
                subimagem = imagemblocos.getSubimage(tamanhoBloco*coluna, 0, tamanhoBloco, tamanhoBloco);
                blocos[0][coluna] = new Bloco(subimagem, Bloco.NORMAL);
                //Carrega todos os blocos da segunda linha e registra-os como blocos bloqueados
                subimagem = imagemblocos.getSubimage(tamanhoBloco*coluna, tamanhoBloco, tamanhoBloco, tamanhoBloco);
                blocos[1][coluna] = new Bloco(subimagem, Bloco.BLOQUEADO);
            }
        }
        catch(Exception e){
            e.printStackTrace();
        }
    }
    
    //método que carrega o mapa a partir de um diretório
    public void carregarMapa(String s){
        try{
            //Carrega o arquivo
            InputStream in = getClass().getResourceAsStream(s);
            //Cria um leitor de arquivo
            BufferedReader br = new BufferedReader(new InputStreamReader(in));

            //A primeira linha será o número de colunas
            numCols = Integer.parseInt(br.readLine());
            //A segunda linha seráo número de linhas
            numLinhas = Integer.parseInt(br.readLine());
            
            //Define a quantidade de elementos da matriz de mapa, a largura e a altura
            mapa = new int[numLinhas][numCols];
            larguraMapa = numCols*tamanhoBloco;
            alturaMapa = numLinhas*tamanhoBloco;
            
            //define os limites do mapa
            xmin = JogoPanel.LARGURA-larguraMapa;
            xmax = 0;
            ymin = JogoPanel.ALTURA-alturaMapa;
            ymax = 0;
            
            //cria uma string auxiliar para ler os dados do mapa
            String divisor = "\\s+";
            for(int linha = 0; linha < numLinhas; linha++) {//enquanto não tiver lido todas as linhas
		String Linha = br.readLine();//lê a linha atual
		String[] partes = Linha.split(divisor);//divide a linha em strings diferentes, onde o divisor é a tecla espaço
		for(int coluna = 0; coluna < numCols; coluna++) {//enquanto não tiver lido todas as colunas
			mapa[linha][coluna] = Integer.parseInt(partes[coluna]);//grava na matriz mapa os dados do mapa
		}
            }
        }
        
        catch(Exception e){
            e.printStackTrace();
        }   
    }
    
    public int qualTamanhoDoBloco(){return tamanhoBloco;}
    public int posX(){return (int)x;}
    public int posY(){return (int)y;}
    public int qualLarguraDoMapa(){return larguraMapa;}
    public int qualAlturaDoMapa(){return alturaMapa;}
    public int qualNumDeCols(){return numCols;}
    public int qualNumDeLinhas(){return numLinhas;}
    
    //retorna o tipo de um bloco, de acordo com sua localização na matriz blocos
    public int qualTipo(int linha, int coluna){
        int lc = mapa[linha][coluna];
        int l = lc / quantBlocos;
        int c = lc % quantBlocos;
        return blocos[l][c].Tipo();
    }
    
    //muda a velocidade em que a tela acompanha o jogador
    public void mudarVelocidadeDeTela(double v){
        velocidadeTela = v;
    }
    
    //muda a posição do centro da tela para coordenadas x e y
    public void mudarPosicaoPara(double x, double y){
        //atualiza progressivamente de acordo com a velocidade da tela
        this.x += (x-this.x)*velocidadeTela;
        this.y += (y-this.y)*velocidadeTela;
        
        /*ajusta os limites de desenho, que são os limites do mapa, ou seja, caso chegue no fim da tela
        não desenhar partes em branco*/
        ajustarLimites();
        
        //define o número da linha atual do mapa
        linhas = (int)-this.y / tamanhoBloco;
        //define o número da coluna atual do mapa
	colunas = (int)-this.x / tamanhoBloco;
    }
    
    //método auxiliar para ajustar os limites
    public void ajustarLimites(){
        if(x<xmin) x=xmin;
        if(x>xmax) x=xmax;
        if(y<ymin) y=ymin;
        if(y>ymax) y=ymax;
    }
    
    //desenha o mapa
    public void desenha(Graphics2D g){
        //enquanto a linha atual, não for menor que a soma da linha atual com quantidade de linhas que devem ser desenhadas
        for(int linha=linhas;linha<linhas+linhasDesenho;linha++){
            if(linha>=numLinhas) break;//se a linha ultrapassar o número de linhas, interromper loop
            //enquanto o número da coluna atual for menor que a soma de colunas e colunas que devem ser desenhadas
            for(int coluna=colunas;coluna<colunas+colunasDesenho;coluna++){
                if(coluna>=numCols) break;//se ultrapassar a quantidade de colunas, então interromper o for
                if(mapa[linha][coluna]==0) continue;//caso o valor do mapa seja 0, então não desenhar nada
                
                int rc = mapa[linha][coluna]; //pega o valor do bloco do mapa
                int r = rc / quantBlocos; //pega a linha do bloco
                int c = rc % quantBlocos; //pega a coluna do bloco
                g.drawImage(blocos[r][c].Imagem(), (int)x+coluna*tamanhoBloco , (int)y+linha*tamanhoBloco, null);//desenha o bloco
            }
        }
    }    
}
