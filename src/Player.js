
export class Player {

    xPos;
    yPos;
    currentScore = 0;
    speed = 10;
    livesLeft = 2;

    constructor(xPos, yPos, currentScore, speed, livesLeft) {
        this.xPos = xPos;
        this.yPos = yPos;
        this.currentScore = currentScore;
        this.speed = speed;
        this.livesLeft = livesLeft;
    }
}
