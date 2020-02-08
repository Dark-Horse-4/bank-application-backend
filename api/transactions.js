//const express = require('express')
const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const mail = require('../mail')
require('dotenv').config()
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'new',
  password: 'password',
  port: 5432,
  idleTimeoutMillis: 3000,
  connectionTimeoutMillis: 2000
});

const creditMoney = async (request, response) => {
    const type = request.params.type
    const { f_acc_no,T_acc_no,amount,} = request.body
    var f_flag = 0
    var t_flag = 0
    const { rows } = await pool.query('SELECT account_no FROM accounts WHERE user_id = $1',[request.signedCookies.user_id])

    if((f_acc_no == rows[0].account_no) && (amount>0)){
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
                      mail                  
                      throw error
                  }
                  
            })
            response.status(200).send('imps transaction done')
        }
        if (type === 'neft'  || 'rtgs' ){
            var time = moment()
            console.log(time)
            var startTime = moment('10:34:00', 'hh:mm:ss'), endTime = moment('14:00:00', 'hh:mm:ss');
    
            if (time.isBetween(startTime,endTime)){
                pool.query('UPDATE accounts SET amount = amount + $2 WHERE account_no = $1', [T_acc_no,amount], (error, results) => {
                    if (error) {
                        mail
                        console.log("mailed")
                        throw error
                    }
                    response.status(201).send(`amount sent to ${T_acc_no}`)
                    f_flag = 1
                })
                pool.query('UPDATE accounts SET amount = amount - $2 WHERE account_no = $1', [f_acc_no,amount], (error, results) => {
                    if (error) {
                        mail
                        throw error
                    }
                    t_flag = 1
                })
                if(f_flag === 1 && t_flag === 1 ){
                    pool.query('INSERT INTO transactions (transaction_type, from_acc,to_acc,date,amount) VALUES ($4, $1,$2,now(),$3)',[f_acc_no,T_acc_no,amount,type],(error,res) =>{
                        if(error){
                            console.log('mailing')
                            throw error
                        }
                    })
                    response.status(201).send('Transaction successful')
                }else{
                    response.status(201).send('Transaction UNsuccessful')
                }   
            }else{
                response.status(201).send('not available in this time')
            }
        }
    }else{
        response.status(400).send('Please enter the valid input')
    }
};

const withdrawal= async (request,response)=>{
    //const type = request.params.type
    const {acc_no, amount} = request.body
    const { rows } = await pool.query('SELECT account_no FROM accounts WHERE user_id = $1',[request.signedCookies.user_id])

    if((rows[0].accounts_no == acc_no) && ( amount > 0)){
        pool.query('UPDATE accounts SET amount = amount - $2 WHERE account_no = $1', [acc_no, amount], (error, results) => {
            if (error) {
                console.log(mail)
                mail
                throw error
            }
            response.status(201).send(`Amount ${amount} detected from your acc no:${acc_no} `)
        })
        pool.query('INSERT INTO transactions (transaction_type, from_acc,to_acc,date,amount) VALUES ($4, $1,$2,now(),$3)',['self',acc_no,amount, 'withdrawal'],(error,res)=>{
        })
    }   
}

const deposit= async (request,response,next)=>{
    const type = request.params.type
    const {rows} = await pool.query('SELECT role FROM users WHERE id = $1',[request.signedCookies.user_id])
    const {acc_no,amount,} = request.body
    if(rows[0].role == "banker"){
        if((type === 'cheque' || 'cash') && (amount > 0) ){
            
            pool.query('UPDATE accounts SET amount = amount + $2 WHERE account_no = $1', [acc_no, amount], (error, results) => {
                if (error) {
                    throw error
                }
                response.status(201).send(`Amount Rs.${amount} added from your acc no:${acc_no} `)
            })
            pool.query('INSERT INTO transactions (transaction_type, from_acc,to_acc,date,amount) VALUES ($4, $1,$2,now(),$3)',['self',acc_no,amount, type],(error,res)=>{})
        }else{
            response.status(400).send("Bad request...!!!")
        }
    }else{
        response.status(400).send('pls contact the bank')
    }
}

const allTransactions = async (request,response) =>{
    const {rows} = await pool.query('SELECT role FROM users WHERE id = $1',[request.signedCookies.user_id])
    if(rows[0].role == "banker"){
        pool.query('SELECT * FROM transactions ',(error,results)=>{
            if(error){
                throw error
            }
            response.status(200).json(results.rows)
        })
    }else{
        response.status(400).send('Unauthorised user')
    }
}

const allTransactionsByAccountNo = async (request,response) =>{
    acc_no = request.params.num
    const {rows} = await pool.query('SELECT role FROM users WHERE id = $1',[request.signedCookies.user_id])

    if(rows[0].role == "banker" || id == request.signedCookies.user_id){
        pool.query('SELECT * FROM transactions WHERE from_acc = $1 OR to_acc = $1',[acc_no], (error, results)=>{
            if(error){
                throw(error)
            }
            response.status(200).json(results.rows)
        })
    }
}
module.exports = {creditMoney,withdrawal,deposit,allTransactions,allTransactionsByAccountNo};