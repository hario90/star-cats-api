var express = require("express");
var router = express.Router();
import { type NextFunction, type Request, type Response } from "express";

router.get("", function (req: Request, res: Response, next: NextFunction) {
    res.status(200).json({
        status: "ok"
    });
});

module.exports = router;
