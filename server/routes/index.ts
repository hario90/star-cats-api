var express = require('express');
var router = express.Router();
import * as path from "path";

/* GET home page. */
router.get('/', function(req: any, res: any, next: any) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

module.exports = router;
