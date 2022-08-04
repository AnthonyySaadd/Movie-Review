const express = require("express");
require("express-async-errors"); // we don't need to tap anything inside our try catch block
const{errorHandler}=require("./middlewares/error");
require("dotenv").config();
require("./db");
const userRouter = require("./routes/user");

const app = express();
app.use(express.json());
app.use("/api/user", userRouter);
app.use(errorHandler);





app.listen(8000, () => {
  console.log("the port is listening on port 8000");
});
