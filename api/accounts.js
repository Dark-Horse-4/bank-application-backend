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

const createAccount = async (request, response,next) => {
    const { acc_no,type, u_id, roi,amount } = request.body
    const {rows} = await pool.query('SELECT role FROM users WHERE id = $1',[request.signedCookies.user_id])

    if((rows[0].role == "banker")&&(amount>0)){
        pool.query('INSERT INTO accounts ( account_no, acc_type,user_id, rate_of_interest,amount) VALUES ($1, $2,$3,$4,$5)', [acc_no,type, u_id, roi,amount], (error, results) => {
            if (error) {
              throw error
            }
            response.status(201).send(`account created with ID: ${results.user_id}`)
          })
    }else{
        response.status(401).send('Unauthorised user')
    }  
};

const getAccounts = async (request, response) => {
    const {rows} = await pool.query('SELECT role FROM users WHERE id = $1',[request.signedCookies.user_id])
    if(rows[0].role == "banker"){
        pool.query('SELECT * FROM accounts ORDER BY account_no ASC', (error, results) => {
            if (error) {
              throw error
            }
            response.status(200).json(results.rows)
            console.log(results.rows)
          })
    }else{
        response.status(401).send('Unauthorised user')
    } 
};

const getAccountByAccountNo = async (request, response ) => {
    const acc_no = parseInt(request.params.acc_no)
    const {rows} = await pool.query('SELECT role FROM users WHERE id = $1',[request.signedCookies.user_id])
    if(rows[0].role == "banker"){
        pool.query('SELECT * FROM accounts WHERE account_no =$1 ',[acc_no],(error, results) => {
            if (error){
                throw error
            }
            response.status(200).json(results.rows);
        });

    }else{
        response.status(401).send('Unauthorised user')
    } 
}

const getAccountByUserId = async (request, response ) => {
    const id = parseInt(request.params.id)
    const {rows} = await pool.query('SELECT role FROM users WHERE id = $1',[request.signedCookies.user_id])
    if(rows[0].role == "banker" || id == request.signedCookies.user_id){
        pool.query('SELECT * FROM accounts WHERE user_id =$1 ',[id],(error, results) => {
            if (error){
                throw error
            }
            console.log("hello" + results.rows)
            response.status(200).json(results.rows);
        })
    }else{
        response.status(401).send('Unauthorised user')
    }
    
}

const getAccountBalance = async  (request, response ) => {
    const acc_no = parseInt(request.params.acc_no)
    const {rows} = await pool.query('SELECT role FROM users WHERE id = $1',[request.signedCookies.user_id])

    if(rows[0].role == "banker" || id == request.signedCookies.user_id){
        pool.query('SELECT amount FROM accounts WHERE account_no =$1 ',[acc_no],(error, results) => {
            if (error){
                throw error
            }
            response.status(200).json(results.rows);
        })
    }else{
        response.status(401).send('Unauthorised user')
    } 
}

const deleteAccountByAccountNo = async (request, response ) => {
    const acc_no = parseInt(request.params.acc_no)
    const {rows} = await pool.query('SELECT role FROM users WHERE id = $1',[request.signedCookies.user_id])

    if(rows[0].role == "banker"){
        pool.query('DELETE FROM accounts WHERE account_no =$1 ',[acc_no],(error, results) => {
            if (error){
                throw error
            }
            response.status(200).send('deleted wow');  
        });
    }else{
        response.status(401).send('Please contact the bank officials ')
    }
};

module.exports ={createAccount,getAccounts,getAccountByAccountNo,
                     deleteAccountByAccountNo,getAccountBalance,getAccountByUserId};
 