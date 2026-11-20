export const groups = [
  "Whiskies",
  "Spirits",
  "Aperitifs & liqueurs",
  "Vermouth & fortified wine",
  "Wine & sparkling",
  "Mixers",
  "Bitters & syrups",
  "Fresh & garnishes",
] as const;
export type Group = (typeof groups)[number];
export const statuses = [
  "Available",
  "Low",
  "Unavailable",
  "Planned",
  "Needs confirmation",
] as const;
export type Status = (typeof statuses)[number];
export type Item = {
  id: string;
  name: string;
  group: Group;
  status: Status;
  kind: string;
  openedOn?: string;
  shoppingRecipes?: string[];
  shoppingOrigin?: "created" | "unconfirmed";
};
const bottle = (
  id: string,
  name: string,
  group: Group,
  kind: string,
  status: Status = "Available",
): Item => ({ id, name, group, kind, status });
export const seed: Item[] = [
  bottle("arran", "Arran Barrel Reserve", "Whiskies", "Scotch", "Low"),
  bottle(
    "hibiki",
    "Hibiki Harmony",
    "Whiskies",
    "Japanese whisky",
    "Needs confirmation",
  ),
  bottle(
    "roses",
    "Four Roses Small Batch",
    "Whiskies",
    "Bourbon",
    "Needs confirmation",
  ),
  bottle("bombay", "Bombay Sapphire", "Spirits", "Gin"),
  bottle("campari", "Campari", "Aperitifs & liqueurs", "Campari"),
  bottle("aperol", "Aperol", "Aperitifs & liqueurs", "Aperol"),
  bottle(
    "germain",
    "St-Germain",
    "Aperitifs & liqueurs",
    "Elderflower liqueur",
  ),
  bottle(
    "cocchi",
    "Cocchi sweet vermouth",
    "Vermouth & fortified wine",
    "Sweet vermouth",
  ),
  bottle("dolin", "Dolin Dry", "Vermouth & fortified wine", "Dry vermouth"),
  bottle("soda", "Soda water", "Mixers", "Soda water", "Needs confirmation"),
  bottle("mint", "Mint", "Fresh & garnishes", "Mint", "Needs confirmation"),
  bottle("lime", "Limes", "Fresh & garnishes", "Lime", "Needs confirmation"),
  bottle(
    "syrup",
    "Simple syrup",
    "Bitters & syrups",
    "Simple syrup",
    "Needs confirmation",
  ),
  bottle(
    "bitters",
    "Angostura bitters",
    "Bitters & syrups",
    "Angostura bitters",
    "Needs confirmation",
  ),
  bottle(
    "prosecco",
    "Prosecco",
    "Wine & sparkling",
    "Prosecco",
    "Needs confirmation",
  ),
  bottle("ice", "Ice", "Fresh & garnishes", "Ice"),
  bottle("suze", "Suze", "Aperitifs & liqueurs", "Gentian liqueur", "Planned"),
  bottle(
    "lillet",
    "Lillet Blanc",
    "Vermouth & fortified wine",
    "Aromatized wine",
    "Planned",
  ),
  bottle("espolon", "Espolòn Blanco", "Spirits", "Tequila", "Planned"),
  bottle("del", "Del Maguey Vida", "Spirits", "Mezcal", "Planned"),
  bottle(
    "cointreau",
    "Cointreau",
    "Aperitifs & liqueurs",
    "Orange liqueur",
    "Planned",
  ),
];
export type Recipe = {
  id: string;
  name: string;
  style: string;
  glass: string;
  color: string;
  ingredients: [
    kind: string,
    quantity: number,
    unit: "ml" | "leaves" | "wedge" | "dashes",
  ][];
  steps: string;
  garnish: string;
};
export const recipes: Recipe[] = [
  {
    id: "negroni",
    name: "Negroni",
    style: "Balanced, bitter, herbal, and bright.",
    glass: "rocks",
    color: "#bc4b32",
    ingredients: [
      ["Gin", 30, "ml"],
      ["Campari", 30, "ml"],
      ["Sweet vermouth", 30, "ml"],
    ],
    steps:
      "Stir all three ingredients over ice for 20 seconds. Strain over one large cube in a rocks glass.",
    garnish: "Orange peel",
  },
  {
    id: "hugo",
    name: "Hugo Spritz",
    style: "Delicate, floral, and fresh.",
    glass: "spritz",
    color: "#c4dd52",
    ingredients: [
      ["Prosecco", 90, "ml"],
      ["Elderflower liqueur", 45, "ml"],
      ["Soda water", 30, "ml"],
      ["Mint", 4, "leaves"],
      ["Lime", 1, "wedge"],
    ],
    steps:
      "Gently press the mint in a wine glass. Add ice, elderflower liqueur, prosecco and soda. Stir gently and add the lime.",
    garnish: "Mint and lime",
  },
  {
    id: "old-fashioned",
    name: "Old Fashioned",
    style: "Rich, simple, and timeless.",
    glass: "rocks",
    color: "#e78c1e",
    ingredients: [
      ["Bourbon", 60, "ml"],
      ["Simple syrup", 7.5, "ml"],
      ["Angostura bitters", 2, "dashes"],
    ],
    steps:
      "Stir the ingredients with ice. Strain over a large cube in a rocks glass. Express an orange peel over the drink.",
    garnish: "Orange peel",
  },
  {
    id: "martini",
    name: "Dry Martini",
    style: "Crisp, cold, and impeccably dry.",
    glass: "martini",
    color: "#d9cf9d",
    ingredients: [
      ["Gin", 60, "ml"],
      ["Dry vermouth", 10, "ml"],
    ],
    steps:
      "Stir with ice for 25 seconds. Strain into a chilled cocktail glass.",
    garnish: "Olive or lemon twist",
  },
  {
    id: "boulevardier",
    name: "Boulevardier",
    style: "Bitter orange with a warm whiskey finish.",
    glass: "rocks",
    color: "#ac5f39",
    ingredients: [
      ["Bourbon", 45, "ml"],
      ["Campari", 30, "ml"],
      ["Sweet vermouth", 30, "ml"],
    ],
    steps: "Stir with ice until cold. Strain over a large ice cube.",
    garnish: "Orange twist",
  },
  {
    id: "highball",
    name: "Scotch Highball",
    style: "Long, cool, and lightly sparkling.",
    glass: "tall",
    color: "#c59b59",
    ingredients: [
      ["Scotch", 45, "ml"],
      ["Soda water", 120, "ml"],
    ],
    steps:
      "Fill a tall glass with ice. Add Scotch, top with chilled soda and stir once.",
    garnish: "Lemon peel",
  },
  {
    id: "white-negroni",
    name: "White Negroni",
    style: "Floral with a clean gentian bite.",
    glass: "rocks",
    color: "#c5b559",
    ingredients: [
      ["Gin", 30, "ml"],
      ["Gentian liqueur", 30, "ml"],
      ["Aromatized wine", 30, "ml"],
    ],
    steps:
      "Stir with ice for 20 seconds. Strain into a rocks glass over fresh ice.",
    garnish: "Grapefruit twist",
  },
  {
    id: "americano",
    name: "Americano",
    style: "Light, bittersweet, and sparkling.",
    glass: "tall",
    color: "#bd6855",
    ingredients: [
      ["Campari", 30, "ml"],
      ["Sweet vermouth", 30, "ml"],
      ["Soda water", 60, "ml"],
    ],
    steps:
      "Pour Campari and vermouth over ice. Top with chilled soda and stir gently.",
    garnish: "Orange slice",
  },
  {
    id: "manhattan",
    name: "Manhattan",
    style: "Rye spice, dark cherry, and sweet vermouth.",
    glass: "coupe",
    color: "#914d36",
    ingredients: [
      ["Rye whiskey", 50, "ml"],
      ["Sweet vermouth", 20, "ml"],
      ["Angostura bitters", 1, "dashes"],
    ],
    steps: "Stir with ice until cold. Strain into a chilled coupe.",
    garnish: "Cocktail cherry",
  },
  {
    id: "margarita",
    name: "Margarita",
    style: "Bright lime over peppery tequila.",
    glass: "coupe",
    color: "#cada89",
    ingredients: [
      ["Tequila", 50, "ml"],
      ["Orange liqueur", 20, "ml"],
      ["Lime", 15, "ml"],
    ],
    steps: "Run lime around half the rim of a coupe and dip that edge in salt if desired. Shake the measured ingredients with ice and strain into the glass.",
    garnish: "Lime wheel",
  },
  {
    id: "daiquiri",
    name: "Daiquiri",
    style: "Clean rum with a sharp squeeze of lime.",
    glass: "coupe",
    color: "#dddba7",
    ingredients: [
      ["White rum", 60, "ml"],
      ["Lime", 25, "ml"],
      ["Simple syrup", 15, "ml"],
    ],
    steps: "Shake the rum, fresh lime juice and syrup with ice. Fine-strain into a chilled coupe.",
    garnish: "None",
  },
  {
    id: "whiskey-sour",
    name: "Whiskey Sour",
    style: "Bourbon softened by lemon and sugar.",
    glass: "rocks",
    color: "#dfa74c",
    ingredients: [
      ["Bourbon", 45, "ml"],
      ["Lemon", 25, "ml"],
      ["Simple syrup", 20, "ml"],
    ],
    steps: "Shake the bourbon, fresh lemon juice and syrup with ice. Strain over fresh ice in a rocks glass.",
    garnish: "Orange half-wheel",
  },
  {
    id: "sidecar",
    name: "Sidecar",
    style: "Cognac and orange with a dry lemon finish.",
    glass: "coupe",
    color: "#cf8d47",
    ingredients: [
      ["Cognac", 50, "ml"],
      ["Orange liqueur", 20, "ml"],
      ["Lemon", 20, "ml"],
    ],
    steps: "Shake all ingredients with ice, using freshly squeezed lemon juice. Fine-strain into a chilled coupe.",
    garnish: "Orange twist",
  },
  {
    id: "french-75",
    name: "French 75",
    style: "A brisk gin sour lifted with Champagne.",
    glass: "flute",
    color: "#e0d89d",
    ingredients: [
      ["Gin", 30, "ml"],
      ["Lemon", 15, "ml"],
      ["Simple syrup", 15, "ml"],
      ["Champagne", 60, "ml"],
    ],
    steps: "Shake gin, fresh lemon juice and syrup with ice. Strain into a flute and top gently with chilled Champagne.",
    garnish: "Lemon twist",
  },
  {
    id: "mojito",
    name: "Mojito",
    style: "Fresh mint and lime in a long rum cooler.",
    glass: "tall",
    color: "#c7d99d",
    ingredients: [
      ["White rum", 45, "ml"],
      ["Lime", 20, "ml"],
      ["Simple syrup", 15, "ml"],
      ["Mint", 6, "leaves"],
      ["Soda water", 60, "ml"],
    ],
    steps: "Gently press mint with fresh lime juice and syrup in a highball. Add rum and ice, top with soda and stir gently.",
    garnish: "Mint sprig",
  },
  {
    id: "tom-collins",
    name: "Tom Collins",
    style: "Gin and sparkling lemonade over ice.",
    glass: "tall",
    color: "#e3d69b",
    ingredients: [
      ["Gin", 45, "ml"],
      ["Lemon", 30, "ml"],
      ["Simple syrup", 15, "ml"],
      ["Soda water", 60, "ml"],
    ],
    steps: "Shake gin, fresh lemon juice and syrup with ice. Strain over fresh ice in a tall glass and top with soda.",
    garnish: "Lemon wheel",
  },
  {
    id: "gimlet",
    name: "Gimlet",
    style: "Bracing gin with a sweet lime edge.",
    glass: "coupe",
    color: "#bacc91",
    ingredients: [
      ["Gin", 60, "ml"],
      ["Lime cordial", 20, "ml"],
    ],
    steps: "Stir the gin and lime cordial with ice until cold. Strain into a chilled coupe.",
    garnish: "Lime twist",
  },
  {
    id: "bees-knees",
    name: "Bee’s Knees",
    style: "Gin, lemon, and a soft honey finish.",
    glass: "coupe",
    color: "#e6bd55",
    ingredients: [
      ["Gin", 50, "ml"],
      ["Lemon", 25, "ml"],
      ["Honey syrup", 20, "ml"],
    ],
    steps: "For honey syrup, stir equal volumes of honey and warm water together and cool. Shake the measured syrup, gin and fresh lemon juice with ice. Fine-strain into a chilled coupe.",
    garnish: "Lemon twist",
  },
  {
    id: "aperol-spritz",
    name: "Aperol Spritz",
    style: "Orange bitters and prosecco, light and sparkling.",
    glass: "spritz",
    color: "#ec862e",
    ingredients: [
      ["Prosecco", 90, "ml"],
      ["Aperol", 60, "ml"],
      ["Soda water", 30, "ml"],
    ],
    steps: "Fill a wine glass with ice. Add prosecco, Aperol and soda in that order and stir gently.",
    garnish: "Orange half-wheel",
  },
  {
    id: "moscow-mule",
    name: "Moscow Mule",
    style: "Ginger heat, fresh lime, and a cold copper cup.",
    glass: "mug",
    color: "#c38358",
    ingredients: [
      ["Vodka", 45, "ml"],
      ["Lime", 10, "ml"],
      ["Ginger beer", 120, "ml"],
    ],
    steps: "Fill a mule mug or highball with ice. Add vodka and fresh lime juice, top with ginger beer and stir briefly.",
    garnish: "Lime wheel",
  },
  {
    id: "last-word",
    name: "Last Word",
    style: "Herbal Chartreuse and tart lime meet a dry cherry finish.",
    glass: "coupe",
    color: "#bfcc9c",
    ingredients: [
      ["Gin", 22.5, "ml"],
      ["Green Chartreuse", 22.5, "ml"],
      ["Maraschino liqueur", 22.5, "ml"],
      ["Lime", 22.5, "ml"],
    ],
    steps: "Shake all four ingredients with ice, using fresh lime juice. Fine-strain into a chilled coupe.",
    garnish: "Cocktail cherry",
  },
  {
    id: "paper-plane",
    name: "Paper Plane",
    style: "Soft bourbon and bittersweet orange with a bright lemon edge.",
    glass: "coupe",
    color: "#e69a62",
    ingredients: [
      ["Bourbon", 22.5, "ml"],
      ["Aperol", 22.5, "ml"],
      ["Amaro Nonino", 22.5, "ml"],
      ["Lemon", 22.5, "ml"],
    ],
    steps: "Shake all four ingredients with ice, using fresh lemon juice. Strain into a chilled coupe.",
    garnish: "None",
  },
  {
    id: "paloma",
    name: "Paloma",
    style: "Pink grapefruit and sparkling soda lengthen a crisp tequila base.",
    glass: "tall",
    color: "#e8b8a4",
    ingredients: [
      ["Tequila", 50, "ml"],
      ["Lime", 10, "ml"],
      ["Grapefruit soda", 100, "ml"],
    ],
    steps: "Pour tequila and fresh lime juice into a highball over ice. Top with chilled grapefruit soda and stir once.",
    garnish: "Lime wheel",
  },
  {
    id: "cosmopolitan",
    name: "Cosmopolitan",
    style: "Cranberry, orange, and lime with a clean citrus finish.",
    glass: "coupe",
    color: "#d9899a",
    ingredients: [
      ["Citrus vodka", 40, "ml"],
      ["Orange liqueur", 15, "ml"],
      ["Lime", 15, "ml"],
      ["Cranberry juice", 30, "ml"],
    ],
    steps: "Shake the ingredients with ice, using fresh lime juice. Fine-strain into a chilled cocktail glass. Express the orange peel over the surface.",
    garnish: "Orange twist",
  },
  {
    id: "espresso-martini",
    name: "Espresso Martini",
    style: "Fresh coffee and vodka beneath a fine layer of crema.",
    glass: "coupe",
    color: "#755039",
    ingredients: [
      ["Vodka", 50, "ml"],
      ["Coffee liqueur", 20, "ml"],
      ["Espresso", 30, "ml"],
      ["Simple syrup", 5, "ml"],
    ],
    steps: "Brew the espresso and shake it vigorously with the remaining ingredients and ice. Fine-strain into a chilled coupe.",
    garnish: "Three coffee beans",
  },
  {
    id: "gold-rush",
    name: "Gold Rush",
    style: "Bourbon, lemon, and rich honey over a single cube.",
    glass: "rocks",
    color: "#dcae55",
    ingredients: [
      ["Bourbon", 60, "ml"],
      ["Lemon", 22.5, "ml"],
      ["Honey syrup", 22.5, "ml"],
    ],
    steps: "Shake bourbon, fresh lemon juice and honey syrup with ice. Strain over a large cube in a rocks glass.",
    garnish: "Lemon twist",
  },
  {
    id: "dark-n-stormy",
    name: "Dark ’n’ Stormy",
    style: "Dark rum floats over spicy ginger beer.",
    glass: "tall",
    color: "#b67946",
    ingredients: [
      ["Dark rum", 60, "ml"],
      ["Ginger beer", 100, "ml"],
    ],
    steps: "Fill a highball with ice and pour in the chilled ginger beer. Float the dark rum over the top and stir before drinking.",
    garnish: "Lime wedge",
  },
  {
    id: "rob-roy",
    name: "Rob Roy",
    style: "Scotch gives sweet vermouth and bitters a malty finish.",
    glass: "coupe",
    color: "#ac6749",
    ingredients: [
      ["Scotch", 60, "ml"],
      ["Sweet vermouth", 30, "ml"],
      ["Angostura bitters", 2, "dashes"],
    ],
    steps: "Stir the Scotch, vermouth and bitters with ice. Strain into a chilled coupe.",
    garnish: "Cocktail cherry",
  },
  {
    id: "rusty-nail",
    name: "Rusty Nail",
    style: "Scotch rounded by heather honey and herbs.",
    glass: "rocks",
    color: "#ce994e",
    ingredients: [
      ["Scotch", 45, "ml"],
      ["Drambuie", 25, "ml"],
    ],
    steps: "Pour both ingredients over a large cube in a rocks glass. Stir until chilled.",
    garnish: "Lemon twist",
  },
  {
    id: "kir-royale",
    name: "Kir Royale",
    style: "Blackcurrant lends a deep blush to dry Champagne.",
    glass: "flute",
    color: "#bf7386",
    ingredients: [
      ["Crème de cassis", 10, "ml"],
      ["Champagne", 90, "ml"],
    ],
    steps: "Pour the cassis into a chilled flute. Slowly top with cold Champagne and give it one gentle stir.",
    garnish: "None",
  },
];
export const demoMenu = ["negroni", "hugo", "old-fashioned", "martini"];
export function availability(recipe: Recipe, items: Item[]) {
  const needed = [...recipe.ingredients.map(([kind]) => kind), "Ice"];
  const missing = needed.filter(
    (kind) =>
      !items.some(
        (i) => i.kind === kind && ["Available", "Low"].includes(i.status),
      ),
  );
  const low = needed.filter(
    (kind) =>
      !items.some((i) => i.kind === kind && i.status === "Available") &&
      items.some((i) => i.kind === kind && i.status === "Low"),
  );
  return { missing, low, ready: missing.length === 0 };
}

export const families: Record<string, string> = {
  negroni: "Aperitivo",
  hugo: "Spritz",
  "old-fashioned": "Whiskey",
  martini: "Martini",
  boulevardier: "Whiskey",
  highball: "Whiskey",
  "white-negroni": "Aperitivo",
  americano: "Aperitivo",
  "last-word": "Sour",
  "paper-plane": "Sour",
  "paloma": "Highball",
  "cosmopolitan": "Sour",
  "espresso-martini": "Martini",
  "gold-rush": "Whiskey",
  "dark-n-stormy": "Highball",
  "rob-roy": "Whiskey",
  "rusty-nail": "Whiskey",
  "kir-royale": "Sparkling",
  "manhattan": "Whiskey",
  "margarita": "Sour",
  "daiquiri": "Sour",
  "whiskey-sour": "Whiskey",
  "sidecar": "Sour",
  "french-75": "Sparkling",
  "mojito": "Highball",
  "tom-collins": "Highball",
  "gimlet": "Sour",
  "bees-knees": "Sour",
  "aperol-spritz": "Spritz",
  "moscow-mule": "Highball",
};

// The source recipes use millilitres. Display approximate bar measures at 30 ml per oz.
export function measure(
  amount: number,
  unit: Recipe["ingredients"][number][2],
) {
  return unit === "ml"
    ? Number((amount / 30).toFixed(2)) + " oz / " + amount + " ml"
    : amount + " " + (unit === "dashes" && amount === 1 ? "dash" : unit);
}

const extraKinds: Record<string, Group> = {
  "Red wine": "Wine & sparkling", "White wine": "Wine & sparkling", "Rosé": "Wine & sparkling",
  "Sparkling wine": "Wine & sparkling", Sherry: "Vermouth & fortified wine", Port: "Vermouth & fortified wine",
  Brandy: "Spirits", "Aged rum": "Spirits", "Irish whiskey": "Whiskies", "Tonic water": "Mixers",
  "Orange juice": "Mixers", "Pineapple juice": "Mixers", Grenadine: "Bitters & syrups",
  "Rye whiskey": "Whiskies", "White rum": "Spirits", "Dark rum": "Spirits", Vodka: "Spirits",
  "Citrus vodka": "Spirits", Cognac: "Spirits", "Green Chartreuse": "Aperitifs & liqueurs",
  "Maraschino liqueur": "Aperitifs & liqueurs", "Coffee liqueur": "Aperitifs & liqueurs",
  "Crème de cassis": "Aperitifs & liqueurs", Drambuie: "Aperitifs & liqueurs", "Amaro Nonino": "Aperitifs & liqueurs",
  Champagne: "Wine & sparkling", Lemon: "Fresh & garnishes", "Honey syrup": "Bitters & syrups",
  "Lime cordial": "Bitters & syrups", "Cranberry juice": "Mixers", "Ginger beer": "Mixers",
  "Grapefruit soda": "Mixers", Espresso: "Mixers",
};
export const ingredientKinds = [...new Set([...seed.map(i => i.kind), ...Object.keys(extraKinds),
  ...recipes.flatMap(r => r.ingredients.map(([kind]) => kind))])].sort();
export const kindGroup = (kind: string): Group =>
  seed.find(i => i.kind === kind)?.group ?? extraKinds[kind] ?? "Mixers";
export const onShoppingList = (item: Item) => item.status === "Planned" || item.status === "Unavailable";

export function releaseShopping(items: Item[], recipeId: string): Item[] {
  return items.flatMap(item => {
    if (!item.shoppingRecipes?.includes(recipeId)) return [item];
    const remaining = item.shoppingRecipes.filter(id => id !== recipeId);
    if (remaining.length) return [{ ...item, shoppingRecipes: remaining }];
    const { shoppingOrigin, shoppingRecipes, ...stock } = item;
    if (item.status !== "Planned") return [stock];
    if (shoppingOrigin === "created") return [];
    return [{ ...stock, status: shoppingOrigin === "unconfirmed" ? "Needs confirmation" : stock.status }];
  });
}
