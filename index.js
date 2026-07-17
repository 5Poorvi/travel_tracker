import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

const db= new pg.Client({ 
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function visited_countries(){
  const fetch= await db.query("SELECT country_code FROM records");
   let countries=[];
  fetch.rows.forEach((country)=>{countries.push(country.country_code);});
  return countries;
}

app.get("/", async (req, res) => {
  const countries= await visited_countries();
  res.render("index.ejs",{
    records:countries,
    total:countries.length,
  });
});
app.post("/add", async (req, res) => {
  const inp=req.body["country"] ;
  try{
  const result= await db.query("SELECT country_code FROM codes WHERE LOWER(country_name)=$1", [inp.trim().toLowerCase()]);
  const data= result.rows[0];
  const country_code= data.country_code;
  try{
  await db.query("INSERT INTO records (country_code) VALUES ($1)", [country_code]);
    res.redirect("/");
  }
  catch(err){
    console.log(err);
    const countries= await visited_countries();
    res.render("index.ejs", {
      records:countries,
      total:countries.length,
      error:"country exists",
    });
  }
}  catch(err){
  console.log(err);
  const countries= await visited_countries();
  res.render("index.ejs", {
    records:countries,
      total:countries.length,
      error:"country doesn't exists",
  });
}
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
