function startGame(singlePlayer) {
  "use strict";

  // Constants
  var COLS = 120, ROWS = 80;
  // IDs
  var EMPTY = 0, PLAYER1 = 1, PLAYER2 = 2, EDGE = 3;
  // Directions
  var LEFT = 0, UP = 1, RIGHT = 2, DOWN = 3;
  // KeyCodes
  var KEY_PAUSE = 80, KEY_START = 32;
  var KEY_LEFT1 = 65, KEY_UP1 = 87, KEY_RIGHT1 = 68, KEY_DOWN1 = 83, KEY_BOOST1 = 66;
  var KEY_LEFT2 = 37, KEY_UP2 = 38, KEY_RIGHT2 = 39, KEY_DOWN2 = 40, KEY_BOOST2 = 13;

  // Game Settings
  var MAX_BOOST = 30, RECHARGE_FRAMES = 300;

  var grid = {

    width: null,
    height: null,
    _grid: null,

    init: function(d, c, r) {
      this.width = c;
      this.height = r;

      this._grid = [];
      for (var x = 0; x < c; x++) {
        this._grid.push([]);
        for (var y = 0; y < r; y++) {
          this._grid[x].push(d);
        }
      }
    },

    set: function(val, x, y) {
      this._grid[x][y] = val;
    },

    get: function(x, y) {
      return this._grid[x][y];
    }
  };

  var Player = function() {

    this.direction = null;
    this.last = null;
    this._queue = null;
    this.boost = null;
    this.boosted = null;
    this.boostframe = null;
    this.isDead = null;

    this.init = function(d, x, y, b) {
      this.direction = d;

      this._queue = [];
      this.insert(x, y);

      this.boost = b;
      this.boosted = false;
    };

    this.insert = function(x, y) {
      this._queue.unshift({x: x, y: y});
      this.last = this._queue[0];
    };
  };

  var player1 = new Player();
  var player2 = new Player();

  // add AI to player2
  player2.chooseDirection = function() {
    var currDirection = this.direction;
    var currPosX = this.last.x;
    var currPosY = this.last.y;
    this.previousMoves = [];

    function aboutToDie(direction) {
      switch(direction) {
        case LEFT:
          if (grid.get(currPosX - 1, currPosY) !== EMPTY) {
            return true;
          } else {
            return false;
          }
        case UP:
          if (grid.get(currPosX, currPosY - 1) !== EMPTY) {
            return true;
          } else {
            return false;
          }
        case RIGHT:
          if (grid.get(currPosX + 1, currPosY) !== EMPTY) {
            return true;
          } else {
            return false;
          }
        case DOWN:
          if (grid.get(currPosX, currPosY + 1) !== EMPTY) {
            return true;
          } else {
            return false;
          }
      }
    }

    // randomly changes direction <5% of the time
    var newDirection;
    if (Math.random() > 0.95) {
      newDirection = Math.floor(Math.random() * 4);
    } else {
      newDirection = currDirection;
    }

    // randomly boosts once ~10% of the time
    if (Math.random() > 0.9) {
      this.boosted = true;
    } else {
      this.boosted = false;
    }

    var counter = 0;
    // increasing counter will make it more likely that the AI will choose a direction that will keep itself alive
    // ai will continue to find a new direction that keeps it alive and is not the same as its' move 3 moves ago; until the counter reaches 10. then it will just die.
    while(aboutToDie(newDirection) && counter < 10 || newDirection === this.previousMoves[2]) {
      counter++;
      newDirection = Math.floor(Math.random() * 4);
    }
    if (currDirection !== newDirection) {
      this.previousMoves.unshift(newDirection);
    }
    this.direction = newDirection;
  };

  // Game objects
  var canvas, ctx, keystate1, keystate2, animationRef, frames, score = {p1: 0, p2: 0}, isPaused, gameStarted;

  function main() {
    // remove game mode select interface to prevent multiple instances on a single page
    document.getElementById('game-mode-select').innerHTML = '';
    canvas = document.createElement('canvas');
    canvas.width = COLS * 8;
    canvas.height = ROWS * 8;
    ctx = canvas.getContext('2d');
    document.getElementById('game-container').appendChild(canvas);

    ctx.font = '20px Orbitron';

    frames = 0;
    keystate1 = {};
    keystate2 = {};

    document.addEventListener('keydown', function(evt) {
      if (evt.keyCode === KEY_LEFT2 || evt.keyCode === KEY_UP2 || evt.keyCode === KEY_RIGHT2 || evt.keyCode === KEY_DOWN2 || evt.keyCode === KEY_BOOST2) {
        keystate2[evt.keyCode] = true;
      } else {
        keystate1[evt.keyCode] = true;
      }
      if (evt.keyCode === KEY_PAUSE) {
        if (!isPaused && gameStarted) {
          isPaused = true;
        } else {
          isPaused = false;
        }
      }
      if (evt.keyCode === KEY_START) {
        gameStarted = true;
      }
    });
    document.addEventListener('keyup', function(evt) {
      if (evt.keyCode === KEY_LEFT2 || evt.keyCode === KEY_UP2 || evt.keyCode === KEY_RIGHT2 || evt.keyCode === KEY_DOWN2 || evt.keyCode === KEY_BOOST2) {
        delete keystate2[evt.keyCode];
      } else {
        delete keystate1[evt.keyCode];
      }
    });

    init();
    loop();
  }

  function init() {
    // initate empty grid with all 0s
    grid.init(EMPTY, COLS, ROWS);
    for (var i = 0; i < COLS; i++) {
      grid.set(EDGE, i, 0);
      grid.set(EDGE, i, ROWS-1);
    }
    for (var j = 0; j < ROWS; j++) {
      grid.set(EDGE, 0, j);
      grid.set(EDGE, COLS-1, j);
    }

    // set starting positions
    var sp = {x: Math.floor(COLS/2-1), y: Math.floor(ROWS/2)};
    player1.init(LEFT, sp.x, sp.y, MAX_BOOST);
    grid.set(PLAYER1, sp.x, sp.y);

    sp = {x: Math.floor(COLS/2), y: Math.floor(ROWS/2)};
    player2.init(RIGHT, sp.x, sp.y, MAX_BOOST);
    grid.set(PLAYER2, sp.x, sp.y);

    isPaused = false;
    gameStarted = false;
  }

  function loop() {
    update();
    draw();

    window.requestAnimationFrame(loop, canvas);
  }

  function update() {
    frames++;

    if (keystate1[KEY_LEFT1] && player1.direction !== RIGHT) player1.direction = LEFT;
    if (keystate1[KEY_UP1] && player1.direction !== DOWN) player1.direction = UP;
    if (keystate1[KEY_RIGHT1] && player1.direction !== LEFT) player1.direction = RIGHT;
    if (keystate1[KEY_DOWN1] && player1.direction !== UP) player1.direction = DOWN;
    if (keystate1[KEY_BOOST1]) {
      player1.boosted = true;
    } else {
      player1.boosted = false;
    }

    if (keystate2[KEY_LEFT2] && player2.direction !== RIGHT) player2.direction = LEFT;
    if (keystate2[KEY_UP2] && player2.direction !== DOWN) player2.direction = UP;
    if (keystate2[KEY_RIGHT2] && player2.direction !== LEFT) player2.direction = RIGHT;
    if (keystate2[KEY_DOWN2] && player2.direction !== UP) player2.direction = DOWN;
    if (keystate2[KEY_BOOST2]) {
      player2.boosted = true;
    } else {
      player2.boosted = false;
    }

    // every 3 frames, update player positions - around 20 times / sec if refresh rate of requestAnimationFrame is 60 times / sec
    if (frames % 3 === 0 && !isPaused && gameStarted) {
      // activate player2 AI method if single-player mode is activated
      if (singlePlayer) player2.chooseDirection();

      // nx1, ny1 are the next grid positions of player 1
      // set nx1, ny1 to last grid position, then adjust to set next grid position, then stack this object to the front of the player1._queue array
      var nx1 = player1.last.x;
      var ny1 = player1.last.y;

      var nx2 = player2.last.x;
      var ny2 = player2.last.y;

      /* Normal speed is 1, if boost button is pressed, double velocity.
      Recharge boost if a certain amount of time time has elapsed since the boost was last used
      */
      var vel = 1;
      if (player1.boosted && player1.boost > 0) {
        vel = 2;
        player1.boost--;
        player1.boostframe = frames;
      }
      if (frames > player1.boostframe + RECHARGE_FRAMES && player1.boost < MAX_BOOST && frames % 9 === 0) {
        player1.boost++;
      }

      switch(player1.direction) {
        case LEFT:
          nx1 -= vel;
          break;
        case UP:
          ny1 -= vel;
          break;
        case RIGHT:
          nx1 += vel;
          break;
        case DOWN:
          ny1 += vel;
          break;
      }

      vel = 1;
      if (player2.boosted && player2.boost > 0) {
        vel = 2;
        player2.boost--;
        player2.boostframe = frames;
      }
      if (frames > player2.boostframe + RECHARGE_FRAMES && player2.boost < MAX_BOOST && frames % 9===0) {
        player2.boost++;
      }

      switch(player2.direction) {
        case LEFT:
          nx2 -= vel;
          break;
        case UP:
          ny2 -= vel;
          break;
        case RIGHT:
          nx2 += vel;
          break;
        case DOWN:
          ny2 += vel;
          break;
      }

      // check for deaths or draws
      if (grid.get(nx1, ny1) !== EMPTY) player1.isDead = true;
      if (grid.get(nx2, ny2) !== EMPTY) player2.isDead = true;

      // if both players are dead, draw, else increment scores
      if (player1.isDead && player2.isDead) {
        return init();
      } else if (player1.isDead) {
        score.p2++;
        return init();
      } else if (player2.isDead) {
        score.p1++;
        return init();
      }

      // update grid and player objects to match new player head positions
      grid.set(PLAYER1, nx1, ny1);
      grid.set(PLAYER2, nx2, ny2);

      player1.insert(nx1, ny1);
      player2.insert(nx2, ny2);
    }
  }

  function draw() {
    var tw = canvas.width / grid.width;
    var th = canvas.height / grid.height;
    var redValue = frames % 255 < 128 ? (frames % 255) * 2 : (255 - frames % 255) * 2;

    for (var x = 0; x < grid.width; x++) {
      for (var y = 0; y < grid.height; y++) {
        switch (grid.get(x, y)) {
          case EMPTY:
          ctx.fillStyle = '#ccc';
          break;
          case EDGE:
          ctx.fillStyle = '#000';
          break;
          case PLAYER1:
          ctx.fillStyle = 'rgb(' + redValue + ',255,0)';
          break;
          case PLAYER2:
          ctx.fillStyle = 'rgb(' + redValue + ',0,255)';
          break;
        }
        ctx.fillRect(x * tw, y * th, tw, th);
      }
    }
    // Show boosts and scores
    ctx.fillStyle = "#000";
    ctx.fillText(score.p1, 10, canvas.height - 30);
    ctx.fillText("BOOST: " + player1.boost, 10, canvas.height - 10);
    ctx.fillStyle = "#f00";
    ctx.fillText(score.p2, canvas.width - 30, canvas.height - 30);
    ctx.fillText("BOOST: " + player2.boost, canvas.width - 137, canvas.height - 10);

    // Show pause screen if game is paused
    if (isPaused) {
      ctx.fillStyle = "#000";
      ctx.fillText("GAME PAUSED", (canvas.width - 170) / 2, (canvas.height - 50) / 2);
    }

    // Show initial screen if game is starting / restarting
    if (!gameStarted) {
      ctx.fillStyle = "#000";
      ctx.fillText('PRESS SPACE TO START', (canvas.width - 270) / 2, (canvas.height - 50) / 2);
    }
  }

  main();

}
