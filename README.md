# BOLA CAI

Jogo incremental de destruição por impacto. Solte a esfera, acompanhe os quiques calculados por gravidade e restituição do material, destrua placas e evolua sua bola.

## Rodar
Abra `index.html` em um navegador ou publique o repositório com GitHub Pages (Settings → Pages → Deploy from a branch → main → /root).

## Primeira versão
- Simulação de queda e quiques com gravidade, massa e coeficiente de restituição por material.
- Materiais de bola com evolução automática por XP de impacto.
- Placas com resistência crescente, incluindo progressão infinita após os 10 materiais iniciais, rachaduras, partículas e fragmentação.
- Salvamento versionado com migração de progresso antigo para evitar carregar integridade incompatível após atualizações.
- Oficina de potência, massa e precisão.
- Loja de esferas especiais e moedas.
- Salvamento local automático no navegador.

## Observação sobre a física
A simulação é um modelo de jogo em unidades escaladas, não uma simulação de engenharia certificada. A massa, restituição e dureza são parâmetros explícitos por material. O dano é calculado a partir da energia cinética estimada no impacto, dos atributos e da placa atual.

## Arquivos
- `index.html`: estrutura da interface.
- `style.css`: layout responsivo.
- `game.js`: física, progressão, renderização e salvamento.
