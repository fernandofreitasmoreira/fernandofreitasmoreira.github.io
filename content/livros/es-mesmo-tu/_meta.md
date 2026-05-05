---
title: "És mesmo tu?"
subtitle: "Identidade, reconhecimento e o que significa ser pessoa numa era que tudo verifica"
author: "Fernando F. Moreira"
year: "2026"
version: "v0.6 — em revisão"
version_note: "esta é uma versão pública em aberto, ainda sujeita a revisão; agradeço comentários e correcções"
summary: "Volume 1 de uma colecção sobre cidadania digital. Sobre o que está em causa quando um sistema decide se somos mesmo nós, e o que se perde quando confundimos «ser humano» com «ser verificável»."
---

## Sobre este livro e os que se seguem

Comecei a escrever este livro enquanto preparava o doutoramento. Queria perceber, para mim antes de mais, o que é que está em jogo quando entregamos a uma máquina a tarefa de decidir se somos quem dizemos ser. Comecei pelas tecnologias, mas a pergunta foi-se transformando: deixou de ser técnica e passou a ser, ao mesmo tempo, política, jurídica, e filosófica.

O livro saiu maior do que esperava — e percebi, enquanto o escrevia, que **não cabia num só volume**. Há quatro perguntas que me perseguem e que se prendem à mesma trama: a forma como vivemos, somos vistos, e somos reconhecidos no espaço digital. Cada uma delas dará um livro. **Este é o primeiro de quatro.**

- **Volume 1 — *És mesmo tu?***  Sobre **identidade e reconhecimento**: como provamos quem somos a sistemas que não nos vêem, e o que se perde quando confundimos a pessoa com o sinal biométrico. *(é o livro que tens à frente)*
- **Volume 2 — *Estás a ser visto?***  Sobre **vigilância, privacidade e liberdade arquitectural**: o que muda quando tudo o que fazemos deixa rasto, e quem tem o poder de o ler.
- Volumes 3 e 4 — *em planeamento*. Continuarei o arco em torno da cidadania digital. Os títulos serão anunciados quando estiverem maduros.

Cada volume foi pensado para se ler **isoladamente** — não é preciso ter lido o anterior para o seguinte fazer sentido. Mas quem ler os quatro terá, no fim, uma pequena teoria coerente do que significa ser cidadão livre num mundo que tudo verifica.

## Como este livro encosta ao meu trabalho científico

Faço investigação na Universidade do Minho em **deteção de prova de vida em dispositivos pessoais** — em inglês, *on-device liveness detection*. Em Português corrente: como é que o teu telemóvel pode ter a certeza que quem está à frente da câmara és **tu**, e que **estás vivo no momento em que a câmara dispara**, sem precisar de enviar o teu rosto para o servidor de ninguém.

A tese organiza-se em **quatro linhas de trabalho**, e cada uma delas tenta resolver uma fragilidade diferente do problema:

- **MULTI-LIV — fusão multimodal.** Em vez de o sistema confiar só no rosto, combina vários sentidos: face, voz, gesto, ritmo. Um atacante pode falsificar um, raramente falsifica todos ao mesmo tempo. Funciona como o cérebro humano, que reconhece uma pessoa pela conjugação de sinais e não por um detalhe isolado.
- **FLEET-LIV — aprendizagem federada.** Em vez de juntar os dados biométricos de toda a gente num servidor central (uma tentação de vigilância à espera de um abuso), o modelo aprende **localmente** em cada dispositivo, e só partilha o que aprendeu — não os dados em si. A privacidade fica desenhada na arquitectura do sistema, não delegada à boa-fé de quem o opera.
- **ADVR-LIV — robustez adversarial.** Estes sistemas vão ser atacados por quem souber gerar *deepfakes*, máscaras 3D, vídeos sintéticos. A linha trabalha para que o detector continue a funcionar **quando o adversário sabe como o detector funciona** — uma exigência diferente, e mais dura, do que apenas «funcionar com inputs honestos».
- **XAI-LIV — explicabilidade.** Quando o sistema te recusa, deves ter o direito de saber **porquê**. Não basta uma probabilidade; é preciso uma explicação acessível, em linguagem humana, que possas contestar. Isto deixou de ser uma cortesia e passou a ser uma obrigação legal — o AI Act europeu exige-o.

Estas quatro linhas combinam-se num **artefacto integrador final** que é a contribuição principal da tese: um sistema único que cumpre os quatro requisitos em simultâneo, alinhado com o quadro normativo europeu (AI Act, RGPD, eIDAS 2.0, NIS 2, CRA).

**E o arco do livro?** Cada volume desta colecção encosta naturalmente a uma das quatro linhas. Não é uma exposição da tese para leigos — é uma reflexão para qualquer cidadão sobre as perguntas que cada linha de investigação tenta tecnicamente responder. A tese e o livro **partilham preocupações**, não conteúdos. Quem lê a tese encontra equações e referências; quem lê o livro encontra histórias, contradições, e perguntas em aberto.

## A quem é dirigido

A qualquer pessoa que use serviços digitais e queira perceber o que se passa nos bastidores quando um sistema decide se a deixa entrar, se lhe abre uma conta, se a reconhece. Não é necessário conhecimento técnico prévio — onde aparecem termos técnicos, são explicados; onde aparecem referências jurídicas, são contextualizadas. O **glossário** no final, organizado por conceitos, está pensado para ser consultado durante a leitura sempre que algum termo escapar.

## Sobre a forma

Tentei imitar, com respeito, a forma como o Carl Sagan escreveu sobre ciência durante toda a vida — partir de uma história concreta, ir buscar a técnica quando faz falta, e voltar à pergunta humana antes de fechar o capítulo. Cada capítulo abre com uma epígrafe (de autores que me ajudaram a pensar — Le Guin, Philip K. Dick, Hannah Arendt, Simone Weil, Walter Benjamin, Shoshana Zuboff, e o próprio Sagan no fecho). Cada capítulo termina com um pequeno painel — *o que fica deste capítulo* — para ajudar a fixar as ideias-chave, e uma transição para o seguinte.

## Versão e revisão pública

Esta é a **versão 0.6**, ainda em revisão. Publico-a em aberto antes de a fechar porque é assim que aprendi com investigadores que admiro (Donald Knuth, Richard Stallman, e tantos outros): é a forma de o livro melhorar mais depressa, e a forma honesta de avançar quando se está ainda a aprender o ofício. Se encontrares uma gralha, uma imprecisão técnica ou jurídica, uma passagem confusa, ou simplesmente quiseres dar uma opinião, ela é bem-vinda — podes contactar-me pelos canais listados em [/about/](/about/).

— *Fernando, Maio de 2026*
