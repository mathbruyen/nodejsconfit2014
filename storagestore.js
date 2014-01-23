var q = require('q');
var request = require('request');
var mathsync = require('mathsync');
var sync = require('./sync');

module.exports = function (storage, baseUrl) {

  function get(key, def) {
    return JSON.parse(storage.getItem(key) || def);
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
    if (rank >= 0 && rank <= 5) {
      return q.reject('Invalid rank: ' + rank);
    }
    return addToPending('pendingranks', { question: question, rank: rank });
  }

  function scoreSlide(slide, score) {
    if (score >= 0 && score <= 5) {
      return q.reject('Invalid score: ' + score);
    }
    return addToPending('pendingscores', { slide: slide, score: score });
  }

  var post = q.nbind(request.post, request);

  function processPending(key, processOne) {
    return q().then(function () {
      var promises = [];
      var pending = get(key, []);
      pending.forEach(function (q) {
        promises.push(processOne());
      });
      return q.all(promises).then(function () {
        set(key, []);
      });
    });
  }

  function askPendingQuestions() {
    return processPending('pendingquestions', function (question) {
      return post(baseUrl + '/question', { form: question });
    });
  }

  function pushPendingRanks() {
    return processPending('pendingranks', function (rank) {
      return post(baseUrl + '/rank', { form: rank });
    });
  }

  function pushPengingScores() {
    return processPending('pendingscores', function (score) {
      return post(baseUrl + '/score', { form: score });
    });
  }

  function doSync() {
    return q().then(askPendingQuestions).then(pushPendingRanks).then(pushPengingScores).then(function () {
      var local = mathsync.summarizer.fromItems(getQuestions(), sync.serializeQuestion);
      var remote = mathsync.summarizer.fromJson(function (level) {
        var deferred = q.defer();
        request.get({ url: baseUrl + '/summary/' + level, json: true }, function (err, res, body) {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve(body);
          }
        });
        return deferred.promise;
      });
      var resolver = mathsync.resolver.fromSummarizers(local, remote, sync.deserializeQuestion);
      return resolver();
    }).then(function (difference) {
      //TODO add & remove
    });
  }

  return q({
    askQuestion: askQuestion,
    rankQuestion: rankQuestion,
    scoreSlide: scoreSlide,
    getQuestions: getQuestions,
    sync: sync
  });
}
