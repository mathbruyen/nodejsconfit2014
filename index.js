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

// [{ question: 'xxx?', requester: 'session', time: 123 }] index = question id
var questions = [];

// [{ voter_session: 1-5 }] index = question id
var ranks = [];
var average_rank = [];

// { slide_id: { voter_session: 1-5 }}
var votes = {};
var average_slide = {};

function serialize(item) {
  return new Uint8Array(new Buffer(item, 'utf-8')).buffer;
}

var current = summarizer.fromItems([], serialize);
function updateSummarizer() {
  var i, l, slides, slide;
  var data = [];

  // question => q:question_id:average_rank:question
  l = questions.length;
  for (i = 0; i < l; i++) {
    data.push(['q', i, average_rank[i] || 0, questions[i].question].join(':'));
  }

  // slide vote => v:slide_id:average_score
  slides = Object.keys(average_slide);
  l = slides.length;
  for (i = 0; i < l; i++) {
    slide = slides[i];
    data.push(['v', slide, average_slide[slide]].join(':'));
  }

  current = summarizer.fromItems(data, serialize);
}

app.use(route.get('/summary/:level', function* (level) {
  this.body = yield current(level | 0);
}));

app.use(route.post('/question', function* () {
  var query = yield* this.request.urlencoded();
  if (query.question && query.question.length > 5) {
    questions.push({ question: query.question, requester: this.session.id, time: Date.now() });
    updateSummarizer();
  }
  this.body = 'Question added!';
  this.response.redirect('/');
}));

app.use(serve('public'));

app.listen(process.env.PORT);
