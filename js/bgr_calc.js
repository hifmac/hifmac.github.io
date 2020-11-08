addEventListener('load', function() {
    /**
     * @type {HTMLSelectElement}
     */
    const unit_selecter = document.getElementById('unit-selecter');
    const equip_selecters = [
        document.getElementById('equip1'),
        document.getElementById('equip2'),
        document.getElementById('equip3'),
        document.getElementById('equip4'),
        document.getElementById('equip5')
    ];
    /** @type {HTMLInputElement} */
    const unit_hp = document.getElementById('calc-unit-hp');
    /** @type {HTMLInputElement} */
    const unit_atk = document.getElementById('calc-unit-atk');
    /** @type {HTMLInputElement} */
    const unit_def = document.getElementById('calc-unit-def');
    /** @type {HTMLInputElement} */
    const unit_spd = document.getElementById('calc-unit-spd');
    /** @type {HTMLInputElement} */
    const unit_move = document.getElementById('calc-unit-move');
    /** @type {HTMLInputElement} */
    const unit_crit = document.getElementById('calc-unit-crit');
    /** @type {HTMLInputElement} */
    const unit_atkscale = document.getElementById('calc-unit-atkscale');
    /** @type {HTMLInputElement} */
    const unit_atkrange = document.getElementById('calc-unit-atkrange');
    /** @type {HTMLInputElement} */
    const unit_skillbuffer1 = document.getElementById('calc-unit-skillbuffer1');
    /** @type {HTMLInputElement} */
    const unit_skillbuffer2 = document.getElementById('calc-unit-skillbuffer2');
    /** @type {HTMLInputElement} */
    const unit_leaderskill = document.getElementById('calc-unit-leaderskill');
    /** @type {HTMLInputElement} */
    const unit_skillcd = document.getElementById('calc-unit-skillcd');
    /** @type {HTMLButtonElement} */
    const search_button = document.getElementById('search-button');
    /** @type {HTMLTableElement} */
    const search_table = document.getElementById('search-table');
    /** @type {HTMLSelectElement} */
    const spd_selecter = document.getElementById('spd-selecter');
    /** @type {HTMLSelectElement} */
    const crit_selecter = document.getElementById('crit-selecter');
    /** @type {HTMLSelectElement} */
    const def_selecter = document.getElementById('def-selecter');
    /** @type {HTMLDivElement} */
    const search_progress = document.getElementById('search-progress');


    const UNIT = BgrLib.getUnit().slice();
    const EQUIP = BgrLib.getEquip().slice();

    const {
        xorShift,
        toInt,
        toFloat,
        percentize,
        compareDesc,
        compareAsc,
        createTableCell,
        createTableHeader,
        createTableHeaderCell,
        clearChildren,
    } = BgrLib;

    /**
     * search function timer id
     * @type {(number | null)}
     */
    let search_timer = null;

    /**
     * slice character name from unit name
     * @param {string} name 
     */
    function sliceCharacterName(name) {
        let pos = name.indexOf(']');
        if (pos == -1) {
            pos = name.indexOf('》');
        }

        if (0 <= pos) {
            return name.substring(pos + 1);
        }

        return name;
    }
    UNIT.sort(function(a, b) {
        const a_name = sliceCharacterName(a.name());
        const b_name = sliceCharacterName(b.name());
        if (a_name == b_name) {
            return compareAsc(a.id(), b.id());
        }
        else {
            return compareAsc(a_name, b_name);
        }
    });
    EQUIP.sort((a, b) => compareAsc(a.name(), b.name()));

    function getUnit() {
        for (let i in UNIT) {
            if (unit_selecter.value == UNIT[i].id()) {
                return UNIT[i];
            }
        }
        return null;
    }

    /**
     * ger equip from selecter
     * @param {HTMLSelectElement} equip_selecter 
     */
    function getEquip(equip_selecter) {
        for (let i in EQUIP) {
            if (equip_selecter.value == EQUIP[i].id()) {
                return EQUIP[i];
            }
        }
        return null;
    }

    /**
     * compare 2 scores
     * @param {object} a object a
     * @param {object} b object b
     * @returns {1 | -1 | 0} score comparing result
     */
    function compareScore(a, b) {
        return compareDesc(a.score, b.score);
    }

    /**
     * compare 2 equip attacks
     * @param {BgrEquip} a equip a
     * @param {BgrEquip} b equip b
     * @returns {1 | -1 | 0} attack comparing result
     */
    function compareAttack(a, b) {
        return compareDesc(a.atk(), b.atk());
    }

    /**
     * Zingi count accumlator
     * @param {number} accum accumlator
     * @param {BgrEquip} equip equipment
     */
    function countZingi(accum, equip) {
        return accum + (equip.rank() == '神器' ? 1 : 0);
    }

    /**
     * unit with maximized parameter
     * @param {BgrUnit} unit base unit
     */
    function MaximizedUnit(unit) {
        this.unit = unit;
        this.base_hp = parseInt(unit.hp() * 1.34 + 900);
        this.base_atk = parseInt(unit.atk() * 1.338 + 45);
        this.base_def = parseInt(unit.def() * 1.338 + 45);
        this.base_spd = parseInt(unit.spd() * 1.31 + 50);
        this.base_crit = unit.crit() + 0.03;
        this.base_move = parseInt((unit.move() + 25) * 1.28);
    }

    MaximizedUnit.MAX_SPEED = 2000;
    MaximizedUnit.MAX_CRITICAL = 1.0;
    MaximizedUnit.MAX_MOVE = 500;

    /**
     * 
     * @param {BgrEquip[]} equipped
     * @param {number} spd_limit attack speed limit
     * @param {number} crit_buff critical buffer
     * @returns {(object | null)} equipped unit
     */
    MaximizedUnit.prototype.equip = function(equipped, spd_buff, crit_buff, def_target) {
        equipped = equipped.filter((x) => x);
        if (2 <= equipped.reduce(countZingi, 0)) {
            return null;
        }

        equipped.sort(compareAttack);

        const params = {
            unit: this.unit,
            equipped,
            hp: this.base_hp,
            atk: this.base_atk,
            spd: this.base_spd,
            crit: this.base_crit,
            def: this.base_def,
            move: this.base_move,
            score: 0,
            dps: 0,
        };

        for (let i in equipped) {
            params.hp += toInt(equipped[i].hp());
            params.atk += toInt(equipped[i].atk());
            params.spd += toInt(equipped[i].spd());
            params.crit += toFloat(equipped[i].crit());
            params.def += toInt(equipped[i].def());
            params.move += toInt(equipped[i].move());
        }

        params.spd = Math.min(MaximizedUnit.MAX_SPEED, params.spd);
        params.crit = Math.min(MaximizedUnit.MAX_CRITICAL, toInt(128 * params.crit + 0.05) / 100);
        params.move = Math.min(MaximizedUnit.MAX_MOVE, params.move);

        const frames = parseInt(60000 / Math.min(MaximizedUnit.MAX_SPEED, params.spd * (1 + spd_buff)) + 0.15);
        params.dps = params.atk * this.unit.atkScale()
            * (60 / frames)
            * (1 + Math.min(MaximizedUnit.MAX_CRITICAL, params.crit + crit_buff));
        params.score = params.dps * Math.min(1.0, Math.pow(params.def / def_target, 2));

        return params;
    }

    /**
     * 
     * @param {BgrUnit} unit 
     * @param {BgrEquip[]} equips 
     */
    function searchEquip(unit, equips) {
        if (search_timer) {
            clearTimeout(search_timer);
        }

        const maximized_unit = new MaximizedUnit(unit);
        const spd_buff = parseFloat(spd_selecter.value);
        const crit_buff = parseInt(crit_selecter.value);
        const def_target = toInt(def_selecter.value);

        /**
         * 3 x number of equips would be enough to random search
         */
        const max_candidate = 30;
        const max_group = 3;
        const result_groups = [];

        const search_begin = Date.now();
        const search_duration = 5000;
        const search_end = search_begin + search_duration;

        const isUnique = function(equipped) {
            return result_groups.reduce(function(accum1, results) {
                return accum1 && results.reduce(function(accum2, res) {
                    return accum2 && !res['equipped'].every((value, index) => value.name() == equipped[index].name());
                }, true);
            }, true);
        };

        /*
         * make initial randomized equips
         */ 
        while (result_groups.length < max_group) {
           const results = []
           while (results.length < max_candidate) {
                const index = [
                    xorShift() % equips.length,
                    xorShift() % equips.length,
                    xorShift() % equips.length,
                    xorShift() % equips.length,
                    xorShift() % equips.length
                ];

                /*
                * each equip should be unique
                */
                if (new Set(index).size < 5) {
                    continue;
                }

                const res = maximized_unit.equip(index.map((x) => equips[x]), spd_buff, crit_buff, def_target);
                if (res && isUnique(res['equipped'])) {
                    results.push(res);
                }
            }
            results.sort(compareScore);

            result_groups.push(results);
        }

        const timer = function () {
            let update = false;
            /** @type {BgrEquip[]} */

            const results = result_groups[xorShift() % max_group];
            for (let count = 0, end = Math.min(Date.now() + 200, search_end); (count & 0xfff) || Date.now() < end; ++count) {
                let child;
                while (true) {
                    const parent = [
                        results[xorShift() % results.length].equipped,
                        results[xorShift() % results.length].equipped,
                    ];
                    child = [
                        parent[xorShift() & 0x01][0],
                        parent[xorShift() & 0x01][1],
                        parent[xorShift() & 0x01][2],
                        parent[xorShift() & 0x01][3],
                        parent[xorShift() & 0x01][4]
                    ];
                    //child[xorShift() % 5] = equips[xorShift() % equips.length];
                    child[xorShift() % 5] = equips[xorShift() % equips.length];

                    if (new Set(child).size == 5) {
                        break;
                    }
                }

                const res = maximized_unit.equip(child, spd_buff, crit_buff, def_target);
                if (res && results[max_candidate - 1].score < res.score && isUnique(res.equipped)) {
                    results.push(res);
                    results.sort(compareScore);
                    results.pop();
                    update = true;
                }
            }

            if (update) {
                let results = [];
                for (let i in result_groups) {
                    results = results.concat(result_groups[i]);
                }
                results.sort(compareScore);

                clearChildren(search_table);

                const thead = createTableHeader();
                thead.appendChild(createTableHeaderCell('DPS'));
                thead.lastChild.setAttribute('title', '計算上のDPSです。\n実際のDPSはキャラクタのモーション等によって減少します。');
                thead.appendChild(createTableHeaderCell('攻撃'));
                thead.appendChild(createTableHeaderCell('攻速'));
                thead.appendChild(createTableHeaderCell('CRIT'));
                thead.appendChild(createTableHeaderCell('防御'));
                thead.appendChild(createTableHeaderCell('装備1'));
                thead.appendChild(createTableHeaderCell('装備2'));
                thead.appendChild(createTableHeaderCell('装備3'));
                thead.appendChild(createTableHeaderCell('装備4'));
                thead.appendChild(createTableHeaderCell('装備5'));
                search_table.appendChild(thead);

                const tbody = document.createElement('tbody');
                const candidate = results;//.slice(0, 30);
                for (let i in candidate) {
                    const tr = document.createElement('tr');
                    const r = candidate[i];
                    [
                        parseInt(r['dps']),
                        r['atk'],
                        r['spd'],
                        percentize(r['crit']),
                        r['def'],
                        r['equipped'][0].name(),
                        r['equipped'][1].name(),
                        r['equipped'][2].name(),
                        r['equipped'][3].name(),
                        r['equipped'][4].name(),
                    ].forEach(function(value) {
                        tr.appendChild(createTableCell(value));
                    });
                    tr.addEventListener('click', function() {
                        for (let j in equip_selecters) {
                            equip_selecters[j].value = r['equipped'][j].id();
                        }
                        unit_selecter.dispatchEvent(new Event('change'));
                    })
                    tbody.appendChild(tr);
                }
                search_table.appendChild(tbody);
            }

            const progress = parseInt(100 * (Date.now() - search_begin) / search_duration);
            search_progress.setAttribute('aria-valuenow', progress);
            search_progress.textContent = progress + '%';
            search_progress.style.width = progress + '%';

            if (Date.now() < search_end) {
                search_timer = setTimeout(timer, 0);
            }
            else {
                search_timer = null;
            }
        };

        timer();
    }

    function onSearchRequested() {
        const equips = [];
        const not_unique = [];

        /*
         * cut needless equipment
         */
        for (let i in EQUIP) {
            if (0 <= not_unique.indexOf(parseInt(i))) {
                continue;
            }

            const equip = EQUIP[i];
            if (equip.atk() <= 0 && equip.spd() <= 0 && equip.crit() <= 0) {
                continue;
            }

            let unique = true;
            for (let j = parseInt(i) + 1; j < EQUIP.length; ++j) {
                unique = unique
                    && (EQUIP[j].atk() < equip.atk()
                        || EQUIP[j].def() < equip.def()
                        || EQUIP[j].spd() < equip.spd()
                        || EQUIP[j].move() < equip.move()
                        || EQUIP[j].crit() < equip.crit()
                        || EQUIP[j].hp() < equip.hp());

                const lesser = EQUIP[j].atk() <= equip.atk()
                    && EQUIP[j].def() <= equip.def()
                    && EQUIP[j].spd() <= equip.spd()
                    && EQUIP[j].move() <= equip.move()
                    && EQUIP[j].crit() <= equip.crit()
                    && EQUIP[j].hp() <= equip.hp();
                if (lesser) {
                    not_unique.push(j);
                }
            }

            if (unique) {
                equips.push(equip);
            }
        }

        /** @type {BgrEquip[]} */
         searchEquip(getUnit(), equips);
    }

    function onChanged() {
        const unit = getUnit();
        const max_unit = new MaximizedUnit(unit);
        const params = max_unit.equip(equip_selecters.map((x) => getEquip(x)), 0, 0, 0);
        if (params) {
            unit_hp.value   = params.hp;
            unit_atk.value  = params.atk;
            unit_spd.value  = params.spd;
            unit_def.value  = params.def;
            unit_move.value = params.move;
            unit_crit.value = percentize(params.crit);
            unit_atkscale.value = percentize(unit.atkScale());
            unit_atkrange.value = unit.atkRange();
            unit_skillbuffer1.value = unit.attackSkillBuffer1();
            unit_skillbuffer2.value = unit.attackSkillBuffer2();
            unit_leaderskill.value = unit.leaderSkill();
            unit_skillcd.value = unit.attackSkillCooldown();
        }
    }

    for (let i in UNIT) {
        unit_selecter.appendChild(BgrLib.createElement('option', UNIT[i].name(), { value: UNIT[i].id() }));
    }
    unit_selecter.addEventListener('change', onChanged);

    equip_selecters.forEach(function(e) {
        e.appendChild(BgrLib.createElement('option', '無し'));
        for (let i in EQUIP) {
            e.appendChild(BgrLib.createElement('option', EQUIP[i].name(), { value: EQUIP[i].id() }));
        }
        e.addEventListener('change', onChanged);
    });

    search_button.addEventListener('click', onSearchRequested);

    onChanged();
});
