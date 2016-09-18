// Last updated 18/19/16

(function ifi() {

  // Constants
  var COLS = 120, ROWS = 80;
  // IDs
  var EMPTY = 0, PLAYER1 = 1, PLAYER2 = 2;
  // Directions
  var LEFT = 0, UP = 1, RIGHT = 2, DOWN = 3;
  // KeyCodes
  var KEY_LEFT1 = 65, KEY_UP1 = 87, KEY_RIGHT1 = 68, KEY_DOWN1 = 83, KEY_BOOST1 = 32;
  var KEY_LEFT2 = 37, KEY_UP2 = 38, KEY_RIGHT2 = 39, KEY_DOWN2 = 40, KEY_BOOST2 = 13;

  // Game Settings
  var MAX_BOOST = 30;

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
  }

  var player1 = {

    direction: null,
    last: null,
    _queue: null,
    boost: null,
    boosted: null,
    boostframe: null,

    init: function(d, x, y, s, b) {
      this.direction = d;
      this.speed = s;

      this._queue = [];
      this.insert(x, y);

      this.boost = b;
      this.boosted = false;
      this.boostframe = frames;
    },

    insert: function(x, y) {
      this._queue.unshift({x:x, y:y});
      this.last = this._queue[0]
    },

    remove: function() {
      return this._queue[this._queue.length-1];
    }
  }

  var player2 = {

    direction: null,
    last: null,
    _queue: null,
    boost: null,
    boosted: null,
    boostframe: null,

    init: function(d, x, y, s, b) {
      this.direction = d;
      this.speed = s;

      this._queue = [];
      this.insert(x, y);

      this.boost = b;
      this.boosted = false;
      this.boostframe = frames;
    },

    insert: function(x, y) {
      this._queue.unshift({x:x, y:y});
      this.last = this._queue[0]
    },

    remove: function() {
      return this._queue[this._queue.length-1];
    }
  }

  // Game objects
  var canvas, ctx, keystate1, frames, score = {p1: 0, p2: 0};

  function main() {
    canvas = document.createElement("canvas");
    canvas.width = COLS * 8;
    canvas.height = ROWS * 8;
    ctx = canvas.getContext("2d");
    document.body.appendChild(canvas);

    ctx.font = "20px Orbitron";

    frames = 0;
    keystate1 = {};
    keystate2 = {};

    document.addEventListener("keydown", function(evt) {
      if (evt.keyCode >= KEY_LEFT2 && evt.keyCode <= KEY_DOWN2 || evt.keyCode === KEY_BOOST2) {
        keystate2[evt.keyCode] = true;
      } else {
        keystate1[evt.keyCode] = true;
      }
    });
    document.addEventListener("keyup", function(evt) {
      if (evt.keyCode >= KEY_LEFT2 && evt.keyCode <= KEY_DOWN2 || evt.keyCode === KEY_BOOST2) {
        delete keystate2[evt.keyCode];
      } else {
        delete keystate1[evt.keyCode];
      }
    })

    init();
    loop();
  }

  function init() {
    grid.init(EMPTY, COLS, ROWS);

    var sp = {x: Math.floor(COLS/2-1), y: Math.floor(ROWS/2)};
    player1.init(LEFT, sp.x, sp.y, 100, MAX_BOOST);
    grid.set(PLAYER1, sp.x, sp.y);

    sp = {x: Math.floor(COLS/2), y: Math.floor(ROWS/2)};
    player2.init(RIGHT, sp.x, sp.y, 100, MAX_BOOST);
    grid.set(PLAYER2, sp.x, sp.y);

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

    if (frames%3 === 0) {
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
        player1.boostFrame = frames;
      }
      if (frames > player1.boostframe + 300 && player1.boost < MAX_BOOST && frames%9===0) {
        player1.boost++;
      }

      switch(player1.direction) {
        case LEFT:
        nx1-=vel;
        break;
        case UP:
        ny1-=vel;
        break;
        case RIGHT:
        nx1+=vel;
        break;
        case DOWN:
        ny1+=vel;
        break;
      }

      vel = 1;
      if (player2.boosted && player2.boost > 0) {
        vel = 2;
        player2.boost--;
        player2.boostframe = frames;
      }
      if (frames > player2.boostframe + 300 && player2.boost < MAX_BOOST && frames%9===0) {
        player2.boost++;
      }

      switch(player2.direction) {
        case LEFT:
        nx2-=vel;
        break;
        case UP:
        ny2-=vel;
        break;
        case RIGHT:
        nx2+=vel;
        break;
        case DOWN:
        ny2+=vel;
        break;
      }

      // check for deaths and draws
      var p1dead = false, p2dead = false;
      if (nx1 < 0 || nx1 > grid.width-1 || ny1 < 0 || ny1 > grid.height-1) {
        p1dead = true;
      }
      if (nx2 < 0 || nx2 > grid.width-1 || ny2 < 0 || ny2 > grid.height-1) {
        p2dead = true;
      }

      if (!p1dead) {
        if (grid.get(nx1, ny1) !== EMPTY) {
          p1dead = true;
        } else {
          var tail1 = player1.remove();
          grid.set(PLAYER1, tail1.x, tail1.y);
          tail1.x = nx1;
          tail1.y = ny1;
        }
      }

      if (!p2dead) {
        if (grid.get(nx2, ny2) !== EMPTY) {
          p2dead = true;
        } else {
          var tail2 = player2.remove();
          grid.set(PLAYER2, tail2.x, tail2.y);
          tail2.x = nx2;
          tail2.y = ny2;
        }
      }

      if (p1dead && p2dead) {
        return init();
      } else if (p1dead) {
        score.p2++;
        return init();
      } else if (p2dead) {
        score.p1++;
        return init();
      }

      grid.set(PLAYER1, tail1.x, tail1.y);
      grid.set(PLAYER2, tail2.x, tail2.y);

      player1.insert(tail1.x, tail1.y);
      player2.insert(tail2.x, tail2.y);
    }
  }

  function draw() {
    var tw = canvas.width/grid.width;
    var th = canvas.height/grid.height;


    for (var x = 0; x < grid.width; x++) {
      for (var y = 0; y < grid.height; y++) {
        switch (grid.get(x, y)) {
          case EMPTY:
          ctx.fillStyle = "#ccc";
          break;
          case PLAYER1:
          ctx.fillStyle = "#000";
          break;
          case PLAYER2:
          ctx.fillStyle = "#f00";
          break;
        }
        ctx.fillRect(x * tw, y * th, tw, th);
      }
    }
    // Show boosts and scores
    ctx.fillStyle = "#000";
    ctx.fillText(score.p1, 10, canvas.height-30);
    ctx.fillText("BOOST: " + player1.boost, 10, canvas.height-10);
    ctx.fillStyle = "#f00";
    ctx.fillText(score.p2, canvas.width-30, canvas.height-30);
    ctx.fillText("BOOST: " + player2.boost, canvas.width-137, canvas.height-10);
  }


  main();

})();