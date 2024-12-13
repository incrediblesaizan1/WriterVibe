const jwt = require("jsonwebtoken");

function isLoggedIn(req, res, next) {
  if (!req.cookies.token) return res.send(`
    <style>
    body{
    background: black;
    color: white;
    }
    </style>
         <h1>You must be logged in. Redirecting to login...</h1>
    <script>
    setTimeout(() => {
   window.location.href = "/login"
}, 2000);
    </script>
    `);
  let data = jwt.verify(req.cookies.token, "slsldlkff");
  req.user = data;
  next();
}


module.exports = isLoggedIn