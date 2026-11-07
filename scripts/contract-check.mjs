import {readFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {resolve,dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const source=readFileSync(resolve(root,'contracts/api/openapi.yaml'))
const lock=JSON.parse(readFileSync(resolve(root,'contract.lock.json'),'utf8'))
const hash=createHash('sha256').update(source).digest('hex')
if(hash!==lock.sha256)throw new Error('Contract snapshot does not match its lock. Regenerate from the backend, review, then update the lock.')
const canonical=resolve(root,'../jimmy&wax_backend/contracts/api/openapi.yaml')
if(existsSync(canonical)&&createHash('sha256').update(readFileSync(canonical)).digest('hex')!==hash)throw new Error('Website contract differs from the adjacent backend.')
console.log(`Contract ${lock.version} verified (${hash}).`)
