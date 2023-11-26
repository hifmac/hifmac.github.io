import { BgrLib, Table, TableColumn } from './bgr_lib.js'
import { Checkbox, Textbox } from './bgr_util.js'

/**
 * 
 * @param {(number | string)} id 
 * @param {string} text 
 * @param {function((BgrUnit | BgrEquip)): (number | string)} read 
 */
function CheckboxColumn(id, text, read, attributes) {
    this.checkbox = new Checkbox(id, text, attributes ? attributes.checked : true);
    this.column = new TableColumn(text, () => this.checkbox.input.checked, read, attributes);
};

/**
 * 
 * @param {Checkbox[]} checkboxes 
 * @param {function((number | string), (BgrUnit | BgrEquip)): boolean} fincterFunction 
 * @returns {function((BgrUnit | BgrEquip)) : boolean}
 */
function CheckboxToFilter(checkboxes, filterFunction) {
    return function (data) {
        for (let checkbox of checkboxes) {
            if (checkbox.input.checked && filterFunction(data, checkbox.label.textContent)) {
                return true;
            }
        }
        return false;
    };
}

/**
 * 
 * @param {Textbox} textbox
 * @param {function((number | string), (BgrUnit | BgrEquip)): boolean} filterFunction
 * @returns {function((BgrUnit | BgrEquip)) : boolean}
 */
function TextboxToFilter(textbox, filterFunction) {
    return function (data) { 
        return filterFunction(data, textbox.input.value);
    };
};

/**
 * set form group
 * @param {(Checkbox[] | Textbox[])} forms 
 */
function setFormGroup(label, group, forms) {
    BgrLib.clearChildren(group);
    if (label) {
        const div = BgrLib.createElement('div');
        div.classList.add("col-auto");
        div.appendChild(BgrLib.createElement('label', label + '：'));
        group.appendChild(div);
    }
    for (let i in forms) {
        group.appendChild(forms[i].div);
    }
}

addEventListener('load', function() {
    /**
     * filter equip by skill
     * @param {BgrEquip} equip 
     * @param {string} value 
     */
    function filterEquipSkill(equip, value) {
        if (value.length) {
            return 0 <= equip.skillBuffer1().indexOf(value)
                || 0 <= equip.skillBuffer2().indexOf(value);
        }
        return true;       
    }

    /**
     * filter equip by name
     * @param {BgrEquip} equip 
     * @param {string} value 
     */
    function filterEquipName(equip, value) {
        if (value.length) {
            return BgrLib.includedBy(equip.name(), value);
        }
        return true;       
    }

    /**
     * filter equip by rarelity
     * @param {BgrEquip} equip 
     * @param {string} value 
     */
    function filterEquipRank(equip, value) {
        return equip.rank() == value;
    }

    /** @type {HTMLTableElement} */
    const equip_table = document.getElementById("equip-table");

    /** @type {HTMLDivElement} */
    const equip_rank_filter = document.getElementById("equip-rank-filter");

    /** @type {HTMLDivElement} */
    const equip_skill_filter = document.getElementById("equip-skill-filter");

    /** @type {HTMLDivElement} */
    const equip_content = document.getElementById("equip-content");

    const column_checkbox = [
        new CheckboxColumn('equip-name', '名前', (x) => x.name()),
        new CheckboxColumn('equip-rank', 'ランク', (x) => x.rank()),
        new CheckboxColumn('equip-level', '最大レベル', (x) => x.level()),
        new CheckboxColumn('equip-hp', 'HP', (x) => x.hp(), {format: parseInt}),
        new CheckboxColumn('equip-atk', '攻撃', (x) => x.atk(), {format: parseInt}),
        new CheckboxColumn('equip-spd', '攻撃速度', (x) => x.spd(), {format: parseInt}),
        new CheckboxColumn('equip-critical', 'クリティカル', (x) => x.crit(), {format: BgrLib.percentize}),
        new CheckboxColumn('equip-def', '防御', (x) => x.def(), {format: parseInt}),
        new CheckboxColumn('equip-move', '移動速度', (x) => x.move()),
        new CheckboxColumn('equip-skillbuffer1', 'スキル効果1', (x) => x.skillBuffer1(), {checked: false}),
        new CheckboxColumn('equip-skillbuffer2', 'スキル効果2', (x) => x.skillBuffer2(), {checked: false}),
        new CheckboxColumn('equip-skillscale', 'スキル倍率', (x) => x.skillScale(), {checked: false, format: BgrLib.percentize}),
        new CheckboxColumn('equip-skillbp', 'スキルBP', (x) => x.skillBP(), {checked: false}),
        new CheckboxColumn('equip-dropstage', 'ドロップ', (x) => x.dropStage(), {checked: false}),
        new CheckboxColumn('equip-itembox', '箱', (x) => x.itembox(), {checked: false}),
    ];

    const rank_checkbox = [
        new Checkbox('N', 'N'),
        new Checkbox('R', 'R'),
        new Checkbox('SR', 'SR'),
        new Checkbox('SSR', 'SSR'),
        new Checkbox('UR', 'UR'),
        new Checkbox('Z', '神器'),
    ];

    const skill_textbox = [
        new Textbox('name-equip', '名前'),
        new Textbox('skill-equip', 'スキル効果'),
    ];

    const table = new Table(equip_table);
    table.data = BgrLib.getEquip().slice();
    table.column = Array.from(column_checkbox, (x) => x.column);
    table.filters = [
        CheckboxToFilter(rank_checkbox, filterEquipRank),
        TextboxToFilter(skill_textbox[1], filterEquipSkill),
        TextboxToFilter(skill_textbox[0], filterEquipName),
    ];

    setFormGroup('列', equip_content, Array.from(column_checkbox, (x) => x.checkbox));
    setFormGroup('ランク', equip_rank_filter, rank_checkbox);
    setFormGroup(null, equip_skill_filter, skill_textbox);

    const listener = table.update.bind(table);
    [
        column_checkbox.map((x) => x.checkbox),
        rank_checkbox,
        skill_textbox,
    ].forEach(function (filters) {
        for (let i in filters) {
            const type = filters[i].input.type == 'text' ? 'input' : 'change';
            filters[i].input.addEventListener(type, listener);
        }
    });

    table.update();
});

addEventListener('load', function() {
    /** @type {HTMLDivElement} */
    const unit_attr_filter = document.getElementById("unit-attr-filter");

    /** @type {HTMLDivElement} */
    const unit_content = document.getElementById("unit-content");

    /** @type {HTMLDivElement} */
    const unit_skill_filter = document.getElementById("unit-skill-filter");

    /** @type {HTMLTableElement} */
    const unit_table = document.getElementById("unit-table");

    /**
     * filter unit by attack skill
     * @param {BgrUnit} unit 
     * @param {string} value 
     */
    function filterAttackSkill(unit, value) {
        if (value.length) {
            return 0 <= unit.attackSkillBuffer1().indexOf(value)
                || 0 <= unit.attackSkillBuffer2().indexOf(value);
        }
        return true;
    }

    /**
     * filter unit by leader skill
     * @param {BgrUnit} unit 
     * @param {string} value 
     */
    function filterLeaderSkill(unit, value) {
        if (value.length) {
            return 0 <= unit.leaderSkill().indexOf(value);
        }
        return true;
    }
    
    /**
     * filter unit by attribute
     * @param {BgrUnit} unit 
     * @param {string} value 
     */
    function filterAttribute(unit, value) {
        return unit.attr() == value;
    }

    /**
     * filter unit by attribute
     * @param {BgrUnit} unit 
     * @param {string} value 
     */
    function filterName(unit, value) {
        return !value.length || BgrLib.includedBy(unit.name(), value);
    }

    const attribute_checkbox = [
        new Checkbox('attr-sandica', 'サンディカ'),
        new Checkbox('attr-demonia', 'デモニア'),
        new Checkbox('attr-valmir', 'ヴァーミル'),
        new Checkbox('attr-blanc', 'ブラン'),
        new Checkbox('attr-jade', 'ジェイド'),
    ];

    const textbox_filter = [
        new Textbox('filter-name', '名前'),
        new Textbox('skill-leader', '隊長スキル'),
        new Textbox('skill-attack', 'スキル効果'),
    ];

    const checkbox_column = [
        new CheckboxColumn('unit-id', 'ID', (x) => x.id()),
        new CheckboxColumn('unit-name', '名前', (x) => x.name()),
        new CheckboxColumn('unit-attr', '所属', (x) => x.attr()),
        new CheckboxColumn('unit-hp', 'HP', (x) => x.hp(), {format: parseInt}),
        new CheckboxColumn('unit-atk', '攻撃', (x) => x.atk(), {format: parseInt}),
        new CheckboxColumn('unit-atkscale', '攻撃倍率', (x) => x.atkScale(), {format: BgrLib.percentize}),
        new CheckboxColumn('unit-spd', '攻撃速度', (x) => x.spd(), {format: parseInt}),
        new CheckboxColumn('unit-atkrange', '攻撃距離', (x) => x.atkRange()),
        new CheckboxColumn('unit-critical', 'クリティカル', (x) => x.crit(), {format: BgrLib.percentize}),
        new CheckboxColumn('unit-def', '防御', (x) => x.def(), {format: parseInt}),
        new CheckboxColumn('unit-move', '移動速度', (x) => x.move(), {format: parseInt}),
        new CheckboxColumn('unit-leaderskill', '隊長スキル', (x) => x.leaderSkill()),
        new CheckboxColumn('unit-skillbuffer1', 'スキル効果1', (x) => x.attackSkillBuffer1()),
        new CheckboxColumn('unit-skillbuffer2', 'スキル効果2', (x) => x.attackSkillBuffer2()),
        new CheckboxColumn('unit-skillcd', 'スキルCD', (x) => x.attackSkillCooldown(), {checked: false}),
        new CheckboxColumn('unit-skillsp', 'スキルSP', (x) => x.attackSkillSP(), {checked: false}),
        new CheckboxColumn('unit-skilltarget', 'スキル対象', (x) => x.attackSkillTarget(), {checked: false}),
        new CheckboxColumn('unit-skillscale', 'スキル倍率', (x) => x.attackSkillScale(), {checked: false, format: BgrLib.percentize}),
    ];

    const table = new Table(unit_table);
    table.data = BgrLib.getUnit().slice();
    table.column = Array.from(checkbox_column, (x) => x.column);
    table.filters = [
        new CheckboxToFilter(attribute_checkbox, filterAttribute),
        new TextboxToFilter(textbox_filter[0], filterName),
        new TextboxToFilter(textbox_filter[1], filterLeaderSkill),
        new TextboxToFilter(textbox_filter[2], filterAttackSkill),
    ];

    setFormGroup('列', unit_content, Array.from(checkbox_column, (x) => x.checkbox));
    setFormGroup('所属', unit_attr_filter, attribute_checkbox);
    setFormGroup(null, unit_skill_filter, textbox_filter);

    const listener = table.update.bind(table);
    [
        checkbox_column.map((x) => x.checkbox),
        attribute_checkbox,
        textbox_filter,
    ].forEach(function (filters) {
        for (let i in filters) {
            const type = filters[i].input.type == 'text' ? 'input' : 'change';
            filters[i].input.addEventListener(type, listener);
        }
    });

    table.update();
});
