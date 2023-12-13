import * as jwt from 'jsonwebtoken'
import * as bcrypt from 'bcrypt'
import cors from 'cors'
import { Router, json, urlencoded } from 'express'
import { pool as db } from '../classes/db'


export const router = Router()

export async function isAuth (req, res, next){
    const token = req.headers["x-access-token"] || null
    if(token)
    {
        try {
            const decode = jwt.verify(token, process.env.JWT_KEY)
            if(decode) req.authorized = {email: decode.email, id: decode.id}
        }catch(err){
            console.log(err)
            req.authorized = null
        }
    }
    return next()
}

router.use(urlencoded({ extended: true }))
router.use(json())

//check to see if user is authorized?
router.post("/authorize", isAuth, (req:any, res) => {
    return res.status(200).json({result:"ok",data:req.authorized ? "authorized" : "not authorized"})
})
 export type ResultResponse = {
    result: string,
    data: any
}
//check users login info to database
router.post("/login", async (req, res) => {
    const {email, password} = req.body
    const result:ResultResponse = {
        result: "ok",
        data:null
    }
    if (!(email && password)){
        return res.status(400).json({result: "FAIL", data: "Missing all required input fields"})
    }
    const user = await db.query('SELECT * FROM login WHERE email = $1;',[email])
    if (user?.rows.length && (await bcrypt.compare(password, user.rows[0].password))) {
        const token = jwt.sign(
            { email, id: user.rows[0].id },
            process.env.JWT_KEY,
            { expiresIn: "7d" }
        );
        result.data = token
    }
        else{
            result.result = "FAIL"
            result.data = "Invalid Login"
    }
    res.status(200).json(result)
})
//check user registration to database if not register user
router.post("/register", async (req, res) => {
    const {email,password} = req.body
    if (!(email && password)) {
        return res.status(400).json({ result: "FAIL", data: "Missing all required input fields." })
    }
    const exists = await db.query(`SELECT COUNT(*) FROM login WHERE email = $1;`,[email])
    console.log(exists.rows[0].count)
    if (exists.rows[0].count === "1") {
        return res.status(409).json({ result: "FAIL", data:"user exists"})
    }else{
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.PWD_HASH as string))
        const register = await db.query('INSERT INTO login (email,password) VALUES ($1,$2);',[email,hashedPassword])
        //debugging purposes
        //console.log(register)
        res.status(200).json({ result: "PASS", data: "none"})
    }

})
