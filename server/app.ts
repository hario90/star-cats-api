import * as express from "express";
import * as path from "path";

var indexRouter = require("./routes/index");

var app = express();

// view engine setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname)));

app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function (req: any, res: any, next: any) {
    next({
        status: 404,
    });
});

// error handler
app.use(function (err: any, req: any, res: any, next: any) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: err,
    });
});

export { app };
