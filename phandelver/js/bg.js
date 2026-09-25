/* Фоны локаций: небо-градиент и силуэты (холмы, лес, пещера, город…), рисуются SVG.
   Смена фона — плавное перетекание слоёв. */
(() => {
  const G = window.G;

  /* детерминированный генератор, чтобы силуэты не «прыгали» между перерисовками */
  const rng = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const svg = (body, cls, vb) => '<svg class="' + cls + '" viewBox="' + (vb || '0 0 600 300') + '" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' + body + '</svg>';

  /* волнистая линия холмов от y0 с амплитудой a */
  function hills(seed, y0, a, fill) {
    const r = rng(seed);
    let d = 'M0 300 L0 ' + y0;
    for (let x = 0; x <= 600; x += 50) d += ' Q' + (x + 25) + ' ' + (y0 - a * r()) + ' ' + (x + 50) + ' ' + (y0 - a * 0.4 * r());
    return '<path d="' + d + ' L600 300 Z" fill="' + fill + '"/>';
  }
  function pines(seed, y, h, n, fill) {
    const r = rng(seed);
    let p = '';
    for (let i = 0; i < n; i++) {
      const x = (i + r() * 0.8) * (620 / n) - 10, th = h * (0.6 + r() * 0.6), w = th * 0.32;
      p += 'M' + x.toFixed(1) + ' ' + (y - th).toFixed(1) + ' L' + (x - w).toFixed(1) + ' ' + y + ' L' + (x + w).toFixed(1) + ' ' + y + ' Z ';
    }
    return '<path d="' + p + '" fill="' + fill + '"/><rect x="0" y="' + (y - 1) + '" width="600" height="' + (301 - y) + '" fill="' + fill + '"/>';
  }
  function spikes(seed, fromTop, n, len, fill) {
    const r = rng(seed);
    let p = '';
    for (let i = 0; i < n; i++) {
      const x = (i + r()) * (600 / n), w = 8 + r() * 18, l = len * (0.3 + r() * 0.9);
      p += fromTop ? 'M' + (x - w) + ' 0 L' + x + ' ' + l + ' L' + (x + w) + ' 0 Z ' : 'M' + (x - w) + ' 300 L' + x + ' ' + (300 - l) + ' L' + (x + w) + ' 300 Z ';
    }
    return '<path d="' + p + '" fill="' + fill + '"/>';
  }
  function stars(seed, n) {
    const r = rng(seed);
    let s = '';
    for (let i = 0; i < n; i++) s += '<circle cx="' + (r() * 600).toFixed(0) + '" cy="' + (r() * 170).toFixed(0) + '" r="' + (0.6 + r() * 1.1).toFixed(1) + '" style="animation-delay:' + (r() * 4).toFixed(1) + 's"/>';
    return '<g class="stars">' + s + '</g>';
  }
  function bareTree(x, y, s, fill) {
    return '<path transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="none" stroke="' + fill + '" stroke-width="5" stroke-linecap="round" d="M0 0 L0 -70 M0 -40 L-22 -62 L-30 -80 M0 -52 L18 -76 L30 -84 M-22 -62 L-38 -66 M0 -70 L-6 -96 M18 -76 L16 -98"/>';
  }

  const T = {
    road: {
      sky: 'radial-gradient(120% 55% at 70% 0%, rgba(231,160,90,.16), transparent 60%), linear-gradient(#141a14, #0f1310 55%)',
      bottom: svg(hills(7, 190, 60, '#1a241b') + hills(11, 225, 45, '#141c15') + '<path d="M250 300 Q300 250 340 232 Q360 226 380 228 Q350 240 330 300 Z" fill="#1d231a"/>' + hills(19, 262, 25, '#101611'), 'bg-bottom')
    },
    forest: {
      sky: 'radial-gradient(120% 50% at 30% 0%, rgba(147,189,114,.12), transparent 60%), linear-gradient(#111811, #0d120e 60%)',
      bottom: svg(pines(3, 215, 110, 22, '#162218') + '<rect class="mist" x="-100" y="200" width="800" height="40" fill="rgba(160,190,150,.05)"/>' + pines(5, 262, 150, 13, '#0f1710'), 'bg-bottom')
    },
    haunt: {
      sky: 'radial-gradient(90% 50% at 50% 0%, rgba(170,195,255,.13), transparent 65%), linear-gradient(#12161a, #0d1012 60%)',
      bottom: svg(pines(13, 220, 90, 18, '#161c22') + bareTree(120, 262, 1.3, '#141a1f') + bareTree(470, 268, 1.6, '#12171c') + '<rect class="mist" x="-100" y="215" width="800" height="55" fill="rgba(190,210,255,.07)"/>' + hills(23, 272, 12, '#0e1215'), 'bg-bottom')
    },
    cave: {
      sky: 'radial-gradient(80% 45% at 50% 100%, rgba(147,189,114,.10), transparent 70%), linear-gradient(#0c0f0c, #11150f)',
      top: svg(spikes(31, true, 16, 110, '#1a211a') + spikes(37, true, 9, 70, '#141a14'), 'bg-top', '0 0 600 160'),
      bottom: svg(spikes(41, false, 11, 90, '#161c16') + hills(43, 275, 20, '#121812') + '<g class="drips"><circle cx="140" cy="120" r="1.6"/><circle cx="410" cy="90" r="1.6"/><circle cx="290" cy="140" r="1.4"/></g>', 'bg-bottom')
    },
    town: {
      sky: 'radial-gradient(110% 55% at 50% 0%, rgba(231,193,93,.11), transparent 60%), linear-gradient(#15150f, #0f1310 60%)',
      bottom: svg(hills(47, 215, 40, '#18201a') +
        '<path fill="#1a1f19" d="M20 300 L20 218 L60 185 L100 218 L100 300 Z M115 300 L115 230 L150 200 L150 188 L160 188 L160 208 L185 230 L185 300 Z M200 300 L200 212 L250 170 L300 212 L300 300 Z M320 300 L320 225 L355 198 L390 225 L390 300 Z M405 300 L405 205 L445 172 L445 158 L456 158 L456 180 L485 205 L485 300 Z M500 300 L500 222 L540 192 L580 222 L580 300 Z"/>' +
        '<g class="windows" fill="#e7c15d"><rect x="52" y="235" width="10" height="12"/><rect x="237" y="228" width="10" height="13"/><rect x="262" y="250" width="9" height="11"/><rect x="345" y="240" width="9" height="11"/><rect x="438" y="222" width="10" height="13"/><rect x="530" y="238" width="9" height="12"/></g>' +
        hills(53, 285, 8, '#121813'), 'bg-bottom')
    },
    dungeon: {
      sky: 'radial-gradient(45% 40% at 8% 35%, rgba(230,120,60,.13), transparent 70%), radial-gradient(45% 40% at 92% 55%, rgba(230,120,60,.10), transparent 70%), linear-gradient(#120f0d, #0f0d0c)',
      bottom: svg((() => {
        let b = '';
        for (let row = 0; row < 7; row++) for (let c = -1; c < 13; c++) b += '<rect x="' + (c * 50 + (row % 2) * 25) + '" y="' + (150 + row * 22) + '" width="47" height="19" rx="2"/>';
        return '<g fill="#1b1714">' + b + '</g><path d="M230 300 L230 215 Q300 140 370 215 L370 300 Z" fill="#0c0a09"/>';
      })(), 'bg-bottom')
    },
    ruins: {
      sky: 'radial-gradient(40% 30% at 78% 12%, rgba(220,225,240,.12), transparent 70%), linear-gradient(#12151a, #0f1310 60%)',
      bottom: svg(hills(61, 225, 35, '#171d1c') +
        '<path fill="#1b2020" d="M90 300 L90 120 L105 112 L112 128 L124 105 L140 118 L140 300 Z M150 300 L150 230 L175 226 L180 240 L205 236 L210 300 Z M420 300 L420 205 L440 200 L452 214 L470 196 L478 300 Z"/>' +
        bareTree(330, 262, 1.2, '#161b1b') + pines(67, 272, 60, 16, '#111615'), 'bg-bottom')
    },
    peak: {
      sky: 'linear-gradient(#10141c, #0f1310 65%)',
      bottom: svg(stars(71, 40) + '<path fill="#182029" d="M0 300 L0 200 L70 150 L110 175 L190 70 L240 140 L280 115 L360 190 L430 110 L500 170 L560 140 L600 165 L600 300 Z"/>' + '<path fill="#e8eef5" opacity=".08" d="M190 70 L172 94 L185 90 L196 100 L207 86 Z M430 110 L415 130 L428 127 L440 136 Z"/>' + hills(73, 255, 40, '#12181f'), 'bg-bottom')
    },
    castle: {
      sky: 'radial-gradient(120% 55% at 50% 0%, rgba(216,90,73,.12), transparent 60%), linear-gradient(#171211, #0f1310 60%)',
      bottom: svg(hills(79, 240, 30, '#1c1a18') +
        '<path fill="#1f1c1a" d="M160 245 L160 150 L172 150 L172 140 L182 140 L182 150 L194 150 L194 140 L204 140 L204 150 L214 150 L214 180 L330 180 L330 168 L340 168 L340 180 L352 180 L352 168 L362 168 L362 180 L386 180 L386 128 L398 128 L398 118 L408 118 L408 128 L420 128 L420 118 L430 118 L430 132 L442 125 L442 245 Z"/>' +
        '<path fill="#0f0d0c" d="M275 245 L275 215 Q290 198 305 215 L305 245 Z"/>' + hills(83, 270, 18, '#131210'), 'bg-bottom')
    },
    mine: {
      sky: 'radial-gradient(70% 45% at 50% 70%, rgba(167,178,255,.12), transparent 70%), linear-gradient(#0c0d14, #0e0f15)',
      top: svg(spikes(89, true, 14, 100, '#181a26') + spikes(97, true, 8, 60, '#13141e'), 'bg-top', '0 0 600 160'),
      bottom: svg(spikes(101, false, 9, 70, '#15172a') +
        '<g class="crystals"><path fill="#6f7bd6" d="M120 300 L128 238 L138 300 Z M132 300 L146 255 L152 300 Z M430 300 L440 222 L452 300 Z M446 300 L462 250 L468 300 Z M300 300 L306 262 L314 300 Z"/></g>' + hills(103, 280, 12, '#101120'), 'bg-bottom')
    }
  };

  const BY_LOC = {
    'Невервинтер': 'road', 'Триборская тропа': 'road', 'В пути': 'road', 'Окрестности Фандалина': 'road', 'Ферма Олдерлиф': 'road',
    'Гоблинская тропа': 'forest', 'Логово Агаты': 'haunt', 'Кониберри': 'ruins',
    'Убежище Каменных Пастей': 'cave', 'Убежище Красноклеймённых': 'dungeon',
    'Громодеревье': 'ruins', 'Колодец Старой Совы': 'ruins', 'Вершина Виверны': 'peak',
    'Замок Каменной Пасти': 'castle', 'Пещера Морского Эха': 'mine'
  };
  const BY_CH = ['road', 'road', 'town', 'road', 'mine'];
  G.bgTheme = S => {
    if (!S) return 'road';
    if (S.loc && BY_LOC[S.loc]) return BY_LOC[S.loc];
    if (S.chapter === 2 || /Фандалин|Стоунхилл|Ратуша|биржа|великан|Удачи|Бартен|Щит|Эдермат|Тресендар/.test(S.loc || '')) return 'town';
    return BY_CH[S.chapter] || 'road';
  };

  let cur = null;
  G.setBg = k => {
    if (k === cur || !T[k]) return;
    let box = document.getElementById('bg');
    if (!box) { box = document.createElement('div'); box.id = 'bg'; box.setAttribute('aria-hidden', 'true'); document.body.prepend(box); }
    let el = box.querySelector('[data-k="' + k + '"]');
    if (!el) {
      el = document.createElement('div');
      el.className = 'bg-l bg-' + k;
      el.dataset.k = k;
      el.style.background = T[k].sky;
      el.innerHTML = (T[k].top || '') + (T[k].bottom || '');
      box.appendChild(el);
    }
    box.querySelectorAll('.bg-l').forEach(x => x.classList.toggle('on', x === el));
    cur = k;
  };
})();
