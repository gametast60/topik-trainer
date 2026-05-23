// =========================
// SHUFFLE
// =========================

function shuffleArray(array){
  for(let i = array.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// =========================
// VARIABLES
// =========================

let shuffledVocabulary = [];
let wrongAnswers = [];
let currentMode = "";
let currentIndex = 0;
let quizIndex = 0;
let fcIndex = 0;
let fcForgotten = [];

// =========================
// SPEAK
// =========================

function speak(text){
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}

function speakWord(){
  speak(shuffledVocabulary[currentIndex].word);
}

function speakQuizWord(){
  speak(shuffledVocabulary[quizIndex].word);
}

function speakFlashcard(){
  speak(shuffledVocabulary[fcIndex].word);
}

// =========================
// FLASHCARD MODE
// =========================

function startFlashcardMode(){
  currentMode = "flashcard";
  shuffledVocabulary = shuffleArray([...currentVocabulary]);
  fcIndex = 0;
  fcForgotten = [];
  goTo("flashcardGame");
  showFlashcard();
}

function showFlashcard(){
  const currentWord = shuffledVocabulary[fcIndex];

  // แสดงหน้าการ์ด ซ่อนหลังการ์ด
  document.getElementById("flashcardFront").classList.remove("hidden");
  document.getElementById("flashcardBack").classList.add("hidden");

  // ใส่คำศัพท์
  document.getElementById("fcWord").textContent = currentWord.word;
  document.getElementById("fcWordBack").textContent = currentWord.word;
  document.getElementById("fcMeaning").textContent = currentWord.meaning;

  // progress
  document.getElementById("flashcardProgress").textContent =
    `คำที่ ${fcIndex + 1} / ${shuffledVocabulary.length}`;

  // อ่านเสียงอัตโนมัติ
  speak(currentWord.word);
}

function flipCard(){
  document.getElementById("flashcardFront").classList.add("hidden");
  document.getElementById("flashcardBack").classList.remove("hidden");
}

function fcAnswer(known){
  const currentWord = shuffledVocabulary[fcIndex];

  if(!known){
    if(!fcForgotten.some(item => item.word === currentWord.word)){
      fcForgotten.push(currentWord);
    }
  }

  fcIndex++;

  if(fcIndex >= shuffledVocabulary.length){
    showFlashcardFinish();
  }else{
    showFlashcard();
  }
}

function showFlashcardFinish(){
  goTo("finishScreen");

  const wrongContainer = document.getElementById("wrongAnswers");

  if(fcForgotten.length === 0){
    wrongContainer.innerHTML = `
      <div class="wrong-list">
        <h3>🎉 จำได้ทั้งหมด ยอดเยี่ยมมาก!</h3>
      </div>
    `;
    return;
  }

  let html = `
    <div class="wrong-list">
      <h3>❌ คำที่ยังไม่ได้ (${fcForgotten.length} คำ)</h3>
  `;

  fcForgotten.forEach((item, index) => {
    html += `
      <div class="wrong-item">
        ${index + 1}. <b>${item.word}</b> = ${item.meaning}
      </div>
    `;
  });

  html += `</div>`;
  wrongContainer.innerHTML = html;
}

// =========================
// TYPING MODE
// =========================

function startTypingMode(){
  currentMode = "typing";
  shuffledVocabulary = shuffleArray([...currentVocabulary]);
  currentIndex = 0;
  wrongAnswers = [];
  goTo("typingGame");
  showWord();
}

function showWord(){
  const currentWord = shuffledVocabulary[currentIndex];

  document.getElementById("meaning").textContent = currentWord.meaning;
  document.getElementById("answerInput").value = "";
  document.getElementById("answerInput").disabled = false;
  document.getElementById("checkBtn").disabled = false;
  document.getElementById("result").textContent = "";
  document.getElementById("progress").textContent =
    `คำที่ ${currentIndex + 1} / ${shuffledVocabulary.length}`;

  document.getElementById("answerInput").focus();
}

function handleEnter(event){
  if(event.key === "Enter"){
    checkAnswer();
  }
}

function checkAnswer(){
  const input = document.getElementById("answerInput");
  const checkBtn = document.getElementById("checkBtn");
  const userAnswer = input.value.trim();

  if(checkBtn.disabled) return;

  const currentWord = shuffledVocabulary[currentIndex];
  const result = document.getElementById("result");

  if(userAnswer === currentWord.word){
    result.textContent = "✅ ถูกต้อง!";
    result.className = "result correct";

    input.disabled = true;
    checkBtn.disabled = true;

    setTimeout(() => {
      currentIndex++;
      if(currentIndex >= shuffledVocabulary.length){
        showFinish();
      }else{
        showWord();
      }
    }, 1000);

  }else{
    result.textContent = `❌ ${currentWord.word}`;
    result.className = "result wrong";

    if(!wrongAnswers.some(item => item.word === currentWord.word)){
      wrongAnswers.push(currentWord);
    }
  }
}

// =========================
// QUIZ MODE
// =========================

function startQuizMode(){
  currentMode = "quiz";
  shuffledVocabulary = shuffleArray([...currentVocabulary]);
  quizIndex = 0;
  wrongAnswers = [];
  goTo("quizGame");
  showQuiz();
}

function showQuiz(){
  const currentWord = shuffledVocabulary[quizIndex];

  document.getElementById("quizWord").textContent = currentWord.word;
  document.getElementById("quizResult").textContent = "";
  document.getElementById("quizProgress").textContent =
    `คำที่ ${quizIndex + 1} / ${shuffledVocabulary.length}`;

  const container = document.getElementById("choicesContainer");
  container.innerHTML = "";

  const numChoices = Math.min(4, shuffledVocabulary.length);
  let choices = [currentWord.meaning];

  const otherMeanings = shuffleArray(
    shuffledVocabulary
      .map(item => item.meaning)
      .filter(m => m !== currentWord.meaning)
  );

  for(let i = 0; choices.length < numChoices; i++){
    choices.push(otherMeanings[i]);
  }

  choices.sort(() => Math.random() - 0.5);

  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice;
    btn.onclick = () => checkQuizAnswer(choice);
    container.appendChild(btn);
  });

  speak(currentWord.word);
}

function checkQuizAnswer(choice){
  const currentWord = shuffledVocabulary[quizIndex];
  const result = document.getElementById("quizResult");
  const container = document.getElementById("choicesContainer");

  container.querySelectorAll(".choice-btn").forEach(btn => {
    btn.disabled = true;
  });

  if(choice === currentWord.meaning){
    result.textContent = "✅ ถูกต้อง!";
    result.className = "result correct";
  }else{
    result.textContent = `❌ ${currentWord.meaning}`;
    result.className = "result wrong";

    if(!wrongAnswers.some(item => item.word === currentWord.word)){
      wrongAnswers.push(currentWord);
    }
  }

  setTimeout(() => {
    quizIndex++;
    if(quizIndex >= shuffledVocabulary.length){
      showFinish();
    }else{
      showQuiz();
    }
  }, 1000);
}

// =========================
// FINISH (typing & quiz)
// =========================

function showFinish(){
  goTo("finishScreen");

  const wrongContainer = document.getElementById("wrongAnswers");

  if(wrongAnswers.length === 0){
    wrongContainer.innerHTML = `
      <div class="wrong-list">
        <h3>🎉 ตอบถูกทั้งหมด ยอดเยี่ยมมาก!</h3>
      </div>
    `;
    return;
  }

  let html = `
    <div class="wrong-list">
      <h3>❌ คำที่ตอบผิด (${wrongAnswers.length} คำ)</h3>
  `;

  wrongAnswers.forEach((item, index) => {
    html += `
      <div class="wrong-item">
        ${index + 1}. <b>${item.word}</b> = ${item.meaning}
      </div>
    `;
  });

  html += `</div>`;
  wrongContainer.innerHTML = html;
}
