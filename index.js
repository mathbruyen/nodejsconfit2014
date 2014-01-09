var koa = require('koa');
var app = koa();
var fs = require('fs');
var route = require('koa-route');
var serve = require('koa-static');

var data = [];

function serialize(item) {
  var buffer = new Buffer(item.key + ':' + item.value, 'utf-8');
  return new Uint8Array(buffer).buffer;
}
var summarizer = require('mathsync/src/summarizer').fromItems(data, serialize, require('mathsync/src/sha1'), 3);

app.use(function *(next){
  var start = new Date;
  yield next;
  var ms = new Date - start;
  console.log('%s %s - %s', this.method, this.url, ms);
});

app.use(route.get('/summary/:level', function* (level) {
  this.body = yield summarizer(level | 0);
}));

app.use(serve('public'));

app.listen(8085);
