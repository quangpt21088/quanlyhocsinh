const fs = require('fs');
var d = 'D:\\Quang\\kilocode\\backend';
var w = function(f,c){fs.writeFileSync(d+'\\'+f,c);console.log('OK:'+f)};
console.log('starting...');

// database.js
w('database.js', 'PLACEHOLDER');
