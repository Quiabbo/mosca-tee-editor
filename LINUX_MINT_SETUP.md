# Instalando Mosca Tee no Linux Mint

## Requisitos

Você precisa ter Flatpak instalado. Se não tiver, execute:

```bash
sudo apt update
sudo apt install flatpak flatpak-builder
```

Também adicione o Flathub (repositório de Flatpaks):

```bash
sudo flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
```

## Instalando as dependências

O Flatpak precisa de alguns components da plataforma. Instale-os uma vez:

```bash
sudo flatpak install flathub org.freedesktop.Platform/x86_64/23.08
sudo flatpak install flathub org.freedesktop.Sdk/x86_64/23.08
sudo flatpak install flathub org.freedesktop.Sdk.Extension.node18/x86_64/23.08
sudo flatpak install flathub org.electronjs.Electron2.BaseApp/x86_64/23.08
```

## Build

Clone o repositório (se ainda não tiver):

```bash
git clone https://github.com/moscatee/mosca-tee.git
cd mosca-tee
```

Valide o ambiente:

```bash
chmod +x .flatpak-validate.sh
./.flatpak-validate.sh
```

Se tudo estiver ok, faça o build:

```bash
chmod +x .flatpak-build.sh
./.flatpak-build.sh
```

Isso vai levar alguns minutos.

## Testando

Depois de construído, teste assim:

```bash
flatpak run com.moscatee.MoscaTee
```

Ou procure "Mosca Tee" no seu menu de aplicações.

## Problemas?

Se o build falhar, geralmente é por falta de espaço em disco (~5GB necessários) ou internet lenta.

Tente novamente:

```bash
./.flatpak-build.sh
```

Se o app não abrir, veja os logs:

```bash
flatpak --verbose run com.moscatee.MoscaTee
```

## Próximo: Gravar Vídeo

Agora que está funcionando, você pode:

1. Abrir o app
2. Criar um design legal
3. Gravar com SimpleScreenRecorder: `sudo apt install simplescreenrecorder`
4. Publicar no YouTube
