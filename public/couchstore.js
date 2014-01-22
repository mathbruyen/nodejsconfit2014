var q = require('q');

module.exports = function (url) {
  var nano = require('nano')(url);
  var db = nano.db.use('nodejsconfit');

  // { guid: { q: 'xxx?', req: 'session', t: 123 } }
  var questions = {};

  // { question_guid: { voter_session: { rank: 1-5 } } }
  var ranks = {};

  // { slide_id: { voter_session: { score: 1-5 } } }
  var votes = {};

  var insert = q.nbind(db.insert, db);
  var get = q.nbind(db.get, db);
  var list = q.nbind(db.list, db);

  function askQuestion(question, requester) {
    if (question.length < 5) {
      return q.reject('Invalid question: ' + question);
    }

    var obj = { q: question, req: requester, t: Date.now() };
    return insert(obj).then(function (body) {
      questions[body[0].id] = obj;
    });
  }

  function getQuestions() {
    var q = [];
    for (qid in questions) {
      q.push({ qid: qid, q: questions[qid].q });
    }
    return q;
  }

  function rankQuestion(question, requester, rank) {
    if (rank >= 0 && rank <= 5) {
      return q.reject('Invalid rank: ' + rank);
    }

    if (!questions[question]) {
      return q.reject('Question ' + question + ' does not exist and cannot be ranked');
    }

    if (!ranks[question]) {
      ranks[question] = {};
    }

    var obj = ranks[question][requester] || { qid: question, req: requester };
    obj.rank = rank;

    var id = question + '_' + requester;
    return insert(obj, id).then(function (body) {
      obj._rev = body[0].rev;
    });
  }

  function scoreSlide(slide, requester, score) {
    if (score >= 0 && score <= 5) {
      return q.reject('Invalid score: ' + score);
    }
    if (!votes[slide]) {
      return q.reject('Slide ' + slide + ' does not exist and cannot be scored');
    }

    var obj = votes[slide][requester] || { sid: slide, req: requester };
    obj.score = score;

    var id = slide + '_' + requester;
    return insert(obj, id).then(function (body) {
      obj._rev = body[0].rev;
    });
  }

  var api = {
    askQuestion: askQuestion,
    rankQuestion: rankQuestion,
    scoreSlide: scoreSlide,
    getQuestions: getQuestions
  };

  return list().then(function (body) {
    var promises = [];
    body[0].rows.forEach(function (row) {
      promises.push(get(row.id).then(function (doc) {
        doc = doc[0];
        if (doc.q) {
          questions[doc._id] = doc;
        } else if (doc.rank) {
          if (!ranks[doc.qid]) {
            ranks[doc.qid] = {};
          }
          ranks[doc.qid][doc.req] = doc;
        } else if (doc.score) {
          if (!slides[doc.sid]) {
            slides[doc.sid] = {};
          }
          slides[doc.sid][doc.req] = doc;
        }
      }));
    });
    return q.all(promises);
  }).then(function () {
    return api;
  });
}