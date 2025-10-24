/* ================================
    Plot Twisted — ENHANCED VERSION
    Features: Taglines, No duplicates, Pass & Play, Reorganized categories
================================== */

// --- BOOT ---
document.addEventListener('DOMContentLoaded', () => {
  const game = new PlotTwistedGame();
  game.init();
});

class PlotTwistedGame {
  constructor() {
    this.allClues = [];
    this.categoryData = new Map();
    this.dom = {};
    this.state = {
      currentScreen: 'start',
      gameMode: 'standard', // 'standard' or 'passplay'
      selectedCategory: null,
      gameQuestions: [],
      currentQuestionIndex: 0,
      playedQuestions: [],
      totalScore: 0,
      currentAnswer: '',
      guessedLetters: [],
      isRoundOver: false,
      strikesLeft: 3,
      consecutiveCorrect: 0, // Track consecutive correct answers
      // Pass & Play
      passPlayState: {
        player1Name: 'Player 1',
        player2Name: 'Player 2',
        player1Category: null,
        player2Category: null,
        player1Score: 0,
        player2Score: 0,
        currentPlayer: 1,
        sharedStrikes: 3,
      }
    };
    this.settings = {
      darkMode: false,
      neonTheme: false,
      sound: true,
      numRounds: 10,
    };
    this.keyLayout = ['QWERTYUIOP'.split(''), 'ASDFGHJKL'.split(''), 'ZXCVBNM'.split('')];
    
    // Rotating taglines
    this.taglines = [
      "Where movie plots go to get roasted",
      "Guess the film. Judge the summary.",
      "Cinema, but make it chaos",
      "Your favorite movies, hilariously misremembered",
      "Plot summaries that failed film school",
      "Hollywood's worst elevator pitches",
      "Movies explained badly. You guess correctly.",
      "The most accurate inaccurate descriptions",
      "Spoilers, but funny",
      "Cinema's identity crisis continues..."
    ];
  }

  // ---------- INIT ----------
  init() {
    console.log('🎬 Plot Twisted - Initializing...');
    
    this.allClues = Array.isArray(window.cluesJSON) ? window.cluesJSON : [];
    console.log(`✅ Loaded ${this.allClues.length} clues`);
    
    this.cacheDomElements();
    console.log('✅ DOM elements cached');
    
    this.processCluesIntoCategories();
    console.log(`✅ Processed ${this.categoryData.size} categories`);
    
    this.loadSettings();
    console.log('✅ Settings loaded');
    
    this.applySettingsToUI();
    console.log('✅ Settings applied to UI');
    
    this.bindEventListeners();
    console.log('✅ Event listeners bound');
    
    this.renderCategoryScreen();
    console.log('✅ Category screen rendered');
    
    this.setupPhysicalKeyboard();
    console.log('✅ Physical keyboard setup');
    
    this.startTaglineRotation();
    console.log('✅ Tagline rotation started');
    
    this.showScreen('start');
    console.log('✅ Showing start screen');
    console.log('🎮 Game ready!');
  }

  getEl(id) {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`⚠️ Element not found: #${id}`);
    }
    return el;
  }

  cacheDomElements() {
    this.dom = {
      screens: {
        start: this.getEl('startScreen'),
        category: this.getEl('categoryScreen'),
        game: this.getEl('gameScreen'),
        gameOver: this.getEl('gameOverScreen'),
        settings: this.getEl('settingsScreen'),
        howToPlay: this.getEl('howToPlayScreen'),
        credits: this.getEl('creditsScreen'),
        dailyChallenge: this.getEl('dailyChallengeScreen'),
        moreModes: this.getEl('moreModesScreen'),
        passPlaySetup: this.getEl('passPlaySetupScreen'),
      },
      displays: {
        clueText: this.getEl('clueText'),
        wordDisplay: document.querySelector('.word-display'),
        gameProgressDisplay: this.getEl('gameProgressDisplay'),
        gameScoreDisplay: this.getEl('gameScoreDisplay'),
        strikesDisplay: this.getEl('strikesDisplay'),
        gameOverTitle: this.getEl('gameOverTitle'),
        finalScore: this.getEl('finalScore'),
        scoreBreakdown: this.getEl('scoreBreakdown'),
        tagline: this.getEl('menuTagline'),
      },
      containers: {
        keyboard: this.getEl('keyboard'),
        continueOverlay: this.getEl('continue-overlay'),
        categoryGrid: document.querySelector('.category-grid'),
        confirmModal: this.getEl('confirmModal'),
        screenBox: document.querySelector('.screen-box'),
      },
      buttons: {
        startGameBtn: this.getEl('startGameBtn'),
        playBtn: this.getEl('playBtn'),
        skipBtn: this.getEl('skipBtn'),
        continueBtn: this.getEl('continueBtn'),
        finishGameBtn: this.getEl('finishGameBtn'),
        playAgainBtn: this.getEl('playAgainBtn'),
        speakBtn: this.getEl('speakBtn'),
        chooseNewCategoryBtn: this.getEl('chooseNewCategoryBtn'),
        viewCreditsBtn: this.getEl('viewCreditsBtn'),
        confirmQuitBtn: this.getEl('confirmQuitBtn'),
        cancelQuitBtn: this.getEl('cancelQuitBtn'),
        // Back buttons
        categoryBackToHomeBtn: this.getEl('categoryBackToHomeBtn'),
        gameOverBackToHomeBtn: this.getEl('gameOverBackToHomeBtn'),
        creditsBackBtn: this.getEl('creditsBackBtn'),
        settingsBtn: this.getEl('settingsBtn'),
        settingsBackBtn: this.getEl('settingsBackBtn'),
        howToPlayBtn: this.getEl('howToPlayBtn'),
        howToPlayBackBtn: this.getEl('howToPlayBackBtn'),
        dailyChallengeBtn: this.getEl('dailyChallengeBtn'),
        dailyChallengeBackBtn: this.getEl('dailyChallengeBackBtn'),
        moreModesBtn: this.getEl('moreModesBtn'),
        moreModesBackBtn: this.getEl('moreModesBackBtn'),
        // Pass & Play
        passPlayBtn: this.getEl('passPlayBtn'),
        passPlayStartBtn: this.getEl('passPlayStartBtn'),
        passPlayBackBtn: this.getEl('passPlayBackBtn'),
      },
      settingsToggles: {
        darkMode: this.getEl('darkModeToggle'),
        neonTheme: this.getEl('neonThemeToggle'),
        sound: this.getEl('soundToggle'),
        gameLength: this.getEl('gameLengthSelector'),
      },
    };
  }

  processCluesIntoCategories() {
    const catMap = new Map();

    // Build individual categories (no "All Categories")
    this.allClues.forEach(clue => {
      if (!catMap.has(clue.category)) {
        catMap.set(clue.category, {
          name: clue.category,
          emoji: clue.emoji || '🎬',
          clues: [],
        });
      }
      catMap.get(clue.category).clues.push(clue);
    });

    this.categoryData = catMap;
  }

  // ---------- TAGLINE ROTATION ----------
  startTaglineRotation() {
    if (!this.dom.displays.tagline) return;
    
    // Set initial random tagline
    this.rotateTagline();
    
    // Rotate every 4 seconds
    setInterval(() => this.rotateTagline(), 4000);
  }

  rotateTagline() {
    if (!this.dom.displays.tagline) return;
    
    const randomTagline = this.taglines[Math.floor(Math.random() * this.taglines.length)];
    
    // Fade out
    this.dom.displays.tagline.style.opacity = '0';
    
    setTimeout(() => {
      this.dom.displays.tagline.textContent = randomTagline;
      // Fade in
      this.dom.displays.tagline.style.opacity = '1';
    }, 300);
  }

  // ---------- SETTINGS ----------
  loadSettings() {
    try {
      const saved = localStorage.getItem('plotTwistedSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('plotTwistedSettings', JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  applySettingsToUI() {
    // Dark mode
    if (this.settings.darkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('neon-theme');
      if (this.dom.settingsToggles.darkMode) this.dom.settingsToggles.darkMode.classList.add('active');
      if (this.dom.settingsToggles.neonTheme) this.dom.settingsToggles.neonTheme.classList.remove('active');
    }
    // Neon theme
    else if (this.settings.neonTheme) {
      document.body.classList.add('neon-theme');
      document.body.classList.remove('dark-mode');
      if (this.dom.settingsToggles.neonTheme) this.dom.settingsToggles.neonTheme.classList.add('active');
      if (this.dom.settingsToggles.darkMode) this.dom.settingsToggles.darkMode.classList.remove('active');
    }
    // Light mode
    else {
      document.body.classList.remove('dark-mode', 'neon-theme');
      if (this.dom.settingsToggles.darkMode) this.dom.settingsToggles.darkMode.classList.remove('active');
      if (this.dom.settingsToggles.neonTheme) this.dom.settingsToggles.neonTheme.classList.remove('active');
    }

    // Sound toggle
    if (this.dom.settingsToggles.sound) {
      this.dom.settingsToggles.sound.classList.toggle('active', this.settings.sound);
    }

    // Game length buttons
    if (this.dom.settingsToggles.gameLength) {
      this.dom.settingsToggles.gameLength.querySelectorAll('.length-btn').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.count) === this.settings.numRounds);
      });
    }
  }

  // ---------- EVENT LISTENERS ----------
  bindEventListeners() {
    const map = [
      // Main menu
      { el: this.dom.buttons.startGameBtn, fn: () => this.showScreen('category') },
      { el: this.dom.buttons.settingsBtn, fn: () => this.showScreen('settings') },
      { el: this.dom.buttons.howToPlayBtn, fn: () => this.showScreen('howToPlay') },
      { el: this.dom.buttons.dailyChallengeBtn, fn: () => this.showScreen('dailyChallenge') },
      { el: this.dom.buttons.moreModesBtn, fn: () => this.showScreen('moreModes') },

      // Pass & Play
      { el: this.dom.buttons.passPlayBtn, fn: () => this.startPassPlaySetup() },
      { el: this.dom.buttons.passPlayStartBtn, fn: () => this.startPassPlayGame() },
      { el: this.dom.buttons.passPlayBackBtn, fn: () => this.showScreen('moreModes') },

      // Back buttons
      { el: this.dom.buttons.categoryBackToHomeBtn, fn: () => this.showScreen('start') },
      { el: this.dom.buttons.settingsBackBtn, fn: () => this.showScreen('start') },
      { el: this.dom.buttons.howToPlayBackBtn, fn: () => this.showScreen('start') },
      { el: this.dom.buttons.dailyChallengeBackBtn, fn: () => this.showScreen('start') },
      { el: this.dom.buttons.moreModesBackBtn, fn: () => this.showScreen('start') },
      { el: this.dom.buttons.gameOverBackToHomeBtn, fn: () => this.showScreen('start') },
      { el: this.dom.buttons.creditsBackBtn, fn: () => this.showScreen('gameOver') },

      // Game flow
      { el: this.dom.buttons.playBtn, fn: () => this.startGame() },
      { el: this.dom.buttons.skipBtn, fn: () => this.skipQuestion() },
      { el: this.dom.buttons.continueBtn, fn: () => this.nextQuestion() },
      { el: this.dom.buttons.finishGameBtn, fn: () => this.showQuitConfirmation() },
      
      // Game over
      { el: this.dom.buttons.playAgainBtn, fn: () => this.playAgain() },
      { el: this.dom.buttons.chooseNewCategoryBtn, fn: () => this.showScreen('category') },
      { el: this.dom.buttons.viewCreditsBtn, fn: () => this.showCredits() },

      // Quit modal
      { el: this.dom.buttons.confirmQuitBtn, fn: () => this.quitGame() },
      { el: this.dom.buttons.cancelQuitBtn, fn: () => this.hideQuitConfirmation() },

      // Speak button
      { el: this.dom.buttons.speakBtn, fn: () => this.speakClue() },
    ];

    map.forEach(({ el, fn }) => {
      if (el) {
        el.addEventListener('click', fn);
      } else {
        console.warn('⚠️ Button element not found for event binding');
      }
    });
    
    console.log(`✅ Bound ${map.filter(m => m.el).length}/${map.length} button events`);

    // Category selection
    if (this.dom.containers.categoryGrid) {
      this.dom.containers.categoryGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.category-btn');
        if (btn) this.selectCategory(btn.dataset.category);
      });
    }

    // Settings toggles
    if (this.dom.settingsToggles.darkMode) {
      this.dom.settingsToggles.darkMode.addEventListener('click', () => {
        this.settings.darkMode = !this.settings.darkMode;
        if (this.settings.darkMode) this.settings.neonTheme = false;
        this.saveSettings();
        this.applySettingsToUI();
      });
    }

    if (this.dom.settingsToggles.neonTheme) {
      this.dom.settingsToggles.neonTheme.addEventListener('click', () => {
        this.settings.neonTheme = !this.settings.neonTheme;
        if (this.settings.neonTheme) this.settings.darkMode = false;
        this.saveSettings();
        this.applySettingsToUI();
      });
    }

    if (this.dom.settingsToggles.sound) {
      this.dom.settingsToggles.sound.addEventListener('click', () => {
        this.settings.sound = !this.settings.sound;
        this.saveSettings();
        this.applySettingsToUI();
      });
    }

    if (this.dom.settingsToggles.gameLength) {
      this.dom.settingsToggles.gameLength.addEventListener('click', (e) => {
        if (e.target.classList.contains('length-btn')) {
          this.settings.numRounds = parseInt(e.target.dataset.count);
          this.saveSettings();
          this.applySettingsToUI();
        }
      });
    }
  }

  // ---------- PHYSICAL KEYBOARD SUPPORT ----------
  setupPhysicalKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Only active during game screen and not round over
      if (this.state.currentScreen !== 'game' || this.state.isRoundOver) return;
      
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        e.preventDefault();
        this.handleKeyPress(key);
      }
    });
  }

  // ---------- SCREENS ----------
  showScreen(screenName) {
    Object.values(this.dom.screens).forEach(s => {
      if (s) s.classList.remove('active');
    });

    const target = this.dom.screens[screenName];
    if (target) {
      target.classList.add('active');
      this.state.currentScreen = screenName;
    }

    if (screenName === 'category') {
      this.state.selectedCategory = null;
      this.renderCategoryScreen();
    }
  }

  renderCategoryScreen() {
    const grid = this.dom.containers.categoryGrid;
    if (!grid) return;
    
    grid.innerHTML = '';
    if (this.dom.buttons.playBtn) this.dom.buttons.playBtn.disabled = true;

    // Render categories in organized grid (no "All Categories")
    this.categoryData.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.dataset.category = cat.name;
      btn.innerHTML = `
        <div class="poster-emoji">${cat.emoji}</div>
        <div class="tape-label">${cat.name}</div>
      `;
      grid.appendChild(btn);
    });
  }

  selectCategory(category) {
    this.state.selectedCategory = category;
    this.dom.containers.categoryGrid.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.category === category);
    });
    if (this.dom.buttons.playBtn) this.dom.buttons.playBtn.disabled = false;
    this.playSound('correct');
  }

  // ---------- PASS & PLAY MODE ----------
  startPassPlaySetup() {
    // Create Pass & Play setup screen if it doesn't exist
    if (!this.dom.screens.passPlaySetup) {
      this.createPassPlaySetupScreen();
    }
    this.showScreen('passPlaySetup');
  }

  createPassPlaySetupScreen() {
    const existingScreen = this.getEl('passPlaySetupScreen');
    if (existingScreen) return;

    const screen = document.createElement('div');
    screen.id = 'passPlaySetupScreen';
    screen.className = 'screen';
    screen.innerHTML = `
      <div class="screen-content">
        <div class="logo logo-small">Pass & Play</div>
        <p style="margin-bottom: 20px;">Each player chooses a category for the other player!</p>
        
        <div class="passplay-setup">
          <div class="player-setup">
            <h3>🎮 Player 1</h3>
            <input type="text" id="player1Name" placeholder="Enter name" value="Player 1" maxlength="15">
            <p style="font-size: 0.9rem; margin: 10px 0;">Choose category for Player 2:</p>
            <select id="player1CategorySelect" class="category-select">
              <option value="">Select...</option>
            </select>
          </div>

          <div class="player-setup">
            <h3>🎮 Player 2</h3>
            <input type="text" id="player2Name" placeholder="Enter name" value="Player 2" maxlength="15">
            <p style="font-size: 0.9rem; margin: 10px 0;">Choose category for Player 1:</p>
            <select id="player2CategorySelect" class="category-select">
              <option value="">Select...</option>
            </select>
          </div>
        </div>

        <button class="btn" id="passPlayStartBtn">START GAME</button>
        <button class="btn secondary" id="passPlayBackBtn">BACK</button>
      </div>
    `;

    document.querySelector('.app-container').appendChild(screen);
    this.dom.screens.passPlaySetup = screen;
    this.dom.buttons.passPlayStartBtn = this.getEl('passPlayStartBtn');
    this.dom.buttons.passPlayBackBtn = this.getEl('passPlayBackBtn');

    // Populate category selects
    const select1 = this.getEl('player1CategorySelect');
    const select2 = this.getEl('player2CategorySelect');
    
    this.categoryData.forEach(cat => {
      const opt1 = document.createElement('option');
      opt1.value = cat.name;
      opt1.textContent = `${cat.emoji} ${cat.name}`;
      select1.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = cat.name;
      opt2.textContent = `${cat.emoji} ${cat.name}`;
      select2.appendChild(opt2);
    });

    // Re-bind event listeners
    this.dom.buttons.passPlayStartBtn.addEventListener('click', () => this.startPassPlayGame());
    this.dom.buttons.passPlayBackBtn.addEventListener('click', () => this.showScreen('moreModes'));
  }

  startPassPlayGame() {
    const p1Name = this.getEl('player1Name')?.value || 'Player 1';
    const p2Name = this.getEl('player2Name')?.value || 'Player 2';
    const p1Cat = this.getEl('player1CategorySelect')?.value;
    const p2Cat = this.getEl('player2CategorySelect')?.value;

    if (!p1Cat || !p2Cat) {
      alert('Please select categories for both players!');
      return;
    }

    this.state.gameMode = 'passplay';
    this.state.passPlayState = {
      player1Name: p1Name,
      player2Name: p2Name,
      player1Category: p2Cat, // P1 plays P2's category
      player2Category: p1Cat, // P2 plays P1's category
      player1Score: 0,
      player2Score: 0,
      currentPlayer: 1,
      sharedStrikes: 3,
    };

    this.resetGameState();
    this.state.strikesLeft = 3;

    // Build combined question set
    const p1Clues = this.categoryData.get(p2Cat)?.clues || [];
    const p2Clues = this.categoryData.get(p1Cat)?.clues || [];
    
    const p1Questions = this.getUniqueQuestions(p1Clues, Math.ceil(this.settings.numRounds / 2));
    const p2Questions = this.getUniqueQuestions(p2Clues, Math.ceil(this.settings.numRounds / 2));

    // Interleave questions
    this.state.gameQuestions = [];
    for (let i = 0; i < Math.max(p1Questions.length, p2Questions.length); i++) {
      if (p1Questions[i]) this.state.gameQuestions.push({ ...p1Questions[i], forPlayer: 1 });
      if (p2Questions[i]) this.state.gameQuestions.push({ ...p2Questions[i], forPlayer: 2 });
    }

    this.state.currentQuestionIndex = 0;
    this.showScreen('game');
    this.nextQuestion();
    this.playSound('win');
  }

  // ---------- GAME FLOW ----------
  startGame() {
    if (!this.state.selectedCategory) return;

    this.state.gameMode = 'standard';
    this.resetGameState();

    const categoryClues = this.categoryData.get(this.state.selectedCategory)?.clues || [];
    
    // Use getUniqueQuestions to prevent duplicates
    this.state.gameQuestions = this.getUniqueQuestions(categoryClues, this.settings.numRounds);

    this.state.currentQuestionIndex = 0;
    this.showScreen('game');
    this.nextQuestion();
    this.playSound('win');
  }

  // PREVENTS DUPLICATES - Groups by title and picks one from each
  getUniqueQuestions(clues, count) {
    // Group clues by title
    const titleGroups = new Map();
    clues.forEach(clue => {
      if (!titleGroups.has(clue.title)) {
        titleGroups.set(clue.title, []);
      }
      titleGroups.get(clue.title).push(clue);
    });

    // Pick one random clue from each title group
    const uniqueClues = Array.from(titleGroups.values()).map(group => {
      return group[Math.floor(Math.random() * group.length)];
    });

    // Shuffle and take the requested count
    return this.shuffleArray(uniqueClues).slice(0, count);
  }

  resetGameState() {
    this.state.totalScore = 0;
    this.state.playedQuestions = [];
    this.state.strikesLeft = 3;
    this.state.consecutiveCorrect = 0;
  }

  nextQuestion() {
    if (this.state.currentQuestionIndex >= this.state.gameQuestions.length) {
      this.endGame();
      return;
    }

    const question = this.state.gameQuestions[this.state.currentQuestionIndex];
    this.state.currentAnswer = question.title.toUpperCase();
    this.state.guessedLetters = [];
    this.state.isRoundOver = false;

    // Show clue with player indicator for Pass & Play
    let clueText = question.clue;
    if (this.state.gameMode === 'passplay' && question.forPlayer) {
      const playerName = question.forPlayer === 1 
        ? this.state.passPlayState.player1Name 
        : this.state.passPlayState.player2Name;
      clueText = `<div style="font-size: 0.9rem; color: var(--primary-color); margin-bottom: 10px;">🎮 ${playerName}'s Turn</div>${question.clue}`;
    }
    
    this.dom.displays.clueText.innerHTML = clueText;
    
    // Hide Continue overlay until win/skip
    this.dom.containers.continueOverlay.classList.remove('visible');

    this.updateWordDisplay();
    this.renderKeyboard();
    
    // Increment for display purposes
    this.state.currentQuestionIndex++;
    this.updateGameStatusDisplay();
  }

  updateWordDisplay() {
    const answer = this.state.currentAnswer;
    const display = answer.split('').map(char => {
      if (char === ' ') return ' '; // Single space for word breaks
      if (!/^[A-Z0-9]$/.test(char)) return char; // Show special chars
      return this.state.guessedLetters.includes(char) ? char : '_';
    }).join('');
    
    this.dom.displays.wordDisplay.textContent = display;
  }

  renderKeyboard() {
    const keyboard = this.dom.containers.keyboard;
    if (!keyboard) return;
    
    keyboard.innerHTML = '';
    
    this.keyLayout.forEach(row => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'keyboard-row';
      
      row.forEach(key => {
        const keyBtn = document.createElement('button');
        keyBtn.className = 'key';
        keyBtn.textContent = key;
        keyBtn.dataset.key = key;
        
        if (this.state.guessedLetters.includes(key)) {
          keyBtn.classList.add('disabled');
          keyBtn.disabled = true;
        }
        
        keyBtn.addEventListener('click', () => this.handleKeyPress(key));
        rowDiv.appendChild(keyBtn);
      });
      
      keyboard.appendChild(rowDiv);
    });
  }

  disableKeyboard() {
    if (this.dom.containers.keyboard) {
      this.dom.containers.keyboard.querySelectorAll('.key').forEach(k => {
        k.classList.add('disabled');
        k.disabled = true;
      });
    }
  }

  handleKeyPress(key) {
    if (this.state.isRoundOver || this.state.guessedLetters.includes(key)) return;

    this.state.guessedLetters.push(key);
    this.renderKeyboard();

    if (this.state.currentAnswer.includes(key)) {
      this.playSound('correct');
      this.updateWordDisplay();
      this.checkForWin();
    } else {
      this.playSound('wrong');
      this.state.strikesLeft--;
      
      // Update shared strikes in Pass & Play
      if (this.state.gameMode === 'passplay') {
        this.state.passPlayState.sharedStrikes = this.state.strikesLeft;
      }
      
      this.updateGameStatusDisplay();

      // Shake animation
      if (this.dom.containers.screenBox) {
        this.dom.containers.screenBox.classList.add('animate-shake');
        setTimeout(() => this.dom.containers.screenBox.classList.remove('animate-shake'), 500);
      }

      if (this.state.strikesLeft <= 0) {
        this.revealAnswerAndEnd();
      }
    }
  }

  checkForWin() {
    const display = this.dom.displays.wordDisplay.textContent.replace(/\s/g, '');
    const answer = this.state.currentAnswer.replace(/[^A-Z0-9]/g, '');
    
    if (display === answer) {
      this.state.isRoundOver = true;
      this.state.consecutiveCorrect++;
      
      // Base score
      let roundScore = 100;
      
      // Consecutive bonus: 50 points after 2+ in a row
      let bonusScore = 0;
      if (this.state.consecutiveCorrect >= 2) {
        bonusScore = 50;
        roundScore += bonusScore;
      }
      
      this.state.totalScore += roundScore;

      const currentQuestion = this.state.gameQuestions[this.state.currentQuestionIndex - 1];
      this.state.playedQuestions.push({ 
        ...currentQuestion, 
        status: 'correct',
        score: roundScore,
        hadBonus: bonusScore > 0
      });

      // Update Pass & Play scores
      if (this.state.gameMode === 'passplay' && currentQuestion.forPlayer) {
        if (currentQuestion.forPlayer === 1) {
          this.state.passPlayState.player1Score += roundScore;
        } else {
          this.state.passPlayState.player2Score += roundScore;
        }
      }

      // Show feedback with bonus notification
      let feedbackMsg = '✓ Correct!';
      if (bonusScore > 0) {
        feedbackMsg += ` <span style="color: gold;">+${bonusScore} STREAK BONUS! 🔥</span>`;
      }
      if (this.state.consecutiveCorrect >= 2) {
        feedbackMsg += ` <span style="font-size: 0.85rem;">(${this.state.consecutiveCorrect} in a row!)</span>`;
      }
      
      this.dom.displays.clueText.innerHTML = `<span class="clue-feedback correct">${feedbackMsg}</span>`;
      this.dom.containers.continueOverlay.classList.add('visible');
      this.playSound('win');
    }
  }

  skipQuestion() {
    if (this.state.isRoundOver) return;

    this.state.isRoundOver = true;
    this.state.consecutiveCorrect = 0; // Reset streak
    
    const currentQuestion = this.state.gameQuestions[this.state.currentQuestionIndex - 1];
    this.state.playedQuestions.push({ ...currentQuestion, status: 'skipped', score: 0 });

    this.dom.displays.clueText.innerHTML = 
      `<span class="clue-feedback incorrect">Skipped! The answer was: ${this.state.currentAnswer}</span>`;

    this.disableKeyboard();
    if (this.dom.buttons.skipBtn) this.dom.buttons.skipBtn.disabled = true;
    this.dom.containers.continueOverlay.classList.add('visible');
  }

  updateGameStatusDisplay() {
    const cur = Math.min(this.state.currentQuestionIndex, this.state.gameQuestions.length);
    this.dom.displays.gameProgressDisplay.textContent = `${cur}/${this.state.gameQuestions.length}`;
    
    // Show individual or combined scores for Pass & Play
    if (this.state.gameMode === 'passplay') {
      const p1Score = this.state.passPlayState.player1Score;
      const p2Score = this.state.passPlayState.player2Score;
      this.dom.displays.gameScoreDisplay.innerHTML = 
        `<span style="font-size: 0.85rem;">${this.state.passPlayState.player1Name}: ${p1Score} | ${this.state.passPlayState.player2Name}: ${p2Score}</span>`;
    } else {
      this.dom.displays.gameScoreDisplay.textContent = `Score: ${this.state.totalScore}`;
    }
    
    if (this.dom.buttons.skipBtn) {
      this.dom.buttons.skipBtn.disabled = this.state.isRoundOver;
    }

    // Update strikes display
    this.dom.displays.strikesDisplay.textContent = `❌ ${this.state.strikesLeft}`;
  }

  revealAnswerAndEnd() {
    this.disableKeyboard();
    this.state.isRoundOver = true;
    this.state.consecutiveCorrect = 0; // Reset streak

    const currentQuestion = this.state.gameQuestions[this.state.currentQuestionIndex - 1];
    this.state.playedQuestions.push({ ...currentQuestion, status: 'missed', score: 0 });

    this.dom.displays.clueText.innerHTML = 
      `<span class="clue-feedback incorrect">✗ Out of strikes! Answer: ${this.state.currentAnswer}</span>`;

    setTimeout(() => this.endGame(true), 1500);
  }

  endGame(wasQuit = false) {
    this.dom.displays.gameOverTitle.textContent = wasQuit ? 'Game Over' : 'Your Final Cut';

    // Update Play Again button to show category
    if (this.state.gameMode === 'standard' && this.state.selectedCategory && this.dom.buttons.playAgainBtn) {
      this.dom.buttons.playAgainBtn.textContent = `Play ${this.state.selectedCategory} Again`;
    } else if (this.dom.buttons.playAgainBtn) {
      this.dom.buttons.playAgainBtn.textContent = 'Play Again';
    }

    // Build score breakdown - ONLY show played questions
    const breakdown = this.dom.displays.scoreBreakdown;
    breakdown.innerHTML = '';

    if (this.state.gameMode === 'passplay') {
      // Show Pass & Play results
      const p1Score = this.state.passPlayState.player1Score;
      const p2Score = this.state.passPlayState.player2Score;
      const winner = p1Score > p2Score ? this.state.passPlayState.player1Name : 
                     p2Score > p1Score ? this.state.passPlayState.player2Name : 'Tie';

      breakdown.innerHTML = `
        <li><strong>${this.state.passPlayState.player1Name}</strong><span>${p1Score}</span></li>
        <li><strong>${this.state.passPlayState.player2Name}</strong><span>${p2Score}</span></li>
      `;

      this.dom.displays.finalScore.textContent = winner === 'Tie' ? "It's a Tie!" : `${winner} Wins!`;
    } else {
      // Standard mode - ONLY show questions that were actually played
      this.state.playedQuestions.forEach((q) => {
        const points = q.score || 0;
        const li = document.createElement('li');
        
        // Show status emoji
        let statusEmoji = '';
        if (q.status === 'correct') statusEmoji = '✓';
        else if (q.status === 'skipped') statusEmoji = '⊘';
        else statusEmoji = '✗';
        
        // Show bonus indicator
        let bonusText = '';
        if (q.hadBonus) bonusText = ' 🔥';
        
        li.innerHTML = `
          <span>${statusEmoji} ${q.title}${bonusText}</span>
          <span>${points}</span>
        `;
        breakdown.appendChild(li);
      });

      this.dom.displays.finalScore.textContent = this.state.totalScore;
    }

    this.showScreen('gameOver');
  }

  playAgain() {
    if (this.state.gameMode === 'passplay') {
      this.startPassPlaySetup();
    } else {
      this.startGame();
    }
  }

  showCredits() {
    const creditsContent = this.getEl('creditsContent');
    if (creditsContent) {
      creditsContent.innerHTML = `
        <h2>PLOT TWISTED</h2>
        <h3>Cinema Edition</h3>
        <br>
        <p><strong>Game Design & Development</strong></p>
        <p>Ben Campbell</p>
        <br>
        <p><strong>Clue Writing</strong></p>
        <p>Ben Campbell</p>
        <p>With assistance from Claude (Anthropic)</p>
        <br>
        <p><strong>Special Thanks</strong></p>
        <p>To all movie fans who love a good plot twist!</p>
        <br>
        <p><strong>Connect</strong></p>
        <p><a href="https://x.com/Ben_Soup" target="_blank" style="color: var(--primary-color);">@Ben_Soup on X</a></p>
      `;
    }
    this.showScreen('credits');
  }

  showQuitConfirmation() {
    if (this.dom.containers.confirmModal) {
      this.dom.containers.confirmModal.classList.add('active');
    }
  }

  hideQuitConfirmation() {
    if (this.dom.containers.confirmModal) {
      this.dom.containers.confirmModal.classList.remove('active');
    }
  }

  quitGame() {
    this.hideQuitConfirmation();
    this.endGame(true);
  }

  // ---------- UTILITIES ----------
  shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  playSound(type) {
    if (!this.settings.sound) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch(type) {
      case 'correct':
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'wrong':
        oscillator.frequency.value = 200;
        gainNode.gain.value = 0.15;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
      case 'win':
        oscillator.frequency.value = 1000;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
        setTimeout(() => {
          const osc2 = audioContext.createOscillator();
          const gain2 = audioContext.createGain();
          osc2.connect(gain2);
          gain2.connect(audioContext.destination);
          osc2.frequency.value = 1200;
          gain2.gain.value = 0.1;
          osc2.start();
          osc2.stop(audioContext.currentTime + 0.15);
        }, 150);
        break;
    }
  }

  speakClue() {
    if ('speechSynthesis' in window) {
      const text = this.dom.displays.clueText.textContent;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser.');
    }
  }
}
