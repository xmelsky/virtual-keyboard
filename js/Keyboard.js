/* eslint-disable dot-notation */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable import/extensions */
// import * as storage from './Storage.js';
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
      ['placeholder', 'Start type something... ;)'],
      ['rows', 5],
      ['cols', 50]);
    this.container = create('div', 'keyboard', null, main, ['language', code]);
    this.message = create('div', 'message');
    this.overlay = create('div', 'overlay', this.message, this.container);
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
    this.container.onmousedown = this.generateCustomEvent;
    this.container.onmouseup = this.generateCustomEvent;
    // this.container.onmouseleave = this.resetPressedButtons;
  }

  showSplash(message) {
    this.message.innerText = message;
    this.message.classList.add('show-splash');
    this.overlay.classList.add('show');
    setTimeout(() => {
      this.message.classList.remove('show-splash');
      this.overlay.classList.remove('show');
    }, 1000);
  }


  handleKeyUpEvent = (e) => {
    console.log('keyUP');
    const { code } = e;
    const keyObj = this.keysPressed[code];
    delete this.keysPressed[code];
    if (keyObj) {
      keyObj.div.classList.remove('active');
      if (keyObj.isFnKey && keyObj.symbol === 'Shift') {
        this.switchUpperCase(false);
      }
    }
  }

  resetPressedButtons = () => {
    const pressed = Object.keys(this.keysPressed);
    pressed.forEach((code) => {
      this.keysPressed[code].div.classList.remove('active');
      delete this.keysPressed[code];
    });
  }

  keepFocus() {
    this.output.focus();
  }

  handleKeyDownEvent = (e) => {
    const { code, ctrlKey, shiftKey } = e;

    this.keepFocus();
    const keyObj = this.keyButtons.find((key) => key.code === code);
    if (keyObj) {
      if (keyObj.isFnKey && keyObj.symbol === 'Shift') {
        this.shiftKey = true;
      }

      if (
        (keyObj.isFnKey
          && !keyObj.code.match(/ArrowLeft|ArrowUp|ArrowDown|ArrowRight|Delete|Backspace|Enter/i))
        || (!keyObj.isFnKey && !ctrlKey)
        || ((shiftKey || this.ctrlKey) && !keyObj.code.match(/ArrowLeft|ArrowUp|ArrowDown|ArrowRight/i))
      ) {
        if (e.type) e.preventDefault();
        this.fireKeyPress(keyObj, (shiftKey || this.shiftKey) ? keyObj.shift : keyObj.symbol);
      } else if (!e.type && keyObj.code.match(/ArrowLeft|ArrowUp|ArrowDown|ArrowRight|Enter|Backspace|Delete/i)) {
        this.fireKeyPress(keyObj, (shiftKey || this.shiftKey) ? keyObj.shift : keyObj.symbol);
      }


      if (keyObj.isFnKey && (shiftKey || this.shiftKey) && keyObj.symbol === 'Shift') this.switchUpperCase(true);
      if ((keyObj.isFnKey && (shiftKey || this.shiftKey) && (ctrlKey || this.ctrlKey))) this.switchLanguage();

      keyObj.div.classList.add('active');
      this.keysPressed[keyObj.code || keyObj.codeCustom] = keyObj;
    }
  }

  switchLanguage = () => {
    const langAbbr = Object.keys(language);
    let langIdx = langAbbr.indexOf(this.container.dataset.language);
    this.keyBase = langIdx + 1 < langAbbr.length ? language[langAbbr[++langIdx]]
      : language[langAbbr[langIdx -= langIdx]];

    this.showSplash(`Switched language: ${langAbbr[langIdx][0].toUpperCase()}${langAbbr[langIdx].slice(1)}`);

    this.container.dataset.language = langAbbr[langIdx];
    this.keyButtons.forEach((button) => {
      const keyObj = this.keyBase.find((key) => key.code === button.code);
      if (!keyObj) return;
      button.shift = keyObj.shift;
      button.symbol = keyObj.symbol;
      if (keyObj.shift && keyObj.shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/g)) {
        button.sub.innerText = keyObj.shift;
      } else {
        button.sub.innerText = '';
      }
      button.letter.innerText = keyObj.symbol;
    });
  }

  switchUpperCase(isTrue) {
    if (isTrue) {
      this.shiftKey = true;
      this.keyButtons.forEach((button) => {
        if (button.sub) {
          button.sub.classList.add('sub-active');
          button.letter.classList.add('sub-inactive');
          if (!button.isFnKey && button.shift && button.shift.match(/[a-zA-Zа-яА-ЯёЁ0-9]/i)) {
            button.letter.innerText = button.shift;
          }
        }
      });
    } else {
      this.shiftKey = false;
      this.keyButtons.forEach((button) => {
        if (button.sub) {
          button.sub.classList.remove('sub-active');
          button.letter.classList.remove('sub-inactive');
          if (!button.isFnKey && !button.sub.value) {
            button.letter.innerText = button.symbol;
          }
        }
      });
    }
  }

  generateCustomEvent = (e) => {
    e.preventDefault();
    this.output.focus();
    const keyDiv = e.target.closest('.keyboard__key');
    if (!keyDiv) return;
    const { dataset: { code } } = e.target.closest('.keyboard__key');

    if (e.type === 'mouseup') {
      this.ctrlKey = !!(code === 'Control');
      if (!this.shiftKey) this.shiftKey = !!(code === 'ShiftLeft' || code === 'ShiftRight');
      this.handleKeyUpEvent({ code });
    } else {
      this.ctrlKey = (code === 'Control');
      if (!this.shiftKey) this.shiftKey = (code === 'ShiftLeft' || code === 'ShiftRight');
      this.handleKeyDownEvent({ code });
    }

    this.output.focus();
  }

  fireKeyPress(keyObj, symbol) {
    let cursorPos = this.output.selectionStart;
    const part1 = this.output.value.slice(0, cursorPos);
    const part2 = this.output.value.slice(cursorPos);

    const pressHandlers = {
      Tab: () => {
        this.output.value = `${part1}    ${part2}`;
        cursorPos += 4;
      },
      ArrowLeft: () => {
        cursorPos = cursorPos - 1 >= 0 ? cursorPos - 1 : 0;
      },
      ArrowRight: () => {
        cursorPos++;
      },
      ArrowUp: () => {
        const positionFromLeft = this.output.value.slice(0, cursorPos).match(/(\n).*$(?!\1)/g) || [[1]];
        cursorPos -= positionFromLeft[0].length;
      },
      ArrowDown: () => {
        const positionFromLeft = this.output.value.slice(cursorPos).match(/^.*(\n).*(?!\1)/) || [[1]];
        cursorPos += positionFromLeft[0].length + 1;
      },
      Enter: () => {
        this.output.value = `${part1}\n${part2}`;
        cursorPos++;
      },
    };
    if (pressHandlers[keyObj.code]) {
      pressHandlers[keyObj.code]();
    } else if (!keyObj.isFnKey) {
      cursorPos += 1;
      this.output.value = `${part1}${symbol || ''}${part2}`;
    }

    this.output.setSelectionRange(cursorPos, cursorPos);
  }
}
