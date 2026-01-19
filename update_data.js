import fs from 'fs';
import https from 'https';

const OUTPUT_FILE = './src/marvel_data.json';
const PACKS_API = "https://marvelcdb.com/api/public/packs";
const GITHUB_BASE = "https://raw.githubusercontent.com/zzorba/marvelsdb-json-data/master/pack";

// --- GOLDEN STATS MAP ---
// Manually defines [Stage I, Stage II, Stage III] HP for every villain.
// Used when the API returns garbage (0, null, or X).
const VILLAIN_STATS = {
    "Rhino": [14, 15, 16],
    "Klaw": [12, 18, 22],
    "Ultron": [17, 22, 27],
    "Green Goblin": [14, 17, 20], // Mutagen Formula logic
    "Norman Osborn": [14, 17, 20], // Risky Business
    "Wrecking Crew": [14, 14, 14], // Generic avg for Wrecker/Bulldozer/etc
    "Wrecker": [14, 15, 16],
    "Bulldozer": [12, 13, 14],
    "Piledriver": [11, 12, 13],
    "Thunderball": [13, 14, 15],
    "Crossbones": [12, 16, 17],
    "Absorbing Man": [13, 14, 15],
    "Taskmaster": [13, 16, 18],
    "Zola": [12, 14, 15],
    "Red Skull": [16, 20, 22],
    "Kang": [12, 15, 18], // Averages for his many forms
    "Drang": [13, 14, 15],
    "Collector": [11, 13, 13],
    "Nebula": [14, 17, 20],
    "Ronan the Accuser": [14, 18, 22],
    "Ebony Maw": [12, 16, 18],
    "Proxima Midnight": [12, 14, 16],
    "Corvus Glaive": [13, 15, 17],
    "Thanos": [20, 24, 28],
    "Hela": [8, 10, 12],
    "Loki": [20, 20, 20],
    "The Hood": [14, 16, 18],
    "Sandman": [14, 16, 18],
    "Venom": [15, 18, 20],
    "Mysterio": [12, 14, 16],
    "Venom Goblin": [15, 18, 21],
    "Sabretooth": [14, 16, 18],
    "Sentinel": [15, 18, 20],
    "Master Mold": [16, 18, 20],
    "Magneto": [18, 20, 22],
    "MaGog": [14, 16, 18],
    "Spiral": [14, 16, 18],
    "Mojo": [16, 18, 20],
    "Juggernaut": [16, 18, 20],
    "Mister Sinister": [14, 16, 18],
    "Stryfe": [16, 18, 20],
    "Unus": [13, 15, 17],
    "Four Horsemen": [12, 12, 12],
    "Apocalypse": [18, 20, 22],
    "Dark Beast": [14, 16, 18],
    "Enchantress": [14, 16, 18],
    "Arcade": [14, 16, 18]
};

const fetchJson = (url) => {
    return new Promise((resolve) => {
        const options = { headers: { 'User-Agent': 'MarvelChampionsApp/1.0' } };
        https.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return resolve(fetchJson(res.headers.location));
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve([]); } });
        }).on('error', () => resolve([]));
    });
};

async function run() {
    console.log("🚀 Starting GOLDEN STATS Data Fetcher...");
    console.log("   Strategy: Using Hardcoded HP Map to fix 0 HP bug.");

    const packsData = await fetchJson(PACKS_API);
    if (!packsData || packsData.length === 0) return console.error("❌ API Error");

    const packCodes = packsData.map(p => p.code);
    const db = { villains: [], schemes: [], heroes: [], side_schemes: [], minions: [], allies: [] };

    console.log(`   Scanning ${packCodes.length} packs...`);

    for (const code of packCodes) {
        process.stdout.write(`.`); 
        const encounterCards = await fetchJson(`${GITHUB_BASE}/${code}_encounter.json`);
        
        for (const card of encounterCards) {
            const setCode = card.card_set_code || "unknown";
            
            // --- VILLAINS ---
            if (card.type_code === 'villain') {
                let existing = db.villains.find(v => v.name === card.name);
                
                // 1. TRY TO GET HP FROM GOLDEN MAP
                // This is our primary source of truth now.
                let goldenStats = VILLAIN_STATS[card.name];
                
                // If not found, use a safe default of 15 to avoid 0
                if (!goldenStats) goldenStats = [15, 15, 15]; 

                if (!existing) {
                    existing = {
                        name: card.name,
                        code: card.code,
                        set_code: setCode,
                        stages: goldenStats // Force the Golden Stats immediately
                    };
                    db.villains.push(existing);
                } else {
                    // Even if existing, ensure stats are correct
                    existing.stages = goldenStats;
                }
            }
            
            // --- MAIN SCHEMES ---
            else if (card.type_code === 'main_scheme') {
                if ((card.threat !== undefined && card.threat !== null) || card.base_threat_fixed === true) {
                    db.schemes.push({
                        name: card.name,
                        code: card.code,
                        set_code: setCode,
                        init: card.base_threat || 0,
                        target: card.threat || 0,
                        accel: card.acceleration || 0,
                        fixed: card.base_threat_fixed || false
                    });
                }
            }

            // --- OTHERS ---
            else if (card.type_code === 'side_scheme' && !db.side_schemes.some(s => s.name === card.name)) {
                db.side_schemes.push({ name: card.name, init: card.base_threat || 0, code: card.code });
            }
            else if (card.type_code === 'minion' && !db.minions.some(m => m.name === card.name)) {
                let hp = parseInt(String(card.health).replace(/[^0-9]/g, '')) || 0;
                db.minions.push({ name: card.name, hp: hp, code: card.code });
            }
        }

        // --- HEROES ---
        const playerCards = await fetchJson(`${GITHUB_BASE}/${code}.json`);
        for (const card of playerCards) {
            if (card.type_code === 'hero' && !db.heroes.some(h => h.name === card.name)) {
                let hp = parseInt(String(card.health).replace(/[^0-9]/g, '')) || 0;
                db.heroes.push({ name: card.name, hp: hp, code: card.code });
            }
            if (card.type_code === 'ally' && !db.allies.some(a => a.name === card.name)) {
                let hp = parseInt(String(card.health).replace(/[^0-9]/g, '')) || 0;
                db.allies.push({ name: card.name, hp: hp, code: card.code });
            }
        }
    }

    console.log("\n\n💾 Saving Database...");
    
    // Sort
    db.villains.sort((a, b) => a.name.localeCompare(b.name));
    db.schemes.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
    db.heroes.sort((a, b) => a.name.localeCompare(b.name));

    // Verify Ultron
    const ultron = db.villains.find(v => v.name === "Ultron");
    if (ultron) console.log(`\n🔍 CHECK: Ultron Stages: [${ultron.stages.join(", ")}]`);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(db, null, 2));
    console.log(`✅ DONE! Data written to ${OUTPUT_FILE}`);
}

run();