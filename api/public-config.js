"use strict";
// Only publishable configuration is returned. Never expose a service_role key.
module.exports = function handler(req,res) {
 res.setHeader("Cache-Control","public, max-age=60");
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"Method not allowed"});}
 const url=process.env.SUPABASE_URL;
 const key=process.env.SUPABASE_PUBLISHABLE_KEY;
 if(!url || !key) return res.status(503).json({error:"Supabase is not configured"});
 try {
   const parsed=new URL(url);
   if(parsed.protocol!=="https:" || !parsed.hostname.endsWith(".supabase.co")) throw Error("Invalid URL");
 } catch {
   return res.status(503).json({error:"Invalid Supabase configuration"});
 }
 return res.status(200).json({supabaseUrl:url,supabasePublishableKey:key});
};
