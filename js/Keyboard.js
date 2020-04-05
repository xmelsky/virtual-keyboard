/* eslint-disable import/extensions */
import * as storage from './Storage.js';
import create from './utils/create.js';
import language from './layouts/index.js';
import Key from './Key.js';

const main = create('main', '', create('h1', 'title', 'RSS Virtual Keyboard'));

export default class Keyboard {
  constructor(rowsOrder) {
    this.rowsOrder = rowsOrder;
    this.keysPressed = {};

  }

  init(code) {
    this.keyBase = language[code];
    this.output = create('textarea', 'output', null, main,
      ['placeholder', 'Start typing something... ;)'],
      ['rows', 5],
      ['cols', 50]);
    this.container = create('div', 'keyboard', null, main, ['language', code]);
    document.body.prepend(main);
    return this;
  }

  generateLayout() {
    this.keyButtons = [];
    if (!this.rowsOrder.length) throw Error('Can\'t generate layout! Check buttons layout template!');

    this.rowsOrder.forEach((row, i) => {
      const rowElement = create('div', 'keyboard__row', null, this.container, ['row', i + 1]);
      rowElement.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`;
      row.forEach((code) => {
        const keyObj = this.keyBase.find((key) => key.code === code);
        if (keyObj) {
          const keyButton = new Key(keyObj);
          this.keyButtons.push(keyButton);
          rowElement.appendChild(keyButton.div);
        }
      });
    });
    document.onkeydown = this.handleKeyDownEvent;
    document.onkeyup = this.handleKeyUpEvent;
  }



  handleKeyUpEvent = ({code}) => {
    console.log(this.keysPressed[code]);
    const keyObj = this.keysPressed[code];
    if (keyObj) {
      keyObj.div.classList.remove('active');
      if (keyObj.isFnKey && keyObj.symbol === 'Shift') this.switchUpperCase(false);
    }
  }

  handleKeyDownEvent = ({ code }) => {
    this.output.focus();
    const keyObj = this.keyButtons.find((key) => key.code === code);
        if (keyObj) {
          if (keyObj.isFnKey && keyObj.symbol === 'Shift') this.switchUpperCase(true);
          console.log(keyObj);

          keyObj.div.classList.add('active')
          this.keysPressed[keyObj.code] = keyObj;
          console.log(this.keysPressed);
          // this.keysPressed.forEach((button) => button.container.classList.add('active'));
        }
  }

  subscribeToRelease = (e) => {
    console.log(e.target);
  }

  switchUpperCase(isTrue) {
    if (isTrue) {
      this.keyButtons.forEach((button) => {
        if (button.sub) {
          button.sub.classList.add('sub-active');
          button.letter.classList.add('sub-inactive');
        } else if (!button.isFnKey){
          button.letter.innerText = button.shift;
        }
      })
    } else {
      this.keyButtons.forEach((button) => {
        if (button.sub) {
          button.sub.classList.remove('sub-active');
          button.letter.classList.remove('sub-inactive');
        } else if (!button.isFnKey){
          button.letter.innerText = button.symbol;
        }
      })
    }
  }
}
