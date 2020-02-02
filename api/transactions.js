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


const creditMoney = (request, response,next) => {
    const { f_acc_no,T_acc_no,amount } = request.body
  
    pool.query('UPDATE accounts SET amount = amount + $2 WHERE account_no = $1', [T_acc_no,amount], (error, results) => {
      if (error) {
        throw error
      }
      response.status(201).send(`amount sent to ${T_acc_no}`)
    })
    pool.query('UPDATE accounts SET amount = amount - $2 WHERE account_no = $1', [f_acc_no,amount], (error, results) => {
        if (error) {
            throw error
        }
        
    })
};

const withdrawal=(request,response)=>{
    //const type = request.params.type
    const {acc_no, amount} = request.body

    pool.query('UPDATE accounts SET amount = amount - $2 WHERE account_no = $1', [acc_no, amount], (error, results) => {
        if (error) {
            throw error
        }
        response.status(201).send(`Amount ${amount} detected from your acc no:${acc_no} `)
    })
}

const deposit=(request,response,next)=>{

    const {acc_no, amount} = request.body

    pool.query('UPDATE accounts SET amount = amount + $2 WHERE account_no = $1', [acc_no, amount], (error, results) => {
        if (error) {
            throw error
        }
        response.status(201).send(`Amount Rs.${amount} added from your acc no:${acc_no} `)
    })
    
}

module.exports = {creditMoney,withdrawal,deposit};