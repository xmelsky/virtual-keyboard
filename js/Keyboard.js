/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable import/extensions */
import * as storage from './Storage.js';
import create from './utils/create.js';
import language from './layouts/index.js';
import Key from './Key.js';

const main = create('main', '',
  [create('h1', 'title', 'RSS Virtual Keyboard'),
    create('h3', 'subtitle', 'Windows keyboard that has been made under Linux'),
    create('p', 'hint', 'Use left <kbd>Ctrl</kbd> + <kbd>Alt</kbd> to switch language. Last language saves in localStorage')]);

export default class Keyboard {
  constructor(rowsOrder) {
    this.rowsOrder = rowsOrder;
    this.keysPressed = {};
    this.isCaps = false;
  }

  init(code) {
    this.keyBase = language[code];
    this.output = create('textarea', 'output', null, main,
      ['placeholder', 'Start type something... ;)'],
      ['rows', 5],
      ['cols', 50],
      ['spellcheck', false],
      ['autocorrect', 'off']);
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
    this.container.onmousedown = this.generateCustomEvent;
    this.container.onmouseup = this.generateCustomEvent;
  }

  handleKeyUpEvent = ({ code }) => {
    const keyObj = this.keysPressed[code];
    delete this.keysPressed[code];
    if (keyObj) {
      if (!keyObj.code.match(/Caps/) || (keyObj.code.match(/Caps/) && !this.isCaps)) {
        keyObj.div.classList.remove('active');
      }
      if (keyObj.isFnKey && keyObj.small === 'Shift' && !this.isCaps) {
        this.switchUpperCase(false);
      } else if (keyObj.isFnKey && keyObj.small === 'Shift' && this.isCaps) {
        this.shiftKey = false;
        this.switchUpperCase(false, true);
      }
    }
  }

  resetPressedButtons = (targetCode) => {
    const pressed = Object.keys(this.keysPressed);
    clearTimeout(this.timeOut); clearInterval(this.interval);
    pressed.forEach((code) => {
      if (targetCode && targetCode === code && this.keysPressed[code].small === 'Shift') {
        this.shiftKey = false;
        this.switchUpperCase(false);
        delete this.keysPressed[code];
        if (this.keysPressed[code]) this.keysPressed[code].div.classList.remove('active');
      } else if (code === targetCode || code.match(/Alt/)) {
        this.keysPressed[code].div.classList.remove('active');
        delete this.keysPressed[code];
      }
    });
  }

  handleKeyDownEvent = (e) => {
    const { code, ctrlKey, shiftKey } = e;
    this.output.focus();
    const keyObj = this.keyButtons.find((key) => key.code === code);
    if (keyObj) {
      if (!e.type && keyObj.isFnKey && keyObj.small === 'Shift') this.shiftKey = true;
      if (e.type && keyObj.isFnKey && keyObj.small === 'Shift') this.shiftKey = true;
      if (keyObj.small === 'Shift') this.switchUpperCase(true, shiftKey || this.shiftKey);

      if (keyObj.code.match(/Caps/) && !this.isCaps) {
        this.isCaps = true;
        this.switchUpperCase(true);
      } else if (keyObj.code.match(/Caps/) && this.isCaps && !e.repeat) {
        this.isCaps = false;
        this.switchUpperCase(false);
      }
      if (!e.type && keyObj.code.match(/Control/) && keyObj.isFnKey) this.ctrlKey = true;
      if (keyObj.code.match(/Alt/g) && (ctrlKey || this.ctrlKey)) {
        if (e.type) e.preventDefault();
        this.switchLanguage();
      }

      const regexp = /Tab|ArrowLeft|ArrowUp|ArrowDown|ArrowRight|Delete|Backspace|Enter/i;
      if ((!keyObj.isFnKey && !ctrlKey) || keyObj.code.match(/Tab|Alt/) || (!e.type && keyObj.code.match(regexp))) {
        if (e.type) e.preventDefault();
        this.fireKeyPress(keyObj,
          ((shiftKey && !this.isCaps)
          || (this.shiftKey && !this.isCaps)
          || ((shiftKey || this.shiftKey) && this.isCaps && keyObj.sub.innerText)
          || (this.isCaps && !keyObj.sub.innerText)
          || (this.isCaps && (this.shiftKey || shiftKey) && keyObj.sub.innerText))
            ? keyObj.shift : keyObj.small);
      }
      keyObj.div.classList.add('active');
      this.keysPressed[keyObj.code] = keyObj;
      if (!e.type) keyObj.div.addEventListener('mouseleave', this.resetButtonState, { once: true });
    }
  }

  resetButtonState = (e) => {
    this.resetPressedButtons(e.target.dataset.code);
  }

  switchLanguage = () => {
    const langAbbr = Object.keys(language);
    let langIdx = langAbbr.indexOf(this.container.dataset.language);
    this.keyBase = langIdx + 1 < langAbbr.length ? language[langAbbr[++langIdx]]
      : language[langAbbr[langIdx -= langIdx]];

    this.container.dataset.language = langAbbr[langIdx];
    storage.set('kbLang', langAbbr[langIdx]);

    this.keyButtons.forEach((button) => {
      const keyObj = this.keyBase.find((key) => key.code === button.code);
      if (!keyObj) return;
      button.shift = keyObj.shift;
      button.small = keyObj.small;
      if (keyObj.shift && keyObj.shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/g)) {
        button.sub.innerHTML = keyObj.shift;
      } else {
        button.sub.innerHTML = '';
      }
      button.letter.innerHTML = keyObj.small;
      if (!button.isFnKey) button.letter.classList.toggle('changed');
    });
    if (this.isCaps) this.switchUpperCase(true);
  }

  switchUpperCase(isTrue, isShiftKey) {
    if (isTrue) {
      if (!this.isCaps) this.shiftKey = true;
      this.keyButtons.forEach((button) => {
        if (button.sub) {
          if (!this.isCaps || (this.isCaps && isShiftKey)) button.sub.classList.add('sub-active');
          if (!this.isCaps || (this.isCaps && isShiftKey)) button.letter.classList.add('sub-inactive');
          if (!button.isFnKey && button.shift && button.shift.match(/[a-zA-Zа-яА-ЯёЁ0-9]/i)) {
            button.letter.innerHTML = button.shift;
          }
        }
      });
    } else {
      this.shiftKey = false;
      this.keyButtons.forEach((button) => {
        if (button.sub) {
          button.sub.classList.remove('sub-active');
          button.letter.classList.remove('sub-inactive');
          if (!button.isFnKey && !button.sub.value && !this.isCaps) {
            button.letter.innerHTML = button.small;
          }
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
      if (!this.shiftKey) this.shiftKey = !!(code === 'ShiftLeft' || code === 'ShiftRight');
      if (code.match(/Control/)) this.ctrlKey = false;
      clearTimeout(this.timeOut); clearInterval(this.interval);
      this.handleKeyUpEvent({ code });
    } else {
      if (!this.shiftKey) this.shiftKey = (code === 'ShiftLeft' || code === 'ShiftRight');
      if (!code.match(/Alt|Caps|Control/)) {
        this.timeOut = setTimeout(() => {
          this.interval = setInterval(() => {
            this.handleKeyDownEvent({ code });
          }, 35);
        }, 500);
      }
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
      Space: () => {
        this.output.value = `${left} ${right}`;
        cursorPos += 1;
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
