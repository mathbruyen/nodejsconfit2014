var request = require('superagent');

require('./storagestore')(window.localStorage).then(function (api) {

  var parent = document.getElementById('audiencequestions');
  var elements = [];
  var elem;
  for (var i = 0; i < 9; i++) {
    elem = document.createElement('li');
    parent.appendChild(elem);
    elem.textContent = '-';
    elements.push(elem);
  }

  function sync() {
    api.syncQuestionsWithRanks().then(function () {
      var q = api.getQuestions();
      q.sort(function (e1, e2) {
        return e2.rank - e1.rank;
      });
      for (var i = 0; i < Math.min(q.length, elements.length); i++) {
        elements[i].textContent = q[i].q;
      }
    });
  }
  setInterval(sync, 5000);

  // update current slide
  Flowtime.addEventListener('flowtimenavigation', updateCurrentSlide);
  function updateCurrentSlide(e) {
    request.post('/currentSlide').send({ currentSlide: window.location.hash.substring(2) }).end(function (res) {
      if (res.ok) {
        console.log('Updated slide');
      } else {
        console.log('Failed to update slide');
      }
    });
  }
});
