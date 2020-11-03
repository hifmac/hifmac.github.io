// import { BGR_DATA } from './bgr_archive.js'

/**
 * unit attribute filter
 * @param {string} value 
 * @param {string} text
 * @param {function(): boolean} filter_func
 */
function Filter(id, text, filter_func) {
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

    this.checkbox = form_check_input;
    this.label = form_check_label;
    this.form = form_check;
    this.func = filter_func;
}

/**
 * filter input element
 * @type {HTMLDivElement}
 */
Filter.prototype.form = null;

/**
 * filter input element
 * @type {HTMLInputElement}
 */
Filter.prototype.checkbox = null;

/**
 * filter input element
 * @type {HTMLLabelElement}
 */
Filter.prototype.label = null;

/**
 * filter function
 * @type {function(object, object): boolean} 
 */
Filter.prototype.func = null;

/**
 * apply filter
 * @param {object} value a value to be applied
 * @returns {boolean} whether filter is matched
 */
Filter.prototype.apply = function Filter_apply(value) {
    return this.checked() && this.func(value, this.value());
};

/**
 * @returns {string} filter value
 */
Filter.prototype.value = function Filter_value() {
    return this.label.textContent;
};

/**
 * @returns {boolean} whether filter bockbox is checked
 */
Filter.prototype.checked = function Filter_checked() {
    return this.checkbox.checked;
};

/**
 * set change event listener
 * @param {function(Event): void} value change event listener
 */
Filter.prototype.onChanged = function Filter_onChanged(value) {
    this.checkbox.addEventListener('change', value);
};

const main = (function() {
    function filterAttribute(unit, value) {
        return unit['attr'] == value;
    }    
   
    function filterRarelity(equip, value) {
        return equip['rank'] == value || (equip['skill'] && value == '神器');
    }    

    const attribute_filter = [
        new Filter('attr-sandica', 'サンディカ', filterAttribute),
        new Filter('attr-demonia', 'デモニア', filterAttribute),
        new Filter('attr-valmir', 'ヴァーミル', filterAttribute),
        new Filter('attr-blanc', 'ブラン', filterAttribute),
        new Filter('attr-jade', 'ジェイド', filterAttribute),
    ];

    const unit_content = [
        new Filter('unit-id', 'ID'),
        new Filter('unit-name', '名前'),
        new Filter('unit-hp', 'HP'),
        new Filter('unit-atk', '攻撃'),
        new Filter('unit-spd', '攻撃速度'),
        new Filter('unit-atkscale', '攻撃倍率'),
        new Filter('unit-atkrange', '攻撃距離'),
        new Filter('unit-def', '防御'),
        new Filter('unit-move', '移動速度'),
        new Filter('unit-critical', 'クリティカル'),
        new Filter('unit-leaderskill', '隊長スキル'),
        new Filter('unit-skillscale', 'スキル倍率'),
        new Filter('unit-skillsp', 'スキルSP'),
        new Filter('unit-skilltarget', 'スキル対象'),        
    ];

    const rarelity_filter = [
        new Filter('N', 'N', filterRarelity),
        new Filter('R', 'R', filterRarelity),
        new Filter('SR', 'SR', filterRarelity),
        new Filter('SSR', 'SSR', filterRarelity),
        new Filter('UR', 'UR', filterRarelity),
        new Filter('Z', '神器', filterRarelity),
    ];

    const equip_content = [
        new Filter('equip-name', '名前'),
        new Filter('equip-hp', 'ランク'),
        new Filter('equip-level', '最大レベル'),
        new Filter('equip-hp', 'HP'),
        new Filter('equip-atk', '攻撃'),
        new Filter('equip-spd', '攻撃速度'),
        new Filter('equip-def', '防御'),
        new Filter('equip-move', '移動速度'),
        new Filter('equip-critical', 'クリティカル'),
        new Filter('equip-skillbp', 'スキルBP'),
        new Filter('equip-skillscale', 'スキル倍率'),
        new Filter('equip-skilltarget', 'スキル対象'),        
    ];

    /** @type {HTMLSelectElement} */
    let data_type = null;

    /** @type {HTMLTableElement} */
    let data_table = null;

    /** @type {HTMLDivElement} */
    let data_filter = null;

    /** @type {HTMLDivElement} */
    let data_content = null;

    /**
     * 
     * @param {object} obj 
     * @param {Filter[]} filters 
     * @returns {boolean} whether filters are matched
     */
    function applyFilters(obj, filters) {
        let matched = false;
        filters.forEach(function(f) {
            matched |= f.apply(obj);
        })
        return matched;
    }

    /**
     * unit to table row
     * @param {object} data 
     */
    function unitToRow(data, contents) {
        /**
         * @type {HTMLTableRowElement}
         */
        const row = document.createElement('tr');
        for (let i in contents) {
            if (contents[i].checked()) {
                /**
                 * @type {HTMLTableDataCellElement}
                 */
                let col = document.createElement('td');
                switch (contents[i].value()) {
                case 'ID':
                    col.textContent = data['id'];
                    break;
                case '名前':
                    col.textContent = data['name'];
                    break;
                case 'HP':
                    col.textContent = parseInt(parseFloat(data['hp']) + parseFloat(data['hp_rate']) * 99);
                    break;
                case '攻撃':
                    col.textContent = parseInt(parseFloat(data['atk']) + parseFloat(data['atk_rate']) * 99);
                    break;
                case '攻撃速度':
                    col.textContent = parseInt(parseFloat(data['spd']) + parseFloat(data['spd_rate']) * 99);
                    break;
                case '攻撃倍率':
                    col.textContent = parseInt(data['nskill']['scale'] * 100) + '%';
                    break;
                case '攻撃距離':
                    col.textContent = data['nskill']['range'];
                    break;
                case '防御':
                    col.textContent = parseInt(parseFloat(data['def']) + parseFloat(data['def_rate']) * 99);
                    break;
                case '移動速度':
                    col.textContent = parseFloat(data['move']);
                    break;
                case 'クリティカル':
                    col.textContent = parseInt(parseFloat(data['crit']) * 100) + '%';
                    break;
                case '隊長スキル':
                    col.textContent = data['lskill'].map(x => x['name'] + parseInt(x['scale'] * 100) + '%').join('\n')
                    break;
                case 'スキル倍率':
                    col.textContent = parseInt(data['askill']['scale'] * 100) + '%';
                    break;
                case 'スキルSP':
                    col.textContent = data['askill']['sp'];
                    break;
                case 'スキル対象':
                    col.textContent = data['askill']['number'];
                    break;
                }
                row.appendChild(col);
            }
        }
        return row;
    }

    /**
     * 
     * @param {object} data 
     * @param {Filter[]} contents 
     */
    function equipToRow(data, contents) {
        /**
         * @type {HTMLTableRowElement}
         */
        const row = document.createElement('tr');
        for (let i in contents) {
            if (contents[i].checked()) {
                /**
                 * @type {HTMLTableDataCellElement}
                 */
                const col = document.createElement('td');
                const level = parseInt(data['base_lv_max'] || 0) + 5 * (data['over'] || 0);
                switch (contents[i].value()) {
                case '名前':
                    col.textContent = data['name'];
                    break;
                case 'ランク':
                    if (data['skill']) {
                        col.textContent = '神器';
                    }
                    else {
                        col.textContent = data['rank'];
                    }
                    break;
                case '最大レベル':
                    col.textContent = level;
                    break;
                case 'HP':
                    if (data['hp']) {
                        col.textContent = parseInt(parseFloat(data['hp']) + parseFloat(data['hp_rate'] || 0) * level);
                    }
                    break;
                case '攻撃':
                    if (data['atk']) {
                        col.textContent = parseInt(parseFloat(data['atk']) + parseFloat(data['atk_rate'] || 0) * level);
                    }
                    break;
                case '攻撃速度':
                    if (data['spd']) {
                        col.textContent = parseInt(parseFloat(data['spd']) + parseFloat(data['spd_rate'] || 0) * level);
                    }
                    break;
                case '防御':
                    if (data['def']) {
                        col.textContent = parseInt(parseFloat(data['def']) + parseFloat(data['def_rate'] || 0) * level);
                    }
                    break;
                case '移動速度':
                    if (data['move']) {
                        col.textContent = parseFloat(data['move']);
                    }
                    break;
                case 'クリティカル':
                    if (data['crit']) {
                        col.textContent = parseInt(parseFloat(data['crit']) * 100) + '%';
                    }
                    break;
                case 'スキルBP':
                        if (data['skill']) {
                            col.textContent = parseInt(data['skill']['bp']) + parseFloat(data['skill']['bp_rate'] || 0) * level;
                        }
                        break;
                case 'スキル倍率':
                    if (data['skill']) {
                        col.textContent = parseInt(data['skill']['scale'] * 100) + '%';
                    }
                    break;
                case 'スキル対象':
                    if (data['skill']) {
                        col.textContent = data['skill']['number'];
                    }
                    break;
                }
                row.appendChild(col);
            }
        }
        return row;
    }

    /**
     * make table header
     * @param {Filter[]} contents 
     */
    function makeHeader(contents) {
        const header = document.createElement('thead')
        header.setAttribute('class', 'table-dark')
        const row = document.createElement('tr')
        for (let i in contents) {
            if (contents[i].checked()) {
                const th = document.createElement('th');
                th.textContent = contents[i].value();
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
        while (elem.firstChild) {
            elem.removeChild(elem.firstChild);
        }
    }

    function updateFormGroup(labelname, formgroup, filters) {
        clearChildren(formgroup);

        const label = document.createElement('label');
        label.textContent = labelname;
        formgroup.appendChild(label);

        for (let i in filters) {
            formgroup.appendChild(filters[i].form);
        }
    }

    function onDataTypeChanged(value) {
        clearChildren(data_table);

         if (value == 'unit') {
            updateFormGroup('フィルタ：', data_filter, attribute_filter);
            updateFormGroup('コンテンツ：', data_content, unit_content);

            data_table.appendChild(makeHeader(unit_content));
            for (let i in BGR_DATA['unit']) { 
                if (applyFilters(BGR_DATA['unit'][i], attribute_filter)) {
                    data_table.appendChild(unitToRow(BGR_DATA['unit'][i], unit_content));
                }
            }
        }
        else if (value == 'equip') {
            updateFormGroup('フィルタ：', data_filter, rarelity_filter);
            updateFormGroup('コンテンツ：', data_content, equip_content);

            data_table.appendChild(makeHeader(equip_content));
            for (let i in BGR_DATA['equip']) { 
                if (applyFilters(BGR_DATA['equip'][i], rarelity_filter)) {
                    data_table.appendChild(equipToRow(BGR_DATA['equip'][i], equip_content));
                }
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
            data_content = document.getElementById("data-content");

            data_type.addEventListener('change', change_event_listener);
            [ attribute_filter, unit_content, rarelity_filter, equip_content ].forEach(function(filter) {
                filter.forEach(function(f) {
                    f.onChanged(change_event_listener);
                });    
            });

            change_event_listener();
        }
    }
}());

onload = main.onLoad.bind(main);
