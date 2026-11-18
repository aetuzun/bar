import {demoMenu,groups,recipes,seed,statuses,type Item} from './data'
export type BarState = {items:Item[];draft:string[];published:string[]|null}
const key='the-home-bar.beta.v1'
const validIds=(value:unknown):string[]=>Array.isArray(value)?[...new Set(value.filter((id):id is string=>typeof id==='string' && recipes.some(r=>r.id===id)))]:[]
export function guestIds(hash:string) {return hash==='#guest'?demoMenu:validIds(hash.slice('#guest/'.length).split(','))}
export function guestUrl(ids:string[]) {const url=new URL(location.href);url.search='';url.hash='guest/'+validIds(ids).join(',');return url.href}
export const storage = {
 load():BarState {
  const initial={items:seed,draft:[...demoMenu],published:null}
  try {const raw=localStorage.getItem(key);if(!raw)return initial
   const data=JSON.parse(raw)
   if(!Array.isArray(data.items)||!data.items.every((i:Item)=>i&&typeof i.name==='string'&&typeof i.id==='string'&&typeof i.kind==='string'&&groups.includes(i.group)&&statuses.includes(i.status)))return initial
   return {items:data.items,draft:validIds(data.draft),published:data.published===null?null:validIds(data.published)}
  }catch{return initial}
 },
 save(state:BarState){localStorage.setItem(key,JSON.stringify(state))}
}
