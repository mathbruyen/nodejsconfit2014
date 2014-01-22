var koa = require('koa');
var app = koa();
var fs = require('fs');
var route = require('koa-route');
var serve = require('koa-static');
var summarizer = require('mathsync').summarizer;

// Body
require('koa-body-parser')(app);

// Session management
var session = require('koa-session');
var uuid = require('node-uuid');
app.keys = [process.env.SESSION_KEY];
app.use(session());
app.use(function* (next) {
  if (!this.session.id) {
    this.session.id = uuid.v4();
  }
  yield next;
});

// Logging
app.use(function* (next) {
  var start = new Date;
  yield next;
  var ms = new Date - start;
  console.log('%s %s - %sms - %s', this.method, this.url, ms, this.session.id);
});

function serializeQuestion(question) {
  var str = question.qid + ':' + question.q;
  return new Uint8Array(new Buffer(str, 'utf-8')).buffer;
}

require('./public/couchstore')('http://@mathbr.cloudant.com').then(function (api) {

  app.use(route.get('/summary/:level', function* (level) {
    var s = summarizer.fromItems(api.getQuestions(), serializeQuestion);
    this.body = yield s(level);
  }));

  app.use(route.post('/question', function* () {
    var query = yield* this.request.urlencoded();
    yield api.askQuestion(query.question, this.session.id);
    this.body = 'Question added!';
    this.response.redirect('/');
  }));

  app.use(route.post('/rank', function* () {
    var query = yield* this.request.urlencoded();
    var rank = parseInt(query.rank, 10);
    yield api.rankQuestion(query.question, this.session.id, rank);
    this.body = 'Rank added!';
    this.response.redirect('/');
  }));

  app.use(route.post('/score', function* () {
    var query = yield* this.request.urlencoded();
    var score = parseInt(query.score, 10);
    yield api.scoreSlide(query.slide, this.session.id, score);
    this.body = 'Score added!';
    this.response.redirect('/');
  }));

  app.use(serve('public'));

  app.listen(process.env.PORT);
}).then(function() {
  console.log('Exposed API');
}, function (err) {
  console.log('Failed to load db: ' + err);
});
