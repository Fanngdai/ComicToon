const MessageModel = require("../Models/MessageModel");
const MongoClient = require('mongodb').MongoClient; //using this to get UserModel collection for msg validation
const mongoose = require('mongoose'); //for msgs model
let DBConnection = null; 
MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true })
.then((db) => {DBConnection = db.db('ComicToonDB')}).catch((err) => console.log("NOOOOOO ",err));
mongoose.connect('mongodb://localhost:27017/Messages', {useNewUrlParser: true}); //Messages db
const MessageDB = mongoose.connection;

exports.getAllMessages = async function(req, res) { //gets all of a user's msgs
    //takes in "token" and "sender"
    DBConnection.collection("userModel").findOne({token: req.body.token}, (err, item) => {
        if(err) res.send({status: "mongodb err"});
        else if(item === null) res.send({status: "Invalid token"});
        else{
            if(item.username !== req.body.sender) res.send({status: "Invalid user"});
            else{ 
                //get both ends of conversation
                MessageModel.find({$or:[{sender: req.body.sender}, {reciever:req.body.sender}]}, (err, result) => { 
                    if(err) res.send({status: "mongodb error"});
                    else res.send({status: "success", messages: result});
                });
            }
        }
    });
};

exports.search = async function(req, res) {
    //takes in "token", "username", and "toFind"
    DBConnection.collection("userModel").findOne({token: req.body.token}, (err, item) => {
        if(err) res.send({status: "mongodb err"});
        else if(item === null) res.send({status: "Invalid token"});
        else{
            if(item.username !== req.body.username) res.send({status: "Invalid user"});
            else{ 
                DBConnection.collection("userModel").findOne({username: req.body.toFind, verified: true}, (err2, find) => {
                    if(err2) res.send({status: "mongodb err"});
                    else if(find === null) res.send({status: "User doesn't exist"});
                    else res.send({status: "success", username: req.body.toFind});
                });
            }
        }
    });
};