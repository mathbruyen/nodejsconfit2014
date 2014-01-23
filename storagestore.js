var q = require('q');
var request = require('superagent');
var mathsync = require('mathsync');
var sync = require('./sync');

module.exports = function (storage) {

  function get(key, def) {
    var str = storage.getItem(key);
    if (!str) {
      return def;
    }
    return JSON.parse(str);
  }

  function set(key, value) {
    storage.setItem(key, JSON.stringify(value));
  }

  function addToPending(bucket, toAdd) {
    return q().then(function () {
      var pending = get(bucket, []);
      pending.push(toAdd);
      set(bucket, pending);
    });
  }

  function askQuestion(question) {
    if (question.length < 5) {
      return q.reject('Invalid question: ' + question);
    }
    return addToPending('pendingquestions', { question: question });
  }

  function getQuestions() {
    var q = [];
    var key, value;
    for (var i = 0; i < storage.length; i++) {
      key = storage.key(i);
      value = get(key);
      if (value.q) {
        q.push(value);
      }
    }
    return q;
  }

  function rankQuestion(question, rank) {
    if (rank < 1 || rank > 5) {
      return q.reject('Invalid rank: ' + rank);
    }
    return addToPending('pendingranks', { question: question, rank: rank });
  }

  function scoreSlide(slide, score) {
    if (score < 1 || score > 5) {
      return q.reject('Invalid score: ' + score);
    }
    return addToPending('pendingscores', { slide: slide, score: score });
  }

  var post = function (path, form) {
    var deferred = q.defer();
    request.post(path).send(form).end(function (res) {
      if (res.ok) {
        deferred.resolve();
      } else {
        deferred.reject(res.text);
      }
    });
    return deferred.promise;
  }

  function processPending(key, processOne) {
    var pending = get(key, []);
    set(key, []);
    var p = q();
    for (var i = 0; i < pending.length; i++) {
      (function () {
        var j = i;
        p = p.then(function () {
          return processOne(pending[j]);
        });
      })();
    }
    return p;
  }

  function askPendingQuestions() {
    return processPending('pendingquestions', function (question) {
      return post('/question', question);
    });
  }

  function pushPendingRanks() {
    return processPending('pendingranks', function (rank) {
      return post('/rank', rank);
    });
  }

  function pushPengingScores() {
    return processPending('pendingscores', function (score) {
      return post('/score', score);
    });
  }

  function doSync() {
    return q().then(askPendingQuestions).then(pushPendingRanks).then(pushPengingScores).then(function () {
      var local = mathsync.summarizer.fromItems(getQuestions(), sync.serializeQuestion);
      var remote = mathsync.summarizer.fromJSON(function (level) {
        var deferred = q.defer();
        request.get('/summary/' + level).end(function (res) {
          if (res.ok) {
            deferred.resolve(res.body);
          } else {
            deferred.reject(res.text);
          }
        });
        return deferred.promise;
      });
      var resolver = mathsync.resolver.fromSummarizers(local, remote, sync.deserializeQuestion);
      return resolver();
    }).then(function (difference) {
      difference.removed.forEach(function (item) {
        storage.removeItem(item.qid);
      });
      difference.added.forEach(function (item) {
        set(item.qid, item);
      });
    });
  }

  function syncQuestionsWithRanks() {
    return q().then(function () {
      var local = mathsync.summarizer.fromItems(getQuestions(), sync.serializeQuestionWithRank);
      var remote = mathsync.summarizer.fromJSON(function (level) {
        var deferred = q.defer();
        request.get('/summaryWithRank/' + level).end(function (res) {
          if (res.ok) {
            deferred.resolve(res.body);
          } else {
            deferred.reject(res.text);
          }
        });
        return deferred.promise;
      });
      var resolver = mathsync.resolver.fromSummarizers(local, remote, sync.deserializeQuestionWithRank);
      return resolver();
    }).then(function (difference) {
      difference.removed.forEach(function (item) {
        storage.removeItem(item.qid);
      });
      difference.added.forEach(function (item) {
        set(item.qid, item);
      });
    });
  }

  return q({
    askQuestion: askQuestion,
    rankQuestion: rankQuestion,
    scoreSlide: scoreSlide,
    getQuestions: getQuestions,
    doSync: doSync,
    syncQuestionsWithRanks: syncQuestionsWithRanks
  });
}
