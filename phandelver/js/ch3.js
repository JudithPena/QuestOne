/* Глава 3: Паутина — дороги, дикая местность, Агата, Колодец Старой Совы, Вершина Виверны. */
(() => {
  const G = window.G, SC = G.SC, ENC = G.ENC;
  if (!G.READY_CHAPTERS.includes(3)) G.READY_CHAPTERS.push(3);
  G.ITEMS.goblin_note.name = 'Рисунок с наградой';

  Object.assign(G.QUESTS, {
    know_castle: { name: 'Где Замок Каменной Пасти?', from: 'Сильдар Холлвинтер', text: 'Узнать дорогу к замку: допросить гоблина из патруля, спросить друида Рейдота или баньши Агату.' }
  });

  /* ========== ПУТЕШЕСТВИЯ ========== */
  const DEST = {
    triboar: { to: 'c3_triboar_scout', days: 1, name: 'Триборская тропа' },
    conyberry: { to: 'c3_conyberry', days: 2, name: 'Кониберри' },
    owl: { to: 'c3_owl_arrive', days: 2, name: 'Колодец Старой Совы' },
    wyvern: { to: 'c3_wyvern_arrive', days: 2, name: 'Вершина Виверны' },
    thundertree: { to: 'c3t_arrive', days: 2, name: 'Громодеревье' },
    castle: { to: 'c3c_approach', days: 2, name: 'Замок Каменной Пасти' },
    home: { to: 'c3_home', days: 2, name: 'Фандалин' },
    home1: { to: 'c3_home', days: 1, name: 'Фандалин' }
  };
  G.startTrip = key => {
    const d = DEST[key];
    G.S.trip = { to: d.to, left: d.days * 2 - 1, name: d.name, restAfter: false };
    G.S.notes = [];
    G.note('Дорога: ' + d.name + ' (' + d.days + ' ' + G.plural(d.days, 'день', 'дня', 'дней') + ' пути).', 'muted');
    G.go('c3_trip');
  };

  /* Таблица встреч в дикой местности: день / ночь (к12) */
  const DAY = [0, 'stirge', 'stirge', 'ogre', 'ogre', 'goblin', 'goblin', 'hobgoblin', 'hobgoblin', 'orc', 'orc', 'wolf', 'owlbear'];
  const NIGHT = [0, 'stirge', 'stirge', 'stirge', 'ghoul', 'goblin', 'hobgoblin', 'orc', 'orc', 'wolf', 'wolf', 'owlbear', 'owlbear'];

  SC.c3_trip = {
    chapter: 3, loc: 'В пути', title: 'Дорога',
    enter: s => {
      const t = s.trip;
      if (!t) return G.go('c2_town');
      if (t.restAfter) { t.restAfter = false; G.longRest('лагерь'); }
      while (t.left > 0) {
        const night = t.left % 2 === 0;
        t.left--;
        if (G.rnd(20) >= 17) {
          t.enc = (night ? NIGHT : DAY)[G.rnd(12)];
          t.night = night;
          if (night) t.restAfter = true;
          return G.go('c3_enc');
        }
        if (night) { G.longRest('ночь в лагере прошла спокойно'); }
      }
      const to = t.to;
      s.trip = null;
      G.go(to);
    },
    text: ['Дорога.'], choices: [{ t: 'Дальше', go: 'c2_town' }]
  };

  const ENC_TEXT = {
    stirge: ['Из сумерек с тонким писком вылетают кровопийцы — летучие твари с хоботками, похожие на помесь летучей мыши и комара. Их манит свет костра и тёплая кровь.'],
    ghoul: ['Из темноты, шаркая, выходит упырь: серая кожа, длинный язык, когти, от которых немеет тело. Нежить жаждет живой плоти.'],
    ogre: ['Земля вздрагивает от тяжёлых шагов. Из-за холма показывается огр — девять футов тупой злобы с дубиной в руках. Он ищет лёгкую добычу, а бежать огры не умеют.'],
    goblin: ['На тропе — гоблины Каменной Пасти с подпиленными зубами. Это патруль. Такие знают дорогу к замку своего короля.'],
    hobgoblin: ['Отряд хобгоблинов в ржавых кольчугах идёт строем, как солдаты. Один сверяется с каким-то листком и тычет в вас пальцем: «Это они!»'],
    orc: ['Орки-разведчики с секирами. На щитах знак племени Много Стрел. От них пахнет дымом сожжённых хуторов.'],
    wolf: ['Волки кружат среди деревьев, отрезая путь. Голодная стая.'],
    owlbear: ['Раздаётся рёв, от которого стынет кровь. Сквозь кусты ломится совомед — огромный зверь, наполовину медведь, наполовину сова. Он учуял вас и не отстанет.']
  };
  const ENC_DEF = {
    stirge: { enemies: [{ k: 'stirge', n: 3 }, { k: 'stirge', n: 1, name: 'Кровопийца 4', ifComp: true }], xp: 38 },
    ghoul: { enemies: [{ k: 'ghoul', n: 1 }, { k: 'ghoul', n: 1, name: 'Упырь 2', ifComp: true }], xp: 100 },
    ogre: { enemies: [{ k: 'ogre', n: 1, soloHp: 36 }], xp: 225 },
    goblin: { enemies: [{ k: 'goblin', n: 3 }, { k: 'goblin', n: 1, name: 'Гоблин 4', ifComp: true }], xp: 75 },
    hobgoblin: { enemies: [{ k: 'hobgoblin', n: 2 }, { k: 'hobgoblin', n: 1, name: 'Хобгоблин 3', ifComp: true }], xp: 100 },
    orc: { enemies: [{ k: 'orc', n: 2 }, { k: 'orc', n: 1, name: 'Орк 3', ifComp: true }], xp: 100 },
    wolf: { enemies: [{ k: 'wolf', n: 2 }, { k: 'wolf', n: 1, name: 'Волк 3', ifComp: true }], xp: 50 },
    owlbear: { enemies: [{ k: 'owlbear', n: 1, soloHp: 38, soloMulti: 1 }], xp: 350 }
  };
  Object.keys(ENC_DEF).forEach(k => {
    const d = ENC_DEF[k];
    ENC['c3_rnd_' + k] = { title: 'Встреча в пути', enemies: d.enemies, xp: d.xp, xpWhy: 'встреча в дикой местности', win: 'c3_enc_after',
      onWin: (s, info) => { s.f.lastEncType = k; if (k === 'goblin' || k === 'hobgoblin') s.f.encCaptured = info.captured; } };
    ENC['c3_rnd_' + k + '_first'] = Object.assign({}, ENC['c3_rnd_' + k], { surprise: 'hero' });
  });
  SC.c3_enc = {
    chapter: 3, loc: 'В пути', title: s => (s.trip && s.trip.night ? 'Ночь у костра' : 'На тропе'),
    text: s => [(s.trip && s.trip.night ? 'Среди ночи дозорный слышит шорох.' : 'Посреди дня на пути возникает угроза.')].concat(ENC_TEXT[s.trip.enc]),
    choices: s => {
      const k = s.trip.enc;
      const c = [{ t: 'Сразиться', fight: 'c3_rnd_' + k }];
      if (['goblin', 'hobgoblin', 'orc', 'ogre', 'wolf'].includes(k) && !s.trip.night) c.push({ t: 'Затаиться и пропустить их', check: { skill: 'stealth', dc: 13, ok: 'c3_enc_hidden', fail: 'c3_enc_spotted' } });
      if (['goblin', 'hobgoblin', 'orc'].includes(k)) c.push({ t: 'Ударить первыми из засады', check: { skill: 'stealth', dc: 12, ok: 'c3_enc_ambush', fail: 'c3_enc_spotted' } });
      if (k === 'goblin' || k === 'hobgoblin') c.push({ t: '(Совет: включите в бою «Бить не насмерть», чтобы взять пленного)', go: 'c3_enc' });
      return c;
    }
  };
  SC.c3_enc_hidden = {
    chapter: 3, loc: 'В пути', title: 'Пронесло',
    text: ['Вы замираете в кустах. Враги проходят в двадцати шагах и скрываются за холмом.'],
    choices: [{ t: 'Продолжить путь', go: 'c3_trip' }]
  };
  SC.c3_enc_spotted = {
    chapter: 3, loc: 'В пути', title: 'Замечены!',
    text: ['Треснула ветка. Вас заметили.'],
    choices: s => [{ t: 'К бою!', fight: 'c3_rnd_' + s.trip.enc }]
  };
  SC.c3_enc_ambush = {
    chapter: 3, loc: 'В пути', title: 'Засада',
    text: ['Вы обходите врагов с подветренной стороны. Они ничего не подозревают.'],
    choices: s => [{ t: 'Напасть', fight: 'c3_rnd_' + s.trip.enc + '_first' }]
  };
  SC.c3_enc_after = {
    chapter: 3, loc: 'В пути', title: 'После схватки',
    enter: s => {
      const k = s.f.lastEncType;
      if (k === 'goblin' && !s.f['encloot' + s.st.fights]) { s.f['encloot' + s.st.fights] = true; G.money(G.roll(3, 10), 'медяки из гоблинских мешочков'); }
      if (k === 'hobgoblin' && !G.has('goblin_note')) { G.give('goblin_note'); G.clue('Хобгоблины охотятся за вами: «25 золотых за этого» и знак чёрного паука. Чёрный Паук знает о вас.'); }
    },
    text: s => {
      const k = s.f.lastEncType;
      const t = ['Бой окончен.'];
      if (k === 'hobgoblin') t.push('У одного хобгоблина за поясом грубый рисунок: ваше лицо, подпись «25 золотых за этого» и знак чёрного паука внизу.');
      if ((k === 'goblin' || k === 'hobgoblin') && s.f.encCaptured) t.push('Один из врагов оглушён и связан.');
      return t;
    },
    choices: s => [
      { t: 'Допросить гоблина о Замке Каменной Пасти', if: s => s.f.lastEncType === 'goblin' && s.f.encCaptured && !s.f.knowCastle, check: { skill: 'intimidation', dc: 10, ok: 'c3_goblin_talks', fail: 'c3_goblin_silent' } },
      { t: 'Допросить хобгоблина', if: s => s.f.lastEncType === 'hobgoblin' && s.f.encCaptured && !s.f.knowCastle, go: 'c3_hob_silent' },
      { t: 'Продолжить путь', go: 'c3_trip', do: s => { s.f.encCaptured = 0; } }
    ]
  };
  SC.c3_goblin_talks = {
    chapter: 3, loc: 'В пути', title: 'Пленный гоблин',
    enter: s => { s.f.encCaptured = 0; G.learnCastle('пленный гоблин'); },
    text: ['Гоблин трясётся и выкладывает всё: Замок Каменной Пасти стоит в Невервинтерском лесу, в двух днях пути от Фандалина. Там король Грол и «важная тёмная эльфийка» — посланница Чёрного Паука. Вы отпускаете его, и он без оглядки удирает в кусты.'],
    choices: [{ t: 'Продолжить путь', go: 'c3_trip' }]
  };
  SC.c3_goblin_silent = {
    chapter: 3, loc: 'В пути', title: 'Пленный гоблин',
    enter: s => { s.f.encCaptured = 0; },
    text: ['Гоблин визжит, кусается и ничего не говорит. Ночью он перегрызает верёвку и сбегает.'],
    choices: [{ t: 'Продолжить путь', go: 'c3_trip' }]
  };
  SC.c3_hob_silent = {
    chapter: 3, loc: 'В пути', title: 'Пленный хобгоблин',
    enter: s => { s.f.encCaptured = 0; },
    text: s => G.has('scroll_charm') ? ['Хобгоблин смотрит с холодным презрением: пытки ему нипочём. Но свиток очарования личности у вас есть.'] : ['Хобгоблин смотрит с холодным презрением. Он скорее умрёт, чем выдаст короля. Разговорить такого можно только магией очарования.'],
    choices: s => [
      { t: 'Прочитать свиток очарования', if: s => G.has('scroll_charm') && s.hero.cls === 'wizard', go: 'c3_trip', do: s => { G.take('scroll_charm'); G.learnCastle('очарованный хобгоблин'); } },
      { t: 'Отпустить и продолжить путь', go: 'c3_trip' }
    ]
  };

  G.learnCastle = why => {
    const S = G.S;
    if (S.f.knowCastle) return;
    S.f.knowCastle = true;
    G.clue('Замок Каменной Пасти — в Невервинтерском лесу, в двух днях пути от Фандалина (' + why + ').');
    G.quest('know_castle', 'done');
    G.note('Теперь вы знаете дорогу к Замку Каменной Пасти.', 'quest');
  };
  G.learnCave = why => {
    const S = G.S;
    if (S.f.knowCave) return;
    S.f.knowCave = true;
    G.clue('Пещера Морского Эха — в холмах к востоку от Фандалина, в дне пути (' + why + ').');
    G.note('Теперь вы знаете дорогу к Пещере Морского Эха.', 'quest');
  };

  /* ========== ФАНДАЛИН: новые пути и награды ========== */
  SC.c2_travel.choices = s => {
    const ch4 = G.READY_CHAPTERS.includes(4);
    return [
      { t: 'Убежище Каменных Пастей', if: s => !s.f.c1_klarg_done || !s.f.c1_den_done, go: 'c2_back_to_cave', tag: 'глава 1' },
      { t: 'Разведать Триборскую тропу', go: 'c3_go_triboar', tag: 'гоблинские патрули · 1 день' },
      { t: 'Кониберри и логово баньши Агаты', go: 'c3_go_conyberry', tag: s.quests.banshee === 'active' ? 'задание Гараэль · 2 дня' : '2 дня' },
      { t: 'Колодец Старой Совы', go: 'c3_go_owl', tag: s.quests.old_owl === 'active' ? 'задание Дарана · 2 дня' : '2 дня' },
      { t: 'Вершина Виверны', go: 'c3_go_wyvern', tag: s.quests.orcs === 'active' ? 'орки · 2 дня' : '2 дня' },
      { t: 'Руины Громодеревья', go: 'c3_go_thundertree', tag: 'друид Рейдот · 2 дня' },
      { t: 'Замок Каменной Пасти', go: s.f.knowCastle ? 'c3_go_castle' : 'c3_castle_unknown', tag: s.f.knowCastle ? '2 дня' : 'дорога неизвестна' },
      { t: 'Пещера Морского Эха', if: s => s.f.knowCave, go: ch4 ? 'c4_go' : 'c3_ch4_locked', tag: ch4 ? '1 день' : 'глава 4 — скоро' },
      { t: 'Вернуться в город', go: 'c2_town' }
    ];
  };
  SC.c2_travel.text = ['Фандалин стоит в предгорьях гор Меча. Вокруг Триборская тропа, Невервинтерский лес, холмы и руины древних поселений. Путник проходит около двадцати четырёх миль в день.', '~Каждый день и каждую ночь в пути может случиться встреча. Ночёвка в лагере — это длительный отдых.'];
  ['triboar', 'conyberry', 'owl', 'wyvern', 'thundertree', 'castle'].forEach(k => {
    SC['c3_go_' + k] = { chapter: 3, title: 'В путь', enter: s => G.startTrip(k), text: [''], choices: [] };
  });
  SC.c3_go_home = { chapter: 3, title: 'Домой', enter: s => G.startTrip('home'), text: [''], choices: [] };
  SC.c3_go_home1 = { chapter: 3, title: 'Домой', enter: s => G.startTrip('home1'), text: [''], choices: [] };
  SC.c3_home = {
    chapter: 2, loc: 'Фандалин', title: 'Снова в Фандалине',
    text: s => ['Знакомые крыши Фандалина. Тоблен Стоунхилл машет вам с крыльца.' + (s.f.gundrenEscort && !s.f.gundrenHome ? ' Гандрен, опираясь на ваше плечо, щурится на город и улыбается в бороду.' : '')],
    choices: [{ t: 'На главную улицу', go: 'c2_town', main: true }]
  };
  SC.c3_castle_unknown = {
    chapter: 2, loc: 'Фандалин', title: 'Где же замок?',
    enter: s => G.quest('know_castle', 'active'),
    text: ['Никто в Фандалине не знает, где Замок Каменной Пасти. Сильдар советует искать гоблинские патрули вдоль Триборской тропы: пленный гоблин может знать дорогу. Квеллин Олдерлиф говорит, что всё здесь знает друид Рейдот из Громодеревья. А баньши Агата, по слухам, отвечает на любой вопрос.'],
    choices: [{ t: 'Назад', go: 'c2_travel' }]
  };
  SC.c3_ch4_locked = {
    chapter: 3, loc: 'Окрестности Фандалина', title: 'Пещера Морского Эха',
    text: ['Дорога к Пещере Морского Эха вам известна. Сама глава 4 появится в следующем обновлении игры. Ваш герой и все находки сохранятся.'],
    choices: [{ t: 'Назад', go: 'c2_travel' }]
  };

  /* Дополнения к сценам Фандалина: сдача заданий */
  const addChoices = (id, extra) => {
    const orig = SC[id].choices;
    SC[id].choices = s => extra.concat(G.val(orig) || []);
  };
  addChoices('c2_shrine', [
    { t: 'Рассказать Гараэль ответ Агаты', if: s => s.f.agathaBook && s.quests.banshee === 'active', go: 'c3_garaele_done' }
  ]);
  SC.c3_garaele_done = {
    chapter: 2, loc: 'Святилище Удачи', title: 'Сестра Гараэль',
    enter: s => { G.quest('banshee', 'done'); G.give('potion_heal', 3); },
    text: [
      '"«Тсернот из Ириэбора… Некромант. Сто лет назад». Гараэль быстро записывает. «Это нить, и Арфисты за неё потянут. Спасибо вам».',
      'Она вручает три зелья лечения и понижает голос: «Арфисты ищут людей, которые меняют мир к лучшему тихо, через знание. Если захотите, я назову вас Наблюдателем».'
    ],
    choices: [
      { t: 'Вступить в Арфисты', go: 'c2_shrine', do: s => { s.f.faction = 'Арфисты (Наблюдатель)'; G.note('Вы — Наблюдатель Арфистов.', 'quest'); } },
      { t: 'Поблагодарить', go: 'c2_shrine' }
    ]
  };
  addChoices('c2_orchard', [
    { t: 'Рассказать о Колодце Старой Совы', if: s => s.f.owlKnown && s.quests.old_owl === 'active', go: 'c3_daran_done' }
  ]);
  SC.c3_daran_done = {
    chapter: 2, loc: 'Сад Эдермата', title: 'Даран Эдермат',
    enter: s => { G.quest('old_owl', 'done'); G.xp(50, 'разведка Колодца Старой Совы'); },
    text: s => [
      s.f.kostDead ? '"«Красный Волшебник Тэя, некромант… и вы с ним покончили. Хорошо. Тэйцы не приносят в эти земли ничего, кроме смерти».' : '"«Красный Волшебник Тэя? Некромант, роющийся в нетерильских руинах… Пусть сидит тихо. Но я за ним присмотрю».',
      s.f.iarno_done ? '"«Вы не прошли мимо ни Красноклеймённых, ни этой угрозы. Ордену Перчатки нужны такие люди: честные и бдительные. Хотите стать Кавалером ордена?»' : ''
    ].filter(Boolean),
    choices: s => s.f.iarno_done ? [
      { t: 'Вступить в Орден Перчатки', go: 'c2_orchard', do: s => { s.f.faction = 'Орден Перчатки (Кавалер)'; G.note('Вы — Кавалер Ордена Перчатки.', 'quest'); } },
      { t: 'Поблагодарить', go: 'c2_orchard' }
    ] : [{ t: 'Дальше', go: 'c2_orchard' }]
  };
  addChoices('c2_hall', [
    { t: 'Доложить, что орки у Вершины Виверны перебиты', if: s => s.f.wyvernDone && s.quests.orcs === 'active', go: 'c2_hall', do: s => { G.quest('orcs', 'done'); G.money(10000, 'награда старосты'); s.tmp = 'Харбин Вестер пересчитывает монеты дрожащими пальцами, будто они его собственные. «Сто золотых, как обещано. Город… гм… благодарен».'; } }
  ]);
  addChoices('c2_stonehill', [
    { t: 'Вернуть Мирне Дендрар ожерелье', if: s => G.has('emerald_necklace') && s.f.dendrarsOut, go: 'c2_stonehill', do: s => { G.take('emerald_necklace'); G.quest('necklace', 'done'); G.xp(50, 'ожерелье возвращено'); s.tmp = 'Мирна прижимает ожерелье к груди и долго не может сказать ни слова. «Мамино… Вы вернули мне кусочек дома». Её дети смотрят на вас как на героев из сказки.'; } },
    { t: 'Продать изумрудное ожерелье скупщику', if: s => G.has('emerald_necklace'), go: 'c2_stonehill', do: s => { G.take('emerald_necklace'); G.quest('necklace', 'done'); G.money(20000, 'ожерелье продано'); } }
  ]);

  /* ========== ТРИБОРСКАЯ ТРОПА ========== */
  SC.c3_triboar_scout = {
    chapter: 3, loc: 'Триборская тропа', title: 'Разведка на тропе',
    text: [
      'Вы идёте вдоль Триборской тропы, высматривая следы засад, как советовал Сильдар. Лёгкий дождь моросит над холмами. К полудню на размокшей земле попадаются отпечатки маленьких босых ног с когтями.',
      'Гоблины. Судя по следам, патруль прошёл совсем недавно.'
    ],
    choices: [
      { t: 'Выследить патруль', check: { skill: 'survival', dc: 12, ok: 'c3_patrol_found', fail: 'c3_patrol_ambush' } },
      { t: 'Устроить засаду на тропе и ждать', check: { skill: 'stealth', dc: 11, ok: 'c3_patrol_found', fail: 'c3_patrol_ambush' } },
      { t: 'Уйти на восток, к Вершине Виверны', go: 'c3_go_wyvern' },
      { t: 'Вернуться в Фандалин', go: 'c3_go_home1' }
    ]
  };
  SC.c3_patrol_found = {
    chapter: 3, loc: 'Триборская тропа', title: 'Гоблинский патруль',
    text: ['Под старым дубом устроились гоблины Каменной Пасти: жуют вяленое мясо и спорят о добыче. Они вас не видят.', '~Чтобы узнать дорогу к замку, нужен живой пленник. Включите в бою «Бить не насмерть».'],
    choices: [{ t: 'Напасть', fight: 'c3_patrol_first' }]
  };
  SC.c3_patrol_ambush = {
    chapter: 3, loc: 'Триборская тропа', title: 'Гоблинский патруль',
    text: ['Стрела вонзается в землю у ваших ног. Гоблины заметили вас первыми!', '~Чтобы узнать дорогу к замку, нужен живой пленник. Включите в бою «Бить не насмерть».'],
    choices: [{ t: 'К бою!', fight: 'c3_patrol' }]
  };
  const patrol = { title: 'Гоблинский патруль', enemies: [{ k: 'goblin', n: 2 }, { k: 'goblin', n: 1, name: 'Гоблин 3', ifComp: true }], xp: 50, xpWhy: 'гоблинский патруль', win: 'c3_patrol_after', onWin: (s, info) => { s.f.patrolCaptured = info.captured; } };
  ENC.c3_patrol = Object.assign({}, patrol);
  ENC.c3_patrol_first = Object.assign({}, patrol, { surprise: 'hero' });
  SC.c3_patrol_after = {
    chapter: 3, loc: 'Триборская тропа', title: 'После боя',
    text: s => [s.f.patrolCaptured ? 'Один гоблин связан и скулит.' : 'Живых не осталось. Но следы патруля ведут в одну сторону — на север, к лесу.'],
    choices: s => [
      { t: 'Допросить пленного', if: s => s.f.patrolCaptured && !s.f.knowCastle, check: { skill: 'intimidation', dc: 10, ok: 'c3_patrol_talk', fail: 'c3_patrol_tracks' } },
      { t: 'Пойти по следам патруля назад', if: s => !s.f.knowCastle && !s.f.patrolTracked, check: { skill: 'survival', dc: 15, ok: 'c3_patrol_tracked', fail: 'c3_patrol_lost' } },
      { t: 'Вернуться в Фандалин', go: 'c3_go_home1' }
    ]
  };
  SC.c3_patrol_talk = {
    chapter: 3, loc: 'Триборская тропа', title: 'Пленный гоблин',
    enter: s => G.learnCastle('пленный гоблин с Триборской тропы'),
    text: ['Гоблин сдаётся почти сразу: «Замок! В лесу! Два дня отсюда на север, по старой тропе мимо сломанного моста. Там король Грол. И тёмная эльфийка, злая! Она пришла за дварфом!»'],
    choices: [{ t: 'Вернуться в Фандалин', go: 'c3_go_home1' }]
  };
  SC.c3_patrol_tracks = {
    chapter: 3, loc: 'Триборская тропа', title: 'Молчун',
    text: ['Гоблин только шипит. Но на его сапогах налипла хвоя, какой нет в здешних холмах: ели Невервинтерского леса.'],
    choices: [
      { t: 'Пойти по следам патруля назад', check: { skill: 'survival', dc: 15, ok: 'c3_patrol_tracked', fail: 'c3_patrol_lost' } },
      { t: 'Вернуться в Фандалин', go: 'c3_go_home1' }
    ]
  };
  SC.c3_patrol_tracked = {
    chapter: 3, loc: 'Триборская тропа', title: 'По следам',
    enter: s => { s.f.patrolTracked = true; G.learnCastle('следы патруля'); },
    text: ['Полдня вы идёте по следам на север. Они уводят в Невервинтерский лес, к старой охотничьей тропе. С холма видны далёкие обломки башен над деревьями. Это наверняка Замок Каменной Пасти.'],
    choices: [{ t: 'Вернуться в Фандалин и подготовиться', go: 'c3_go_home1' }]
  };
  SC.c3_patrol_lost = {
    chapter: 3, loc: 'Триборская тропа', title: 'Следы теряются',
    enter: s => { s.f.patrolTracked = true; },
    text: ['Дождь размывает следы, и у ручья вы их теряете окончательно.'],
    choices: [{ t: 'Вернуться в Фандалин', go: 'c3_go_home1' }]
  };

  /* ========== КОНИБЕРРИ И АГАТА ========== */
  SC.c3_conyberry = {
    chapter: 3, loc: 'Кониберри', title: 'Руины Кониберри',
    text: [
      'Много лет назад варвары разорили поселение Кониберри, и теперь от него остались лишь поросшие бурьяном фундаменты. Триборская тропа проходит прямо через руины. На северо-запад, в Невервинтерский лес, уходит старая тропка.',
      'Где-то там, в нескольких милях, — логово баньши Агаты.'
    ],
    choices: [
      { t: 'Идти по старой тропе в лес', go: 'c3_agatha_path' },
      { t: 'Вернуться в Фандалин', go: 'c3_go_home' }
    ]
  };
  SC.c3_agatha_path = {
    chapter: 3, loc: 'Логово Агаты', title: 'Тихий лес',
    text: [
      '>Чем глубже тропа уходит в чащу, тем темнее и тише становится лес. Ветви затянуты тяжёлыми лозами и мхом, воздух заметно холоднее, чем в разрушенной деревне. За очередным поворотом деревья стоят почти вплотную, их ветви сплелись в тёмный купол. Внутрь ведёт низкий проход.'
    ],
    choices: s => s.f.agathaGone ? [{ t: 'Агата больше не покажется. Уйти', go: 'c3_conyberry' }] : s.f.agathaAnswered ? [{ t: 'Агата уже ответила. Уйти', go: 'c3_conyberry' }] : [
      { t: 'Войти', go: 'c3_agatha' },
      { t: 'Уйти', go: 'c3_conyberry' }
    ]
  };
  SC.c3_agatha = {
    chapter: 3, loc: 'Логово Агаты', title: 'Агата',
    text: [
      '>Под куполом из переплетённых ветвей устроено что-то вроде дома: сундуки, полки, стол и кушетка. Всё ветхое, эльфийской работы.',
      '>Воздух резко холодеет, и вас охватывает страх. В воздухе мерцает холодный бледный свет и быстро принимает облик эльфийки. Её волосы и одежды развеваются на призрачном ветру. Может быть, когда-то она была красива, но ненависть исказила её черты. «Глупые смертные, — раздражённо произносит она. — Что вам здесь нужно? Разве вы не знаете, что искать меня — верная смерть?»'
    ],
    choices: s => [
      { t: 'Преподнести серебряный гребень от сестры Гараэль', if: s => G.has('garaele_comb'), go: 'c3_agatha_ask', do: s => { G.take('garaele_comb'); s.tmp = 'Агата берёт гребень призрачными пальцами и любуется собой в пустом воздухе. Холодная улыбка трогает её губы.'; } },
      { t: 'Почтительно поклониться и восхититься её легендарной мудростью', check: { skill: 'persuasion', dc: 15, adv: true, ok: 'c3_agatha_ask', fail: 'c3_agatha_vanish' } },
      { t: 'Спросить прямо', check: { skill: 'persuasion', dc: 15, ok: 'c3_agatha_ask', fail: 'c3_agatha_vanish' } },
      { t: 'Пригрозить: «Отвечай, дух, или пожалеешь»', go: 'c3_agatha_vanish' }
    ]
  };
  SC.c3_agatha_vanish = {
    chapter: 3, loc: 'Логово Агаты', title: 'Агата исчезает',
    enter: s => { s.f.agathaGone = true; },
    text: ['Агата хмурится. «Смертные всегда одинаковы». Свет гаснет, холод отступает. Сколько бы вы ни звали, она больше не вернётся.'],
    choices: [{ t: 'Уйти', go: 'c3_conyberry' }]
  };
  SC.c3_agatha_ask = {
    chapter: 3, loc: 'Логово Агаты', title: 'Один вопрос',
    text: ['Призрачная фигура холодно улыбается. «Очень хорошо. Я знаю, что вас интересует многое. Задайте один вопрос, и я дам один ответ».', '~Спросить можно только одно. Выбирайте осторожно.'],
    choices: s => [
      { t: '«Где книга заклинаний Боуджентла?»', if: s => s.quests.banshee === 'active', go: 'c3_agatha_answer', do: s => { s.f.agathaQ = 'book'; } },
      { t: '«Где Замок Каменной Пасти?»', if: s => !s.f.knowCastle, go: 'c3_agatha_answer', do: s => { s.f.agathaQ = 'castle'; } },
      { t: '«Где Пещера Морского Эха?»', if: s => !s.f.knowCave, go: 'c3_agatha_answer', do: s => { s.f.agathaQ = 'cave'; } },
      { t: '«Кто такой Чёрный Паук?»', go: 'c3_agatha_answer', do: s => { s.f.agathaQ = 'spider'; } },
      { t: '«Как звали волшебника, построившего башню Колодца Старой Совы?»', if: s => s.f.kostAsked, go: 'c3_agatha_answer', do: s => { s.f.agathaQ = 'kost'; } }
    ]
  };
  SC.c3_agatha_answer = {
    chapter: 3, loc: 'Логово Агаты', title: 'Ответ баньши',
    enter: s => {
      s.f.agathaAnswered = true;
      G.xp(50, 'Агата ответила');
      const q = s.f.agathaQ;
      if (q === 'book') { s.f.agathaBook = true; G.clue('Агата продала книгу заклинаний Боуджентла некроманту Тсерноту из Ириэбора больше ста лет назад.'); }
      if (q === 'castle') G.learnCastle('ответ Агаты');
      if (q === 'cave') G.learnCave('ответ Агаты');
      if (q === 'spider') G.clue('Агата: Чёрный Паук — дроу по имени Неззнар. Он ищет Кузницу Заклинаний в Пещере Морского Эха.');
      if (q === 'kost') { s.f.kostAnswer = true; G.clue('Агата: башню Колодца Старой Совы построил волшебник Артиндол.'); }
    },
    text: s => ({
      book: ['"«Книгу Боуджентла? Я продала её сто с лишним лет назад некроманту по имени Тсернот, из города Ириэбор. Что было с ней дальше, мне безразлично».'],
      castle: ['"«Замок, что гоблины зовут Каменной Пастью, построил маг Фалорма. Он стоит в Невервинтерском лесу, в двух днях пути к северу от вашего жалкого городка. Семь башен, шесть из них мертвы».'],
      cave: ['"«Пещера, что поёт голосом моря, лежит в холмах к востоку от Фандалина, в дне пути. Там, где земля дышит эхом прибоя, хотя до моря сотни миль. И там уже ходит тот, кого вы зовёте Пауком».'],
      spider: ['"«Паук… Дроу по имени Неззнар. Тёмный эльф из глубин. Он жаждет Кузницы Заклинаний, и его сети уже оплели ваш городок».'],
      kost: ['"«Артиндол. Тщеславный маг, возомнивший себя бессмертным. Передайте тэйцу, что ему не понравится то, что он найдёт».']
    })[s.f.agathaQ].concat(['Свет гаснет. Агата исчезла.']),
    choices: [{ t: 'Уйти', go: 'c3_conyberry' }]
  };

  /* ========== КОЛОДЕЦ СТАРОЙ СОВЫ ========== */
  SC.c3_owl_arrive = {
    chapter: 3, loc: 'Колодец Старой Совы', title: 'Колодец Старой Совы',
    enter: s => { s.f.owlKnown = s.f.owlKnown || false; },
    text: s => {
      if (s.f.kostDead) return ['Руины пусты. Палатки Красного Волшебника хлопают на ветру.'];
      const t = ['>Поднявшись на низкий хребет, вы видите среди скал осыпавшиеся руины старой сторожевой башни. Место настолько древнее, что от стен остались лишь груды обломков во дворе у башни. Среди двора стоят пёстрые палатки, но людей не видно. Во дворе — старый колодец.'];
      if (G.passive('perception') >= 10) t.push('Ветер доносит тяжёлый трупный смрад со стороны развалин.');
      return t;
    },
    choices: s => s.f.kostDead ? [{ t: 'Уйти', go: 'c3_go_home' }] : s.f.kostMet ? [{ t: 'Поговорить с Хаманом Костом', go: 'c3_kost' }, { t: 'Уйти', go: 'c3_go_home' }] : [
      { t: 'Окликнуть лагерь', go: 'c3_kost_greet' },
      { t: 'Подкрасться к палаткам', go: 'c3_owl_zombies' },
      { t: 'Уйти', go: 'c3_go_home' }
    ]
  };
  SC.c3_owl_zombies = {
    chapter: 3, loc: 'Колодец Старой Совы', title: 'Мертвецы',
    text: ['Из основания разрушенной башни, шаркая, выходят зомби. Серая гниющая плоть, пустые глаза. Их много — больше, чем вы успеваете сосчитать.'],
    choices: [
      { t: 'Крикнуть: «Мы пришли с миром!»', go: 'c3_kost_greet' },
      { t: 'Сражаться', fight: 'c3_owl_zombies' }
    ]
  };
  ENC.c3_owl_zombies = {
    title: 'Зомби Колодца Старой Совы', enemies: [{ k: 'zombie_plain', n: 2 }, { k: 'zombie_plain', n: 1, name: 'Зомби 3', ifComp: true }],
    win: 'c3_kost_after_zombies', xp: 50, xpWhy: 'зомби'
  };
  SC.c3_kost_after_zombies = {
    chapter: 3, loc: 'Колодец Старой Совы', title: 'Красный Волшебник',
    text: ['Из самой большой палатки выходит тучный человек в красной мантии и сердито оглядывает разбросанные останки. «Что всё это значит? Вы хоть представляете, сколько сил уходит на каждого?»'],
    choices: [{ t: 'Поговорить', go: 'c3_kost' }, { t: 'Напасть', fight: 'c3_kost' }]
  };
  SC.c3_kost_greet = {
    chapter: 3, loc: 'Колодец Старой Совы', title: 'Красный Волшебник',
    text: [
      'Из основания башни выходят зомби. Но прежде чем они успевают подойти, из палатки раздаётся властный окрик, и мертвецы замирают.',
      'Хозяин лагеря — тучный человек в красной мантии. У него землистая кожа, бритая голова и чёрная татуировка на лбу. «Гости, — произносит он без особой радости. — Что ж, говорите, раз пришли».'
    ],
    choices: [{ t: 'Представиться', go: 'c3_kost' }]
  };
  SC.c3_kost = {
    chapter: 3, loc: 'Колодец Старой Совы', title: 'Хаман Кост',
    enter: s => { s.f.kostMet = true; s.f.owlKnown = true; },
    text: s => {
      const t = ['Хаман Кост не распространяется, что ищет в руинах. «Это старая башня нетерильской империи. Её тайны принадлежат тому, кто их откопает».'];
      if (G.skillBonus('arcana') >= 2) t.push('Татуировка на лбу — знак некроманта.');
      if (G.skillBonus('history') >= 2) t.push('Мантия и татуировки выдают в нём Красного Волшебника из Тэя, далёкой страны на востоке.');
      if (!s.f.kostDeal) t.push('"«Вам что-то нужно? Я не прочь помочь. Но не даром. Орки с Вершины Виверны разведали мой лагерь, это неприятно. И ещё: я хотел бы знать имя волшебника, построившего эту башню. Баньши Агата знает, но злить её я не рискну. Сделайте для меня одно из двух, и я расскажу то, что вам нужно».');
      return t;
    },
    choices: s => [
      { t: 'Согласиться на его условия', if: s => !s.f.kostDeal, go: 'c3_kost', do: s => { s.f.kostDeal = true; s.f.kostAsked = true; G.clue('Хаман Кост, Красный Волшебник Тэя, копает в Колодце Старой Совы. Он поделится сведениями, если перебить орков на Вершине Виверны или узнать у Агаты имя строителя башни.'); s.tmp = '«Превосходно». Кост кивает и возвращается к своим картам.'; } },
      { t: 'Орки на Вершине Виверны перебиты', if: s => s.f.kostDeal && s.f.wyvernDone && !s.f.kostFavor1, go: 'c3_kost_reward', do: s => { s.f.kostFavor1 = true; } },
      { t: 'Назвать имя строителя башни: Артиндол', if: s => s.f.kostDeal && s.f.kostAnswer && !s.f.kostFavor2, go: 'c3_kost_reward', do: s => { s.f.kostFavor2 = true; } },
      { t: 'Напасть на некроманта', fight: 'c3_kost' },
      { t: 'Уйти', go: 'c3_go_home' }
    ]
  };
  SC.c3_kost_reward = {
    chapter: 3, loc: 'Колодец Старой Совы', title: 'Плата Коста',
    text: ['"«Сделка есть сделка, — говорит Кост. — Спрашивайте».'],
    choices: s => [
      { t: '«Где Замок Каменной Пасти?»', if: s => !s.f.knowCastle, go: 'c3_kost', do: s => { G.learnCastle('Хаман Кост'); s.tmp = '«Гоблинский король сидит в развалинах фалормского замка в Невервинтерском лесу, в двух днях к северу. Мои зомби видели их патрули».'; } },
      { t: '«Где Пещера Морского Эха?»', if: s => !s.f.knowCave, go: 'c3_kost', do: s => { G.learnCave('Хаман Кост'); s.tmp = '«Дварфийский рудник Пакта? В холмах к востоку от Фандалина, в дне пути. Нетерильцы о нём знали. Там сейчас неспокойно: кто-то пробудил мёртвых».'; } },
      { t: '«Кто такой Чёрный Паук?»', go: 'c3_kost', do: s => { G.clue('Хаман Кост: Чёрный Паук — дроу. Кост слышал о нём от торговцев.'); s.tmp = '«Дроу, как говорят. Тёмный эльф. Лезет туда, где пахнет древней магией. Как и я, признаю».'; } }
    ]
  };
  ENC.c3_kost = {
    title: 'Хаман Кост', enemies: [{ k: 'kost', n: 1 }, { k: 'zombie_plain', n: 1 }, { k: 'zombie_plain', n: 1, name: 'Зомби 2', ifComp: true }],
    xp: 200, xpWhy: 'Красный Волшебник повержен', win: 'c3_kost_dead', onWin: s => { s.f.kostDead = true; s.f.owlKnown = true; }
  };
  SC.c3_kost_dead = {
    chapter: 3, loc: 'Колодец Старой Совы', title: 'Палатка некроманта',
    enter: s => {
      if (!s.f.kostLoot) {
        s.f.kostLoot = true;
        G.money(350 + 1000 + 2000 + 500 + 10000 + 2500, 'кожаная сумка: серебро, электрум, золото, платина, жемчужина, шкатулка');
        G.give('potion_heal'); G.give('scroll_darkness'); G.give('ring_protection');
        s.hero.equip.ring = true;
        G.note('Кольцо защиты надето: +1 к КД и спасброскам.', 'quest');
      }
    },
    rest: true,
    text: ['В палатке удобный походный набор, стул, письменный стол, припасы и сундук с одеждой. В сундуке кожаная сумка: монеты, крупная жемчужина, зелье лечения, свиток тьмы в костяном тубусе. И крохотная шкатулка с камнями, а в ней кольцо защиты из древнего Нетерила — лучшая находка Красного Мага.'],
    choices: [{ t: 'Вернуться в Фандалин', go: 'c3_go_home' }]
  };

  /* ========== ВЕРШИНА ВИВЕРНЫ ========== */
  SC.c3_wyvern_arrive = {
    chapter: 3, loc: 'Вершина Виверны', title: 'Вершина Виверны',
    text: s => s.f.wyvernDone ? ['Пещера на Вершине Виверны пуста. Только ветер и старые кострища.'] : [
      'Скала видна за двадцать миль — ориентир в холмах на северо-востоке гор Меча. Когда-то здесь гнездились виверны, но смельчаки давно их перебили. Теперь, говорят, тут засели орки из племени Много Стрел и огр.',
      'Вершина — большой холм среди миль пересечённой местности. Найти лагерь будет непросто.'
    ],
    choices: s => s.f.wyvernDone ? [{ t: 'Вернуться в Фандалин', go: 'c3_go_home' }] : [
      { t: 'Искать следы лагеря', check: { skill: 'survival', dc: 10, ok: 'c3_wyvern_found', fail: 'c3_wyvern_search' } },
      { t: 'Высматривать дым с высоты', check: { skill: 'perception', dc: 15, ok: 'c3_wyvern_found', fail: 'c3_wyvern_search' } },
      { t: 'Вернуться в Фандалин', go: 'c3_go_home' }
    ]
  };
  SC.c3_wyvern_search = {
    chapter: 3, loc: 'Вершина Виверны', title: 'Поиски',
    enter: s => { s.f.wyvHours = (s.f.wyvHours || 0) + 1; if (G.rnd(20) >= 18) s.f.wyvScouts = true; },
    text: s => s.f.wyvScouts ? ['Час поисков… И тут из-за камней навстречу выходят два орка-разведчика!'] : ['Час уходит на пустые поиски: камни, овраги, сухой кустарник.'],
    choices: s => s.f.wyvScouts ? [{ t: 'Бой', fight: 'c3_wyv_scouts' }] : SC.c3_wyvern_arrive.choices(s)
  };
  ENC.c3_wyv_scouts = { title: 'Орки-разведчики', enemies: [{ k: 'orc', n: 1 }, { k: 'orc', n: 1, name: 'Орк 2', ifComp: true }], xp: 25, win: 'c3_wyvern_arrive', onWin: s => { s.f.wyvScouts = false; } };
  SC.c3_wyvern_found = {
    chapter: 3, loc: 'Вершина Виверны', title: 'Лагерь орков',
    text: ['>Взобравшись по пологому склону, вы чуете слабый запах дыма. В пятидесяти ярдах, на дне ущелья, темнеет вход в пещеру. В двадцати ярдах от него на валуне сидит орк-часовой.'],
    choices: [
      { t: 'Подкрасться и снять часового без шума', check: { skill: 'stealth', dc: 11, ok: 'c3_wyv_sentry_sneak', fail: 'c3_wyv_sentry_alarm' } },
      { t: 'Атаковать открыто', go: 'c3_wyv_sentry_alarm' }
    ]
  };
  SC.c3_wyv_sentry_sneak = {
    chapter: 3, loc: 'Вершина Виверны', title: 'Часовой',
    text: ['Вы подбираетесь к часовому со спины. Надо свалить его быстро, пока он не поднял крик.'],
    choices: [{ t: 'Напасть', fight: 'c3_wyv_sentry' }]
  };
  ENC.c3_wyv_sentry = {
    title: 'Орк-часовой', enemies: [{ k: 'orc', n: 1, name: 'Орк-часовой' }], surprise: 'hero', win: 'c3_wyv_cave_door',
    onWin: (s, info) => { s.f.wyvAlarm = info.rounds > 2; }
  };
  SC.c3_wyv_sentry_alarm = {
    chapter: 3, loc: 'Вершина Виверны', title: 'Тревога!',
    enter: s => { s.f.wyvAlarm = true; },
    text: ['Часовой вскакивает, ревёт и бежит к пещере предупредить своих.'],
    choices: [{ t: 'За ним!', go: 'c3_wyv_cave_door' }]
  };
  SC.c3_wyv_cave_door = {
    chapter: 3, loc: 'Вершина Виверны', title: 'Пещера орков',
    text: s => [
      s.f.wyvAlarm ? 'Из пещеры доносится рёв и лязг оружия: орки поднялись.' : 'Часовой затих. Из пещеры доносятся хохот, треск костра и чавканье: там ничего не подозревают.',
      'Главарь шайки — Брагхор Топорогрыз, жестокий дикарь, которому убивать и грабить нравится больше, чем разведывать. С орками живёт огр Гог.'
    ],
    choices: s => [{ t: 'Ворваться в пещеру', fight: s.f.wyvAlarm ? 'c3_wyv_cave' : 'c3_wyv_cave_first' }, { t: 'Отступить', go: 'c3_go_home' }]
  };
  const wyv = {
    title: 'Пещера на Вершине Виверны',
    enemies: [
      { k: 'orc', n: 1, name: 'Брагхор Топорогрыз', hp: 30, soloHp: 20, leader: true },
      { k: 'orc', n: 1, name: 'Орк', follower: true, ifComp: true },
      { k: 'ogre', n: 1, name: 'Гог', hp: 40, soloHp: 28 }
    ],
    xp: 312, xpWhy: 'орки и огр с Вершины Виверны', win: 'c3_wyv_done', onWin: s => { s.f.wyvernDone = true; }
  };
  ENC.c3_wyv_cave = Object.assign({}, wyv);
  ENC.c3_wyv_cave_first = Object.assign({}, wyv, { surprise: 'hero' });
  SC.c3_wyv_done = {
    chapter: 3, loc: 'Вершина Виверны', title: 'Логово взято',
    enter: s => { if (!s.f.wyvLoot) { s.f.wyvLoot = true; G.money(750 + 1800 + 3100 + 3000 + 3000, 'сундук орков: монеты и три флакона духов'); } },
    rest: true,
    text: s => [
      'Шайка Брагхора разбита.' + (s.lastFight && s.lastFight.fled.length ? ' Уцелевшие орки разбежались по холмам.' : ''),
      'По пути сюда они разграбили несколько поселений на севере. В незапертом сундуке — медь, серебро, электрум, золото и три флакона духов.',
      s.quests.orcs === 'active' ? 'Староста Харбин Вестер обещал за это сто золотых.' : '',
      s.f.kostDeal ? 'Хаман Кост будет доволен.' : ''
    ].filter(Boolean),
    choices: [{ t: 'Вернуться в Фандалин', go: 'c3_go_home' }]
  };

  /* Статуэтка-оракул из замка */
  SC.c3_oracle = {
    chapter: 3, title: 'Золотая статуэтка',
    loc: s => s.loc,
    text: ['Вы берёте в ладони статуэтку солнечного эльфа и задаёте вопрос. Металл теплеет, и в голове звучит ясный спокойный голос. Спросить можно лишь однажды.'],
    choices: s => [
      { t: '«Где Пещера Морского Эха?»', if: s => !s.f.knowCave, go: 'c3_oracle_done', do: s => { G.learnCave('золотая статуэтка'); } },
      { t: '«Где Замок Каменной Пасти?»', if: s => !s.f.knowCastle, go: 'c3_oracle_done', do: s => { G.learnCastle('золотая статуэтка'); } },
      { t: '«Кто такой Чёрный Паук?»', go: 'c3_oracle_done', do: s => { G.clue('Статуэтка: Чёрный Паук — дроу Неззнар. С ним в пещере его пауки и ведьмин огонь.'); } },
      { t: 'Передумать', go: s.prevScene || 'c2_town' }
    ]
  };
  SC.c3_oracle_done = {
    chapter: 3, title: 'Ответ получен',
    enter: s => { G.take('elf_statuette'); G.money(10000, 'статуэтка теперь просто золото: продана при случае'); },
    text: ['Голос умолкает. Статуэтка остывает и становится просто красивой золотой вещицей.'],
    choices: [{ t: 'Дальше', go: 'c2_town' }]
  };
})();
