const redis = require('redis')
const bcrypt = require('bcrypt')

const redis_Port = process.env.redis_Port || 6379;
const redisClient = redis.createClient(redis_Port);

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'new',
  password: 'password',
  port: 5432,
});

function userValidate(user) {
  const validname = typeof user.name == "string" && user.name.trim() != ""
  const validmail = typeof user.email == "string" && user.email.trim() != ""
  const validpassword = typeof user.password == "string" && user.password.length >= 8
  return validname && validmail && validpassword
}

function loginValidate(user) {
  const validmail = typeof user.email == "string" && user.email.trim() != ""
  const validpassword = typeof user.password == "string" && user.password.length >= 8
  return validmail && validpassword
}

const  checkUserAvailability = async(email) => {
  const {rows} = await pool.query('SELECT email FROM users WHERE email = $1 ', [email])
  return rows
}

const createUser = async (request, response, next) => {
  const { name, email, password } = request.body
  const {role} = request.params
  const res = await checkUserAvailability(request.body.email)

  if (userValidate(request.body)) {
    if (res.length === 0) {
      bcrypt.hash(password, 10).then((hash)=> {
        pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3,$4)', [name, email, hash, role], (error, results) => {
          if (error) {
            throw error
          }
          response.status(200)
        })         
    })
    } else {
      response.send('The user already exist')
    }
  } else {
    response.status(400).send('Bad request...!!!')

  }
  response.status(200).send('user created successfully ...!!!')
};

const userLogin = async (request,response,next) =>{
  const {email, password} = request.body
  const res = await checkUserAvailability(request.body.email)

  if(loginValidate(request.body)){
    if(res.length == 1 ){
      const {rows} = await pool.query('SELECT password FROM users WHERE email = $1 ', [email])
      bcrypt.compare(password,rows[0].password).then(async (result)=> {
        if(result){
          let {rows } = await pool.query('SELECT id FROM users WHERE email = $1 ', [email])
          console.log(rows[0].id)
          response.cookie('user_id', rows[0].id, {
            httpOnly : true,
            signed : true
          })
          response.send('logged in successfully')
        }else{
          response.send('password did not match')
        }
      })
    }else{
      response.status(404).send("e-mail id didn't match please re-enter your mail id..")
    }
  }else{
    response.status(400).send('Bad request...!!')
  }
}

const getUsers = async (request, response) => {
  const {rows} =  await pool.query('SELECT role FROM users WHERE id = $1',[request.signedCookies.user_id])
  
  if( rows[0].role == "banker" ){
    pool.query('SELECT * FROM users ORDER BY name ASC', (error, results) => {
      if (error) {
        throw error
      }
      if (results.rows.length > 0) {
        response.json(results.rows)
      } else {
        response.send("No data available ")
      }
    })
  }else{
    response.status(401).send('Unauthorised user')
  }
};

const getUserById = async(request, response) => {
  const {rows} = await pool.query('SELECT role FROM users WHERE id = $1',[request.signedCookies.user_id])
  const id = parseInt(request.params.id)
   
  if (rows[0].role == "banker" || id == request.signedCookies.user_id){
    try {
      pool.query('SELECT * FROM users WHERE id =$1 ', [id], (error, results) => {
        if (error) {
          throw error
        }
        let data = results.rows
        if (results.rows.length > 0) {
          redisClient.setex(id, 30, JSON.stringify(data));
          response.status(200).json(data);
        } else {
          response.send("Data not available...!!");
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500);
    }
  }
}

const deleteUserById = async (request, response) => {
  const {rows} = await pool.query('SELECT role FROM users WHERE id = $1',[request.signedCookies.user_id])
  const id = parseInt(request.params.id)

  if(rows[0].role == "banker"){
    pool.query('DELETE FROM users WHERE id =$1 ', [id], (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).send('Deleted the user');
    });
  }
};

module.exports = { createUser, getUsers, getUserById, deleteUserById , userLogin};
