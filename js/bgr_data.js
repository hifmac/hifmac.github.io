// import { BGR_DATA } from './bgr_archive.js'

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

    this.input = form_check_input;
    this.label = form_check_label;
    this.checkbox = form_check;
}

/**
 * filter input element
 * @type {HTMLDivElement}
 */
Checkbox.prototype.checkbox = null;

/**
 * filter input element
 * @type {HTMLInputElement}
 */
Checkbox.prototype.input = null;

/**
 * filter input element
 * @type {HTMLLabelElement}
 */
Checkbox.prototype.label = null;

/**
 * @returns {string} filter value
 */
Checkbox.prototype.value = function Form_value() {
    return this.label.textContent;
};

/**
 * @returns {boolean} whether filter bockbox is checked
 */
Checkbox.prototype.checked = function Form_checked() {
    return this.input.checked;
};

/**
 * set change event listener
 * @param {function(Event): void} value change event listener
 */
Checkbox.prototype.onChanged = function Form_onChanged(value) {
    this.input.addEventListener('change', value);
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
    form_text_label.textContent = text;

    let form_text = document.createElement('div');
    form_text.setAttribute('class', 'form-group')
    form_text.appendChild(form_text_label);
    form_text.appendChild(form_text_input);

    this.input = form_text_input;
    this.label = form_text_label;
    this.textbox = form_text;
}

/**
 * filter input element
 * @type {HTMLDivElement}
 */
Textbox.prototype.textbox = null;

/**
 * filter input element
 * @type {HTMLInputElement}
 */
Textbox.prototype.input = null;

/**
 * filter input element
 * @type {HTMLLabelElement}
 */
Textbox.prototype.label = null;

/**
 * @returns {string} filter value
 */
Textbox.prototype.value = function Textbox_value() {
    return this.input.value;
};

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
    this.input.addEventListener('change', value);
};

/**
 * content filter
 * @param {string} id 
 * @param {string} text
 */
function CheckboxFilter(id, text) {
    this.checkbox = new Checkbox(id, text);
}

CheckboxFilter.prototype.checkbox = null;

/**
 * get form
 * @param {HTMLFormElement} obj column object to read
 */
CheckboxFilter.prototype.form = function CheckboxFilter_form(obj) {
    return this.checkbox.checkbox;
}

/**
 * content filter
 * @param {string} id 
 * @param {string} text
 */
function TextFilter(id, text) {
    this.textbox = new Textbox(id, text);
}

TextFilter.prototype.textbox = null;

/**
 * get form
 * @param {HTMLFormElement} obj column object to read
 */
TextFilter.prototype.form = function TextFilter_form(obj) {
    return this.textbox.textbox;
}

/**
 * content column selecter
 * @param {string} id
 * @param {string} text
 */
function Column(id, text, read, formatter) {
    this.checkbox = new Checkbox(id, text);
    this.read = read;
    this.formatter = formatter;
}

/**
 * @type {Form}
 */
Column.prototype.checkbox = null;

/**
 * @type {function(obj): ant}
 */
Column.prototype.read = null;

/**
 * @type {function(number) : string}
 */
Column.prototype.formatter = null;

/**
 * get form
 * @param {HTMLFormElement} obj column object to read
 */
Column.prototype.form = function Column_form(obj) {
    return this.checkbox.checkbox;
}

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

    const UNIT_LEVEL = 100;

    const attribute_filter = [
        new CheckboxFilter('attr-sandica', 'サンディカ'),
        new CheckboxFilter('attr-demonia', 'デモニア'),
        new CheckboxFilter('attr-valmir', 'ヴァーミル'),
        new CheckboxFilter('attr-blanc', 'ブラン'),
        new CheckboxFilter('attr-jade', 'ジェイド'),
    ];

    const unit_skill_filter = [
        new TextFilter('skill-attack', 'スキル効果：'),
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
        new CheckboxFilter('N', 'N'),
        new CheckboxFilter('R', 'R'),
        new CheckboxFilter('SR', 'SR'),
        new CheckboxFilter('SSR', 'SSR'),
        new CheckboxFilter('UR', 'UR'),
        new CheckboxFilter('Z', '神器'),
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

    function filterAttackSkill(unit, value) {
        if (value.length) {
            if (unit['askill']) {
                for (let i in unit['askill']['buffer1']) {
                    if (0 <= unit['askill']['buffer1'][i]['name'].indexOf(value)) {
                        console.log(unit['name'], value);
                        return true;
                    }
                }

                for (let i in unit['askill']['buffer2']) {
                    if (0 <= unit['askill']['buffer2'][i]['name'].indexOf(value)) {
                        return true;
                    }
                }
            }
            console.log(unit['name'], value);
            return false;
        }
        return true;
    }

    function filterLeaderSkill(unit, value) {
        if (value.length) {
            for (let i in unit['lskill']) {
                if (0 < unit['lskill'][i]['name'].indexOf(value)) {
                    return true;
                }
            }
        }
        return false
    }

    function filterAttribute(unit, value) {
        return unit['attr'] == value;
    }

    function filterRarelity(equip, value) {
        return (!equip['skill'] && equip['rank'] == value) || (equip['skill'] && value == '神器');
    }

    /**
     * 
     * @param {object} obj 
     * @param {Filter[]} filters 
     * @returns {boolean} whether filters are matched
     */
    function applyFilters(obj, func, filters) {
        let matched = false;
        filters.forEach(function(f) {
            matched = matched || (f.checkbox || f.textbox).checked() && func(obj, (f.checkbox || f.textbox).value());
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
            if (contents[i].checkbox.checked()) {
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
            if (contents[i].checkbox.checked()) {
                const th = document.createElement('th');

                th.textContent = contents[i].checkbox.value();
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
     * @param {string} labelname form group label
     * @param {HTMLDivElement} formgroup the form group to contain
     * @param {any[]} form_holder filterd to be contained the group
     */
    function updateFormGroup(labelname, formgroup, form_holder) {
        clearChildren(formgroup);

        const label = document.createElement('label');
        label.textContent = labelname;
        formgroup.appendChild(label);

        for (let i in form_holder) {
            formgroup.appendChild(form_holder[i].form());
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

    function onDataTypeChanged(value) {
        let filter;
        let content;
        let filter_func;

        if (value == 'unit') {
            filter_name = '所属：'
            filter = attribute_filter;
            content = unit_content;
            filter_func = filterAttribute;
        }
        else if (value == 'equip') {
            filter_name = 'ランク：'
            filter = rarelity_filter;
            content = equip_content;
            filter_func = filterRarelity;
        }

        clearChildren(data_table);
        const data = BGR_DATA[value];
        updateFormGroup(filter_name, data_filter, filter);
        updateFormGroup('スキル：', skill_filter, unit_skill_filter);
        updateFormGroup('コンテンツ：', data_content, content);

        if (current_sort[value] && current_sort[value].column) {
            data.sort((a, b) =>
                (current_sort[value].descending ? sortAsc : sortDesc)(current_sort[value].column.read(a), current_sort[value].column.read(b)));
        }

        data_table.appendChild(makeHeader(value, content));
        for (let i in data) { 
            if (applyFilters(data[i], filter_func, filter) && applyFilters(data[i], filterAttackSkill, unit_skill_filter)) {
                data_table.appendChild(dataToRow(data[i], content));
            }
        }
    }

    return {
        onLoad() {
            const change_event_listener = function() {
                onDataTypeChanged(data_type.value);
            };

            data_type = document.getElementById("data-type");
            data_table = document.getElementById("data-table");                 
            data_filter = document.getElementById("data-filter");
            skill_filter = document.getElementById("skill-filter");
            data_content = document.getElementById("data-content");

            data_type.addEventListener('change', change_event_listener);
            [ attribute_filter, unit_skill_filter, unit_content, rarelity_filter, equip_content ].forEach(function(filter) {
                filter.forEach(function(f) {
                    console.log(f);
                    (f.checkbox || f.textbox).onChanged(change_event_listener);
                });    
            });

            change_event_listener();
        }
    }
}());

onload = main.onLoad.bind(main);
