import express from "express"
import mysql from "mysql"
import cors from "cors"
import bodyParser from "body-parser";
import https from "https";
import fs from "fs";
// import * as dotenv from 'dotenv'
import dotenv from 'dotenv'
dotenv.config()
const app = express()

console.log(process.env.RDS_HOSTNAME)

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

const middleware = (req, res, next) => {
	if (req.headers.authorization === process.env.RDS_API_TOKEN) {
		next()
	} else {
		res.status(403)
		res.send("Token invalid.")
	}
}; 

app.get("/", (req,res) => {
    res.json("hello this is backend")
})

app.get("/accounts/all", middleware, (req, res) => {
    const query = "select * from Accounts"
    const bind = req.params.address
    mysql_pool.getConnection(function(err, connection) {
		if (err) {
			connection.release();
	  		console.log(' Error getting mysql_pool connection: ' + err);
	  		throw err;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.get("/account/:address", middleware, (req, res) => {
    let query = "select * from Accounts where address = ?"
    const bind = req.params.address

    if ('is_removed' in req.query) {
		if (req.query.is_removed === 'false') {
			query += " and removed_date is null"
		} else if (req.query.is_removed === 'true') {
			query += " and removed_date is not null"
		} else {
			res.status(400);
    		res.send("<is_removed> must be 'false' or 'true'");
		}
	}
    mysql_pool.getConnection(function(err, connection) {
		if (err) {
			connection.release();
	  		console.log(' Error getting mysql_pool connection: ' + err);
	  		throw err;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				data["err"] = err2;
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.get("/account", middleware, (req, res) => {
    let query = "select * from Accounts"

    let conditions = []
    let bind = []
    if (Object.keys(req.query).length > 0) {
    	if ('username' in req.query) {
			conditions.push("username = ?")
			bind.push(req.query.username)
		} else if ('email' in req.query) {
			conditions.push("email = ?")
			bind.push(decodeURIComponent(req.query.email))
		}

		if (conditions.length > 0) {
			let condition_str = " where " + conditions.join(" and ")
			query += condition_str
		} else {
			res.status(400);
    		res.send("request.query invalid");
		}
    } else {
    	res.status(400);
    	res.send("request.query not found");
    }
    
    mysql_pool.getConnection(function(err, connection) {
		if (err) {
			connection.release();
	  		console.log(' Error getting mysql_pool connection: ' + err);
	  		throw err;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				data["err"] = err2;
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.post("/all_accounts_except", middleware, (req, res) => {
    const query = "select address, username from Accounts where address != ? and removed_date is null order by username"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.post("/account", middleware, (req, res) => {
    const query = "insert into Accounts (Address, username, thai_id) values (?, ?, ?)"
    let bind = []

    if (!('address' in req.body)) {
		res.status(400);
    	res.send("input 'address' not found");
	} else if (!('username' in req.body)) {
		res.status(400);
    	res.send("input 'username' not found");
	} else if (!('thai_id' in req.body)) {
		res.status(400);
    	res.send("input 'thai_id' not found");
	} else {
		bind = [req.body.address, req.body.username, req.body.thai_id]
	}

	mysql_pool.getConnection(function(err, connection) {
		if (err) {
			connection.release();
	  		console.log(' Error getting mysql_pool connection: ' + err);
	  		throw err;
	  	}
	    connection.query(query, bind,function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"", "err": "" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
                data["err"] = err2;
				console.log(err2)
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})


app.post("/is_event_owner", middleware, (req, res) => {
    const query = "select * from Accounts as a join Events as e on (a.address = e.creator) where a.address = ? and a.removed_date is null and e.event_id = ?"
    const bind = req.body.bind
    if (bind.length !== 2) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.get("/events/all", middleware, (req, res) => {
    const query = "select * from Events"
    mysql_pool.getConnection(function(err, connection) {
		if (err) {
			connection.release();
	  		console.log(' Error getting mysql_pool connection: ' + err);
	  		throw err;
	  	}
	    connection.query(query, function(err2, rows) {	
	    	if (err2) {
				var data = { "Time":"", "DatabaseStatus":"" };
				data["Time"] = (new Date()).getTime();
				data["DatabaseStatus"] = "Down";
				res.status(500);
				res.json(data); 
			} else {
				res.json(rows); 
			}
			connection.release();
	    });
	});
})

app.post("/event_of_account", middleware, (req, res) => {
    const query = "select event_id, event_name, date_format(date_sell, '%m/%d/%Y %H:%i') as date_sell, date_format(date_event, '%m/%d/%Y %H:%i') as date_event, date_format(date_sell, '%W %d %M %Y %H:%i') as show_date_sell, date_format(date_event, '%W %d %M %Y') as show_date_event, date_format(date_event, '%H:%i') as show_time_event, detail, purchase_limit, venue from Events where creator = ? and event_id = ?"
    const bind = req.body.bind
    if (bind.length !== 2) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.post("/events_of_account", middleware, (req, res) => {
    const query = "select event_id, event_name, DATE_FORMAT(date_sell, '%d %b %Y %T') as date_sell from Events where creator = ?"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.post("/create_event", middleware, (req, res) => {
    const query = "insert into Events (creator, date_event, date_sell, detail, event_name, purchase_limit, venue) values (?, STR_TO_DATE(?,'%Y-%m-%d %H:%i:%s'), STR_TO_DATE(?,'%Y-%m-%d %H:%i:%s'), ?, ?, ?, ?)"
    const bind = req.body.bind
    if (bind.length !== 7) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
    
})


app.post("/delete_event", middleware, (req, res) => {
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		  	const event_id = bind[1]
		  	const del_hold_transfer_sql = "delete from Hold_transfer where event_id = ?"
		    connection.query(del_hold_transfer_sql, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err_step"] = err2;
	                data["err"] = err2;
	                console.log("error 'del_hold_transfer'")
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					console.log("Hold_transfer is deleted.")
					// res.json(rows); 
				}
		    });
		    const del_event_seats_sql = "delete from Seats where event_id = ?"
		    connection.query(del_event_seats_sql, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err_step"] = err2;
	                data["err"] = err2;
	                console.log("error 'del_event_seats'")
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					console.log("seats is deleted.")
					// res.json(rows); 
				}
		    });
		    const del_event_sql = "delete from Events where event_id = ?"
		    connection.query(del_event_sql, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err_step"] = err2;
	                data["err"] = err2;
	                console.log("error 'del_event'")
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					console.log("event is deleted.")
					// res.json(rows); 
					res.end(); 
				}
		    });

		    connection.release();
		});
    }
})


app.post("/update_event", middleware, (req, res) => {
    const query = "update Events set date_event = STR_TO_DATE(?,'%Y-%m-%d %H:%i:%s'), date_sell = STR_TO_DATE(?,'%Y-%m-%d %H:%i:%s'), detail = ?, event_name = ?, purchase_limit = ?, venue = ? where event_id = ? and creator = ?"
    const bind = req.body.bind
    if (bind.length !== 8) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/update_hold_transfer", middleware, (req, res) => {
    const query = "update Hold_transfer set reciever = ? where ticket_id = ? and event_id = ?"
    const bind = req.body.bind
    if (bind.length !== 3) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/create_holdTicket_of_event", middleware, (req, res) => {
    const query = "insert into Hold_transfer (ticket_id, event_id, zone) values(?, ?, ?)"
    const bind = req.body.bind
    if (bind.length !== 3) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.post("/update_holdSeats_of_event", middleware, (req, res) => {
    const query = "update Seats set is_hold = 'Y' where ticket_id in (select ticket_id from Hold_transfer where event_id = ?)"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.post("/update_hold_transfer", middleware, (req, res) => {
    const query = "update Hold_transfer set reciever = ? where ticket_id = ? and event_id = ?"
    const bind = req.body.bind
    if (bind.length !== 3) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/unhold_tickets_of_event", middleware, (req, res) => {
    const query = "update Seats set is_hold = null where ticket_id in (select ticket_id from Hold_transfer where event_id = ? and reciever is null)"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/delete_hold_of_event", middleware, (req, res) => {
    const query = "delete from Hold_transfer where event_id = ? and reciever is null"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/my_hold_seats", middleware, (req, res) => {
    const query = "select s.*, h.reciever, h.event_id as eventid from Seats as s left join Hold_transfer as h on (s.ticket_id = h.ticket_id and s.event_id = h.event_id) where s.creator = ? and s.event_id = ?"
    const bind = req.body.bind
    if (bind.length !== 2) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

app.post("/giveAway_seats_of_event", middleware, (req, res) => {
    const query = "select h.ticket_id, h.reciever, s.zone, s.seat_row, s.seat_id, a.username from Hold_transfer h join Seats s on (h.ticket_id = s.ticket_id) left join Accounts a on (h.reciever = a.address) where h.event_id = ? and a.removed_date is null order by h.ticket_id"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/seat_prices_of_event", middleware, (req, res) => {
    const query = "select distinct ROUND(price/1000000000000000000, 2) as price from Seats where event_id = ? order by ROUND(price/1000000000000000000, 2) desc"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/available_seatCount_of_event", middleware, (req, res) => {
    const query = "select count(*) seat_count from Seats where owner is null and event_id = ?"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/available_seats_of_event", middleware, (req, res) => {
    const query = "select s.ticket_id, s.seat_id, s.seat_row, s.zone, s.owner, s.is_use, a.thai_id from Seats s left join Accounts a on (s.owner = a.address) where s.event_id = ? and s.creator = ? and s.transaction is not null and s.is_use is null order by s.zone, s.seat_row, s.seat_id"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
					data["err"] = err2;
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/create_seat", middleware, (req, res) => {
    const query = "insert into Seats (event_id, gas, price, seat_id, seat_row, zone, metadata, creator) values (?, ?, ?, ?, ?, ?, ?, ?)"
    const bind = req.body.bind
    if (bind.length !== 8) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})


app.post("/delete_seat", middleware, (req, res) => {
    const query = "delete from Seats where event_id = ?"
    const bind = req.body.bind
    if (bind.length !== 1) {
    	res.status(400);
    	res.send('request invalid.');
    } else {
    	mysql_pool.getConnection(function(err, connection) {
			if (err) {
				connection.release();
		  		console.log(' Error getting mysql_pool connection: ' + err);
		  		throw err;
		  	}
		    connection.query(query, bind,function(err2, rows) {	
		    	if (err2) {
					var data = { "Time":"", "DatabaseStatus":"", "err": "" };
					data["Time"] = (new Date()).getTime();
					data["DatabaseStatus"] = "Down";
	                data["err"] = err2;
					console.log(err2)
					res.status(500);
					res.json(data); 
				} else {
					res.json(rows); 
				}
				connection.release();
		    });
		});
    }
})

https.createServer(
		{
			key: fs.readFileSync("key.pem"),
			cert: fs.readFileSync("cert.pem"),
	  	},
		app
	).listen(8800, ()=>{
    console.log('server is runing at port 8800')
  });
// app.listen(8800, ()=>{
//     console.log("connect from backend")
// })
