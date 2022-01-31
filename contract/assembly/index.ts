import { PersistentMap, context, logging } from 'near-sdk-as';
import { ReitToken, Token, TokenMetadata } from './reit-token';
import { User } from './user';

@nearBindgen
class NFTContractMetadata {
  constructor(
    public spec: string = 'reit-token-0.0.0', // required, essentially a version like "nft-1.0.0"
    public name: string = 'Reit Token', // required, ex. "Mochi Rising — Digital Edition" or "Metaverse 3"
    public symbol: string = 'REIT', // required, ex. "MOCHI"
    public icon: string = '', // Data URL
    public base_uri: string = '', // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
    public reference: string = '', // URL to a JSON file with more info
    public reference_hash: string = '' // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
  ) {}
}

@nearBindgen
export class Contract {
  private userMap: PersistentMap<string, User> = new PersistentMap<
    string,
    User
  >('users');

  setProfileImageSrc(profileImageSrc: string): string {
    const username = context.sender;
    const user: User = this.getOrInitUser(username);
    user.profileImageSrc = profileImageSrc;
    this.userMap.set(username, user);
    return profileImageSrc;
  }

  getProfileImageSrc(username: string): string {
    let profileImageSrc = '';
    if (this.userMap.contains(username)) {
      profileImageSrc = this.userMap.getSome(username).profileImageSrc;
    }
    return profileImageSrc;
  }

  private getOrInitUser(username: string): User {
    if (this.userMap.contains(username)) {
      return this.userMap.getSome(username);
    } else {
      assert(
        context.sender == context.predecessor,
        'Can only change own profile image'
      );
      const user = new User(username);
      this.userMap.set(username, user);
      return user;
    }
  }

  // nft testing

  //contract owner. Is this really needed?
  owner_id: string = context.contractName;

  //keeps track of all the token IDs for a given account
  tokens_per_owner: PersistentMap<string, Array<string>> = new PersistentMap<
    string,
    Array<string>
  >('tokens_pr_owner');

  //keeps track of the token struct for a given token ID
  tokens_by_id: PersistentMap<string, Token> = new PersistentMap<string, Token>(
    'tokens_by_id'
  );

  //keeps track of the token metadata for a given token ID
  token_metadata_by_id: PersistentMap<string, TokenMetadata> =
    new PersistentMap<string, TokenMetadata>('token_metadata_by_id');

  nft_tokens_for_owner(account_id: string): Array<Token> {
    const tokenIds: string[] = this.tokens_per_owner.getSome(account_id);

    const tokens: Array<Token> = new Array<Token>();
    for (let i = 0; i < tokenIds.length; ++i) {
      const token: Token = this.tokens_by_id.getSome(tokenIds[i]);
      tokens.push(token);
    }
    return tokens;
  }

  nft_metadata(): NFTContractMetadata {
    return new NFTContractMetadata();
  }

  nft_token(token_id: string): Token {
    return this.tokens_by_id.getSome(token_id);
  }

  // TODO (johnedvard) update rules. Everyone can change the description now, which is OK
  updateNftToken(token_id: string, description: string): Token {
    assert(
      this.tokens_by_id.contains(token_id),
      'token with given ID does not exist'
    );
    const token = this.tokens_by_id.getSome(token_id);
    token.metadata.description = description;
    this.tokens_by_id.set(token_id, token);
    return token;
  }

  nft_mint(
    token_id: string,
    metadata: TokenMetadata,
    receiver_id: string
  ): void {
    assert(
      !this.tokens_by_id.contains(token_id),
      'ID is already used, use another ID'
    );
    const token = new Token(token_id, metadata, receiver_id);
    const tokens: Array<string> = new Array<string>();
    tokens.push(token_id);
    this.tokens_per_owner.set(receiver_id, tokens);
    this.tokens_by_id.set(token_id, token);
    this.token_metadata_by_id.set(token_id, token.metadata);
  }

  // can take two additional parameters (approval_id: number, memo: string)
  nft_transfer(receiver_id: string, token_id: string): void {
    assert(
      this.tokens_by_id.contains(token_id),
      'Token does not exist. Cannot transfer'
    );
    assert(
      context.sender == context.predecessor,
      'Cannot be called by other contracts'
    );
    const token: Token = this.tokens_by_id.getSome(token_id);
    assert(
      token && token.owner_id == context.sender,
      'Can only transfer own token'
    );

    // transfer ownership
    token.owner_id = receiver_id;
    this.tokens_by_id.set(token_id, token);

    // Remove id from existing owner
    const oldOwnerTokenIds: Array<string> = this.tokens_per_owner.getSome(
      context.sender
    );
    let indexToRemove = -1;
    for (let i = 0; i < oldOwnerTokenIds.length; i++) {
      if (oldOwnerTokenIds[i] == token_id) {
        indexToRemove = i;
        break;
      }
    }
    oldOwnerTokenIds.splice(indexToRemove, 1);
    this.tokens_per_owner.set(context.sender, oldOwnerTokenIds);

    // Add id to new owner
    let newOwnerTokenIds = new Array<string>();
    if (this.tokens_per_owner.contains(receiver_id)) {
      newOwnerTokenIds = this.tokens_per_owner.getSome(receiver_id);
    }
    newOwnerTokenIds.push(token_id);
    this.tokens_per_owner.set(receiver_id, newOwnerTokenIds);
  }
}
