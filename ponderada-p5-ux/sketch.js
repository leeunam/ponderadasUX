// ── Distribuição de Clientes por Renda ──
// Ponderada UX — Micro‑componente de visualização em p5.js
// Autor: Leunam Sousa de Jesus

// ───── dados simulados ─────
const faixas = [
  { label: 'A', pct: 8,  risco: 'baixo'         },
  { label: 'B', pct: 14, risco: 'baixo'         },
  { label: 'C', pct: 28, risco: 'concentracao'  },
  { label: 'D', pct: 22, risco: 'concentracao'  },
  { label: 'E', pct: 18, risco: 'alto'          },
  { label: 'F', pct: 10, risco: 'alto'          },
];

const cores = {
  baixo:         '#3B82F6',   // azul
  concentracao:  '#06B6D4',   // ciano
  alto:          '#F43F5E',   // rosa‑vermelho
};

const coresHover = {
  baixo:         '#60A5FA',
  concentracao:  '#22D3EE',
  alto:          '#FB7185',
};

const legendaItens = [
  { key: 'baixo',        label: 'Baixo Risco',       cor: cores.baixo        },
  { key: 'concentracao', label: 'Concentração Alvo',  cor: cores.concentracao },
  { key: 'alto',         label: 'Alto Risco',         cor: cores.alto         },
];

// ───── layout ─────
const cardW   = 520;
const cardH   = 310;
const padX    = 60;
const padTop  = 70;
const padBot  = 60;
const barGap  = 18;
const maxPct  = 30;
const gridLines = [0, 15, 30];

let hoveredBar = -1;
let animProgress = 0;        // 0 → 1  (entrada)
let tooltipAlpha = 0;

function setup() {
  createCanvas(cardW, cardH);
  textFont('Inter, Helvetica Neue, Arial, sans-serif');
  pixelDensity(2);
}

function draw() {
  // ── animar entrada ──
  if (animProgress < 1) {
    animProgress = min(1, animProgress + 0.025);
  }
  const ease = easeOutCubic(animProgress);

  // ── card background ──
  background(255);
  noStroke();
  fill(255);
  rect(0, 0, cardW, cardH, 18);

  // sombra sutil
  drawingContext.shadowColor = 'rgba(0,0,0,0.06)';
  drawingContext.shadowBlur  = 24;
  drawingContext.shadowOffsetY = 8;
  fill(255);
  rect(4, 4, cardW - 8, cardH - 8, 16);
  drawingContext.shadowColor = 'transparent';

  // ── título ──
  fill('#1E293B');
  textSize(16);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text('Distribuição de Clientes por Renda', padX, 20);

  // ícone de opções (⋮)
  fill('#94A3B8');
  textSize(20);
  textAlign(RIGHT, TOP);
  text('⋮', cardW - 20, 16);

  // ── área do gráfico ──
  const plotW = cardW - padX - 30;
  const plotH = cardH - padTop - padBot;
  const barW  = (plotW - (faixas.length - 1) * barGap) / faixas.length;

  // ── linhas de grade + labels Y ──
  textSize(11);
  textStyle(NORMAL);
  textAlign(RIGHT, CENTER);
  for (const pct of gridLines) {
    const y = padTop + plotH - (pct / maxPct) * plotH;
    stroke('#E2E8F0');
    strokeWeight(1);
    drawingContext.setLineDash([4, 4]);
    line(padX, y, padX + plotW, y);
    drawingContext.setLineDash([]);
    noStroke();
    fill('#94A3B8');
    text(pct + '%', padX - 8, y);
  }

  // ── eixo X (linha base) ──
  stroke('#CBD5E1');
  strokeWeight(1.5);
  line(padX, padTop + plotH, padX + plotW, padTop + plotH);
  noStroke();

  // ── detectar hover ──
  hoveredBar = -1;
  for (let i = 0; i < faixas.length; i++) {
    const bx = padX + i * (barW + barGap);
    const bh = (faixas[i].pct / maxPct) * plotH * ease;
    const by = padTop + plotH - bh;
    if (mouseX >= bx && mouseX <= bx + barW && mouseY >= by && mouseY <= padTop + plotH) {
      hoveredBar = i;
    }
  }

  // ── barras ──
  for (let i = 0; i < faixas.length; i++) {
    const f  = faixas[i];
    const bx = padX + i * (barW + barGap);
    const bh = (f.pct / maxPct) * plotH * ease;
    const by = padTop + plotH - bh;

    const isHover = (i === hoveredBar);
    const c = isHover ? coresHover[f.risco] : cores[f.risco];

    // sombra da barra
    if (isHover) {
      drawingContext.shadowColor = c + '44';
      drawingContext.shadowBlur  = 14;
      drawingContext.shadowOffsetY = 4;
    }

    fill(c);
    rect(bx, by, barW, bh, 6, 6, 0, 0);

    drawingContext.shadowColor = 'transparent';

    // label do eixo X
    textSize(12);
    textAlign(CENTER, TOP);
    fill(f.risco === 'alto' ? '#F43F5E' : '#475569');
    textStyle(f.risco === 'alto' ? BOLD : NORMAL);
    text(f.label, bx + barW / 2, padTop + plotH + 10);
  }

  // ── tooltip ──
  if (hoveredBar >= 0) {
    tooltipAlpha = min(255, tooltipAlpha + 18);
    const f  = faixas[hoveredBar];
    const bx = padX + hoveredBar * (barW + barGap);
    const bh = (f.pct / maxPct) * plotH * ease;
    const by = padTop + plotH - bh;

    const tipW = 90;
    const tipH = 32;
    let tipX = bx + barW / 2 - tipW / 2;
    let tipY = by - tipH - 8;
    tipX = constrain(tipX, 4, cardW - tipW - 4);
    tipY = max(4, tipY);

    const a = tooltipAlpha;
    fill(30, 41, 59, a);
    rect(tipX, tipY, tipW, tipH, 8);

    fill(255, 255, 255, a);
    textSize(12);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text('Faixa ' + f.label + ': ' + f.pct + '%', tipX + tipW / 2, tipY + tipH / 2);
  } else {
    tooltipAlpha = max(0, tooltipAlpha - 24);
  }

  // ── legenda ──
  const legY = cardH - 28;
  let legX = cardW / 2 - 160;
  textSize(11);
  textStyle(NORMAL);
  textAlign(LEFT, CENTER);
  for (const item of legendaItens) {
    fill(item.cor);
    ellipse(legX, legY, 10, 10);
    fill('#475569');
    text(item.label, legX + 10, legY);
    legX += textWidth(item.label) + 28;
  }

  // cursor
  cursor(hoveredBar >= 0 ? HAND : ARROW);
}

// ── utils ──
function easeOutCubic(t) {
  return 1 - pow(1 - t, 3);
}
