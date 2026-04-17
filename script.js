(function () {

    /* ═══════════════  ТАЙМЕР  ═══════════════ */
    var timeLeft = 45 * 60, timerID = null;
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function startTimer() {
        timerID = setInterval(function () {
            timeLeft--;
            if (timeLeft < 0) { clearInterval(timerID); finishTest(); return; }
            document.getElementById('timer').textContent =
                pad(Math.floor(timeLeft / 60)) + ':' + pad(timeLeft % 60);
        }, 1000);
    }

    /* ═══════════════  РЕГИСТРАЦИЯ  ═══════════════ */
    document.getElementById('startBtn').addEventListener('click', function () {
        var l = document.getElementById('lastName').value.trim();
        var f = document.getElementById('firstName').value.trim();
        var g = document.getElementById('grade').value;
        document.getElementById('errLast').style.display  = l ? 'none' : 'block';
        document.getElementById('errFirst').style.display = f ? 'none' : 'block';
        document.getElementById('errGrade').style.display = g ? 'none' : 'block';
        if (!l || !f || !g) return;
        document.getElementById('pName').textContent  = l + ' ' + f;
        document.getElementById('pGrade').textContent = g + ' класс';
        document.getElementById('regForm').classList.add('hidden');
        document.getElementById('testWrap').classList.add('show');
        startTimer(); window.scrollTo(0, 0);
    });

    /* ═══════════════  СОХРАНЕНИЕ  ═══════════════ */
    var svT = {};
    function saveAnswer(n) {
        if (n === 1) {
            if (!document.getElementById('a1a').value.trim() &&
                !document.getElementById('a1b').value.trim()) { alert('Введите ответ'); return; }
        } else if (n === 4) {
            if (!nlPlaced) { alert('Поставьте точку A'); return; }
        } else if (n === 6) {
            if (userPts2.length < 2) { alert('Добавьте точки'); return; }
        } else {
            var el = document.getElementById('a' + n);
            if (el && !el.value.trim()) { alert('Введите ответ'); return; }
        }
        var ok = document.getElementById('saved' + n);
        ok.style.display = 'inline';
        if (svT[n]) clearTimeout(svT[n]);
        svT[n] = setTimeout(function () { ok.style.display = 'none'; }, 3000);
    }
    for (var si = 1; si <= 10; si++) {
        (function (num) {
            var btn = document.getElementById('sv' + num);
            if (btn) btn.addEventListener('click', function () { saveAnswer(num); });
        })(si);
    }

    /* ═══════════════  НАВИГАЦИЯ  ═══════════════ */
    var cur = 1, total = 10;
    function gotoQ(n) {
        document.getElementById('q' + cur).classList.remove('show');
        cur = n;
        document.getElementById('q' + cur).classList.add('show');
        document.getElementById('qNum').textContent = cur;
        document.getElementById('prevBtn').disabled = (cur === 1);
        document.getElementById('nextBtn').textContent =
            (cur === total) ? 'Завершить тест \u2713' : 'Следующее \u2192';
        document.getElementById('pFill').style.width = (cur / total * 100) + '%';
        if (cur === 4) setTimeout(initNL, 60);
        if (cur === 5) setTimeout(drawGraph, 60);
        if (cur === 6) setTimeout(initGraph2, 60);
        window.scrollTo(0, 0);
    }
    document.getElementById('prevBtn').addEventListener('click', function () {
        if (cur > 1) gotoQ(cur - 1);
    });
    document.getElementById('nextBtn').addEventListener('click', function () {
        if (cur < total) { gotoQ(cur + 1); return; }
        finishTest();
    });
        /* ═══════════════════════════════════════════════════════
       ЧИСЛОВАЯ ПРЯМАЯ — ЗАДАНИЕ 4
    ═══════════════════════════════════════════════════════ */
    var nlInited = false, nlPlaced = false, nlVal = 0, nlDrag = false, NL = {};
    var TAB_W = 36, TAB_H = 32, STICK_H = 24;
    var dragOfsX = 0, dragOfsY = 0, tabLeft = 0, tabTop = 0;

    function v2px(v)  { return NL.padL + (v - NL.xMin) * NL.pxPerUnit; }
    function px2v(px) { return NL.xMin + (px - NL.padL) / NL.pxPerUnit; }
    function tabCX()  { return tabLeft + TAB_W / 2; }
    function tabCY()  { return tabTop + TAB_H + STICK_H; }
    function hitTab(mx, my) {
        return mx >= tabLeft && mx <= tabLeft + TAB_W &&
               my >= tabTop  && my <= tabTop + TAB_H + STICK_H;
    }
    function nlMouse(e) {
        var c = document.getElementById('nlCanvas'), r = c.getBoundingClientRect(), s = c.width / r.width;
        return { x: (e.clientX - r.left) * s, y: (e.clientY - r.top) * s };
    }
    function nlTouch(e) {
        var t = e.touches[0] || e.changedTouches[0];
        var c = document.getElementById('nlCanvas'), r = c.getBoundingClientRect(), s = c.width / r.width;
        return { x: (t.clientX - r.left) * s, y: (t.clientY - r.top) * s };
    }

    function initNL() {
        if (nlInited) return; nlInited = true;
        var wrap = document.getElementById('nlWrapper');
        var c = document.getElementById('nlCanvas');
        var W = wrap.clientWidth || 700, H = 200;
        c.width = W; c.height = H; c.style.width = W + 'px'; c.style.height = H + 'px';
        NL.W = W; NL.H = H; NL.lineY = 155; NL.padL = 30; NL.padR = 30;
        NL.xMin = -5; NL.xMax = 4;
        NL.lineW = W - NL.padL - NL.padR;
        NL.pxPerUnit = NL.lineW / (NL.xMax - NL.xMin);
        tabLeft = 15; tabTop = 10; drawNL();

        c.addEventListener('mousedown', function (e) {
            var p = nlMouse(e);
            if (hitTab(p.x, p.y)) { nlDrag = true; dragOfsX = p.x - tabLeft; dragOfsY = p.y - tabTop; c.style.cursor = 'grabbing'; }
        });
        window.addEventListener('mousemove', function (e) {
            if (!nlDrag) return; var p = nlMouse(e);
            tabLeft = Math.max(0, Math.min(p.x - dragOfsX, NL.W - TAB_W));
            tabTop  = Math.max(0, Math.min(p.y - dragOfsY, NL.H - TAB_H - STICK_H));
            updateNL(); drawNL();
        });
        window.addEventListener('mouseup', function () {
            if (!nlDrag) return; nlDrag = false; snapNL(); drawNL();
            document.getElementById('nlCanvas').style.cursor = 'default';
        });
        c.addEventListener('touchstart', function (e) {
            var p = nlTouch(e);
            if (hitTab(p.x, p.y)) { nlDrag = true; dragOfsX = p.x - tabLeft; dragOfsY = p.y - tabTop; e.preventDefault(); }
        }, { passive: false });
        window.addEventListener('touchmove', function (e) {
            if (!nlDrag) return; e.preventDefault(); var p = nlTouch(e);
            tabLeft = Math.max(0, Math.min(p.x - dragOfsX, NL.W - TAB_W));
            tabTop  = Math.max(0, Math.min(p.y - dragOfsY, NL.H - TAB_H - STICK_H));
            updateNL(); drawNL();
        }, { passive: false });
        window.addEventListener('touchend', function () {
            if (!nlDrag) return; nlDrag = false; snapNL(); drawNL();
        });
    }

    function updateNL() {
        var bx = tabCX(), by = tabCY();
        if (Math.abs(by - NL.lineY) < 20 && bx >= NL.padL - 10 && bx <= NL.W - NL.padR + 10) {
            nlPlaced = true; nlVal = px2v(bx);
        }
    }
    function snapNL() {
        var bx = tabCX(), by = tabCY();
        if (Math.abs(by - NL.lineY) < 30 && bx >= NL.padL - 10 && bx <= NL.W - NL.padR + 10) {
            tabTop = NL.lineY - TAB_H - STICK_H;
            var cx = Math.max(v2px(NL.xMin), Math.min(tabCX(), v2px(NL.xMax)));
            tabLeft = cx - TAB_W / 2;
            nlPlaced = true; nlVal = px2v(tabCX());
        }
    }

    function drawNL() {
        var c = document.getElementById('nlCanvas'), ctx = c.getContext('2d');
        var W = NL.W, H = NL.H, LY = NL.lineY;
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(NL.padL - 15, LY); ctx.lineTo(W - NL.padR + 15, LY); ctx.stroke();
        ctx.fillStyle = '#000'; ctx.beginPath();
        ctx.moveTo(W - NL.padR + 22, LY); ctx.lineTo(W - NL.padR + 10, LY - 6); ctx.lineTo(W - NL.padR + 10, LY + 6);
        ctx.closePath(); ctx.fill();
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (var v = NL.xMin; v <= NL.xMax; v += 0.5) {
            v = Math.round(v * 10) / 10;
            var px = v2px(v), isW = (Math.abs(v - Math.round(v)) < 0.01), th = isW ? 10 : 6;
            ctx.strokeStyle = '#000'; ctx.lineWidth = isW ? 2 : 1;
            ctx.beginPath(); ctx.moveTo(px, LY - th); ctx.lineTo(px, LY + th); ctx.stroke();
            if (v === 0 || v === 1) {
                ctx.fillStyle = '#000'; ctx.font = 'bold 16px Segoe UI';
                ctx.fillText('' + v, px, LY + 14);
            }
        }
        var tl = tabLeft, tt = tabTop, cx = tl + TAB_W / 2;
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, tt + TAB_H); ctx.lineTo(cx, tt + TAB_H + STICK_H); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        ctx.fillRect(tl, tt, TAB_W, TAB_H); ctx.strokeRect(tl, tt, TAB_W, TAB_H);
        ctx.fillStyle = '#000'; ctx.font = 'italic 20px Times New Roman';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('A', tl + TAB_W / 2, tt + TAB_H / 2);
    }
        /* ═══════════════════════════════════════════════════════
       ГРАФИКИ — общие функции
    ═══════════════════════════════════════════════════════ */
    /* ═══════════════════════════════════════════════════
   ГРАФИК задания 5.1 (только отрисовка, без клика)
   ═══════════════════════════════════════════════════ */
(function () {
    var cv = document.getElementById('graphCanvas');
    if (!cv) return;
    var ctx = cv.getContext('2d');

    // --- Размеры ---
    var W = 780, H = 440;
    cv.width = W; cv.height = H;

    // --- Координатная система ---
    // Ось t: от 0 до 24 часов
    // Ось s: от 0 до 260 км
    var padL = 60, padR = 20, padT = 20, padB = 40;
    var plotW = W - padL - padR;   // 700
    var plotH = H - padT - padB;   // 380

    var tMin = 0, tMax = 24;
    var sMin = 0, sMax = 260;

    function tToX(t) { return padL + (t - tMin) / (tMax - tMin) * plotW; }
    function sToY(s) { return padT + plotH - (s - sMin) / (sMax - sMin) * plotH; }

    function drawGrid() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);

        // Горизонтальные линии (каждые 20 км)
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 0.5;
        for (var s = 0; s <= 260; s += 20) {
            var y = sToY(s);
            ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
        }
        // Вертикальные линии (каждый час)
        for (var t = 0; t <= 24; t++) {
            var x = tToX(t);
            ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, H - padB); ctx.stroke();
        }

        // Оси
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        // Ось Y
        ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.stroke();
        // Ось X
        ctx.beginPath(); ctx.moveTo(padL, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();

        // Подписи оси s
        ctx.fillStyle = '#000';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (var s = 20; s <= 240; s += 20) {
            ctx.fillText(s, padL - 6, sToY(s));
        }

        // Подписи оси t
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        var tLabels = [1, 5, 10, 15, 20];
        for (var i = 0; i < tLabels.length; i++) {
            ctx.fillText(tLabels[i], tToX(tLabels[i]), H - padB + 6);
        }

        // Метки-точки на оси t
        for (var t = 1; t <= 23; t++) {
            ctx.beginPath();
            ctx.arc(tToX(t), H - padB, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();
        }

        // Названия осей
        ctx.font = 'italic 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('t, ч', W - padR + 5, H - padB + 20);

        ctx.save();
        ctx.translate(16, padT + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Расстояние до пункта А', 0, 0);
        ctx.restore();

        ctx.font = 'italic 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('s, км', padL - 10, padT - 8);
    }

    function drawLine(pts, color, width) {
        if (pts.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width || 3.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for (var i = 0; i < pts.length; i++) {
            var x = tToX(pts[i][0]);
            var y = sToY(pts[i][1]);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    function drawLabel(text, t, s, offX, offY) {
        var x = tToX(t) + (offX || 0);
        var y = sToY(s) + (offY || 0);
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#556b2f';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Кружок
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#556b2f';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Текст
        ctx.fillStyle = '#556b2f';
        ctx.font = '15px sans-serif';
        ctx.fillText(text, x, y + 1);
    }

    // Графики по фото
    var graph1 = [[7,0],[10,60],[11,60],[14,120],[16,120],[19,180],[23,180]];
    var graph2 = [[11,0],[14,240]];

    function render() {
        drawGrid();
        drawLine(graph1, '#6b8e23', 3.5);
        drawLine(graph2, '#6b8e23', 3.5);
        drawLabel('①', 22, 180, 12, -18);
        drawLabel('②', 13, 240, -5, -22);
    }
    render();

    // Экспортируем функции для графика 5.2
    window._graph5 = {
        tToX: tToX, sToY: sToY,
        xToT: function (x) { return tMin + (x - padL) / plotW * (tMax - tMin); },
        yToS: function (y) { return sMin + (padT + plotH - y) / plotH * (sMax - sMin); },
        graph1: graph1, graph2: graph2,
        padL: padL, padR: padR, padT: padT, padB: padB,
        W: W, H: H, plotW: plotW, plotH: plotH,
        tMin: tMin, tMax: tMax, sMin: sMin, sMax: sMax
    };
})();


/* ═══════════════════════════════════════════════════
   ГРАФИК задания 5.2 — интерактивный (достроить)
   ═══════════════════════════════════════════════════ */
var userPts2 = [];          // пользовательские точки [{t, s}]
var maxUserPts2 = 2;        // максимум 2 точки

(function () {
    var cv = document.getElementById('graphCanvas2');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var g = window._graph5;
    if (!g) return;

    var W = g.W, H = g.H;
    cv.width = W; cv.height = H;

    function drawGrid() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 0.5;
        for (var s = 0; s <= 260; s += 20) {
            var y = g.sToY(s);
            ctx.beginPath(); ctx.moveTo(g.padL, y); ctx.lineTo(W - g.padR, y); ctx.stroke();
        }
        for (var t = 0; t <= 24; t++) {
            var x = g.tToX(t);
            ctx.beginPath(); ctx.moveTo(x, g.padT); ctx.lineTo(x, H - g.padB); ctx.stroke();
        }

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(g.padL, g.padT); ctx.lineTo(g.padL, H - g.padB); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(g.padL, H - g.padB); ctx.lineTo(W - g.padR, H - g.padB); ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (var s = 20; s <= 240; s += 20) {
            ctx.fillText(s, g.padL - 6, g.sToY(s));
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        var tLabels = [1, 5, 10, 15, 20];
        for (var i = 0; i < tLabels.length; i++) {
            ctx.fillText(tLabels[i], g.tToX(tLabels[i]), H - g.padB + 6);
        }
        for (var t = 1; t <= 23; t++) {
            ctx.beginPath();
            ctx.arc(g.tToX(t), H - g.padB, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();
        }

        ctx.font = 'italic 14px sans-serif';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText('t, ч', W - g.padR + 5, H - g.padB + 20);
        ctx.save();
        ctx.translate(16, g.padT + g.plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Расстояние до пункта А', 0, 0);
        ctx.restore();
        ctx.font = 'italic 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('s, км', g.padL - 10, g.padT - 8);
    }

    function drawLine(pts, color, width) {
        if (pts.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width || 3.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for (var i = 0; i < pts.length; i++) {
            var x = g.tToX(pts[i][0]);
            var y = g.sToY(pts[i][1]);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    function drawLabel(text, t, s, offX, offY) {
        var x = g.tToX(t) + (offX || 0);
        var y = g.sToY(s) + (offY || 0);
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#556b2f';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#556b2f';
        ctx.font = '15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y + 1);
    }

    function drawDot(t, s, color) {
        var x = g.tToX(t);
        var y = g.sToY(s);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color || '#e74c3c';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    function render() {
        drawGrid();

        // Готовые графики (как на фото)
        drawLine(g.graph1, '#6b8e23', 3.5);
        drawLine(g.graph2, '#6b8e23', 3.5);
        drawLabel('①', 22, 180, 12, -18);
        drawLabel('②', 13, 240, -5, -22);

        // Пользовательское продолжение графика ②
        if (userPts2.length > 0) {
            // Строим линию: последняя точка graph2 → user точки
            var lastG2 = g.graph2[g.graph2.length - 1]; // [13, 240]
            var allPts = [[lastG2[0], lastG2[1]]];
            for (var i = 0; i < userPts2.length; i++) {
                allPts.push([userPts2[i].t, userPts2[i].s]);
            }
            drawLine(allPts, '#e74c3c', 3);

            // Красные точки
            for (var i = 0; i < userPts2.length; i++) {
                drawDot(userPts2[i].t, userPts2[i].s, '#e74c3c');

                // Подпись координат
                ctx.font = '11px sans-serif';
                ctx.fillStyle = '#c0392b';
                ctx.textAlign = 'center';
                ctx.fillText('(' + userPts2[i].t + ';' + userPts2[i].s + ')',
                    g.tToX(userPts2[i].t), g.sToY(userPts2[i].s) - 12);
            }
        }
    }

    render();

    // --- Клик по canvas — добавление точки ---
    cv.addEventListener('click', function (e) {
        if (userPts2.length >= maxUserPts2) return;

        var rect = cv.getBoundingClientRect();
        var scaleX = W / rect.width;
        var scaleY = H / rect.height;
        var mx = (e.clientX - rect.left) * scaleX;
        var my = (e.clientY - rect.top) * scaleY;

        // Перевод в координаты
        var rawT = g.xToT(mx);
        var rawS = g.yToS(my);

        // Привязка к сетке: t — целые часы, s — кратно 20
        var snapT = Math.round(rawT);
        var snapS = Math.round(rawS / 20) * 20;

        // Ограничения
        if (snapT < 0) snapT = 0;
        if (snapT > 24) snapT = 24;
        if (snapS < 0) snapS = 0;
        if (snapS > 240) snapS = 240;

        userPts2.push({ t: snapT, s: snapS });
        render();
    });

    // Кнопка «Отменить»
    document.getElementById('undoGraph2').addEventListener('click', function () {
        if (userPts2.length > 0) { userPts2.pop(); render(); }
    });

    // Кнопка «Очистить»
    document.getElementById('clearGraph2').addEventListener('click', function () {
        userPts2 = []; render();
    });

    // Экспорт для проверки
    window._renderGraph2 = render;
})();
function checkGraph2() {
    // Правильный ответ: (16, 240) и (19, 0)
    // Точка 1: остановка до t=16, s=240
    // Точка 2: возврат в A: t=19, s=0 (т.к. ехал 3 часа обратно с той же скоростью 80 км/ч... 240/80=3ч, 16+3=19)

    var found16_240 = false;
    var found19_0 = false;

    for (var i = 0; i < userPts2.length; i++) {
        var p = userPts2[i];
        if (Math.abs(p.t - 17) <= 0.5 && Math.abs(p.s - 240) <= 10) found16_240 = true;
        if (Math.abs(p.t - 20) <= 0.5 && Math.abs(p.s - 0) <= 10) found19_0 = true;
    }

    if (found16_240 && found19_0) return 2;   // обе точки верны
    if (found16_240 || found19_0) return 1;    // одна верна
    return 0;
}

function getUserGraph2Str() {
    if (userPts2.length === 0) return 'не построен';
    var parts = [];
    for (var i = 0; i < userPts2.length; i++) {
        parts.push('(' + userPts2[i].t + ';' + userPts2[i].s + ')');
    }
    return parts.join(' → ');
}
        /* ═══════════════════════════════════════════════════════
       ПРОВЕРКА И РЕЗУЛЬТАТЫ
    ═══════════════════════════════════════════════════════ */

    function norm(s) {
        return s.replace(/\s/g, '').replace(',', '.').toLowerCase();
    }
    function numEq(userStr, correct, eps) {
        var v = parseFloat(norm(userStr));
        if (isNaN(v)) return false;
        return Math.abs(v - correct) <= (eps || 0.001);
    }

    function checkGraph2() {
        if (userPts2.length < 2) return 0;
        var score = 0;
        var found1 = false, found2 = false;
        for (var i = 0; i < userPts2.length; i++) {
            var p = userPts2[i];
            if (p.t === 17 && p.s === 240) found1 = true;
            if (p.t === 20 && p.s === 0)   found2 = true;
        }
        if (found1) score++;
        if (found2) score++;
        return score;
    }

    function getUserGraph2Str() {
        if (userPts2.length === 0) return '\u2014';
        var s = [];
        for (var i = 0; i < userPts2.length; i++) {
            s.push('(' + userPts2[i].t + ';' + userPts2[i].s + ')');
        }
        return s.join(' \u2192 ');
    }

    function finishTest() {
        clearInterval(timerID);
        document.getElementById('testWrap').classList.remove('show');

        var tasks = [
            {
                num: '1\u0430',
                label: 'Задание 1 (а)',
                correct: '1.5',
                userVal: document.getElementById('a1a').value.trim(),
                check: function () { return numEq(this.userVal, 1.5); },
                max: 0.5
            },
            {
                num: '1\u0431',
                label: 'Задание 1 (б)',
                correct: '\u22120,4',
                userVal: document.getElementById('a1b').value.trim(),
                check: function () { return numEq(this.userVal, 0.4); },
                max: 0.5
            },
            {
                num: '2',
                label: 'Задание 2',
                correct: '25',
                userVal: document.getElementById('a2').value.trim(),
                check: function () { return numEq(this.userVal, 25); },
                max: 1
            },
            {
                num: '3',
                label: 'Задание 3',
                correct: '\u22122',
                userVal: document.getElementById('a3').value.trim(),
                check: function () { return numEq(this.userVal, 2); },
                max: 1
            },
            {
                num: '4',
                label: 'Задание 4 (точка A)',
                correct: '\u2248 \u22122,86',
                userVal: nlPlaced ? nlVal.toFixed(2) : '\u2014',
                check: function () {
                    if (!nlPlaced) return false;
                    return Math.abs(nlVal - (-0.75)) <= 0.1;
                },
                max: 1
            },
            {
                num: '5.1',
                label: 'Задание 5.1',
                correct: '80 км',
                userVal: document.getElementById('a5').value.trim(),
                check: function () { return numEq(this.userVal, 80); },
                max: 1
            },
           {
                num: '5.2',
                label: 'Задание 5.2 (график)',
                correct: '(14;240) → (17;240) → (20;0)',
                userVal: getUserGraph2Str(),
                check: function () { return checkGraph2() === 2; },
                max: 1
            },
            {
                num: '6',
                label: 'Задание 6',
                correct: '27',
                userVal: document.getElementById('a7').value.trim(),
                check: function () { return numEq(this.userVal, 27); },
                max: 1
            },
            {
                num: '7',
                label: 'Задание 7',
                correct: '\u22121',
                userVal: document.getElementById('a8').value.trim(),
                check: function () { return numEq(this.userVal, 1); },
                max: 2
            },
            {
                num: '8',
                label: 'Задание 8',
                correct: '3937,5 руб.',
                userVal: document.getElementById('a9').value.trim(),
                check: function () { return numEq(this.userVal, 3937.5); },
                max: 2
            },
            {
                num: '9',
                label: 'Задание 9',
                correct: '3 уч',
                userVal: document.getElementById('a10').value.trim(),
                check: function () { return numEq(this.userVal, 3); },
                max: 2
            }
        ];

        var totalMax = 0, totalGot = 0;
        var tbody = document.getElementById('resultsBody');
        tbody.innerHTML = '';

        for (var i = 0; i < tasks.length; i++) {
            var t = tasks[i];
            totalMax += t.max;
            var pts = 0;
            var cls = 'wrong';

            if (t.check()) {
                pts = t.max;
                cls = 'correct';
            } else if (t.partial && t.partial()) {
                pts = 1;
                cls = 'partial';
            }
            totalGot += pts;

            var tr = document.createElement('tr');
            tr.className = cls;
            tr.innerHTML =
                '<td>' + t.num + '</td>' +
                '<td style="text-align:left">' + t.label + '</td>' +
                '<td>' + (t.userVal || '\u2014') + '</td>' +
                '<td>' + t.correct + '</td>' +
                '<td><b>' + pts + '</b> / ' + t.max + '</td>';
            tbody.appendChild(tr);
        }

        var pct = Math.round(totalGot / totalMax * 100);
        var elapsed = 45 * 60 - timeLeft;
        if (elapsed < 0) elapsed = 45 * 60;
        var eMins = Math.floor(elapsed / 60);
        var eSecs = elapsed % 60;

        document.getElementById('resultsInfo').innerHTML =
            '<b>Участник:</b> ' + document.getElementById('pName').textContent +
            ' &nbsp;|&nbsp; <b>Класс:</b> ' + document.getElementById('pGrade').textContent +
            '<br><b>Затрачено времени:</b> ' + eMins + ' мин ' + pad(eSecs) + ' сек';

        var scoreDiv = document.getElementById('resultsScore');
        var grade = '';
        if (pct >= 85) {
            grade = 'Отлично!';
            scoreDiv.className = 'results-score good';
        } else if (pct >= 50) {
            grade = 'Хорошо';
            scoreDiv.className = 'results-score medium';
        } else {
            grade = 'Нужно подтянуть';
            scoreDiv.className = 'results-score bad';
        }
        scoreDiv.innerHTML =
            totalGot + ' / ' + totalMax + ' баллов &nbsp;(' + pct + '%)' +
            '<div style="font-size:16px;margin-top:6px;font-weight:400">' + grade + '</div>';

        document.getElementById('resultsWrap').classList.add('show');
        window.scrollTo(0, 0);
    }

    /* ═══════════════  ПЕРЕЗАПУСК  ═══════════════ */
    document.getElementById('restartBtn').addEventListener('click', function () {
        document.getElementById('resultsWrap').classList.remove('show');
        document.getElementById('regForm').classList.remove('hidden');

        /* Сброс полей ввода */
        var inputs = ['a1a', 'a1b', 'a2', 'a3', 'a5', 'a7', 'a8', 'a9', 'a10'];
        for (var i = 0; i < inputs.length; i++) {
            var el = document.getElementById(inputs[i]);
            if (el) el.value = '';
        }

        /* Сброс числовой прямой */
        nlInited = false;
        nlPlaced = false;
        nlVal = 0;
        tabLeft = 15;
        tabTop = 10;

        /* Сброс графика 5.2 */
        g2Inited = false;
        userPts2 = [];
        graphDrawn = false;

        /* Сброс навигации */
        cur = 1;
        for (var q = 1; q <= total; q++) {
            document.getElementById('q' + q).classList.remove('show');
        }
        document.getElementById('q1').classList.add('show');
        document.getElementById('qNum').textContent = '1';
        document.getElementById('prevBtn').disabled = true;
        document.getElementById('nextBtn').textContent = 'Следующее \u2192';
        document.getElementById('pFill').style.width = '10%';

        /* Сброс таймера */
        timeLeft = 45 * 60;
        document.getElementById('timer').textContent = '45:00';
        clearInterval(timerID);
        timerID = null;

        window.scrollTo(0, 0);
    });

})();