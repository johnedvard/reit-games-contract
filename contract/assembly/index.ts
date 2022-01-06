import { PersistentMap, context } from 'near-sdk-as';
import { User } from './user';

@nearBindgen
export class Contract {
  private userMap: PersistentMap<string, User> = new PersistentMap<
    string,
    User
  >('users');

  setProfileImageSrc(profileImageSrc: string): void {
    const username = context.sender;
    assert(context.sender == context.predecessor);
    const user: User = this.getOrInitUser(username);
    user.profileImageSrc = profileImageSrc;
    this.userMap.set(username, user);
  }

  getProfileImageSrc(username: string): string {
    return this.getOrInitUser(username).profileImageSrc;
  }

  private getOrInitUser(username: string): User {
    if (this.userMap.contains(username)) {
      return this.userMap.getSome(username);
    } else {
      const user = new User(username);
      this.userMap.set(username, user);
      return user;
    }
  }
}
