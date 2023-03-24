
import { Player } from './Player';
import '../styles/style.css';

class App {
    // Game attributes
    scores: Array<number> = [];
    level: number = 1;
    boxCount: number = 3;
    playerMovementSpeed: number = 2;
    playerLivesPerRound: number = 2;
    player?: Player;

    // Road Segment generation
    currentLeftOffset: number = 30;
    directionChosenSteps: number = 3;
    roadGoesRight: boolean = true;
    roadSegments: HTMLDivElement[] = [];
    segmentHeight: number = 5;
    segmentWidth: number = 0;

    // DOM elements
    gameWasInitialized: boolean = false;
    leaderBoardSize: number = 4; // Actually 3
    carElement?: HTMLDivElement;
    road?: HTMLDivElement;
    startScreen?: HTMLDivElement;
    currentScoreSpan?: HTMLSpanElement;
    currentLevelSpan?: HTMLSpanElement;
    currentLivesSpan?: HTMLSpanElement;
    currentSpeedSpan?: HTMLSpanElement;

    keys: { [key: string]: boolean } = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };

    init() {
        // Set attributes
        this.road = document.querySelector('.road') as HTMLDivElement;
        this.carElement = document.createElement("div");
        this.carElement.setAttribute("id", "car");
        this.road!.appendChild(this.carElement)
        this.startScreen = document.querySelector('.startScreen') as HTMLDivElement;
        this.currentLevelSpan = document.getElementById("current-level") as HTMLSpanElement;
        this.currentSpeedSpan = document.getElementById("current-speed") as HTMLSpanElement;
        this.currentLivesSpan = document.getElementById("current-lives") as HTMLSpanElement;
        this.currentScoreSpan = document.getElementById("current-score") as HTMLSpanElement;

        this.player = new Player(this.carElement.offsetLeft, this.carElement.offsetTop,
            0, this.playerMovementSpeed, this.playerLivesPerRound);

        this.currentScoreSpan!.innerHTML = "0";
        this.currentLevelSpan!.innerHTML = "1";
        this.currentLivesSpan!.innerHTML = `${this.player!.livesLeft}`;
        this.currentSpeedSpan!.innerHTML = `${this.player!.speed * 10}`;

        // Bind functions to the App instance
        this.gamePlay = this.gamePlay.bind(this);
        this.startNewGame = this.startNewGame.bind(this);
        this.generateRoad = this.generateRoad.bind(this);
        this.moveObstacles = this.moveObstacles.bind(this);
        this.resetBoxAndPlayerPositionAfterCollision = this.resetBoxAndPlayerPositionAfterCollision.bind(this)
        this.keyUp = this.keyUp.bind(this);
        this.keyDown = this.keyDown.bind(this);

        this.setRoadSegmentWidth(this.road!.clientWidth)
        this.generateRoad()
        this.startScreen!.addEventListener('click', this.startNewGame);
    }

    startNewGame() {
        this.startScreen!.style.display = 'none';
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

    createBox(yCoefficient: number) {
        const box = document.createElement('div');
        box.setAttribute('class', 'box');
        box.style.top = `${((yCoefficient + 1) * 350) * -1}px`;
        box.style.left = (Math.floor(Math.random() * this.road!.clientWidth)) + "px";

        this.road!.appendChild(box);
    }

    generateRoad() {
        const roadHeight: number = this.road!.clientHeight;
        const segmentCount: number = Math.floor(roadHeight / this.segmentHeight);

        for (let i = 0; i < segmentCount; i++) {
            const segment: HTMLDivElement = document.createElement("div");
            segment.classList.add("road-segment");

            this.handleCurrentSegmentOffset();

            segment.style.marginLeft = this.currentLeftOffset + "px";
            segment.style.marginRight =
                this.road!.clientWidth - (this.currentLeftOffset + this.segmentWidth) + "px";
            segment.style.height = `${this.segmentHeight}px`;

            this.road!.appendChild(segment);
            this.roadSegments.push(segment)
        }
    }

    handleCurrentSegmentOffset() {
        // Move the road left or right
        if (this.directionChosenSteps !== 0) {
            if (this.roadGoesRight) {
                this.currentLeftOffset += 2;
            } else {
                this.currentLeftOffset -= 2;
            }
            this.directionChosenSteps--;
        } else {
            // Gone too far to the right
            if (this.currentLeftOffset > ((this.road!.clientWidth / 5))) {
                this.roadGoesRight = false
            } // Gone too far to the left
            else if (this.currentLeftOffset <= 0) {
                this.roadGoesRight = true;
            } else {
                this.roadGoesRight = Math.random() > 0.5;
            }
            this.directionChosenSteps = 3;
        }
    }

    setRoadSegmentWidth(areaWidth: number) {
        // This is the width of the road (of each segment)
        if (areaWidth <= 380) {
            this.segmentWidth = 300;
        } else if (areaWidth <= 600) {
            this.segmentWidth = 400;
        } else {
            this.segmentWidth = 550;
        }
    }

    gamePlay() {
        if (this.gameWasInitialized) {

            // Update player's position
            if(this.keys.ArrowUp && (this.player!.yPos > this.road!.clientTop + 150)) this.player!.yPos -= this.playerMovementSpeed;
            if(this.keys.ArrowDown && (this.player!.yPos < this.road!.clientHeight - 150)) this.player!.yPos += this.playerMovementSpeed;
            if(this.keys.ArrowLeft && (this.player!.xPos > 0)) this.player!.xPos -= this.playerMovementSpeed;
            if(this.keys.ArrowRight && (this.player!.xPos < this.road!.clientWidth - 40)) this.player!.xPos += this.playerMovementSpeed;

            // Update carElement's position
            this.carElement!.style.top = this.player!.yPos + "px";
            this.carElement!.style.left = this.player!.xPos + "px";

            // Update game state
            this.updatePlayerScore()
            this.increaseDifficulty(); // check if difficulty needs to be updated and update
            this.moveObstacles() // updated box positions
            this.checkIfPlayerIsWithinRoadBoundaries(); // check if the player is within the road boundaries
            window.requestAnimationFrame(this.gamePlay); // call this function on the next frame
        }
    }

    updatePlayerScore() {
        this.player!.currentScore++;
        const ps = this.player!.currentScore - 1;
        this.currentScoreSpan!.innerHTML = `${ps}`;
        this.currentLivesSpan!.innerHTML = `${this.player!.livesLeft}`;
    }

    moveObstacles() {

        // Move boxes
        document.querySelectorAll(".box").forEach(box => {
            this.handleBoxLogic(box as HTMLDivElement)
        });

        // Move the road up
        let last: HTMLDivElement = this.road!.lastElementChild as HTMLDivElement;
        let first: HTMLDivElement = this.road!.firstElementChild as HTMLDivElement;

        if (last!.classList.contains("road-segment")) {
            this.handleCurrentSegmentOffset();

            last!.style.marginLeft = this.currentLeftOffset + "px";
            last!.style.marginRight =
                this.road!.clientWidth - (this.currentLeftOffset + this.segmentWidth) + "px";
            last.style.height = `${this.segmentHeight}px`;
        }

        this.road!.replaceChild(last, first);
        this.road!.insertBefore(first, last);
    }

    handleBoxLogic(box: HTMLDivElement) {

        if (this.onCollision(this.carElement!, box)) {
            if (this.player!.livesLeft <= 0) this.onGameOver();
            else {
                --this.player!.livesLeft;
                this.resetBoxAndPlayerPositionAfterCollision()
            }
        }

        const boxY: number = box.style.top.length > 0 ?
            parseInt(box.style.top) + this.player!.speed : -1000;
        box.style.top = `${boxY}px`;
        if (boxY >= this.road!.clientHeight) {
            box.style.top = `${-1000}px`;
            box.style.left = Math.floor(Math.random() * this.road!.clientWidth) + "px";
        }

    }

    resetBoxAndPlayerPositionAfterCollision() {
        let boxCountBeforeCollision = 0;
        document.querySelectorAll(".box").forEach(box => {
            box.remove()
            boxCountBeforeCollision++;
        });

        for (let i = 0; i < boxCountBeforeCollision; i++) {
            this.createBox(i);
        }

        this.player!.xPos = this.road!.clientWidth / 2;
        this.player!.yPos = this.road!.clientHeight - 180;
    }

    onCollision(aObj: HTMLDivElement, bObj: HTMLDivElement){
        const aRect = aObj.getBoundingClientRect();
        const bRect = bObj.getBoundingClientRect();

        return !((aRect.top > bRect.bottom) || (aRect.bottom < bRect.top) ||
            (aRect.right < bRect.left) || (aRect.left > bRect.right));
    }

    checkIfPlayerIsWithinRoadBoundaries() {
        // Get the position of the road segment that is immediately above the player
        const segmentIndex = Math.floor(this.player!.yPos / this.segmentHeight) - 1;
        const segment = this.roadSegments[segmentIndex];

        // Calculate the left and right boundaries of the road segment
        const leftBoundary = parseInt(segment.style.marginLeft);// segment.offsetLeft | parseInt(segment.style.marginLeft);
        const rightBoundary = leftBoundary + this.segmentWidth - 40;

        // Check if the player is outside the boundaries of the road segment
        if (this.player!.xPos <= leftBoundary
            || this.player!.xPos >= rightBoundary) {
            this.resetBoxAndPlayerPositionAfterCollision();
            this.player!.livesLeft--;
            this.currentLivesSpan!.innerHTML = `${this.player!.livesLeft}`;

            if (this.player!.livesLeft < 0) this.onGameOver()
        }
    }

    increaseDifficulty() {
        if (this.player!.currentScore >= 1000 && this.level === 1 ||
            this.player!.currentScore >= 2000 && this.level === 2 ||
            this.player!.currentScore >= 3000 && this.level === 3 ||
            this.player!.currentScore >= 4000 && this.level === 4) {

            this.player!.speed += 0.5;
            this.level++;
            if (this.level === 2 || this.level === 4) {
                this.createBox(2);
            }
            this.currentLevelSpan!.innerHTML = `${this.level}`;
            this.currentSpeedSpan!.innerHTML = `${this.player!.speed * 10}`;
        }
    }

    onGameOver() {
        this.startScreen!.innerHTML = `Game over! Your final score is <strong>${this.player!.currentScore}</strong><br>Press here to start a new game`;
        this.scores.push(this.player!.currentScore);

        // Reset game initialization flag and remove event listeners
        this.gameWasInitialized = false;
        document.removeEventListener('keydown', this.keyDown);
        document.removeEventListener('keyup', this.keyUp);

        this.keys.ArrowLeft = false;
        this.keys.ArrowRight = false;
        this.keys.ArrowUp = false;
        this.keys.ArrowDown = false;

        this.player!.xPos = this.road!.clientWidth / 2;
        this.player!.yPos = this.road!.clientHeight - 180;

        this.updateLeaderBoard();
        this.resetStats();

        this.startScreen!.style.display = "block";
    }

    updateLeaderBoard() {
        // Remove all scores from the leaderBoard
        const leaderBoard: HTMLDivElement = document.getElementById("leader-board") as HTMLDivElement;
        leaderBoard!.innerHTML = `<div id="leader-board" class="hub-stat-main">Leader Board:</div>`;
        leaderBoard!.style.marginLeft = "0";
        // Copy and sort results
        const resultsSorted = [...this.scores].sort((a, b) => b - a);

        // Add best scores to the leaderBoard
        let i = 1;
        resultsSorted.forEach(result => {
            if (i === this.leaderBoardSize) return;
            const leaderBoardResult = document.createElement("div");
            leaderBoardResult.innerHTML = `<div class="hub-stat">${i++}. ${result}</div>`;
            leaderBoardResult.style.fontWeight = "normal";
            leaderBoard.appendChild(leaderBoardResult);
        });
    }

    resetStats() {
        this.player!.speed = this.playerMovementSpeed;
        this.player!.livesLeft = this.playerLivesPerRound;
        this.player!.currentScore = 0;
        this.level = 1;
        this.boxCount = 3;
    }

    keyUp(e: KeyboardEvent) {
        if (typeof e === "undefined") {
            return;
        }

        if (e.key !== 'ArrowUp' &&
            e.key !== 'ArrowLeft' &&
            e.key !== 'ArrowDown' &&
            e.key !== 'ArrowRight') {
            return;
        }
        e.preventDefault()
        this.keys[e.key] = false;
    }

    keyDown(e: KeyboardEvent) {
        if (typeof e === "undefined") {
            return;
        }

        if (e.key !== 'ArrowUp' &&
            e.key !== 'ArrowLeft' &&
            e.key !== 'ArrowDown' &&
            e.key !== 'ArrowRight') {
            return;
        }
        e.preventDefault()
        this.keys[e.key] = true;
    }
}

const app: App = new App();
app.init();
