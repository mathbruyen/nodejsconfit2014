require('./storagestore')(window.localStorage).then(function (api) {

  setInterval(api.doSync, 5000);

  function readButtons(start, cb) {
    var v;
    while (start.nextSibling) {
      start = start.nextSibling;
      v = parseInt(start.textContent, 10);
      if (v) {
        (function () {
          var value = v;
          start.addEventListener('click', function () {
            cb(value);
          });
        })();
      }
    }
  }

  var questionElement = document.getElementById('rankedquestion');
  function rankCurrentQuestion(rank) {
    if (rankedQuestion) {
      api.rankQuestion(rankedQuestion.qid, rank);
      // TODO handle promise
    }
  }
  readButtons(questionElement, rankCurrentQuestion);
  var rankedQuestion;
  function changeQuestion() {
    var q = api.getQuestions();
    if (q.length > 0) {
      var idx = Math.floor(Math.random() * q.length);
      rankedQuestion = q[idx];
      questionElement.textContent = rankedQuestion.q;
    }
  }
  setInterval(changeQuestion, 5000);
  changeQuestion();

  window.nodejsconfit = api;
  console.log('Installed');
});