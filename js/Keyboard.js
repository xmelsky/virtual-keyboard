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
    // this.message = create('div', 'message');
    // this.overlay = create('div', 'overlay', this.message, this.container);
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
    this.container.onmousedown = this.generateCustomEvent;
    this.container.onmouseup = this.generateCustomEvent;
  }

  handleKeyUpEvent = ({ code }) => {
    const keyObj = this.keysPressed[code];
    delete this.keysPressed[code];
    if (keyObj) {
      keyObj.div.classList.remove('active');
      if (keyObj.isFnKey && keyObj.symbol === 'Shift') {
        this.switchUpperCase(false);
      }
    }
  }

  resetPressedButtons = (targetCode) => {
    console.log({targetCode});
    const pressed = Object.keys(this.keysPressed);
    clearTimeout(this.timeOut); clearInterval(this.interval);
    pressed.forEach((code) => {
      if (targetCode && targetCode === code && this.keysPressed[code].symbol === 'Shift') {
        this.shiftKey = false;
        this.switchUpperCase(false);
        this.keysPressed[code].div.classList.remove('active');
      } else if (code === targetCode) {
        this.keysPressed[code].div.classList.remove('active');
        delete this.keysPressed[code];
      }
      // this.keysPressed[code].div.removeEventListener('mouseleave', this.resetPressedButtons);
    });
  }

  handleKeyDownEvent = (e) => {
    const { code, ctrlKey, shiftKey } = e;

    this.output.focus();
    const keyObj = this.keyButtons.find((key) => key.code === code);
    if (keyObj) {
      if (keyObj.isFnKey && keyObj.symbol === 'Shift') this.shiftKey = true;

      if (keyObj.symbol === 'Shift') this.switchUpperCase(true);
      if ((keyObj.isFnKey && (shiftKey || this.shiftKey) && (ctrlKey || this.ctrlKey))) {
        this.switchLanguage();
      }

      const regexp = /Tab|ArrowLeft|ArrowUp|ArrowDown|ArrowRight|Delete|Backspace|Enter/i;
      if ((!keyObj.isFnKey && !ctrlKey) || keyObj.code.match(/Tab/) || (!e.type && keyObj.code.match(regexp))) {
        if (e.type) e.preventDefault();
        this.fireKeyPress(keyObj, (shiftKey || this.shiftKey) ? keyObj.shift : keyObj.symbol);
      }
      keyObj.div.classList.add('active');
      this.keysPressed[keyObj.code] = keyObj;
      if (!e.type) keyObj.div.addEventListener('mouseleave', this.resetButtonState, { once: true });
    }
  }

  resetButtonState = (e) => {
    console.log(e.target.dataset.code);
    this.resetPressedButtons(e.target.dataset.code);
  }

  switchLanguage = () => {
    const langAbbr = Object.keys(language);
    let langIdx = langAbbr.indexOf(this.container.dataset.language);
    this.keyBase = langIdx + 1 < langAbbr.length ? language[langAbbr[++langIdx]]
      : language[langAbbr[langIdx -= langIdx]];

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
          if (!button.isFnKey && !button.sub.value) button.letter.innerText = button.symbol;
        }
      });
    }
  }

  generateCustomEvent = (e) => {
    e.preventDefault();
    const keyDiv = e.target.closest('.keyboard__key');
    if (!keyDiv) return;
    const { dataset: { code } } = e.target.closest('.keyboard__key');

    if (e.type === 'mouseup') {
      console.log(this.keysPressed);
      if (!this.ctrlKey) this.ctrlKey = !!(code === 'Control');
      if (!this.shiftKey) this.shiftKey = !!(code === 'ShiftLeft' || code === 'ShiftRight');
      clearTimeout(this.timeOut); clearInterval(this.interval);
      this.handleKeyUpEvent({ code });
    } else {
      if (!this.ctrlKey) this.ctrlKey = (code === 'Control');
      if (!this.shiftKey) this.shiftKey = (code === 'ShiftLeft' || code === 'ShiftRight');
      this.timeOut = setTimeout(() => {
        this.interval = setInterval(() => {
          this.handleKeyDownEvent({ code });
        }, 35);
      }, 500);
      this.handleKeyDownEvent({ code });
    }
    this.output.focus();
  }

  fireKeyPress(keyObj, symbol) {
    let cursorPos = this.output.selectionStart;
    const left = this.output.value.slice(0, cursorPos);
    const right = this.output.value.slice(cursorPos);

    const textHandlers = {
      Tab: () => {
        this.output.value = `${left}\t${right}`;
        cursorPos++;
      },
      ArrowLeft: () => {
        cursorPos = cursorPos - 1 >= 0 ? cursorPos - 1 : 0;
      },
      ArrowRight: () => cursorPos++,
      ArrowUp: () => {
        const positionFromLeft = this.output.value.slice(0, cursorPos).match(/(\n).*$(?!\1)/g) || [[1]];
        cursorPos -= positionFromLeft[0].length;
      },
      ArrowDown: () => {
        const positionFromLeft = this.output.value.slice(cursorPos).match(/^.*(\n).*(?!\1)/) || [[1]];
        cursorPos += positionFromLeft[0].length + 1;
      },
      Enter: () => {
        this.output.value = `${left}\n${right}`;
        cursorPos++;
      },
      Delete: () => {
        this.output.value = `${left}${right.slice(1)}`;
      },
      Backspace: () => {
        this.output.value = `${left.slice(0, -1)}${right}`;
        cursorPos--;
      },
    };
    if (textHandlers[keyObj.code]) textHandlers[keyObj.code]();
    else if (!keyObj.isFnKey) {
      cursorPos += 1;
      this.output.value = `${left}${symbol || ''}${right}`;
    }
    this.output.setSelectionRange(cursorPos, cursorPos);
  }
}
