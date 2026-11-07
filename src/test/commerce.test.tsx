import {afterEach,describe,expect,it,vi} from 'vitest'
import {apiPages} from '../lib/api'
import {toProduct,selectVariant,type ApiProduct} from '../data/products'
afterEach(()=>vi.restoreAllMocks())
describe('catalogue propagation',()=>{
 it('uses approved API media and carries the chosen variant price and stock to the cart snapshot',()=>{
  const base={id:'polish',categoryId:'care',name:'Polish',subtitle:'Care',description:'Description',variant:{id:'small',title:'Small',pricePaise:10000,comparePaise:null,available:true,availableQuantity:4},media:[{url:'/v1/media/product.webp',assetPath:'old.jpg'}]} satisfies ApiProduct
  const product=toProduct({...base,variants:[base.variant,{id:'large',title:'Large',pricePaise:25000,comparePaise:30000,available:false,availableQuantity:0}]})
  expect(product.image).toBe('http://localhost:8080/v1/media/product.webp')
  expect(selectVariant(product,'large')).toMatchObject({id:'polish',variantId:'large',pricePaise:25000,available:false,availableQuantity:0})
 })
 it('follows opaque cursors and rejects repeated cursors rather than hanging or truncating',async()=>{
  const response=(items:number[],nextCursor:string|null)=>new Response(JSON.stringify({items,nextCursor}),{headers:{'content-type':'application/json'}})
  const fetcher=vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(response([1],'next')).mockResolvedValueOnce(response([2],null))
  expect(await apiPages<number>('/v1/products?limit=1')).toEqual([1,2])
  expect(fetcher.mock.calls[1]?.[0]).toContain('&cursor=next')
  fetcher.mockImplementation(async()=>response([3],'loop'))
  await expect(apiPages<number>('/v1/products')).rejects.toMatchObject({code:'INVALID_CURSOR'})
 })
})
