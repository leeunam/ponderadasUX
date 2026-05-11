// ── Distribuição de Clientes por Renda ──
// Ponderada UX — Micro‑componente de visualização em p5.js
// Autor: Leunam Sousa de Jesus
//
// Features:
//   • Hover  → barra em destaque, demais com opacidade reduzida
//   • Click  → painel de detalhe com crédito médio + gráfico pizza
//   • Apenas 1 painel aberto por vez (toggle)
//   • Usa push/pop, translate, efeitos de mouse (cursor, hover glow)

// ═══════════════════════════════════════════
//  DADOS SIMULADOS
// ═══════════════════════════════════════════
const faixas = [
  {
    label: 'A', pct: 8, risco: 'baixo',
    creditoMedio: 15200,
    desc: 'Alta renda · Score 800+',
    fatias: [
      { label: 'Cartão',     pct: 45, cor: '#3B82F6' },
      { label: 'Consignado', pct: 30, cor: '#6366F1' },
      { label: 'Pessoal',    pct: 15, cor: '#8B5CF6' },
      { label: 'CDC',        pct: 10, cor: '#A78BFA' },
    ],
  },
  {
    label: 'B', pct: 14, risco: 'baixo',
    creditoMedio: 11800,
    desc: 'Renda média‑alta · Score 700–799',
    fatias: [
      { label: 'Cartão',     pct: 40, cor: '#3B82F6' },
      { label: 'Consignado', pct: 28, cor: '#6366F1' },
      { label: 'Pessoal',    pct: 20, cor: '#8B5CF6' },
      { label: 'CDC',        pct: 12, cor: '#A78BFA' },
    ],
  },
  {
    label: 'C', pct: 28, risco: 'concentracao',
    creditoMedio: 7450,
    desc: 'Renda média · Score 600–699',
    fatias: [
      { label: 'Cartão',     pct: 35, cor: '#06B6D4' },
      { label: 'Consignado', pct: 25, cor: '#0891B2' },
      { label: 'Pessoal',    pct: 25, cor: '#0E7490' },
      { label: 'CDC',        pct: 15, cor: '#155E75' },
    ],
  },
  {
    label: 'D', pct: 22, risco: 'concentracao',
    creditoMedio: 4900,
    desc: 'Renda média‑baixa · Score 500–599',
    fatias: [
      { label: 'Cartão',     pct: 30, cor: '#06B6D4' },
      { label: 'Consignado', pct: 32, cor: '#0891B2' },
      { label: 'Pessoal',    pct: 22, cor: '#0E7490' },
      { label: 'CDC',        pct: 16, cor: '#155E75' },
    ],
  },
  {
    label: 'E', pct: 18, risco: 'alto',
    creditoMedio: 2350,
    desc: 'Renda baixa · Score 400–499',
    fatias: [
      { label: 'Cartão',     pct: 22, cor: '#F43F5E' },
      { label: 'Consignado', pct: 38, cor: '#E11D48' },
      { label: 'Pessoal',    pct: 28, cor: '#BE123C' },
      { label: 'CDC',        pct: 12, cor: '#9F1239' },
    ],
  },
  {
    label: 'F', pct: 10, risco: 'alto',
    creditoMedio: 980,
    desc: 'Renda muito baixa · Score < 400',
    fatias: [
      { label: 'Cartão',     pct: 15, cor: '#F43F5E' },
      { label: 'Consignado', pct: 45, cor: '#E11D48' },
      { label: 'Pessoal',    pct: 30, cor: '#BE123C' },
      { label: 'CDC',        pct: 10, cor: '#9F1239' },
    ],
  },
];

const coresBarra = {
  baixo:        '#3B82F6',
  concentracao: '#06B6D4',
  alto:         '#F43F5E',
};
const coresHover = {
  baixo:        '#60A5FA',
  concentracao: '#22D3EE',
  alto:         '#FB7185',
};

const legendaItens = [
  { key: 'baixo',        label: 'Baixo Risco',      cor: '#3B82F6' },
  { key: 'concentracao', label: 'Concentração Alvo', cor: '#06B6D4' },
  { key: 'alto',         label: 'Alto Risco',        cor: '#F43F5E' },
];

// ═══════════════════════════════════════════
//  LAYOUT
// ═══════════════════════════════════════════
const CARD_W    = 540;
const CHART_H   = 280;          // altura fixa do gráfico de barras
const DETAIL_H  = 200;          // altura do painel de detalhe
const PAD_X     = 60;
const PAD_TOP   = 70;
const PAD_BOT   = 55;
const BAR_GAP   = 18;
const MAX_PCT   = 30;
const GRID      = [0, 15, 30];

// ═══════════════════════════════════════════
//  ESTADO
// ═══════════════════════════════════════════
let hoveredBar     = -1;
let selectedBar    = -1;         // ‑1 = nenhum painel aberto
let animProgress   = 0;          // entrada das barras  0→1
let detailAnim     = 0;          // abertura do detalhe 0→1
let pieRotation    = 0;          // rotação decorativa do pie
let cnv;

// ═══════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════
function setup() {
  cnv = createCanvas(CARD_W, CHART_H);
  textFont('Inter, Helvetica Neue, Arial, sans-serif');
  pixelDensity(2);
}

// ═══════════════════════════════════════════
//  DRAW
// ═══════════════════════════════════════════
function draw() {
  // ── animar entrada das barras ──
  if (animProgress < 1) animProgress = min(1, animProgress + 0.025);
  const ease = easeOutCubic(animProgress);

  // ── animar detalhe ──
  if (selectedBar >= 0) {
    detailAnim = min(1, detailAnim + 0.06);
  } else {
    detailAnim = max(0, detailAnim - 0.08);
  }
  const detailEase = easeOutCubic(detailAnim);

  // ── redimensionar canvas ──
  const targetH = CHART_H + (detailEase > 0.01 ? DETAIL_H * detailEase + 16 : 0);
  if (abs(height - targetH) > 1) resizeCanvas(CARD_W, targetH);

  // ── fundo ──
  background(255);

  // ── card shadow ──
  push();
  drawingContext.shadowColor = 'rgba(0,0,0,0.07)';
  drawingContext.shadowBlur  = 28;
  drawingContext.shadowOffsetY = 10;
  fill(255);
  rect(0, 0, CARD_W, height, 18);
  drawingContext.shadowColor = 'transparent';
  pop();

  // ══════════ GRÁFICO DE BARRAS ══════════
  push();
  translate(0, 0);  // origem do gráfico

  // ── título ──
  fill('#1E293B');
  noStroke();
  textSize(16);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text('Distribuição de Clientes por Renda', PAD_X, 20);

  // ── ícone ⋮ ──
  fill('#94A3B8');
  textSize(20);
  textAlign(RIGHT, TOP);
  text('⋮', CARD_W - 20, 16);

  // ── dimensões da área de plot ──
  const plotW = CARD_W - PAD_X - 30;
  const plotH = CHART_H - PAD_TOP - PAD_BOT;
  const barW  = (plotW - (faixas.length - 1) * BAR_GAP) / faixas.length;

  // ── grid + labels Y ──
  textSize(11);
  textStyle(NORMAL);
  textAlign(RIGHT, CENTER);
  for (const pct of GRID) {
    const y = PAD_TOP + plotH - (pct / MAX_PCT) * plotH;
    stroke('#E2E8F0');
    strokeWeight(1);
    drawingContext.setLineDash([4, 4]);
    line(PAD_X, y, PAD_X + plotW, y);
    drawingContext.setLineDash([]);
    noStroke();
    fill('#94A3B8');
    text(pct + '%', PAD_X - 8, y);
  }

  // ── eixo X ──
  stroke('#CBD5E1');
  strokeWeight(1.5);
  line(PAD_X, PAD_TOP + plotH, PAD_X + plotW, PAD_TOP + plotH);
  noStroke();

  // ── detectar hover ──
  hoveredBar = -1;
  for (let i = 0; i < faixas.length; i++) {
    const bx = PAD_X + i * (barW + BAR_GAP);
    const bh = (faixas[i].pct / MAX_PCT) * plotH * ease;
    const by = PAD_TOP + plotH - bh;
    if (mouseX >= bx && mouseX <= bx + barW && mouseY >= by && mouseY <= PAD_TOP + plotH) {
      hoveredBar = i;
    }
  }

  // ── barras ──
  for (let i = 0; i < faixas.length; i++) {
    const f  = faixas[i];
    const bx = PAD_X + i * (barW + BAR_GAP);
    const bh = (f.pct / MAX_PCT) * plotH * ease;
    const by = PAD_TOP + plotH - bh;
    const isHover    = (i === hoveredBar);
    const isSelected = (i === selectedBar);

    // ── opacidade: se alguma barra está hovered, as demais ficam opacas ──
    push();
    if (hoveredBar >= 0 && !isHover) {
      drawingContext.globalAlpha = 0.3;
    }

    const c = isHover || isSelected ? coresHover[f.risco] : coresBarra[f.risco];

    // sombra no hover
    if (isHover) {
      drawingContext.shadowColor = c + '55';
      drawingContext.shadowBlur  = 16;
      drawingContext.shadowOffsetY = 5;
    }

    // barra selecionada ganha borda
    if (isSelected) {
      stroke('#1E293B');
      strokeWeight(2.5);
    } else {
      noStroke();
    }

    fill(c);
    rect(bx, by, barW, bh, 6, 6, 0, 0);
    pop();

    // ── label do eixo X ──
    push();
    textSize(12);
    textAlign(CENTER, TOP);
    noStroke();
    if (f.risco === 'alto') {
      fill('#F43F5E');
      textStyle(BOLD);
    } else {
      fill('#475569');
      textStyle(NORMAL);
    }
    text(f.label, bx + barW / 2, PAD_TOP + plotH + 10);
    pop();

    // ── valor % acima da barra no hover ──
    if (isHover) {
      push();
      const tagW = 52;
      const tagH = 26;
      let tx = bx + barW / 2 - tagW / 2;
      let ty = by - tagH - 8;
      tx = constrain(tx, 4, CARD_W - tagW - 4);
      ty = max(4, ty);

      fill(30, 41, 59);
      noStroke();
      rect(tx, ty, tagW, tagH, 8);

      // pontinha
      triangle(
        tx + tagW / 2 - 5, ty + tagH,
        tx + tagW / 2 + 5, ty + tagH,
        tx + tagW / 2,     ty + tagH + 5
      );

      fill(255);
      textSize(12);
      textStyle(BOLD);
      textAlign(CENTER, CENTER);
      text(f.pct + '%', tx + tagW / 2, ty + tagH / 2);
      pop();
    }
  }

  // ── legenda ──
  push();
  const legY = CHART_H - 22;
  let legX = CARD_W / 2 - 155;
  textSize(11);
  textStyle(NORMAL);
  textAlign(LEFT, CENTER);
  noStroke();
  for (const item of legendaItens) {
    fill(item.cor);
    ellipse(legX, legY, 10, 10);
    fill('#475569');
    text(item.label, legX + 10, legY);
    legX += textWidth(item.label) + 30;
  }
  pop();

  pop(); // fim do gráfico de barras

  // ══════════ PAINEL DE DETALHE ══════════
  if (detailEase > 0.01 && selectedBar >= 0) {
    push();
    const panelY = CHART_H + 4;
    translate(0, panelY);

    // clip visual com alpha
    drawingContext.globalAlpha = detailEase;

    const f = faixas[selectedBar];

    // ── fundo do painel ──
    push();
    drawingContext.shadowColor = 'rgba(0,0,0,0.04)';
    drawingContext.shadowBlur  = 12;
    fill('#F8FAFC');
    stroke('#E2E8F0');
    strokeWeight(1);
    rect(12, 0, CARD_W - 24, DETAIL_H * detailEase - 8, 14);
    drawingContext.shadowColor = 'transparent';
    pop();

    // ── conteúdo só aparece se detalhe > 60% ──
    if (detailEase > 0.6) {
      const contentAlpha = map(detailEase, 0.6, 1, 0, 1);
      drawingContext.globalAlpha = contentAlpha;

      // ── indicador da faixa selecionada (chip) ──
      push();
      translate(28, 16);
      fill(coresBarra[f.risco]);
      noStroke();
      rect(0, 0, 32, 24, 6);
      fill(255);
      textSize(13);
      textStyle(BOLD);
      textAlign(CENTER, CENTER);
      text(f.label, 16, 12);
      pop();

      // ── info textual ──
      push();
      translate(70, 14);
      fill('#1E293B');
      noStroke();
      textSize(14);
      textStyle(BOLD);
      textAlign(LEFT, TOP);
      text('Faixa ' + f.label + ' — ' + f.desc, 0, 0);

      fill('#64748B');
      textSize(12);
      textStyle(NORMAL);
      text('Crédito médio concedido:', 0, 24);

      fill('#0F172A');
      textSize(20);
      textStyle(BOLD);
      text('R$ ' + f.creditoMedio.toLocaleString('pt-BR'), 0, 42);
      pop();

      // ── botão fechar (X) ──
      push();
      translate(CARD_W - 48, 12);
      const overClose = dist(mouseX, mouseY - panelY, CARD_W - 36, 22) < 14;
      fill(overClose ? '#F43F5E' : '#94A3B8');
      noStroke();
      textSize(16);
      textStyle(BOLD);
      textAlign(CENTER, CENTER);
      text('✕', 12, 10);
      pop();

      // ── gráfico pizza ──
      push();
      const pieX = 100;
      const pieY = 135;
      const pieR = 52;

      translate(pieX, pieY);
      // rotação decorativa
      pieRotation += 0.003;
      rotate(pieRotation);

      let acumulado = 0;
      for (const fatia of f.fatias) {
        const angulo = (fatia.pct / 100) * TWO_PI;
        fill(fatia.cor);
        noStroke();
        arc(0, 0, pieR * 2, pieR * 2, acumulado, acumulado + angulo, PIE);

        // detectar hover na fatia
        const mx = mouseX - pieX;
        const my = (mouseY - panelY) - pieY;
        const md = dist(0, 0, mx, my);
        if (md < pieR) {
          const mAngle = (atan2(my, mx) - pieRotation + TWO_PI * 10) % TWO_PI;
          if (mAngle >= acumulado && mAngle < acumulado + angulo) {
            // destaque
            push();
            stroke(255);
            strokeWeight(2);
            noFill();
            arc(0, 0, pieR * 2 + 6, pieR * 2 + 6, acumulado, acumulado + angulo);
            pop();
          }
        }

        acumulado += angulo;
      }

      // furo central (donut)
      fill('#F8FAFC');
      noStroke();
      ellipse(0, 0, pieR * 0.9, pieR * 0.9);

      // label central
      push();
      rotate(-pieRotation); // contra‑rotação para texto reto
      fill('#1E293B');
      textSize(10);
      textStyle(BOLD);
      textAlign(CENTER, CENTER);
      text('Crédito', 0, -5);
      fill('#64748B');
      textSize(8);
      textStyle(NORMAL);
      text('por tipo', 0, 7);
      pop();

      pop(); // fim translate pizza

      // ── legenda da pizza ──
      push();
      translate(170, 88);
      noStroke();
      for (let j = 0; j < f.fatias.length; j++) {
        const ft = f.fatias[j];
        push();
        translate(0, j * 24);

        // dot
        fill(ft.cor);
        ellipse(6, 6, 10, 10);

        // label
        fill('#334155');
        textSize(11);
        textStyle(NORMAL);
        textAlign(LEFT, CENTER);
        text(ft.label, 16, 6);

        // valor
        fill('#0F172A');
        textStyle(BOLD);
        textAlign(LEFT, CENTER);
        text(ft.pct + '%', 90, 6);

        // mini barra
        fill('#E2E8F0');
        rect(120, 2, 100, 8, 4);
        fill(ft.cor);
        rect(120, 2, ft.pct * detailEase, 8, 4);

        pop();
      }
      pop();

      // ── barra de crédito médio comparativa ──
      push();
      translate(170, 14);
      const maxCredito = 15200;
      const barPct = (f.creditoMedio / maxCredito) * 100;

      fill('#E2E8F0');
      noStroke();
      rect(225, 48, 80, 10, 5);
      fill(coresBarra[f.risco]);
      rect(225, 48, barPct / 100 * 80 * detailEase, 10, 5);

      fill('#94A3B8');
      textSize(9);
      textStyle(NORMAL);
      textAlign(LEFT, CENTER);
      text(round(barPct) + '% do máx.', 225, 70);
      pop();

    } // end contentAlpha gate

    pop(); // fim painel detalhe
  }

  // ── cursor ──
  if (hoveredBar >= 0) {
    cursor(HAND);
  } else if (selectedBar >= 0) {
    // verificar se sobre o botão fechar
    const panelY = CHART_H + 4;
    const overClose = dist(mouseX, mouseY - panelY, CARD_W - 36, 22) < 14;
    cursor(overClose ? HAND : ARROW);
  } else {
    cursor(ARROW);
  }
}

// ═══════════════════════════════════════════
//  INTERAÇÃO — mousePressed
// ═══════════════════════════════════════════
function mousePressed() {
  // ── clique no fechar (✕) ──
  if (selectedBar >= 0) {
    const panelY = CHART_H + 4;
    if (dist(mouseX, mouseY - panelY, CARD_W - 36, 22) < 14) {
      selectedBar = -1;
      return;
    }
  }

  // ── clique em uma barra ──
  if (hoveredBar >= 0) {
    if (selectedBar === hoveredBar) {
      selectedBar = -1;     // toggle off
    } else {
      selectedBar = hoveredBar;
      detailAnim  = 0;      // reiniciar animação
      pieRotation = 0;
    }
  }
}

// ═══════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════
function easeOutCubic(t) {
  return 1 - pow(1 - t, 3);
}
