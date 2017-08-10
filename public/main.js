(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.startGame = startGame;
function startGame(activeAI) {
  'use strict';

  // Constants

  var COLS = 120,
      ROWS = 80;
  // IDs
  var EMPTY = 0,
      EDGE = 1,
      PLAYER1 = 2,
      PLAYER2 = 3,
      PLAYER3 = 4,
      PLAYER4 = 5;
  // Directions
  var LEFT = 0,
      UP = 1,
      RIGHT = 2,
      DOWN = 3;
  // Standard KeyCodes
  var KEY_PAUSE = 80,
      KEY_START = 32;

  // Game Settings
  var MAX_BOOST = 30,
      RECHARGE_FRAMES = 300;

  var grid = {

    width: null,
    height: null,
    _grid: null,

    init: function init(d, c, r) {
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

    set: function set(val, x, y) {
      this._grid[x][y] = val;
    },

    get: function get(x, y) {
      return this._grid[x][y];
    }
  };

  var Player = function Player(id, left, up, right, down, boost, ai) {
    this.id = id;
    this.score = 0;
    this.keystate = {
      left: { code: left, active: false },
      up: { code: up, active: false },
      right: { code: right, active: false },
      down: { code: down, active: false },
      boost: { code: boost, active: false }
    };
    this.aiActive = ai;
    this.wonMostRecently = false;

    this.direction = null;
    this.last = null;
    this._queue = null;
    this.boost = null;
    this.boosted = null;
    this.boostframe = null;
    this.isDead = null;
    this.previousMoves = null;
    // next x and y positions
    this.nx = null;
    this.ny = null;

    this.init = function (d, x, y, b) {
      this.direction = d;

      this._queue = [];
      this.insert(x, y);

      this.boost = b;
      this.boosted = false;
      this.isDead = false;
      this.previousMoves = [];
    };

    this.insert = function (x, y) {
      this._queue.unshift({ x: x, y: y });
      this.last = this._queue[0];
    };

    this.runAI = function () {
      var currDirection = this.direction;
      var x = this.last.x;
      var y = this.last.y;
      var aboutToDie = false;

      function possibleDirections() {
        var possible = [];
        if (grid.get(x - 1, y) === EMPTY) {
          possible.push(LEFT);
        } else if (currDirection === LEFT) {
          aboutToDie = true;
        }
        if (grid.get(x, y - 1) === EMPTY) {
          possible.push(UP);
        } else if (currDirection === UP) {
          aboutToDie = true;
        }
        if (grid.get(x + 1, y) === EMPTY) {
          possible.push(RIGHT);
        } else if (currDirection === RIGHT) {
          aboutToDie = true;
        }
        if (grid.get(x, y + 1) === EMPTY) {
          possible.push(DOWN);
        } else if (currDirection === DOWN) {
          aboutToDie = true;
        }
        return possible;
      }

      var directions = possibleDirections();
      var num = directions.length;

      var newDirection;
      if (num > 0) {
        if (aboutToDie || Math.random() > 0.95) {
          newDirection = directions[Math.floor(Math.random() * num)];
          this.direction = newDirection;
        }
      }
    };
  };

  var player1 = new Player(PLAYER1, 65, 87, 68, 83, 90, activeAI[0]);
  var player2 = new Player(PLAYER2, 37, 38, 39, 40, 13, activeAI[1]);
  var player3 = new Player(PLAYER3, 97, 101, 99, 98, 107, activeAI[2]);
  var player4 = new Player(PLAYER4, 74, 73, 76, 75, 77, activeAI[3]);
  players = [player1, player2, player3, player4];

  // Game objects
  var canvas, ctx, frames, players, isPaused, gameStarted, screenCounter;

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
    screenCounter = 0;

    function setKey(player, keycode, val) {
      for (var key in player.keystate) {
        if (player.keystate[key].code === keycode) {
          player.keystate[key].active = val;
        }
      }
    }

    document.addEventListener('keydown', function (evt) {
      for (var player in players) {
        setKey(players[player], evt.keyCode, true);
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

    document.addEventListener('keyup', function (evt) {
      for (var player in players) {
        setKey(players[player], evt.keyCode, false);
      }
    });

    init();
    loop();
  }

  function init() {
    // initate empty grid with all 0s
    grid.init(EMPTY, COLS, ROWS);

    // overwrite edge tiles
    for (var i = 0; i < COLS; i++) {
      grid.set(EDGE, i, 0);
      grid.set(EDGE, i, ROWS - 1);
    }
    for (var j = 0; j < ROWS; j++) {
      grid.set(EDGE, 0, j);
      grid.set(EDGE, COLS - 1, j);
    }

    // set starting positions
    for (var p in players) {
      var sp = { x: Math.floor((Number(p) + 1) / (players.length + 1) * COLS), y: Math.floor(ROWS / 2) };
      players[p].init(Number(p) % 2 === 0 ? UP : DOWN, sp.x, sp.y, MAX_BOOST);
      grid.set(players[p].id, sp.x, sp.y);
    }

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

    function getKeystate(player) {
      if (player.keystate.left.active && player.direction !== RIGHT) player.direction = LEFT;
      if (player.keystate.up.active && player.direction !== DOWN) player.direction = UP;
      if (player.keystate.right.active && player.direction !== LEFT) player.direction = RIGHT;
      if (player.keystate.down.active && player.direction !== UP) player.direction = DOWN;
      if (player.keystate.boost.active) {
        player.boosted = true;
      } else {
        player.boosted = false;
      }
    }

    for (var player in players) {
      getKeystate(players[player]);
    }

    // every 3 frames, update player positions - around 20 times / sec if refresh rate of requestAnimationFrame is 60 times / sec
    if (frames % 3 === 0 && !isPaused && gameStarted) {
      // activate the ai for the number of players
      for (var p in players) {
        if (players[p].aiActive) players[p].runAI();
      }

      // set nx, ny to last grid position, then adjust to set next grid position, then stack this object to the front of the player._queue array
      var playersAlive = [];
      for (var _p in players) {
        if (!players[_p].isDead) {
          var nx = players[_p].last.x;
          var ny = players[_p].last.y;

          /* Normal speed is 1, if boost button is pressed, double velocity.
          Recharge boost if a certain amount of time time has elapsed since the boost was last used
          */
          var vel = 1;
          if (players[_p].boosted && players[_p].boost > 0) {
            vel = 2;
            players[_p].boost--;
            players[_p].boostframe = frames;
          }
          if (frames > players[_p].boostframe + RECHARGE_FRAMES && players[_p].boost < MAX_BOOST && frames % 9 === 0) {
            players[_p].boost++;
          }

          switch (players[_p].direction) {
            case LEFT:
              nx -= vel;
              break;
            case UP:
              ny -= vel;
              break;
            case RIGHT:
              nx += vel;
              break;
            case DOWN:
              ny += vel;
              break;
          }

          // if dead, update player object - this will prevent it from being moving until the game ends
          if (grid.get(nx, ny) !== EMPTY) {
            players[_p].isDead = true;
          } else {
            // update grid and player objects to match new player head positions
            grid.set(players[_p].id, nx, ny);
            players[_p].insert(nx, ny);
            playersAlive.push(players[_p]);
          }
        }
      }

      // if only one player remains, end the game and increment scores
      if (playersAlive.length <= 1) {
        for (var _p2 in players) {
          if (!players[_p2].isDead) {
            players[_p2].score++;
            players[_p2].wonMostRecently = true;
          } else {
            players[_p2].wonMostRecently = false;
          }
        }
        return init();
      }
    }
  }

  function draw() {
    var tw = canvas.width / grid.width;
    var th = canvas.height / grid.height;
    var redValue = frames % 255 < 128 ? frames % 255 * 2 : (255 - frames % 255) * 2;

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
          case PLAYER3:
            ctx.fillStyle = 'rgb(' + redValue + ',85,170)';
            break;
          case PLAYER4:
            ctx.fillStyle = 'rgb(' + redValue + ',170,85)';
            break;
        }
        ctx.fillRect(x * tw, y * th, tw, th);
      }
    }
    // Show boosts and scores
    for (var p in players) {
      ctx.fillStyle = '#000';
      ctx.fillText((players[p].aiActive ? 'AI ' : 'Player ') + (players[p].id - 1) + ': ' + players[p].score, canvas.width * ((Number(p) + 1) / (players.length + 1)) - 60, canvas.height - 30);
      ctx.fillText('Boost: ' + players[p].boost, canvas.width * ((Number(p) + 1) / (players.length + 1)) - 60, canvas.height - 10);
    }

    // Show pause screen if game is paused
    if (isPaused) {
      ctx.fillStyle = '#000';
      ctx.fillText('GAME PAUSED', (canvas.width - 170) / 2, (canvas.height - 50) / 2);
    }

    // Show initial screen if game is starting / restarting
    if (!gameStarted) {
      ctx.fillStyle = '#000';
      for (var _p3 in players) {
        if (players[_p3].wonMostRecently) {
          ctx.fillText('PLAYER ' + (players[_p3].id - 1) + ' WINS!', (canvas.width - 170) / 2, (canvas.height - 150) / 2);
        } else if (screenCounter > 0) {
          ctx.fillText('DRAW!', (canvas.width - 100) / 2, (canvas.height - 150) / 2);
        }
      }
      ctx.fillText('PRESS SPACE TO START', (canvas.width - 270) / 2, (canvas.height - 50) / 2);
    }
  }

  main();
}

},{}],2:[function(require,module,exports){
'use strict';

var _lib = require('./lib');

var _game = require('./game');

(0, _lib.$id)('play').onclick = function () {
  if ((0, _lib.$id)('one').checked) {
    (0, _game.startGame)([false, true, true, true]);
  } else if ((0, _lib.$id)('two').checked) {
    (0, _game.startGame)([false, false, true, true]);
  } else if ((0, _lib.$id)('three').checked) {
    (0, _game.startGame)([false, false, false, true]);
  } else {
    (0, _game.startGame)([false, false, false, false]);
  }
  (0, _lib.$id)('game-mode-select').innerHTML = '';
};

(0, _lib.$id)('one').onclick = function () {
  (0, _lib.$id)('player2-info').style.visibility = 'hidden';
  (0, _lib.$id)('player3-info').style.visibility = 'hidden';
  (0, _lib.$id)('player4-info').style.visibility = 'hidden';
};

(0, _lib.$id)('two').onclick = function () {
  (0, _lib.$id)('player2-info').style.visibility = 'visible';
  (0, _lib.$id)('player3-info').style.visibility = 'hidden';
  (0, _lib.$id)('player4-info').style.visibility = 'hidden';
};

(0, _lib.$id)('three').onclick = function () {
  (0, _lib.$id)('player2-info').style.visibility = 'visible';
  (0, _lib.$id)('player3-info').style.visibility = 'visible';
  (0, _lib.$id)('player4-info').style.visibility = 'hidden';
};

(0, _lib.$id)('four').onclick = function () {
  (0, _lib.$id)('player2-info').style.visibility = 'visible';
  (0, _lib.$id)('player3-info').style.visibility = 'visible';
  (0, _lib.$id)('player4-info').style.visibility = 'visible';
};

},{"./game":1,"./lib":3}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.$id = $id;
function $id(e) {
  return document.getElementById(e);
}

},{}]},{},[2]);
