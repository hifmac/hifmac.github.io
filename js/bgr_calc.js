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
    /** @type {HTMLButtonElement} */
    const search_button = document.getElementById('search-button');
    /** @type {HTMLTableElement} */
    const search_table = document.getElementById('search-table');
    /** @type {HTMLSelectElement} */
    const spd_selecter = document.getElementById('spd-selecter');
    /** @type {HTMLSelectElement} */
    const crit_selecter = document.getElementById('crit-selecter');
    /** @type {HTMLDivElement} */
    const search_progress = document.getElementById('search-progress');

    const UNIT = BgrLib.getUnit().slice();
    const EQUIP = BgrLib.getEquip().slice();

    const {
        xorShift,
        toInt,
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
            if (equip_selecter.value == EQUIP[i].name()) {
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
        return compareDesc(a['score'], b['score']);
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
    MaximizedUnit.MAX_SPEED_EFFECTIVE = 1945;

    /**
     * 
     * @param {BgrEquip[]} equipped
     * @param {number} spd_limit attack speed limit
     * @param {number} crit_buff critical buffer
     * @returns {(object | null)} equipped unit
     */
    MaximizedUnit.prototype.equip = function(equipped, spd_limit, crit_buff) {
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
        };

        for (let i in equipped) {
            params.hp += toInt(equipped[i].hp());
            params.atk += toInt(equipped[i].atk());
            params.spd += toInt(equipped[i].spd());
            params.crit += equipped[i].crit();
            params.def += toInt(equipped[i].def());
            params.move += toInt(equipped[i].move());
        }

        params.spd = Math.min(MaximizedUnit.MAX_SPEED, params.spd);
        params.crit = Math.min(MaximizedUnit.MAX_CRITICAL, params.crit * 1.28);
        params.move = Math.min(MaximizedUnit.MAX_MOVE, params.move);
        params.score = params.atk * this.unit.atkScale()
            * Math.min(MaximizedUnit.MAX_SPEED_EFFECTIVE, params.spd * MaximizedUnit.MAX_SPEED_EFFECTIVE / spd_limit)
            * (1 + Math.min(MaximizedUnit.MAX_CRITICAL, params.crit + crit_buff)) / 1000;

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
        const spd_limit = parseInt(spd_selecter.value);
        const crit_buff = parseInt(crit_selecter.value);

        /**
         * 3 x number of equips would be enough to random search
         */
        const max_candidate = parseInt(equips.length * 3 / 5);
        const result = [];

        const search_step = 10000;
        const search_grow = 1000;
        let search_count = 0;
        let search_limit = search_step;

        /*
         * make initial randomized equips
         */
        while (result.length < max_candidate) {
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

            const res = maximized_unit.equip(index.map((x) => equips[x]), spd_limit, crit_buff);
            if (res) {
                result.push(res);
            }
        }
        result.sort(compareScore);

        /**
         * 
         */
        const timer = function () {
            let update = false;
    
            for (let i = 0; i < search_step && search_count < search_limit; ++i, ++search_count) {
                /** @type {BgrEquip[]} */
                const parent = result[xorShift() % result.length]['equipped'];
                const child = parent.slice();
                child[xorShift() % 5] = equips[xorShift() % equips.length];
                if (new Set(child).size < 5) {
                    continue;
                }

                const r = maximized_unit.equip(child, spd_limit, crit_buff);
                if (r && result[max_candidate - 1]['score'] < r['score']) {
                    const unique = result.reduce((accum, x) => accum && x['score'] != r['score'], true);
                    if (unique) {
                        result.push(r);
                        result.sort(compareScore);
                        result.pop();
                        search_limit += search_grow;
                        update = true;
                    }
                }
            }

            const progress = parseInt(100 * search_count / search_limit);
            search_progress.setAttribute('aria-valuenow', progress);
            search_progress.textContent = progress + '%';
            search_progress.style.width = progress + '%';

            if (update) {
                clearChildren(search_table);

                const thead = createTableHeader();
                thead.appendChild(createTableHeaderCell('ダメージ'));
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
                const candidate = result.slice(0, 30);
                for (let i in candidate) {
                    const tr = document.createElement('tr');
                    const r = candidate[i];
                    [
                        parseInt(r['score']),
                        r['atk'],
                        r['spd'],
                        percentize(Math.min(r['crit'], 1.0)),
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
                            equip_selecters[j].value = r['equipped'][j].name();
                        }
                        unit_selecter.dispatchEvent(new Event('change'));
                    })
                    tbody.appendChild(tr);
                }
                search_table.appendChild(tbody);
            }

            if (search_count < search_limit) {
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
        const params = max_unit.equip(equip_selecters.map((x) => getEquip(x)), MaximizedUnit.MAX_SPEED_EFFECTIVE, 0);
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

            console.log(params.hp, unit_hp, unit_hp.value);
        }
    }

    for (let i in UNIT) {
        unit_selecter.appendChild(BgrLib.createElement('option', UNIT[i].name(), { value: UNIT[i].id() }));
    }
    unit_selecter.addEventListener('change', onChanged);

    equip_selecters.forEach(function(e) {
        e.appendChild(BgrLib.createElement('option', '無し'));
        for (let i in EQUIP) {
            e.appendChild(BgrLib.createElement('option', EQUIP[i].name(), { value: EQUIP[i].name() }));
        }
        e.addEventListener('change', onChanged);
    });

    search_button.addEventListener('click', onSearchRequested);
});
