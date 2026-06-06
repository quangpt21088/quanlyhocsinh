const fs = require('fs'); const d = 'D:\\Quang\\kilocode\\backend'; function w(f,c){fs.writeFileSync(d+'\\'+f,c);console.log('OK:'+f)} console.log('step1 ready');w('database.js', 'test2'); 
