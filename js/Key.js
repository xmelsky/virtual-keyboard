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
    this.isFnKey = Boolean(symbol === 'Ctrl' || code.indexOf(symbol.slice(1) || false) + 1);
    if (shift && shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/g)) {
      this.sub = create('div', 'sub', this.shift);
    } else {
      this.sub = create('div', 'sub', '');
    }
    this.letter = create('div', 'letter', symbol);
    this.div = create('div', 'keyboard__key', this.sub ? [this.sub, this.letter] : this.letter, null, ['code', this.code], this.isFnKey ? ['fn', 'true'] : ['fn', 'false']);
  }
}
