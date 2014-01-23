init:
	nvm use 0.11
	npm install .
	npm install forever -g

start:
	env SESSION_KEY=wannatesting PORT=8080 COUCH_URL=http://localhost:5984 forever start -c "node --harmony" index.js
