@nearBindgen
export class User {
  private _profileImageSrc: string = '';
  private _username: string = '';
  constructor(username: string) {
    this._username = username;
  }

  set profileImageSrc(value: string) {
    this._profileImageSrc = value;
  }

  get profileImageSrc(): string {
    return this._profileImageSrc;
  }
}
