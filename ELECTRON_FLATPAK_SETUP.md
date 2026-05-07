# Preparação Electron + Flatpak - Mosca Tee

## Resumo do que foi criado:

### 1. **Arquivos Electron** (raiz do projeto):
   - `main.js` - Arquivo principal do Electron que carrega o app Vite
   - `preload.js` - Script de preload para segurança
   - `electron-builder.json` - Configuração de build com appId: com.moscatee.Editor

### 2. **package.json atualizado**:
   - Campo "main": "main.js" adicionado
   - Nova dependência: electron@^32.0.0, electron-builder@^25.1.0, electron-is-dev@^3.0.1
   - Scripts adicionados:
     - `npm run electron` - Roda app em modo desenvolvimento
     - `npm run electron-build` - Builda Vite e compila com electron-builder

### 3. **Arquivos Flatpak** (pasta flatpak/):
   - `com.moscatee.Editor.yml` - Manifesto Flatpak para submissão no Flathub
     - appId correto: com.moscatee.Editor
     - runtime: org.freedesktop.Platform 24.08
     - finish-args otimizados (SEM --device=all, SEM --filesystem=/tmp)
     - build-commands configuradas para copiar dist/linux-unpacked/ para /app/share/moscatee/
   - `com.moscatee.Editor.desktop` - Arquivo desktop para integração Linux
   - `com.moscatee.Editor.metainfo.xml` - Metainfo para Flathub (GPL-3.0+, categoria Graphics)
   - `icons/` - Ícones nos tamanhos 48x48, 128x128, 256x256, 512x512

## ⚠️ IMPORTANTE: Próximo passo obrigatório

Antes de testar, você PRECISA atualizar o campo `commit:` no arquivo:
```
flatpak/com.moscatee.Editor.yml
```

Linha ~28, altere:
```yaml
commit: SUBSTITUIR_PELO_HASH_DO_COMMIT
```

Para o commit real do seu repositório. No terminal, execute:
```bash
cd /path/to/repo
git log -1 --format=%H
```

Cole esse hash no lugar.

## 🧪 TESTE LOCAL (Electron):

### Pré-requisitos:
- Node.js 20+ instalado
- npm instalado

### Passos:

1. **Instale dependências**:
   ```bash
   npm install
   ```

2. **Teste em modo desenvolvimento** (hot reload):
   ```bash
   npm run dev &  # Em um terminal
   npm run electron  # Em outro terminal
   ```
   Isso abrirá a janela do Electron conectada ao servidor Vite em localhost:5173

3. **Teste o build final** (como vai funcionar no Flathub):
   ```bash
   npm run electron-build
   ```
   O executável estará em: `dist/linux-unpacked/react-example`

4. **Rode o executável final**:
   ```bash
   ./dist/linux-unpacked/react-example
   ```

## 📦 TESTE NO FLATHUB (depois):

Uma vez que estiver tudo funcionando, para testar localmente no Flatpak:

```bash
# Instale ferramentas Flatpak (Linux apenas)
sudo apt install flatpak flatpak-builder

# Building (leva tempo na primeira vez)
flatpak-builder --force-clean build-dir flatpak/com.moscatee.Editor.yml

# Rodar localmente
flatpak run --devel com.moscatee.Editor
```

## 📋 Checklist antes do GitHub/Flathub:

- [ ] Atualizar commit hash em flatpak/com.moscatee.Editor.yml
- [ ] Testar `npm run electron` localmente
- [ ] Testar `npm run electron-build` e executável em dist/linux-unpacked/
- [ ] Verificar se main.js carrega corretamente dist/index.html em produção
- [ ] Atualizar README.md do projeto com instruções Electron
- [ ] Push para GitHub
- [ ] Submeter no Flathub

## ⚙️ Observações técnicas:

- O executável em dist/linux-unpacked/ se chama `react-example` (vem de "name" no package.json)
- O Flatpak cria um symlink `/app/bin/moscatee` apontando para esse executável
- Em desenvolvimento, Electron roda na porta 5173 (Vite dev server)
- Em produção, Electron carrega dist/index.html diretamente do arquivo
- Ícones instalados nos caminhos padrão do Linux: /usr/share/icons/hicolor/{size}/apps/
