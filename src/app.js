
import { Player } from "./Player.js";

// TODO Make the road random!

class App {
    // Game attributes
    scores = [];
    level = 1;
    boxCount = 3;
    playerMovementSpeed = 2;
    playerLivesPerRound = 2;
    player;

    // DOM elements
    gameWasInitialized = false;
    leaderBoardSize = 4; // Actually 3
    carElement;
    road;
    startScreen;
    currentScoreSpan;
    currentLevelSpan;
    currentLivesSpan;
    currentSpeedSpan;

    keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };

    init() {
        // Game elements
        const road = document.querySelector('.road');
        const carElement = document.createElement("div");
        carElement.setAttribute("id", "car");
        road.appendChild(carElement);
        this.player = new Player(carElement.offsetLeft, carElement.offsetTop,
            0, this.playerMovementSpeed, this.playerLivesPerRound);

        // Set attributes
        this.carElement = carElement;
        this.road = road;
        this.startScreen = document.querySelector('.startScreen');
        this.currentLevelSpan = document.getElementById("current-level");
        this.currentSpeedSpan = document.getElementById("current-speed");
        this.currentLivesSpan = document.getElementById("current-lives");
        this.currentScoreSpan = document.getElementById("current-score");
        this.currentScoreSpan.innerHTML = "0";
        this.currentLevelSpan.innerHTML = "1";
        this.currentLivesSpan.innerHTML = `${this.player.livesLeft}`;
        this.currentSpeedSpan.innerHTML = `${this.player.speed * 10}`;

        // Bind functions to the App instance
        this.gamePlay = this.gamePlay.bind(this);
        this.startNewGame = this.startNewGame.bind(this);
        this.keyUp = this.keyUp.bind(this);
        this.keyDown = this.keyDown.bind(this);

        this.startScreen.addEventListener('click', this.startNewGame);
    }

    startNewGame() {
        this.startScreen.style.display = 'none';
        this.gameWasInitialized = true;

        document.addEventListener('keydown', this.keyDown);
        document.addEventListener('keyup', this.keyUp);

        // Game Loop
        window.requestAnimationFrame(this.gamePlay);

        // Create initial boxes
        document.querySelectorAll(".box").forEach(box => {
            box.remove()
        });
        for(let i = 0; i < this.boxCount; i++) { this.createBox(i); }
    }

    createBox(yCoefficient) {
        const box = document.createElement('div');
        box.setAttribute('class', 'box');
        box.y = ((yCoefficient+1) * 350) * -1;
        box.style.top = box.y + "px";
        box.style.left = (Math.floor(Math.random() * this.road.clientWidth)) + "px";
        this.road.appendChild(box);
    }

    gamePlay() {
        if (this.gameWasInitialized) {

            // Update player's position
            if(this.keys.ArrowUp && (this.player.yPos > this.road.clientTop + 150)) this.player.yPos -= this.playerMovementSpeed;
            if(this.keys.ArrowDown && (this.player.yPos < this.road.clientHeight - 150)) this.player.yPos += this.playerMovementSpeed;
            if(this.keys.ArrowLeft && (this.player.xPos > 0)) this.player.xPos -= this.playerMovementSpeed;
            if(this.keys.ArrowRight && (this.player.xPos < this.road.clientWidth - 90)) this.player.xPos += this.playerMovementSpeed;

            // Update carElement's position
            this.carElement.style.top = this.player.yPos + "px";
            this.carElement.style.left = this.player.xPos + "px";

            // Update game state
            this.updatePlayerScore()
            this.increaseDifficulty(); // check if difficulty needs to be updated and update
            this.moveObstacles() // updated box positions
            window.requestAnimationFrame(this.gamePlay); // call this function on the next frame
        }
    }

    updatePlayerScore() {
        this.player.currentScore++;
        const ps = this.player.currentScore - 1;
        this.currentScoreSpan.innerHTML = `${ps}`;
        this.currentLivesSpan.innerHTML = `${this.player.livesLeft}`;
    }

    moveObstacles() {
        document.querySelectorAll(".box").forEach(box => {

            if (this.onCollision(this.carElement, box)) {
                if (this.player.livesLeft === 0) this.onGameOver();
                else {
                    --this.player.livesLeft;
                    this.resetBoxStateAfterCollision()
                }
            }
            if (box.y >= 1000) {
                box.y -= 1000;

                box.style.left = Math.floor(
                    Math.random() * (Math.floor(Math.random() * this.road.clientWidth))) + "px";
            }
            box.y += this.player.speed;
            box.style.top = box.y + "px";
        });
    }

    resetBoxStateAfterCollision() {
        let boxCountBeforeCollision = 0;
        document.querySelectorAll(".box").forEach(box => {
            box.remove()
            boxCountBeforeCollision++;
        });

        for (let i = 0; i < boxCountBeforeCollision; i++) {
            this.createBox(i);
        }

    }

    onCollision(aObj, bObj){
        const aRect = aObj.getBoundingClientRect();
        const bRect = bObj.getBoundingClientRect();

        return !((aRect.top > bRect.bottom) || (aRect.bottom < bRect.top) ||
            (aRect.right < bRect.left) || (aRect.left > bRect.right));
    }

    increaseDifficulty() {
        if (this.player.currentScore >= 1000 && this.level === 1 ||
            this.player.currentScore >= 2000 && this.level === 2 ||
            this.player.currentScore >= 3000 && this.level === 3 ||
            this.player.currentScore >= 4000 && this.level === 4) {

            this.player.speed += 0.5;
            this.level++;
            if (this.level === 2 || this.level === 4) {
                this.createBox(2);
            }
            this.currentLevelSpan.innerHTML = `${this.level}`;
            this.currentSpeedSpan.innerHTML = `${this.player.speed * 10}`;
        }
    }

    onGameOver() {
        this.startScreen.innerHTML = `Game over! Your final score is <strong>${this.player.currentScore}</strong><br>Press here to start a new game`;
        this.scores.push(this.player.currentScore);

        // Reset game initialization flag and remove event listeners
        this.gameWasInitialized = false;
        document.removeEventListener('keydown', this.keyDown);
        document.removeEventListener('keyup', this.keyUp);

        this.keys.ArrowLeft = false;
        this.keys.ArrowRight = false;
        this.keys.ArrowUp = false;
        this.keys.ArrowDown = false;

        this.updateLeaderBoard();
        this.resetStats();

        this.startScreen.style.display = "block";
    }

    updateLeaderBoard() {
        // Remove all scores from the leaderBoard
        const leaderBoard = document.getElementById("leader-board");
        leaderBoard.innerHTML = `<div id="leader-board" class="hub-stat-main">Leader Board:</div>`;
        leaderBoard.style.marginLeft = "0";
        // Copy and sort results
        const resultsSorted = [...this.scores].sort((a,b) => b - a);

        // Add best scores to the leaderBoard
        let i = 1;
        const leaderBoardResult = document.createElement("div");
        resultsSorted.forEach(result => {
            if (i === this.leaderBoardSize) return;
            leaderBoardResult.innerHTML = `<div class="hub-stat">${i++}. ${result}</div>`;
            leaderBoardResult.style.fontWeight = "normal";
            leaderBoard.appendChild(leaderBoardResult);
        })
    }

    resetStats() {
        this.player.speed = this.playerMovementSpeed;
        this.player.livesLeft = this.playerLivesPerRound;
        this.player.currentScore = 0;
        this.level = 1;
        this.boxCount = 3;

    }

    keyUp(e) {

        if (typeof e === "undefined") {
            return;
        }

        if (e.keyCode !== 37 &&
            e.keyCode !== 38 &&
            e.keyCode !== 39 &&
            e.keyCode !== 40) {
            return;
        }

        e.preventDefault()
        this.keys[e.key] = false;

    }

    keyDown(e) {

        if (typeof e === "undefined") {
            return;
        }

        if (e.keyCode !== 37 &&
            e.keyCode !== 38 &&
            e.keyCode !== 39 &&
            e.keyCode !== 40) {
            return;
        }

        e.preventDefault()
        this.keys[e.key] = true;
    }
}

const app = new App();
app.init();
