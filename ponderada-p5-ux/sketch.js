const faixas = [
  { label: 'A', pct: 8,  risco: 'baixo',       renda: 'Acima de R$ 10k',  inadimplencia: 2,  creditoMedio: 15200 },
  { label: 'B', pct: 14, risco: 'baixo',        renda: 'R$ 5k – R$ 10k',   inadimplencia: 5,  creditoMedio: 11800 },
  { label: 'C', pct: 28, risco: 'concentracao', renda: 'R$ 3k – R$ 5k',    inadimplencia: 12, creditoMedio: 7450  },
  { label: 'D', pct: 22, risco: 'concentracao', renda: 'R$ 1,5k – R$ 3k',  inadimplencia: 18, creditoMedio: 4900  },
  { label: 'E', pct: 18, risco: 'alto',         renda: 'R$ 700 – R$ 1,5k', inadimplencia: 31, creditoMedio: 2350  },
  { label: 'F', pct: 10, risco: 'alto',         renda: 'Até R$ 700',        inadimplencia: 47, creditoMedio: 980   },
];

const cores = {
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
  { label: 'Baixo Risco',       cor: '#3B82F6' },
  { label: 'Concentração Alvo', cor: '#06B6D4' },
  { label: 'Alto Risco',        cor: '#F43F5E' },
];

const MAX_CREDITO = 15200;

const CARD_W  = 520;
const CARD_H  = 310;
const PANEL_W = 200;
const GAP     = 16;
const padX    = 60;
const padTop  = 70;
const padBot  = 60;
const barGap  = 18;
const maxPct  = 30;

let hoveredBar   = -1;
let selectedBars = [];
let animProgress = 0;

function setup() {
  createCanvas(CARD_W, CARD_H);
  textFont('Inter, sans-serif');
  pixelDensity(2);
}

function draw() {
  const targetW = CARD_W + selectedBars.length * (PANEL_W + GAP);
  if (width !== targetW) resizeCanvas(targetW, CARD_H);

  clear();

  if (animProgress < 1) animProgress = min(1, animProgress + 0.025);
  const ease = easeOutCubic(animProgress);

  drawChart(ease);

  for (let j = 0; j < selectedBars.length; j++) {
    drawPanel(selectedBars[j], j);
  }

  let overX = false;
  for (let j = 0; j < selectedBars.length; j++) {
    const ox = CARD_W + GAP + j * (PANEL_W + GAP);
    if (dist(mouseX, mouseY, ox + PANEL_W - 28, 16) <= 12) overX = true;
  }
  cursor(hoveredBar >= 0 || overX ? HAND : ARROW);
}

function drawChart(ease) {
  push();

  fill(255);
  noStroke();
  rect(0, 0, CARD_W, CARD_H, 16);

  const plotW = CARD_W - padX - 30;
  const plotH = CARD_H - padTop - padBot;
  const barW  = (plotW - (faixas.length - 1) * barGap) / faixas.length;

  fill('#1E293B');
  textSize(16);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text('Distribuição de Clientes por Renda', padX, 20);

  fill('#94A3B8');
  textSize(20);
  textAlign(RIGHT, TOP);
  text('⋮', CARD_W - 20, 16);

  textSize(11);
  textStyle(NORMAL);
  textAlign(RIGHT, CENTER);
  for (const pct of [0, 15, 30]) {
    const y = padTop + plotH - (pct / maxPct) * plotH;
    stroke('#E2E8F0');
    strokeWeight(1);
    line(padX, y, padX + plotW, y);
    noStroke();
    fill('#94A3B8');
    text(pct + '%', padX - 8, y);
  }

  stroke('#CBD5E1');
  strokeWeight(1.5);
  line(padX, padTop + plotH, padX + plotW, padTop + plotH);
  noStroke();

  hoveredBar = -1;
  for (let i = 0; i < faixas.length; i++) {
    const bx = padX + i * (barW + barGap);
    const bh = (faixas[i].pct / maxPct) * plotH * ease;
    const by = padTop + plotH - bh;
    if (mouseX >= bx && mouseX <= bx + barW && mouseY >= by && mouseY <= padTop + plotH) {
      hoveredBar = i;
    }
  }

  for (let i = 0; i < faixas.length; i++) {
    const f  = faixas[i];
    const bx = padX + i * (barW + barGap);
    const bh = (f.pct / maxPct) * plotH * ease;
    const by = padTop + plotH - bh;

    const isSelected = selectedBars.includes(i);
    const isActive   = (i === hoveredBar || isSelected);
    fill(isActive ? coresHover[f.risco] : cores[f.risco]);
    noStroke();
    rect(bx, by, barW, bh, 6, 6, 0, 0);

    if (isSelected) {
      fill(cores[f.risco]);
      ellipse(bx + barW / 2, padTop + plotH + 22, 5, 5);
    }

    textSize(12);
    textAlign(CENTER, TOP);
    fill(f.risco === 'alto' ? '#F43F5E' : '#475569');
    textStyle(f.risco === 'alto' ? BOLD : NORMAL);
    text(f.label, bx + barW / 2, padTop + plotH + 10);
  }

  if (hoveredBar >= 0) {
    const f    = faixas[hoveredBar];
    const bx   = padX + hoveredBar * (barW + barGap);
    const bh   = (f.pct / maxPct) * plotH * ease;
    const by   = padTop + plotH - bh;
    const tipW = 90;
    const tipH = 32;
    const tipX = constrain(bx + barW / 2 - tipW / 2, 4, CARD_W - tipW - 4);
    const tipY = max(4, by - tipH - 8);

    fill(30, 41, 59);
    noStroke();
    rect(tipX, tipY, tipW, tipH, 8);
    fill(255);
    textSize(12);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text('Faixa ' + f.label + ': ' + f.pct + '%', tipX + tipW / 2, tipY + tipH / 2);
  }

  const legY = CARD_H - 28;
  let legX = CARD_W / 2 - 155;
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

  pop();
}

function drawPanel(barIndex, panelIndex) {
  const f       = faixas[barIndex];
  const offsetX = CARD_W + GAP + panelIndex * (PANEL_W + GAP);
  const isHoverX = dist(mouseX, mouseY, offsetX + PANEL_W - 28, 16) <= 12;
  const trackW  = PANEL_W - 36;

  push();
  translate(offsetX, 0);

  fill(255);
  noStroke();
  rect(0, 0, PANEL_W, CARD_H, 16);

  fill(isHoverX ? '#E2E8F0' : '#F1F5F9');
  ellipse(PANEL_W - 28, 16, 22, 22);
  fill('#64748B');
  textSize(14);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text('×', PANEL_W - 28, 17);

  fill(cores[f.risco]);
  ellipse(22, 22, 12, 12);
  fill('#1E293B');
  textSize(16);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text('Faixa ' + f.label, 34, 22);

  textAlign(LEFT, TOP);
  textStyle(NORMAL);

  fill('#94A3B8');
  textSize(10);
  text('FAIXA DE RENDA', 18, 40);
  fill('#334155');
  textSize(12);
  text(f.renda, 18, 52);

  fill('#94A3B8');
  textSize(10);
  text('PARTICIPAÇÃO', 18, 70);
  fill('#334155');
  textSize(18);
  textStyle(BOLD);
  text(f.pct + '%', 18, 82);

  noStroke();
  fill('#E2E8F0');
  rect(18, 103, trackW, 6, 3);
  fill(cores[f.risco]);
  rect(18, 103, trackW * (f.pct / 100), 6, 3);

  fill('#94A3B8');
  textSize(10);
  textStyle(NORMAL);
  text('INADIMPLÊNCIA', 18, 116);
  fill('#334155');
  textSize(18);
  textStyle(BOLD);
  text(f.inadimplencia + '%', 18, 128);

  fill('#E2E8F0');
  rect(18, 149, trackW, 6, 3);
  fill(f.inadimplencia > 20 ? '#F43F5E' : cores.concentracao);
  rect(18, 149, trackW * (f.inadimplencia / 50), 6, 3);

  fill('#94A3B8');
  textSize(10);
  textStyle(NORMAL);
  text('CRÉDITO MÉDIO', 18, 162);
  fill('#334155');
  textSize(14);
  textStyle(BOLD);
  text('R$ ' + f.creditoMedio.toLocaleString('pt-BR'), 18, 174);

  fill('#E2E8F0');
  rect(18, 193, trackW, 6, 3);
  fill(cores[f.risco]);
  rect(18, 193, trackW * (f.creditoMedio / MAX_CREDITO), 6, 3);

  const rLabels = { baixo: 'Baixo Risco', concentracao: 'Concentração Alvo', alto: 'Alto Risco' };
  const rBgs    = { baixo: '#DBEAFE',     concentracao: '#CFFAFE',            alto: '#FFE4E6'   };
  const rFgs    = { baixo: '#1D4ED8',     concentracao: '#0891B2',            alto: '#BE123C'   };

  fill(rBgs[f.risco]);
  rect(18, 208, trackW, 26, 8);
  fill(rFgs[f.risco]);
  textSize(11);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(rLabels[f.risco], PANEL_W / 2, 221);

  pop();
}

function mousePressed() {
  for (let j = 0; j < selectedBars.length; j++) {
    const ox = CARD_W + GAP + j * (PANEL_W + GAP);
    if (dist(mouseX, mouseY, ox + PANEL_W - 28, 16) <= 12) {
      selectedBars.splice(j, 1);
      return;
    }
  }

  const plotW = CARD_W - padX - 30;
  const plotH = CARD_H - padTop - padBot;
  const barW  = (plotW - (faixas.length - 1) * barGap) / faixas.length;

  for (let i = 0; i < faixas.length; i++) {
    const bx = padX + i * (barW + barGap);
    const bh = (faixas[i].pct / maxPct) * plotH;
    const by = padTop + plotH - bh;
    if (mouseX >= bx && mouseX <= bx + barW && mouseY >= by && mouseY <= padTop + plotH) {
      const idx = selectedBars.indexOf(i);
      if (idx >= 0) {
        selectedBars.splice(idx, 1);
      } else {
        selectedBars.push(i);
      }
      return;
    }
  }
}

function easeOutCubic(t) {
  return 1 - pow(1 - t, 3);
}
