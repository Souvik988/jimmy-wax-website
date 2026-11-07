import {loadEnv} from 'vite'
import {isIP} from 'node:net'
export function problems(env) {
 const issues=[]
 const keys=['VITE_API_ORIGIN','SITE_ORIGIN',...['VITE_MEDIA_ORIGIN','DASHBOARD_PUBLIC_ORIGIN'].filter(key=>env[key])]
 for(const key of keys) {
  try {
   const u=new URL(env[key]??'')
   const host=u.hostname.replace(/^\[|\]$/g,'')
   if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash||isIP(host)||!host.includes('.')||/(^|\.)(localhost|example\.(com|org|net))$|\.(test|local|internal|invalid|example)$/i.test(host)) issues.push(`${key} must be a real public HTTPS origin.`)
  } catch { issues.push(`${key} is required and must be a valid HTTPS origin.`) }
 }
 return issues
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/preflight.mjs')){const issues=problems({...loadEnv('production',process.cwd(),''),...process.env});for(const issue of issues)console.error(issue);if(issues.length)process.exitCode=1;else console.log('Production website origins verified.')}
