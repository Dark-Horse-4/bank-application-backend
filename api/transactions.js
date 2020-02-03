const express = require('express')
const router = express.Router();
const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'new',
  password: 'password',
  port: 5432,
});


const creditMoney = (request, response) => {
    const type = request.params.type
    const { f_acc_no,T_acc_no,amount,} = request.body
    

    if (type === 'imps'){

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
          pool.query('INSERT INTO transactions (transaction_type, from_acc,to_acc,date,amount) VALUES ($4, $1,$2,now(),$3)',[f_acc_no,T_acc_no,amount,type],(error,res) =>{
              if(error){
                  throw error
              }
          })

    }

    if (type === 'neft'  || 'rtgs' ){
        var time = moment()
        console.log(time)
        var startTime = moment('10:34:00', 'hh:mm:ss'), endTime = moment('14:00:00', 'hh:mm:ss');

        if (time.isBetween(startTime,endTime)){
            console.log('came in ')
            pool.query('UPDATE accounts SET amount = amount + $2 WHERE account_no = $1', [T_acc_no,amount], (error, results) => {
                if (error) {
                    console.log(error)
                    throw error
                }
                response.status(201).send(`amount sent to ${T_acc_no}`)
              })
              pool.query('UPDATE accounts SET amount = amount - $2 WHERE account_no = $1', [f_acc_no,amount], (error, results) => {
                  if (error) {
                      throw error
                  }
              })
              pool.query('INSERT INTO transactions (transaction_type, from_acc,to_acc,date,amount) VALUES ($4, $1,$2,now(),$3)',[f_acc_no,T_acc_no,amount,type],(error,res) =>{
                  if(error){
                      throw error
                  }
              })
              response.status(201).send('Transaction successful')
    

        }else{
            response.status(201).send('not available in this time')
        }
        

    }
    
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
    const type = request.params.type
    
    if(type === 'cheque' || 'cash' ){
        const {acc_no,amount,} = request.body
        pool.query('UPDATE accounts SET amount = amount + $2 WHERE account_no = $1', [acc_no, amount], (error, results) => {
            if (error) {
                throw error
            }
            response.status(201).send(`Amount Rs.${amount} added from your acc no:${acc_no} `)
        })
        pool.query('INSERT INTO transactions (transaction_type, from_acc,to_acc,date,amount) VALUES ($4, $1,$2,now(),$3)',['self',acc_no,amount, type],(error,res)=>{})
    }
}
    
//     pool.query('UPDATE accounts SET amount = amount + $2 WHERE account_no = $1', [acc_no, amount], (error, results) => {
//         if (error) {
//             throw error
//         }
//         response.status(201).send(`Amount Rs.${amount} added from your acc no:${acc_no} `)
//     })
//     pool.query('INSERT INTO transactions (transaction_type, from_acc,to_acc,date,amount) VALUES ($4, $1,$2,now(),$3)',[f_acc_no,T_acc_no,amount, type],(error,res)=>{})
// }

const allTransactions = (response) =>{
    pool.query('SELECT * FROM transactions ',(error,results)=>{
        if(error){
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const allTransactionsByAccountNo = (request,response) =>{
    acc_no = request.params.num
    pool.query('SELECT * FROM transactions WHERE from_acc = $1 OR to_acc = $1',[acc_no], (error, results)=>{
        if(error){
            throw(error)
        }
        response.status(200).json(results.rows)
    })
}
module.exports = {creditMoney,withdrawal,deposit,allTransactions,allTransactionsByAccountNo};