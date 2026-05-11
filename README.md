# Mosca Tee — Editor Gráfico Profissional e com Acessibilidade

Mosca Tee é um editor gráfico de alto desempenho, focado em privacidade, agilidade e, acima de tudo, inclusão. Desenvolvido para ser uma alternativa robusta e gratuita a ferramentas proprietárias, ele se destaca por ser o primeiro editor do mundo planejado para ser utilizado também por pessoas cegas ou com baixa visão.

Esta versão foi adaptada para rodar como uma aplicação desktop via Electron, permitindo a distribuição nativa para sistemas Linux através da Flathub.

---

## 🚀 Principais Recursos

- **Privacidade Total:** Processamento 100% local. Suas artes e arquivos nunca saem do seu computador.
- **Inclusão Radical:** Primeiro editor gráfico com modo de acessibilidade nativo para pessoas cegas e com baixa visão (TTS em português).
- **Suporte Avançado a PSD:** Abra e edite arquivos do Photoshop preservando camadas, textos e grupos.
- **Ferramentas Inteligentes:** Remoção de fundo via IA e vetorizador de imagens (SVG) integrados.
- **Sem Barreiras:** 100% gratuito, sem anúncios e sem necessidade de login ou cadastro.
- **Vastos Recursos:** Acesso a mais de 275.000 ícones e integração com Google Fonts.

---

## 🐞 Autor

Idealizado e desenvolvido por **Filipi Hadji**.

O projeto nasceu com a missão de democratizar o acesso a ferramentas de design profissional no mundo.

---

## 🔧 Como rodar localmente (web/dev)

**Pré-requisitos:** Node.js 20+

```bash
npm install
npm run dev
```

Acesse em: `http://localhost:5173`

---

## 🖥️ Rodar como app Electron (desktop)

```bash
# Terminal 1 — servidor de desenvolvimento
npm run dev

# Terminal 2 — janela Electron
npm run electron
```

---

## 📦 Instalar via Flatpak no Linux

### Instalação para teste (build local a partir do código-fonte)

```bash
# Instalar dependências
sudo apt install flatpak flatpak-builder git

# Adicionar o repositório Flathub
flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo

# Instalar os runtimes necessários
flatpak install --user -y flathub \
  org.freedesktop.Platform//24.08 \
  org.freedesktop.Sdk//24.08 \
  org.electronjs.Electron2.BaseApp//24.08 \
  org.freedesktop.Sdk.Extension.node20//24.08

# Clonar e instalar
git clone -b release/flathub-v0.0.1 https://github.com/Quiabbo/mosca-tee-editor.git ~/moscatee
flatpak-builder --install --user --force-clean ~/build-dir ~/moscatee/flatpak/com.moscatee.Editor.yml

# Executar
flatpak run com.moscatee.Editor
```

> ⚠️ O primeiro build pode demorar 20–30 minutos. É necessário pelo menos **6 GB de espaço livre** em disco.

### Via Flathub (em breve)

Quando aprovado no Flathub, a instalação será simplesmente:

```bash
flatpak install flathub com.moscatee.Editor
```

---

## 🗂️ Estrutura do repositório

```
flatpak/                    # Manifesto, metainfo, ícones e .desktop para o Flathub
  com.moscatee.Editor.yml   # Manifesto principal do Flatpak
  com.moscatee.Editor.metainfo.xml
  com.moscatee.Editor.desktop
  icons/
generated-sources.json      # Cache offline das dependências npm (usado pelo Flatpak)
main.cjs                    # Processo principal do Electron
preload.cjs                 # Bridge seguro entre renderer e Node (expõe TTS)
src/                        # Código-fonte React/TypeScript da aplicação
public/                     # Assets estáticos
```

---

## ♿ Acessibilidade (TTS)

O Mosca Tee possui um modo de acessibilidade completo para pessoas cegas ou com baixa visão. No Flatpak/Linux, o TTS utiliza uma estratégia multi-backend:

1. **SSIP** — Conecta diretamente ao socket do `speech-dispatcher` do host
2. **spd-say** — Fallback via CLI caso o socket não esteja disponível
3. **Web Speech API** — Fallback final via Chromium (funciona sem speech-dispatcher)

Para garantir melhor qualidade de voz em português, instale o `speech-dispatcher` no host:

```bash
sudo apt install speech-dispatcher
systemctl --user enable --now speech-dispatcher
spd-say "Mosca Tee acessibilidade funcionando"
```

---

## 🏗️ Empacotamento Flatpak

O arquivo `generated-sources.json` pré-baixa todas as dependências npm para o build offline do Flathub. Para regenerá-lo após atualizar o `package-lock.json`:

```bash
./scripts/gen-flatpak-sources.sh
```

O script roda dentro de um container Docker — funciona em macOS, Windows e Linux.

---

## 📄 Licença

Este projeto está sob a licença **AGPL-3.0-or-later**. Veja [LICENSE](LICENSE).
