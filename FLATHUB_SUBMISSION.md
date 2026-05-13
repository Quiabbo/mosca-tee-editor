Breve orientação para submissão ao Flathub

Este arquivo é um lembrete curto dos passos mínimos para enviar o manifest do Mosca Tee ao Flathub. Mantive apenas o essencial.

Checklist mínima

- Verifique que `com.moscatee.MoscaTee.yml` está no repositório e aponta para versões públicas das fontes e dependências.
- Inclua `appdata` (metadados) e ícones no repositório.
- Teste localmente com `flatpak-builder --user --install build com.moscatee.MoscaTee.yml` e corrija erros.
- Garanta licença clara (GPL-3.0-or-later) e que o código não dependa de serviços privados.

Enviar para Flathub

1. Faça fork de https://github.com/flathub/flathub
2. Crie um branch com um nome claro (ex.: `add-com.moscatee.MoscaTee`).
3. Adicione `com.moscatee.MoscaTee.yml` e os arquivos necessários no diretório `data/` ou no repositório do app (conforme orientação do Flathub).
4. Abra um pull request explicando brevemente o que está sendo adicionado e como testar localmente.

Notas práticas

- Mantenha a descrição natural e curta — explique o que o app faz em 2–3 frases.
- Não inclua linguagem que pareça gerada por IA ou templates longos.
- Se o PR falhar em checks do build, corrija localmente e atualize o branch.

Se quiser, eu posso preparar o branch e o PR (após sua aprovação final do conteúdo).
