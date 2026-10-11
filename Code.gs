/* Практикум ДУП.03 - серверная часть. Файл собран автоматически (tools/build_gas.js), вручную не править. */
/* Общие функции: нормализация, хеширование. Используются и сайтом, и компилятором (Node). */
var NORM = (function () {
  'use strict';
  var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];

  function utf8(str) {
    var out = [], i, c;
    str = String(str);
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      if (c >= 0xd800 && c < 0xdc00 && i + 1 < str.length) {
        var d = str.charCodeAt(i + 1);
        if (d >= 0xdc00 && d < 0xe000) { c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00); i++; }
      }
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  function sha256(str) {
    var bytes = utf8(str), l = bytes.length, i, j;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    var hi = Math.floor(l * 8 / 4294967296), lo = (l * 8) >>> 0;
    bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255, (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var w = new Array(64);
    function rr(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (i = 0; i < bytes.length; i += 64) {
      for (j = 0; j < 16; j++) w[j] = (bytes[i + j * 4] << 24) | (bytes[i + j * 4 + 1] << 16) | (bytes[i + j * 4 + 2] << 8) | bytes[i + j * 4 + 3];
      for (j = 16; j < 64; j++) {
        var s0 = rr(w[j - 15], 7) ^ rr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        var s1 = rr(w[j - 2], 17) ^ rr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[j] + w[j]) | 0;
        var S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        var mj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var hex = '';
    for (i = 0; i < 8; i++) hex += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8);
    return hex;
  }

  var SALT = 'dup03|';
  function H(s) { return sha256(SALT + s).slice(0, 24); }

  /* Вывод программы: убрать служебные маркеры, привести к единому виду */
  function stripMarks(s) {
    return String(s).replace(/\x01V[\s\S]*?\x02/g, '').replace(/\x01E[\s\S]*?\x02/g, '');
  }
  function normOut(s) {
    s = stripMarks(s).replace(/\r\n?/g, '\n');
    var lines = s.split('\n').map(function (x) { return x.replace(/\s+$/, ''); });
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    return lines.join('\n');
  }
  /* Короткий ответ: регистр, ё, пробелы, запятая, число */
  function normAns(s) {
    s = String(s).toLowerCase().replace(/ё/g, 'е').replace(/[«»"']/g, '').replace(/\s+/g, ' ').trim();
    var t = s.replace(/\s/g, '');
    if (/^[-+]?\d+([.,]\d+)?$/.test(t)) {
      var n = Number(t.replace(',', '.'));
      if (isFinite(n)) return String(n);
    }
    return s.replace(/[.!]+$/, '');
  }
  function words(s) {
    return String(s).toLowerCase().replace(/ё/g, 'е').split(/[^a-zа-я0-9]+/).filter(Boolean);
  }
  /* Все префиксы слов ответа -> множество хешей (для проверки ключевых основ) */
  function prefixHashes(text) {
    var set = {}, ws = words(text);
    ws.forEach(function (w) {
      for (var k = Math.min(2, w.length); k <= w.length; k++) set[H('t|' + w.slice(0, k))] = 1;
    });
    return set;
  }
  function stemHash(stem) { return H('t|' + words(stem).join('')); }

  /* Фамилия + имя без отчества, без регистра и ё; группа без дефисов, пробелов, латиницы-двойников */
  var LAT = { a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', i: 'и', k: 'к', m: 'м', o: 'о', p: 'р', t: 'т', x: 'х', y: 'у' };
  function normFio(s) {
    var t = String(s).toLowerCase().replace(/ё/g, 'е').split(/[^a-zа-я]+/).filter(Boolean);
    return t.slice(0, 2).join(' ');
  }
  function normGroup(s) {
    return String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '').replace(/[a-z]/g, function (c) { return LAT[c] || c; });
  }
  function variantIndex(fio, group, n) {
    if (!n || n < 2) return 0;
    return parseInt(H('v|' + normFio(fio) + '|' + normGroup(group)).slice(0, 6), 16) % n;
  }

  return { sha256: sha256, H: H, normOut: normOut, normAns: normAns, words: words, prefixHashes: prefixHashes, stemHash: stemHash, normFio: normFio, normGroup: normGroup, variantIndex: variantIndex, stripMarks: stripMarks };
})();

/* Серверная логика «Практикума ДУП.03». Один код для Google Apps Script (V8) и Node.
   Чистый ES2017, без зависимостей. Все данные идут через store, время и хеш - через ctx. */
var CORE = (function () {
  'use strict';

  var VER = 1;
  var GK_RE = /^[a-zа-я0-9]{2,20}\|[a-zа-я]+( [a-zа-я]+)?$/;
  var LOCK_WINDOW = 10 * 60 * 1000; /* окно подсчёта неудачных входов */
  var LOCK_MAX = 8;
  var MAX_WORK = 200 * 1024;        /* байт, один submit */
  var MAX_STATE = 800 * 1024;       /* байт, состояние студента */
  var MAX_IMPORT = 6 * 1024 * 1024; /* байт, t_import */
  var MAX_PIDS = 300;

  /* ---------- вспомогательное ---------- */
  function isObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function num(x) { x = Number(x); return isFinite(x) ? x : 0; }
  function str(x) { return typeof x === 'string' ? x : ''; }
  function badPid(k) { return typeof k !== 'string' || k === '' || k.length > 80 || k === '__proto__'; }

  function Fail(code, msg) { this.isFail = true; this.code = code; this.msg = msg; }
  function fail(code, msg) { throw new Fail(code, msg); }
  function errResp(code, msg, extra) {
    var r = { ok: false, err: code, msg: msg, ver: VER };
    if (extra) for (var k in extra) if (has(extra, k)) r[k] = extra[k];
    return r;
  }

  function byteLen(s) {
    var n = 0, i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c < 0x80) n += 1;
      else if (c < 0x800) n += 2;
      else if (c >= 0xd800 && c < 0xdc00) { n += 4; i++; }
      else n += 3;
    }
    return n;
  }
  function jsonSize(x) {
    var s = JSON.stringify(x);
    return s === undefined ? 0 : byteLen(s);
  }
  function clone(x) { return x === undefined ? x : JSON.parse(JSON.stringify(x)); }
  function eq(a, b) { /* сравнение строк без раннего выхода */
    a = String(a); b = String(b);
    var d = a.length ^ b.length, i, n = Math.max(a.length, b.length);
    for (i = 0; i < n; i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    return d === 0;
  }

  /* Нормализация имени и группы - копия правил NORM (src/00_norm.js); совпадение проверяет test_core.js */
  var LAT = { a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', i: 'и', k: 'к', m: 'м', o: 'о', p: 'р', t: 'т', x: 'х', y: 'у' };
  function normFio(s) {
    return String(s).toLowerCase().replace(/ё/g, 'е').split(/[^a-zа-я]+/).filter(Boolean).slice(0, 2).join(' ');
  }
  function normGroup(s) {
    return String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '').replace(/[a-z]/g, function (c) { return LAT[c] || c; });
  }

  function checkGk(gk) {
    if (typeof gk !== 'string' || !GK_RE.test(gk)) fail('badid', 'Некорректный идентификатор студента.');
    return gk.replace(/[^a-zа-я0-9]/g, '_');
  }

  /* ---------- состояние ---------- */
  function emptyState() { return { rev: 0, p: {}, credit: {} }; }

  function fixStudent(st) {
    if (!isObj(st.state)) st.state = emptyState();
    if (!isObj(st.state.p)) st.state.p = {};
    if (!isObj(st.state.credit)) st.state.credit = {};
    if (!isObj(st.subs)) st.subs = {};
    if (!Array.isArray(st.fails)) st.fails = [];
    if (typeof st.ps !== 'string') st.ps = '';
    if (typeof st.hint !== 'string') st.hint = '';
    return st;
  }
  function newStudent(gk, fio, group, now) {
    return { gk: gk, fio: fio, group: group, ps: '', hint: '', created: now, last: now, fails: [], state: emptyState(), subs: {} };
  }
  function load(store, id) {
    var st = store.get(id);
    return st ? fixStudent(st) : null;
  }
  function publicStudent(st) {
    var o = {}, k;
    for (k in st) if (has(st, k) && k !== 'ps') o[k] = st[k];
    o.hasPass = !!st.ps;
    return o;
  }

  /* Слияние состояний: побеждает запись с большим upd (при равенстве - новая) */
  function mergeState(oldS, newS) {
    oldS = isObj(oldS) ? oldS : {};
    newS = isObj(newS) ? newS : {};
    var r = {}, k, pid;
    for (k in oldS) if (has(oldS, k) && k !== '__proto__') r[k] = oldS[k];
    for (k in newS) if (has(newS, k) && k !== '__proto__') r[k] = newS[k];

    var op = isObj(oldS.p) ? oldS.p : {}, np = isObj(newS.p) ? newS.p : {}, p = {};
    for (pid in op) if (has(op, pid) && !badPid(pid) && isObj(op[pid])) p[pid] = op[pid];
    for (pid in np) {
      if (!has(np, pid) || badPid(pid) || !isObj(np[pid])) continue;
      if (!has(p, pid) || num(np[pid].upd) >= num(p[pid].upd)) p[pid] = np[pid];
    }
    r.p = p;

    var oc = isObj(oldS.credit) ? oldS.credit : {}, nc = isObj(newS.credit) ? newS.credit : {}, c = {};
    for (pid in oc) if (has(oc, pid) && !badPid(pid) && isObj(oc[pid])) c[pid] = oc[pid];
    for (pid in nc) {
      if (!has(nc, pid) || badPid(pid) || !isObj(nc[pid])) continue;
      if (!has(c, pid) || num(nc[pid].at) >= num(c[pid].at)) c[pid] = nc[pid];
    }
    r.credit = c;

    r.rev = Math.max(num(oldS.rev), num(newS.rev)) + 1;
    return r;
  }

  /* Состояние от студента: проверка размера, зачёты "от преподавателя" клиент ставить не может */
  function clientState(state) {
    if (!isObj(state)) fail('badreq', 'Не переданы данные для сохранения.');
    if (jsonSize(state) > MAX_STATE) fail('toobig', 'Данные слишком большие для сохранения (больше 800 КБ).');
    var s = clone(state), pid;
    if (isObj(s.credit)) {
      for (pid in s.credit) if (has(s.credit, pid) && isObj(s.credit[pid]) && s.credit[pid].by === 'prepod') delete s.credit[pid];
    }
    return s;
  }
  function applyState(st, state) {
    var ns = clientState(state);
    var merged = mergeState(st.state, ns), pid, oc = st.state.credit;
    /* зачёты преподавателя нельзя перезаписать со стороны студента */
    for (pid in oc) if (has(oc, pid) && isObj(oc[pid]) && oc[pid].by === 'prepod') merged.credit[pid] = oc[pid];
    st.state = merged;
  }

  /* ---------- пароль ---------- */
  function checkPass(st, id, ph, store, ctx) {
    if (!st.ps) fail('nopass', 'Для этой записи пароль ещё не задан. Задайте его через регистрацию (имя и группа те же) или обратитесь к преподавателю.');
    if (typeof ph !== 'string' || ph.length < 32 || ph.length > 200) fail('badreq', 'Некорректный пароль.');
    var now = ctx.now(), recent = [], i;
    for (i = 0; i < st.fails.length; i++) if (now - num(st.fails[i]) < LOCK_WINDOW) recent.push(num(st.fails[i]));
    recent.sort(function (a, b) { return a - b; });
    st.fails = recent;
    if (recent.length >= LOCK_MAX) {
      var until = recent[recent.length - LOCK_MAX] + LOCK_WINDOW;
      var mins = Math.max(1, Math.ceil((until - now) / 60000));
      fail('locked', 'Слишком много неверных попыток входа. Вход заблокирован на 10 минут с момента попыток; подождите ещё примерно ' + mins + ' мин.');
    }
    if (!eq(ctx.sha256('srv|' + ph), st.ps)) {
      recent.push(now);
      if (recent.length > 30) st.fails = recent.slice(-30);
      store.put(id, st);
      var left = LOCK_MAX - recent.length;
      fail('badpass', 'Неверный пароль.' + (left > 0 && left <= 3 ? ' Осталось попыток: ' + left + '.' : ''));
    }
  }

  function needUser(store, gk) {
    var id = checkGk(gk), st = load(store, id);
    if (!st) fail('nouser', 'Такой студент не найден.');
    return { id: id, st: st };
  }
  function loginPayload(st) {
    return { ok: true, fio: st.fio, group: st.group, state: st.state, hint: st.hint };
  }
  function cleanText(x, max, what, required) {
    if (x === undefined || x === null) x = '';
    if (typeof x !== 'string') fail('badreq', 'Некорректное значение поля: ' + what + '.');
    x = x.replace(/\s+/g, ' ').trim();
    if (required && !x) fail('badreq', 'Не заполнено поле: ' + what + '.');
    if (x.length > max) fail('badreq', 'Слишком длинное значение поля «' + what + '» (не больше ' + max + ' знаков).');
    return x;
  }
  function checkPh(ph) {
    if (typeof ph !== 'string' || ph.length < 32 || ph.length > 200) fail('badreq', 'Некорректный пароль.');
    return ph;
  }

  /* ---------- операции студента ---------- */
  var OPS = {};

  OPS.ping = { fn: function (req, store, ctx) { return { ok: true, time: ctx.now(), ver: VER }; } };

  OPS.hint = { fn: function (req, store) {
    var id = checkGk(req.gk), st = load(store, id);
    if (!st) return { ok: true, exists: false };
    return { ok: true, exists: true, hint: st.hint, nopass: !st.ps };
  } };

  OPS.register = { lock: true, fn: function (req, store, ctx) {
    var id = checkGk(req.gk);
    var fio = cleanText(req.fio, 100, 'ФИО', true);
    var group = cleanText(req.group, 40, 'группа', true);
    var hint = cleanText(req.hint, 120, 'подсказка', false);
    var ph = checkPh(req.ph), now = ctx.now();
    var st = load(store, id);
    if (st && st.ps) fail('exists', 'Студент с таким именем в этой группе уже зарегистрирован. Войдите с паролем или обратитесь к преподавателю.');
    if (!st) st = newStudent(req.gk, fio, group, now);
    st.ps = ctx.sha256('srv|' + ph);
    st.hint = hint;
    st.fails = [];
    st.last = now;
    store.put(id, st);
    return loginPayload(st);
  } };

  OPS.login = { lock: true, fn: function (req, store, ctx) {
    var u = needUser(store, req.gk), st = u.st;
    checkPass(st, u.id, req.ph, store, ctx);
    st.fails = [];
    st.last = ctx.now();
    store.put(u.id, st);
    return loginPayload(st);
  } };

  OPS.save = { lock: true, fn: function (req, store, ctx) {
    var u = needUser(store, req.gk), st = u.st;
    if (!isObj(req.state)) fail('badreq', 'Не переданы данные для сохранения.');
    checkPass(st, u.id, req.ph, store, ctx);
    applyState(st, req.state);
    st.last = ctx.now();
    store.put(u.id, st);
    return { ok: true, state: st.state };
  } };

  OPS.submit = { lock: true, fn: function (req, store, ctx) {
    var u = needUser(store, req.gk), st = u.st, pid = req.pid;
    if (badPid(pid)) fail('badreq', 'Некорректный номер задания.');
    if (!isObj(req.work)) fail('badreq', 'Не переданы данные работы.');
    if (jsonSize(req.work) > MAX_WORK) fail('toobig', 'Работа слишком большая для отправки (больше 200 КБ).');
    if (!isObj(req.state)) fail('badreq', 'Не переданы данные для сохранения.');
    checkPass(st, u.id, req.ph, store, ctx);
    applyState(st, req.state);
    var at = ctx.now();
    if (!isObj(st.state.p[pid])) st.state.p[pid] = { upd: at };
    st.state.p[pid].submitted = at;
    if (num(st.state.p[pid].upd) < at) st.state.p[pid].upd = at; /* чтобы отметка не потерялась при слиянии */
    st.subs[pid] = { at: at, work: clone(req.work) };
    st.last = at;
    store.put(u.id, st);
    return { ok: true, at: at, state: st.state };
  } };

  /* ---------- операции преподавателя ---------- */
  OPS.t_list = { teacher: true, fn: function (req, store, ctx) {
    return { ok: true, students: listStudents(store), time: ctx.now() };
  } };
  OPS.t_export = { teacher: true, fn: function (req, store, ctx) {
    return { ok: true, all: listStudents(store), time: ctx.now() };
  } };
  function listStudents(store) {
    var all = store.all() || [], out = [], i;
    for (i = 0; i < all.length; i++) if (isObj(all[i])) out.push(publicStudent(fixStudent(all[i])));
    out.sort(function (a, b) {
      var ka = String(a.group) + '|' + String(a.fio), kb = String(b.group) + '|' + String(b.fio);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
    return out;
  }

  OPS.t_get = { teacher: true, fn: function (req, store) {
    return { ok: true, student: publicStudent(needUser(store, req.gk).st) };
  } };

  OPS.t_credit = { teacher: true, lock: true, fn: function (req, store, ctx) {
    var u = needUser(store, req.gk), st = u.st, pids = req.pids, i, now = ctx.now();
    if (!Array.isArray(pids) || pids.length > MAX_PIDS) fail('badreq', 'Не переданы номера заданий.');
    if (typeof req.on !== 'boolean') fail('badreq', 'Не указано, ставить или снимать зачёт.');
    for (i = 0; i < pids.length; i++) if (badPid(pids[i])) fail('badreq', 'Некорректный номер задания.');
    for (i = 0; i < pids.length; i++) {
      if (req.on) st.state.credit[pids[i]] = { at: now, by: 'prepod' };
      else delete st.state.credit[pids[i]];
    }
    st.state.rev = num(st.state.rev) + 1;
    store.put(u.id, st);
    return { ok: true };
  } };

  /* ph - новый пароль-хеш с клиента; пустая строка или null сбрасывает пароль (студент задаст новый через register) */
  OPS.t_setpass = { teacher: true, lock: true, fn: function (req, store, ctx) {
    var u = needUser(store, req.gk), st = u.st;
    if (typeof req.ph !== 'string' && req.ph !== null) fail('badreq', 'Не передан пароль (пустая строка сбрасывает пароль).');
    var hint = cleanText(req.hint, 120, 'подсказка', false);
    st.ps = (req.ph === '' || req.ph === null) ? '' : ctx.sha256('srv|' + checkPh(req.ph));
    st.hint = hint;
    st.fails = [];
    store.put(u.id, st);
    return { ok: true };
  } };

  OPS.t_delete = { teacher: true, lock: true, fn: function (req, store) {
    var id = checkGk(req.gk), had = !!store.get(id);
    if (had) store.del(id);
    return { ok: true, deleted: had };
  } };

  OPS.t_add = { teacher: true, lock: true, fn: function (req, store, ctx) {
    var fio = cleanText(req.fio, 100, 'ФИО', true), group = cleanText(req.group, 40, 'группа', true);
    var gk = normGroup(group) + '|' + normFio(fio), id = checkGk(gk), st = load(store, id);
    if (st) return { ok: true, gk: gk, created: false };
    store.put(id, newStudent(gk, fio, group, ctx.now()));
    return { ok: true, gk: gk, created: true };
  } };

  OPS.t_import = { teacher: true, lock: true, fn: function (req, store, ctx) {
    var id = checkGk(req.gk), st = load(store, id), pid;
    if (!isObj(req.state) && req.state !== undefined) fail('badreq', 'Некорректное состояние в файле.');
    var subs = req.subs === undefined ? {} : req.subs;
    if (!isObj(subs)) fail('badreq', 'Некорректные отправленные работы в файле.');
    if (jsonSize({ s: req.state, u: subs }) > MAX_IMPORT) fail('toobig', 'Файл слишком большой для импорта.');
    if (!st) {
      st = newStudent(req.gk, cleanText(req.fio, 100, 'ФИО', true), cleanText(req.group, 40, 'группа', true), ctx.now());
    }
    if (req.state !== undefined) st.state = mergeState(st.state, clone(req.state));
    for (pid in subs) {
      if (!has(subs, pid) || badPid(pid) || !isObj(subs[pid])) continue;
      if (!has(st.subs, pid) || num(subs[pid].at) >= num(st.subs[pid].at)) st.subs[pid] = clone(subs[pid]);
    }
    store.put(id, st);
    return { ok: true, state: st.state, subs: Object.keys(st.subs).length };
  } };

  OPS.t_backup = { teacher: true, fn: function (req, store) {
    if (typeof store.backup === 'function') {
      var r = store.backup();
      return { ok: true, count: isObj(r) ? r.count : num(r) };
    }
    return { ok: true, count: (store.all() || []).length };
  } };

  /* ---------- вход ---------- */
  function handle(req, store, ctx) {
    var locked = false;
    try {
      if (typeof req === 'string') {
        try { req = JSON.parse(req); } catch (e) { return errResp('badreq', 'Не удалось разобрать запрос.'); }
      }
      if (!isObj(req) || typeof req.op !== 'string') return errResp('badreq', 'Некорректный запрос.');
      if (!has(OPS, req.op)) return errResp('badop', 'Неизвестная операция.');
      var def = OPS[req.op];
      if (def.teacher) {
        var key = ctx.teacherKey;
        if (typeof key !== 'string' || key === '') return errResp('nokey', 'На сервере не задан ключ преподавателя (TEACHER_KEY).');
        if (typeof req.tk !== 'string' || !eq(req.tk, key)) return errResp('badkey', 'Неверный ключ преподавателя.');
      }
      if (def.lock) {
        try { store.lock(); locked = true; }
        catch (e) { return errResp('busy', 'Сервер сейчас занят. Повторите через несколько секунд.'); }
      }
      var r = def.fn(req, store, ctx);
      r.ver = VER;
      return r;
    } catch (e) {
      if (e && e.isFail) return errResp(e.code, e.msg);
      return errResp('server', 'Внутренняя ошибка сервера. Попробуйте ещё раз позже.', { detail: String(e && e.message || e).slice(0, 200) });
    } finally {
      if (locked) { try { store.unlock(); } catch (e2) { /* ignore */ } }
    }
  }

  return { VER: VER, handle: handle, mergeState: mergeState, normFio: normFio, normGroup: normGroup };
})();
if (typeof module !== 'undefined') module.exports = CORE;

/* ======================= Адаптер Google Apps Script ======================= */
var DATA_FOLDER_NAME = 'dup03-praktikum-data';
var BACKUP_FOLDER_NAME = 'backups';
var KEEP_BACKUPS = 14;
var INDEX_CACHE_KEY = 'dup03_index_v1';
var LOCK_WAIT_MS = 20000;

var gasFolder_ = null;
var gasIndex_ = null;       /* { id: fileId } */
var gasIndexFresh_ = false; /* индекс собран из Диска в этом запуске */
var gasLock_ = null;

function getDataFolder_() {
  if (gasFolder_) return gasFolder_;
  var it = DriveApp.getRootFolder().getFoldersByName(DATA_FOLDER_NAME);
  gasFolder_ = it.hasNext() ? it.next() : DriveApp.getRootFolder().createFolder(DATA_FOLDER_NAME);
  return gasFolder_;
}

function getBackupFolder_() {
  var parent = getDataFolder_();
  var it = parent.getFoldersByName(BACKUP_FOLDER_NAME);
  return it.hasNext() ? it.next() : parent.createFolder(BACKUP_FOLDER_NAME);
}

function saveIndexCache_() {
  try { CacheService.getScriptCache().put(INDEX_CACHE_KEY, JSON.stringify(gasIndex_), 21600); } catch (e) { /* слишком велик или недоступен - не страшно */ }
}

function rebuildIndex_() {
  var idx = {}, files = getDataFolder_().getFiles();
  while (files.hasNext()) {
    var f = files.next(), n = f.getName();
    if (n.indexOf('st_') === 0 && /\.json$/.test(n)) idx[n.slice(3, -5)] = f.getId();
  }
  gasIndex_ = idx;
  gasIndexFresh_ = true;
  saveIndexCache_();
  return idx;
}

function getIndex_() {
  if (gasIndex_) return gasIndex_;
  try {
    var raw = CacheService.getScriptCache().get(INDEX_CACHE_KEY);
    if (raw) { gasIndex_ = JSON.parse(raw); return gasIndex_; }
  } catch (e) { /* пересоберём */ }
  return rebuildIndex_();
}

function readFile_(file) {
  return JSON.parse(file.getBlob().getDataAsString('UTF-8'));
}

var GAS_STORE_ = {
  get: function (id) {
    var idx = getIndex_();
    if (!idx[id] && !gasIndexFresh_) idx = rebuildIndex_(); /* индекс из кэша мог устареть */
    if (!idx[id]) return null;
    try {
      return readFile_(DriveApp.getFileById(idx[id]));
    } catch (e) {
      if (!gasIndexFresh_) { /* файл удалили вручную - сверяемся с Диском */
        idx = rebuildIndex_();
        if (idx[id]) return readFile_(DriveApp.getFileById(idx[id]));
        return null;
      }
      throw e;
    }
  },
  put: function (id, obj) {
    var body = JSON.stringify(obj), idx = getIndex_();
    if (idx[id]) {
      try { DriveApp.getFileById(idx[id]).setContent(body); return; } catch (e) { delete idx[id]; }
    }
    var f = getDataFolder_().createFile('st_' + id + '.json', body, 'application/json');
    idx[id] = f.getId();
    saveIndexCache_();
  },
  del: function (id) {
    var idx = getIndex_();
    if (idx[id]) {
      try { DriveApp.getFileById(idx[id]).setTrashed(true); } catch (e) { /* уже нет */ }
      delete idx[id];
      saveIndexCache_();
    }
  },
  all: function () {
    var out = [], idx = {}, files = getDataFolder_().getFiles();
    while (files.hasNext()) {
      var f = files.next(), n = f.getName();
      if (n.indexOf('st_') !== 0 || !/\.json$/.test(n)) continue;
      idx[n.slice(3, -5)] = f.getId();
      try { out.push(readFile_(f)); } catch (e) { /* повреждённый файл пропускаем */ }
    }
    gasIndex_ = idx; gasIndexFresh_ = true; saveIndexCache_();
    return out;
  },
  lock: function () {
    var l = LockService.getScriptLock();
    l.waitLock(LOCK_WAIT_MS); /* бросает исключение, если не дождались */
    gasLock_ = l;
  },
  unlock: function () {
    if (gasLock_) { var l = gasLock_; gasLock_ = null; l.releaseLock(); }
  },
  backup: function () { return makeBackup_(); }
};

function makeCtx_() {
  return {
    now: function () { return Date.now(); },
    teacherKey: PropertiesService.getScriptProperties().getProperty('TEACHER_KEY') || '',
    sha256: NORM.sha256
  };
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var res;
  try {
    var raw = e && e.postData ? e.postData.contents : '';
    var req = null;
    try { req = JSON.parse(raw); } catch (err) { req = null; }
    if (req === null || typeof req !== 'object') {
      res = { ok: false, err: 'badreq', msg: 'Не удалось разобрать запрос.', ver: 1 };
    } else {
      res = CORE.handle(req, GAS_STORE_, makeCtx_());
    }
  } catch (err2) {
    res = { ok: false, err: 'server', msg: 'Внутренняя ошибка сервера. Попробуйте ещё раз позже.', ver: 1 };
  }
  return reply_(res);
}

function doGet(e) {
  return reply_({ ok: true, ping: Date.now(), ver: 1 });
}

/* Ежедневная копия: один файл backup_ГГГГ-ММ-ДД.json в папке backups, хранятся последние 14 */
function makeBackup_() {
  var locked = false;
  try {
    GAS_STORE_.lock(); locked = true;
    var students = GAS_STORE_.all();
    var folder = getBackupFolder_();
    var name = 'backup_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd') + '.json';
    var body = JSON.stringify({ created: new Date().toISOString(), count: students.length, students: students });
    var same = folder.getFilesByName(name);
    if (same.hasNext()) {
      same.next().setContent(body);
    } else {
      folder.createFile(name, body, 'application/json');
    }
    var list = [], files = folder.getFiles();
    while (files.hasNext()) {
      var f = files.next();
      if (/^backup_\d{4}-\d{2}-\d{2}\.json$/.test(f.getName())) list.push(f);
    }
    list.sort(function (a, b) { return a.getName() < b.getName() ? 1 : a.getName() > b.getName() ? -1 : 0; });
    for (var i = KEEP_BACKUPS; i < list.length; i++) list[i].setTrashed(true);
    return { count: students.length, file: name };
  } finally {
    if (locked) GAS_STORE_.unlock();
  }
}

function dailyBackup() {
  var r = makeBackup_();
  Logger.log('Копия сделана: ' + r.file + ', студентов: ' + r.count);
  return r;
}

function installTriggers() {
  var all = ScriptApp.getProjectTriggers();
  for (var i = 0; i < all.length; i++) {
    if (all[i].getHandlerFunction() === 'dailyBackup') ScriptApp.deleteTrigger(all[i]);
  }
  ScriptApp.newTrigger('dailyBackup').timeBased().everyDays(1).atHour(3).create();
  Logger.log('Готово: копия данных будет делаться каждую ночь (около 3:00).');
}

function setup() {
  var folder = getDataFolder_();
  getBackupFolder_();
  var key = PropertiesService.getScriptProperties().getProperty('TEACHER_KEY');
  if (!key) {
    throw new Error('Папка данных создана, но ключ TEACHER_KEY не задан. Откройте «Свойства скрипта» (значок шестерёнки - Настройки проекта) и добавьте свойство TEACHER_KEY.');
  }
  if (key.length < 8) Logger.log('ВНИМАНИЕ: ключ TEACHER_KEY короткий (меньше 8 знаков) - лучше придумать длиннее.');
  Logger.log('Всё в порядке. Папка данных: ' + folder.getName() + ' (' + folder.getUrl() + '). Ключ преподавателя задан (длина ' + key.length + ').');
}
