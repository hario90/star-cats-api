var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req: any, res: any, next: any) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

module.exports = router;
