import express from "express"
import mysql from "mysql"
import cors from "cors"
import bodyParser from "body-parser";
import * as dotenv from 'dotenv'
dotenv.config()
const app = express()


var mysql_pool = mysql.createPool({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USERNAME,
    password : process.env.RDS_PASSWORD,
    port     : process.env.RDS_PORT,
    database : process.env.RDS_DATABASE
});

app.use(express.json())
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))

app.get("/", (req,res) => {
    res.json("hello this is backend")
})

app.get("/events", (req, res) => {
    const q = "select * from Events"
    mysql_pool.getConnection(function(err, connection) {
		if (err) {
			connection.release();
	  		console.log(' Error getting mysql_pool connection: ' + err);
	  		throw err;
	  	}
	    connection.query(q, function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				res.json(data); 
			} else {
				res.json(rows); 
			}
			console.log(' mysql_pool.release()');
			connection.release();
	    });
	});
})

app.post("/select", (req, res) => {
    const q = req.body.query
    const b = req.body.bind
    mysql_pool.getConnection(function(err, connection) {
		if (err) {
			connection.release();
	  		console.log(' Error getting mysql_pool connection: ' + err);
	  		throw err;
	  	}
	    connection.query(q, b,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				res.json(data); 
			} else {
				res.json(rows); 
			}
			console.log(' mysql_pool.release()');
			connection.release();
	    });
	});
})

app.post("/insert", (req, res) => {
    const q = req.body.query
    const b = req.body.bind 
    mysql_pool.getConnection(function(err, connection) {
		if (err) {
			connection.release();
	  		console.log(' Error getting mysql_pool connection: ' + err);
	  		throw err;
	  	}
	    connection.query(q, b,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"", "err": "" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
                data["err"] = err2;
				res.json(data); 
			} else {
				res.json(rows); 
			}
			console.log(' mysql_pool.release()');
			connection.release();
	    });
	});
})

app.listen(8800, ()=>{
    console.log("connect from backend")
})
