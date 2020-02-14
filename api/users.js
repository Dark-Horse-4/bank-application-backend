const redis = require('redis')
const bcrypt = require('bcrypt')
const jwt  = require('jsonwebtoken')

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
      response.status(400).json({"message":'The user already exist'})
    }
  } else {
    response.status(400).json({"message":'Bad request...!!!'})
  }
  response.status(200).json({"message":'user created successfully...!!!'})
};

const userLogin = async (request,response,next) =>{
  const {email, password} = request.body
  const res = await checkUserAvailability(email)

  if(loginValidate(request.body)){
    if(res.length == 1 ){
      const {rows} = await pool.query('SELECT password FROM users WHERE email = $1 ', [email])
      bcrypt.compare(password,rows[0].password).then(async (result)=> {
        if(result){
          let {rows } = await pool.query('SELECT id FROM users WHERE email = $1 ', [email])
          console.log(rows[0].id)
          const user = {
            user_id : rows[0].id,
            email : email,
            password: password
          }
          jwt.sign({user}, 'privatekey',(err, token) => {
            if(err) { console.log(err) } 
            console.log(typeof token )   
            response.status(200).json({"token":token});
          });
        }else{
          response.status(400).json({"message":'password did not match'})
        }
      })
    }else{
      response.status(404).json({"message":"e-mail id didn't match please re-enter your mail id.."})
    }
  }else{
    response.status(400).json({"message":'Bad request...!!'})
  }
}

const getUsers = async (request, response) => {
  jwt.verify(request.token, 'privatekey', async(err, authorizedData) => {
    if(err){
      console.log('ERROR: Could not connect to the protected route');
      response.status(403).json({"message":"Forbidden"});
    }else{
      const {rows} =  await pool.query('SELECT role FROM users WHERE id = $1',[authorizedData.user.user_id])
      if( rows[0].role == "banker" ){
        pool.query('SELECT * FROM users ORDER BY name ASC', (error, results) => {
          if (error) {
            throw error
          }
          if (results.rows.length > 0) {
            response.status(200).json(results.rows)
          }else{
            response.status(404).json({"message":"No data available "})
          }
        })
      }else{
        response.status(401).json({"message":'Unauthorised user'})
      }
    }
  })
}

const getUserById = async(request, response) => {
  jwt.verify(request.token, 'privatekey', async(err, authorizedData) => {
    if(err){
      console.log('ERROR: Could not connect to the protected route');
      response.status(403).json({"message":"Forbidden"});
    }else{
      const {rows} = await pool.query('SELECT role FROM users WHERE id = $1',[authorizedData.user.user_id])
      const id = parseInt(request.params.id)
      if (rows[0].role == "banker" || id == authorizedData.user.user_id){
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
              response.status(404).json({"message":"Data not available...!!"});
            }
          });
        } catch (err) {
          console.error(err);
          res.status(500);
        }
      }
    }
  })
}

const deleteUserById = async (request, response) => {
  const id = parseInt(request.params.id)
  var email;
  if(id){
    let {rows} = await pool.query('SELECT email FROM users WHERE id = $1',[id])
    email = rows
    console.log(email)    
  }
  if(email.length == 1){
    jwt.verify(request.token, 'privatekey', async(err, authorizedData) => {
      if(err){
        console.log('ERROR: Could not connect to the protected route');
        response.status(403).json({"message":'forbidden'});
      }else{
        let {rows} = await pool.query('SELECT role FROM users WHERE id = $1',[authorizedData.user.user_id]) 
        if(rows[0].role == "banker" ){
          const resu = await checkUserAvailability(email)
          console.log(resu.length)
          if(resu.length == 1){
            pool.query('DELETE FROM users WHERE id =$1 ', [id], async(error, results) => {
              if (error) {
                throw error
              }
              console.log(results.rows)
              response.status(200).json({"message":'Deleted the user'});
            });
          }else{
            response.status(400).json({"message":'Bad request 1'})
          } 
        }else{
          response.status(400).json({"message":'Bad request 2'})
        }
      }
    })
  }else{
    response.status(404).json({"message":"user not avialble"})
  }
    
};

module.exports = { createUser, getUsers, getUserById, deleteUserById , userLogin};