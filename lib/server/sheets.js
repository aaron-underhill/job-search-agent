"use strict";
const {createSign} = require("node:crypto");
function b64url(value) {return Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url");}
async function readJobs({env=process.env, fetchImpl=fetch, now=Math.floor(Date.now()/1000)}={}) {
 const email=env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key=env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g,"\n"),
   sheet=env.GOOGLE_SHEET_ID, range=env.GOOGLE_JOBS_RANGE || "Jobs!A1:O500";
 if (!email || !key || !sheet) throw new Error("Google Sheets is not configured");
 const assertionHeader=b64url({alg:"RS256",typ:"JWT"});
 const assertionPayload=b64url({iss:email,scope:"https://www.googleapis.com/auth/spreadsheets.readonly",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600});
 const signingInput=assertionHeader+"."+assertionPayload;
 const signer=createSign("RSA-SHA256");signer.update(signingInput);signer.end();
 const assertion=signingInput+"."+signer.sign(key).toString("base64url");
 const tokenResponse=await fetchImpl("https://oauth2.googleapis.com/token",{
   method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
   body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion}).toString()
 });
 if(!tokenResponse.ok) throw new Error("Google authentication failed: HTTP "+tokenResponse.status);
 const token=(await tokenResponse.json()).access_token;
 if(!token)throw new Error("Google authentication returned no token");
 const url="https://sheets.googleapis.com/v4/spreadsheets/"+encodeURIComponent(sheet)+"/values/"+encodeURIComponent(range);
 const response=await fetchImpl(url,{headers:{Authorization:"Bearer "+token}});
 if(!response.ok)throw new Error("Google Sheets read failed: HTTP "+response.status);
 const values=(await response.json()).values || [];
 if (!values.length)return [];
 const headers=values[0].map(s=>String(s).trim());
 if (!headers.includes("Job title") || !headers.includes("Employer")) throw new Error("Unexpected Jobs sheet columns");
 return values.slice(1).filter(row=>row.some(v=>String(v).trim())).map(row=>
   Object.fromEntries(headers.map((key,i)=>[key,row[i]??""]))
 );
}
module.exports={readJobs};
