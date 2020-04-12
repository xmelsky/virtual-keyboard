/* eslint-disable import/prefer-default-export */
export function set(name, value) {
  window.localStorage.setItem(name, JSON.stringify(value));
}

export function get(name, subst) {
  // Substitute value for JSON.parse if getItem failed
  return JSON.parse(window.localStorage.getItem(name) || subst);
}

export function del(name) {
  localStorage.removeItem(name);
}
