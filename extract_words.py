import json

words = set()
with open('words.txt', 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        w = line.strip().lower()
        if len(w) == 5 and w.isalpha():
            words.add(w)

all_words = sorted(words)
print(f"Total 5-letter words: {len(all_words)}")

# Common answer words - well-known everyday English words
# We'll pick words that are common/recognizable
common = [
    "about","above","abuse","actor","adapt","added","admit","adopt","adult","after",
    "again","agent","agree","ahead","aimed","alarm","album","alien","align","alive",
    "alley","allow","alone","along","alter","amaze","among","ample","angel","anger",
    "angle","angry","ankle","annoy","apart","apple","apply","apron","arena","argue",
    "arise","armor","array","arrow","aside","asked","asset","atlas","audio","audit",
    "avoid","awake","award","aware","awful","bacon","badge","badly","baker","based",
    "basic","basin","basis","batch","beach","beard","beast","began","begin","being",
    "below","bench","berry","birth","black","blade","blame","bland","blank","blast",
    "blaze","bleed","blend","bless","blind","blink","block","blown","blood","bloom",
    "blown","blues","blunt","board","boast","bonus","boost","booth","bound","brain",
    "brand","brave","bread","break","breed","brick","bride","brief","bring","broad",
    "broke","brook","brown","brush","buddy","build","built","bunch","burnt","burst",
    "buyer","cabin","cable","camel","candy","cargo","carry","catch","cause","cease",
    "chain","chair","chalk","chaos","charm","chart","chase","cheap","cheat","check",
    "cheek","cheer","chess","chest","chief","child","china","choir","chord","chose",
    "chunk","cider","claim","clash","class","clean","clear","clerk","click","cliff",
    "climb","cling","clock","clone","close","cloth","cloud","clown","coach","coast",
    "color","comet","comic","coral","couch","could","count","court","cover","crack",
    "craft","crane","crash","crazy","cream","creek","crime","crisp","cross","crowd",
    "crown","crude","crush","curve","cycle","daily","dance","dated","deals","death",
    "debug","debut","decay","delay","dense","depth","derby","devil","diary","dirty",
    "disco","donor","doubt","dough","draft","drain","drama","drank","drawn","dream",
    "dress","dried","drift","drill","drink","drive","drone","drops","drove","truck",
    "drunk","dying","eager","early","earth","eaten","edges","eight","elder","elect",
    "elite","email","ember","empty","ended","enemy","enjoy","enter","entry","equal",
    "error","essay","event","every","exact","exams","exile","exist","extra","fable",
    "faced","fader","fades","faint","fairy","faith","false","fancy","fatal","fault",
    "feast","fence","ferry","fever","fewer","fiber","field","fifth","fifty","fight",
    "final","first","fixed","flame","flash","fleet","flesh","float","flock","flood",
    "floor","flora","flour","flows","fluid","flute","focal","focus","folly","force",
    "forge","forth","forum","found","foxes","frame","frank","fraud","fresh","front",
    "frost","froze","fruit","fully","fungi","ghost","giant","given","gives","glass",
    "globe","gloom","glory","glove","going","grace","grade","grain","grand","grant",
    "graph","grasp","grass","grave","great","greed","green","greet","grief","grill",
    "grind","gripe","gross","group","grove","grown","guard","guess","guest","guide",
    "guilt","guise","gypsy","habit","happy","hardy","harsh","hasn","haven","heart",
    "heavy","hedge","hello","hence","herbs","hilly","hired","hobby","holds","holes",
    "honey","honor","hoped","horse","hotel","hotly","house","human","humor","hurry",
    "hyper","ideal","image","imply","inbox","index","indie","infer","inner","input",
    "irate","irony","issue","ivory","jelly","jewel","joint","joker","jolly","judge",
    "juice","juicy","kebab","knife","knock","known","label","labor","lakes","lance",
    "large","laser","later","laugh","layer","leads","learn","lease","least","leave",
    "legal","lemon","level","light","liked","limit","linen","liver","lobby","local",
    "lodge","logic","login","logos","loose","lorry","loser","lover","lower","loyal",
    "lucky","lunar","lunch","lying","macro","magic","major","maker","manga","manor",
    "maple","march","marry","marsh","match","maybe","mayor","meals","meant","media",
    "melon","mercy","merge","merit","merry","messy","metal","meter","midst","might",
    "minor","minus","mirth","mixed","model","money","month","moody","moral","motor",
    "mound","mount","mouse","mouth","moved","movie","muddy","music","naive","named",
    "nasty","naval","nerve","never","newly","niche","night","noble","noise","north",
    "noted","novel","nurse","nylon","occur","ocean","offer","often","olive","onion",
    "onset","opens","opera","orbit","order","other","ought","outer","owned","owner",
    "oxide","ozone","paint","panel","panic","paper","parts","party","pasta","paste",
    "patch","pause","peace","peach","pearl","penny","perch","phase","phone","photo",
    "piano","piece","pilot","pinch","pitch","pixel","pizza","place","plain","plane",
    "plant","plate","plaza","plead","pluck","plumb","plume","plump","plunge","point",
    "polar","posed","pouch","pound","power","press","price","pride","prime","print",
    "prior","prize","probe","prone","proof","proud","prove","proxy","psalm","pulse",
    "punch","pupil","purse","queen","query","quest","queue","quick","quiet","quota",
    "quote","radar","radio","raise","rally","ranch","range","rapid","rated","ratio",
    "reach","react","ready","realm","rebel","refer","reign","relax","relay","renew",
    "repay","reply","rider","ridge","rifle","right","rigid","risky","rival","river",
    "roast","robin","robot","rocky","roman","roomy","roots","rough","round","route",
    "royal","rugby","ruler","rural","sadly","saint","salad","sauce","scale","scare",
    "scene","scent","scope","score","scout","scrap","sense","serve","setup","seven",
    "shade","shaft","shall","shame","shape","share","shark","sharp","shave","sheep",
    "sheer","sheet","shelf","shell","shift","shine","shiny","shirt","shock","shoot",
    "shore","short","shout","shown","sight","silly","since","sixth","sixty","sized",
    "skill","skull","slate","slave","sleep","slice","slide","slope","slowly","small",
    "smart","smell","smile","smoke","snake","solar","solid","solve","sorry","sound",
    "south","space","spare","spark","spawn","speak","speed","spend","spent","spice",
    "spine","spite","split","spoke","spoon","sport","spray","squad","stack","staff",
    "stage","stain","stair","stake","stale","stall","stamp","stand","stare","stark",
    "start","state","stays","steak","steal","steam","steel","steep","steer","stern",
    "stick","stiff","still","stock","stole","stone","stood","store","storm","story",
    "stout","stove","strap","straw","strip","stuck","study","stuff","stump","style",
    "sugar","suite","sunny","super","surge","swamp","swear","sweat","sweep","sweet",
    "swept","swift","swing","sword","swore","sworn","syrup","table","taken","tales",
    "taste","taxed","teach","teeth","tempo","tempt","tends","tenor","tense","terms",
    "thank","theme","thick","thief","thing","think","third","thorn","those","three",
    "threw","throw","thumb","tidal","tight","timer","tired","titan","title","toast",
    "today","token","topic","total","touch","tough","towel","tower","toxic","trace",
    "track","trade","trail","train","trait","trash","treat","trend","trial","tribe",
    "trick","tried","troop","truck","truly","trump","trunk","trust","truth","tumor",
    "tuned","turns","twice","twist","tying","typed","ultra","uncle","under","unify",
    "union","unite","unity","until","upper","upset","urban","usage","using","usual",
    "utter","vague","valid","value","valve","vapor","vault","venue","verse","video",
    "vigor","vinyl","viral","virus","visit","vista","vital","vivid","vocal","voice",
    "voter","wages","waste","watch","water","weary","weave","wedge","weigh","weird",
    "whale","wheat","wheel","where","which","while","white","whole","whose","width",
    "witch","woman","women","world","worry","worse","worst","worth","would","wound",
    "wrath","write","wrong","wrote","yacht","yield","young","yours","youth","zones"
]

# Filter common words to only include those in the dictionary
answer_words = sorted([w for w in common if w in words and len(w) == 5])
print(f"Answer words (filtered): {len(answer_words)}")

# Write words.js
with open('words.js', 'w', encoding='utf-8') as f:
    f.write("// Wordle dictionary - auto-generated from words.txt\n")
    f.write("// ANSWERS: common words used as target words\n")
    f.write("// VALID: all accepted 5-letter words for guessing\n\n")
    f.write(f"const WORDLE_ANSWERS = {json.dumps(answer_words)};\n\n")
    f.write(f"const WORDLE_VALID = new Set({json.dumps(all_words)});\n")

print("words.js written successfully!")
print(f"Answers: {len(answer_words)}, Valid guesses: {len(all_words)}")
