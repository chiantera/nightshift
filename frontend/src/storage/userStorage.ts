let _userId = 'anon';

export function setStorageUser(id: string): void {
  _userId = id || 'anon';
}

export function userKey(key: string): string {
  return `spr:${_userId}:${key}`;
}
