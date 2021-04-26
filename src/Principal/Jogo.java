/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package Principal;

import javax.swing.JFrame;

/**
 *
 * @author Gabriel
 */
public class Jogo {
    //Classe que desenha a janela principal do jogo
    public static void main(String[] args){
        JFrame jogo = new JFrame("O explorador"); //cria um novo JFrame
        jogo.setResizable(false);//Não é possível redimensionar
        jogo.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);//Tem a operação padrão de fechar de aplicativos java
        jogo.setContentPane(new JogoPanel());//A classe JogoPanel será o JPanel padrão do JFrame jogo
        jogo.pack();//Conserta as posições de desenho na tela
        jogo.setLocationRelativeTo(null);//Desenha o JFrame no centro da tela
        jogo.setVisible(true);//Faz o JFrame ser visível
        
    }
}
