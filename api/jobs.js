"use strict";
const {authorized}=require("../lib/server/auth");
const {readJobs}=require("../lib/server/sheets");
module.exports=async function handler(req,res){
 res.setHeader("Cache-Control","private, no-store");
 res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"Method not allowed"});}
 if(!process.env.PRIVATE_API_TOKEN || process.env.PRIVATE_API_TOKEN.length<32)
   return res.status(503).json({error:"Private API not configured"});
 if(!authorized(req))return res.status(401).json({error:"Unauthorized"});
 try{
   const jobs=await readJobs();
   return res.status(200).json({jobs,count:jobs.length});
 }catch(e){
   console.error("Private jobs API failed:",e.message);
   return res.status(503).json({error:"Job data temporarily unavailable"});
 }
};
