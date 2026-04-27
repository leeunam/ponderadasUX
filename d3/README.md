# Ponderada UX

> **Aluno:** Leunam Sousa de Jesus
> **Tema escolhido:** Tema A — Visualizações do Projeto

---

## Contexto

O intuito foi dar continuidade a base desenvolvida pelo **Yuri** e **Rayssa** na **Ideia 3 — Simulação Operacional**. A visualização original exibia um mapa de nós operacionais (bases, recursos e focos de incêndio) e permitia ao usuário visualizar alocação de recurso por meio de arestas entre nós recursos e focos de incêndios.

A contribuição desta entrega consiste em algumas entregas, sendo elas:

- Clique no Foco

Quando o usuário clica em um **nó de ocorrência (foco de incêndio)**:

1. Todos os nós de recurso recebem um **pulso de atenção** (animação com `.transition()`), simulando o algoritmo "visitando" cada nó.
2. Cada recurso é avaliado com base em seu **peso de atendimento** (distância ao foco, capacidade operacional e disponibilidade).
3. O recurso com **melhor pontuação** fica em evidência, aumentando a escala e mudando de cor.
4. Uma **aresta animada** é traçada do recurso selecionado até o foco, representando o recurso sugerido pelo algorítmo.


- Brush

O usuário pode selecionar qualquer **nó de recurso** clicando sobre ele para ativar o modo de inspeção:

- O painel lateral exibe o **peso calculado** do recurso em relação ao foco ativo.
- Uma **barra de pontuação** (escala de 0 a 5) mostra visualmente o quão adequado é aquele recurso para atender a ocorrência.
- O recurso selecionado fica destacado no mapa com uma borda pulsante.

A interação de seleção individual utiliza o conceito de `brush` — foco pontual em um elemento para revelar detalhes que não estão visíveis por padrão no diagrama.

### Zoom e Pan

O mapa suporta navegação livre via:

- **Zoom:** scroll do mouse ou pinch no touch.
- **Pan:** clique e arraste no fundo da área operacional.

Isso permite ao usuário explorar regiões específicas do mapa com mais detalhe, especialmente útil quando vários focos e recursos estão próximos.

---

## Dados Utilizados

Os dados são definidos em `simulacao-ambiente.js` e representam um ambiente operacional simplificado inspirado na região do Vale do Paraíba / Litoral Sul de SP — área de atuação real do projeto parceiro.

| Tipo | Qtd | Descrição |
|------|-----|-----------|
| Bases | 4 | Base Leste (Mogi), Base Vale (SJC), Base Serra (Cubatão), Base Sul (Registro) |
| Recursos | 5 | Caminhão AT-01, Aeronave HE-01, Brigada BR-02, 4x4 VT-04, Caminhão AT-03 |
| Ocorrências | 4 | Focos de incêndio com níveis de severidade 2 a 5 e área queimada em hectares |