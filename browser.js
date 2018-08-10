var request = require('superagent');

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

  // Score slides
  var slideElement = document.getElementById('slidetitle');
  function scoreCurrentSlide(score) {
    if (slideElement.textContent.length > 0) {
      api.scoreSlide(slideElement.textContent, score);
      // TODO handle promise
    }
  }
  readButtons(slideElement, scoreCurrentSlide);
  function getLastSlide() {
    request.get('/currentSlide').end(function (err, res) {
      if (!err) {
        slideElement.textContent = res.text;
      }
    });
  }
  setInterval(getLastSlide, 5000);

  // Ask questions
  var submitQuestionElement = document.getElementById('askquestion');
  var textQuestionElement = document.getElementById('questiontext');
  submitQuestionElement.addEventListener('submit', function (e) {
    e.preventDefault();
    api.askQuestion(textQuestionElement.value).then(function () {
      textQuestionElement.value = '';
    });
    // TODO handle failure
  });

  // Rank questions
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
  setInterval(changeQuestion, 10000);
  changeQuestion();

  window.nodejsconfit = api;
  console.log('Installed');
});
