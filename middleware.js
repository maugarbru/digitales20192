const express = require("express");
var router =  express();
router.use(function(req, res, next) {
  next();
});

module.exports = router;
