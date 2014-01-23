function serializeQuestion(question) {
  var str = question.qid + ':' + question.q;
  return new Uint8Array(new Buffer(str, 'utf-8')).buffer;
}

function serializeQuestionWithRank(question) {
  var str = question.qid + ':' + Math.floor(question.rank * 10) + ':' + question.q;
  return new Uint8Array(new Buffer(str, 'utf-8')).buffer;
}

function deserializeQuestion(buffer) {
  var str = new Buffer(new Uint8Array(buffer)).toString('utf-8');
  var arr = str.split(':', 2);
  return { qid: arr[0], q: arr[1] };
}

function deserializeQuestionWithRank(buffer) {
  var str = new Buffer(new Uint8Array(buffer)).toString('utf-8');
  var arr = str.split(':', 3);
  return { qid: arr[0], rank: parseInt(arr[1], 10) / 10, q: arr[2] };
}

module.exports = {
  serializeQuestion: serializeQuestion,
  deserializeQuestion: deserializeQuestion,
  serializeQuestionWithRank: serializeQuestionWithRank,
  deserializeQuestionWithRank: deserializeQuestionWithRank
}
