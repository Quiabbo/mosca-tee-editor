
# Mosca Tee — Editor Gráfico Profissional e com Acessibilidade

Mosca Tee é um editor gráfico profissional criado por Filipi Hadji. Este repositório contém o código-fonte do editor, scripts de build e empacotamento (incluindo configuração Flatpak), e os ativos usados pela aplicação.

Resumo do projeto (veja também a página Sobre do site):

Mosca Tee — Editor de Design Profissional e Inclusivo
===============================================

O Mosca Tee é um editor gráfico de alto desempenho, focado em privacidade, agilidade e, acima de tudo, inclusão. Desenvolvido para ser uma alternativa robusta e gratuita a ferramentas proprietárias, ele se destaca por ser o primeiro editor do mundo planejado para ser utilizado também por pessoas cegas ou com baixa visão.

Esta versão foi adaptada para rodar como uma aplicação desktop via Electron, permitindo a distribuição nativa para sistemas Linux através da Flathub.

🚀 Principais Recursos
----------------------
- Privacidade Total: Processamento 100% local. Suas artes e arquivos nunca saem do seu computador.
- Inclusão Radical: Primeiro editor gráfico com modo de acessibilidade nativo para pessoas cegas e com baixa visão.
- Suporte Avançado a PSD: Abra e edite arquivos do Photoshop preservando camadas, textos e grupos.
- Ferramentas Inteligentes: Remoção de fundo via IA e vetorizador de imagens (SVG) integrados.
- Sem Barreiras: 100% gratuito, sem anúncios e sem necessidade de login ou cadastro.
- Vastos Recursos: Acesso a mais de 275.000 ícones e integração com Google Fonts.

✍️ Autor
-------
Idealizado e desenvolvido por Filipi Hadji.

O projeto nasceu com a missão de democratizar o acesso a ferramentas de design profissional no mundo.

🛠️ Como rodar localmente
-----------------------
Pré-requisitos

Node.js (recomendado v18 ou superior)

Instalação

Clone o repositório:

```bash
git clone https://github.com/seu-usuario/mosca-tee.git
cd mosca-tee
```

Instale as dependências:

```bash
npm install
```

Desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

📦 Empacotamento Flatpak
------------------------
O projeto está estruturado para ser distribuído no Flathub. Os manifestos e configurações específicas encontram-se no diretório `/flatpak`.

Para compilar e testar o Flatpak localmente:

- Certifique-se de ter o `flatpak-builder` instalado.
- Siga as instruções no arquivo `ELECTRON_FLATPAK_SETUP.md` para gerar o bundle final.

📄 Licença
---------
Este projeto está sob a licença GPL.
