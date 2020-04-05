/* eslint-disable import/extensions */
import create from './utils/create.js';

export default class Key {
  constructor({
    code, shift, symbol, keycode,
  }) {
    this.code = code;
    this.shift = shift;
    this.symbol = symbol;
    this.keycode = keycode;
    this.isFnKey = symbol === code;
    if (shift && shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/g)) {
      this.sub = create('div', 'sub', this.shift);
    }
    this.letter = create('div', 'letter', symbol);
    this.container = create('div', 'keyboard__key', this.sub ? [this.sub, this.letter] : this.letter);
  }
}
