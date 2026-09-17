const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../Model.js');
test('local midnight and Monday week start',()=>{const d=new Date(2026,8,16,15);assert.equal(new Date(M.since(d,false)*1000).getHours(),0);assert.equal(new Date(M.since(d,true)*1000).getDay(),1);});
test('binary files count without inventing line changes',()=>assert.deepEqual(M.countStats('2\t1\ta\n-\t-\tb'),{files:2,added:2,removed:1}));
