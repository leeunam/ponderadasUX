(function () {
  const d3 = window.d3;
  const simulacao = window.SIMULACAO_AMBIENTE;

  if (!d3 || !simulacao) return;

  const { largura, altura, legenda, notas, tipos, nos, relacoes } = simulacao;
  const opacidadeBaixa = 0.1;
  const escalaAtiva = 1.12;
  const escalaConectada = 1.05;

  function calcularScore(recurso, foco) {
    const dx = recurso.x - foco.x;
    const dy = recurso.y - foco.y;
    const dis = Math.sqrt(dx * dx + dy * dy);
    const disMax = Math.sqrt(largura * largura + altura * altura);
    const scoreDist = Math.max(0, 100 - (dis / disMax) * 130);
    const bonusCapacidade = {
      Aeronave: 18,
      Brigada: 12,
      Caminhao: 6,
      '4x4': 3,
    };
    const bonus = bonusCapacidade[recurso.subtitle] ?? 0;
    return Math.min(5, Math.round(((scoreDist + bonus) / 20) * 10) / 10);
  }

  const app = document.querySelector('#app');

  app.innerHTML = `
    <div class="scene-shell">
      <header class="scene-header">
        <div>
          <p class="scene-kicker">Ponderada UX — Ideia 3</p>
          <h1>Simulação de Despacho</h1>
          <p class="scene-copy">
            Visualização do algoritmo de seleção de recursos para focos de incêndio.
            Clique em um <strong style="color:#f28c28">foco</strong> para ver o algoritmo em ação,
            ou em um <strong style="color:#2a9d8f">recurso</strong> para inspecionar seu peso de atendimento.
          </p>
        </div>

        <div class="scene-metrics">
          <div class="metric-pill">
            <span class="metric-value">${nos.filter((n) => n.type === 'base').length}</span>
            <span class="metric-label">Bases</span>
          </div>
          <div class="metric-pill">
            <span class="metric-value">${nos.filter((n) => n.type === 'resource').length}</span>
            <span class="metric-label">Recursos</span>
          </div>
          <div class="metric-pill">
            <span class="metric-value">${nos.filter((n) => n.type === 'occurrence').length}</span>
            <span class="metric-label">Focos</span>
          </div>
        </div>
      </header>

      <section class="scene-board">
        <aside class="scene-sidebar">
          <section class="scene-card">
            <h2>Legenda</h2>
            <div class="legend-list">
              ${legenda
                .map(
                  (item) => `
                <div class="legend-item">
                  <span class="legend-chip" style="background:${item.color}">${item.glyph}</span>
                  <span>${item.label}</span>
                </div>
              `,
                )
                .join('')}
            </div>
          </section>

          <section class="scene-card">
            <h3>Como usar</h3>
            <div class="detail-list">
              <div class="detail-item">
                <span class="legend-chip" style="background:#7a3020">🔥</span>
                <span>Clique em um <strong>foco</strong> para acionar o algoritmo de despacho.</span>
              </div>
              <div class="detail-item">
                <span class="legend-chip" style="background:#1a3d38">R</span>
                <span>Clique em um <strong>recurso</strong> para ver seu peso em cada foco.</span>
              </div>
              <div class="detail-item">
                <span class="legend-chip" style="background:#1a2d3a">⇱</span>
                <span><strong>Scroll</strong> para zoom · <strong>Arraste</strong> o mapa para navegar.</span>
              </div>
            </div>
          </section>

          <section class="scene-card scene-focus-card">
            <h3 id="panel-title">Nenhum elemento selecionado</h3>
            <div id="panel-body">
              <p class="focus-type">Clique em um nó do diagrama.</p>
            </div>
          </section>
        </aside>

        <div>
          <section class="scene-stage">
            <div class="scene-stage-header">
              <div>
                <h2>Área operacional simulada</h2>
                <p>Scroll para zoom · Arraste para navegar</p>
              </div>
              <p id="scene-status">Nenhum elemento selecionado.</p>
            </div>

            <div class="scene-svg-shell">
              <svg class="scene-svg" viewBox="0 0 ${largura} ${altura}" aria-label="Simulação operacional"></svg>
            </div>
          </section>

          <section class="scene-caption">
            <strong>Algoritmo de despacho:</strong> ao clicar em um foco, o sistema percorre cada recurso disponível
            avaliando distância e capacidade operacional, seleciona o mais adequado e traça a rota de despacho animada.
            Use o painel lateral para inspecionar o score individual de cada recurso.
          </section>
        </div>
      </section>
    </div>
  `;

  const status = document.querySelector('#scene-status');
  const panelTitle = document.querySelector('#panel-title');
  const panelBody = document.querySelector('#panel-body');
  const svg = d3.select('.scene-svg');
  const mapaNos = new Map(nos.map((n) => [n.id, n]));

  const svgShell = document.querySelector('.scene-svg-shell');
  svgShell.style.position = 'relative';
  const legendaOverlay = document.createElement('div');
  legendaOverlay.className = 'map-legend';
  legendaOverlay.innerHTML =
    [
      {
        cor: '#f28c28',
        texto: 'Clique no <strong>foco</strong> &rarr; algoritmo de despacho',
      },
      {
        cor: '#2a9d8f',
        texto:
          'Clique no <strong>recurso</strong> &rarr; peso de atendimento (0&ndash;5)',
      },
      {
        cor: '#4f6d7a',
        texto:
          'Clique na <strong>base</strong> &rarr; conex&otilde;es operacionais',
      },
    ]
      .map(
        (i) =>
          `<div class="map-legend-item"><span class="map-legend-dot" style="background:${i.cor}"></span>${i.texto}</div>`,
      )
      .join('') +
    '<div class="map-legend-sep"></div>' +
    '<div class="map-legend-item"><span class="map-legend-icon">&#8689;</span>Scroll = zoom &nbsp;&middot;&nbsp; Arrastar = navegar</div>';
  svgShell.appendChild(legendaOverlay);

  const zoomLayer = svg.append('g').attr('class', 'zoom-layer');

  const zoom = d3
    .zoom()
    .scaleExtent([0.3, 5])
    .on('zoom', (event) => {
      zoomLayer.attr('transform', event.transform);
    });

  svg.call(zoom).on('dblclick.zoom', null);

  const fundo = zoomLayer
    .append('rect')
    .attr('x', 18)
    .attr('y', 18)
    .attr('width', largura - 36)
    .attr('height', altura - 36)
    .attr('rx', 26)
    .attr('fill', 'rgba(11, 21, 30, 0.88)')
    .attr('stroke', 'rgba(116, 156, 136, 0.2)');

  zoomLayer
    .append('text')
    .attr('x', 44)
    .attr('y', 56)
    .attr('fill', '#7fa18e')
    .attr('font-size', 13)
    .attr('font-weight', 600)
    .text('Grade espacial simplificada');

  const grade = zoomLayer.append('g').attr('opacity', 0.32);

  d3.range(90, largura - 40, 90).forEach((x) => {
    grade
      .append('line')
      .attr('x1', x)
      .attr('y1', 28)
      .attr('x2', x)
      .attr('y2', altura - 28)
      .attr('stroke', '#486057')
      .attr('stroke-dasharray', '4 8');
  });

  d3.range(90, altura - 20, 90).forEach((y) => {
    grade
      .append('line')
      .attr('x1', 28)
      .attr('y1', y)
      .attr('x2', largura - 28)
      .attr('y2', y)
      .attr('stroke', '#486057')
      .attr('stroke-dasharray', '4 8');
  });

  const camadaLinhas = zoomLayer.append('g');
  const camadaDespacho = zoomLayer.append('g');
  const camadaNos = zoomLayer.append('g');
  const camadaConectores = zoomLayer.append('g');

  const selecaoRelacoes = camadaLinhas
    .selectAll('line')
    .data(relacoes)
    .join('line')
    .attr('class', 'relationship-line')
    .attr('x1', (r) => mapaNos.get(r.source).x)
    .attr('y1', (r) => mapaNos.get(r.source).y)
    .attr('x2', (r) => mapaNos.get(r.target).x)
    .attr('y2', (r) => mapaNos.get(r.target).y)
    .attr('stroke', '#6fd8c4')
    .attr('stroke-width', 4)
    .attr('stroke-linecap', 'round')
    .attr('stroke-dasharray', '10 10')
    .attr('opacity', 0);

  const selecaoConectores = camadaConectores
    .selectAll('circle')
    .data(relacoes)
    .join('circle')
    .attr('class', 'connector-anchor')
    .attr('cx', (r) => (mapaNos.get(r.source).x + mapaNos.get(r.target).x) / 2)
    .attr('cy', (r) => (mapaNos.get(r.source).y + mapaNos.get(r.target).y) / 2)
    .attr('r', 4.5)
    .attr('fill', '#86e4d3')
    .attr('opacity', 0);

  const selecaoNos = camadaNos
    .selectAll('g')
    .data(nos)
    .join('g')
    .attr('class', (n) => `node-group ${n.type}-node`)
    .attr('transform', (n) => `translate(${n.x},${n.y})`)
    .attr('tabindex', 0)
    .attr('role', 'button');

  selecaoNos
    .append('circle')
    .attr('r', (n) => n.size)
    .attr('fill', (n) => n.color)
    .attr('stroke', (n) => n.border || '#d7efff')
    .attr('stroke-width', (n) => (n.type === 'occurrence' ? 4 : 3))
    .attr('filter', 'drop-shadow(0 14px 24px rgba(6,10,16,0.5))');

  selecaoNos
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#ffffff')
    .attr('font-size', 13)
    .attr('font-weight', 700)
    .text((n) => n.glyph);

  selecaoNos
    .append('text')
    .attr('class', 'node-label')
    .attr('x', (n) => n.size + 12)
    .attr('y', -3)
    .text((n) => n.label);

  selecaoNos
    .append('text')
    .attr('class', 'node-subtitle')
    .attr('x', (n) => n.size + 12)
    .attr('y', 14)
    .text((n) => n.subtitle);

  let estadoAtualId = null;
  let animacaoEmAndamento = false;

  function limparAresta() {
    camadaDespacho.selectAll('*').remove();
  }

  function resetarNos() {
    selecaoNos
      .transition()
      .duration(250)
      .style('opacity', 1)
      .attr('transform', (n) => `translate(${n.x},${n.y}) scale(1)`);

    selecaoNos
      .select('circle')
      .transition()
      .duration(250)
      .attr('r', (n) => n.size)
      .attr('stroke', (n) => n.border || '#d7efff')
      .attr('stroke-width', (n) => (n.type === 'occurrence' ? 4 : 3));
  }

  function resetarLinhas() {
    selecaoRelacoes.transition().duration(250).attr('opacity', 0);
    selecaoConectores.transition().duration(250).attr('opacity', 0);
  }

  function barraScore(score, label) {
    const cor = score >= 3.5 ? '#2a9d8f' : score >= 2 ? '#f4be2a' : '#db3a34';
    const pct = (score / 5) * 100;
    return `
      <div class="score-row">
        <div class="score-row-header">
          <span>${label}</span>
          <span style="color:${cor};font-weight:700">${score.toFixed(1)}<span style="font-size:10px;color:#7fa18e">/5</span></span>
        </div>
        <div class="score-track">
          <div class="score-fill" data-score="${pct}" style="background:${cor};width:0%"></div>
        </div>
      </div>
    `;
  }

  function animarBarras() {
    requestAnimationFrame(() => {
      document.querySelectorAll('.score-fill').forEach((el) => {
        const s = el.dataset.score;
        el.style.width = s + '%';
      });
    });
  }

  function resetarCena() {
    limparAresta();
    estadoAtualId = null;
    animacaoEmAndamento = false;
    resetarNos();
    resetarLinhas();
    panelTitle.textContent = 'Nenhum elemento selecionado';
    panelBody.innerHTML =
      '<p class="focus-type">Clique em um nó do diagrama.</p>';
    status.textContent = 'Nenhum elemento selecionado.';
  }

  function animarAlgoritmo(foco) {
    if (animacaoEmAndamento) return;
    animacaoEmAndamento = true;
    limparAresta();
    resetarLinhas();

    const recursos = nos.filter((n) => n.type === 'resource');
    const scores = recursos.map((r) => ({
      ...r,
      score: calcularScore(r, foco),
    }));
    const melhor = scores.reduce((a, b) => (a.score > b.score ? a : b));

    const DELAY_VISITA = 320;
    const delayFimVisitas = recursos.length * DELAY_VISITA + 200;
    const delayDespacho = delayFimVisitas + 400;

    status.textContent = `Algoritmo analisando recursos para ${foco.label}…`;
    panelTitle.textContent = '⏳ Algoritmo em execução…';
    panelBody.innerHTML =
      '<p class="focus-type">Avaliando todos os recursos disponíveis…</p>';

    selecaoNos
      .transition()
      .duration(200)
      .style('opacity', (n) =>
        n.type === 'resource' || n.id === foco.id ? 1 : opacidadeBaixa,
      );

    selecaoNos
      .filter((n) => n.id === foco.id)
      .select('circle')
      .transition()
      .duration(300)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 6);

    recursos.forEach((recurso, i) => {
      const grupo = selecaoNos.filter((d) => d.id === recurso.id);

      grupo
        .select('circle')
        .transition()
        .delay(i * DELAY_VISITA)
        .duration(160)
        .attr('stroke', '#f4be2a')
        .attr('stroke-width', 6)
        .attr('r', recurso.size * 1.45)
        .transition()
        .duration(200)
        .attr('stroke', recurso.border || '#d7efff')
        .attr('stroke-width', 3)
        .attr('r', recurso.size);

      grupo
        .transition()
        .delay(i * DELAY_VISITA)
        .duration(160)
        .attr('transform', `translate(${recurso.x},${recurso.y}) scale(1.25)`)
        .transition()
        .duration(200)
        .attr('transform', `translate(${recurso.x},${recurso.y}) scale(1)`);
    });

    scores.forEach(({ id, score, x, y, size, border }) => {
      const grupo = selecaoNos.filter((d) => d.id === id);
      const eMelhor = id === melhor.id;

      grupo
        .transition()
        .delay(delayFimVisitas)
        .duration(350)
        .style('opacity', eMelhor ? 1 : opacidadeBaixa)
        .attr(
          'transform',
          eMelhor
            ? `translate(${x},${y}) scale(${escalaAtiva})`
            : `translate(${x},${y}) scale(1)`,
        );

      if (eMelhor) {
        grupo
          .select('circle')
          .transition()
          .delay(delayFimVisitas)
          .duration(350)
          .attr('stroke', '#6fd8c4')
          .attr('stroke-width', 7)
          .attr('r', size * 1.18);
      }
    });

    const dx = foco.x - melhor.x;
    const dy = foco.y - melhor.y;
    const totalLen = Math.sqrt(dx * dx + dy * dy);

    const aresta = camadaDespacho
      .append('line')
      .attr('x1', melhor.x)
      .attr('y1', melhor.y)
      .attr('x2', foco.x)
      .attr('y2', foco.y)
      .attr('stroke', '#6fd8c4')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', `${totalLen} ${totalLen}`)
      .attr('stroke-dashoffset', totalLen)
      .attr('opacity', 0);

    aresta
      .transition()
      .delay(delayDespacho)
      .duration(200)
      .attr('opacity', 1)
      .transition()
      .duration(800)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    const pontinho = camadaDespacho
      .append('circle')
      .attr('cx', foco.x)
      .attr('cy', foco.y)
      .attr('r', 0)
      .attr('fill', '#6fd8c4')
      .attr('opacity', 0);

    pontinho
      .transition()
      .delay(delayDespacho + 900)
      .duration(250)
      .attr('r', 8)
      .attr('opacity', 0.8)
      .transition()
      .duration(300)
      .attr('r', 5)
      .attr('opacity', 0.5);

    setTimeout(() => {
      panelTitle.textContent = `📡 Despacho — ${foco.label}`;
      panelBody.innerHTML = `
        <p class="focus-type">Algoritmo concluído. Melhor recurso identificado:</p>
        <p style="font-weight:700;color:#6fd8c4;font-size:15px;margin:8px 0 4px">${melhor.label} &mdash; ${melhor.subtitle}</p>
        <p style="font-size:11px;color:#7fa18e;margin-bottom:10px">Nível do foco: ${foco.glyph} &bull; Área: ${foco.subtitle}</p>
        ${barraScore(melhor.score, 'Score do recurso selecionado')}
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:12px 0">
        <p style="font-size:11px;color:#7fa18e;margin-bottom:6px">Todos os recursos avaliados:</p>
        ${scores
          .sort((a, b) => b.score - a.score)
          .map((r) => barraScore(r.score, `${r.label} (${r.subtitle})`))
          .join('')}
      `;
      animarBarras();
      status.textContent = `✓ Despacho: ${melhor.label} → ${foco.label} (score ${melhor.score.toFixed(1)}/5)`;
      animacaoEmAndamento = false;
    }, delayDespacho + 1100);
  }

  function inspecionarRecurso(recurso) {
    limparAresta();
    resetarLinhas();

    const focos = nos.filter((n) => n.type === 'occurrence');
    const scores = focos.map((f) => ({
      ...f,
      score: calcularScore(recurso, f),
    }));
    const melhorFoco = scores.reduce((a, b) => (a.score > b.score ? a : b));

    selecaoNos
      .transition()
      .duration(220)
      .style('opacity', (n) =>
        n.id === recurso.id || n.id === melhorFoco.id ? 1 : opacidadeBaixa,
      )
      .attr('transform', (n) => {
        if (n.id === recurso.id)
          return `translate(${n.x},${n.y}) scale(${escalaAtiva})`;
        if (n.id === melhorFoco.id)
          return `translate(${n.x},${n.y}) scale(${escalaConectada})`;
        return `translate(${n.x},${n.y}) scale(1)`;
      });

    selecaoNos
      .filter((n) => n.id === recurso.id)
      .select('circle')
      .transition()
      .duration(220)
      .attr('stroke', '#6fd8c4')
      .attr('stroke-width', 6);

    const dx = melhorFoco.x - recurso.x;
    const dy = melhorFoco.y - recurso.y;
    const totalLen = Math.sqrt(dx * dx + dy * dy);

    camadaDespacho
      .append('line')
      .attr('x1', recurso.x)
      .attr('y1', recurso.y)
      .attr('x2', melhorFoco.x)
      .attr('y2', melhorFoco.y)
      .attr('stroke', '#6fd8c4')
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', `${totalLen} ${totalLen}`)
      .attr('stroke-dashoffset', totalLen)
      .attr('opacity', 0)
      .transition()
      .duration(150)
      .attr('opacity', 0.5)
      .transition()
      .duration(600)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    panelTitle.textContent = `🔍 ${recurso.label}`;
    panelBody.innerHTML = `
      <p class="focus-type">${recurso.subtitle} — Peso de atendimento por foco:</p>
      ${scores
        .sort((a, b) => b.score - a.score)
        .map((f) =>
          barraScore(f.score, `${f.label} (nível ${f.glyph} · ${f.subtitle})`),
        )
        .join('')}
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:12px 0">
      <p style="font-size:11px;color:#7fa18e">Score = distância inversa + bônus de capacidade operacional.</p>
    `;
    animarBarras();
    status.textContent = `Inspecionando: ${recurso.label} (${recurso.subtitle}) — melhor foco: ${melhorFoco.label} (${melhorFoco.score.toFixed(1)}/5)`;
  }

  function inspecionarBase(base) {
    limparAresta();

    const idsConectados = new Set([base.id]);
    const relacoesAtivas = new Set();

    relacoes.forEach((r) => {
      if (r.source === base.id || r.target === base.id) {
        idsConectados.add(r.source);
        idsConectados.add(r.target);
        relacoesAtivas.add(`${r.source}-${r.target}`);
      }
    });

    selecaoNos
      .transition()
      .duration(220)
      .style('opacity', (n) => (idsConectados.has(n.id) ? 1 : opacidadeBaixa))
      .attr('transform', (n) => {
        const escala =
          n.id === base.id
            ? escalaAtiva
            : idsConectados.has(n.id)
              ? escalaConectada
              : 1;
        return `translate(${n.x},${n.y}) scale(${escala})`;
      });

    selecaoRelacoes
      .transition()
      .duration(220)
      .attr('opacity', (r) =>
        relacoesAtivas.has(`${r.source}-${r.target}`) ? 0.92 : 0,
      );

    selecaoConectores
      .transition()
      .duration(220)
      .attr('opacity', (r) =>
        relacoesAtivas.has(`${r.source}-${r.target}`) ? 0.85 : 0,
      );

    const conectados = [...idsConectados]
      .filter((id) => id !== base.id)
      .map((id) => mapaNos.get(id));

    panelTitle.textContent = base.label;
    panelBody.innerHTML = `
      <p class="focus-type">Base operacional &bull; ${base.subtitle}</p>
      <p style="font-size:12px;color:#7fa18e;margin-top:8px">
        Atende: ${conectados.map((n) => n.label).join(', ') || 'Nenhuma conexão'}
      </p>
    `;
    status.textContent = `${base.label} conectada a ${relacoesAtivas.size} relação(ões).`;
  }

  selecaoNos
    .on('click', (event, no) => {
      event.stopPropagation();

      if (estadoAtualId === no.id) {
        resetarCena();
        return;
      }

      estadoAtualId = no.id;

      if (no.type === 'occurrence') {
        animarAlgoritmo(no);
      } else if (no.type === 'resource') {
        inspecionarRecurso(no);
      } else {
        inspecionarBase(no);
      }
    })
    .on('keydown', (event, no) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selecaoNos.filter((d) => d.id === no.id).dispatch('click');
      }
    });

  fundo.on('click', () => {
    if (!animacaoEmAndamento) resetarCena();
  });
})();
