/**
 * 
 * @param {HTMLLabelElement} label 
 * @param {HTMLInputElement} input 
 * @param {HTMLDivElement} form 
 */
function Form(label, input, form) {
    this.input = input;
    this.label = label;
    this.form = form;
}

/**
 * filter input element
 * @type {HTMLDivElement}
 */
Form.prototype.form = null;

/**
 * filter input element
 * @type {HTMLInputElement}
 */
Form.prototype.input = null;

/**
 * filter input element
 * @type {HTMLLabelElement}
 */
Form.prototype.label = null;

/**
 * @returns {string} filter value
 */
Form.prototype.value = function Form_value() {
    return this.input.value;
};

/**
 * @returns {boolean} filter value
 */
Form.prototype.checked = function Form_checked() {
    return this.input.checked;
};

/**
 * set parent node for this
 * @param {HTMLElement} parent parent node to add child
 */
Form.prototype.setParent = function Form_setParent(parent) {
    parent.appendChild(this.form);
};

/**
 * set change event listener
 * @param {function(Event): void} value change event listener
 */
Form.prototype.onChanged = function Form_onChanged(value) {
    this.input.addEventListener('change', value);
};

/**
 * inline form
 * @param {string} id 
 * @param {string} text
 * @param {boolean} checked
 */
function Checkbox(id, text, checked) {
    let form_check_input = document.createElement('input');
    form_check_input.id = id;
    form_check_input.setAttribute('type', 'checkbox');
    form_check_input.setAttribute('class', 'form-check-input');
    form_check_input.checked = typeof checked === 'undefined' ? true : checked;

    let form_check_label =document.createElement('label');
    form_check_label.setAttribute('class', 'form-check-label mr-2');
    form_check_label.setAttribute('for', id);
    form_check_label.textContent = text;

    let form_check = document.createElement('div');
    form_check.setAttribute('class', 'form-check form-check-inline')
    form_check.appendChild(form_check_input);
    form_check.appendChild(form_check_label);

    Form.call(this, form_check_label, form_check_input, form_check);
}

BgrLib.inherits(Form, Checkbox);

/**
 * @returns {string} filter value
 */
Checkbox.prototype.value = function Checkbox_value() {
    return this.label.textContent;
};

/**
 * checkbox associated with a column
 * @param {string} id 
 * @param {string} text 
 * @param {boolean} checked 
 * @param {function((BgrUnit | BgrEquip)): (number | string)} read 
 * @param {function((number | string)) : string} format 
 */
function CheckboxColumn(id, text, read, kwargs) {
    this.checkbox = new Checkbox(id, text, kwargs ? kwargs.checked : undefined);
    this.column = new TableColumn(
        text,
        this.checkbox.checked.bind(this.checkbox),
        read,
        kwargs);
}


/**
 * checkbox list to filter function
 * @param {Checkbox[]} checkboxes 
 * @param {function((number | string), (BgrUnit | BgrEquip)): boolean} filterFunction
 * @returns {function((BgrUnit | BgrEquip)) : boolean}
 */
function CheckboxToFilter(checkboxes, filterFunction) {
    return function(data) {
        for (let i in checkboxes) {
            if (checkboxes[i].checked() && filterFunction(data, checkboxes[i].value())) {
                return true;
            }
        }
        return false;
    };
};

/**
 * inline form
 * @param {string} id 
 * @param {string} text
 */
function Textbox(id, text) {
    let form_text_input = document.createElement('input');
    form_text_input.id = id;
    form_text_input.setAttribute('type', 'text');
    form_text_input.setAttribute('class', 'form-control mr-2');
    form_text_input.setAttribute('placeholder', text);
    form_text_input.checked = true;

    let form_text_label =document.createElement('label');
    form_text_label.setAttribute('for', id);
    form_text_label.textContent = text + "：";

    let form_text = document.createElement('div');
    form_text.setAttribute('class', 'form-group')
    form_text.appendChild(form_text_label);
    form_text.appendChild(form_text_input);

    Form.call(this, form_text_label, form_text_input, form_text);
}

BgrLib.inherits(Form, Textbox);

/**
 * @returns {boolean} filter value
 */
Textbox.prototype.checked = function Textbox_checked() {
    return true;
};

/**
 * set change event listener
 * @param {function(Event): void} value change event listener
 */
Textbox.prototype.onChanged = function Textbox_onChanged(value) {
    this.input.addEventListener('input', value);
};

/**
 * 
 * @param {Textbox} textbox
 * @param {function((number | string), (BgrUnit | BgrEquip)): boolean} filterFunction
 * @returns {function((BgrUnit | BgrEquip)) : boolean}
 */
function TextboxToFilter(textbox, filterFunction) {
    return function (data) { 
        return filterFunction(data, textbox.value());
    };
};

/**
 * set form group
 * @param {(Checkbox[] | Textbox[])} forms 
 */
function setFormGroup(label, group, forms) {
    BgrLib.clearChildren(group);
    if (label) {
        group.appendChild(BgrLib.createElement('label', label + '：'))
    }
    for (let i in forms) {
        group.appendChild(forms[i].form);
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
        new Textbox('skill-equip', 'スキル効果'),
    ];

    const table = new Table(equip_table);
    table.data = BgrLib.getEquip().slice();
    table.column = column_checkbox.map((x) => x.column);
    table.filters = [
        CheckboxToFilter(rank_checkbox, filterEquipRank),
        TextboxToFilter(skill_textbox[0], filterEquipSkill),
    ];

    setFormGroup('列', equip_content, column_checkbox.map((x) => x.checkbox));
    setFormGroup('ランク', equip_rank_filter, rank_checkbox);
    setFormGroup(null, equip_skill_filter, skill_textbox);

    const listener = table.update.bind(table);
    [
        column_checkbox.map((x) => x.checkbox),
        rank_checkbox,
        skill_textbox,
    ].forEach(function (filters) {
        for (let i in filters) {
            filters[i].onChanged(listener);
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
        return !value.length || unit.name().indexOf(value) != -1;
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
    table.column = checkbox_column.map((x) => x.column);
    table.filters = [
        new CheckboxToFilter(attribute_checkbox, filterAttribute),
        new TextboxToFilter(textbox_filter[0], filterName),
        new TextboxToFilter(textbox_filter[1], filterLeaderSkill),
        new TextboxToFilter(textbox_filter[2], filterAttackSkill),
    ];

    setFormGroup('列', unit_content, checkbox_column.map((x) => x.checkbox));
    setFormGroup('所属', unit_attr_filter, attribute_checkbox);
    setFormGroup(null, unit_skill_filter, textbox_filter);

    const listener = table.update.bind(table);
    [
        checkbox_column.map((x) => x.checkbox),
        attribute_checkbox,
        textbox_filter,
    ].forEach(function (filters) {
        for (let i in filters) {
            filters[i].onChanged(listener);
        }
    });

    table.update();
});
