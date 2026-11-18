export const groups = ['Whiskies','Spirits','Liqueurs/Aperitifs','Vermouth','Non-alcoholic','Additional'] as const
export type Group = typeof groups[number]
export const statuses = ['Available','Low','Unavailable','Planned','Needs confirmation'] as const
export type Status = typeof statuses[number]
export type Item = {id:string; name:string; group:Group; status:Status; kind:string}
const bottle = (id:string,name:string,group:Group,kind:string,status:Status='Available'):Item => ({id,name,group,kind,status})
export const seed:Item[] = [
 bottle('arran','Arran Barrel Reserve','Whiskies','Scotch','Low'),
 bottle('hibiki','Hibiki Harmony','Whiskies','Japanese whisky','Needs confirmation'),
 bottle('roses','Four Roses Small Batch','Whiskies','Bourbon','Needs confirmation'),
 bottle('bombay','Bombay Sapphire','Spirits','Gin'),
 bottle('campari','Campari','Liqueurs/Aperitifs','Campari'),
 bottle('aperol','Aperol','Liqueurs/Aperitifs','Aperol'),
 bottle('germain','St-Germain','Liqueurs/Aperitifs','Elderflower liqueur'),
 bottle('cocchi','Cocchi sweet vermouth','Vermouth','Sweet vermouth'),
 bottle('dolin','Dolin Dry','Vermouth','Dry vermouth'),
 bottle('soda','Soda water','Non-alcoholic','Soda water','Needs confirmation'),
 bottle('mint','Mint','Additional','Mint','Needs confirmation'),
 bottle('lime','Limes','Additional','Lime','Needs confirmation'),
 bottle('syrup','Simple syrup','Additional','Simple syrup','Needs confirmation'),
 bottle('bitters','Angostura bitters','Additional','Angostura bitters','Needs confirmation'),
 bottle('prosecco','Prosecco','Additional','Prosecco','Needs confirmation'),
 bottle('ice','Ice','Additional','Ice'),
 bottle('suze','Suze','Liqueurs/Aperitifs','Gentian liqueur','Planned'),
 bottle('lillet','Lillet Blanc','Vermouth','Aromatized wine','Planned'),
 bottle('espolon','Espolòn Blanco','Spirits','Tequila','Planned'),
 bottle('del','Del Maguey Vida','Spirits','Mezcal','Planned'),
 bottle('cointreau','Cointreau','Liqueurs/Aperitifs','Orange liqueur','Planned')
]
export type Recipe = {id:string;name:string;style:string;glass:string;color:string;ingredients:[string,string][];steps:string;garnish:string}
export const recipes:Recipe[] = [
 {id:'negroni',name:'Negroni',style:'Balanced, bitter, herbal, and bright.',glass:'rocks',color:'#bc4b32',ingredients:[['Gin','30 ml'],['Campari','30 ml'],['Sweet vermouth','30 ml']],steps:'Stir all three ingredients over ice for 20 seconds. Strain over one large cube in a rocks glass.',garnish:'Orange peel'},
 {id:'hugo',name:'Hugo Spritz',style:'Delicate, floral, and fresh.',glass:'spritz',color:'#c4dd52',ingredients:[['Prosecco','90 ml'],['Elderflower liqueur','45 ml'],['Soda water','30 ml'],['Mint','4 leaves'],['Lime','1 wedge']],steps:'Gently press the mint in a wine glass. Add ice, elderflower liqueur, prosecco and soda. Stir gently and add the lime.',garnish:'Mint and lime'},
 {id:'old-fashioned',name:'Old Fashioned',style:'Rich, simple, and timeless.',glass:'rocks',color:'#e78c1e',ingredients:[['Bourbon','60 ml'],['Simple syrup','7.5 ml'],['Angostura bitters','2 dashes']],steps:'Stir the ingredients with ice. Strain over a large cube in a rocks glass. Express an orange peel over the drink.',garnish:'Orange peel'},
 {id:'martini',name:'Dry Martini',style:'Crisp, cold, and impeccably dry.',glass:'martini',color:'#d9cf9d',ingredients:[['Gin','60 ml'],['Dry vermouth','10 ml']],steps:'Stir with ice for 25 seconds. Strain into a chilled cocktail glass.',garnish:'Olive or lemon twist'},
 {id:'boulevardier',name:'Boulevardier',style:'Bitter orange with a warm whiskey finish.',glass:'rocks',color:'#ac5f39',ingredients:[['Bourbon','45 ml'],['Campari','30 ml'],['Sweet vermouth','30 ml']],steps:'Stir with ice until cold. Strain over a large ice cube.',garnish:'Orange twist'},
 {id:'highball',name:'Scotch Highball',style:'Long, cool, and lightly sparkling.',glass:'tall',color:'#c59b59',ingredients:[['Scotch','45 ml'],['Soda water','120 ml']],steps:'Fill a tall glass with ice. Add Scotch, top with chilled soda and stir once.',garnish:'Lemon peel'},
 {id:'white-negroni',name:'White Negroni',style:'Floral with a clean gentian bite.',glass:'rocks',color:'#c5b559',ingredients:[['Gin','30 ml'],['Gentian liqueur','30 ml'],['Aromatized wine','30 ml']],steps:'Stir with ice for 20 seconds. Strain into a rocks glass over fresh ice.',garnish:'Grapefruit twist'},
 {id:'americano',name:'Americano',style:'Light, bittersweet, and sparkling.',glass:'tall',color:'#bd6855',ingredients:[['Campari','30 ml'],['Sweet vermouth','30 ml'],['Soda water','60 ml']],steps:'Pour Campari and vermouth over ice. Top with chilled soda and stir gently.',garnish:'Orange slice'}
]
export const demoMenu = ['negroni','hugo','old-fashioned','martini']
export function availability(recipe:Recipe,items:Item[]) {
 const needed = [...recipe.ingredients.map(([kind])=>kind),'Ice']
 const missing = needed.filter(kind=>!items.some(i=>i.kind===kind && ['Available','Low'].includes(i.status)))
 const low = needed.filter(kind=>!items.some(i=>i.kind===kind && i.status==='Available') && items.some(i=>i.kind===kind && i.status==='Low'))
 return {missing,low,ready:missing.length===0}
}

export const families:Record<string,string> = {negroni:'Aperitivo',hugo:'Spritz','old-fashioned':'Whiskey',martini:'Martini',boulevardier:'Whiskey',highball:'Whiskey','white-negroni':'Aperitivo',americano:'Aperitivo'}
