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
assert.deepEqual(runTool('sort_articles', { sort: 'oldest' }).articles.map(x => x.id), ['a', 'b', 'c']);
assert.equal(runTool('sort_articles', { sort: 'reacted' }).articles[0].id, 'b');
assert.deepEqual(runTool('sort_articles', { sort: 'title' }).articles.map(x => x.title), archive.map(x => x.title).sort((a, b) => a.localeCompare(b, 'ja')));
const page = runTool('sort_articles', { offset: 1, limit: 1 });
assert.equal(page.total, 3);
assert.equal(page.next_offset, 2);
assert.equal(page.has_more, true);
assert.equal(runTool('sort_articles', { offset: 10 }).next_offset, null);
assert.equal(runTool('search_articles', { query: 'missing' }).total, 0);
assert.equal(runTool('sort_articles', {}, []).total, 0);
assert.equal(runTool('sort_articles', {}, [{ ...archive[0], content: 'x'.repeat(7000) }]).articles[0].content_truncated, true);
for (const args of [{ limit: 11 }, { offset: -1 }, { limit: 1.5 }, { sort: 'invalid' }, { author: [] }, { query: 1 }, { extra: 1 }]) {
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

(async () => {
  mock([calls(toolCall('s1', 'search_articles', { query: '港' }), toolCall('s2', 'sort_articles', { sort: 'reacted' })), calls(toolCall('s3', 'sort_articles', { sort: 'oldest', limit: 1 })), end()]);
  const progress = [];
  assert.deepEqual(JSON.parse(await invoke(undefined, undefined, x => progress.push(x))), final);
  assert.equal(requests.length, 3);
  assert.equal(requests[0].reasoning_effort, 'none');
  assert.equal(requests[0].response_format.json_schema.strict, true);
  assert.deepEqual(requests[0].tools.map(x => x.function.name), ['search_articles', 'sort_articles']);
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
  assert.equal(requests[0].tools.length, 2);

  mock(Array.from({ length: 6 }, (_, i) => calls(toolCall('loop' + i, 'sort_articles', {}))).concat(end()));
  await invoke();
  assert.equal(requests.length, 7);
  assert.equal(requests.at(-1).tool_choice, 'none');
  mock(Array.from({ length: 7 }, (_, i) => calls(toolCall('loop' + i, 'sort_articles', {}))));
  await assert.rejects(invoke(), /上限/);
  mock([calls(toolCall('same', 'sort_articles', {}), toolCall('same', 'sort_articles', {}))]);
  await assert.rejects(invoke(), /ID/);
  mock([calls(...Array.from({ length: 9 }, (_, i) => toolCall('many' + i, 'sort_articles', {})))]);
  await assert.rejects(invoke(), /上限/);
  mock([{ finish_reason: 'length', message: { content: 'cut off' } }]);
  await assert.rejects(invoke(), /途中終了/);
  mock([{ finish_reason: 'stop', message: { refusal: 'refused' } }]);
  await assert.rejects(invoke(), /拒否/);
  mock([end()]);
  const cancelled = new AbortController(); cancelled.abort();
  await assert.rejects(invoke(undefined, cancelled.signal), { name: 'AbortError' });
  assert.equal(requests.length, 0);
  mock([calls(toolCall('cancel', 'sort_articles', {})), end()]);
  const during = new AbortController();
  await assert.rejects(invoke(undefined, during.signal, () => during.abort()), { name: 'AbortError' });
  assert.equal(requests.length, 1);

  // Exercise the real generateNews caller so both stages must expose and run tools.
  const world = { name: 'world', description: 'setting', era_name: 'era', start_date: '0142/04/01', news_source_list: [{ name: '中央通信', description: 'source' }], genre_list: [{ name: '政治' }], news_model: { ...model, prompt: 'English JSON' }, translation_model: { ...model, prompt: 'Japanese JSON' } };
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
  mock([calls(toolCall('news-search', 'search_articles', { query: '港' })), end(), calls(toolCall('translation-sort', 'sort_articles', { sort: 'oldest' })), end()]);
  await context.generateNews();
  assert.equal(requests.length, 4);
  assert.equal(requests[1].messages.at(-1).tool_call_id, 'news-search');
  assert.equal(requests[3].messages.at(-1).tool_call_id, 'translation-sort');
  assert.equal(requests[2].messages.length, 2, 'Translation has an independent conversation');
  assert.equal(stored.news.length, 4);
  assert.equal(stored.dayOffset, 4);
  assert.equal(stored.news.at(-1).content, final.content);
  console.log('PASS: archive filtering/sorting/pagination, immutable results, JSON repair, multi-call and multi-round loops, error recovery, limits, cancellation, and generation + translation integration');
})().catch(err => { console.error(err); process.exitCode = 1; });
