require('dotenv').config()

import express, { json, urlencoded } from 'express'
const app = express()
import {ResultResponse, router as auth, isAuth} from './controllers/auth'
import { pool as db } from './classes/db'
const PORT = 4020

app.use(urlencoded({ extended: true }))
app.use(json())

// /thought - POST - creates new thought
// /thought - PUT - edits a thought
// /thought - DELETE - deletes a thought


app.use(auth)
//for debugging purposes
app.get("/",(req,res) =>{
    res.status(200)
})
//Load the apps homepage
app.post("/thought",isAuth,async(req:any,res)=>{
    if(req.authorized){
        const result:ResultResponse = {
            result: "ok",
            data:null
        }
        const thoughts = await db.query(`SELECT * FROM thoughts WHERE owner=${req.authorized.id}`)
        result.data=thoughts.rows
        res.status(200).json(result)
    }
})
//bring user to add new thought page and post result
app.post("/thought/new", isAuth , async(req:any,res)=>{
    if(req.authorized){
    const {title,body} = req.body
    console.log(title,body)
    const result:ResultResponse = {
        result: "ok",
        data:null
    }
    if (!(title && body)){
        return res.status(400).json({result: "FAIL", data: "Missing all required input fields"})
    }
    const now = Date.now() / 1000;
    try{
        const thought = await db.query(`INSERT INTO thoughts (title,body,date,owner,viewed) VALUES ($1,$2,to_timestamp(${now}), ${req.authorized.id}, false);`,[title,body])
        res.status(200).json(result)
    }catch(err){
        console.log(err)
        res.status(403).json({result:"FAIL",data:"There was an error"})
    }
    }
})
//allow user to delete thought from thought database
app.delete("/thought/delete",isAuth, async(req:any,res)=>{
    const result:ResultResponse = {
        result: "ok",
        data:null
    }
    if(req.authorized){
        const {id} = req.body
        console.log("Deleting thought with ID ", id)
        try{
            await db.query(`DELETE FROM thoughts WHERE id=${id};`)
            result.data = "Success"
        }catch(err){
            console.log(err)
            result.result = "FAIL"
            result.data = "Failed to delete"
        }
        return res.status(200).json(result)
    }
})
//allow user to update thought in thought database
app.post("/thought/edit",isAuth, async(req:any,res)=>{
    const result:ResultResponse = {
        result: "ok",
        data:null
    }
    if(req.authorized){
        const {id, title, body} = req.body
        console.log("editing thought with ID ", id)
        console.log("Updated title and body: ", title, "\n", body)
        try{
            await db.query(`UPDATE thoughts SET title=$1, body=$2 WHERE id=${id};`, [title, body])
            result.data = "Success"
        }catch(err){
            console.log(err)
            result.result = "FAIL"
            result.data = "Failed to update"
        }
        return res.status(200).json(result)
    }
})

//Mark a thought as viewed when displayed to user
app.post("/thought/viewed",isAuth, async(req:any,res)=>{
    const result:ResultResponse = {
        result: "ok",
        data:null
    }
    if(req.authorized){
        const {id} = req.body
        console.log("Marking viewed thought with ID ", id)
        try{
            await db.query(`UPDATE thoughts SET viewed=true WHERE id=${id};`)
            result.data = "Success"
        }catch(err){
            console.log(err)
            result.result = "FAIL"
            result.data = "Failed to update"
        }
        return res.status(200).json(result)
    }
})

app.listen(PORT, () => {console.log("App listening...")})