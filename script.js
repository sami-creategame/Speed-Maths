const ecrans = {
  menu: document.getElementById("menu"),
  niveau: document.getElementById("niveau"),
  jeu: document.getElementById("jeu")
};

const questionEl = document.getElementById("question");
const reponseEl = document.getElementById("reponse");
const resultatEl = document.getElementById("resultat");
const scoreEl = document.getElementById("score");
const chronoEl = document.getElementById("chrono");
const chronoBar = document.getElementById("chrono-bar");
const validerBtn = document.getElementById("valider");
const retourBtn = document.getElementById("retour");
const topScoresList = document.getElementById("topScoresList");
const scoreMenu = document.getElementById("scoreMenu");
const sonCorrect = document.getElementById("sonCorrect");
const sonWrong = document.getElementById("sonWrong");

let operation = null;
let niveau = 1;
let score = 0;
let tempsRestant = 60;
let timer;
let nombre1, nombre2, reponseCorrecte;
let questionsPrevues = new Set();

// Navigation
document.querySelectorAll(".operation").forEach(btn => {
  btn.addEventListener("click", () => {
    operation = btn.dataset.op;
    changerEcran("niveau");
  });
});

document.querySelectorAll(".niveau").forEach(btn => {
  btn.addEventListener("click", () => {
    niveau = Number(btn.dataset.lvl);
    score = 0; tempsRestant = 60;
    scoreEl.textContent = `Score : ${score}`;
    scoreMenu.textContent = `Score actuel : ${score}`;
    chronoEl.textContent = `⏱️ Temps : ${tempsRestant}s`;
    chronoBar.style.width = "100%";
    questionsPrevues.clear();
    changerEcran("jeu");
    nouvelleQuestion();
    lancerChrono();
  });
});

retourBtn.addEventListener("click", () => changerEcran("menu"));
validerBtn.addEventListener("click", validate);

// Clavier virtuel
document.querySelectorAll(".clavier .key").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    if(btn.textContent==="←") reponseEl.value=reponseEl.value.slice(0,-1);
    else reponseEl.value+=btn.textContent;
  });
});
document.getElementById("keyEnter").addEventListener("click", validate);

// Clavier physique
document.addEventListener("keydown", e=>{
  if((e.key==="Enter"||e.key===" ") && !e.repeat){
    e.preventDefault();
    validate();
  }
});

// Fonctions
function changerEcran(nom){
  Object.values(ecrans).forEach(e=>e.classList.add("caché"));
  ecrans[nom].classList.remove("caché");
  clearInterval(timer);
  if(nom==="menu") afficherTopScores();
}

function genererNombre(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

function nouvelleQuestion(){
  let maxValeur,minValeur=1;
  if(niveau===1) maxValeur=10;
  else if(niveau===2) maxValeur=50;
  else maxValeur=200;

  let op = operation;
  if(op==="mix"){
    const ops=["add","sub","mul","div","sqrt","eq"];
    op = ops[Math.floor(Math.random()*ops.length)];
  }

  let questionKey="";
  do{
    nombre1=genererNombre(minValeur,maxValeur);
    nombre2=genererNombre(minValeur,maxValeur);

    switch(op){
      case "add": reponseCorrecte=nombre1+nombre2; questionEl.textContent=`${nombre1} + ${nombre2} = ?`; break;
      case "sub": reponseCorrecte=nombre1-nombre2; questionEl.textContent=`${nombre1} - ${nombre2} = ?`; break;
      case "mul": reponseCorrecte=nombre1*nombre2; questionEl.textContent=`${nombre1} × ${nombre2} = ?`; break;
      case "div": nombre2=genererNombre(1,10); reponseCorrecte=genererNombre(1,10); nombre1=nombre2*reponseCorrecte; questionEl.textContent=`${nombre1} ÷ ${nombre2} = ?`; break;
      case "sqrt": reponseCorrecte=genererNombre(1,10); nombre1=reponseCorrecte*reponseCorrecte; questionEl.textContent=`√${nombre1} = ?`; break;
      case "eq": let a=genererNombre(1,10), x=genererNombre(1,10), b=genererNombre(0,10); reponseCorrecte=x; let c=a*x+b; questionEl.textContent=`${a}x + ${b} = ${c}, x = ?`; break;
    }
    questionKey=`${op}-${nombre1}-${nombre2}`;
  } while(questionsPrevues.has(questionKey));
  questionsPrevues.add(questionKey);

  reponseEl.value="";
  resultatEl.textContent="";
}

function validate(){
  const reponseUtilisateur=Number(reponseEl.value);
  if(!reponseEl.value) return;

  if(reponseUtilisateur===reponseCorrecte){
    resultatEl.textContent="✅ Bonne réponse !";
    resultatEl.style.color="green";
    sonCorrect.play();
    score++;
  } else{
    resultatEl.textContent=`❌ Mauvaise réponse. C'était ${reponseCorrecte}.`;
    resultatEl.style.color="red";
    sonWrong.play();
    score=Math.max(0,score-1);
  }

  scoreEl.textContent=`Score : ${score}`;
  scoreMenu.textContent=`Score actuel : ${score}`;
  setTimeout(nouvelleQuestion,800);
}

function lancerChrono(){
  clearInterval(timer);
  timer=setInterval(()=>{
    tempsRestant--;
    chronoEl.textContent=`⏱️ Temps : ${tempsRestant}s`;
    chronoBar.style.width=`${(tempsRestant/60)*100}%`;
    if(tempsRestant<=10) chronoBar.style.backgroundColor="#dc3545";
    else if(tempsRestant<=30) chronoBar.style.backgroundColor="#ffc107";
    else chronoBar.style.backgroundColor="#28a745";

    if(tempsRestant<=0){
      clearInterval(timer);
      enregistrerScore(score,operation,niveau);
      changerEcran("menu");
    }
  },1000);
}

function enregistrerScore(score,cat,lvl){
  let scores=JSON.parse(localStorage.getItem("speedMathsScores"))||[];
  const date=new Date().toLocaleDateString("fr-FR");
  scores.push({score,cat,lvl,date});
  scores.sort((a,b)=>b.score-a.score);
  scores=scores.slice(0,10);
  localStorage.setItem("speedMathsScores",JSON.stringify(scores));
}

function afficherTopScores(){
  const scores=JSON.parse(localStorage.getItem("speedMathsScores"))||[];
  topScoresList.innerHTML="";
  if(scores.length===0){ topScoresList.innerHTML="<li>Aucun score enregistré</li>"; return; }
  const top=scores.slice(0,3);
  top.forEach((s,i)=>{
    const li=document.createElement("li");
    li.textContent=`${i+1}. 🏅 ${s.score} pts - ${s.cat} - Niv ${s.lvl} (${s.date})`;
    topScoresList.appendChild(li);
  });
}

afficherTopScores();
