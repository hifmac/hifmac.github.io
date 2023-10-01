/**
 * @file chirper_utils.js
 * @license BSD-2-CLAUSE
 * BSD 2-Clause License
 * Copyright (c) 2020, hifmac
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * timeout promise
 * @param {number} timeout 
 * @returns {Promise<void>}
 */
function onTimeout(timeout) {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}

/**
 * Chirper V1 API utility
 */
const callApiV1 = (() => {
    let promise = onTimeout(0);

    return function callApiV1Impl(apiName) {
        return new Promise((resolve, reject) => {
            promise = promise.then(() => {
                const url = `https://api.chirper.ai/v1/${apiName}`;
                console.log(url);
                return fetch(url);
            }).then((response) => {
                resolve(response.json());
            }).catch(reject);
        });
    };
})();

/**
 * get chirper object via api
 * @param {string} chirperId chirper id to load
 * @return {Promise<Object<str, any>>} chirper object
 */
const getChirper = (() => {
    const chirpers = {};

    return async function getChirperImpl(chirperId) {
        if (!(chirperId in chirpers)) {
            chirpers[chirperId] = (await callApiV1(`chirper/${chirperId}`)).result;
        }
        return chirpers[chirperId];
    };
})();

/**
 * get world object via api
 * @param {string} worldId world id to load
 * @return {Promise<Object<str, any>>} world object
 */
const getWorld = (() => {
    const worlds = {};

    return async function getWorldImpl(worldId) {
        if (!(worldId in worlds)) {
            worlds[worldId] = (await callApiV1(`world/${worldId}`)).result;
        }
        return worlds[worldId];
    };
})();

const CHIRPS_PER_API = 100;

/**
 * get chirp object via api
 * @param {string} username chirper username to load
 * @param {number} page page number to get
 * @return {Promise<Object<str, any>>} chirp object
 */
const getChirp = (() => {
    const chirps = {};

    return async function getChirpImpl(username, page) {
        const chirpKey = `${username}/${page}`;
        if (!(chirpKey in chirps)) {
            chirps[chirpKey] = (await callApiV1(`chirp?username=${username}&sort=recent&page=${page}&limit=${CHIRPS_PER_API}`)).result;
        }
        return chirps[chirpKey];
    };
})();

const RELATIONSHIPS_PER_API = 100;

/**
 * get chirp object via api
 * @param {string} username chirper username to load
 * @param {number} page page number to get
 * @return {Promise<Object<str, any>>} chirp object
 */
const getRelationship = (() => {
    const chirps = {};

    return async function getRelationshipImpl(username, page) {
        const chirpKey = `${username}/${page}`;
        if (!(chirpKey in chirps)) {
            chirps[chirpKey] = (await callApiV1(`chirp?username=${username}&sort=relationships&page=${page}&limit=${RELATIONSHIPS_PER_API}`)).result;
        }
        return chirps[chirpKey];
    };
})();

/**
 * update progress bar
 * @param {string} label progress label
 * @param {number} value work progress between 0 to 100
 */
function updateProgress(label, value) {
    document.getElementById("progress-label").textContent = label + ": ";

    const progressbar = document.getElementById("progress-bar");
    progressbar.style.width = progressbar.textContent = `${value}%`;
    progressbar.setAttribute('aria-valuenow', value);
}

/**
 * serialize paired chirp results
 * @param {any[]} chirpResult chirp api result
 * @param {string} chirperId target chirper id
 * @returns {any[]} serialized chirps
 */
function serializeChirpResult(chirpResult, chirperId) {
    return chirpResult.chirps.reduce((list, chirp) => {
        if (Array.isArray(chirp)) {
            list.push(...chirp);
        }
        else {
            list.push(chirp);
        }
        return list;
    }, []).filter((c) => (c?.chirper?.id === chirperId));
}
