const express = require('express')
const router = express.Router();

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'new',
  password: 'password',
  port: 5432,
});

const createUser = (request, response,next) => {
    const { name, email } = request.body
  
    pool.query('INSERT INTO users (name, email) VALUES ($1, $2)', [name, email], (error, results) => {
      if (error) {
        throw error
      }
      response.status(201).send(`User added with ID: ${results.id}`)
    });
};

const getUsers = (request, response) => {
    pool.query('SELECT * FROM users ORDER BY name ASC', (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
      console.log(results.rows)
    })
};
const getUserById = (request, response ) => {
    const id = parseInt(request.params.id)
    pool.query('SELECT * FROM users WHERE id =$1 ',[id],(error, results) => {
        if (error){
            throw error
        }
        response.status(200).json(results.rows);
    });
}

const deleteUserById = (request, response ) => {
    const id = parseInt(request.params.id)
    pool.query('DELETE FROM users WHERE id =$1 ',[id],(error, results) => {
        if (error){
            throw error
        }
        response.status(200).send('deleted');
        
    });
};

module.exports = {createUser,getUsers,getUserById,deleteUserById};
 