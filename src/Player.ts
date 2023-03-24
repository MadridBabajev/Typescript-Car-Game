
export class Player {

    xPos: number;
    yPos: number;
    currentScore: number = 0;
    speed: number = 10;
    livesLeft: number = 2;

    constructor(xPos: number, yPos: number, currentScore: number,
                speed: number, livesLeft: number) {
        this.xPos = xPos;
        this.yPos = yPos;
        this.currentScore = currentScore;
        this.speed = speed;
        this.livesLeft = livesLeft;
    }
}
