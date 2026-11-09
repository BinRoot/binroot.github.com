(function () {
  'use strict';

  var block = document.querySelector('.dice');
  if (!block) return;

  var source = block.textContent.replace(/\s+/g, ' ').trim();
  var branches = source.match(/^13\s*[–—-]\s*(.*?)\s+else\s*[–—-]\s*(.*)$/i);
  if (!branches) return;

  var successText = branches[1];
  var failureText = branches[2];
  block.replaceChildren();
  block.setAttribute('aria-label', 'Roll a physics-simulated twenty-sided die to determine Petrov’s response.');

  var stage = document.createElement('div');
  stage.className = 'dice-stage';
  stage.id = 'dice-stage';
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', 'A 3D d20 rolls across a dice tray.');

  var controls = document.createElement('div');
  controls.className = 'dice-controls';
  controls.innerHTML = '<button class="dice-roll-button" type="button">Roll for initiative</button>' +
    '<p class="dice-result"></p>';
  block.append(stage, controls);

  var button = controls.querySelector('.dice-roll-button');
  var result = controls.querySelector('.dice-result');
  var diceBox;
  var diceReady;

  function setResult(value) {
    var successful = value >= 13;
    result.dataset.kind = successful ? 'success' : 'failure';
    result.textContent = value + ': ' + (successful ? successText : failureText);
  }

  function dieValue(results) {
    var group = Array.isArray(results) ? results[0] : results;
    if (group && Array.isArray(group.rolls) && group.rolls[0]) {
      return group.rolls[0].value;
    }
    return group && (group.value !== undefined ? group.value : group.result);
  }

  function initializeDice() {
    if (diceReady) return diceReady;
    block.classList.add('is-showing-die');
    diceReady = new Promise(function (resolve) {
      window.requestAnimationFrame(resolve);
    }).then(function () {
      return import('./dice-box/dice-box.es.min.js');
    }).then(function (module) {
      var DiceBox = module.default;
      return new DiceBox({
        container: '#dice-stage',
        id: 'petrov-d20-canvas',
        assetPath: '/blog/2026-11/dice-box/assets/',
        themeColor: '#49365f',
        scale: 8,
        spinForce: 5,
        throwForce: 5,
        startingHeight: 7,
        offscreen: false,
        enableShadows: true
      }).init();
    }).then(function (box) {
      diceBox = box;
      return box;
    }).catch(function (error) {
      block.classList.remove('is-showing-die');
      diceReady = undefined;
      throw error;
    });
    return diceReady;
  }

  button.addEventListener('click', function () {
    if (button.disabled) return;
    button.disabled = true;
    block.classList.add('has-rolled');
    result.removeAttribute('data-kind');
    result.textContent = '';

    initializeDice().then(function (box) {
      return box.roll('1d20');
    }).then(function (rolls) {
      var value = dieValue(rolls);
      if (!Number.isInteger(value) || value < 1 || value > 20) {
        throw new Error('The 3D roller returned an invalid d20 result.');
      }
      setResult(value);
    }).catch(function (error) {
      console.error('The 3D d20 roll could not complete:', error);
      result.removeAttribute('data-kind');
      result.textContent = '';
    }).finally(function () {
      button.disabled = false;
    });
  });
})();
