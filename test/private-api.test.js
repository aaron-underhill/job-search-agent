"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {authorized}=require("../lib/server/auth");
const token="A".repeat(64);
test("private auth fails closed",()=>{
 assert.equal(authorized({headers:{}},undefined),false);
 assert.equal(authorized({headers:{authorization:"Bearer "+token}},"short"),false);
 assert.equal(authorized({headers:{authorization:"Bearer wrong"}},token),false);
 assert.equal(authorized({headers:{authorization:"Bearer "+token}},token),true);
});
test("private API rejects unauthorized access without touching Google",async()=>{
 const handler=require("../api/jobs");
 const prior=process.env.PRIVATE_API_TOKEN;
 process.env.PRIVATE_API_TOKEN=token;
 const res={headers:{},status(code){this.code=code;return this},setHeader(k,v){this.headers[k]=v},json(v){this.body=v;return this}};
 try{await handler({method:"GET",headers:{}},res);assert.equal(res.code,401);assert.equal(res.headers["Cache-Control"],"private, no-store")}
 finally{if(prior===undefined)delete process.env.PRIVATE_API_TOKEN;else process.env.PRIVATE_API_TOKEN=prior}
});
