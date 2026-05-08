# Mosca Tee — Editor de Design Profissional e Inclusivo

Mosca Tee é um editor gráfico de alto desempenho focado em privacidade, agilidade e inclusão. Foi planejado para ser uma alternativa robusta e gratuita a ferramentas proprietárias e tem como diferencial ser desenhado também para uso por pessoas cegas ou com baixa visão.

Esta versão foi adaptada para rodar como aplicação desktop via Electron e empacotada como Flatpak para distribuição via Flathub.

## Recursos principais

- Privacidade total: processamento 100% local
- Modo de acessibilidade nativo para pessoas cegas e com baixa visão
- Suporte avançado a PSD (camadas, textos, grupos)
- Remoção de fundo via IA e vetorizador (SVG) integrados
- Sem anúncios, sem login
- Mais de 275.000 ícones e integração com Google Fonts

## Autor

Idealizado e desenvolvido por **Filipi Hadji**.

## Rodar localmente (web/dev)

Pré-requisitos: Node.js 20+.

```bash
npm install
npm run dev
```

## Rodar como app Electron

```bash
# Em um terminal:
npm run dev
# Em outro terminal:
npm run electron
```

## Empacotamento Flatpak / Flathub

O diretório [`flatpak/`](flatpak/) contém o manifesto, metainfo, ícones e arquivo `.desktop` usados pela build do Flathub.

Para submeter ao Flathub você precisa de um arquivo `generated-sources.json` que pré-baixa todas as dependências npm (o sandbox do Flathub não tem rede). Ele é gerado a partir do `package-lock.json`:

```bash
./scripts/gen-flatpak-sources.sh
```

O script roda dentro de um container Docker, então funciona em macOS, Windows e Linux.

Em seguida, o `generated-sources.json` resultante é colocado **junto com o manifesto** dentro da PR no repositório do Flathub (não dentro deste repo).

Build local em uma máquina Linux (opcional, para testar antes de submeter):

```bash
flatpak-builder --user --install --force-clean build-dir flatpak/com.moscatee.Editor.yml
flatpak run com.moscatee.Editor
```

## Licença

Este projeto está sob a licença **AGPL-3.0-or-later**. Veja [LICENSE](LICENSE).
