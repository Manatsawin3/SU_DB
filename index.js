const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const app = express();

app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "public")));

const connection = mysql.createConnection({
  host: "134.209.101.105",
  user: "group12",
  password: "password12",
  database: "db_group12",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.get("/", (req, res) => {
  res.render("home", { message: null });
});

app.get("/member", (req, res) => {
  res.render("member", { message: null });
});

app.post("/member", (req, res) => {
  console.log(req.body);
  const { Name, Phone } = req.body;
  if (!Name || !Phone) {
    return res.render("Member", { message: "ใส่ข้อมูลให้ครบ" });
  }
  connection.query(
    "INSERT INTO Member (Name, Phone) VALUES (?,?)",
    [Name, Phone],
    (err, results) => {
      if (err) {
        console.error("Error inserting into Member:", err);
        return res.status(500).send("Database error (Member)");
      }
      res.redirect("member");
    }
  );
});

app.get('/history', (req, res) => {
  res.render('history', { Bus: [], message: "Some message" });
});


app.post("/history", (req, res) => {
  console.log(req.body);

  const { BusID } = req.body; // ดึงค่าจาก body แทน query
  if (!BusID) {
    return res.render("history", { message: "ใส่ข้อมูลให้ครบ", Bus: [] });
  }

  const sql = `
      SELECT s.ScheduleID, s.Origin, s.Destination, s.DepartureTime, 
             s.BusID, b.PlateNumber 
      FROM Bus b
      JOIN Schedule s ON s.BusID = b.BusID
      WHERE s.BusID = ?`;

  connection.query(sql, [BusID], (err, results) => {
    if (err) {
      console.error("Error while reading from DB:", err);
      return res.status(500).send("Database error");
    }
    res.render("history", { Bus: results, message: "Searching Successful" });
  });
});



app.get("/schedule", (req, res) => {
  res.render("schedule", { message: null });
});

app.post("/schedule", (req, res) => {
  console.log(req.body);
  const { Origin, Destination, DepartureTime, BusID } = req.body;
  if (!Origin || !Destination || !DepartureTime || !BusID) {
    return res.render("schedule", { message: "ใส่ข้อมูลให้ครบ" });
  }

  connection.query(
    "INSERT INTO Schedule (Origin, Destination, DepartureTime, BusID) VALUES (?,?,?,?)",
    [Origin, Destination, DepartureTime, BusID],
    (err, results) => {
      if (err) {
        console.error("Error inserting into Schedule:", err);
        return res.status(500).send("Database error (Schedule)");
      }
      res.redirect("schedule");
    }
  );
});


app.get("/bus", (req, res) => {
  res.render("bus", { message: null });
});

app.post("/bus", (req, res) => {
  console.log(req.body);
  const { PlateNumber, BusType, Capacity } = req.body;
  if (!PlateNumber || !BusType || !Capacity) {
    return res.render("bus", { message: "ใส่ข้อมูลให้ครบ" });
  }

  connection.query(
    "INSERT INTO Bus (PlateNumber, BusType, Capacity) VALUES (?,?,?)",
    [PlateNumber, BusType, Capacity],
    (err, results) => {
      if (err) {
        console.error("Error inserting into Bus:", err);
        return res.status(500).send("Database error (Bus)");
      }
      res.redirect("bus");
    }
  );
});


app.get("/search", (req, res) => {
  res.render("search", { message: null });
});

app.post("/search", (req, res) => {
  console.log(req.query); // ใช้ req.query สำหรับ GET request

  const { TicketID, Name } = req.query; // ดึงค่าจาก query string
  if (!TicketID || !Name) {
    return res.render("search", { message: "ใส่ข้อมูลให้ครบ" });
  }

  const sql = `
        SELECT t.TicketID, t.BookingDate , t.SeatNumber ,
        t.ScheduleID, t.StaffID , t.BusID , m.MemberID , m.Name , m.Phone
        FROM Ticket t 
        JOIN Member m ON 
        WHERE t.TicketID = ? OR m.MemberID = ?`;

  connection.query(sql, [TicketID, Name], (err, results) => {
    if (err) {
      console.error("Error while reading from DB:", err);
      return res.status(500).send("Search error");
    }
    res.render("search", { Bus: results });
  });
});

app.get("/ticket", (req, res) => {
  res.render("ticket", { message: null });
});

app.post("/ticket", (req, res) => {
  console.log(req.body);
  const { BookingDate, ScheduleID, SeatNumber, StaffID, BusID } = req.body; 
  let {MemberID } = req.body
  if (!BookingDate || !ScheduleID || !SeatNumber || !StaffID || !BusID) {
    return res.render("ticket", { message: "ใส่ข้อมูลให้ครบ" });
  }
  if (!MemberID) {
    MemberID = 0;
  }
  connection.query(
    "INSERT INTO Ticket (BookingDate, ScheduleID, SeatNumber, StaffID, BusID, MemberID ) VALUES (?,?,?,?,?,?)",
    [BookingDate, ScheduleID, SeatNumber, StaffID, BusID , MemberID],
    (err, results) => {
      if (err) {
        console.error("Error inserting into Ticket:", err);
        return res.status(500).send("Database error (Ticket)");
      }
      console.log("Inserted into Ticket:", results.insertId);

      connection.query(
        "SELECT * FROM Member WHERE MemberID = ?",
        [MemberID],
        (err, members) => {
          if (err) {
            console.error("Error checking Member:", err);
            return res.status(500).send("Database error (Member check)");
          }

          if (members.length > 0) {
            connection.query(
              "UPDATE Member SET times = times + 1 WHERE MemberID = ?",
              [MemberID],
              (err, updateResults) => {
                if (err) {
                  console.error("Error updating Member:", err);
                  return res.status(500).send("Database error (Member update)");
                }
                console.log(
                  "Updated Member times:",
                  updateResults.affectedRows
                );
                res.redirect("ticket");
              }
            );
          } else {
            res.redirect("ticket");
          }
        }
      );
    }
  );
});

app.listen(2999, "localhost", () => {
  console.log("Started on port 2999");
});
