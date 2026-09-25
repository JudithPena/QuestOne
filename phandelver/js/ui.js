/* Отрисовка: титул, создание героя, сцена, бой, листы. */
(() => {
  const G = window.G;
  const E = G.esc;
  const app = () => document.getElementById('app');
  let CUR = [];
  let CREATE = { name: '', race: 'human', cls: 'fighter' };

  /* ---------- строки текста ---------- */
  function line(l) {
    if (l[0] === '>') return '<p class="read">' + l.slice(1) + '</p>';
    if (l[0] === '~') return '<p class="muted">' + l.slice(1) + '</p>';
    if (l[0] === '!') return '<p class="warn">' + l.slice(1) + '</p>';
    if (l[0] === '"') return '<p class="speech">' + l + '</p>';
    return '<p>' + l + '</p>';
  }

  /* ---------- шапка ---------- */
  function header() {
    const S = G.S, h = S.hero, c = G.cls();
    const mx = G.maxHp(), pct = Math.max(0, h.hp / mx * 100);
    const next = G.XP_LEVELS[h.lvl] || null, prev = G.XP_LEVELS[h.lvl - 1] || 0;
    const xpPct = next ? Math.min(100, (h.xp - prev) / (next - prev) * 100) : 100;
    let comp = '';
    if (S.comp) {
      const d = G.compDef(), ch = G.compHp();
      comp = '<div class="hdr-comp"><span>' + E(d.short) + '</span><div class="meter ally"><i style="width:' + (ch / d.hp * 100) + '%"></i></div><b>' + ch + '/' + d.hp + '</b></div>';
    }
    return '<header class="bar"><div class="bar-in">' +
      '<button class="who" data-a="sheet:hero" aria-label="Лист персонажа"><b>' + E(h.name) + '</b><span>' + c.name + ' · ' + h.lvl + ' ур.</span></button>' +
      '<div class="hp"><div class="hp-top"><span>Хиты</span><b>' + h.hp + '/' + mx + '</b></div><div class="meter"><i style="width:' + pct + '%"></i></div>' +
      '<div class="meter xp" title="Опыт"><i style="width:' + xpPct + '%"></i></div></div>' +
      '<div class="hdr-btns">' +
      '<button class="ico" data-a="sheet:bag">Сумка</button>' +
      '<button class="ico" data-a="sheet:journal">Журнал</button>' +
      '<button class="ico" data-a="sheet:menu">Меню</button>' +
      '</div>' + comp +
      '</div></header>';
  }

  function eyebrow() {
    const S = G.S;
    const ch = ['', 'Глава 1 · Гоблинские стрелы', 'Глава 2 · Фандалин', 'Глава 3 · Паутина', 'Глава 4 · Пещера Морского Эха'][S.chapter] || '';
    return '<p class="eyebrow">' + ch + (S.loc ? ' <span>· ' + E(S.loc) + '</span>' : '') + '</p>';
  }

  function notes() {
    const S = G.S;
    if (!S.notes.length) return '';
    return '<div class="notes">' + S.notes.map(([k, t]) => '<p class="note ' + k + '">' + t + '</p>').join('') + '</div>';
  }

  /* ---------- сцена ---------- */
  function sceneHTML() {
    const S = G.S, sc = G.SC[S.scene];
    const lines = [].concat(G.val(sc.text) || []);
    CUR = G.visibleChoices(sc);
    let h = eyebrow() + '<h1>' + G.val(sc.title) + '</h1>' + notes();
    if (S.tmp) h += '<div class="reply">' + S.tmp + '</div>';
    h += '<div class="text">' + lines.map(line).join('') + '</div>';
    h += '<div class="choices">' + CUR.map((c, i) => {
      let tag = '';
      if (c.check) tag = G.checkTag(c.check) + (G.canAuto(c.check) ? ' · пассивно' : '');
      else if (c.fight) tag = 'Бой';
      else if (c.shop) tag = 'Лавка';
      if (c.tag) tag = G.val(c.tag);
      return '<button class="choice' + (c.main ? ' main' : '') + (c.fight ? ' fight' : '') + '" data-c="' + i + '"><span>' + G.val(c.t) + '</span>' + (tag ? '<span class="tag">' + tag + '</span>' : '') + '</button>';
    }).join('') + '</div>';
    if (G.canRest()) h += '<p class="rest-hint"><button class="link" data-a="sheet:rest">Сделать привал</button></p>';
    return h;
  }

  /* ---------- бой ---------- */
  function statusChips(st, extra) {
    const out = [];
    if (st.sleep) out.push('спит');
    if (st.held) out.push('парализован');
    if (st.prone) out.push('на земле');
    if (st.surprised) out.push('врасплох');
    return out.concat(extra || []).map(s => '<span class="st">' + s + '</span>').join('');
  }
  function combatHTML() {
    const S = G.S, C = S.combat, h = S.hero, E2 = G.ENC[C.id];
    let out = eyebrow() + '<h1>' + E(G.val(E2.title) || 'Бой') + '</h1>' + notes();
    out += '<div class="foes">' + C.enemies.map(e => {
      const sel = e.uid === C.target && !e.out;
      const status = e.out ? { dead: 'повержен', captured: 'в плену', fled: 'сбежал', turned: 'бежит', surrender: 'сдался' }[e.out] : '';
      return '<button class="foe' + (sel ? ' sel' : '') + (e.out ? ' out' : '') + '" data-a="tgt:' + e.uid + '"' + (e.out ? ' disabled' : '') + '>' +
        '<div class="foe-top"><b>' + E(e.name) + '</b><span class="n">' + (e.out ? status : e.hp + '/' + e.max) + '</span></div>' +
        '<div class="meter"><i style="width:' + (e.hp / e.max * 100) + '%"></i></div>' +
        '<div class="foe-meta">КД ' + e.ac + (C.marked[e.uid] ? ' · метка' : '') + statusChips(e.st, e.poisoned ? ['пьян'] : []) + '</div></button>';
    }).join('') + '</div>';
    const me = [];
    if (C.conc) me.push('концентрация: ' + (G.SPELLS[C.conc] ? G.SPELLS[C.conc].name : 'Удержание'));
    if (C.hero.hidden) me.push('скрыт');
    if (C.hero.invis > 0) me.push('невидим');
    if (C.hero.prone) me.push('на земле');
    if (C.hero.held) me.push('парализован');
    if (C.hero.ash) me.push('в пепле');
    if (C.hero.restrained) me.push('опутан');
    if (C.dodge) me.push('оборона');
    if (C.sw) me.push('духовное оружие');
    out += '<div class="me">Вы: КД ' + (G.ac() + (C.conc === 'shield_of_faith' ? 2 : 0)) + (me.length ? ' · ' + me.join(' · ') : '') +
      (C.comp ? ' · ' + E(G.compDef().short) + ': ' + (C.comp.down ? 'без сознания' : G.compHp() + ' хитов') : '') + '</div>';
    const shown = C.log.slice(-10), start = C.log.length - shown.length;
    out += '<ol class="log">' + shown.map((l, i) => '<li class="' + l[0] + (start + i >= G.UI.logSeen ? ' fresh' : '') + '">' + l[1] + '</li>').join('') + '</ol>';
    G.UI.logSeen = C.log.length;

    if (C.over) {
      const t = { win: 'Победа', lose: 'Поражение', flee: 'Отступление', event: 'Бой прерван' }[C.over];
      out += '<div class="verdict ' + C.over + '">' + t + '</div><div class="choices"><button class="choice main" data-a="endfight">Дальше</button></div>';
      return out;
    }
    const T = C.turn;
    const btn = (a, label, sub, enabled, cls) => '<button class="act ' + (cls || '') + '" data-a="' + a + '"' + (enabled ? '' : ' disabled') + '><b>' + label + '</b><span>' + sub + '</span></button>';
    const w = G.weapon();
    let acts = '';
    acts += btn('atk', 'Атака: ' + E(w.name), 'к20' + G.fmt(w.hit) + ' · ' + w.dice[0] + 'к' + w.dice[1] + G.fmt(w.dmgMod) + (h.cls === 'fighter' && h.lvl >= 5 ? ' ×2' : '') + (h.cls === 'rogue' ? ' · скр. ' + G.sneakDice() + 'к6' : ''), T.action, 'primary');
    if (h.cls === 'fighter') {
      acts += btn('wind', 'Второе дыхание', 'бонус · 1к10+' + h.lvl, T.bonus && h.res.wind);
      if (h.lvl >= 2) acts += btn('surge', 'Всплеск действий', 'ещё одно действие', h.res.surge && !T.action);
    }
    if (h.cls === 'rogue') {
      acts += btn('aim', 'Верный прицел', 'бонус · преимущество', T.bonus && !T.aim);
      if (h.lvl >= 2) acts += btn('hide', 'Скрыться', 'бонус · Скрытность', T.bonus);
    }
    if (h.cls === 'cleric' && h.lvl >= 2) {
      const undead = C.enemies.some(e => !e.out && G.MONSTERS[e.k].undead);
      acts += btn('channel:turn', 'Изгнание нежити', 'канал · Сл ' + G.spellDC(), T.action && h.res.channel && undead);
      acts += btn('channel:life', 'Сохранение жизни', 'канал · ' + (5 * h.lvl) + ' хитов', T.action && h.res.channel);
    }
    if (C.sw) acts += btn('sw', 'Духовное оружие', 'бонус · 1к8' + G.fmt(G.spellMod()), T.bonus);
    acts += btn('potion', 'Зелье лечения', 'действие · осталось ' + (S.inv.potion_heal || 0), T.action && G.has('potion_heal'));
    if (C.comp && G.has('potion_heal')) acts += btn('potion:comp', 'Зелье напарнику', 'действие · ' + E(G.compDef().short), T.action);
    if (G.has('potion_invis')) acts += btn('invis', 'Зелье невидимости', 'действие', T.action);
    if (G.has('scroll_fireball') && h.cls === 'wizard') acts += btn('scroll:scroll_fireball', 'Свиток огненного шара', '8к6 по всем', T.action);
    if (G.has('scroll_lightning') && h.cls === 'wizard') acts += btn('scroll:scroll_lightning', 'Свиток молнии', '8к6 двоим', T.action);
    if (G.has('scroll_revivify') && h.cls === 'cleric' && C.comp && C.comp.down) acts += btn('revive', 'Свиток возрождения', 'поднять напарника', T.action);
    acts += btn('dodge', 'Оборона', 'по вам с помехой', T.action);
    if (C.canFlee) acts += btn('flee', 'Отступить', 'выйти из боя', T.action);

    let spells = '';
    if (G.cls().caster) {
      const sl = h.slots, mx = G.slotMax();
      spells = '<div class="spell-head"><b>Заклинания</b><span>Ячейки: ' + [0, 1, 2].filter(i => mx[i]).map(i => (i + 1) + '-й ' + sl[i] + '/' + mx[i]).join(' · ') + '</span></div><div class="acts">' +
        G.knownSpells().filter(id => G.SPELLS[id].cost !== 'reaction').map(id => {
          const sp = G.SPELLS[id];
          const lv = sp.lvl ? sp.lvl + ' ур.' : 'заговор';
          return btn('cast:' + id, sp.name, lv + (sp.cost === 'bonus' ? ' · бонус' : '') + ' · ' + shortSpell(id), G.castable(id, true), 'spell');
        }).join('') + '</div>';
      if (h.cls === 'wizard') spells += '<label class="tog"><input type="checkbox" id="shieldAuto" data-a="shieldtoggle"' + (h.shieldAuto ? ' checked' : '') + '> Щит: ставить автоматически при попадании (' + (h.res.freeShield ? h.res.freeShield + ' заряда посоха, ' : '') + 'ячейки 1-го ур.)</label>';
      if (h.cls === 'cleric' && C.comp) spells += '<label class="tog"><input type="checkbox" id="healComp" data-a="healcomp"' + (G.UI.healComp ? ' checked' : '') + '> Лечить напарника, а не себя</label>';
    }
    const status = 'Ход ' + C.round + ' · действие ' + (T.action ? '●' : '○') + ' · бонус ' + (T.bonus ? '●' : '○');
    out += '<div class="turn">' + status + '</div><div class="acts">' + acts + '</div>' + spells +
      '<div class="row wrap">' +
      '<label class="tog"><input type="checkbox" id="nonlethal" data-a="nonlethal"' + (C.nonlethal ? ' checked' : '') + '> Бить не насмерть (взять в плен)</label>' +
      '<button class="btn" data-a="endturn">Завершить ход</button></div>';
    return out;
  }
  function shortSpell(id) {
    const sp = G.SPELLS[id], h = G.S.hero, sc = sp.scale && h.lvl >= 5 ? 2 : 1;
    if (sp.kind === 'attack') return 'атака ' + G.fmt(G.spellHit()) + ', ' + (sp.dice[0] * sc) + 'к' + sp.dice[1];
    if (sp.kind === 'save') return 'Сл ' + G.spellDC() + ', ' + (sp.dice[0] * sc) + 'к' + sp.dice[1] + (sp.targets > 1 ? (sp.targets > 5 ? ', все' : ', до ' + sp.targets) : '');
    if (sp.kind === 'auto') return '3×(1к4+1)';
    if (sp.kind === 'rays') return '3 луча по 2к6';
    if (sp.kind === 'heal') return '+' + sp.dice[0] + 'к' + sp.dice[1] + '+' + (G.spellMod() + 2 + sp.lvl);
    if (sp.kind === 'hold') return 'Сл ' + G.spellDC() + ', паралич';
    if (id === 'sleep') return '5к8 хитов врагов';
    if (id === 'bless') return '+1к4 атакам';
    if (id === 'shield_of_faith') return '+2 КД';
    if (id === 'spirit_guardians') return '3к8 всем, каждый ход';
    if (id === 'spiritual_weapon') return '1к8' + G.fmt(G.spellMod()) + ' каждый ход';
    if (id === 'mage_armor') return 'КД ' + (13 + G.mod('dex'));
    return '';
  }

  /* ---------- листы ---------- */
  function sheetWrap(title, body) {
    return '<div class="sheet-bg" data-a="close"></div><section class="sheet" role="dialog" aria-label="' + E(title) + '"><div class="sheet-h"><h2>' + title + '</h2><button class="btn" data-a="close">Закрыть</button></div>' + body + '</section>';
  }

  function heroSheet() {
    const S = G.S, h = S.hero, c = G.cls(), r = G.race();
    const ab = Object.keys(G.ABIL).map(k => '<div><dt>' + G.ABIL_SHORT[k] + '</dt><dd>' + G.score(k) + '</dd><small>' + G.fmt(G.mod(k)) + '</small></div>').join('');
    const skills = Object.keys(G.SKILLS).map(k => {
      const prof = G.hasSkill(k);
      return '<li class="' + (prof ? 'pr' : '') + '"><span>' + G.SKILLS[k][0] + ' <i>' + G.ABIL_SHORT[G.SKILLS[k][1]] + '</i></span><b>' + G.fmt(G.skillBonus(k)) + '</b></li>';
    }).join('');
    const feats = [];
    for (let l = 1; l <= h.lvl; l++) (c.features[l] || []).forEach(f => feats.push('<li><i>' + l + ' ур.</i> ' + f + '</li>'));
    const next = G.XP_LEVELS[h.lvl];
    const w = G.weapon();
    let spells = '';
    if (c.caster) {
      const mx = G.slotMax();
      spells = '<h3>Заклинания</h3><p class="muted">Сл спасброска ' + G.spellDC() + ' · атака ' + G.fmt(G.spellHit()) + ' · ячейки ' + [0, 1, 2].filter(i => mx[i]).map(i => (i + 1) + '-й: ' + h.slots[i] + '/' + mx[i]).join(', ') + '</p><ul class="spells">' +
        G.knownSpells().map(id => {
          const sp = G.SPELLS[id];
          const can = G.castable(id, false);
          return '<li><b>' + sp.name + '</b> <i>' + (sp.lvl ? sp.lvl + ' ур.' : 'заговор') + '</i><br><span>' + sp.text + '</span>' + (can ? ' <button class="link" data-a="castout:' + id + '">Сотворить</button>' : '') + '</li>';
        }).join('') + '</ul>';
    }
    return sheetWrap(E(h.name),
      '<p class="muted">' + r.name + ', ' + c.name.toLowerCase() + ' ' + h.lvl + ' уровня · опыт ' + h.xp + (next ? ' / ' + next : ' (максимум)') + '</p>' +
      '<dl class="abil">' + ab + '</dl>' +
      '<dl class="kv"><div><dt>КД</dt><dd>' + G.ac() + '</dd><small>' + E(G.armorName()) + (c.shield ? ', щит' : '') + '</small></div>' +
      '<div><dt>Хиты</dt><dd>' + h.hp + '/' + G.maxHp() + '</dd><small>кости хитов ' + h.hd + '/' + h.lvl + ' (к' + c.hd + ')</small></div>' +
      '<div><dt>Бонус мастерства</dt><dd>' + G.fmt(G.prof()) + '</dd></div>' +
      '<div><dt>Оружие</dt><dd>' + G.fmt(w.hit) + '</dd><small>' + E(w.name) + ', ' + w.dice[0] + 'к' + w.dice[1] + G.fmt(w.dmgMod) + '</small></div></dl>' +
      '<h3>Умения</h3><ul class="feats">' + feats.join('') + '</ul>' +
      '<h3>Раса: ' + r.name + '</h3><ul class="feats">' + r.perks.map(p => '<li>' + p + '</li>').join('') + '</ul>' +
      spells +
      '<h3>Навыки</h3><ul class="skills">' + skills + '</ul>' +
      '<p class="muted">Пассивная Внимательность ' + G.passive('perception') + (h.insp ? ' · <b class="gold">есть вдохновение</b> (перебросить проваленную проверку)' : '') + '</p>');
  }

  function bagSheet() {
    const S = G.S, h = S.hero;
    const ids = Object.keys(S.inv).filter(k => S.inv[k] > 0);
    const rows = ids.map(id => {
      const it = G.ITEMS[id], n = S.inv[id];
      let btns = '';
      if (it.use === 'heal' && !S.combat) {
        btns += '<button class="link" data-a="use:' + id + '"' + (h.hp >= G.maxHp() ? ' disabled' : '') + '>Выпить</button>';
        if (S.comp) btns += ' <button class="link" data-a="usecomp:' + id + '"' + (G.compHp() >= G.compDef().hp ? ' disabled' : '') + '>Дать напарнику</button>';
      }
      if (it.use === 'equip' && it.who && it.who.includes(h.cls) && !S.combat) btns += '<button class="link" data-a="use:' + id + '">' + (G.isEquipped(id) ? 'Снять' : 'Надеть') + '</button>';
      if (it.use === 'equip' && it.who && !it.who.includes(h.cls)) btns += '<span class="muted">не для вашего класса</span>';
      if (it.use === 'brandy' && !S.combat) btns += '<button class="link" data-a="brandy"' + (h.hp >= G.maxHp() ? ' disabled' : '') + '>Выпить стакан</button>';
      if (it.use === 'oracle' && !S.combat) btns += '<button class="link" data-a="oracle">Задать вопрос</button>';
      return '<li><div><b>' + it.name + (n > 1 ? ' ×' + n : '') + (G.isEquipped(id) ? ' <i class="gold">надето</i>' : '') + '</b><span>' + it.text + '</span></div><div>' + btns + '</div></li>';
    }).join('');
    return sheetWrap('Сумка',
      '<p class="money">Кошель: <b>' + G.fmtMoney(S.cp) + '</b></p>' +
      '<p class="muted">Снаряжение: ' + E(G.weapon().name) + ', ' + E(G.armorName()) + (G.cls().shield ? ', щит' : '') + (h.cls === 'rogue' ? ', воровские инструменты' : '') + (G.cls().caster ? ', ' + (h.cls === 'wizard' ? 'книга заклинаний' : 'священный символ') : '') + '.</p>' +
      '<ul class="items">' + (rows || '<li class="muted">Пусто.</li>') + '</ul>');
  }

  function journalSheet() {
    const S = G.S;
    const qs = Object.keys(S.quests);
    const act = qs.filter(q => S.quests[q] === 'active'), done = qs.filter(q => S.quests[q] === 'done');
    const qli = id => { const q = G.QUESTS[id]; return q ? '<li><b>' + q.name + '</b><span>' + G.val(q.text) + '</span>' + (q.from ? '<i>' + q.from + '</i>' : '') + '</li>' : ''; };
    return sheetWrap('Журнал',
      '<h3>Задания</h3><ul class="quests">' + (act.map(qli).join('') || '<li class="muted">Нет активных заданий.</li>') + '</ul>' +
      (done.length ? '<h3>Выполнено</h3><ul class="quests done">' + done.map(qli).join('') + '</ul>' : '') +
      '<h3>Заметки</h3><ul class="clues">' + (S.clues.map(c => '<li>' + c + '</li>').join('') || '<li class="muted">Пока пусто.</li>') + '</ul>' +
      '<p class="muted">Бросков: ' + S.st.rolls + ' · двадцаток: ' + S.st.crits + ' · боёв: ' + S.st.fights + ' · побеждено врагов: ' + S.st.kills + '</p>');
  }

  function menuSheet() {
    const conf = G.UI.confirm;
    return sheetWrap('Меню',
      '<div class="col">' +
      (G.canRest() ? '<button class="btn" data-a="sheet:rest">Привал (короткий отдых)</button>' : '<p class="muted">Отдохнуть здесь нельзя. Короткий отдых доступен в безопасных местах, длительный — на постоялом дворе или в лагере.</p>') +
      (G.loadCP() && !G.S.combat ? '<button class="btn" data-a="retry">Вернуться к началу последнего боя</button>' : '') +
      '<p class="muted">Игра сохраняется автоматически после каждого шага.</p>' +
      (conf ? '<p class="warn">Весь прогресс пропадёт. Точно начать заново?</p><div class="row"><button class="btn warn" data-a="wipe">Да, начать заново</button><button class="btn" data-a="noconfirm">Отмена</button></div>'
        : '<button class="btn warn" data-a="askwipe">Начать новую игру</button>') +
      '</div>');
  }

  function restSheet() {
    const S = G.S, h = S.hero, c = G.cls();
    const log = G.UI.restHeal.length ? '<p class="note gain">Восстановлено: ' + G.UI.restHeal.map(x => '+' + x).join(', ') + ' хитов.</p>' : '';
    return sheetWrap('Короткий отдых',
      '<p>Час отдыха. Можно потратить кости хитов, чтобы подлечиться: каждая лечит 1к' + c.hd + G.fmt(G.mod('con')) + '. Восстанавливаются умения «на короткий отдых»' + (h.cls === 'wizard' ? ' и срабатывает Магическое восстановление' : '') + '.</p>' +
      '<p>Хиты: <b>' + h.hp + '/' + G.maxHp() + '</b> · кости хитов: <b>' + h.hd + '</b></p>' + log +
      '<div class="row"><button class="btn" data-a="hd"' + (h.hd && h.hp < G.maxHp() ? '' : ' disabled') + '>Потратить кость хитов</button>' +
      '<button class="btn main" data-a="finishrest">Закончить отдых</button></div>');
  }

  function shopSheet() {
    const S = G.S, sh = G.SHOPS[G.UI.shop], h = S.hero;
    const rows = G.val(sh.items).filter(i => !i.who || i.who.includes(h.cls)).map((i, k) => {
      const owned = i.once && G.has(i.id);
      return '<li><div><b>' + G.ITEMS[i.id].name + '</b><span>' + G.ITEMS[i.id].text + '</span></div><div><button class="btn" data-a="buy:' + k + '"' + (S.cp >= i.price && !owned ? '' : ' disabled') + '>' + (owned ? 'Куплено' : G.fmtMoney(i.price)) + '</button></div></li>';
    }).join('');
    return sheetWrap(sh.name, '<p class="muted">' + G.val(sh.text) + '</p><p class="money">Кошель: <b>' + G.fmtMoney(S.cp) + '</b></p><ul class="items">' + (rows || '<li class="muted">Для вашего класса здесь ничего нет.</li>') + '</ul>');
  }

  function defeatSheet() {
    return '<div class="sheet-bg"></div><section class="sheet" role="dialog"><div class="sheet-h"><h2>Поражение</h2></div>' +
      '<p>Тьма смыкается. Но история ещё не окончена: можно вернуться к моменту перед боем и попробовать иначе.</p>' +
      '<div class="col"><button class="btn main" data-a="retry">Вернуться к началу боя</button></div></section>';
  }

  function levelSheet() {
    const S = G.S, lu = S.levelUps[0], c = G.cls();
    const feats = (c.features[lu.lvl] || []).map(f => '<li>' + f + '</li>').join('');
    return '<div class="sheet-bg"></div><section class="sheet lvl" role="dialog"><div class="sheet-h"><h2>Новый уровень: ' + lu.lvl + '</h2></div>' +
      '<p>Хиты +' + lu.hp + ', ещё одна кость хитов.' + (lu.lvl === 5 ? ' Бонус мастерства теперь +3.' : '') + '</p><ul class="feats">' + feats + '</ul>' +
      '<div class="col"><button class="btn main" data-a="lvlok">Отлично</button></div></section>';
  }

  /* ---------- титул и создание ---------- */
  function titleHTML() {
    const saved = G.load();
    return '<main class="wrap title">' +
      '<p class="eyebrow">Приключение для одного героя · D&amp;D 5e</p>' +
      '<h1 class="big">Затерянные рудники Фанделвера</h1>' +
      '<p class="lede">Текстовая игра по стартовому модулю «Затерянные рудники Фанделвера». Гоблинские засады, банда Красноклеймённых, таинственный Чёрный Паук и легендарная Кузница Заклинаний. Герой растёт с 1 по 5 уровень.</p>' +
      '<p class="muted">Сейчас доступны главы 1–3. Глава 4 появится в следующем обновлении, сохранения перенесутся.</p>' +
      '<div class="choices">' +
      (saved ? '<button class="choice main" data-a="continue"><span>Продолжить: ' + E(saved.hero.name) + ', ' + G.CLASSES[saved.hero.cls].name.toLowerCase() + ' ' + saved.hero.lvl + ' ур.</span><span class="tag">' + E(saved.loc || '') + '</span></button>' : '') +
      '<button class="choice' + (saved ? '' : ' main') + '" data-a="create"><span>Новый герой</span></button>' +
      '</div></main>';
  }

  function createHTML() {
    const cr = CREATE;
    const tmp = { hero: { race: cr.race, cls: cr.cls, lvl: 1, equip: {}, mageArmor: false }, inv: {} };
    const keep = G.S; G.S = tmp;
    const stats = Object.keys(G.ABIL).map(k => '<div><dt>' + G.ABIL_SHORT[k] + '</dt><dd>' + G.score(k) + '</dd><small>' + G.fmt(G.mod(k)) + '</small></div>').join('');
    const hp = G.maxHp(), ac = G.ac(), w = G.weapon();
    G.S = keep;
    const races = Object.keys(G.RACES).map(k => '<button class="card' + (cr.race === k ? ' sel' : '') + '" data-a="race:' + k + '"><b>' + G.RACES[k].name + '</b><span>' + G.RACES[k].text + '</span></button>').join('');
    const classes = Object.keys(G.CLASSES).map(k => '<button class="card' + (cr.cls === k ? ' sel' : '') + '" data-a="cls:' + k + '"><b>' + G.CLASSES[k].name + '</b><span>' + G.CLASSES[k].text + '</span></button>').join('');
    const c = G.CLASSES[cr.cls];
    return '<main class="wrap create">' +
      '<p class="eyebrow">Новый герой</p><h1>Кто отправится в Фандалин?</h1>' +
      '<label class="field" for="heroName"><span>Имя</span><input id="heroName" maxlength="24" autocomplete="off" value="' + E(cr.name) + '" placeholder="Например, Торин"></label>' +
      '<h3>Раса</h3><div class="cards">' + races + '</div>' +
      '<h3>Класс</h3><div class="cards">' + classes + '</div>' +
      '<section class="preview"><dl class="abil">' + stats + '</dl>' +
      '<p>Хиты <b>' + hp + '</b> · КД <b>' + ac + '</b> · ' + E(w.name) + ' ' + G.fmt(w.hit) + ', ' + w.dice[0] + 'к' + w.dice[1] + G.fmt(w.dmgMod) + '</p>' +
      '<ul class="feats">' + c.features[1].map(f => '<li>' + f + '</li>').join('') + G.RACES[cr.race].perks.map(p => '<li>' + p + '</li>').join('') + '</ul></section>' +
      '<div class="choices"><button class="choice main" data-a="start"><span>Начать приключение</span></button><button class="choice" data-a="totitle"><span>Назад</span></button></div></main>';
  }

  /* ---------- главный рендер ---------- */
  G.render = (scrollTop) => {
    const S = G.S;
    if (!S) { app().innerHTML = G.UI.creating ? createHTML() : titleHTML(); bindCreate(); return; }
    document.body.dataset.ch = S.chapter;
    let body = S.combat ? combatHTML() : sceneHTML();
    let sheet = '';
    if (S.levelUps && S.levelUps.length && !S.combat) sheet = levelSheet();
    else if (G.UI.sheet === 'defeat') sheet = defeatSheet();
    else if (G.UI.sheet === 'hero') sheet = heroSheet();
    else if (G.UI.sheet === 'bag') sheet = bagSheet();
    else if (G.UI.sheet === 'journal') sheet = journalSheet();
    else if (G.UI.sheet === 'menu') sheet = menuSheet();
    else if (G.UI.sheet === 'rest') sheet = restSheet();
    else if (G.UI.sheet === 'shop') sheet = shopSheet();
    app().innerHTML = header() + '<main class="wrap">' + body + '</main>' + (sheet ? '<div class="overlay">' + sheet + '</div>' : '');
    if (scrollTop) window.scrollTo(0, 0);
  };

  function bindCreate() {
    const inp = document.getElementById('heroName');
    if (inp) inp.addEventListener('input', () => { CREATE.name = inp.value; });
  }

  /* ---------- обработка нажатий ---------- */
  document.addEventListener('click', ev => {
    const b = ev.target.closest('[data-a],[data-c]');
    if (!b || b.disabled) return;
    if (b.tagName === 'INPUT') return;
    const S = G.S;
    if (b.dataset.c !== undefined) return G.choose(CUR[+b.dataset.c]);
    const [a, arg] = b.dataset.a.split(':');
    switch (a) {
      case 'create': G.UI.creating = true; return G.render();
      case 'totitle': G.UI.creating = false; return G.render();
      case 'race': CREATE.race = arg; return G.render();
      case 'cls': CREATE.cls = arg; return G.render();
      case 'start': {
        const nm = (CREATE.name || '').trim() || { fighter: 'Торин', rogue: 'Лира', cleric: 'Бренна', wizard: 'Альдрик' }[CREATE.cls];
        G.UI.creating = false;
        G.newState(nm, CREATE.race, CREATE.cls);
        G.wipeCP && G.wipeCP();
        return G.go('c1_intro');
      }
      case 'continue': G.S = G.load(); G.UI.logSeen = G.S.combat ? G.S.combat.log.length : 0; return G.render(true);
      case 'sheet': G.UI.sheet = arg; G.UI.confirm = false; G.UI.restHeal = []; return G.render();
      case 'close': if (G.UI.sheet === 'defeat') return; G.UI.sheet = null; return G.render();
      case 'askwipe': G.UI.confirm = true; return G.render();
      case 'noconfirm': G.UI.confirm = false; return G.render();
      case 'wipe': G.wipe(); G.S = null; G.UI.sheet = null; G.UI.confirm = false; return G.render(true);
      case 'retry': G.retryFight(); return;
      case 'hd': { const got = G.spendHD(); if (got) G.UI.restHeal.push(got); G.save(); return G.render(); }
      case 'finishrest': return G.finishShortRest();
      case 'lvlok': S.levelUps.shift(); G.save(); return G.render();
      case 'use': return G.useItemOutside(arg, 'hero');
      case 'usecomp': return G.useItemOutside(arg, 'comp');
      case 'castout': return G.castOutside(arg);
      case 'brandy': { if (!S.f.brandyLeft) S.f.brandyLeft = 20; S.f.brandyLeft--; G.heal(1); if (S.f.brandyLeft <= 0) G.take('brandy'); G.note('Дварфский бренди обжигает горло: +1 хит.', 'muted'); G.save(); return G.render(); }
      case 'oracle': G.UI.sheet = null; return G.go('c3_oracle');
      case 'buy': {
        const sh = G.SHOPS[G.UI.shop];
        const list = G.val(sh.items).filter(i => !i.who || i.who.includes(S.hero.cls));
        const it = list[+arg];
        if (!it || S.cp < it.price) return;
        S.cp -= it.price; G.give(it.id, 1, true);
        if (G.ITEMS[it.id].use === 'equip' && !G.isEquipped(it.id)) G.useItemOutside(it.id);
        G.save(); return G.render();
      }
      case 'endfight': return G.endFight();
      case 'tgt': return G.act.target(+arg);
      case 'atk': return G.act.attack();
      case 'wind': return G.act.wind();
      case 'surge': return G.act.surge();
      case 'aim': return G.act.aim();
      case 'hide': return G.act.hide();
      case 'channel': return G.act.channel(arg);
      case 'sw': return G.act.sw();
      case 'potion': return G.act.potion(arg === 'comp' ? 'comp' : 'hero');
      case 'invis': return G.act.invis();
      case 'scroll': return G.act.scroll(arg);
      case 'revive': return G.act.revive();
      case 'dodge': return G.act.dodge();
      case 'flee': return G.act.flee();
      case 'cast': return G.act.cast(arg);
      case 'endturn': return G.act.end();
    }
  });
  document.addEventListener('change', ev => {
    const t = ev.target;
    if (!t.dataset || !t.dataset.a || !G.S) return;
    if (t.dataset.a === 'nonlethal') G.act.nonlethal();
    if (t.dataset.a === 'shieldtoggle') G.act.toggleShield();
    if (t.dataset.a === 'healcomp') { G.UI.healComp = t.checked; G.render(); }
  });

  G.boot = () => { G.S = null; G.render(); };
})();
