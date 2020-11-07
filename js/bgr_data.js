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

BgrLib.inherits(Form, Checkbox);

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
 * content filter
 * @param {Form} form form object
 * @param {function((BgrUnit | BgrEquip), string): bool} func filter function
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
 * @type {function((BgrUnit | BgrEquip), string): bool}
 */
Filter.prototype.func = null;

/**
 * apply filter to an object
 * @param {(BgrUnit | BgrEquip)} obj the object to be applied
 */
Filter.prototype.apply = function Filter_apply(obj) {
    return this.form.checked() && this.func(obj, this.form.value());
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
 * @type {Checkbox}
 */
Column.prototype.form = null;

/**
 * @type {function((BgrUnit | BgrEquip)): (number | string)}
 */
Column.prototype.read = null;

/**
 * @type {function((number | string)) : string}
 */
Column.prototype.formatter = null;

/**
 * get column string
 * @param {(BgrUnit | BgrEquip)} obj column object to read
 */
Column.prototype.string = function Column_string(obj) {
    const value = this.read(obj);
    if (value) {
        return this.formatter ? this.formatter(value) : value;
    }
    return null;
}

/**
 * @param {HTMLElement} elem 
 * @param {Column[]} content 
 * @param {string} name 
 */
function DataTableContent(elem, content, name) {
    this.element = elem;
    this.content = content;
    this.name = name;
};

/**
 * @param {function(): void} callback 
 */
DataTableContent.prototype.onChanged = function DataTableContent_onChanged(callback) {
    for (let i in this.content) {
        this.content[i].form.onChanged(callback);
    }
};

/**
 * @param {HTMLElement} elem 
 * @param {Filter[]} filter 
 * @param {string} name 
 * @param {boolean} any whether filter is matched with any or all
 */
function DataTableFilter(elem, filter, name, any) {
    this.element = elem;
    this.filter = filter;
    this.name = name;
    this.any = any;
};

/**
 * 
 * @param {(BgrUnit | BgrEquip)} obj 
 * @returns {boolean} whether filters are matched
 */
DataTableFilter.prototype.apply = function DataTableFilter_apply(obj) {
    if (this.any) {
        return this.filter.reduce((accum, x) => accum || x.apply(obj), false);
    }
    else {
        return this.filter.reduce((accum, x) => accum && x.apply(obj), true);
    }
};

/**
 * @param {function(): void} callback 
 */
DataTableFilter.prototype.onChanged = function DataTableFilter_onChanged(callback) {
    for (let i in this.filter) {
        this.filter[i].form.onChanged(callback);
    }
};

/**
 * @param {HTMLTableElement} table
 * @param {(BgrUnit | BgrEquip)[]} data 
 * @param {DataTableContent} contents 
 * @param {DataTableFilter[]} filters 
 */
function DataTable(table, data, contents, filters) {
    this.table = table;
    this.data = data;
    this.contents = contents;
    this.filters = filters;
    this.sort = {
        column: null,
        descending: false,
    }
}

/**
 * 
 * @param {object} sort 
 * @param {Column[]} contents 
 * @param {function(): void} callback 
 */
DataTable.prototype.makeHeader = function DataTable_makeHeader(sort, contents, callback) {
    const header = BgrLib.createTableHeader();
    const row = document.createElement('tr')
    for (let i in contents) {
        if (contents[i].form.checked()) {
            const th = BgrLib.createTableHeaderCell(contents[i].form.value());
            if (sort.column == contents[i]) {
                th.textContent += sort.descending ? '▽' : '△';
            }

            th.addEventListener('click', function() {
                if (sort.column == contents[i]) {
                    sort.descending = !sort.descending
                }
                else {
                    sort.column = contents[i];
                    sort.descending = true;
                }
                callback();
            });

            row.appendChild(th);
        }
    }
    header.appendChild(row);
    return header;
};

/**
 * equip to row
 * @param {(BgrUnit | BgrEquip))} data 
 * @param {Column[]} contents 
 */
DataTable.prototype.dataToRow = function DataTable_dataToRow(data, contents) {
    const row = document.createElement('tr');
    for (let i in contents) {
        if (contents[i].form.checked()) {
            const col = BgrLib.createTableCell(contents[i].string(data));
            col.style.whiteSpace = 'pre-wrap';
            row.appendChild(col);
        }
    }
    return row;
};

/**
 * update form a group with a label
 * @param {HTMLDivElement} formgroup the form group to contain
 * @param {(Filter | Column)[]} form_holder filtered to be contained the group
 * @param {string} labelname form group label
 */
DataTable.prototype.updateFormGroup = function DataTable_updateFormGroup(formgroup, form_holder, labelname) {
    BgrLib.clearChildren(formgroup);

    if (labelname) {
        const label = document.createElement('label');
        label.textContent = labelname;
        formgroup.appendChild(label);
    }

    for (let i in form_holder) {
        form_holder[i].form.setParent(formgroup);
    }
};

/**
 * @returns {function(): void} update callback
 */
DataTable.prototype.register = function DataTable_register() {
    const self = this;

    const onUpdated = function() {
        self.updateFormGroup(
            self.contents.element,
            self.contents.content,
            self.contents.name);

        for (let i in self.filters) {
            self.updateFormGroup(
                self.filters[i].element,
                self.filters[i].filter,
                self.filters[i].name);
        }

        if (self.sort.column) {
            const compare = (self.sort.descending ? BgrLib.compareDesc : BgrLib.compareAsc);
            self.data.sort((a, b) => compare(self.sort.column.read(a), self.sort.column.read(b)));
        }

        BgrLib.clearChildren(self.table);
        self.table.appendChild(self.makeHeader(self.sort, self.contents.content, onUpdated));
        const tbody = document.createElement('tbody');
        for (let i in self.data) {
            const matched = self.filters.reduce((accum, x) => accum && x.apply(self.data[i]), true);
            if (matched) {
                tbody.appendChild(self.dataToRow(self.data[i], self.contents.content));
            }
        }
        self.table.appendChild(tbody);
    };


    ([ this.contents ].concat(this.filters)).forEach(function(filter) {
        filter.onChanged(onUpdated);
    });

    return onUpdated;
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

    const rank_filter = [
        new Filter(new Checkbox('N', 'N'), filterEquipRank),
        new Filter(new Checkbox('R', 'R'), filterEquipRank),
        new Filter(new Checkbox('SR', 'SR'), filterEquipRank),
        new Filter(new Checkbox('SSR', 'SSR'), filterEquipRank),
        new Filter(new Checkbox('UR', 'UR'), filterEquipRank),
        new Filter(new Checkbox('Z', '神器'), filterEquipRank),
    ];

    const skill_filter = [
        new Filter(new Textbox('skill-equip', 'スキル効果'), filterEquipSkill),
    ];

    const content = [
        new Column('equip-name', '名前', (x) => x.name()),
        new Column('equip-hp', 'ランク', (x) => x.rank()),
        new Column('equip-level', '最大レベル', (x) => x.level()),
        new Column('equip-hp', 'HP', (x) => x.hp(), parseInt),
        new Column('equip-atk', '攻撃', (x) => x.atk(), parseInt),
        new Column('equip-spd', '攻撃速度', (x) => x.spd(), parseInt),
        new Column('equip-critical', 'クリティカル', (x) => x.crit(), BgrLib.percentize),
        new Column('equip-def', '防御', (x) => x.def(), parseInt),
        new Column('equip-move', '移動速度', (x) => x.move()),
        new Column('equip-skillbuffer1', 'スキル効果1', (x) => x.skillBuffer1()),
        new Column('equip-skillbuffer2', 'スキル効果2', (x) => x.skillBuffer2()),
        new Column('equip-skillscale', 'スキル倍率', (x) => x.skillScale(), BgrLib.percentize),
        new Column('equip-skillbp', 'スキルBP', (x) => x.skillBP()),
    ];

    const table = new DataTable(
        equip_table,
        BgrLib.getEquip(), 
        new DataTableContent(equip_content, content, 'コンテンツ：'),
        [
            new DataTableFilter(equip_rank_filter, rank_filter, 'ランク：', true),
            new DataTableFilter(equip_skill_filter, skill_filter, null, false),
        ]);

    table.register()();
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
     * current sort column
     * @type {object}
     */
    const sort = {
        column: null,
        descending: false,
    };

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


    const attribute_filter = [
        new Filter(new Checkbox('attr-sandica', 'サンディカ'), filterAttribute),
        new Filter(new Checkbox('attr-demonia', 'デモニア'), filterAttribute),
        new Filter(new Checkbox('attr-valmir', 'ヴァーミル'), filterAttribute),
        new Filter(new Checkbox('attr-blanc', 'ブラン'), filterAttribute),
        new Filter(new Checkbox('attr-jade', 'ジェイド'), filterAttribute),
    ];

    const skill_filter = [
        new Filter(new Textbox('skill-leader', '隊長スキル'), filterLeaderSkill),
        new Filter(new Textbox('skill-attack', 'スキル効果'), filterAttackSkill),
    ];

    const content = [
        new Column('unit-id', 'ID', (x) => x.id()),
        new Column('unit-name', '名前', (x) => x.name()),
        new Column('unit-attr', '所属', (x) => x.attr()),
        new Column('unit-hp', 'HP', (x) => x.hp(), parseInt),
        new Column('unit-atk', '攻撃', (x) => x.atk(), parseInt),
        new Column('unit-atkscale', '攻撃倍率', (x) => x.atkScale(), BgrLib.percentize),
        new Column('unit-spd', '攻撃速度', (x) => x.spd(), parseInt),
        new Column('unit-atkrange', '攻撃距離', (x) => x.atkRange()),
        new Column('unit-critical', 'クリティカル', (x) => x.crit(), BgrLib.percentize),
        new Column('unit-def', '防御', (x) => x.def(), parseInt),
        new Column('unit-move', '移動速度', (x) => x.move(), parseInt),
        new Column('unit-leaderskill', '隊長スキル', (x) => x.leaderSkill()),
        new Column('unit-skillbuffer1', 'スキル効果1', (x) => x.attackSkillBuffer1()),
        new Column('unit-skillbuffer2', 'スキル効果2', (x) => x.attackSkillBuffer2()),
        new Column('unit-skillsp', 'スキルSP', (x) => x.attackSkillSP()),
        new Column('unit-skilltarget', 'スキル対象', (x) => x.attackSkillTarget()),
        new Column('unit-skillscale', 'スキル倍率', (x) => x.attackSkillScale(), BgrLib.percentize),
    ];

    const table = new DataTable(
        unit_table,
        BgrLib.getUnit(), 
        new DataTableContent(unit_content, content, 'コンテンツ：'),
        [
            new DataTableFilter(unit_attr_filter, attribute_filter, '所属：', true),
            new DataTableFilter(unit_skill_filter, skill_filter, null, false),
        ]);

    table.register()();
});
