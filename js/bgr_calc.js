import {
    BgrLib,
    Table,
    TableColumn,
    UNIT_MAX_SPEED,
    UNIT_MAX_SPEED_EFFECTIVE,
    UNIT_MAX_CRITICAL,
    UNIT_MAX_MOVE,
    BgrEquip,
} from './bgr_lib.js';

addEventListener('load', function() {
    /**
     * @type {HTMLSelectElement}
     */
    const unit_search = document.getElementById('unit-search');
    const unit_selecter = document.getElementById('unit-selecter');
    const equip_selecters = [
        document.getElementById('equip1'),
        document.getElementById('equip2'),
        document.getElementById('equip3'),
        document.getElementById('equip4'),
        document.getElementById('equip5')
    ];

    /** @type {HTMLInputElement} */
    const unit_id = document.getElementById('calc-unit-id');
    /** @type {HTMLInputElement} */
    const unit_attr = document.getElementById('calc-unit-attr');
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

    const rare_n_checkbox = document.getElementById('rare-n-checkbox');
    const rare_r_checkbox = document.getElementById('rare-r-checkbox');
    const rare_sr_checkbox = document.getElementById('rare-sr-checkbox');
    const rare_ssr_checkbox = document.getElementById('rare-ssr-checkbox');
    const rare_ur_checkbox = document.getElementById('rare-ur-checkbox');
    const rare_zingi_checkbox = document.getElementById('rare-zingi-checkbox');
    const exclusion_checkbox = document.getElementById('exclusion-checkbox');


    /** @type {HTMLSelectElement} */
    const included_equips = document.getElementById('included-equips');
    /** @type {HTMLSelectElement} */
    const excluded_equips = document.getElementById('excluded-equips');

    const NUMERIC = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    const UNIT = BgrLib.getUnit().slice();
    const EQUIP = BgrLib.getEquip().slice();

    const {
        clearChildren,
        createElement,
        speedToFrame,
        xorShift,
        toInt,
        toFloat,
        percentize,
        compareDesc,
        compareAsc,
        trueType,
        falseType,
        includedBy,
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

    function updateUnit() {
        clearChildren(unit_selecter);

        if (unit_search.value.length) {
            for (let unit of UNIT) {
                if (includedBy(unit.name(), unit_search.value)) {
                    unit_selecter.appendChild(createElement('option', unit.name(), { value: unit.id() }));
                }
            }    
        }
        else {
            for (let unit of UNIT) {
                unit_selecter.appendChild(createElement('option', unit.name(), { value: unit.id() }));
            }
        }
    }

    function getUnit() {
        for (let unit of UNIT) {
            if (unit_selecter.value == unit.id()) {
                return unit;
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
     * @param {EquippedUnit} a object a
     * @param {EquippedUnit} b object b
     * @returns {1 | -1 | 0} score comparing result
     */
    function compareScore(a, b) {
        return compareDesc(a.score, b.score) || compareAsc(a.hash, b.hash);
    }

    /**
     * compare 2 equip attacks
     * @param {BgrEquip} a equip a
     * @param {BgrEquip} b equip b
     * @returns {1 | -1 | 0} attack comparing result
     */
    function compareAttack(a, b) {
        return compareDesc(a.atk(), b.atk()) || compareAsc(a.id(), b.id());
    }

    /**
     * make a hash of equip set
     * @param {BgrEquip[]} equips
     * @returns {strings} equip set hash
     */
    function hashEquipSet(equips) {
        const ids = equips.map((x) => x.id()).sort();    
        let id_text = '';
        for (let i in ids) {
            let id = ids[i];
            id_text += NUMERIC[parseInt(id / 10000)];
            id %= 10000;
            id_text += NUMERIC[parseInt(id / 1000)];
            id %= 1000;
            id_text += NUMERIC[parseInt(id / 100)];
            id %= 100;
            id_text += NUMERIC[parseInt(id / 10)];
            id %= 10;
            id_text += NUMERIC[id];
       
        }
        return id_text;
    }

    /**
     * unit equipped weapons
     * @param {BgrUnit} unit
     * @param {BgrEquip[]} equips
     * @param {number} spd_limit attack speed limit
     * @param {number} crit_buff critical buffer
     * @param {number} def_target target defense value
     */
    function EquippedUnit(unit, equips, spd_buff, crit_buff, def_target) {
        this.unit = unit;
        /** @type {BgrEquip[]} */
        this.equips = equips.filter((x) => x);
        this.hash = hashEquipSet(this.equips);
        this.hp = toInt(this.unit.reinforcedHp());
        this.atk = toInt(this.unit.reinforcedAtk());
        this.spd = toInt(this.unit.reinforcedSpd());
        this.crit = this.unit.reinforcedCrit();
        this.def = toInt(this.unit.reinforcedDef());
        this.move = toInt(this.unit.reinforcedMove());

        for (let i in this.equips) {
            this.hp += this.equips[i].hp();
            this.atk += this.equips[i].atk();
            this.spd += this.equips[i].spd();
            this.crit += toFloat(this.equips[i].crit()) * this.unit.bonusCritRate();
            this.def += this.equips[i].def();
            this.move += this.equips[i].move();
        }

        this.spd = Math.min(UNIT_MAX_SPEED, this.spd);
        this.crit = Math.min(UNIT_MAX_CRITICAL, toInt(100 * this.crit + 0.05) / 100);
        this.move = Math.min(UNIT_MAX_MOVE, this.move);

        this.dps = this.atk * this.unit.atkScale()
            * (60 / speedToFrame(toInt(Math.min(UNIT_MAX_SPEED, this.spd * (1 + spd_buff)))))
            * (1 + Math.min(UNIT_MAX_CRITICAL, this.crit + crit_buff));
            this.score = this.dps * Math.min(1.0, Math.pow(this.def / def_target, 2));
        if (this.equips.length < 5) {
            this.score /= Math.min(1, (this.spd * (1 + spd_buff)) / UNIT_MAX_SPEED_EFFECTIVE);
            this.score /= Math.min(1, this.crit + crit_buff);
        }
    };

    /** @type {BgrUnit} */
    EquippedUnit.prototype.unit = null;
    /** @type {BgrEquip[]} */
    EquippedUnit.prototype.equips = null;
    EquippedUnit.prototype.hash = '';
    EquippedUnit.prototype.hp = 0;
    EquippedUnit.prototype.atk = 0;
    EquippedUnit.prototype.spd = 0;
    EquippedUnit.prototype.crit = 0;
    EquippedUnit.prototype.def = 0;
    EquippedUnit.prototype.move = 0;
    EquippedUnit.prototype.score = 0;
    EquippedUnit.prototype.dps = 0;

    /**
     * search equip with right staff
     */
    class RSSearch {
        static NUM_RESULTS = 30;
        static SHRINK_THRESHOLD = 100

        /**
         * constructor
         * @param {BgrUnit} unit 
         * @param {BgrEquip[]} weapons 
         */
        constructor(unit, weapons) {
            this.unit = unit;
            this.weapons = weapons;
            this.spd_buff = parseFloat(spd_selecter.value);
            this.crit_buff = parseFloat(crit_selecter.value);
            this.def_target = toInt(def_selecter.value);
            /** @type {EquippedUnit[]} */
            this.results = [];
            this.last_hash = '';


            const limitRareN = rare_n_checkbox.checked ? 5 : 0;
            const limitRareR = rare_r_checkbox.checked ? 5 : 0;
            const limitRareSR = rare_sr_checkbox.checked ? 5 : 0;
            const limitRareSSR = rare_ssr_checkbox.checked ? 5 : 0;
            const limitRareUR = rare_ur_checkbox.checked ? 5 : 0;
            const limitRareZingi = rare_zingi_checkbox.checked ? 1 : 0;
            const limitExcluded = (exclusion_checkbox.checked ? [ ...excluded_equips.options ] : []).map(option => option.value);

            this.weapons = this.weapons.filter((x) => limitRareN || x.rank() != 'N');
            this.weapons = this.weapons.filter((x) => limitRareR || x.rank() != 'R');
            this.weapons = this.weapons.filter((x) => limitRareSR || x.rank() != 'SR');
            this.weapons = this.weapons.filter((x) => limitRareSSR || x.rank() != 'SSR');
            this.weapons = this.weapons.filter((x) => limitRareUR || x.rank() != 'UR');
            this.weapons = this.weapons.filter((x) => limitRareZingi || x.rank() != '神器');
            this.weapons = this.weapons.filter((x) => !limitExcluded.includes(`${x.id()}`));

            /**
             * @param {BgrEquip[]} equips
             * @returns {boolean} whether equips satisfy the limitation of number of weapons.
             */
            this.validateWeapon = function RSSearch_validateWeapon(equips) {
                const numWeapons = {
                    N: limitRareN,
                    R: limitRareR,
                    SR: limitRareSR,
                    SSR: limitRareSSR,
                    UR: limitRareUR,
                    '神器': limitRareZingi
                };
        
                for (let equip of equips) {
                    numWeapons[equip.rank()] -= 1;
                }

                return 0 <= numWeapons['神器']
                    && 0 <= numWeapons['UR']
                    && 0 <= numWeapons['SSR']
                    && 0 <= numWeapons['SR']
                    && 0 <= numWeapons['R']
                    && 0 <= numWeapons['N'];
            };
        }

        /**
         * search equipes until step end
         * @param {number} step_end 
         * @returns {boolean}
         */
        step(step_end) {
            let update = false;
            let weapons = [];

            while (Date.now() < step_end) {
                const specials = this.specials ? this.specials : this.weapons;
                const speclal_length = specials.length;

                while (true) {
                    weapons[0] = specials[xorShift() % speclal_length];
                    weapons[1] = specials[xorShift() % speclal_length];
                    weapons[2] = specials[xorShift() % speclal_length];
                    weapons[3] = specials[xorShift() % speclal_length];
                    weapons[4] = this.weapons[xorShift() % this.weapons.length];
                    if (new Set(weapons).size == weapons.length && this.validateWeapon(weapons)) {
                        this.results.push(new EquippedUnit(this.unit, weapons, this.spd_buff, this.crit_buff, this.def_target));
                        if (RSSearch.SHRINK_THRESHOLD <= this.results.length) {
                            break;
                        }
                    }
                }

                this.shrinkResult(RSSearch.NUM_RESULTS);

                if (this.last_hash != this.results[RSSearch.NUM_RESULTS - 1].hash) {
                    this.last_hash = this.results[RSSearch.NUM_RESULTS - 1].hash;
                    this.results.forEach((x) => x.equips.sort(compareAttack));
                    this.specials = Array.from(
                        new Set(this.results.reduce((accum, x) => accum.concat(x.equips), []))
                        );

                    update = true;
                }
            }

            return update;
        }

        /**
         * remove duplicates from an array
         * @param {EquippedUnit[]} results 
         */
        removeDuplicates(results) {
            if (results.length) {
                let prevhash = results[0].hash;
                for (let i = 1; i < results.length; ++i) {
                    while (i < results.length) {
                        if (prevhash != results[i].hash) { 
                            prevhash = results[i].hash;
                            break;
                        }
                        results.splice(i, 1);
                    }
                }
            }
        }

        shrinkResult(size) {
            this.results.sort(compareScore);
            this.removeDuplicates(this.results);
            this.results.splice(size);
        }

        getResult() {
            return this.results;
        }
    };

    /**
     * @param {BgrEquip} equip 
     */
    function makeEquipTooltip(equip) {
        return 'HP：' + equip.hp() 
            + '<br>攻撃：' + equip.atk()
            + '<br>攻速：' + equip.spd()
            + '<br>CRIT：' + (percentize(equip.crit()) || '0%')
            + '<br>防御：' + equip.def()
            + '<br>移動：' + equip.move();
        }

    const search_result_table = new Table(search_table);
    search_result_table.column = [
        new TableColumn('SCORE', falseType, (x) => x.score),
        new TableColumn('DPS', trueType, (x) => toInt(x.dps)),
        new TableColumn('攻撃', trueType, (x) => x.atk),
        new TableColumn('攻速', trueType, (x) => x.spd),
        new TableColumn('CRIT', trueType, (x) => x.crit, { format: (x) => percentize(x) }),
        new TableColumn('防御', trueType, (x) => x.def),
        new TableColumn('装備1', trueType, (x) => x.equips[0].name(), { tooltip: (x) => makeEquipTooltip(x.equips[0]) }),
        new TableColumn('装備2', trueType, (x) => x.equips[1].name(), { tooltip: (x) => makeEquipTooltip(x.equips[1]) }),
        new TableColumn('装備3', trueType, (x) => x.equips[2].name(), { tooltip: (x) => makeEquipTooltip(x.equips[2]) }),
        new TableColumn('装備4', trueType, (x) => x.equips[3].name(), { tooltip: (x) => makeEquipTooltip(x.equips[3]) }),
        new TableColumn('装備5', trueType, (x) => x.equips[4].name(), { tooltip: (x) => makeEquipTooltip(x.equips[4]) }),
    ];

    search_result_table.sort_column = search_result_table.column[0];
    search_result_table.sort_desc = true;
    search_result_table.bodyClickListeners.push(function(data) {
        for (let j in equip_selecters) {
            equip_selecters[j].value = data.equips[j].id();
        }
        unit_selecter.dispatchEvent(new Event('change'));
    });


    // ユニット変更イベントハンドラ
    function onChanged() {
        const params = new EquippedUnit(getUnit(), equip_selecters.map((x) => getEquip(x)), 0, 0, 0);
        if (params) {
            unit_id.value = params.unit.id();
            unit_attr.value = params.unit.attr();
            unit_hp.value   = params.hp;
            unit_atk.value  = params.atk;
            unit_spd.value  = params.spd;
            unit_def.value  = params.def;
            unit_move.value = params.move;
            unit_crit.value = percentize(params.crit);
            unit_atkscale.value = percentize(params.unit.atkScale());
            unit_atkrange.value = params.unit.atkRange();
            unit_skillbuffer1.value = params.unit.attackSkillBuffer1();
            unit_skillbuffer2.value = params.unit.attackSkillBuffer2();
            unit_leaderskill.value = params.unit.leaderSkill();
            unit_skillcd.value = params.unit.attackSkillCooldown();
        }
    }

    // 名前フィルタ変更イベント
    unit_search.addEventListener('input', function() {
        updateUnit();
        onChanged();
    });

    // ユニット変更イベント
    unit_selecter.addEventListener('change', onChanged);

    // 検索ボタン
    search_button.addEventListener('click', function onSearchRequested() {
        if (search_timer) {
            clearTimeout(search_timer);
        }

        const search_begin = Date.now();
        const search_duration = 10000;
        const search_end = search_begin + search_duration;
        const search_step = 200;
        const update_duration = 1000;

        let last_update = 0;
        let search = new RSSearch(getUnit(), EQUIP);
        let timer = function () {
            const update = search.step(Math.min(Date.now() + search_step, search_end));
            const now = Date.now();
            const progress = parseInt(100 * (Date.now() - search_begin) / search_duration);
            search_progress.setAttribute('aria-valuenow', progress);
            search_progress.textContent = progress + '%';
            search_progress.style.width = progress + '%';

            if (!update && search_end <= Date.now()) {
                search_result_table.data = search.getResult().slice(0, 30);
                search_result_table.update();
                search_timer = null;
                search = null;
                timer = null;
            }
            else {
                if (update && update_duration <= now - last_update) {
                    last_update = now;
                    search_result_table.data = search.getResult().slice(0, 30);
                    search_result_table.update();
                }    
                search_timer = setTimeout(timer, 0);
            }
        };

        timer();
    });

    // 装備登録
    equip_selecters.forEach(function(e) {
        e.appendChild(createElement('option', '無し'));
        for (let equip of EQUIP) {
            e.appendChild(createElement('option', equip.name(), { value: equip.id() }));
        }
        e.addEventListener('change', onChanged);
    });


    // #####################
    // ###   除外装備UI   ###
    // #####################

    // 除外装備登録
    const excludedEquips = JSON.parse(localStorage.getItem("excluded-equips") || "[]");
    for (const e of [ ...EQUIP ].sort((a, b) => (a.id() - b.id()))) {
        if (excludedEquips.includes(`${e.id()}`)) {
            excluded_equips.appendChild(BgrLib.createElement("option", `${e.rank()} - ${e.name()}`, { "value": e.id() }));
        }
        else {
            included_equips.appendChild(BgrLib.createElement("option", `${e.rank()} - ${e.name()}`, { "value": e.id() }));
        }
    }

    /**
     * 装備移動関数
     * @param {HTMLSelectElement} source 移動元リスト
     * @param {HTMLSelectElement} destination 移動先リスト
     */
    const moveSelected = (source, destination) => {
        const addOptions = [ ...destination.options ];
        const removeIndexies = [];

        // 移動対象を選別する
        for (const opt of [ ...source.options ]) {
            if (opt.selected) {
                opt.selected = false;
                removeIndexies.push(opt.index);
                addOptions.push(opt);
            }
        }

        // 移動要素が無ければ終わる
        if (removeIndexies.length === 0) {
            return ;
        }

        // 要素を削除する
        removeIndexies.reverse();
        for (const index of removeIndexies) {
            source.options.remove(index);
        }

        // ID順に並べ替えた要素を追加する
        while (destination.options.length) {
            destination.options.remove(0);
        }

        addOptions.sort((a, b) => ((a.value | 0) - (b.value | 0)));
        for (const opt of addOptions) {
            destination.options.add(opt);
        }

        // 除外装備を保存する
        localStorage.setItem("excluded-equips", JSON.stringify([ ...excluded_equips.options ].map(x => x.value)));
    };

    // 除外ハンドラ
    document.getElementById("exclude-button").addEventListener("click", () => moveSelected(included_equips, excluded_equips));

    // 復帰ハンドラ
    document.getElementById("include-button").addEventListener("click", () => moveSelected(excluded_equips, included_equips));

    updateUnit();
    onChanged();
});
