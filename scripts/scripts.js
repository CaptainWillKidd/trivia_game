const firebaseConfig = {
    apiKey: "AIzaSyAStqws9j3TZPdtCSIbbfPyUMfXcBQYEQg",
    authDomain: "finalprojectwd330.firebaseapp.com",
    projectId: "finalprojectwd330",
    storageBucket: "finalprojectwd330.firebasestorage.app",
    messagingSenderId: "406713412663",
    appId: "1:406713412663:web:57aaf146bed2fecf79e3b2",
    measurementId: "G-99BGKDB1B7"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const userNameElement = document.getElementById('userName');
const authButton = document.getElementById('authButton');
const questionTextElement = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const scoreElement = document.getElementById('scoreValue');
const timerElement = document.getElementById('timerValue');
const nextButton = document.getElementById('nextButton');
const authModal = document.createElement('div');
authModal.className = 'auth-modal';
const leaderboardList = document.getElementById('leaderboardList');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const gameContainer = document.querySelector('.game-container');

let currentUser = null;
let score = 0;
let timer;
let timeLeft = 15;
let currentQuestion = {};
let questions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;

document.addEventListener('DOMContentLoaded', () => {
    initAuthModal();
    checkAuthState();
    loadLeaderboard();

    // Show last result from localStorage if exists
    const lastScore = localStorage.getItem('lastScore');
    const lastCorrect = localStorage.getItem('lastCorrect');
    const lastTotal = localStorage.getItem('lastTotal');
    const lastDate = localStorage.getItem('lastDate');
    if (lastScore && lastCorrect && lastTotal && lastDate) {
        startScreen.innerHTML = `
            <h2>Welcome to Trivia Challenge!</h2>
            <p>Your last result: <strong>${lastCorrect}/${lastTotal}</strong> correct answers (${lastScore} points) on ${lastDate}</p>
            <button id="startButton" class="btn btn-primary" style="font-size: 1.2em;">Start</button>
        `;
    } else {
        startScreen.innerHTML = `
            <h2>Welcome to Trivia Challenge!</h2>
            <button id="startButton" class="btn btn-primary" style="font-size: 1.2em;">Start</button>
        `;
    }

    // Ensure the Start button works
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', startGame);
    }
});

function startGame() {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'flex';
    correctAnswers = 0;
    score = 0;
    scoreElement.textContent = score;
    loadQuestions();
}

function checkAuthState() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            userNameElement.textContent = user.displayName || user.email.split('@')[0];
            authButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        } else {
            currentUser = null;
            userNameElement.textContent = 'Guest';
            authButton.innerHTML = '<i class="fas fa-user"></i> Login';
        }
    });
}

function loadLeaderboard() {
    db.collection('scores').orderBy('score', 'desc').get()
        .then(querySnapshot => {
            leaderboardList.innerHTML = '';
            const userScores = {};
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const key = data.uid || data.name;
                if (!userScores[key] || data.score > userScores[key].score) {
                    userScores[key] = data;
                }
            });
            const topScores = Object.values(userScores)
                .sort((a, b) => b.score - a.score)
                .slice(0, 5);
            topScores.forEach((data, index) => {
                const li = document.createElement('li');
                li.textContent = `${index + 1}. ${data.name} - ${data.score} points`;
                leaderboardList.appendChild(li);
            });
        })
        .catch(error => {
            console.error("Error loading leaderboard: ", error);
        });
}

function initAuthModal() {
    authModal.innerHTML = `
        <div class="auth-content">
            <button class="close-modal">&times;</button>
            <div class="auth-tabs">
                <div class="auth-tab active" data-tab="login">Login</div>
                <div class="auth-tab" data-tab="register">Register</div>
            </div>
            
            <div class="auth-form active" id="loginForm">
                <input type="email" id="loginEmail" placeholder="Email" required>
                <input type="password" id="loginPassword" placeholder="Password" required>
                <button class="btn btn-primary" id="loginButton">Login</button>
                
                <div class="auth-divider">or continue with</div>
                
                <div class="social-login">
                    <button class="social-btn google-btn" id="googleLogin">
                        <i class="fab fa-google"></i> Login with Google
                    </button>
                </div>
            </div>
            
            <div class="auth-form" id="registerForm">
                <input type="text" id="registerName" placeholder="Name" required>
                <input type="email" id="registerEmail" placeholder="Email" required>
                <input type="password" id="registerPassword" placeholder="Password" required>
                <button class="btn btn-primary" id="registerButton">Register</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(authModal);

    authButton.addEventListener('click', () => {
        if (currentUser) {
            auth.signOut();
        } else {
            authModal.style.display = 'flex';
        }
    });

    authModal.querySelector('.close-modal').addEventListener('click', () => {
        authModal.style.display = 'none';
    });

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}Form`).classList.add('active');
        });
    });

    document.getElementById('loginButton').addEventListener('click', () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                authModal.style.display = 'none';
            })
            .catch(error => {
                alert(`Login error: ${error.message}`);
            });
    });

    document.getElementById('registerButton').addEventListener('click', () => {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                return userCredential.user.updateProfile({
                    displayName: name
                });
            })
            .then(() => {
                authModal.style.display = 'none';
            })
            .catch(error => {
                alert(`Registration error: ${error.message}`);
            });
    });

    document.getElementById('googleLogin').addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then(() => {
                authModal.style.display = 'none';
            })
            .catch(error => {
                alert(`Google login error: ${error.message}`);
            });
    });
}

function loadQuestions() {
    fetch('https://opentdb.com/api.php?amount=15')
        .then(response => response.json())
        .then(data => {
            if (data.response_code === 0) {
                questions = data.results.map(q => {
                    return {
                        question: decodeHtmlEntities(q.question),
                        options: shuffleArray([...q.incorrect_answers, q.correct_answer].map(decodeHtmlEntities)),
                        correctAnswer: q.correct_answer,
                        category: q.category,
                        difficulty: q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)
                    };
                });
                currentQuestionIndex = 0;
                score = 0;
                scoreElement.textContent = score;
                loadNextQuestion();
            } else {
                console.error('Failed to load questions from API');
                loadStaticQuestions();
            }
        })
        .catch(error => {
            console.error('Error fetching questions:', error);
            loadStaticQuestions();
        });
}

function decodeHtmlEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function loadStaticQuestions() {
    questions = [
        {
            question: "What is the largest planet in the solar system?",
            options: ["Earth", "Mars", "Jupiter", "Saturn"],
            correctAnswer: "Jupiter",
            category: "Science",
            difficulty: "Easy"
        },
        {
            question: "Which chemical element has the symbol 'Au'?",
            options: ["Silver", "Gold", "Aluminum", "Argon"],
            correctAnswer: "Gold",
            category: "Science",
            difficulty: "Medium"
        },
        {
            question: "What is the largest ocean on planet Earth?",
            options: ["Atlantic", "Indian", "Arctic", "Pacific"],
            correctAnswer: "Pacific",
            category: "Geography",
            difficulty: "Easy"
        },
        {
            question: "In what year did man first walk on the Moon?",
            options: ["1965", "1969", "1972", "1975"],
            correctAnswer: "1969",
            category: "History",
            difficulty: "Medium"
        },
        {
            question: "What is the largest organ in the human body?",
            options: ["Heart", "Liver", "Skin", "Intestine"],
            correctAnswer: "Skin",
            category: "Biology",
            difficulty: "Easy"
        }
    ];
    currentQuestionIndex = 0;
    score = 0;
    scoreElement.textContent = score;
    loadNextQuestion();
}

function loadNextQuestion() {
    clearInterval(timer);
    timeLeft = 15;
    timerElement.textContent = timeLeft;

    if (currentQuestionIndex >= questions.length) {
        saveScore();
        showFinalResult();
        return;
    }

    currentQuestion = questions[currentQuestionIndex];
    currentQuestionIndex++;

    questionTextElement.textContent = currentQuestion.question;
    document.querySelector('.category').textContent = currentQuestion.category;
    document.querySelector('.difficulty').textContent = currentQuestion.difficulty;
    optionsContainer.innerHTML = '';

    currentQuestion.options.forEach((option) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option;
        optionElement.dataset.option = option;

        optionElement.addEventListener('click', () => {
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            optionElement.classList.add('selected');
            checkAnswer(option);
        });

        optionsContainer.appendChild(optionElement);
    });

    startTimer();
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            loadNextQuestion();
        }
    }, 1000);
}

function saveScore() {
    if (score > 0) {
        const userName = currentUser
            ? (currentUser.displayName || currentUser.email.split('@')[0])
            : "Guest";
        db.collection('scores').add({
            uid: currentUser ? currentUser.uid : null,
            name: userName,
            score: score,
            date: new Date()
        }).then(() => {
            loadLeaderboard();
        }).catch(error => {
            console.error("Error saving score: ", error);
        });
    }
}

function checkAnswer(selectedOption) {
    clearInterval(timer);

    const options = Array.from(optionsContainer.querySelectorAll('.option'));
    const correctOption = options.find(opt => opt.textContent === currentQuestion.correctAnswer);
    if (correctOption) {
        correctOption.style.borderColor = 'var(--primary)';
        correctOption.style.background = 'rgba(29, 185, 84, 0.2)';
    }

    if (selectedOption === currentQuestion.correctAnswer) {
        score += 10;
        correctAnswers++;
        scoreElement.textContent = score;
    } else {
        const selectedElement = optionsContainer.querySelector('.option.selected');
        if (selectedElement) {
            selectedElement.style.borderColor = 'var(--error)';
            selectedElement.style.background = 'rgba(239, 71, 111, 0.2)';
        }
    }

    setTimeout(loadNextQuestion, 2000);
}

function showFinalResult() {
    // Save result to localStorage
    localStorage.setItem('lastScore', score);
    localStorage.setItem('lastCorrect', correctAnswers);
    localStorage.setItem('lastTotal', questions.length);
    localStorage.setItem('lastDate', new Date().toLocaleString());

    let localLeaderboard = JSON.parse(localStorage.getItem('localLeaderboard')) || [];
    const userName = currentUser
        ? (currentUser.displayName || currentUser.email.split('@')[0])
        : "Guest";
    localLeaderboard.push({
        name: userName,
        score: score,
        date: new Date().toLocaleString()
    });
    localLeaderboard = localLeaderboard
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    localStorage.setItem('localLeaderboard', JSON.stringify(localLeaderboard));

    gameContainer.style.display = 'none';
    startScreen.style.display = 'flex';
    startScreen.innerHTML = `
        <h2>Game Over!</h2>
        <p>You answered <strong>${correctAnswers}/${questions.length}</strong> questions correctly.</p>
        <button id="startButton" class="btn btn-primary" style="font-size: 1.2em;">Play Again</button>
    `;
    document.getElementById('startButton').addEventListener('click', startGame);
}

if (nextButton) {
    nextButton.addEventListener('click', () => {
        clearInterval(timer);
        loadNextQuestion();
    });
}