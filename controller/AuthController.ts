import express, { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import dbConnection from "../config/dbConnection";
import { getJwt } from "../utils/jwttoken";
import { CustomRequest } from "../middleware/auth";
import getUniqueId from "../utils/getUniqueId";


//**********************************Create User*********************************/

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body.name || !req.body.email || !req.body.password ) {
      return (next(new ErrorHandler("please enter credentials", 401)))
    }
    //database initialize
    const driver = dbConnection()
    const session = driver.session({ database: "neo4j" });
    //check for unique email
    const UniqueResult = await session.run(`MATCH (u:User {email :'${req.body.email}'} ) return u limit 1`)
    if (UniqueResult.records.length != 0) {
      if (req.body.email === UniqueResult.records[0].get('u').properties.email) {
        return (next(new ErrorHandler("this email is already used", 401)))
      }
    }
    //unique id generator
    const unique_id=getUniqueId();
    const result = await session.run(`CREATE (u:User {_id : '${unique_id}', name:'${req.body.name}',email:'${req.body.email}',password:'${req.body.password}'} ) return u`);
    const data2 = result.records.map(i => i.get('u'))
    //token generator
    const token = getJwt(data2[0].properties) 
     //token saved in cookie
    res.status(200).cookie("token", token).json({
      data2
    })
  } catch (error: any) {
    return (next(new ErrorHandler(error, 401)))
  }
}


//**********************************Login User*********************************/

export const loginuser = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    if ( !req.body.email || !req.body.password ) {
      return (next(new ErrorHandler("please enter credentials", 401)))
    }
    //database initialize
    const driver = dbConnection()
    const session = driver.session({ database: "neo4j" });
    const MatchResult = await session.run(`MATCH (u:User {email :'${req.body.email}'} ) return u limit 1`)
    if (MatchResult.records.length === 0) {
        return (next(new ErrorHandler("please enter valid email", 401)))
    }
    else{
       if(req.body.password!=MatchResult.records[0].get('u').properties.password)
       {
        return (next(new ErrorHandler("please enter correct Password", 401)))  
       }
       else{
        const result=MatchResult.records[0].get('u').properties
        //token generator
        const token = getJwt(MatchResult.records[0].get('u').properties)
        //token saved in cookie
        res.status(200).cookie("token", token).json({
          message:"success",
          result:result
        })
       }
    }
  } catch (error:any) {
    return (next(new ErrorHandler(error, 401))) 
  }
}


//**********************************Log Out*********************************/

export const logout =async(req: Request, res: Response, next: NextFunction)=>{
  try {
    //toekn expire
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      message: "Logged Out",
    });
  } catch (error:any) {
    return (next(new ErrorHandler(error, 401))) 
  }
}


//**********************************Update User*********************************/

export const updateUser=async(req: Request, res: Response, next: NextFunction)=>{
  try {
     const id=req.params.id;
     //database initialize
     const driver = dbConnection()
     const session = driver.session({ database: "neo4j" });
     const result = await session.run(`MATCH (u:User {_id : '${id}'}) SET u.name= '${req.body.name}', u.email= '${req.body.email}', u.password= '${req.body.password}' return u`)
     const r= result.records[0].get('u').properties
     res.status(200).json({
     response: r
     })
  } 
  catch (error:any) {
    return (next(new ErrorHandler(error, 401)))  
  }

}


//**********************************Delete User*********************************/

export const delUser=async(req: Request, res: Response, next: NextFunction)=>{
  try {
       const id=req.params.id 
       const driver = dbConnection()
       const session = driver.session({ database: "neo4j" }); 
       await session.run(`MATCH (u:User {_id : '${id}'}) DELETE u`)  
       res.status(200).json({
        success: true,
        message: "User Deleted Successfully",
      });
  } catch (error:any) {
     return (next(new ErrorHandler(error, 401)))
  }
}