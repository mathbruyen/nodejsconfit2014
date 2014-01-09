init:
	npm link ../javascript/core
	npm install .

start:
	env SESSION_KEY=wannatesting PORT=8085 node --harmony index.js
