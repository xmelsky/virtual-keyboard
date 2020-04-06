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
    this.message = create('div', 'message');
    this.overlay = create('div', 'overlay', this.message, this.container );
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
    document.onvisibilitychange = this.resetPressedButtons;
  }

  showSplash(message) {
    this.message.innerText = message;
    this.message.classList.add('show-splash');
    this.overlay.classList.add('show');
    setTimeout(() => {
      this.message.classList.remove('show-splash');
      this.overlay.classList.remove('show');
    }, 2000);
  }


  handleKeyUpEvent = ({code}) => {
    const keyObj = this.keysPressed[code];
    delete this.keysPressed[code];
    if (keyObj) {
      keyObj.div.classList.remove('active');
      if (keyObj.isFnKey && keyObj.symbol === 'Shift') this.switchUpperCase(false);
    }
  }

  resetPressedButtons = () => {
    const pressed = Object.keys(this.keysPressed);
    pressed.forEach((code) => {
      this.keysPressed[code].div.classList.remove('active');
      delete this.keysPressed[code];
    })
  }

keepFocus() {
  const start = this.output.selectionStart;
  const end = this.output.selectionEnd;
  this.output.focus();
  // if (start !== end && this.output.setSelectionRange) {
  //   this.output.setSelectionRange(start, end);
  // } else if(start !== end && this.createTextRange) {
  //   const range = this.createTextRange();
  //   range.collapse(true);
  //   range.moveEnd('character', end);
  //   range.moveStart('character', start);
  //   range.select();
  // }
}

  handleKeyDownEvent = (e) => {
    const { code, ctrlKey, shiftKey, metaKey } = e;
    this.keepFocus();
    const keyObj = this.keyButtons.find((key) => key.code === code);
      if (keyObj) {
        if (keyObj.isFnKey && !keyObj.code.match(/ArrowLeft|ArrowUp|ArrowDown|ArrowRight|Delete|Backspace|Enter/i)
          || !keyObj.isFnKey && !ctrlKey || shiftKey && !keyObj.code.match(/ArrowLeft|ArrowUp|ArrowDown|ArrowRight/i)
        ) {
          e.preventDefault();
          this.fireKeyPress(keyObj, shiftKey ? keyObj.shift : keyObj.symbol);
        };
        if (keyObj.isFnKey && shiftKey) this.switchUpperCase(true);
        if (keyObj.isFnKey && shiftKey && ctrlKey
          || keyObj.isFnKey && ctrlKey && shiftKey) this.switchLanguage();
        keyObj.div.classList.add('active')
        this.keysPressed[keyObj.code] = keyObj;
      }
  }

  switchLanguage = () => {
    const langAbbr = Object.keys(language);
    let langIdx = langAbbr.indexOf( this.container.dataset.language );
    this.keyBase = langIdx + 1 <= langAbbr.length ? language[langAbbr[++langIdx]] : language[langAbbr[langIdx-=langIdx]];
    this.showSplash(`Switched language: ${langAbbr[langIdx][0].toUpperCase()}${langAbbr[langIdx].slice(1)}`)
  }

  subscribeToRelease = (e) => {
    // console.log(e.target);
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

  fireKeyPress(keyObj, symbol) {
    let cursorPos = this.output.selectionStart;
    const part1 = this.output.value.slice(0,cursorPos);
    const part2 = this.output.value.slice(cursorPos);

    console.log(cursorPos);
    const pressHandlers = {
      'Tab': () => {
        this.output.value = `${part1}    ${part2}`;
        cursorPos += 4;
      },
    }
    if (pressHandlers[keyObj.code]) {
      pressHandlers[keyObj.code]();
    } else if(!keyObj.isFnKey) {
      cursorPos += 1;
      this.output.value = `${part1}${symbol|| ''}${part2}`;
    }

    // this.output.focus();
    this.output.setSelectionRange(cursorPos, cursorPos);
  }
}
