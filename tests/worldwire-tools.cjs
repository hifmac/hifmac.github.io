const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync(require('node:path').join(__dirname, '../worldwire.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new Function(script);
const plain = value => JSON.parse(JSON.stringify(value));
const archive = [
  { id: 'a', sequence: 1, date: '0142/04/01', author: '中央通信', genre: '政治', title: '鉄道開通', content: '港と鉄道\n\n第二段落', reaction: [] },
  { id: 'b', sequence: 2, date: '0142/04/02', author: '夕映新聞', genre: '社会', title: '港の暮らし', content: '住民の証言', reaction: ['❤️'] },
  { id: 'c', sequence: 3, date: '0142/04/03', author: '中央通信', genre: '経済', title: '市場', content: 'MARKET', reaction: [] }
];
const before = JSON.stringify(archive);
const context = {
  URL, console: { info() {} },
  isObject: x => x !== null && typeof x === 'object' && !Array.isArray(x)
};
vm.createContext(context);
vm.runInContext(script.slice(script.indexOf('function escapeJsonControlCharacters'), script.indexOf('async function generateNews')), context);
const runTool = (name, args, articles = archive) => plain(context.executeArticleTool(name, args, articles));
assert.deepEqual(runTool('search_articles', { query: '港' }).articles.map(x => x.id), ['b', 'a']);
assert.deepEqual(runTool('search_articles', { query: 'market' }).articles.map(x => x.id), ['c']);
assert.deepEqual(runTool('search_articles', { query: '', author: '中央通信', genre: '政治' }).articles.map(x => x.id), ['a']);
assert.deepEqual(runTool('search_articles', { sort_key: 'sequence', sort_order: 'asc' }).articles.map(x => x.id), ['a', 'b', 'c']);
assert.equal(runTool('search_articles', { sort_key: 'reaction_count', sort_order: 'desc' }).articles[0].id, 'b');
assert.deepEqual(runTool('search_articles', { sort_key: 'title', sort_order: 'asc' }).articles.map(x => x.title), archive.map(x => x.title).sort((a, b) => a.localeCompare(b, 'ja')));
for (const sort_key of ['sequence', 'date', 'title', 'reaction_count']) {
  const asc = runTool('search_articles', { sort_key, sort_order: 'asc' }).articles.map(x => x.id);
  const desc = runTool('search_articles', { sort_key, sort_order: 'desc' }).articles.map(x => x.id);
  assert.deepEqual(desc, asc.slice().reverse(), sort_key + ' supports both directions');
}
const differentDates = [{ ...archive[0], date: '0142/04/30' }, { ...archive[1], date: '0142/03/01' }, archive[2]];
assert.deepEqual(runTool('search_articles', { sort_key: 'date', sort_order: 'asc' }, differentDates).articles.map(x => x.id), ['b', 'c', 'a']);
assert.deepEqual(runTool('search_articles', { query: '港', sort_key: 'sequence', sort_order: 'asc', limit: 1 }).articles.map(x => x.id), ['a']);
assert.throws(() => runTool('search_articles', { sort_order: 'invalid' }));
assert.throws(() => runTool('search_articles', { sort: 'newest' }));
assert.throws(() => runTool('sort_articles', {}));
const page = runTool('search_articles', { offset: 1, limit: 1 });
assert.equal(page.total, 3);
assert.equal(page.next_offset, 2);
assert.equal(page.has_more, true);
assert.equal(runTool('search_articles', { offset: 10 }).next_offset, null);
assert.equal(runTool('search_articles', { query: 'missing' }).total, 0);
assert.equal(runTool('search_articles', {}, []).total, 0);
assert.equal(runTool('search_articles', {}, [{ ...archive[0], content: 'x'.repeat(7000) }]).articles[0].content_truncated, true);
for (const args of [{ limit: 11 }, { offset: -1 }, { limit: 1.5 }, { sort_key: 'invalid' }, { author: [] }, { query: 1 }, { extra: 1 }]) {
  assert.throws(() => runTool('search_articles', args));
}
assert.throws(() => runTool('delete_articles', {}));
assert.equal(JSON.stringify(archive), before);
const raw = '{"title":"速報","content":"第一段落\n\n第二段落\ttab"}';
assert.equal(context.extractJson(raw).content, '第一段落\n\n第二段落\ttab');
assert.throws(() => context.extractJson('{"title":"unfinished'), /JSON/);

const model = { name: 'gpt-6-luna', temp: null, top_p: null, top_k: null, min_p: null };
const final = { title: '記事', content: '本文\n\n次の段落' };
const end = () => ({ finish_reason: 'stop', message: { role: 'assistant', content: JSON.stringify(final) } });
const toolCall = (id, name, args) => ({ id, type: 'function', function: { name, arguments: typeof args === 'string' ? args : JSON.stringify(args) } });
const calls = (...items) => ({ finish_reason: 'tool_calls', message: { role: 'assistant', content: null, tool_calls: items } });
let requests, responses;
function mock(choices) {
  requests = []; responses = choices.slice();
  context.fetch = async (url, opts) => {
    requests.push(JSON.parse(opts.body));
    assert.equal(opts.signal.aborted, false);
    assert.ok(responses.length, 'Unexpected extra API request');
    return { ok: true, json: async () => ({ choices: [responses.shift()] }) };
  };
}
const invoke = (endpoint = 'https://api.openai.com/v1/chat/completions', signal = new AbortController().signal, callback) =>
  context.complete(endpoint, 'mock-token', model, 'Write JSON', 'Generate article', signal, archive, callback);

// Settings must round-trip and accept legacy configurations without the field.
const fields = {};
const settingsContext = { $: id => fields[id] ||= { value: '' } };
vm.createContext(settingsContext);
vm.runInContext(script.slice(script.indexOf('const val = id'), script.indexOf('function saveSettings')), settingsContext);
for (const [prefix, effort] of [['news', 'high'], ['news', 'none']]) {
  settingsContext.setModel(prefix, { ...model, reasoning_effort: effort, prompt: 'Write JSON' });
  const saved = settingsContext.readModel(prefix);
  assert.equal(saved.reasoning_effort, effort);
  settingsContext.validateModel(saved, prefix);
  settingsContext.setModel(prefix, JSON.parse(JSON.stringify(saved)));
  assert.equal(settingsContext.readModel(prefix).reasoning_effort, effort);
}
settingsContext.setModel('news', { ...model, prompt: 'Write JSON' });
assert.equal(settingsContext.readModel('news').reasoning_effort, null);
assert.throws(() => settingsContext.validateModel({ ...model, reasoning_effort: 'invalid' }, 'news'), /reasoning_effort/);

const configContext = { DEFAULT_ENDPOINT: 'http://localhost:8766/api' };
vm.createContext(configContext);
vm.runInContext(script.slice(script.indexOf('const LEGACY_NEWS_PROMPT'), script.indexOf('let config =')), configContext);
vm.runInContext(script.slice(script.indexOf('const isObject ='), script.indexOf('if (!validateConfig(config))')), configContext);
vm.runInContext(script.slice(script.indexOf('function migrateConfig'), script.indexOf('function currentWorld')), configContext);
vm.runInContext(`
  const fresh = defaultConfig();
  if (!validateConfig(fresh)) throw new Error('Single-model configuration is invalid');
  if ('translation_model' in fresh.world['world-1']) throw new Error('Translation model remains in defaults');
  const legacy = defaultConfig();
  legacy.world['world-1'].news_model.prompt = LEGACY_NEWS_PROMPT;
  legacy.world['world-1'].translation_model = modelDefaults();
  if (!validateConfig(legacy)) throw new Error('Legacy backup is invalid');
  migrateConfig(legacy);
  if (legacy.world['world-1'].news_model.prompt !== DEFAULT_NEWS_PROMPT) throw new Error('Legacy default prompt was not migrated');
  if ('translation_model' in legacy.world['world-1']) throw new Error('Legacy translation model was not removed');
  legacy.world['world-1'].news_model.prompt = 'Custom editorial instructions';
  migrateConfig(legacy);
  if (legacy.world['world-1'].news_model.prompt !== 'Custom editorial instructions') throw new Error('Custom prompt changed');
`, configContext);
assert.equal(html.includes('id="transModel"'), false);

(async () => {
  for (const effort of ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']) {
    for (const endpoint of ['https://api.openai.com/v1/chat/completions', 'http://localhost:8766/api']) {
      mock([calls(toolCall('effort', 'search_articles', {})), end()]);
      await context.complete(endpoint, 'mock-token', { ...model, reasoning_effort: effort }, 'Write JSON', 'Generate article', new AbortController().signal, archive);
      assert.ok(requests.every(body => body.reasoning_effort === effort));
    }
  }
  for (const effort of [undefined, null, '']) {
    mock([end()]);
    await context.complete('http://localhost:8766/api', 'mock-token', { ...model, name: 'custom-model', reasoning_effort: effort }, 'Write JSON', 'Generate article', new AbortController().signal, archive);
    assert.equal('reasoning_effort' in requests[0], false);
  }
  mock([calls(toolCall('s1', 'search_articles', { query: '港' }), toolCall('s2', 'search_articles', { sort_key: 'reaction_count', sort_order: 'desc' })), calls(toolCall('s3', 'search_articles', { sort_key: 'sequence', sort_order: 'asc', limit: 1 })), end()]);
  const progress = [];
  assert.deepEqual(JSON.parse(await invoke(undefined, undefined, x => progress.push(x))), final);
  assert.equal(requests.length, 3);
  assert.equal(requests[0].reasoning_effort, 'medium');
  assert.equal(requests[0].response_format.json_schema.strict, true);
  assert.deepEqual(requests[0].tools.map(x => x.function.name), ['search_articles']);
  const parameters = requests[0].tools[0].function.parameters;
  assert.deepEqual(parameters.properties.sort_key.enum, ['sequence', 'date', 'title', 'reaction_count']);
  assert.deepEqual(parameters.properties.sort_order.enum, ['asc', 'desc']);
  assert.ok(parameters.required.includes('sort_key') && parameters.required.includes('sort_order'));
  assert.equal('sort' in parameters.properties, false);
  assert.equal('temperature' in requests[0], false);
  assert.deepEqual(requests[1].messages.filter(x => x.role === 'tool').map(x => x.tool_call_id), ['s1', 's2']);
  assert.equal(JSON.parse(requests[1].messages[3].content).articles[0].id, 'b');
  assert.equal(requests[2].messages.at(-1).tool_call_id, 's3');
  assert.equal(progress.length, 3);

  mock([calls(toolCall('bad1', 'search_articles', '{bad JSON'), toolCall('bad2', 'unknown', {})), end()]);
  await invoke();
  assert.ok(requests[1].messages.filter(x => x.role === 'tool').every(x => JSON.parse(x.content).error));
  mock([end()]);
  await invoke('http://localhost:8766/api');
  assert.equal('response_format' in requests[0], false);
  assert.equal(requests[0].tools.length, 1);

  mock(Array.from({ length: 6 }, (_, i) => calls(toolCall('loop' + i, 'search_articles', {}))).concat(end()));
  await invoke();
  assert.equal(requests.length, 7);
  assert.equal(requests.at(-1).tool_choice, 'none');
  mock(Array.from({ length: 7 }, (_, i) => calls(toolCall('loop' + i, 'search_articles', {}))));
  await assert.rejects(invoke(), /上限/);
  mock([calls(toolCall('same', 'search_articles', {}), toolCall('same', 'search_articles', {}))]);
  await assert.rejects(invoke(), /ID/);
  mock([calls(...Array.from({ length: 9 }, (_, i) => toolCall('many' + i, 'search_articles', {})))]);
  await assert.rejects(invoke(), /上限/);
  mock([{ finish_reason: 'length', message: { content: 'cut off' } }]);
  await assert.rejects(invoke(), /途中終了/);
  mock([{ finish_reason: 'stop', message: { refusal: 'refused' } }]);
  await assert.rejects(invoke(), /拒否/);
  mock([end()]);
  const cancelled = new AbortController(); cancelled.abort();
  await assert.rejects(invoke(undefined, cancelled.signal), { name: 'AbortError' });
  assert.equal(requests.length, 0);
  mock([calls(toolCall('cancel', 'search_articles', {})), end()]);
  const during = new AbortController();
  await assert.rejects(invoke(undefined, during.signal, () => during.abort()), { name: 'AbortError' });
  assert.equal(requests.length, 1);

  // Japanese generation uses one model conversation, including archive tool rounds.
  const world = { name: 'world', description: 'setting', era_name: 'era', start_date: '0142/04/01', news_source_list: [{ name: '中央通信', description: 'source' }], genre_list: [{ name: '政治' }], news_model: { ...model, prompt: 'Write in English' } };
  world.news_model.reasoning_effort = 'high';
  const stored = { news: structuredClone(archive), sourceBucket: [], genreBucket: [], dayOffset: 3 };
  Object.assign(context, {
    busy: false, token: 'mock-token', config: { currentWorld: 'world', llm: { endpoint: 'https://api.openai.com/v1/chat/completions' } },
    currentWorld: () => world, currentData: () => stored, clone: structuredClone,
    pickFromBucket: (_, available) => ({ value: available[0], remaining: [] }),
    dateAt: () => '0142/04/04', interpolate: text => text, AbortController,
    renderFeed() {}, renderLoading() {}, renderShell() {}, persist() {}, uid: () => 'new',
    activeView: 'feed', toast: message => { throw new Error(message); }
  });
  vm.runInContext(script.slice(script.indexOf('async function generateNews'), script.indexOf('function cancelGeneration')), context);
  mock([calls(toolCall('news-search', 'search_articles', { query: '港' })), end()]);
  await context.generateNews();
  assert.equal(requests.length, 2);
  assert.equal(responses.length, 0);
  assert.deepEqual(requests.map(body => body.reasoning_effort), ['high', 'high']);
  assert.equal(requests[1].messages.at(-1).tool_call_id, 'news-search');
  assert.match(requests[0].messages[0].content, /Write the title and content directly in Japanese, even if earlier instructions request another language/);
  assert.match(requests[0].messages[1].content, /directly in Japanese/);
  assert.equal(stored.news.length, 4);
  assert.equal(stored.dayOffset, 4);
  assert.equal(stored.news.at(-1).content, final.content);
  console.log('PASS: archive filtering/sorting/pagination, immutable results, JSON repair, tool loops, error recovery, limits, cancellation, reasoning settings, legacy migration, and direct Japanese generation');
})().catch(err => { console.error(err); process.exitCode = 1; });
