const express = require('express');
const app = express();
const userroutes = require('./api/users');
const accountroutes = require('./api/accounts')
const transactionroutes = require('./api/transactions')
const morgan = require('morgan');
const bodyparser = require('body-parser');

app.use(morgan('dev'));

app.use((req,res,next)=>{
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-control-Allow-Headers','*');
    if(req.method === 'OPTIONS'){
        req.header('Access-Control-Allow-Origin','GET,PUT,POST,DELETE,PATCH');
        return res.status(200).json({message:'got'});
    }else{
        return next();
    }
    
});

app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());

app.get('/', (request, response) => {
    response.json({ info: ' Bank application using Node.js, Express, and Postgres API' })
  });
// user actions
app.post('/users',userroutes.createUser);
app.get('/users',userroutes.getUsers);
app.get('/users/:id',userroutes.getUserById);
app.delete('/users/:id',userroutes.deleteUserById)
// account actions
app.post('/accounts',accountroutes.createAccount)
app.get('/accounts',accountroutes.getAccounts)
app.get('/accounts/:acc_no',accountroutes.getAccountByAccountNo)
app.get('/accounts/balance/:acc_no',accountroutes.getAccountBalance)
// transactions debit and credit
app.put('/transaction/credit',transactionroutes.creditMoney)
app.put('/transaction/withdrawal',transactionroutes.withdrawal)
app.put('/transaction/deposit',transactionroutes.deposit)


app.use((req,res) =>{
    const error = new Error('not found');
    error.status = 404;
    next(error);
});
app.use((error,req,res,next) => {
    res.status(res.error || 500);
    res.json({
        message: error.message
    }
    
    );
});
module.exports = app;