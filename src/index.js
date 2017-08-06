import { $id } from './lib';
import { startGame } from './game';

$id('play').onclick = function () {
  if ($id('one').checked) {
    startGame([false, true, true, true]);
  } else if ($id('two').checked) {
    startGame([false, false, true, true]);
  } else if ($id('three').checked) {
    startGame([false, false, false, true]);
  } else {
    startGame([false, false, false, false]);
  }
  $id('game-mode-select').innerHTML = '';
};

$id('one').onclick = function () {
  $id('player2-info').style.visibility = 'hidden';
  $id('player3-info').style.visibility = 'hidden';
  $id('player4-info').style.visibility = 'hidden';
}

$id('two').onclick = function () {
  $id('player2-info').style.visibility = 'visible';
  $id('player3-info').style.visibility = 'hidden';
  $id('player4-info').style.visibility = 'hidden';
}

$id('three').onclick = function () {
  $id('player2-info').style.visibility = 'visible';
  $id('player3-info').style.visibility = 'visible';
  $id('player4-info').style.visibility = 'hidden';
}

$id('four').onclick = function () {
  $id('player2-info').style.visibility = 'visible';
  $id('player3-info').style.visibility = 'visible';
  $id('player4-info').style.visibility = 'visible';
}
