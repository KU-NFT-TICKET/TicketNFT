import express from "express"
import mysql from "mysql"
import cors from "cors"
import bodyParser from "body-parser";
import * as dotenv from 'dotenv'
dotenv.config()
const app = express()


var con = mysql.createConnection({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
    port     : process.env.RDS_PORT,
    database : process.env.RDS_DATABASE
});
con.connect((err) => {
    if (err) {
      console.log('error connecting: ' + err.stack);
      return;
    }
    console.log('success');
  });
app.use(express.json())
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))

app.get("/", (req,res) => {
    res.json("hello this is backend")
})

app.get("/events", (req, res) => {
    const q = "select * from Events"
    con.query(q, (err, data) => {
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.post("/select", (req, res) => {
    const q = req.body.query
    // console.log(q)
    con.query(q, (err,data) => {
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.listen(8800, ()=>{
    console.log("connect from backend")
})
