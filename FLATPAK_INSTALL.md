# Instalação rápida via Flatpak — Mosca Tee

Guia direto para instalar Mosca Tee como Flatpak em distribuições Linux (por exemplo, Linux Mint).

## Passos rápidos

1. Instale o Flatpak e o flatpak-builder.

Ubuntu / Linux Mint:

```bash
sudo apt update
sudo apt install flatpak flatpak-builder
sudo flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
```

Fedora:

```bash
sudo dnf install flatpak flatpak-builder
sudo flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
```

Instale também os runtimes necessários (uma vez):

```bash
sudo flatpak install flathub org.freedesktop.Platform/x86_64/23.08
sudo flatpak install flathub org.freedesktop.Sdk/x86_64/23.08
sudo flatpak install flathub org.freedesktop.Sdk.Extension.node18/x86_64/23.08
```

## Construir e instalar (local)

Clone o repositório e use o script incluído:

```bash
git clone https://github.com/moscatee/mosca-tee.git
cd mosca-tee
chmod +x .flatpak-build.sh
./.flatpak-build.sh
```

Se preferir rodar manualmente com `flatpak-builder`:

```bash
mkdir -p build
flatpak-builder --force-clean --user --install build com.moscatee.MoscaTee.yml
```

## Executar

```bash
flatpak run com.moscatee.MoscaTee
```

Para ver mais detalhes de execução:

```bash
flatpak --verbose run com.moscatee.MoscaTee
```

## Desinstalar

```bash
flatpak uninstall com.moscatee.MoscaTee
```

## Problemas comuns

- `flatpak-builder: command not found` → instale `flatpak-builder`.
- `Runtime ... not installed` → instale os runtimes listados acima.
- Falha de build → verifique espaço em disco (2–3 GB), internet e saída de erro do `flatpak-builder --verbose`.

Comando útil de depuração:

```bash
flatpak-builder --verbose --force-clean --user --install build com.moscatee.MoscaTee.yml
```

Se quiser, eu simplifico mais este guia ou removo referências técnicas para deixá-lo ainda mais enxuto.

---

Suporte: abra uma issue em https://github.com/moscatee/mosca-tee/issues
