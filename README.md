
# Mosca Tee — Editor de Design Online

Mosca Tee é um editor de imagens e design online criado por Filipi Hadji. Este repositório contém o código-fonte do editor, scripts de build e empacotamento (incluindo configuração Flatpak), e os ativos usados pela aplicação.

Resumo do projeto (veja também a página Sobre do site):
- Editor baseado em web com ferramentas de desenho (pincel, seleção, formas, texto, camadas).
- Painéis de biblioteca e camadas, filtros e ajustes, e recursos de acessibilidade para melhor leitura e contraste.
- Destinado a criar e exportar designs e mockups rápidos diretamente no navegador.

## Autor

Filipi Hadji

## Rodar localmente

**Pré-requisitos:** Node.js

1. Instalar dependências:
   `npm install`
2. Configurar variáveis de ambiente (veja `.env`):
   - Ajuste as chaves necessárias caso utilize APIs externas.
3. Executar em modo de desenvolvimento:
   `npm run dev`

## Empacotamento

O diretório `flatpak/` contém o manifesto usado para criar o pacote Flatpak. Antes de enviar ao Flathub, atualize o campo `commit` em `flatpak/com.moscatee.Editor.yml` para o hash exato do commit que deseja publicar (o arquivo foi atualizado para apontar para este repositório e o commit atual).

---
Se quiser que eu reformule ou adicione mais detalhes (ex.: screenshots, instruções de release, badge de licença), diga o que prefere.
