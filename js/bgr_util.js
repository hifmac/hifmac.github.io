/**
 * @file bgr.util.js
 * @author hifmac(E32456 of the Frea server)
 * @copyright (c) 2020 hifmac
 * @license MIT-License
 */

/**
 * remove all children from an element
 * @param {HTMLElement} elem 
 */
export function clearChild(elem) {
    while (elem.firstChild) {
        elem.removeChild(elem.firstChild);
    }    
}

/**
 * returns the last element of an array
 * @template T type in the array
 * @param {Array<T>} arr to get last element
 * @returns {T} the last element of the array
 */
export function lastElement(arr) {
    return arr[arr.length - 1];
}

/**
 * 
 * @param {File} file 
 * @param {function(ProgressEvent<FileReader>): void} onload 
 * @param {function(ProgressEvent<FileReader>): void} onerror 
 */
export function readFile(file, onload, onerror) {
    const xmlreader = new FileReader();
    xmlreader.onload = onload;
    xmlreader.onerror = onerror;
    xmlreader.readAsText(file, 'UTF-8');
}

/**
 * concatanates all arguments
 */
export function concat() {
    return Array.from(arguments).join('');
}


export function compareAsc(a, b) {
    if (a > b) {
        return 1;
    }
    else if (a < b) {
        return -1;
    }
    return 0;
}

export function compareDesc(a, b) {
    if (a < b) {
        return 1;
    }
    else if (a > b) {
        return -1;
    }
    return 0;
}

/**
 * @template T
 * @param {Array<T>} array
 * @param {string} param
 * @param {asc} whether whether array should be sorted by ascending or not
 */
export function sortBy(array, param, asc=true) {
    if (asc) {
        array.sort(function(a, b){
            if (a[param] > b[param]) {
                return 1;
            }
            else if (a[param] < b[param]) {
                return -1;
            }
            return 0;
        });
    }
    else {
        array.sort(function(a, b){
            if (a[param] < b[param]) {
                return 1;
            }
            else if (a[param] > b[param]) {
                return -1;
            }
            return 0;
        });
    }
}

/**
 * translate Chinese to Japanese hopefully
 * @param {string} str
 * @returns {string} translated string
 */
export const translate = (function() {
    const WORDS = {
        '英雄': 'ユニット',
        '雜物': 'その他',
        '消耗': '消耗品',
        '角色': 'キャラ',
        '對話角色': 'シナリオキャラ',
        '普攻': '通常攻撃',
        '傷害': 'ダメージ',
        '敵方單體': '敵：単体',
        '敵方全體': '敵：全体',
        '敵方直線範圍': '敵：ライン前方',
        '敵方該路': '味方：ライン上',
        '敵方圓形範圍': '敵：円形',
        '敵方地圖砲': '敵：砲撃',
        '我方全體': '味方：全体',
        '我方單體': '味方：単体',
        '我方圓形範圍': '味方：円形',
        '我方直線範圍': '味方：ライン前方',
        '我方該路': '味方：ライン上',
        '主動': '手動',
        '無陣營': '無陣営',
        '招換': '召喚',
        '防禦力上升': '防御力上昇',
        '由遠到近': '遠くから近く',
        '蓄氣': 'チャージ',
        '變身': '変身',
        '不可以': '不可能',
        '可以': '可能',
        '防禦加成': '防御UP', 
        '擊退抗性': '撃退抵抗', 
        '暈眩抗性': '眩暈抵抗', 
        '沉默抗性': '封印抵抗', 
        '生命上限加成': 'HP上限UP',
        '速度加成': '攻撃速度UP', 
        '暴擊加成': 'クリティカルUP',
        '負面狀態消除': 'デバフ状態解除',
        '攻擊吸收': '攻撃吸収',
        '移動加成': '移動力UP',
    };
    const MAX_WORD_LENGTH = Object.keys(WORDS).reduce((accum , value) => Math.max(accum, value.length), 0);

    const FRAGMENTS = [
        [ '集換證書', '交換チケット' ],
        [ '防禦力上升', '防御力上昇' ],
        [ '防御力提升', '防御力上昇' ],
        [ '玩家技能', 'プレイヤースキル' ],
        [ '活動競擊作戰', 'イベント競撃作戦' ],
        [ '競擊作戰', '競撃作戦' ],
        [ '傷害提升', 'ダメージUP' ],
        [ '英雄SP消耗減少', 'ユニットSP消費低減'],
        [ '(全體)', '(全体)' ],
        [ '(單體)', '(単体)' ],
    ];

    return function (str) {
        if (str) {
            if (str.length <= MAX_WORD_LENGTH) {
                if (str in WORDS) {
                    return WORDS[str];
                }
            }
        
            for (let fragment of FRAGMENTS) {
                str = str.replace(fragment[0], fragment[1]);
            }
        }
        return str
    };
}());

/**
 * compare 2 objects shallow
 * @param {Object} a 
 * @param {Object} b 
 * @returns {boolean} whether 2 objects look same or not
 */
export function compareDeep(a, b) {
    const aKeys = Object.keys(a);
    if (aKeys.length != Object.keys(b).length) {
        return false;
    }

    for (let key of aKeys) {
        if (a[key] !== b[key]) {
            if (typeof a[key] !== 'object' || typeof b[key] !== 'object' || !compareDeep(a[key], b[key])) {
                return false;
            }
        }
    }

    return true;
}

export const updateTooltip = (function() {
    let updateTimer = null;
    let isPending = false;

    function updater() {
        if (isPending) {
            isPending = false;

            const tooltips = document.getElementsByClassName('tooltip');
            for (let i in tooltips) {
                if (tooltips[i].parentNode) {
                    tooltips[i].parentNode.removeChild(tooltips[i]);
                }
            }

            updateTimer = setTimeout(updater, 2000);
            $('[data-toggle="tooltip"]').tooltip({html: true});
        }
        else {
            updateTimer = null;
        }
    };

    return function() {
        isPending = true;
        if (updateTimer == null) {
            updater();
        }
    };
}());

/**
 * create element attributes
 * @param {HTMLElement} element 
 * @param {{
 *     styles: Object,
 *     classes: string[],
 *     attributes: Object,
 * }} properties 
 */
export function updateElement(element, properties) {
    if (properties.styles) {
        for (let key of Object.keys(properties.styles)) {
            element.style[key] = properties.styles[key];
        }        
    }

    if (properties.classes) {
        for (let cls of properties.classes) {
            element.classList.add(cls);
        }
    }

    if (properties.attributes) {
        for (let key of Object.keys(properties.attributes)) {
            element.setAttribute(key, properties.attributes[key]);
        }
    }
}

/**
 * create element
 * @param {string} elementName 
 * @param {(number | string)} text 
 * @returns {HTMLElement}
 */
export function createElement(elementName, text) {
    /** @type {HTMLElement} */
    const elem = document.createElement(elementName);
    elem.textContent = text;
    return elem;
}

/**
 * convert BGR server time to Date class
 * @param {number} serverTime BGR server time
 * @returns {Date} date
 */
export function convertServerTimeToDate(serverTime) {
    /**
     * maybe the seconds from year 1 to 1970
     */
    const OFFSET = 62135629207000;
    return new Date(serverTime / 10000 - OFFSET);
}

/**
 * convert rank number to string
 * @param {number} ranknum rank number
 * @returns {string} rank string
 */
export function rankNumber2String(ranknum) {
    switch(ranknum) {
    case 1:
        return 'N';
    case 2:
        return 'R';
    case 3:
        return 'SR';
    case 4:
        return 'SSR';
    case 5:
        return 'UR';
    default:
        return '不明';
    }
}

/**
 * get property or default value
 * @param {object} object 
 * @param {string} prop 
 * @param {*} defval 
 */
export function getProperty(object, prop, defval) {
    return object && prop in object ? object[prop] : defval;
}

/**
 * BGR XML boolean is true or not
 * @param {string} value 
 */
export function isTrue(value) {
    if (typeof value === 'string') {
        return value === '是';
    }
    return value;
}

/**
 * 
 * @param {(string | number)} parameter 
 * @param {(string | number)} rate 
 * @param {number} level 
 */
export function calculateParameter(parameter, rate, level) {
    return parseFloat(parameter || 0) + parseFloat(rate || 0) * level;
}

export function* zip() {
    const length = Math.min(...(Array.from(arguments, (x) => x.length)));
    for (let i = 0; i < length; ++i) {
        const itor = [];
        for (const arr of arguments) {
            itor.push(arr[i]);
        }
        yield itor;
    }
}

/**
 * inline form checkbox
 * @param {string} id 
 * @param {string} text
 * @param {boolean} checked
 */
export function Checkbox(id, text, checked) {
    /**
     * @type {HTMLInputElement}
     */
    this.input = document.createElement('input');
    this.input.id = id;
    this.input.classList.add('form-check-input');
    this.input.setAttribute('type', 'checkbox');
    this.input.checked = typeof checked === 'undefined' ? true : checked;

    /**
     * @type {HTMLLabelElement}
     */
    this.label =document.createElement('label');
    this.label.classList.add('form-check-label');
    this.label.setAttribute('for', id);
    this.label.textContent = text;

    /**
     * @type {HTMLDivElement}
     */
    this.div = document.createElement('div');
    this.div.classList.add('col-auto','form-check');
    this.div.appendChild(this.input);
    this.div.appendChild(this.label);
}

/**
 * inline form textbox
 * @param {string} id 
 * @param {string} text
 */
export function Textbox(id, text) {
    /**
     * @type {HTMLInputElement}
     */
    this.input = document.createElement('input');
    this.input.id = id;
    this.input.classList.add('form-control');
    this.input.setAttribute('type', 'text');
    this.input.setAttribute('placeholder', text);
    this.input.checked = true;

    /**
     * @type {HTMLLabelElement}
     */
    this.label = document.createElement('label');
    this.label.classList.add('ms-2');
    this.label.setAttribute('for', id);
    this.label.textContent = text;

    /**
     * @type {HTMLDivElement}
     */
    this.div = document.createElement('div');
    this.div.classList.add('col-auto', 'form-floating');
    this.div.appendChild(this.input);
    this.div.appendChild(this.label);
}