// import { BGR_DATA } from './bgr_archive.js'

/**
 * unit attribute filter
 * @param {string} value 
 * @param {string} text
 */
function Filter(id, text) {
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
    const UNIT_LEVEL = 100;

    const attribute_filter = [
        new Filter('attr-sandica', 'サンディカ'),
        new Filter('attr-demonia', 'デモニア'),
        new Filter('attr-valmir', 'ヴァーミル'),
        new Filter('attr-blanc', 'ブラン'),
        new Filter('attr-jade', 'ジェイド'),
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
        new Filter('N', 'N'),
        new Filter('R', 'R'),
        new Filter('SR', 'SR'),
        new Filter('SSR', 'SSR'),
        new Filter('UR', 'UR'),
        new Filter('Z', '神器'),
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

    /** @type {object} current sort column */
    let current_sort = {
        column: null,
        descending: true,
    };

    function filterAttribute(unit, value) {
        return unit['attr'] == value;
    }    
   
    function filterRarelity(equip, value) {
        return (!equip['skill'] && equip['rank'] == value) || (equip['skill'] && value == '神器');
    }

    function getEquipLevel(obj) {
        return parseInt(obj['base_lv_max'] || 0) + 5 * parseInt(obj['over'] || 0);
    }

    function calculateParam(obj, param, param_rate, level) {
        return parseFloat(obj[param] || 0) + parseFloat(obj[param_rate] || 0) * level;
    }

    function compareAsc(a, b, param) {
        if (a[param] > b[param]) {
            return -1;
        }
        else if (a[param] < b[param]) {
            return 1;
        }
        else {
            return 0;
        }
    }

    function compareDesc(a, b, param) {
        if (a[param] < b[param]) {
            return -1;
        }
        else if (a[param] > b[param]) {
            return 1;
        }
        else {
            return 0;
        }
    }

    function compareNumberAsc(a, b, param) {
        if (a && !b) {
            return 1;
        }
        else if (!a) {
            return -1;
        }
        else {
            return parseFloat(a[param] || 0) - parseFloat(b[param] || 0);
        }
    }

    function compareNumberDesc(a, b, param) {
        if (a && !b) {
            return -1;
        }
        else if (!a) {
            return 1;
        }
        else {
            return parseFloat(b[param] || 0) - parseFloat(a[param] || 0);
        }
    }

    function compareParamAsc(a, b, param, param_rate, level_a, level_b) {
        if (a && !b) {
            return 1;
        }
        else if (!a) {
            return -1;
        }
        else {
            level_b = level_b || level_a;
            return calculateParam(a, param, param_rate, level_a) - calculateParam(b, param, param_rate, level_b);
        }
    }

    function compareParamDesc(a, b, param, param_rate, level_a, level_b) {
        if (a && !b) {
            return -1;
        }
        else if (!a) {
            return 1;
        }
        else {
            level_b = level_b || level_a;
            return calculateParam(b, param, param_rate, level_b) - calculateParam(a, param, param_rate, level_a);
        }
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
            matched = matched || (f.checked() && func(obj, f.value()));
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
                    col.textContent = parseInt(parseFloat(data['hp']) + parseFloat(data['hp_rate']) * (UNIT_LEVEL - 1));
                    break;
                case '攻撃':
                    col.textContent = parseInt(parseFloat(data['atk']) + parseFloat(data['atk_rate']) * (UNIT_LEVEL - 1));
                    break;
                case '攻撃速度':
                    col.textContent = parseInt(parseFloat(data['spd']) + parseFloat(data['spd_rate']) * (UNIT_LEVEL - 1));
                    break;
                case '攻撃倍率':
                    col.textContent = parseInt(data['nskill']['scale'] * 100) + '%';
                    break;
                case '攻撃距離':
                    col.textContent = data['nskill']['range'];
                    break;
                case '防御':
                    col.textContent = parseInt(parseFloat(data['def']) + parseFloat(data['def_rate']) * (UNIT_LEVEL - 1));
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
     * generate unit sort function
     * @param {string} sort_key sort key
     * @param {boolean} descending sort direction 
     * @returns {function(object, object): number} sort fuction
     */
    function unitSorter(sort_key, descending) {
        switch (sort_key) {
        case 'ID':
            return descending ?
                (a, b) => compareNumberDesc(a, b, 'id'):
                (a, b) => compareNumberAsc(a, b, 'id');
        case '名前':
            return descending ?
                (a, b) => compareDesc(a, b, 'name'):
                (a, b) => compareAsc(a, b, 'name');
        case 'HP':
            return descending ?
                (a, b) => compareParamDesc(a, b, 'hp', 'hp_rate', (UNIT_LEVEL - 1)):
                (a, b) => compareParamAsc(a, b, 'hp', 'hp_rate', (UNIT_LEVEL - 1));
        case '攻撃':
            return descending ?
                (a, b) => compareParamDesc(a, b, 'atk', 'atk_rate', (UNIT_LEVEL - 1)):
                (a, b) => compareParamAsc(a, b, 'atk', 'atk_rate', (UNIT_LEVEL - 1));
        case '攻撃速度':
            return descending ?
                (a, b) => compareParamDesc(a, b, 'spd', 'spd_rate', (UNIT_LEVEL - 1)):
                (a, b) => compareParamAsc(a, b, 'spd', 'spd_rate', (UNIT_LEVEL - 1));
        case '攻撃倍率':
            return descending ?
                (a, b) => compareNumberDesc(a['nskill'], b['nskill'], 'scale'):
                (a, b) => compareNumberAsc(a['nskill'], b['nskill'], 'scale');
        case '攻撃距離':
            return descending ?
                (a, b) => compareNumberDesc(a['nskill'], b['nskill'], 'range'):
                (a, b) => compareNumberAsc(a['nskill'], b['nskill'], 'range');
        case '防御':
            return descending ?
                (a, b) => compareParamDesc(a, b, 'def', 'def_rate', (UNIT_LEVEL - 1)):
                (a, b) => compareParamAsc(a, b, 'def', 'def_rate', (UNIT_LEVEL - 1));
        case '移動速度':
            return descending ?
                (a, b) => compareNumberDesc(a, b, 'move'):
                (a, b) => compareNumberAsc(a, b, 'move');
        case 'クリティカル':
            return descending ?
                (a, b) => compareNumberDesc(a, b, 'crit'):
                (a, b) => compareNumberAsc(a, b, 'crit');
        case '隊長スキル':
            return null;
        case 'スキル倍率':
            return descending ?
                (a, b) => compareNumberDesc(a['askill'], b['askill'], 'scale'):
                (a, b) => compareNumberAsc(a['askill'], b['askill'], 'scale');
        case 'スキルSP':
            return descending ?
                (a, b) => compareNumberDesc(a['askill'], b['askill'], 'sp'):
                (a, b) => compareNumberAsc(a['askill'], b['askill'], 'sp');
        case 'スキル対象':
            return descending ?
                (a, b) => compareNumberDesc(a['askill'], b['askill'], 'number'):
                (a, b) => compareNumberAsc(a['askill'], b['askill'], 'number');
        default:
            return null;
        }
    }

    /**
     * equip to row
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
                const level = getEquipLevel(data);
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
     * generate equip sort function
     * @param {string} sort_key sort key
     * @param {boolean} descending sort direction 
     * @returns {function(object, object): number} sort fuction
     */
    function equipSorter(sort_key, descending) {
        switch (sort_key) {
        case 'ランク':
            return descending ?
                (a, b) => compareDesc(a, b, 'rank'):
                (a, b) => compareAsc(a, b, 'rank');
        case '名前':
            return descending ?
                (a, b) => compareDesc(a, b, 'name'):
                (a, b) => compareAsc(a, b, 'name');
        case 'HP':
            return descending ?
                (a, b) => compareParamDesc(a, b, 'hp', 'hp_rate', getEquipLevel(a), getEquipLevel(b)):
                (a, b) => compareParamAsc(a, b, 'hp', 'hp_rate', getEquipLevel(a), getEquipLevel(b));
        case '最大レベル':
            return descending ?
                (a, b) => compareNumberDesc(a, b, 'base_lv_max'):
                (a, b) => compareNumberAsc(a, b, 'base_lv_max');
        case '攻撃':
            return descending ?
                (a, b) => compareParamDesc(a, b, 'atk', 'atk_rate', getEquipLevel(a), getEquipLevel(b)):
                (a, b) => compareParamAsc(a, b, 'atk', 'atk_rate', getEquipLevel(a), getEquipLevel(b));
        case '攻撃速度':
            return descending ?
                (a, b) => compareParamDesc(a, b, 'spd', 'spd_rate', getEquipLevel(a), getEquipLevel(b)):
                (a, b) => compareParamAsc(a, b, 'spd', 'spd_rate', getEquipLevel(a), getEquipLevel(b));
        case '防御':
            return descending ?
                (a, b) => compareParamDesc(a, b, 'def', 'def_rate', getEquipLevel(a), getEquipLevel(b)):
                (a, b) => compareParamAsc(a, b, 'def', 'def_rate', getEquipLevel(a), getEquipLevel(b));
        case '移動速度':
            return descending ?
                (a, b) => compareNumberDesc(a, b, 'move'):
                (a, b) => compareNumberAsc(a, b, 'move');
        case 'クリティカル':
            return descending ?
                (a, b) => compareNumberDesc(a, b, 'crit'):
                (a, b) => compareNumberAsc(a, b, 'crit');
        case 'スキル倍率':
            return descending ?
                (a, b) => compareParamDesc(a['skill'], b['skill'], 'scale', 'scale_rate', getEquipLevel(a), getEquipLevel(b)):
                (a, b) => compareParamAsc(a['skill'], b['skill'], 'scale', 'scale_rate', getEquipLevel(a), getEquipLevel(b));
        case 'スキルBP':
            return descending ?
                (a, b) => compareParamDesc(a['skill'], b['skill'], 'bp', 'bp_rate', getEquipLevel(a), getEquipLevel(b)):
                (a, b) => compareParamAsc(a['skill'], b['skill'], 'bp', 'bp_rate', getEquipLevel(a), getEquipLevel(b));
        case 'スキル対象':
            return descending ?
                (a, b) => compareNumberDesc(a['skill'], b['skill'], 'number'):
                (a, b) => compareNumberAsc(a['skill'], b['skill'], 'number');
        default:
            return null;
        }
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
                if (current_sort.column == contents[i].value()) {
                    th.textContent += current_sort.descending ? '▽' : '△'
                }
                th.addEventListener('click', function() {
                    if (current_sort.column == contents[i].value()) {
                        current_sort.descending = !current_sort.descending
                    }
                    else {
                        current_sort.column = contents[i].value();
                        current_sort.descending = true;
                    }
                    onDataTypeChanged(data_type.value);
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
        while (elem.firstChild) {
            elem.removeChild(elem.firstChild);
        }
    }

    /**
     * update form a group with a label
     * @param {string} labelname form group label
     * @param {HTMLDivElement} formgroup the form group to contain
     * @param {Filter[]} filters filterd to be contained the group
     */
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
            const data = BGR_DATA['unit'];
            const sorter = unitSorter(current_sort.column, current_sort.descending);
            if (sorter) {
                data.sort(sorter);
            }

            updateFormGroup('フィルタ：', data_filter, attribute_filter);
            updateFormGroup('コンテンツ：', data_content, unit_content);

            data_table.appendChild(makeHeader(unit_content));
            for (let i in data) { 
                if (applyFilters(data[i], filterAttribute, attribute_filter)) {
                    data_table.appendChild(unitToRow(data[i], unit_content));
                }
            }
        }
        else if (value == 'equip') {
            const data = BGR_DATA['equip'];
            const sorter = equipSorter(current_sort.column, current_sort.descending);
            if (sorter) {
                data.sort(sorter);
            }

            updateFormGroup('フィルタ：', data_filter, rarelity_filter);
            updateFormGroup('コンテンツ：', data_content, equip_content);

            data_table.appendChild(makeHeader(equip_content));
            for (let i in data) { 
                if (applyFilters(data[i], filterRarelity, rarelity_filter)) {
                    data_table.appendChild(equipToRow(data[i], equip_content));
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
