// import { BGR_DATA } from './bgr_archive.js'

/**
 * inherits a parent to a child
 * @param {function} parent object to be inherited
 * @param {function} child object to inherit
 */
function inherits(parent, child) {
    child.prototype = Object.create(parent.prototype);
}

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
 */
function Checkbox(id, text) {
    let form_check_input = document.createElement('input');
    form_check_input.id = id;
    form_check_input.setAttribute('type', 'checkbox');
    form_check_input.setAttribute('class', 'form-check-input');
    form_check_input.checked = true;

    let form_check_label =document.createElement('label');
    form_check_label.setAttribute('class', 'form-check-label');
    form_check_label.setAttribute('for', id);
    form_check_label.textContent = text;

    let form_check = document.createElement('div');
    form_check.setAttribute('class', 'form-check form-check-inline')
    form_check.appendChild(form_check_input);
    form_check.appendChild(form_check_label);

    Form.call(this, form_check_label, form_check_input, form_check);
}

inherits(Form, Checkbox);

/**
 * @returns {string} filter value
 */
Checkbox.prototype.value = function Form_value() {
    return this.label.textContent;
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
    form_text_input.setAttribute('class', 'form-control');
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

inherits(Form, Textbox);

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
 * content filter
 * @param {Form} form form object
 * @param {function(object, object): bool} func filter function
 */
function Filter(form, func) {
    this.form = form;
    this.func = func;
}

/**
 * @type {Form}
 */
Filter.prototype.form = null;

/**
 * 
 * @type {function(object, object): bool}
 */
Filter.prototype.func = null;

/**
 * apply filter to an object
 * @param {object} obj the object to be applied
 */
Filter.prototype.apply = function Filter_apply(obj) {
    return this.func(obj, this.form.value());
}

/**
 * content column selecter
 * @param {string} id
 * @param {string} text
 */
function Column(id, text, read, formatter) {
    this.form = new Checkbox(id, text);
    this.read = read;
    this.formatter = formatter;
}

/**
 * @type {Filter}
 */
Column.prototype.form = null;

/**
 * @type {function(obj): any}
 */
Column.prototype.read = null;

/**
 * @type {function(number) : string}
 */
Column.prototype.formatter = null;

/**
 * get column string
 * @param {object} obj column object to read
 */
Column.prototype.string = function Column_string(obj) {
    const value = this.read(obj);
    if (value && this.formatter) {
        return this.formatter(value);
    }
    return value;
}

const main = (function() {
    function getEquipLevel(obj) {
        return parseInt(obj['base_lv_max'] || 0) + 5 * parseInt(obj['over'] || 0);
    }

    function calculateParam(obj, param, param_rate, level) {
        if (obj[param] || obj[param_rate]) {
            return parseFloat(obj[param] || 0) + parseFloat(obj[param_rate] || 0) * level;
        }
        else {
            return null;
        }
    }

    function toInt(value) {
        if (value) {
            return parseInt(value);
        }
        return null;
    }

    function toFloat(value) {
        if (value) {
            return parseFloat(value);
        }
        return null;
    }

    function percentize(value) {
        return value ? parseInt(value * 100) + '%' : null;
    }

    function formatSkillBuff(buffers, prob) {
        const ret = [];
        for (let i in buffers) {
            const buffer = buffers[i];
            const buff = [ buffer['name'] ]
            if (buffer['scale']) {
                buff.push(percentize(Math.abs(toFloat(buffer['scale']))));
            }
            if (buffer['value'] && 0 < Math.abs(toInt(buffer['value'])) && buffer['name'].indexOf('勢力転換') == -1) {
                buff.push(Math.abs(toInt(buffer['value'])));
            }
            if (buffer['duration']) {
                buff.push(toInt(buffer['duration']) + '秒');
            }
            buff.push(percentize(prob));
            ret.push(buff.join(' '))
        }
        return ret.join('    ');
    }

    function filterSkill(skill, value) {
        for (let i in skill) {
            if (0 <= skill[i]['name'].indexOf(value)) {
                return true;
            }
        }
        return false;
    }

    function filterAttackSkill(unit, value) {
        if (value.length) {
            if (unit['askill']) {
                return filterSkill(unit['askill']['buffer1'], value) 
                    || filterSkill(unit['askill']['buffer2'], value);
            }
            return false;
        }
        return true;
    }

    function filterLeaderSkill(unit, value) {
        if (value.length) {
            return filterSkill(unit['lskill'], value);
        }
        return true;
    }

    function filterEquipSkill(equip, value) {
        if (value.length) {
            return equip['skill']
                && (filterSkill(equip['skill']['buffer1'], value) || filterSkill(equip['skill']['buffer2'], value))
        }
        return true;       
    }

    function filterAttribute(unit, value) {
        return unit['attr'] == value;
    }

    function filterRarelity(equip, value) {
        return (!equip['skill'] && equip['rank'] == value) || (equip['skill'] && value == '神器');
    }

    const UNIT_LEVEL = 100;

    const attribute_filter = [
        new Filter(new Checkbox('attr-sandica', 'サンディカ'), filterAttribute),
        new Filter(new Checkbox('attr-demonia', 'デモニア'), filterAttribute),
        new Filter(new Checkbox('attr-valmir', 'ヴァーミル'), filterAttribute),
        new Filter(new Checkbox('attr-blanc', 'ブラン'), filterAttribute),
        new Filter(new Checkbox('attr-jade', 'ジェイド'), filterAttribute),
    ];

    const unit_skill_filter = [
        new Filter(new Textbox('skill-leader', '隊長スキル'), filterLeaderSkill),
        new Filter(new Textbox('skill-attack', 'スキル効果'), filterAttackSkill),
    ];

    const unit_content = [
        new Column('unit-id', 'ID', (x) => parseInt(x['id'])),
        new Column('unit-name', '名前', (x) => x['name']),
        new Column('unit-attr', '所属', (x) => x['attr']),
        new Column('unit-hp', 'HP', (x) => calculateParam(x, 'hp', 'hp_rate', UNIT_LEVEL - 1), toInt),
        new Column('unit-atk', '攻撃', (x) => calculateParam(x, 'atk', 'atk_rate', UNIT_LEVEL - 1), toInt),
        new Column('unit-atkscale', '攻撃倍率', (x) => toFloat(x['nskill']['scale']), percentize),
        new Column('unit-spd', '攻撃速度', (x) => calculateParam(x, 'spd', 'spd_rate', UNIT_LEVEL - 1), toInt),
        new Column('unit-atkrange', '攻撃距離', (x) => toInt(x['nskill']['range'])),
        new Column('unit-def', '防御', (x) => calculateParam(x, 'def', 'def_rate', UNIT_LEVEL - 1), toInt),
        new Column('unit-move', '移動速度', (x) => toInt(x['move'])),
        new Column('unit-critical', 'クリティカル', (x) => toFloat(x['crit']), percentize),
        new Column('unit-leaderskill', '隊長スキル', (x) => x['lskill'].map((x) => x['name'] + percentize(toFloat(x['scale']))).join('\n')),
        new Column('unit-skillscale', 'スキル倍率', (x) => x['askill'] ? toFloat(x['askill']['scale']) : null, percentize),
        new Column('unit-skillsp', 'スキルSP', (x) => x['askill'] ? toInt(x['askill']['sp']) : null),
        new Column('unit-skilltarget', 'スキル対象', (x) => x['askill'] ? toInt(x['askill']['number']) : null),
        new Column('unit-skillbuffer1', 'スキル効果1', (x) => x['askill'] ? formatSkillBuff(x['askill']['buffer1'], x['askill']['buffer1_prob']) : null),
        new Column('unit-skillbuffer2', 'スキル効果2', (x) => x['askill'] ? formatSkillBuff(x['askill']['buffer2'], x['askill']['buffer2_prob']) : null),
    ];

    const rarelity_filter = [
        new Filter(new Checkbox('N', 'N'), filterRarelity),
        new Filter(new Checkbox('R', 'R'), filterRarelity),
        new Filter(new Checkbox('SR', 'SR'), filterRarelity),
        new Filter(new Checkbox('SSR', 'SSR'), filterRarelity),
        new Filter(new Checkbox('UR', 'UR'), filterRarelity),
        new Filter(new Checkbox('Z', '神器'), filterRarelity),
    ];

    const equip_skill_filter = [
        new Filter(new Textbox('skill-equip', 'スキル効果'), filterEquipSkill),
    ];

    const equip_content = [
        new Column('equip-name', '名前', (x) => x['name']),
        new Column('equip-hp', 'ランク', (x) => x['skill'] ? '神器' : x['rank']),
        new Column('equip-level', '最大レベル', getEquipLevel),
        new Column('equip-hp', 'HP', (x) => calculateParam(x, 'hp', 'hp_rate', getEquipLevel(x)), toInt),
        new Column('equip-atk', '攻撃', (x) => calculateParam(x, 'atk', 'atk_rate', getEquipLevel(x)), toInt),
        new Column('equip-spd', '攻撃速度', (x) => calculateParam(x, 'spd', 'spd_rate', getEquipLevel(x)), toInt),
        new Column('equip-def', '防御', (x) => calculateParam(x, 'def', 'def_rate', getEquipLevel(x)), toInt),
        new Column('equip-move', '移動速度', (x) => toInt(x['move'])),
        new Column('equip-critical', 'クリティカル', (x) => toFloat(x['crit']), percentize),
        new Column('equip-skillscale', 'スキル倍率', (x) => x['skill'] ? calculateParam(x['skill'], 'scale', 'scale_rate', getEquipLevel(x)) : null, percentize),
        new Column('equip-skillbp', 'スキルBP', (x) => x['skill'] ? calculateParam(x['skill'], 'bp', 'bp_rate', getEquipLevel(x)) : null),
        new Column('equip-skilltarget', 'スキル対象', (x) => x['skill'] ? toInt(x['skill']['number']) : null),
        new Column('equip-skillbuffer', 'スキル効果', (x) => x['skill'] ? formatSkillBuff(x['skill']['buffer1'], x['skill']['buffer1_prob']) : null),
    ];

    /** @type {HTMLSelectElement} */
    let data_type = null;

    /** @type {HTMLTableElement} */
    let data_table = null;

    /** @type {HTMLDivElement} */
    let data_filter = null;

    /** @type {HTMLDivElement} */
    let data_content = null;

    /** @type {HTMLDivElement} */
    let skill_filter = null;

    /** 
     * current sort column
     * @type {object}
     */
    let current_sort = {};

    /**
     * 
     * @param {object} obj 
     * @param {Filter[]} filters 
     * @returns {boolean} whether filters are matched
     */
    function applyFilters(obj, filters) {
        let matched = false;
        filters.forEach(function(f) {
            matched = matched || f.apply(obj);
        })
        return matched;
    }

    /**
     * equip to row
     * @param {object} data 
     * @param {Column[]} contents 
     */
    function dataToRow(data, contents) {
        const row = document.createElement('tr');
        for (let i in contents) {
            if (contents[i].form.checked()) {
                const col = document.createElement('td');
                col.textContent = contents[i].string(data)
                row.appendChild(col);
            }
        }
        return row;
    }

    /**
     * make table header
     * @param {string} value current data type
     * @param {Column[]} contents 
     */
    function makeHeader(value, contents) {
        const header = document.createElement('thead')
        header.setAttribute('class', 'table-dark')
        const row = document.createElement('tr')
        for (let i in contents) {
            if (contents[i].form.checked()) {
                const th = document.createElement('th');

                th.textContent = contents[i].form.value();
                if (current_sort[value] && current_sort[value].column == contents[i]) {
                    th.textContent += current_sort[value].descending ? '▽' : '△';
                }

                th.addEventListener('click', function() {
                    const sort = current_sort[value];
                    if (sort && sort.column == contents[i]) {
                        sort.descending = !sort.descending
                    }
                    else {
                        current_sort[value] = {
                            column: contents[i],
                            descending: true,
                        }
                    }
                    onDataTypeChanged(value);
                });

                row.appendChild(th);
            }
        }
        header.appendChild(row);
        return header;
    }

    /**
     * clear children of an element
     * @param {HTMLElement} elem element to remove children
     */
    function clearChildren(elem) {
        while (elem.lastChild) {
            elem.removeChild(elem.lastChild);
        }
    }

    /**
     * update form a group with a label
     * @param {HTMLDivElement} formgroup the form group to contain
     * @param {any[]} form_holder filtered to be contained the group
     * @param {string} labelname form group label
     */
    function updateFormGroup(formgroup, form_holder, labelname) {
        clearChildren(formgroup);

        if (labelname) {
            const label = document.createElement('label');
            label.textContent = labelname;
            formgroup.appendChild(label);
        }

        for (let i in form_holder) {
            form_holder[i].form.setParent(formgroup);
        }
    }

    function sortAsc(a, b) {
        if (a < b) {
            return 1;
        }
        else if (b < a) {
            return -1;
        }
        else {
            return 0;
        }
    }

    function sortDesc(a, b) {
        if (a < b) {
            return -1;
        }
        else if (b < a) {
            return 1;
        }
        else {
            return 0;
        }
    }

    function onDataTypeChanged(e) {
        const value = data_type.value;

        let filter_name;
        let filter;
        let skill_filters;
        let content;

        if (value == 'unit') {
            filter_name = '所属：'
            filter = attribute_filter;
            skill_filters = unit_skill_filter;
            content = unit_content;
        }
        else if (value == 'equip') {
            filter_name = 'ランク：'
            filter = rarelity_filter;
            skill_filters = equip_skill_filter;
            content = equip_content;
        }

        if (e && e.target == data_type) {
            updateFormGroup(data_filter, filter, filter_name);
            updateFormGroup(skill_filter, skill_filters);
            updateFormGroup(data_content, content, 'コンテンツ：');
        }

        const data = BGR_DATA[value];
        if (current_sort[value] && current_sort[value].column) {
            data.sort((a, b) =>
                (current_sort[value].descending ? sortAsc : sortDesc)(current_sort[value].column.read(a), current_sort[value].column.read(b)));
        }

        clearChildren(data_table);
        data_table.appendChild(makeHeader(value, content));
        for (let i in data) {
            let matched = applyFilters(data[i], filter);
            skill_filters.forEach(function(f) {
                matched = matched && applyFilters(data[i], [ f ]);
            });
            if (matched) {
                data_table.appendChild(dataToRow(data[i], content));
            }
        }
    }

    return {
        onLoad() {
            data_type = document.getElementById("data-type");
            data_table = document.getElementById("data-table");                 
            data_filter = document.getElementById("data-filter");
            skill_filter = document.getElementById("skill-filter");
            data_content = document.getElementById("data-content");

            data_type.addEventListener('change', onDataTypeChanged);

            [
                attribute_filter,
                unit_skill_filter,
                unit_content,
                rarelity_filter,
                equip_skill_filter,
                equip_content
            ].forEach(function(filter) {
                filter.forEach(function(f) {
                    f.form.onChanged(onDataTypeChanged);
                });    
            });

            data_type.dispatchEvent(new Event('change'));
        }
    }
}());

onload = main.onLoad.bind(main);
