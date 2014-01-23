init:
	npm install .
	npm install -g forever
	npm install -g browserify

daemon:
	browserify -e browser.js -o public/browser.js
	browserify -e flowtime.js -o public/flowtime.js
	env SESSION_KEY=wannatesting PORT=8080 COUCH_URL=http://localhost:5984 forever start -c "node --harmony" index.js

start:
	browserify -e browser.js -o public/browser.js
	browserify -e flowtime.js -o public/flowtime.js
	env SESSION_KEY=wannatesting PORT=8080 COUCH_URL=http://localhost:5984 node --harmony index.js
