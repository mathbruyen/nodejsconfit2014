function serializeQuestion(question) {
  var str = question.qid + ':' + question.q;
  return new Uint8Array(new Buffer(str, 'utf-8')).buffer;
}

function deserializeQuestion(buffer) {
  var str = new Buffer(new Uint8Array(buffer)).toString('utf-8');
  var arr = str.split(':', 2);
  return { qid: arr[0], q: q[1] };
}

module.exports = {
  serializeQuestion: serializeQuestion,
  deserializeQuestion: deserializeQuestion,
}
