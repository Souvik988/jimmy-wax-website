import {test} from 'node:test'
import assert from 'node:assert/strict'
import {problems} from './preflight.mjs'
test('release rejects missing, localhost, placeholder and non-origin configuration',()=>{
 for(const bad of ['', 'http://api.store.com','https://localhost','https://api.example.com','https://api.store.com/v1','https://user:secret@api.store.com','https://192.168.1.4','https://[::1]','https://db.internal'])assert.ok(problems({VITE_API_ORIGIN:bad,SITE_ORIGIN:'https://shop.store.com'}).length,bad)
 assert.deepEqual(problems({VITE_API_ORIGIN:'https://api.store.com',SITE_ORIGIN:'https://shop.store.com'}),[])
})
