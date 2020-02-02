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

const createAccount = (request, response,next) => {
    const { acc_no,type, u_id, roi,amount } = request.body
  
    pool.query('INSERT INTO accounts ( account_no, acc_type,user_id, rate_of_interest,amount) VALUES ($1, $2,$3,$4,$5)', [acc_no,type, u_id, roi,amount], (error, results) => {
      if (error) {
        throw error
      }
      response.status(201).send(`account created with ID: ${results.user_id}`)
    });
};

const getAccounts = (request, response) => {
    pool.query('SELECT * FROM accounts ORDER BY account_no ASC', (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).json(results.rows)
      console.log(results.rows)
    })
};

const getAccountByAccountNo = (request, response ) => {
    const acc_no = parseInt(request.params.acc_no)
    pool.query('SELECT * FROM accounts WHERE account_no =$1 ',[acc_no],(error, results) => {
        if (error){
            throw error
        }
        response.status(200).json(results.rows);
    });
}

const getAccountBalance = (request, response ) => {
    const acc_no = parseInt(request.params.acc_no)
    pool.query('SELECT amount FROM accounts WHERE account_no =$1 ',[acc_no],(error, results) => {
        if (error){
            throw error
        }
        response.status(200).json(results.rows);
    });
}

const deleteAccountByAccountNo = (request, response ) => {
    const acc_no = parseInt(request.params.acc_no)
    pool.query('DELETE FROM accounts WHERE account_no =$1 ',[acc_no],(error, results) => {
        if (error){
            throw error
        }
        response.status(200).send('deleted wow');
        
    });
};

module.exports ={createAccount,getAccounts,getAccountByAccountNo,
                     deleteAccountByAccountNo,getAccountBalance};
 