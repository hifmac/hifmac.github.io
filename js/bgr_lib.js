const GAME_FPS = 60;
const ATTACK_FRAME_DELAY = 0.151;
const UNIT_MAX_SPEED = 2000;
const UNIT_MAX_SPEED_EFFECTIVE = parseInt(1000 * GAME_FPS / (GAME_FPS / 2 + 1 - ATTACK_FRAME_DELAY) + 0.5);
const UNIT_MAX_CRITICAL = 1.0;
const UNIT_MAX_MOVE = 500;

const GP_BONUS_HP   = 900;
const GP_BONUS_ATK  = 45;
const GP_BONUS_DEF  = 45;
const GP_BONUS_SPD  = 50;
const GP_BONUS_CRIT = 0.03;
const GP_BONUS_MOVE = 25;
const GP_BONUS_ALL  = 0.03;

const GUILD_SKILL_HP  = 0.06;
const GUILD_SKILL_ATK = 0.058;
const GUILD_SKILL_DEF = 0.058;
const GUILD_SKILL_SPD = 0.03;

const BLESS_BONUS = 0.25

/**
 * BGR unit data
 * @param {object} unit 
 */
function BgrUnit(unit) {
    /**
     * @type {object} unit data
     */
    this.unit_data = unit;
}

/**
 * calculate parameter
 * @param {string} param parameter name
 * @param {string} param_rate parameter rate name
 */
BgrUnit.prototype.calculate = function(param, param_rate) {
    return BgrLib.calculate(this.unit_data[param], this.unit_data[param_rate], this.paramLevel());
}

/**
 * format buffer string
 * @param {object[]} buffers buffer object
 * @param {number} prob buffer probability
 */
BgrUnit.prototype.formatBuffer = function(buffers, prob) {
    return BgrLib.formatBuffers(buffers, prob, this.paramLevel());
}

/**
 * @returns {number} id
 */
BgrUnit.prototype.id = function BgrUnit_id() {
    return parseInt(this.unit_data['id']);
}

/**
 * @returns {string} name
 */
BgrUnit.prototype.name = function BgrUnit_name() {
    return this.unit_data['name'];
};

/**
 * @returns {string} attribute
 */
BgrUnit.prototype.attr = function BgrUnit_attr() {
    return this.unit_data['attr'];
};

/**
 * @returns {number} unit level always be 100
 */
BgrUnit.prototype.level = function BgrUnit_level() {
    return 100;
}

/**
 * @returns {number} parameter level
 */
BgrUnit.prototype.paramLevel = function BgrUnit_paramLevel() {
    return this.level() - 1;
};

BgrUnit.prototype.hp = function BgrUnit_hp() {
    return this.calculate('hp', 'hp_rate');
};

BgrUnit.prototype.atk = function BgrUnit_atk() {
    return this.calculate('atk', 'atk_rate');
};

BgrUnit.prototype.atkScale = function BgrUnit_atkScale() {
    return BgrLib.toFloat(this.unit_data['nskill']['scale']);
};

BgrUnit.prototype.spd = function BgrUnit_spd() {
    return this.calculate('spd', 'spd_rate');
};

BgrUnit.prototype.atkRange = function BgrUnit_atkRange() {
    return BgrLib.toFloat(this.unit_data['nskill']['range']);
};

BgrUnit.prototype.def = function BgrUnit_def() {
    return this.calculate('def', 'def_rate');
};

BgrUnit.prototype.move = function BgrUnit_move() {
    return BgrLib.toFloat(this.unit_data['move']);
};

BgrUnit.prototype.crit = function BgrUnit_crit() {
    return BgrLib.toFloat(this.unit_data['crit']);
};

BgrUnit.prototype.leaderSkill = function BgrUnit_leaderSkill() {
    return this.unit_data['lskill'].map((x) => x['name'] + BgrLib.percentize(BgrLib.toFloat(x['scale']))).join('\n');
};

BgrUnit.prototype.attackSkillBuffer1 = function BgrUnit_attackSkillBuffer1() {
    const skill = this.unit_data['askill'];
    if (skill) {
        return this.formatBuffer(skill['buffer1'], skill['buffer1_prob']);
    }
    return '';
};

BgrUnit.prototype.attackSkillBuffer2 = function BgrUnit_attackSkillBuffer2() {
    const skill = this.unit_data['askill'];
    if (skill) {
        return this.formatBuffer(skill['buffer2'], skill['buffer2_prob']);
    }
    return '';
};

BgrUnit.prototype.attackSkillSP = function BgrUnit_attackSkillSP() {
    const skill = this.unit_data['askill'];
    if (skill) {
        return BgrLib.toInt(skill['sp']);
    }
    return null;
};

BgrUnit.prototype.attackSkillScale = function BgrUnit_attackSkillScale() {
    const skill = this.unit_data['askill'];
    if (skill) {
        return BgrLib.toFloat(skill['scale']);
    }
    return null;
};

BgrUnit.prototype.attackSkillTarget = function BgrUnit_attackSkillTarget() {
    const skill = this.unit_data['askill'];
    if (skill) {
        return BgrLib.toInt(skill['number']);
    }
    return null;
};

BgrUnit.prototype.attackSkillCooldown = function BgrUnit_attackSkillCooldown() {
    const skill = this.unit_data['askill'];
    if (skill) {
        return skill['first_cd'] + '秒/' + skill['cd'] + '秒';
    }
    return null;
};

BgrUnit.prototype.reinforcedHp = function BgrUnit_reinforcedHp() {
    return this.hp() * (1 + BLESS_BONUS + GUILD_SKILL_HP + GP_BONUS_ALL) + GP_BONUS_HP;
};

BgrUnit.prototype.reinforcedAtk = function BgrUnit_reinforcedAtk() {
    return this.atk() * (1 + BLESS_BONUS + GUILD_SKILL_ATK + GP_BONUS_ALL) + GP_BONUS_ATK;
};

BgrUnit.prototype.reinforcedSpd = function BgrUnit_reinforcedSpd() {
    return this.spd() * (1 + BLESS_BONUS + GUILD_SKILL_SPD + GP_BONUS_ALL) + GP_BONUS_SPD;
};

BgrUnit.prototype.reinforcedDef = function BgrUnit_reinforcedDef() {
    return this.def() * (1 + BLESS_BONUS + GUILD_SKILL_DEF + GP_BONUS_ALL) + GP_BONUS_DEF;
};

BgrUnit.prototype.reinforcedCrit = function BgrUnit_reinforcedCrit() {
    return (this.crit() + GP_BONUS_CRIT) * this.bonusCritRate();
};

BgrUnit.prototype.bonusCritRate = function BgrUnit_bonusCritRate() {
    return (1 + BLESS_BONUS + GP_BONUS_ALL);
};

BgrUnit.prototype.reinforcedMove = function BgrUnit_reinforcedMove() {
    return (this.move() + GP_BONUS_MOVE) * (1 + BLESS_BONUS + GP_BONUS_ALL);
};


/**
 * BGR equipment data
 * @param {object} equip 
 */
function BgrEquip(equip) {
    this.equip_data = equip;
}

/**
 * calculate parameter
 * @param {string} param parameter name
 * @param {string} param_rate parameter rate name
 */
BgrEquip.prototype.calculate = function(param, param_rate, obj) {
    return BgrLib.calculate(obj[param], obj[param_rate], this.paramLevel());
}

/**
 * format buffer string
 * @param {object[]} buffers buffer object
 * @param {number} prob buffer probability
 */
BgrEquip.prototype.formatBuffer = function(buffers, prob) {
    return BgrLib.formatBuffers(buffers, prob, this.paramLevel());
}

/**
 * @returns {number} id
 */
BgrEquip.prototype.id = function BgrEquip_id() {
    return BgrLib.toInt(this.equip_data['id']);
};

/**
 * @returns {string} name
 */
BgrEquip.prototype.name = function BgrEquip_name() {
    return this.equip_data['name'];
};

/**
 * @returns {string} rankg string
 */
BgrEquip.prototype.rank = function BgrEquip_rank() {
    return this.equip_data['skill'] ? '神器' : this.equip_data['rank'];
}

BgrEquip.prototype.level = function BgrEquip_level() {
    return BgrLib.toInt(this.equip_data['base_lv_max']) + 5 * BgrLib.toInt(this.equip_data['over']);
};

BgrEquip.prototype.paramLevel = function BgrEquip_paramLevel() {
    return this.level();
};

BgrEquip.prototype.hp = function BgrEquip_hp() {
    return BgrLib.toInt(this.calculate('hp', 'hp_rate', this.equip_data));
};

BgrEquip.prototype.atk = function BgrEquip_atk() {
    return BgrLib.toInt(this.calculate('atk', 'atk_rate', this.equip_data));
};

BgrEquip.prototype.spd = function BgrEquip_spd() {
    return BgrLib.toInt(this.calculate('spd', 'spd_rate', this.equip_data));
};

BgrEquip.prototype.def = function BgrEquip_def() {
    return BgrLib.toInt(this.calculate('def', 'def_rate', this.equip_data));
};

BgrEquip.prototype.move = function BgrEquip_move() {
    return BgrLib.toInt(this.equip_data['move']);
};

BgrEquip.prototype.crit = function BgrEquip_crit() {
    return BgrLib.toFloat(this.equip_data['crit']);
};

/**
 * @type {string} skill buffer 1 string
 */
BgrEquip.prototype.skillBuffer1 = function BgrEquip_skillBuffer1() {
    const skill = this.equip_data['skill'];
    if (skill) {
        return  this.formatBuffer(skill['buffer1'], skill['buffer1_prob']);
    }
    return '';
};

/**
 * @returns {string} skill buffer 2 string
 */
BgrEquip.prototype.skillBuffer2 = function BgrEquip_skillBuffer2() {
    const skill = this.equip_data['skill'];
    if (skill) {
        return  this.formatBuffer(skill['buffer2'], skill['buffer2_prob']);
    }
    return '';
};

BgrEquip.prototype.skillScale = function BgrEquip_skillScale() {
    const skill = this.equip_data['skill'];
    if (skill) {
        return this.calculate('scale', 'scale_rate', skill);
    }
    return 0;
};

BgrEquip.prototype.skillBP = function BgrEquip_skillBP() {
    const skill = this.equip_data['skill'];
    if (skill) {
        return this.calculate('bp', 'bp_rate', skill);
    }
    return 0;
};

BgrEquip.prototype.dropStage = function BgrEquip_dropStage() {
    return this.equip_data.drop_stage.map((x) => x.replace(/\n/g, '')).join('\n');
};

BgrEquip.prototype.itembox = function BgrEquip_itembox() {
    return this.equip_data.itembox.map((x) => x.replace(/\n/g, '')).join('\n');
};

const BgrLib = {
    /**
     * inherits a parent to a child
     * @param {function} parent object to be inherited
     * @param {function} child object to inherit
     */
    inherits(parent, child) {
        child.prototype = Object.create(parent.prototype);
    },

    /**
     * calculate parameter
     * @param {number} param parameter value
     * @param {number} param_rate parameter grow rate
     * @param {number} level parameter level
     * @returns {(number|null)} calculated parameter
     */
    calculate(param, param_rate, level) {
        if (param || param_rate) {
            return BgrLib.toFloat(param) + BgrLib.toFloat(param_rate) * level;
        }
        else {
            return 0;
        }
    },

    /**
     * parse integer value but null
     * @param {number} value 
     * @param {(number|null)} defval 
     * @return {number} integer value
     */
    toInt(value) {
        return value ? parseInt(value) : 0;
    },

    /**
     * parse float value but null
     * @param {number} value 
     * @param {(number|null)} defval 
     * @returns {number} float value
     */
    toFloat(value) {
        return value ? parseFloat(value) : 0;
    },

    /**
     * format skill buffer to string
     * @param {object[]} buffers buffer list
     * @param {float} prob buffer probability
     * @returns {string} formatterd buffer string
     */
    formatBuffers(buffers, prob, level) {
        const ret = [];
        for (let i in buffers) {
            const buffer = buffers[i];
            const buffname = buffer['name'] + '[' + BgrLib.percentize(prob) + ']';
            const effect = [];

            const scale = BgrLib.calculate(buffer['scale'], buffer['scale_rate'], level);
            if (scale) {
                effect.push(BgrLib.percentize(Math.abs(scale)));
            }

            const value = BgrLib.toInt(BgrLib.calculate(buffer['value'], buffer['value_rate'], level));
            if (0 < Math.abs(value) && buffer['name'].indexOf('勢力転換') == -1) {
                effect.push(Math.abs(value));
            }
        
            const duration = BgrLib.toInt(BgrLib.calculate(buffer['duration'], buffer['duration_rate'], level));
            if (duration) {
                effect.push(duration + '秒');
            }

            if (buffer['times']) {
                effect.push(BgrLib.toInt(buffer['times']) + '回');
            }
            ret.push(buffname + '(' + effect.join(',') + ')')
        }
        return ret.join('\n');
    },

    /**
     * percentize a value
     * @param {float} value value to be percentized
     * @returns {(string|null)} percentagized value
     */
    percentize(value) {
        return value ? parseInt(value * 100) + '%' : null;
    },

    /**
     * @type {function(): BgrUnit[]} unit list
     */
    getUnit: null,

    /**
     * @type {function(): BgrEquip[]} equip list
     */
    getEquip: null,

    /**
     * load BGR data object
     * @param {object} object 
     */
    load(object) {
        const BGR_UNIT = object['unit'].map((x) => new BgrUnit(x));
        const BGR_EQUIP = object['equip'].map((x) => new BgrEquip(x));        

        this.getUnit = () => BGR_UNIT;
        this.getEquip = () => BGR_EQUIP;
    },

    /**
     * compare for descending
     * @param {object} a 
     * @param {object} b
     * @returns {1 | -1 | 0} comapared result 
     */
    compareDesc(a, b) {
        if (a > b) {
            return -1;
        }
        else if (b > a) {
            return 1;
        }
        else {
            return 0;
        }
    },

    /**
     * compare for ascending
     * @param {object} a 
     * @param {object} b
     * @returns {1 | -1 | 0} comapared result 
     */
    compareAsc(a, b) {
        if (a > b) {
            return 1;
        }
        else if (b > a) {
            return -1;
        }
        else {
            return 0;
        }
    },

    /**
     * clear children of an element
     * @param {HTMLElement} elem element to remove children
     */
    clearChildren(elem) {
        while (elem.lastChild) {
            elem.removeChild(elem.lastChild);
        }
    },

    /**
     * @return {number} xor shift random number generator
     */
    xorShift: (function(){
        let x = 123456789 * Date.now() | 0;
        let y = 362436069 * Date.now() | 0;
        let z = 521288629 * Date.now() | 0;
        let w = 88675123 * Date.now() | 0; 

        return function() {
            const t = x ^ (x << 11);
            x = y,
            y = z,
            z = w,
            w = (w ^ (w >> 19)) ^ (t ^ (t >> 8));  
            return w;   
        };
    }()),

    createElement(tag, text, attributes) {
        const elem = document.createElement(tag);
        elem.textContent = text;
        for (let attr in attributes) {
            elem.setAttribute(attr, attributes[attr]);
        }
        return elem;
    },

    /**
     * @returns {HTMLTableSectionElement} table header
     */
    createTableHeader() {
        return BgrLib.createElement('thead', null, { class: 'thead-dark' });
    },

    /**
     * @param {string} text header text
     * @returns {HTMLTableHeaderCellElement} table header cell
     */
    createTableHeaderCell(text) {
        return BgrLib.createElement('th', text, { scope: 'col' });
    },

    /**
     * @param {string} text 
     * @returns {HTMLTableDataCellElement} table cell
     */
    createTableCell(text, attr) {
        return BgrLib.createElement('td', text, attr);
    },

    speedToFrame(speed) {
        return parseInt((1000 * GAME_FPS / speed) + ATTACK_FRAME_DELAY);
    },

    updateTooltip: (function() {
        let updateTimer = null;
        function updater() {
            const tooltips = document.getElementsByClassName('tooltip');
            for (let i in tooltips) {
                if (tooltips[i].parentNode) {
                    tooltips[i].parentNode.removeChild(tooltips[i]);
                }
            }

            $('[data-toggle="tooltip"]').tooltip({html: true});
            updateTimer = null;
        };

        return function() {
            if (updateTimer == null) {
                updateTimer = setTimeout(updater, 2000);
            }
        };
    }()),

    trueType() {
        return true;
    },

    falseType() {
        return false;
    }
};

/**
 * Table class column
 * @param {string} name 
 * @param {function(): boolean} enabled 
 * @param {function((BgrUnit | BgrEquip)): (number | string)} read 
 * @param {function((number | string)): string} format 
 */
function TableColumn(name, enabled, read, kwargs) {
    this.name = name;
    this.isEnabled = enabled;
    this.read = read;
    this.format = (kwargs && 'format' in kwargs) ? kwargs.format : null;
    this.tooltip = (kwargs && 'tooltip' in kwargs) ? kwargs.tooltip : null;
}

/** @type {function(): boolean} */
TableColumn.prototype.isEnabled = null;

/** @type {function((BgrUnit | BgrEquip | EquippedUnit)): (number | string)} */
TableColumn.prototype.read = null;

/** @type {function((number | string)): string} */
TableColumn.prototype.format = null;

/** @type {function((BgrUnit | BgrEquip)): string} */
TableColumn.prototype.tooltip = null;

/**
 * @param {HTMLTableElement} element
 */
function Table(element) {
    this.element = element;
}

Table.CELL_ATTR = {
    'style': 'white-space: pre-wrap;'
};

/** @type {TableColumn[]} */
Table.prototype.column = null;

/** @type {(BgrUnit[] | BgrEquip[])} */
Table.prototype.data = null;

/** @type {(function(object): boolean)[]} */
Table.prototype.filters = [];

/** @type {TableColumn} */
Table.prototype.sort_column = null;

/** @type {boolean} */
Table.prototype.sort_desc = false;

/** @type {(function(TableColumn): void)[]} */
Table.prototype.headerClickListeners = [];

/** @type {(function(object): void)[]} */
Table.prototype.bodyClickListeners = [];

Table.prototype.hasTooltip = false;

Table.prototype.clearTable = function Table_clearTable() {
    BgrLib.clearChildren(this.element);
};

/**
 * make a table header
 * @returns {HTMLTableCaptionElement} 
 */
Table.prototype.makeHeader = function Table_makeHeader() {
    const header = BgrLib.createTableHeader();
    const row = document.createElement('tr');
    for (let i in this.column) {
        const column = this.column[i];
        if (column.isEnabled()) {
            const th = BgrLib.createTableHeaderCell(column.name);
            if (this.sort_column == column) {
                th.textContent += this.sort_desc ? '▽' : '△';
            }

            th.addEventListener('click', this.onHeaderClicked.bind(this, column));

            row.appendChild(th);
        }
    }
    header.appendChild(row);
    return header;
};

/**
 * make a table body
 * @returns {HTMLTableSectionElement}
 */
Table.prototype.makeBody = function Table_makeBody() {
    if (this.sort_column) {
        const compare = (this.sort_desc ? BgrLib.compareDesc : BgrLib.compareAsc);
        this.data.sort((a, b) => compare(this.sort_column.read(a), this.sort_column.read(b)));
    }



    const body = document.createElement('tbody');
    for (let i in this.data) {
        const data = this.data[i];
        const matched = this.filters.reduce((accum, x) => accum && x(data), true);
        if (!matched) {
            continue;
        }
        const row = document.createElement('tr');
        row.addEventListener('click', this.onBodyClicked.bind(this, data));
        for (let j in this.column) {
            const column = this.column[j];
            if (column.isEnabled()) {
                const column_value = column.read(data);
                const column_attr = column.tooltip ? this.createTooltip(column.tooltip(data)) : Table.CELL_ATTR;   
                const col = BgrLib.createTableCell(column.format ? column.format(column_value) : column_value, column_attr);
                row.appendChild(col);
            }
        }
        body.appendChild(row);
    }
    return body;
};

Table.prototype.update = function() {
    this.clearTable();
    this.element.appendChild(this.makeHeader());
    this.element.appendChild(this.makeBody());

    if (this.hasTooltip) {
        BgrLib.updateTooltip();
    }
};

Table.prototype.createTooltip = function (title) {
    this.hasTooltip = true;
    return {
        'style': Table.CELL_ATTR.style,
        'data-toggle': 'tooltip',
        'data-placement': 'top',
        title,
    };
}

/**
 * the function called when table header clicked
 * @param {TableColumn} column 
 */
Table.prototype.onHeaderClicked = function(column) {
    if (this.sort_column == column) {
        this.sort_desc = !this.sort_desc;
    }
    else {
        this.sort_column = column;
        this.sort_desc = true;
    }

    this.update();

    for (let i in this.headerClickListeners) {
        this.headerClickListeners[i](column);
    }
};

/**
 * the function called when table body clicked
 * @param {Object} data 
 */
Table.prototype.onBodyClicked = function(data) {
    for (let i in this.bodyClickListeners) {
        this.bodyClickListeners[i](data);
    }
};
